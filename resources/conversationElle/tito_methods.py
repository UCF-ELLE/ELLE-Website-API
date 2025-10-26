import os
import subprocess
from pathlib import Path
from db_utils import *
from config import USER_VOICE_FOLDER
from datetime import datetime

db = DBHelper(mysql)

# Useful for the some SQL returns 
def flatten_list(input: list):
    res = []
    for x in input:
        res.append(x[0])
    return res

def addNewTitoModule(module_id, class_id):
    res = db.get("SELECT EXISTS(SELECT * FROM tito_module WHERE moduleID = %s AND classID = %s);", (module_id, class_id), fetchOne=True)
    if res and res[0]:
        return False

    db.post("INSERT IGNORE INTO tito_module (moduleID, classID) VALUES (%s, %s);", (module_id, class_id))
    # 1. Get ALL users assigned to class (even non students)
    users = db.get("SELECT DISTINCT userID FROM group_user WHERE groupID = %s;", (class_id,))

    # 2. Create tito_module_progress for all users
    module_user_pair = [(module_id, user) for user in users]
    db.post("INSERT IGNORE INTO tito_module_progress (moduleID, userID) VALUES (%s, %s);", module_user_pair)

    # 3. Get all termIDs for this module
    term_ids = db.get(
        '''
            SELECT DISTINCT t.termID
            FROM (
                SELECT DISTINCT questionID, moduleID
                FROM module_question
                WHERE moduleID = %s
            ) mq
            JOIN answer a ON mq.questionID = a.questionID
            JOIN term t ON a.termID = t.termID
            WHERE mq.moduleID = %s;
        ''', (module_id, module_id)
    )

    # term_ids = flatten_list(term_ids)
    print(f"term ids: {term_ids}")

    # 4. Insert into tito_term_progress
    term_progress_data = [(user, module_id, term_id) for term_id in term_ids for user in users]
    res = db.post("INSERT IGNORE INTO tito_term_progress (userID, moduleID, termID) VALUES (%s, %s, %s);", term_progress_data)
    return False if not res or res.get("rowcount", 0) == 0 else True

def activate_tito_from_existing_sessions():
    # 1. Fetch all module-user pairs from existing chatbot_sessions
    sessions = db.get('''
        SELECT DISTINCT moduleID, userID
        FROM chatbot_sessions;
    ''')

    processed_pairs = set()

    for module_id, user_id in sessions:
        # 2. Find all classes where this user is assigned AND the module is part of the class
        class_ids = db.get('''
            SELECT gm.groupID
            FROM group_module gm
            JOIN group_user gu 
                ON gu.groupID = gm.groupID
            WHERE gm.moduleID = %s AND gu.userID = %s;
        ''', (module_id, user_id))

        for (class_id,) in class_ids:
            # 3. Ensure Tito module exists
            x = addNewTitoModule(module_id, class_id)
            if x:
                processed_pairs.add((class_id, module_id))
                print(f'x is {x} and {class_id} and {module_id}')

    # Return list of unique (classID, moduleID) pairs
    return list(processed_pairs)

def addTitoClassStatus():
    query = '''
        SELECT DISTINCT classID
        FROM tito_module;
    '''

    res = db.get(query)
    if not res:
        return
    
    for class_id in res:
        query = '''
            SELECT DISTINCT userID
            FROM group_user
            WHERE groupID = %s AND accessLevel = 'pf';
        '''

        user_ids = db.get(query, (class_id[0],))
        if not user_ids:
            continue
        query = '''
            INSERT IGNORE INTO tito_class_status (classID, professorID, titoExpirationDate)
            VALUES (%s, %s, DATE_ADD(CURDATE(), INTERVAL 12 MONTH));
        '''
        insert_data = [(class_id[0], user_id[0]) for user_id in user_ids]
        res2 = db.post(query, insert_data)
        if not res2:
            print(f"failed to insert titoclass {insert_data}")

def createNewUserMessageTEST(userID: int, moduleID: int, chatbotSID: int, message: str, isVM: bool, source='user', timedateCreated='', dateCreated=''):
    try: 
        query = '''
            INSERT IGNORE INTO `messages` (userID, chatbotSID, moduleID, source, message, isVoiceMessage, creationTimestamp, creationDate)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
        '''

        res = db.post(query, (userID, chatbotSID, moduleID, source, message, isVM, timedateCreated, dateCreated))
        if not res or not res.get('rowcount', 0):
            return 1
        return 0
    except Exception as e:
        print(f"[ERROR] Exception has occured when trying to insert message @ createNewUserMessage in database.py. Error: {e}")
        return 0

def insertOldMessages():
    query = '''
        SELECT `userId`, `chatbotId`, `moduleId`, `source`, `value`, `timestamp`
        FROM `messages_old`
        ORDER BY id
        ASC;
    '''

    res = db.get(query)
    if not res:
        print('failed to get old messages')
        return
    
    count = 0
    for uid, sid, mid, src, msg, time in res:
        date = time.date()
        res = createNewUserMessageTEST(userID=uid, moduleID=mid, chatbotSID=sid, message=msg, isVM=False, source=src, timedateCreated=time, dateCreated=date)
        if res:
            count += 1

    
    print(f'final count of msg not added: {count}')
    return

def migrateChatbotSessionsTable():
    rows = db.get('''
        SELECT chatbotId, userId, moduleId, totalTimeChatted, totalWordsForModule, timestamp
        FROM chatbot_sessions_old
        ORDER BY chatbotId ASC;
    ''')

    for row in rows:
        db.post('''
            INSERT IGNORE INTO `chatbot_sessions`
            (chatbotSID, userID, moduleID, timeChatted, moduleWordsUsed, creationTimestamp)
            VALUES (%s, %s, %s, %s, %s, %s);
        ''', row)


def updateLiveDB():
    migrateChatbotSessionsTable()
    res = activate_tito_from_existing_sessions()
    if not res:
        return []
    addTitoClassStatus()
    insertOldMessages()

    return res


def merge_user_audio(class_id: int, module_id: int, user_id: int):
    '''
        Merge all {userID}_{messageID}.webm files for a given user into one .webm file.
        Looks inside: user_audio_files/{class_id}/{module_id}/{user_id}/
    '''

    base_dir = Path(USER_VOICE_FOLDER) / str(class_id) / str(module_id) / str(user_id)
    if not base_dir.exists():
        return None
        # raise FileNotFoundError(f"Audio directory not found: {base_dir}")

    # sort all files by messageID
    files = sorted(
        base_dir.glob(f"{user_id}_*.webm"),
        key=lambda f: int(f.stem.split("_")[1])  # extract messageID part
    )

    if not files:
        return None
        # raise FileNotFoundError(f"No .webm files found for user {user_id} in {base_dir}")

    # Create temporary list file for ffmpeg
    concat_list = base_dir / "concat_list.txt"
    with open(concat_list, "w") as f:
        for file in files:
            f.write(f"file '{file.resolve()}'\n")

    output_file = base_dir / f"{user_id}.webm"

    # ffmpeg concat files
    cmd = [
        "ffmpeg",
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_list),
        "-c", "copy",
        str(output_file)
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        print("ffmpeg failed:", e.stderr.decode())
        raise
    finally:
        concat_list.unlink(missing_ok=True)  # rm tmp file

    return output_file
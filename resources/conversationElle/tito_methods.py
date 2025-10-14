from db_utils import *

db = DBHelper(mysql)

def flatten_list(input: list):
    res = []
    for x in input:
        res.append(x[0])
    return res

def addNewTitoModule(module_id, class_id):
    res = db.get("SELECT EXISTS(SELECT * FROM tito_module WHERE moduleID = %s AND classID = %s);", (module_id, class_id), fetchOne=True)
    if res:
        if res[0]:
            return 0
    else:
        return 0

    print(res[0])
    print(f'adding tito_module to mod:class {module_id}, {class_id}')

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

    # 4. Insert into tito_term_progress
    term_progress_data = [(user, module_id, term_id) for term_id in term_ids for user in users]
    # for a, b, c in term_progress_data:
        # print(f'{a} to {b} to {c}')
    # print("added titoModule")
    # print(term_progress_data)
    db.post("INSERT IGNORE INTO tito_term_progress (userID, moduleID, termID) VALUES (%s, %s, %s);", term_progress_data)
    return 

def activate_tito_from_existing_sessions():
    # 1. Fetch all module-user pairs from existing chatbot_sessions
    sessions = db.get("""
        SELECT DISTINCT moduleID, userID
        FROM chatbot_sessions;
    """)

    print(sessions)
    processed_pairs = set()

    for module_id, user_id in sessions:
        # 2. Find all classes where this user is assigned AND the module is part of the class
        class_ids = db.get("""
            SELECT gm.groupID
            FROM group_module gm
            JOIN group_user gu 
                ON gu.groupID = gm.groupID
            WHERE gm.moduleID = %s AND gu.userID = %s;
        """, (module_id, user_id))

        for (class_id,) in class_ids:
            # 3. Ensure Tito module exists
            x = addNewTitoModule(module_id, class_id)
            if not x:
                print(f'{class_id} and {module_id}')
                processed_pairs.add((class_id, module_id))

    # Return list of unique (classID, moduleID) pairs
    print(processed_pairs)
    return list(processed_pairs)

def addTitoClassStatus():
    query = '''
        SELECT DISTINCT classID
        FROM tito_module;
    '''

    res = db.get(query)
    if not res:
        return
    
    for x in res:
        query = '''
            SELECT DISTINCT userID
            FROM group_user
            WHERE groupID = %s AND accessLevel = 'pf';
        '''

        res = db.get(query, (x[0],))
        if not res:
            continue
        query = '''
            INSERT IGNORE INTO tito_class_status (classID, professorID, titoExpirationDate)
            VALUES (%s, %s, DATE_ADD(CURDATE(), INTERVAL 12 MONTH));
        '''
        insert_data = [(x[0], y[0]) for y in res]
        res = db.post(query, insert_data)
        if not res:
            print(f"failed to insert titoclass {insert_data}")

def createNewUserMessageTEST(userID: int, moduleID: int, chatbotSID: int, message: str, isVM: bool, source='user', dateCreated=''):
    try: 
        query = '''
            INSERT IGNORE INTO `messages` (userID, chatbotSID, moduleID, source, message, isVoiceMessage, creationTimestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s);
        '''

        db.post(query, (userID, chatbotSID, moduleID, source, message, isVM, dateCreated))
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
    for uid, sid, mid, src, msg, time in res:
        createNewUserMessageTEST(userID=uid, moduleID=mid, chatbotSID=sid, message=msg, isVM=False, source=src, dateCreated=time)

    return

def updateLiveDB():
    res = activate_tito_from_existing_sessions()
    if not res:
        return []
    addTitoClassStatus()
    insertOldMessages()

    return res
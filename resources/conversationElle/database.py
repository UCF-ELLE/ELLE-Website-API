from db import mysql
from db_utils import *
from utils import *
from exceptions_util import *
from datetime import datetime
import json
from config import PERMISSION_GROUPS
from flask_jwt_extended import get_jwt_claims
from .tito_methods import flatten_list


db = DBHelper(mysql)


# Updates how long a user has been chatting in the current session
# TODO: check if creationTimestamp used is keyword or column AND consider a trigger
def updateTotalTimeChatted(chatbotSID):
    query = '''
        UPDATE `chatbot_sessions_old`
        SET `totalTimeChatted` = TIMESTAMPDIFF(SECOND, timestamp, NOW()) / 60
        WHERE `chatbotId` = %s;
    '''

    db.post(query, (chatbotSID,))



# ================================================
#
# conversaitionelle pt 2
#
# ================================================

# ================================================
#
# Session Logic
#
# ================================================

# OLD:Revoke any existing and all instances of chatbot sessions & create new session for this user
# CURRENT: Creates new chatbot_session and returns the sessionID
def createChatbotSession(userID: int, moduleID: int):
    # Since messages table references chatbot_sessions_old, we need to use that table
    # Include all required columns to avoid constraint violations
    
    query = '''
        INSERT INTO `chatbot_sessions_old` (`userId`, `moduleId`, `termsUsed`, `totalTimeChatted`, `timestamp`)
        VALUES (%s, %s, %s, %s, NOW());
    '''
    
    # Initialize with empty termsUsed JSON and 0 time chatted
    termsUsed = '{}'
    totalTimeChatted = 0

    res = db.post(query, (userID, moduleID, termsUsed, totalTimeChatted))
    return res["lastrowid"] # the chatbotId

# Self-explanatory (F = inactive/invalid sesh, T = active sesh)
# TODO: Check logic, test with existing but expired, current and existing nonE, and future nonExist
def isValidChatbotSession(userID: int, moduleID: int, chatbotSID: int):
    query = '''
        SELECT EXISTS(
            SELECT chatbotId 
            FROM `chatbot_sessions_old` 
            WHERE chatbotId = %s AND userId = %s AND moduleId = %s
        );
    '''
    
    res = db.get(query, (chatbotSID, userID, moduleID), fetchOne=True)
    if not res or not res[0]:
        return False
    return True

def userIsNotAStudent(user_id:int, class_id: int):
    query = '''
        SELECT EXISTS(
            SELECT userID
            FROM group_user
            WHERE userID = %s AND groupID = %s AND accessLevel != 'st'
        );
    '''
    res = db.get(query, (user_id, class_id), fetchOne=True)
    if not res or not res[0]:
        return False
    return True



# ================================================
#
# Group-Related
#
# ================================================

# Returns a list of group_ids assigned to a user of ACTIVE TITO CLASSES
# st == all enrolled classes
# pf == all owned classes
# pf may get either all tito classes or just currently active tito classes
def getTitoClasses(userID: int, permissionLevel: str, get_classes_type='all'):
    query = ''
    # Professors can retrieve active, inactive or both classes 
    if permissionLevel == 'pf':
        if get_classes_type == 'active':
            query = '''
                SELECT DISTINCT classID
                FROM tito_class_status
                WHERE professorID = %s AND titoStatus = 'active';
            '''
        elif get_classes_type == 'all':
            query = '''
                SELECT DISTINCT classID
                FROM tito_class_status
                WHERE professorID = %s;
            '''
        else:
            query = '''
                SELECT DISTINCT classID
                FROM tito_class_status
                WHERE professorID = %s AND titoStatus = 'inactive';
            '''
        return flatten_list(db.get(query, (userID,)))
    # Otherwise, retrieves gets ACTIVE classes assigned to a TWT user
    elif permissionLevel == 'st':
        query = '''
            SELECT g.groupID
            FROM (
                SELECT DISTINCT gu.groupID
                FROM group_user gu
                WHERE gu.userID = %s AND gu.accessLevel = %s
            ) g
            JOIN tito_class_status gs ON g.groupID = gs.classID
            WHERE gs.titoStatus = 'active';
        '''
        return flatten_list(db.get(query, (userID, permissionLevel)))
    # Like the first if statement, but for general users
    elif permissionLevel == 'any':
        if get_classes_type == 'all':
            query = '''
                SELECT DISTINCT g.groupID
                FROM (
                    SELECT DISTINCT gu.groupID
                    FROM group_user gu
                    WHERE gu.userID = %s
                ) g
                JOIN tito_class_status gs ON g.groupID = gs.classID
            '''
        elif get_classes_type == 'inactive':
            query = '''
                SELECT DISTINCT g.groupID
                FROM (
                    SELECT DISTINCT gu.groupID
                    FROM group_user gu
                    WHERE gu.userID = %s
                ) g
                JOIN tito_class_status gs ON g.groupID = gs.classID
                WHERE gs.titoStatus = 'inactive';
            '''
        elif get_classes_type == 'active':
            query = '''
                SELECT DISTINCT g.groupID
                FROM (
                    SELECT DISTINCT gu.groupID
                    FROM group_user gu
                    WHERE gu.userID = %s
                ) g
                JOIN tito_class_status gs ON g.groupID = gs.classID
                WHERE gs.titoStatus = 'active';
            '''
        return flatten_list(db.get(query, (userID,)))

def isUserInClass(user_id: int, class_id:int):
    query = '''
        SELECT EXISTS(
            SELECT * 
            FROM `group_user` 
            WHERE groupID = %s AND userID = %s
        );
    '''

    res = db.get(query, (class_id, user_id), fetchOne=True)
    if not res or not res[0]:
        return False
    return True

# TODO: Fix HANDLING MULTIPLE accessLevels being returned, prioritize pf>ta>st
def isUserThisAccessLevel(user_id: int, class_id: int, desired_access: str):
    query = '''
        SELECT `accessLevel` 
        FROM `group_user`
        WHERE `userID` = %s AND `groupID` = %s;
    '''
    res = db.get(query, (user_id, class_id))
    if not res:
        return False
    for user in res:
        if user[0] == desired_access:
            return True

    return False

def isUserAStudentInGroup(user_id: int, class_id: int):
    query = '''
        SELECT EXISTS(
            SELECT * FROM group_user WHERE userID = %s AND groupID = %s AND accessLevel == 'st';
        );
    '''

    res = db.get(query, (user_id, class_id), fetchOne=True)
    if not res:
        return False
    return res[0]


# ================================================
#
# Messages-Related
#
# ================================================

# Gets a single user's messages + LLM responses
def fetchModuleChatHistory(userID: int, moduleID: int):
    # Use the actual column names from the messages table
    query = '''
            SELECT m.id, m.source, m.value, m.timestamp
            FROM `messages` m
            WHERE m.userId = %s AND m.moduleId = %s
            ORDER BY m.id ASC;
        '''

    result = db.get(query, (userID, moduleID))

    messages = []
    for row in result:
        message = {
            "messageID": row[0],
            "source": row[1],
            "message": row[2],
            "creationTimestamp": row[3].isoformat() if row[3] else None,
            "isVoiceMessage": False  # Old schema doesn't have this info
        }
        messages.append(message)

    return messages

# Name + returns messageID on success, 0 = fail
def createNewUserMessage(userID: int, moduleID: int, chatbotSID: int, message: str, isVM: bool):
    try: 
        if not isValidChatbotSession(userID, moduleID, chatbotSID):
            return 0

        # Use the actual column names from the messages table
        query = '''
            INSERT INTO `messages` (userId, chatbotId, moduleId, source, value, metadata, timestamp)
            VALUES (%s, %s, %s, 'user', %s, %s, NOW());
        '''
        
        # Create metadata JSON with isVoiceMessage info
        metadata = f'{{"isVoiceMessage": {"true" if isVM else "false"}}}'

        result = db.post(query, (userID, chatbotSID, moduleID, message, metadata))
        if result:
            if not result.get("rowcount"):
                return 0
            return result.get("lastrowid")
        return 0
    except Exception as e:
        print(f"[ERROR] Exception has occured when trying to insert message @ createNewUserMessage in database.py. Error: {e}")
        return 0

# TODO: implement trigger logic here
def updateWordsUsed(term_count_dict: dict, user_id: int, module_id: int):
    if not term_count_dict:
        return
    
    term_ids = list(term_count_dict.keys())

    count = len(term_ids)
    # for tID in term_ids:
        # count += term_count_dict[tID]

    # query = '''
    #     UPDATE `tito_module_progress` 
    #     SET `totalTermsUsed` = `totalTermsUsed` + %s 
    #     WHERE `moduleID` = %s AND `userID` = %s;
    # '''
    # db.post(query, (count, module_id, user_id))


    # Build CASE statement
    case_statements = " ".join(
        f"WHEN {tid} THEN {count}" for tid, count in term_count_dict.items()
    )

    query = f'''
        UPDATE `tito_term_progress`
        SET `timesUsed` = `timesUsed` + CASE `termID`
            {case_statements}
            ELSE 0
        END
        WHERE `userID` = %s AND `moduleID` = %s
          AND `termID` IN ({",".join(["%s"] * count)});
    '''

    params = [user_id, module_id] + term_ids
    db.post(query, params)

def updateMessageKeytermCount(count: int, messageID: int, chatbotSID: int):
    # Skip this operation as the current messages table doesn't have keyWordsUsed column
    # TODO: Add keyWordsUsed column or store this info in metadata
    pass
# TODO: Improve this? return # words mastered and totalwords in that module
def getUserModuleProgress(user_id: int, module_id:int):
    query = '''
        SELECT tmp.termsMastered, tm.totalTerms 
        FROM tito_module_progress tmp
        JOIN tito_module tm ON tmp.moduleID = tm.moduleID 
        WHERE tmp.moduleID = %s AND tmp.userID = %s;
    '''

    res = db.get(query, (module_id, user_id), fetchOne=True)
    if not res:
        raise Exception(f"Failed to access tito_module_progress with {user_id} and {module_id} (invalid pair-request)")
    
    return res

def updateMessageScore(msg_id: int, score: int):
    # Skip this operation as the current messages table doesn't have grammarScore column
    # TODO: Add grammarScore column or store this info in metadata
    return True  # Return True to not break the flow
# NOTE: THIS IS deprecated by A TRIGGER 
    # def updateTermProgress(user_id: int, module_id: int, term_id: int):
    #     query = '''
    #         UPDATE `tito_term_progress`
    #         SET 
    #         `hasMastered` = CASE
    #             WHEN `timesUsed` > 3 AND (`timesMisspelled` / `timesUsed`) <= 0.25 THEN TRUE
    #             ELSE `hasMastered`  
    #         END
    #         WHERE userID = %s AND moduleID = %s AND termID = %s;
    #     '''

    #     # NOTE: OLD, replace once triggers allowed
    #     #     query = '''
    #     #     UPDATE `tito_term_progress`
    #     #     SET 
    #     #     `hasMastered` = CASE
    #     #         WHEN `timesUsed` > 3 AND (`timesMisspelled` / `timesUsed`) <= 0.25 THEN TRUE
    #     #         WHEN (`timesMisspelled` / `timesUsed`) > 0.25 THEN FALSE
    #     #         ELSE `hasMastered`  -- Keeps the current value if none of the conditions are met
    #     #     END
    #     #     WHERE userID = %s AND moduleID = %s AND termID = %s;
    #     # '''
    #     # print(f'Added u:{user_id} and mid:{module_id} to term {term_id}')


    # res = db.post(query, (user_id, module_id, term_id))
    # if res:
    #     if res.get("rowcount") > 0:
    #         updateModuleProgress(module_id, student_id)

# NOTE: deprecated?
# Adds +1 to `termsMastered`
# def updateModuleProgress(module_id: int, user_id: int):
#     query = '''
#         UPDATE `tito_module_progress`
#         SET `termsMastered` = `termsMastered` + 1
#         WHERE moduleID = %s AND userID = %s;
#     '''

#     db.post(query, (module_id, user_id))

# Adds +1 to misspell count for this term for the user
def updateMisspellings(user_id: int, module_id: int, term_id: int):
    query = '''
        UPDATE `tito_term_progress`
        SET `timesMisspelled` = `timesMisspelled` + 1,
            `timesUsed` = `timesUsed` + 1 
        WHERE userID = %s AND moduleID = %s AND termID = %s;
    '''

    db.post(query, (user_id, module_id, term_id))
    



# ================================================
#
# User Audio-Related
#
# ================================================

# Stores some related msg data & returns the voiceID to this insert
# Expire user audio files 7 months from date of recording for housekeeping
def storeVoiceMessage(userID: int, messageID: int, filename: str, chatbotSID: int):
    query = '''
        INSERT INTO `tito_voice_message` (userID, messageID, filename, chatbotSID, audioExpireDate)
        VALUES (%s, %s, %s, %s, DATE_ADD(CURDATE(), INTERVAL 7 MONTH));
    '''
    
    res = db.post(query, (userID, messageID, filename, chatbotSID))
    return 0 if not res else res.get("lastrowid") # voiceID

def isDuplicateAudioUpload(user_id: int, message_id: int):
    query = '''
        SELECT EXISTS(
            SELECT *
            FROM `tito_voice_message`
            WHERE userID = %s AND messageID =%s
        );
    '''
    res = db.get(query, (user_id, message_id), fetchOne=True)
    if not res:
        return 0
    return res[0] # 0 or 1

# Might be redundant
def getVoiceMessage(userID: int, messageID: int):
    if hasVoiceMessageExpired(userID, messageID):
        return None
    query = '''
        SELECT filename
        FROM `tito_voice_message` t
        WHERE t.userID = %s AND t.messageID = %s;
    '''

    result = db.get(query, (userID, messageID), fetchOne=True)
    if result:
        return result[0]
    return None

def hasVoiceMessageExpired(user_id: int, message_id: int):
    query = '''
        SELECT EXISTS(
            SELECT 1
            FROM `tito_voice_message`
            WHERE `userID` = %s AND `messageID` = %s
            AND `audioExpireDate` <= CURDATE()
        ) AS hasExpired;
    '''

    res = db.get(query, (user_id, message_id), fetchOne=True)
    if not res:
        return True
    return res[0]

# Get all voice messages for a user's conversation in a specific module and session
def getConversationAudioFiles(userID: int, moduleID: int, chatbotSID: int):
    query = '''
        SELECT vm.filename, vm.messageID, NOW() as timestamp
        FROM `tito_voice_message` vm
        WHERE vm.userID = %s AND vm.chatbotSID = %s
        AND vm.audioExpireDate > CURDATE()
        ORDER BY vm.messageID ASC;
    '''
    
    result = db.get(query, (userID, chatbotSID))
    return result if result else []

# Get all audio files for a user across all their conversations in a module
def getAllUserAudioInModule(userID: int, moduleID: int):
    # Step 1: Get all chatbot sessions for this user in this module
    sessions_query = '''
        SELECT DISTINCT chatbotId 
        FROM messages 
        WHERE userId = %s AND moduleId = %s
    '''
    
    sessions_result = db.get(sessions_query, (userID, moduleID))
    session_ids = [row[0] for row in sessions_result] if sessions_result else []
    
    if not session_ids:
        return []
    
    # Step 2: Get all voice messages for these sessions
    # Create placeholders for IN clause
    placeholders = ','.join(['%s'] * len(session_ids))
    
    audio_query = f'''
        SELECT vm.filename, vm.messageID, 
               NOW() as timestamp, 
               vm.chatbotSID
        FROM `tito_voice_message` vm
        WHERE vm.userID = %s 
        AND vm.audioExpireDate > CURDATE()
        AND vm.chatbotSID IN ({placeholders})
        ORDER BY vm.messageID ASC;
    '''
    
    query_params = [userID] + session_ids
    result = db.get(audio_query, query_params)
    
    return result if result else []

# ================================================
#
# LLM-Related
#
# ================================================

# Stores LLM response
def newTitoMessage(userID: int, chatbotSID: int, message: str, module_id: int):
    is_valid_session = isValidChatbotSession(userID, module_id, chatbotSID)
    if not is_valid_session:
        return False

    # Use the actual column names from the messages table
    query = '''
        INSERT INTO `messages` (userId, chatbotId, moduleId, source, value, metadata, timestamp)
        VALUES (%s, %s, %s, 'llm', %s, %s, NOW());
    '''
    
    # Create metadata JSON for LLM messages
    metadata = '{"isVoiceMessage": false}'

    res = db.post(query, (userID, chatbotSID, module_id, message, metadata))
    if not res:
        return False
    return False if not res.get("rowcount") else True


# ================================================
#
# Professor-Related
#
# ================================================

# TODO: Check if tito_module method required?
# TODO: create DB safety checks?
# TODO: create methods for when a new user joins the group [URGENT]
def addNewTitoModule(module_id, class_id):
    res = db.get("SELECT EXISTS(SELECT * FROM tito_module WHERE moduleID = %s AND classID = %s);", (module_id, class_id), fetchOne=True)
    if res:
        if res[0]:
            return 0
    else:
        return 0

    print(res[0])

    db.post("INSERT INTO tito_module (moduleID, classID) VALUES (%s, %s);", (module_id, class_id))
    # 1. Get ALL users assigned to class (even non students)
    users = db.get("SELECT DISTINCT userID FROM group_user WHERE groupID = %s;", (class_id,))

    # 2. Create tito_module_progress for all users
    module_user_pair = [(module_id, user) for user in users]
    db.post("INSERT INTO tito_module_progress (moduleID, userID) VALUES (%s, %s);", module_user_pair)

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
    db.post("INSERT INTO tito_term_progress (userID, moduleID, termID) VALUES (%s, %s, %s);", term_progress_data)
    return 

def addNewGroupUserToTitoGroup(user_id, class_id):
    """
    When a user is added to a group that already has Tito modules,
    insert tito_module_progress and tito_term_progress for them.
    """
    # 1. Check if this class is an active Tito class
    class_check = db.get(
        "SELECT EXISTS (SELECT * FROM tito_class_status WHERE classID = %s LIMIT 1);", (class_id,), fetchOne=True
    )
    if not class_check or not class_check[0]:
        return

    # 2. Get all Tito modules for this class
    modules = db.get(
        "SELECT moduleID FROM tito_module WHERE classID = %s;", (class_id,)
    )
    if not modules:
        return

    # 3. Create module progress entries for each module
    module_progress_data = [(m[0], user_id) for m in modules]
    db.post(
        "INSERT INTO tito_module_progress (moduleID, userID) VALUES (%s, %s);", module_progress_data
    )

    # 4. For each module, get its termIDs and add term progress
    for m in modules:
        module_id = m[0]
        term_ids = db.get(
            '''
                SELECT DISTINCT t.termID
                FROM (
                    SELECT DISTINCT questionID, moduleID
                    FROM module_question;
                ) mq
                JOIN answer a ON mq.questionID = a.questionID
                JOIN term t ON a.termID = t.termID
                WHERE mq.moduleID = %s;
            ''', (module_id,)
        )
        # Assign all terms to this user
        if term_ids:
            term_progress_data = [(user_id, module_id, term_id[0]) for term_id in term_ids]
            db.post(
                "INSERT INTO tito_term_progress (userID, moduleID, termID) VALUES (%s, %s, %s);",
                term_progress_data
            )

def getUsersInClass(class_id: int, user_id: int):
    query = '''
        SELECT userID
        FROM group_user
        WHERE groupID = %s AND userID != %s;
    '''
    res = db.get(query, (class_id,user_id))
    if not res:
        return []
    return flatten_list(res)

# Change some status of a Tito Module (current availability and/or start/end dates)
def updateTitoModuleStatus(module_id:int, class_id: int, update_status=False, update_date=False, start_date=None, end_date=None):
    flag = False
    if update_status:
        query = '''
            UPDATE tito_module 
            SET `status` = CASE
                WHEN `status` = 'active' then 'inactive'
                ELSE 'active'
            END
            WHERE classID = %s AND moduleID = %s;
        '''

        flag = db.post(query, (class_id, module_id)).get("rowcount") != 0
    if update_date:
        if not start_date and not end_date:
            return flag
        else:
            query = '''
                UPDATE tito_module 
                SET startDate = %s, endDate = %s
                WHERE classID = %s AND moduleID = %s;
            '''

            flag = flag or db.post(query, (start_date, end_date, class_id, module_id)).get("rowcount") != 0
    return flag

# enables/disables tito access to this class NOTE: (triggers updates tito modules)
def updateTitoClassStatus(user_id: int, class_id: int):
    query = '''
        UPDATE tito_class_status
        SET `titoStatus` = CASE
            WHEN `titoStatus` = 'active' then 'inactive'
            ELSE 'active'
        END
        WHERE classID = %s AND professorID = %s;
    '''

    res = db.post(query, (class_id, user_id))
    if not res:
        return False
    return True

def isTitoClass(user_id: int, class_id: int):
    query = '''
        SELECT EXISTS(
            SELECT * 
            FROM `tito_class_status` 
            WHERE classID = %s AND professorID = %s
        );
    '''
    res = db.get(query, (class_id, user_id), fetchOne=True)
    return False if not res else res[0]

def createTitoClass(user_id: int, class_id: int):
    query = '''
        INSERT INTO `tito_class_status` (`classID`, `professorID`, `titoExpirationDate`) 
        VALUES (%s,%s,DATE_ADD(CURDATE(), INTERVAL 12 MONTH));
    '''
    res = db.post(query, (class_id, user_id))
    if not res:
        return False
    if not res.get("rowcount"):
        return False
    return True

def updateClassModuleTitoLoreAssignment(class_id: int, module_id: int, new_lore_id: int):
    # check that the new loreid is valid
    validate_id_query = '''
        SELECT EXISTS(
            SELECT * FROM tito_lore WHERE loreID = %s
        );
    '''
    res = db.get(validate_id_query, (new_lore_id,), fetchOne=True)
    if not res or not res[0]:
        return 0
    
    query = '''
        UPDATE `tito_module` 
        SET `loreAssigned` = %s
        WHERE `classID` = %s AND `moduleID` = %s;
    '''

    res = db.post(query, (new_lore_id, class_id, module_id))
    if not res or not res.get('rowcount'):
        return False
    return True

def getClassModuleTitoLore(class_id: int, module_id: int):
    query = '''
        SELECT `loreAssigned` 
        FROM `tito_module`
        WHERE classID = %s AND moduleID = %s;
    '''

    res = db.get(query, (class_id, module_id), fetchOne=True)
    if not res or not res[0]:
        return 0
    return res[0]

def getTitoLoreTexts(tito_lore_id: int):
    query = '''
        SELECT loreText 
        FROM tito_lore_text
        WHERE loreID = %s
        ORDER BY sequenceNumber ASC;
    '''

    res = db.get(query, (tito_lore_id))
    if not res:
        return None
    return flatten_list(res)

def getAllTitoLore(owner_id: int, isSuperUser=False):
    if isSuperUser:
        query = '''
            SELECT tlt.loreID, tlt.sequenceNumber, tlt.loreText
            from tito_lore_text tlt
            JOIN tito_lore tl ON tlt.loreID = tl.loreID
            WHERE tl.ownerID = %s
            GROUP BY tlt.loreID, tlt.sequenceNumber ASC;
        '''
        res = db.get(query, (owner_id,))
        if not res:
            return None
        return res
    else:
        query = '''
            SELECT tlt.loreID, tlt.sequenceNumber, tlt.loreText
            from tito_lore_text tlt
            JOIN tito_lore tl ON tlt.loreID = tl.loreID
            WHERE tl.ownerID = %s
            GROUP BY tlt.loreID, tlt.sequenceNumber ASC;
        '''
        res = db.get(query, (owner_id,))
        if not res:
            return None
        return res

# Assumes privilege check b4 this call
def updateTitoLoreText(lore_id: int, sequence_num: int, new_lore_text: str):
    query = '''
        UPDATE `tito_lore_text`
        SET `loreText` = %s
        WHERE `loreID` = %s AND `sequenceNumber` = %s;
    '''

    res = db.post(query, (new_lore_text, lore_id, sequence_num))
    if not res or not res.get('rowcount'):
        return False
    return True

def insertTitoLore(owner_id: int, lore_text: [str]):
    if len(lore_text) != 4:
        return False

    lore_id_query = '''
        INSERT INTO `tito_lore` (ownerID)
        VALUES (%s);
    '''

    res = db.post(lore_id_query, (owner_id,))
    if not res or not res.get('rowcount'):
        return False
    lore_id = res.get('lastrowid')   

    idx = 1
    for text in lore_text:
        query = '''
            INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText)
            VALUES (%s, %s, %s);
        '''
        res = db.post(query, (lore_id, idx, text))
        idx += 1
    if not res or not res.get('rowcount'):
        return False
    return True    

def isTitoLoreOwner(owner_id: int, lore_id: int):
    query = '''
        SELECT EXISTS(
            SELECT *
            FROM tito_lore
            WHERE loreID = %s AND ownerID = %s;
        );
    '''

    res = db.get(query, (lore_id, owner_id), fetchOne=True)
    if not res:
        return False
    return res[0]
# ================================================
#
# Modules-Related
#
# ================================================

# Returns a list of tuples (tito_module_id, orderingID) for a given class
def getTitoModules(classID: int, status='active'):
    query = '''
        SELECT `moduleID`, `sequenceID`
        FROM `tito_module`
        WHERE `classID` = %s AND `status` = %s;
    '''

    return db.get(query, (classID, status))

# TODO: check if this works w/ not instead of not None
def isActiveTitoModule(classID: int, moduleID: int):
    query = '''
        SELECT EXISTS (
            SELECT `moduleID`
            FROM `tito_module`
            WHERE `classID` = %s AND `moduleID` = %s AND `status` = 'active'
        );
    '''

    res = db.get(query, (classID, moduleID), fetchOne=True)
    return False if not res else res[0]

def isTitoModule(class_id: int, module_id: int):
    query = '''
        SELECT EXISTS (
            SELECT `moduleID`
            FROM `tito_module`
            WHERE `classID` = %s AND `moduleID` = %s
        );
    '''

    res = db.get(query, (class_id, module_id), fetchOne=True)
    return False if not res else res[0]
    
# Returns pairs of termIDs with the term (str) for a given module
def getModuleTerms(module_id: int):
    query = '''
        SELECT DISTINCT t.termID, t.front
        FROM (
            SELECT DISTINCT questionID, moduleID
            FROM module_question
            WHERE moduleID = %s
        ) mq
        JOIN answer a ON mq.questionID = a.questionID
        JOIN term t ON a.termID = t.termID
        WHERE mq.moduleID = %s;
    '''

    res = db.get(query, (module_id, module_id))
    if not res:
        return []
    return res

def getModuleLanguage(module_id: int):
    query = '''
        SELECT t.language
        FROM module_question mq
        JOIN answer a ON mq.questionID = a.questionID
        JOIN term t ON a.termID = t.termID
        WHERE mq.moduleID = %s
        LIMIT 1;
    '''

    return db.get(query, (module_id,), fetchOne=True)

def isModuleInClass(class_id: int, module_id:int):
    query = '''
        SELECT EXISTS(
            SELECT * 
            FROM `group_module` 
            WHERE groupID = %s AND moduleID = %s
        );
    '''

    res = db.get(query, (class_id, module_id), fetchOne=True)
    if not res:
        return False
    return res[0]

# ================================================
#
# Data/Progress-related
#
# ================================================

def getAvgGrammarScoreChatbotSession(user_id: int, module_id: int, chatbot_sid: int):
    # Make sure to calc score for USER and NOT also LLM
    query = '''
        SELECT AVG(m.grammarScore) AS avgGrammarScore
        FROM messages m
        WHERE 
            m.userID = %s AND m.moduleID = %s AND m.chatbotSID = %s AND m.source = 'user';
    '''

    res = db.get(query, (user_id, module_id, chatbot_sid), fetchOne=True)
    if not res:
        return None
    return res[0]

def getAvgGrammarScoreModule(user_id: int, module_id: int):
    # Make sure to calc score for USER and NOT also LLM
    query = '''
        SELECT AVG(m.grammarScore) AS avgGrammarScore
        FROM messages m
        WHERE m.userID = %s AND m.moduleID = %s AND m.source = 'user';
    '''

    res = db.get(query, (user_id, module_id), fetchOne=True)
    if not res:
        return None
    return res[0]



# ================================================
#
# Audio Export Functions - REMOVED DUPLICATES
#
# ================================================


# ================================================
#
# Create Triggers FOR BELOW
#
# ================================================

# # TODO: Trigger
# def getTermCountInModule(module_id: int):

#     return

# # TODO: CREATE TRIGGER TO AUTOMATE THIS ON TITO_MODULE CREATION
# def iterateUpdateModule():
#     modules = []
#     for m in modules:
#         updateTMPTotalTerms(m)
#     return

# # Call once in a while or when terms are inserted/deleted
# # TODO: create a timed daemon to schedule this for all modules
# def updateTMPTotalTerms(module_id: int):
#     term_count_query = """
#         SELECT COUNT(DISTINCT t.termID)
#         FROM module_question mq
#         JOIN answer a ON mq.questionID = a.questionID
#         JOIN term t ON a.termID = t.termID
#         WHERE mq.moduleID = %s;
#     """
#     term_count = db.get(term_count_query, (module_id,), fetchOne=True)

#     error_flag = False
#     if not term_count:
#         return

#     total_terms = term_count[0]

#     update_query = """
#         UPDATE tito_module
#         SET totalTerms = %s
#         WHERE moduleID = %s;
#     """
#     res = db.post(update_query, (total_terms, module_id))
    
#     print(f"[UPDATE] Module {module_id}: totalTerms set to {total_terms} ")

from db import mysql
from db_utils import *
from utils import *
from exceptions_util import *
from datetime import datetime
import json
from config import PERMISSION_GROUPS
from flask_jwt_extended import get_jwt_claims


db = DBHelper(mysql)


# Updates how long a user has been chatting in the current session
# TODO: check if timestamp used is keyword or column
def updateTotalTimeChatted(chatbotSID):
    query = '''
        UPDATE chatbot_sessions
        SET totalTimeChatted = TIMESTAMPDIFF(SECOND, timestamp, NOW()) / 60
        WHERE chatbotSID = %s;
    '''

    return db.post(query, (chatbotSID,)).get("lastrowid")



# ================================================
#
# conversaitionelle pt 2
#
# ================================================

def loadModuleChatHistory(userID: int, moduleID: int):
    query = '''
            SELECT m.messageID, m.source, m.message, m.timestamp, m.isVoiceMessage
            FROM `messages` m
            WHERE m.userID = %s AND m.moduleID = %s
            ORDER BY m.messageID ASC;
        '''

    result = db.get(query, (userID, moduleID))

    messages = []
    for row in result:
        message = {
            "messageID": row[0],
            "source": row[1],
            "message": row[2],
            "timestamp": row[3].isoformat() if row[3] else None,
            "isVoiceMessage": row[4]
        }
        messages.append(message)

    return messages

# Revoke any existing instances of chatbot sessions & create new session for user
def createChatbotSession(userID: int, moduleID: int):
    query_revoke_prev_sessions = '''
            UPDATE `chatbot_sessions`
            SET activeSession = 0
            WHERE userID = %s;
        '''
    db.post(query_revoke_prev_sessions, (userID,))

    query_insert_new_session = '''
            INSERT INTO `chatbot_sessions` (userID, moduleID, activeSession)
            VALUES (%s, %s, 1);
        '''

    res = db.post(query_insert_new_session, (userID, moduleID))
    return res["lastrowid"] # the chatbotSID

# Self-explanatory (F = inactive/invalid sesh, T = active sesh)
def isValidChatbotSession(userID: int, moduleID: int, chatbotSID: int):
    query = '''
            SELECT activeSession
            FROM chatbot_sessions
            WHERE userID = %s AND moduleID = %s AND chatbotSID = %s;
        '''

    result = db.get(query, (userID, moduleID, chatbotSID), fetchOne=True)

    # TODO: Maybe error here?
    if not result or not result[0]:
        return False
    return True

def createNewUserMessage(userID: int, moduleID: int, chatbotSID: int, message: str, isVM: bool):
    try: 
        if not isValidChatbotSession(userID, moduleID, chatbotSID):
            return 0

        query = '''
            INSERT INTO `messages` (userID, chatbotSID, moduleID, source, message, isVoiceMessage)
            VALUES (%s, %s, %s, 'user', %s, %s);
        '''

        result = db.post(query, (userID, chatbotSID, moduleID, message, isVM))
        if result.get("rowcount") == 0:
            return 0
        return result.get("lastrowid")
    except Exception as e:
        print("[ERROR] Exception has occured when trying to insert message @ createNewUserMessage in database.py. Error: {e}")
        return 0


def newTitoMessage(userID: int, chatbotSID: int, message: str, module_id: int):
    is_valid_session = isValidChatbotSession(userID, module_id, chatbotSID)
    if not is_valid_session:
        return False

    query = '''
        INSERT INTO `messages` (`userID`, `chatbotSID`, `moduleID`, `source`, `message`, `isVoiceMessage`)
        VALUES (%s, %s, %s, 'llm', %s, 0);
    '''

    res = db.post(query, (userID, chatbotSID, module_id, message))
    if not res:
        return False

    return False if not res.get("rowcount") else True

def evaluateGrammar(userID: int, chatbotSID: int, message: str):
    return False


def checkTermsUsed(userID: int, moduleID: int, chatbotSID: int, message: str):
    return False

# Returns a list of group_ids assigned to a user of ACTIVE TITO CLASSES
# st == all enrolled classes
# pf == all owned classes
# pf may get either all tito classes or just currently active tito classes
def getTitoClasses(userID: int, permissionLevel: str, get_classes_type='all'):
    query = ''
    if permissionLevel == 'pf':
        if get_classes_type == 'active':
            query = '''
                SELECT DISTINCT classID
                FROM tito_group_status
                WHERE professorID = %s AND titoStatus = 'active';
            '''
        elif get_classes_type == 'all':
            query = '''
                SELECT DISTINCT classID
                FROM tito_group_status
                WHERE professorID = %s;
            '''
        else:
            query = '''
                SELECT DISTINCT classID
                FROM tito_group_status
                WHERE professorID = %s AND titoStatus = 'inactive';
            '''
        return db.get(query, (userID,))
    elif permissionLevel == 'st':
        query = '''
            SELECT g.groupID
            FROM (
                SELECT DISTINCT gu.groupID
                FROM group_user gu
                WHERE gu.userID = %s AND gu.accessLevel = %s
            ) g
            JOIN tito_group_status gs ON g.groupID = gs.classID
            WHERE gs.titoStatus = 'active';
        '''
        return db.get(query, (userID, permissionLevel))
    elif permissionLevel == 'any':
        if get_classes_type == 'all':
            query = '''
                SELECT DISTINCT g.groupID
                FROM (
                    SELECT DISTINCT gu.groupID
                    FROM group_user gu
                    WHERE gu.userID = %s
                ) g
                JOIN tito_group_status gs ON g.groupID = gs.classID
            '''
        elif get_classes_type == 'inactive':
            query = '''
                SELECT DISTINCT g.groupID
                FROM (
                    SELECT DISTINCT gu.groupID
                    FROM group_user gu
                    WHERE gu.userID = %s
                ) g
                JOIN tito_group_status gs ON g.groupID = gs.classID
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
                JOIN tito_group_status gs ON g.groupID = gs.classID
                WHERE gs.titoStatus = 'active';
            '''
        return db.get(query, (userID,))

def isUserInClass(user_id: int, class_id:int):
    query = '''
        SELECT * 
        FROM `group_user` 
        WHERE groupID = %s AND userID = %s;
    '''

    if not db.get(query, (class_id, user_id), fetchOne=True):
        return False
    return True

def getUserGroupAccessLevel(user_id: int, class_id: int):
    query = '''
        SELECT `accessLevel` 
        FROM `group_user`
        WHERE `userID` = %s AND `groupID` = %s;
    '''

    return db.get(query, (user_id, class_id), fetchOne=True)[0]

    
# Returns a list of tuples (tito_module_id, orderingID) for a given class
def getTitoModules(classID: int, status='active'):
    query = '''
        SELECT moduleID, sequenceID
        FROM tito_module
        WHERE classID = %s AND `status` = %s;
    '''

    return db.get(query, (classID, status))

def isActiveTitoModule(classID: int, moduleID: int):
    query = '''
        SELECT moduleID
        FROM tito_module
        WHERE classID = %s AND moduleID = %s AND `status` = 'active';
    '''

    res = db.get(query, (classID, moduleID), fetchOne=True)
    return res is not None

def isTitoModule(class_id: int, module_id: int):
    query = '''
        SELECT moduleID
        FROM tito_module
        WHERE classID = %s AND moduleID = %s;
    '''

    res = db.get(query, (class_id, module_id), fetchOne=True)
    return False if not res else True

def isNoneOrZero(result):
    if not result:
        return True
    return False

# Returns pairs of termIDs with the term for a given module
def getModuleTerms(module_id: int):
    query = '''
        SELECT DISTINCT t.termID, t.front
        FROM module_question mq
        JOIN answer a ON mq.questionID = a.questionID
        JOIN term t ON a.termID = t.termID
        WHERE mq.moduleID = %s;
    '''

    return db.get(query, (module_id,))

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

def getMessageID(userID: int, moduleID: int, chatbotSID: int):
    query = '''
            SELECT messageID
            FROM `messages`
            WHERE userID = %s AND moduleID = %s AND chatbotSID = %s
            ORDER BY timestamp DESC LIMIT 1;
        '''
    result = db.get(query, (userID, moduleID, chatbotSID))
    if isNoneOrZero(result):
        return False
    return True

def storeVoiceMessage(userID: int, messageID: int, filename: str, chatbotSID: int):
    query = '''
        INSERT INTO `tito_voice_message` (userID, messageID, filename, chatbotSID)
        VALUES (%s, %s, %s, %s);
    '''
    
    res = db.post(query, (userID, messageID, filename, chatbotSID))
    return 0 if res is None else res.get("lastrowid")

def getVoiceMessage(userID: int, messageID: int):
    query = '''
        SELECT filename
        FROM `tito_voice_message` t
        WHERE t.userID = %s AND t.messageID = %s;
    '''

    result = db.get(query, (userID, messageID), fetchOne=True)
    if result:
        return result[0]
    return None

def create_response(success=True, message=None, data=None, status_code=200, **extra_json_fields):
    response = {
        "success": success,
        "message": message if message else "",
        "data": {} if data is None else data
    }

    # Add any additional key-value pairs (from extra_fields) to the response
    if extra_json_fields:
        response.update(extra_json_fields)

    return response, status_code

def updateWordsUsed(term_count_dict: dict, user_id: int, module_id: int):
    if isNoneOrZero(term_count_dict):
        return
    
    term_ids = list(term_count_dict.keys())

    count = 0
    for tID in term_ids:
        count += term_count_dict[tID]

    query = '''
        UPDATE `tito_module_progress` 
        SET `totalTermsUsed` = `totalTermsUsed` + %s 
        WHERE `moduleID` = %s AND `studentID` = %s;
    '''
    db.post(query, (count, module_id, user_id))


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
          AND `termID` IN ({",".join(["%s"] * len(term_ids))});
    '''

    params = [user_id, module_id] + term_ids
    db.post(query, params)

    for tID in term_ids:
        updateTermProgress(user_id, module_id, tID)


def updateMessageKeytermCount(count: int, messageID: int, chatbotSID: int):
    query = '''
        UPDATE `messages` 
        SET `keyWordsUsed` = `keyWordsUsed` + %s
        WHERE `messageID` = %s;
    '''

    db.post(query, (count, messageID))

    query = '''
        UPDATE `chatbot_sessions`
        SET `moduleWordsUsed` = `moduleWordsUsed` + %s
        WHERE `chatbotSID` = %s;
    '''
    db.post(query, (count, chatbotSID))

# def validate_user(permission_claim=None, any_perm_level=False, req_perm_level=True, req_student_perm=False, req_prof_perm=False, req_admin_perm=False):
#     if req_perm_level:
#         if any_perm_level:
#             return True if permission_claim is in 
#         if req_admin_perm:
#             if permission_claim == PERMISSION_GROUPS[0]:
#                 return True
#         if req_prof_perm:
#             if permission_claim == PERMISSION_GROUPS[1]:
#                 return True
#         if req_student_perm:
#             if permission_claim == PERMISSION_GROUPS[2]:
#                 return True
#     else: # still checks that user has a group, might be unneccesary
#         if permission_claim == PERMISSION_GROUPS[0]:
#             return True
#         if permission_claim == PERMISSION_GROUPS[1]:
#             return True
#         if permission_claim == PERMISSION_GROUPS[2]:
#             return True
#     return False

def isDuplicateAudioUpload(user_id: int, message_id: int):
    query = '''
        SELECT EXISTS(
            SELECT *
            FROM `tito_voice_message`
            WHERE userID = %s AND messageID =%s
        );
    '''
    res = db.get(query, (user_id, message_id), fetchOne=True)
    return res[0]

def insertNewTitoModule(module_id, class_id):
    db.post("INSERT INTO tito_module (moduleID, classID) VALUES (%s, %s);", (module_id, class_id))

    # 1. Get all students in the class
    students = db.get("SELECT DISTINCT userID FROM group_user WHERE groupID = %s;", (class_id,))

    # 2. Insert into tito_module_progress
    module_progress_data = [(module_id, s) for s in students]
    # print(module_progress_data)
    db.post("INSERT INTO tito_module_progress (moduleID, studentID) VALUES (%s, %s);", module_progress_data)

    # 3. Get all termIDs for module
    term_ids = db.get('''
        SELECT DISTINCT t.termID
        FROM module_question mq
        JOIN answer a ON mq.questionID = a.questionID
        JOIN term t ON a.termID = t.termID
        WHERE mq.moduleID = %s;
    ''', (module_id,))
    # 4. Insert into tito_term_progress
    term_progress_data = [(module_id, term_id[0], s[0]) for term_id in term_ids for s in students]
    # print(term_progress_data)
    db.post("INSERT INTO tito_term_progress (moduleID, termID, userID) VALUES (%s, %s, %s);", term_progress_data)

def userIsNotStudent(user_id:int, class_id: int):
    query = '''
        SELECT DISTINCT userID
        FROM group_user
        WHERE userID = %s AND groupID = %s AND accessLevel != 'st';
    '''
    res = db.get(query, (user_id, class_id), fetchOne=True)
    return False if not res else True

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

def updateTitoGroupStatus(user_id: int, class_id: int):
    query = '''
        UPDATE tito_group_status
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
        SELECT * 
        FROM `tito_group_status` 
        WHERE classID = %s AND professorID = %s;
    '''

    return False if not db.get(query, (class_id, user_id), fetchOne=True) else True

def createTitoClass(user_id: int, class_id: int):
    query = '''
        INSERT INTO `tito_group_status` (`classID`, `professorID`, `titoExpirationDate`) 
        VALUES (%s,%s,CURDATE());
    '''

    return False if not db.post(query, (class_id, user_id)) else True

def isModuleInClass(class_id: int, module_id:int):
    query = '''
        SELECT * 
        FROM `group_module` 
        WHERE groupID = %s AND moduleID = %s;
    '''

    res = db.get(query, (class_id, module_id), fetchOne=True)
    if not res:
        return False
    return True

def getUserModuleProgress(user_id: int, module_id:int):
    query = '''
        SELECT proficiencyRate 
        FROM tito_module_progress
        WHERE moduleID = %s AND studentID = %s;
    '''

    res = db.get(query, (module_id, user_id), fetchOne=True)
    if not res:
        raise Exception(f"Failed to access tito_module_progress with {user_id} and {module_id} (invalid pair-request)")
    else:
        return res[0]

def updateMessageScore(msg_id: int, score: int):
    query = '''
        UPDATE `messages`
        SET `grammarRating` = %s
        WHERE messageID = %s;
    '''

    res = db.post(query, (score, msg_id))
    return False if not res else True

def updateTermProgress(user_id: int, module_id: int, term_id: int):
    query = '''
        UPDATE `tito_term_progress`
        SET 
        `hasMastered` = CASE
            WHEN `timesUsed` > 3 AND (`timesMisspelled` / `timesUsed`) <= 0.25 THEN TRUE
            WHEN (`timesMisspelled` / `timesUsed`) > 0.25 THEN FALSE
            ELSE `hasMastered`  -- Keeps the current value if none of the conditions are met
        END
        WHERE userID = %s AND moduleID = %s AND termID = %s;
    '''
    print(f'Added u:{user_id} and mid:{module_id} to term {term_id}')


    db.post(query, (user_id, module_id, term_id))

def updateMisspellings(user_id: int, module_id: int, term_id: int):
    query = '''
        UPDATE `tito_term_progress`
        SET `timesMisspelled` = `timesMisspelled` + 1,
        `timesUsed` = `timesUsed` + 1
        WHERE userID = %s AND moduleID = %s AND termID = %s;
    '''

    db.post(query, (user_id, module_id, term_id))

    updateTermProgress(user_id, module_id, term_id)

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
        UPDATE `chatbot_sessions`
        SET `timeChatted` = TIMESTAMPDIFF(SECOND, timestamp, NOW()) / 60
        WHERE `chatbotSID` = %s;
    '''

    return db.post(query, (chatbotSID,)).get("lastrowid")



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
    # query_revoke_prev_sessions = '''
    #         UPDATE `chatbot_sessions`
    #         SET `isActiveSession` = 0
    #         WHERE `userID` = %s;
    #     '''
    # db.post(query_revoke_prev_sessions, (userID,))

    query = '''
        INSERT INTO `chatbot_sessions` (`userID`, `moduleID`, `isActiveSession`)
        VALUES (%s, %s, 1);
    '''

    res = db.post(query, (userID, moduleID))
    return res["lastrowid"] # the chatbotSID

# Self-explanatory (F = inactive/invalid sesh, T = active sesh)
# TODO: Check logic, test with existing but expired, current and existing nonE, and future nonExist
def isValidChatbotSession(userID: int, moduleID: int, chatbotSID: int):
    query = '''
        SELECT `isActiveSession`
        FROM `chatbot_sessions`
        WHERE `userID` = %s AND `moduleID` = %s AND `chatbotSID` = %s;
    '''

    result = db.get(query, (userID, moduleID, chatbotSID), fetchOne=True)

    # TODO: Maybe error here?
    if not result or not result[0]:
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
    return False if not res else res[0]

# ================================================
#
# Group-Related
#
# ================================================

# Returns a list of group_ids assigned to a user of ACTIVE TITO CLASSES
# st == all enrolled classes
# pf == all owned classes
# pf may get either all tito classes or just currently active tito classes
# TODO: Create get classAccessLevel
def getTitoClasses(userID: int, permissionLevel: str, get_classes_type='all'):
    query = ''
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
        return db.get(query, (userID,))
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
    res = db.get(query, (user_id, class_id), fetchOne=True)
    if not res:
        return None
    return res[0]



# ================================================
#
# Messages-Related
#
# ================================================

# Gets a single user's messages + LLM responses
def fetchModuleChatHistory(userID: int, moduleID: int):
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
            "timestamp": row[3].isoformat() if row[3] else None, # TODO: consider removing this ternary
            "isVoiceMessage": row[4]
        }
        messages.append(message)

    return messages

# Name + returns messageID on success, 0 = fail
def createNewUserMessage(userID: int, moduleID: int, chatbotSID: int, message: str, isVM: bool):
    try: 
        if not isValidChatbotSession(userID, moduleID, chatbotSID):
            return 0

        query = '''
            INSERT INTO `messages` (userID, chatbotSID, moduleID, source, message, isVoiceMessage)
            VALUES (%s, %s, %s, 'user', %s, %s);
        '''

        # if isVM == 'false':
        #     isVM = 0
        # elif isVM == 'true':
        #     isVM = 1
        result = db.post(query, (userID, chatbotSID, moduleID, message, isVM))
        # print(result)
        if result:
            if not result.get("rowcount"):
                return 0
            return result.get("lastrowid")
        return 0
    except Exception as e:
        print(f"[ERROR] Exception has occured when trying to insert message @ createNewUserMessage in database.py. Error: {e}")
        return 0

# NOTE: Deprecated?
# def getMessageID(userID: int, moduleID: int, chatbotSID: int):
#     query = '''
#             SELECT messageID
#             FROM `messages`
#             WHERE userID = %s AND moduleID = %s AND chatbotSID = %s
#             ORDER BY timestamp DESC LIMIT 1;
#         '''
#     result = db.get(query, (userID, moduleID, chatbotSID))
#     if not result:
#         return False
#     return True

# TODO: implement trigger logic here
def updateWordsUsed(term_count_dict: dict, user_id: int, module_id: int):
    if not term_count_dict:
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

def updateMessageKeytermCount(count: int, messageID: int, chatbotSID: int):
    query = '''
        UPDATE `messages` 
        SET `keyWordsUsed` = `keyWordsUsed` + %s
        WHERE `messageID` = %s;
    '''

    db.post(query, (count, messageID))

    # query = '''
    #     UPDATE `chatbot_sessions`
    #     SET `moduleWordsUsed` = `moduleWordsUsed` + %s
    #     WHERE `chatbotSID` = %s;
    # '''
    # db.post(query, (count, chatbotSID))

# TODO: Improve this? 
def getUserModuleProgress(user_id: int, module_id:int):
    # query = '''
    #     SELECT proficiencyRate 
    #     FROM tito_module_progress
    #     WHERE moduleID = %s AND studentID = %s;
    # '''

    query = '''
        SELECT termsMastered, totalTerms 
        FROM tito_module_progress 
        WHERE moduleID = %s AND studentID = %s;
    '''

    res = db.get(query, (module_id, user_id), fetchOne=True)
    if not res:
        raise Exception(f"Failed to access tito_module_progress with {user_id} and {module_id} (invalid pair-request)")
    else:
        print(res[0])
        return res[0]

def updateMessageScore(msg_id: int, score: int):
    query = '''
        UPDATE `messages`
        SET `grammarScore` = %s
        WHERE messageID = %s;
    '''

    res = db.post(query, (score, msg_id))
    return False if not res else True

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

# Adds +1 to `termsMastered`
def updateModuleProgress(module_id: int, user_id: int):
    query = '''
        UPDATE `tito_module_progress`
        SET `termsMastered` = `termsMastered` + 1
        WHERE moduleID = %s AND studentID = %s;
    '''

    db.post(query, (module_id, user_id))


# ================================================
#
# User Audio-Related
#
# ================================================

# Stores some related msg data & returns the voiceID to this insert
def storeVoiceMessage(userID: int, messageID: int, filename: str, chatbotSID: int):
    query = '''
        INSERT INTO `tito_voice_message` (userID, messageID, filename, chatbotSID)
        VALUES (%s, %s, %s, %s);
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
    query = '''
        SELECT filename
        FROM `tito_voice_message` t
        WHERE t.userID = %s AND t.messageID = %s;
    '''

    result = db.get(query, (userID, messageID), fetchOne=True)
    if result:
        return result[0]
    return None


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

    query = '''
        INSERT INTO `messages` (`userID`, `chatbotSID`, `moduleID`, `source`, `message`, `isVoiceMessage`)
        VALUES (%s, %s, %s, 'llm', %s, 0);
    '''

    res = db.post(query, (userID, chatbotSID, module_id, message))
    if not res:
        return False
    return False if not res.get("rowcount") else True


# ================================================
#
# Professor-Related
#
# ================================================

# TODO: read this
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
        VALUES (%s,%s,CURDATE());
    '''
    res = db.post(query, (class_id, user_id))
    if not res:
        return False
    if not res.get("rowcount"):
        return False
    return True



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
        SELECT `moduleID`
        FROM `tito_module`
        WHERE `classID` = %s AND `moduleID` = %s AND `status` = 'active';
    '''

    res = db.get(query, (classID, moduleID), fetchOne=True)
    return False if not res else True

def isTitoModule(class_id: int, module_id: int):
    query = '''
        SELECT `moduleID`
        FROM `tito_module`
        WHERE `classID` = %s AND `moduleID` = %s;
    '''

    res = db.get(query, (class_id, module_id), fetchOne=True)
    return False if not res else True
    
# Returns pairs of termIDs with the term (str) for a given module
def getModuleTerms(module_id: int):
    query = '''
        SELECT DISTINCT t.termID, t.front
        FROM `module_question` mq
        JOIN `answer` a ON mq.questionID = a.questionID
        JOIN `term` t ON a.termID = t.termID
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
# Create Triggers FOR BELOW
#
# ================================================

# TODO: Trigger
def getTermCountInModule(module_id: int):

    return

# TODO: CREATE TRIGGER TO AUTOMATE THIS ON TITO_MODULE CREATION
def iterateUpdateModule():
    modules = []
    for m in modules:
        updateTMPTotalTerms(m)
    return

# Call once in a while or when terms are inserted/deleted
# TODO: create a timed daemon to schedule this for all modules
def updateTMPTotalTerms(module_id: int):
    term_count_query = """
        SELECT COUNT(DISTINCT t.termID)
        FROM module_question mq
        JOIN answer a ON mq.questionID = a.questionID
        JOIN term t ON a.termID = t.termID
        WHERE mq.moduleID = %s;
    """
    term_count = db.get(term_count_query, (module_id,), fetchOne=True)

    error_flag = False
    if not term_count:
        return

    total_terms = term_count[0]

    update_query = """
        UPDATE tito_module
        SET totalTerms = %s
        WHERE moduleID = %s;
    """
    res = db.post(update_query, (total_terms, module_id))
    
    print(f"[UPDATE] Module {module_id}: totalTerms set to {total_terms} ")

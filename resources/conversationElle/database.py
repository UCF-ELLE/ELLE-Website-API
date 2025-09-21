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
def updateTotalTimeChatted(chatbotSID):
    query = """
        UPDATE chatbot_sessions
        SET totalTimeChatted = TIMESTAMPDIFF(SECOND, timestamp, NOW()) / 60
        WHERE chatbotSID = %s;
    """

    return db.post(query, (chatbotSID,)).get("lastrowid")



# ================================================
#
# conversaitionelle pt 2
#
# ================================================

def loadModuleChatHistory(userID: int, moduleID: int):
    query = """
            SELECT m.messageID, m.source, m.message, m.timestamp, m.isVoiceMessage
            FROM `messages` m
            WHERE m.userID = %s AND m.moduleID = %s
            ORDER BY m.messageID ASC;
        """

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
def createNewChatbotSession(userID: int, moduleID: int):
    query_revoke_prev_sessions = """
            UPDATE `chatbot_sessions`
            SET activeSession = 0
            WHERE userID = %s;
        """
    res = db.post(query_revoke_prev_sessions, (userID,))

    query_insert_new_session = """
            INSERT INTO `chatbot_sessions` (userID, moduleID, activeSession)
            VALUES (%s, %s, 1);
        """

    res = db.post(query_insert_new_session, (userID, moduleID))
    return res["lastrowid"]

# Self-explanatory (F = inactive/invalid sesh, T = active sesh)
def checkChatbotSessionStatus(userID: int, moduleID: int, chatbotSID: int):
    query = """
            SELECT activeSession
            FROM chatbot_sessions
            WHERE userID = %s AND moduleID = %s AND chatbotSID = %s;
        """

    result = db.get(query, (userID, moduleID, chatbotSID), fetchOne=True)

    if not result or not result[0]:
        return False

    return True

def newUserMessage(userID: int, moduleID: int, chatbotSID: int, message: str, isVM: bool):
    # Check for valid chatbot session
    try: 
        if not checkChatbotSessionStatus(userID, moduleID, chatbotSID):
            return False

        query = """
            INSERT INTO `messages` (userID, chatbotSID, moduleID, source, message, isVoiceMessage)
            VALUES (%s, %s, %s, 'user', %s, %s);
        """

        result = db.post(query, (userID, chatbotSID, moduleID, message, isVM))
        if result.get("rowcount") == 0:
            return 0
        return result.get("lastrowid")
    except Exception as e:
        print("[ERROR] Exception has occured when trying to insert message @ newUserMessage in database.py. Error: {e}")
        return 0


def newTitoMessage(userID: int, chatbotSID: int, message: str):
    is_valid_session = checkChatbotSessionStatus(userID, moduleID, chatbotSID)
    if not is_valid_session:
        return False

    query = """
        INSERT INTO `messages` (userID, chatbotSID, moduleID, source, message, isVoiceMessage)
        VALUES (%s, %s, %s, 'llm', %s, 0);
    """

    res = db.post(query, (userID, chatbotSID, moduleID, message, isVM))
    if not res:
        return False

    return False if not res.get("rowcount") else True

def evaluateGrammar(userID: int, chatbotSID: int, message: str):
    return False


def checkTermsUsed(userID: int, moduleID: int, chatbotSID: int, message: str):
    return False

# Returns a list of group_ids assigned to a user
# st == all enrolled classes
# pf == all owned classes
# ENSURE THAT ONLY ACTIVE CLASSES ARE SENT
def getClasses(userID: int, authority: str):
    query = '''
        SELECT gu.groupID
        FROM group_user gu 
        WHERE gu.userID = %s AND gu.accessLevel = %s;
    '''

    return db.get(query, (userID, authority))
    
# Returns a list of tuples (tito_module_id, orderingID) for a given class
def getTitoModules(classID: int):
    query = '''
        SELECT moduleID, sequenceID
        FROM tito_module
        WHERE classID = %s AND `status` = 'active';
    '''

    return db.get(query, (classID,))

def isTitoModule(classID: int, moduleID: int):
    query = '''
        SELECT moduleID
        FROM tito_module
        WHERE classID = %s AND moduleID = %s
        LIMIT 1;
    '''

    res = db.get(query, (classID, moduleID), fetchOne=True)
    print(res)
    return res is not None

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
    query = """
            SELECT messageID
            FROM `messages`
            WHERE userID = %s AND moduleID = %s AND chatbotSID = %s
            ORDER BY timestamp DESC LIMIT 1;
        """
    result = db.get(query, (userID, moduleID, chatbotSID))
    if isNoneOrZero(result):
        return False
    return True

def storeVoiceMessage(userID: int, messageID: int, filename: str, chatbotSID: int):
    query = """
        INSERT INTO `tito_voice_message` (userID, messageID, filename, chatbotSID)
        VALUES (%s, %s, %s, %s);
    """
    
    res = db.post(query, (userID, messageID, filename, chatbotSID))
    return False if not res or res.get("rowcount") < 1 else True

def getVoiceMessage(userID: int, messageID: int):
    query = """
        SELECT filename
        FROM `tito_voice_message` t
        WHERE t.userID = %s AND t.messageID = %s;
    """

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

def update_words_used(term_count_dict: dict, user_id: int, module_id: int):
    if isNoneOrZero(term_count_dict):
        return
    
    term_ids = list(term_count_dict.keys())

    # Build CASE statement
    case_statements = " ".join(
        f"WHEN {tid} THEN {count}" for tid, count in term_count_dict.items()
    )

    query = f'''
        UPDATE `tito_term_progress`
        SET `timesUsedSuccessfully` = `timesUsedSuccessfully` + CASE `termID`
            {case_statements}
            ELSE 0
        END
        WHERE `userID` = %s AND `moduleID` = %s
          AND `termID` IN ({",".join(["%s"] * len(term_ids))});
    '''

    params = [user_id, module_id] + term_ids
    res = db.post(query, params)


def update_message_key_term_count(count: int, messageID: int):
    query = '''
        UPDATE `messages` 
        SET `keyWordsUsed` = `keyWordsUsed` + %s
        WHERE `messageID` = %s;
    '''

    res = db.post(query, (count, messageID))

def validate_user(permission_claim=None, req_perm_level=True, req_student_perm=False, req_prof_perm=False, req_admin_perm=False):
    if req_perm_level:
        if req_admin_perm:
            if permission_claim == PERMISSION_GROUPS[0]:
                return True
        if req_prof_perm:
            if permission_claim == PERMISSION_GROUPS[1]:
                return True
        if req_student_perm:
            if permission_claim == PERMISSION_GROUPS[2]:
                return True
    else: # still checks that user has a group, might be unneccesary
        if permission_claim == PERMISSION_GROUPS[0]:
            return True
        if permission_claim == PERMISSION_GROUPS[1]:
            return True
        if permission_claim == PERMISSION_GROUPS[2]:
            return True
    return False

def is_duplicate_audio_upload(user_id: int, message_id: int):
    query = '''
        SELECT EXISTS(
            SELECT *
            FROM `tito_voice_message`
            WHERE userID = %s AND messageID =%s
        );
    '''
    res = db.get(query, (user_id, message_id), fetchOne=True)
    print(res[0])
    return res[0]

from db import mysql
from db_utils import *
from utils import *
from exceptions_util import *
from datetime import datetime
import json

# slightly modified helper from the original getFromDB: this one turns rows into dictionary
def get_from_db_as_dict(query, vals=None, providedConn=None, providedCursor=None):
    if providedConn is None:
        conn = mysql.connect()
    elif providedConn:
        conn = providedConn
    if providedCursor is None:
        cursor = conn.cursor()
    elif providedCursor:
        cursor = providedCursor

    cursor.execute(query, vals) if vals else cursor.execute(query)
    
    result = []
    columns = [col[0] for col in cursor.description]  # get column names from cursor
    
    for row in cursor:
        result.append(dict(zip(columns, row)))  # convert each row to a dictionary
    
    if providedConn is None:
        conn.commit()
        conn.close()
    
    return result

def getMessages(userId, chatbotSID):
    try:
        conn = mysql.connect()
        cursor = conn.cursor()

        query = """
        SELECT id, userId, chatbotSID, moduleId, source, value, timestamp, metadata
        FROM messages
        WHERE userId = %s AND chatbotSID = %s
        """

        result = get_from_db_as_dict(query, (userId, chatbotSID), conn, cursor)

        # Conver the pyton datetime obj to regular iso format
        # TODO: See if there is a way to get rid of this -> If not, maybe make it a helper func.
        messages = []
        for entry in result:
            entry['timestamp'] = entry['timestamp'].isoformat()
            messages.append(entry)

        return messages, 200

    except Exception as error:
        conn.rollback()
        return errorMessage(str(error)), 500
    finally:
        if conn.open:
            cursor.close()
            conn.close()


def insertMessages(userId, chatbotSID, moduleId, userValue, llmValue, termsUsed):
    try:
        
        # parse out response and metadata
        llmResponse = llmValue["response"]
        llmValue.pop("response")

        # save llmResponse without terms used for frontend
        return_metadata = json.dumps(llmValue)

        llmValue['termsUsed'] = termsUsed
        
        #llmScore = llmValue["score"]
        #llmError = llmValue["error"]
        #llmCorrection = llmValue["correction"]
        #llmExplanation = llmValue["explanation"]
        
        conn = mysql.connect()
        cursor = conn.cursor()
        metadata = json.dumps(llmValue)
        
        #print("conn: ", conn)
        #print("cursor: ", cursor)
        print("metadata: ", metadata)

        query = """
        INSERT INTO messages (userId, chatbotSID, moduleId, source, value, metadata)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        messages = [
            (userId, chatbotSID, moduleId, 'user', userValue, metadata),
            (userId, chatbotSID, moduleId, 'llm', llmResponse, metadata),
        ]
        
        print("messages: ", messages)

        cursor.executemany(query, messages)
        conn.commit()
        return return_metadata, 200

    except Exception as error:
        conn.rollback()
        print(error)
        return errorMessage(str(error)), 500
    finally:
        if conn.open:
            cursor.close()
            conn.close()

def getChatbotSession(userId, moduleId):
    try:
        conn = mysql.connect()
        cursor = conn.cursor()

        query = """
        SELECT * FROM chatbot_sessions
        WHERE userId = %s AND moduleId = %s
        LIMIT 1;
        """

        result = get_from_db_as_dict(query, (userId, moduleId), conn, cursor)

        if result:
            chatbotSession = result[0]
            chatbotSession['timestamp'] = chatbotSession['timestamp'].isoformat()
            return chatbotSession, 200

        newChatbotSession = createNewChatbotSession(userId, moduleId)
        return newChatbotSession, 200

    except Exception as error:
        conn.rollback()
        return errorMessage(str(error)), 500
    finally:
        if conn and conn.open:
            cursor.close()
            conn.close()

""" create a new chatbot session if one does not exist """
def createNewChatbotSession(userId, moduleId):
    try:
        conn = mysql.connect()
        cursor = conn.cursor()

        query = """
        INSERT INTO chatbot_sessions
        (userId, moduleId, totalTimeChatted, wordsUsed, totalWordsForModule, grade, termsUsed)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """

        # Change to camel case
        total_time_chatted = 0.0
        grade = 0.0
        wordsUsed = 0.0
        terms_used = json.dumps([])
        total_words_for_module = 0
        vals = (
            userId,
            moduleId,
            total_time_chatted,
            wordsUsed,
            total_words_for_module,
            grade,
            terms_used
        )

        postToDB(query, vals, conn, cursor)
        conn.commit()
        return {'chatbotSID': cursor.lastrowid}
    except Exception as error:
        conn.rollback()
        return errorMessage(str(error)), 500
    finally:
        if conn.open:
            cursor.close()
            conn.close()

# Updates how long a user has been chatting in the current session
def updateTotalTimeChatted(chatbotSID):
    try:
        conn = mysql.connect()
        cursor = conn.cursor()

        query = """
            UPDATE chatbot_sessions
            SET totalTimeChatted = TIMESTAMPDIFF(SECOND, timestamp, NOW()) / 60
            WHERE chatbotSID = %s;
        """

        postToDB(query, (chatbotSID,))
        conn.commit()
        return 200
    except Exception as error:
        conn.rollback()
        return errorMessage(str(error)), 500
    finally:
        if conn.open:
            cursor.close()
            conn.close()

# TODO
# get the chatbot_session belonging to chatbotSID, and take the value from the
# frontend to then (originalChatbotTime + newChatbotTime) = set totalTimeChatted
def updateChatGrade(chatbotSID, userId, moduleId, timeChatted):
    try:
        conn = mysql.connect()
        cursor = conn.cursor()

        # TODO: Update query to use time. this is stale.
        query = """
        UPDATE chatbot_sessions 
        SET termsUsed = %s
        WHERE userId = %s AND chatbotSID = %s AND moduleId = %s
        """

        postToDB(query, conn, cursor)
        conn.commit()
        return 200

    except Exception as error:
        conn.rollback()
        return errorMessage(str(error)), 500
    finally:
        if conn.open:
            cursor.close()
            conn.close()

def getPreviousTermsUsed(userId, chatbotSID):
    try:
        conn = mysql.connect()
        cursor = conn.cursor()
        
        query = """
        SELECT metadata FROM messages
        WHERE userId = %s AND chatbotSID = %s
        ORDER BY timestamp DESC
        LIMIT 1
        """

        result = get_from_db_as_dict(query, (userId, chatbotSID), conn, cursor)

        if result:
            return json.loads(result[0]["metadata"])  

        return None
    except Exception as error:
        conn.rollback()
        return errorMessage(str(error)), 500
    finally:
        if conn.open:
            cursor.close()
            conn.close()

















# ================================================
#
# conversaitionelle pt 2
#
# ================================================

# Returns the groupIDs of all active groups that the user belongs to
def getActiveTitoUserGroups(userId):
    try:
        # conn = mysql.connect()
        # cursor = conn.cursor()

        # Given a userID, see if the user is in an active group, store all groupIDs that are active
        # Should be faster on larger datasets, but may be negligent or slower in smaller cases
        query = """
            SELECT DISTINCT g.groupID
            FROM `group` g
            JOIN (
                SELECT gu.groupID
                FROM `group_user` gu
                WHERE gu.userID = %s
            ) AS gu ON g.groupID = gu.groupID
            JOIN `tito_module` tm ON g.groupID = tm.classID
            WHERE g.status = 'active';
        """

        result = getFromDB(query, (userId,))
        
        group_ids = []
        if result:
            for row in result:
                group_ids.append(row[0])

        return group_ids, 200

    except Exception as error:
        # conn.rollback()
        return errorMessage(str(error)), 500
    # finally:
    #     if conn.open:
    #         cursor.close()
    #         conn.close()


# TODO:
# include grammarRatings in response?
# Returns a JSON of messages from a user in a certain titoModule
#     {
#         "messageID": a_value, 
#         "source": a_value, 
#         "message": a_value, 
#         "timestamp": a_value, 
#         "voiceID": a_value
#     }
def loadModuleChatHistory(userID, moduleID):
    query = """
            SELECT m.messageID, m.source, m.message, m.timestamp, m.isVoiceMessage
            FROM `messages` m
            WHERE m.userID = %s AND m.moduleID = %s
            ORDER BY m.messageID ASC;
        """

    result = getFromDB(query, (userID, moduleID))

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

# Revoke any existing instances of chatbot sessions &
# Create new session for user
def createNewChatbotSession(userID, moduleID):
    conn = mysql.connect()
    cursor = conn.cursor()

    query_revoke_prev_sessions = """
            UPDATE `chatbot_sessions`
            SET activeSession = 0
            WHERE userID = %s;
        """

    cursor.execute(query_revoke_prev_sessions, (userID,))

    query_insert_new_session = """
            INSERT INTO `chatbot_sessions` (userID, moduleID, activeSession)
            VALUES (%s, %s, 1);
        """
    cursor.execute(query_insert_new_session, (userID, moduleID))
    chatbot_sid = cursor.lastrowid

    conn.commit()
    conn.close()

    return chatbot_sid

# Self-explanatory (F = inactive sesh, T = active sesh)
def checkChatbotSessionStatus(userID, moduleID, chatbotSID):
    query = """
            SELECT activeSession
            FROM chatbot_sessions
            WHERE userID = %s AND moduleID = %s AND chatbotSID = %s;
        """

    result = getFromDB(query, (userID, moduleID, chatbotSID))

    if not result or result[0][0] == 0:
        return False

    return True

def newMessage(userID, moduleID, chatbotSID, message, isVM):
    # Check for valid chatbot session
    is_valid_session = checkChatbotSessionStatus(userID, moduleID, chatbotSID)
    if not is_valid_session:
        return False

    query = """
        INSERT INTO `messages` (userID, chatbotSID, moduleID, source, message, isVoiceMessage)
        VALUES (%s, %s, %s, 'user', %s, %s);
    """

    postToDB(query, (userID, chatbotSID, moduleID, message, isVM))

    return True


def messageTito(userID, chatbotSID, message):
    return False

def evaluateGrammar(userID, chatbotSID, message):
    return False


def checkTermsUsed(userID, moduleID, chatbotSID, message):
    return False

# Returns a list of group_ids (classes) owned by this prof
def getProfessorClasses(userID):
    query = '''
        SELECT gu.groupID
        FROM group_user gu
        WHERE gu.userID = %s AND gu.accessLevel = 'pf';
    '''

    result = getFromDB(query, (userID,))

    group_ids = []

    for gID in result:
        group_ids.append(gID[0])

    return group_ids


# Returns pairs of termIDs with the term for a given module
def getModuleTerms(module_id):
    query = '''
        SELECT DISTINCT t.termID, t.front
        FROM module_question mq
        JOIN answer a ON mq.questionID = a.questionID
        JOIN term t ON a.termID = t.termID
        WHERE mq.moduleID = %s;
    '''

    result = getFromDB(query, (module_id,))

    # terms = []

    # # (termID, term)
    # for term in result:
    #     terms.append((term[0],term[1]))

    return result

def getMessageID(userID, moduleID, chatbotSID):
    query = """
            SELECT messageID
            FROM `messages`
            WHERE userID = %s AND moduleID = %s AND chatbotSID = %s
            ORDER BY timestamp DESC LIMIT 1;
        """
    result = getFromDB(query, (userID, moduleID, chatbotSID))
    if result:
        return result[0][0]  # Return the latest messageID
    return None

def storeVoiceMessage(userID, messageID, filename, chatbotSID):
    query = """
        INSERT INTO `tito_voice_message` (userID, messageID, filename, chatbotSID)
        VALUES (%s, %s, %s, %s);
    """
    
    postToDB(query, (userID, messageID, filename, chatbotSID))

def getVoiceMessage(userID, messageID):
    query = """
        SELECT filename
        FROM `tito_voice_message` t
        WHERE t.userID = %s AND t.messageID = %s;
    """

    result = getFromDB(query, (userID, messageID))
    if result:
        return result[0][0]
    return []

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


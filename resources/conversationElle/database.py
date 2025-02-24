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

def getMessages(userId, chatbotId):
    try:
        conn = mysql.connect()
        cursor = conn.cursor()

        query = """
        SELECT id, userId, chatbotId, moduleId, source, value, timestamp
        FROM messages
        WHERE userId = %s AND chatbotId = %s
        """

        result = get_from_db_as_dict(query, (userId, chatbotId), conn, cursor)

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


def insertMessages(userId, chatbotId, moduleId, userValue, llmValue):
    try:
        conn = mysql.connect()
        cursor = conn.cursor()

        query = """
        INSERT INTO messages (userId, chatbotId, moduleId, source, value)
        VALUES (%s, %s, %s, %s, %s)
        """
        messages = [
            (userId, chatbotId, moduleId, 'user', userValue),
            (userId, chatbotId, moduleId, 'llm', llmValue),
        ]

        cursor.executemany(query, messages)
        conn.commit()
        return {'message': "Message created successfully"}, 200

    except Exception as error:
        conn.rollback()
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
        terms_used = "[]"  # empty for now
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
        return {'chatbotId': cursor.lastrowid}
    except Exception as error:
        conn.rollback()
        return errorMessage(str(error)), 500
    finally:
        if conn.open:
            cursor.close()
            conn.close()

def updateChatGrade(chatbotId, userId, moduleId, grade):
    try:
        conn = mysql.connect()
        cursor = conn.cursor()

        # TODO: Update query
        query = """
        UPDATE chatbot_sessions 
        SET termsUsed = %s
        WHERE userId = %s AND chatbotId = %s AND moduleId = %s
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

# TODO
# Frontend will have the current "live" timeChatted, so when a user
# enters exit or save progress, the frontend needs to take the
# value they initilly had, and add the current new time chatted and send
# off to us.
def updateTotalTimeChatted(chatbotId, userId, moduleId, timeChatted):
    try:
        conn = mysql.connect()
        cursor = conn.cursor()

        # TODO: Update query to use time. this is stale.
        query = """
        UPDATE chatbot_sessions 
        SET termsUsed = %s
        WHERE userId = %s AND chatbotId = %s AND moduleId = %s
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

# TODO: Still unsure about insert messages --> LLM flow and updating terms used.
def UpdateTermsUsed(chatbotId, userId, moduleId, termData):
    try:
        conn = mysql.connect()
        cursor = conn.cursor()

        query = """
        UPDATE chatbot_sessions 
        SET termsUsed = %s
        WHERE userId = %s AND chatbotId = %s AND moduleId = %s
        """

        postToDB(query, (json.dumps(termData), userId, chatbotId, moduleId), conn, cursor)
        conn.commit()
        return 200

    except Exception as error:
        conn.rollback()
        return errorMessage(str(error)), 500
    finally:
        if conn.open:
            cursor.close()
            conn.close()

# test helper function to replicate what termsUsed looks like (module words the user
# has used and LLM marked as correct)
def getTermData(chatbotId, userId, moduleId):
    termData = {
        "userId": userId,
        "moduleId": moduleId,
        "chatbotId": chatbotId,
        "termsUsed": [
            {
                "termId": 1,
                "termName": "pans",
                "termModuleId": moduleId,
                "moduleName": "kitchen items",
                "timesUsed": 1
            },
            {
                "termId": 2,
                "termName": "knife",
                "termModuleId": moduleId,
                "moduleName": "kitchen items",
                "timesUsed": 2
            }
        ]
    }
    
    return termData


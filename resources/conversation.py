"""
    temporary location to store the database util functions to support
    creating a chatbot, inserting a chatbot, etc.
"""
from flask_restful import Resource
from flask_jwt_extended import (
    jwt_required,
)
from db import mysql
from db_utils import *
from utils import *
from exceptions_util import *
import json

def getMessages(userId, chatbotId):
    try:
        conn = mysql.connect()
        cursor = conn.cursor()

        query = """
        SELECT id, userId, chatbotId, moduleId, source, value, timestamp
        FROM messages
        WHERE userId = %s AND chatbotId = %s
        """
        result = getFromDB(query, (userId, chatbotId), conn, cursor)
        print(result)
        if not result:  
            return {"error": "No messages found for the given userId and chatbotId."}

        raise ReturnSuccess("Nice", 200)
    except CustomException as error:
        conn.rollback()
        return error.msg, error.returnCode
    except ReturnSuccess as success:
        conn.commit()
        return success.msg, success.returnCode
    except Exception as error:
        conn.rollback()
        return errorMessage(str(error)), 500
    finally:
        if conn.open:
            cursor.close()
            conn.close()

def insertMessage(userId, chatbotId, moduleId, source, value):
    try:
        conn = mysql.connect()
        cursor = conn.cursor()

        # chatbotCheckQuery = 'SELECT chatbotId FROM chatbot_sessions WHERE chatbotId = %s'
        # chatbotCheck = getFromDB(chatbotCheckQuery, (chatbotId), conn, cursor)

        query = """
        INSERT INTO messages (userId, chatbotId, moduleId, source, value)
        VALUES (%s, %s, %s, %s, %s)
        """
        postToDB(query, (userId, chatbotId, moduleId, source,
                                          value), conn, cursor)
        response = {
            "Message": "Successfully inserted message",
            "Data": {
                "userId": userId,
                "chatbotId": chatbotId,
                "moduleId": moduleId,
                "source": source,
                "value": value
            }
        }
        
        raise ReturnSuccess(response, 201)
    except CustomException as error:
        conn.rollback()
        return error.msg, error.returnCode
    except ReturnSuccess as success:
        conn.commit()
        return success.msg, success.returnCode
    except Exception as error:
        conn.rollback()
        return errorMessage(str(error)), 500
    finally:
        if conn.open:
            cursor.close()
            conn.close()

def updateChatbot(chatbotId, userId, moduleId, termData):
    try:
        conn = mysql.connect()
        cursor = conn.cursor()

        query = """
        UPDATE chatbot_sessions 
        SET termsUsed = %s
        WHERE userId = %s AND chatbotId = %s AND moduleId = %s
        """
        results = updateDB(query, (json.dumps(termData), userId, chatbotId, moduleId), conn, cursor)
        print(results)


        raise ReturnSuccess("Update", 200)
    except CustomException as error:
        conn.rollback()
        return error.msg, error.returnCode
    except ReturnSuccess as success:
        conn.commit()
        return success.msg, success.returnCode
    except Exception as error:
        conn.rollback()
        return errorMessage(str(error)), 500
    finally:
        if conn.open:
            cursor.close()
            conn.close()

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


"""fetch an existing chatbot session from the database"""
def getChatbotSession(userId, moduleId):
    try:
        conn = mysql.connect()
        cursor = conn.cursor()

        query = """
        SELECT * FROM chatbot_sessions
        WHERE userId = %s AND moduleId = %s
        ORDER BY createdAt DESC
        LIMIT 100
        """
        print("*******************************************************")
        print("Chatbot got")
        print("******************************************************* \n")
        result = getFromDB(query, (userId, moduleId), conn, cursor)

        print("Query Result:")
        if result:
            columns = [desc[0] for desc in cursor.description]  
            print(f"{' | '.join(columns)}")
            print("-" * (len(columns) * 20))  

            for row in result:
                formatted_row = ' | '.join(str(cell).ljust(20) for cell in row)
                print(formatted_row)
        else:
            print("No sessions found")

        raise ReturnSuccess({"Message:" : "Chatbot successfully retrieved"}, 200)
    except CustomException as error:
        if conn:
            conn.rollback()
        return error.msg, error.returnCode
    except ReturnSuccess as success:
        return success.msg, success.returnCode
    except Exception as error:
        if conn:
            conn.rollback()
        return errorMessage(str(error)), 500
    finally:
        if conn and conn.open:
            cursor.close()
            conn.close()

"""create a new chatbot session if one does not exist."""
def createNewChatbotSession(userId, moduleId):
    try:
        conn = mysql.connect()
        cursor = conn.cursor()
        query = """
        INSERT INTO chatbot_sessions
        (userId, moduleId, totalTimeChatted, wordsUsed, totalWordsForModule, grade, termsUsed)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """

        total_time_chatted = 0.0
        grade = 0.0
        wordsUsed = 0.0
        terms_used = "[]"  # empty for now
        total_words_for_module = 10
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

        print("*******************************************************")
        print("New chatbot session created successfully")
        print('Insert ID:', cursor.lastrowid)
        print("******************************************************* \n")

        # Return the inserted ID
        raise ReturnSuccess({"insert_id": cursor.lastrowid}, 201)

    except CustomException as error:
        conn.rollback()
        return error.msg, error.returnCode
    except ReturnSuccess as success:
        conn.commit()
        return success.msg, success.returnCode
    except Exception as error:
        conn.rollback()
        return errorMessage(str(error)), 500
    finally:
        if conn.open:
            cursor.close()
            conn.close()

class ChatbotSessions(Resource):
    def post(self):
        # create a new chatbot for a given userId and moduleId
        userId = 2
        moduleId = 3
        chatbotSession = createNewChatbotSession(userId, moduleId)
        return chatbotSession
    
    def get(self):
        # get an existing chatbot based on userId and moduleId
        userId = 2
        moduleId = 3
        chatbotSession = getChatbotSession(userId, moduleId)
        return chatbotSession

    def patch(self):
        # update a chatbot with a new set of terms used(just for example)
        userId = 2
        # test what happens if we send values that dont exitst
        chatbotId = 2222
        value = 'I want to learn about kitchen items like pans, pots, and knifes.'
        moduleId = 3
        newTermsUsedByUser = getTermData(chatbotId, userId, moduleId)
        res = updateChatbot(chatbotId, userId, moduleId, newTermsUsedByUser)
        return res


class Messages(Resource):
    def get(self):
        # retrieve messages for a given session --> Idea, we need a way to get 1, 10, or max number of messages. maybe the frontned tells us.
        userId = 3333
        chatbotId = 2
        res = getMessages(userId, chatbotId)
        return res

    def post(self):
        # save a new message in the conversation && call llm? save both to db.
        userId = 37373
        chatbotId = 23383
        value = 'I want to learn about kitchen items like pans, pots, and knifes.'
        moduleId = 2
        message = insertMessage(userId, chatbotId, moduleId, 'user', value)

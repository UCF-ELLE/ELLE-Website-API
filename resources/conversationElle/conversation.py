import csv, io
from flask import Response, request, jsonify
from flask_restful import Resource
from flask_jwt_extended import jwt_required
from .database import * 
from .llm_functions import *
from .utils import *

class ChatbotSessions(Resource):
    @jwt_required
    def post(self):
        data = request.get_json()
        userId = data.get('userId')
        moduleId = data.get('moduleId')
        terms = data.get('terms')

        try:
            chatbotSession, statusCode = getChatbotSession(userId, moduleId)
            chatbotSession = {
                "chatbotId": chatbotSession.get("chatbotId"),
                "termsUsed": chatbotSession.get("termsUsed"),
            }
            
            #userBackground, userMusicChoice = getUserBackgroundandMusic(terms)
            
            #print("Background: ", userBackground)
            #print("Music: ", userMusicChoice)

            '''
            response = jsonify({
                "chatbotSession": chatbotSession,
                "userBackground": userBackground,
                "userMusicChoice": userMusicChoice
            })
            '''
            jsonify(chatbotSession)
            return chatbotSession, statusCode
        except Exception as error:
            print(f"Error: {str(error)}")
            return {"error": "error"}, 500

class Messages(Resource):
    @jwt_required
    def get(self):
        userId = request.args.get('userId')
        chatbotId = request.args.get('chatbotId')

        try:
            messages, statusCode = getMessages(userId, chatbotId)
            data = [
                {
                    "source": msg.get('source'), 
                    "value": msg.get('value'), 
                    "timestamp": msg.get('timestamp'),
                    "metadata": msg.get('metadata'),
                }
                for msg in messages
            ]
            
            jsonify(data)

            return data, statusCode
        except Exception as error:
            print(f"Error: {str(error)}")
            return {"error": "error"}, 500

    @jwt_required
    def post(self):
        data = request.get_json()  
        userId = data.get('userId')
        chatbotId = data.get('chatbotId')
        moduleId = data.get('moduleId')
        userValue = data.get('userValue')
        #termsUsed = data.get('termsUsed') # list of strings of words used
        terms = data.get('terms') # vocab list list

        try:
            llmValue = handle_message(userValue)
            
            print("LLM output in backend: ", llmValue)
            
            # response from LLM
            llmResponse = llmValue['response']
            llmScore = llmValue['score']

            if not llmValue:
                return jsonify({"error": "Failed to generate LLM response"}), 500

            # print("userValue: ", userValue)
            #print("termsUsed: ", termsUsed)
            # print("terms: ", terms)
            # convert terms list of dictionaries to list
            # query metadata for existing list of words
            # termsUsed = count_words(userValue, termsUsed)
            # termsUsedList = vocab_dict_to_list(termsUsed)
            # print("termsUsed: ", termsUsed)
            # print("termsUsedList: ", termsUsedList)
            
            termsUsed = []
            # previousTermsUsed = getPreviousTermsUsed(userId, chatbotId)

            metadata, statusCode = insertMessages(userId, chatbotId, moduleId, userValue, llmValue, termsUsed)

            data = {
                "llmResponse": llmResponse,
                "termsUsed": termsUsed,
                "titoConfused": True if llmScore < 6 else False,
                "metadata": metadata
            }

            jsonify(data)
            return data, statusCode

        except Exception as error:
            print(f"Error: {str(error)}")
            return {"error": "error"}, 500

class UpdateChatTime(Resource):
    @jwt_required
    def post(self):
        data = request.get_json()  
        userId = data.get('userId')
        chatbotId = data.get('chatbotId')
        prevTimeChatted = data.get('prevTimeChatted')
        newTimeChatted = data.get('newTimeChatted')

        try:
            statusCode = updateChatGrade(chatbotId, userId, prevTimeChatted, newTimeChatted)
            return statusCode
        except Exception as error:
            print(f"Error: {str(error)}")
            return {"error": "error"}, 500

class ExportChatHistory(Resource):
    @jwt_required
    def post(self):
        data = request.get_json()  
        userId = data.get('userId')
        chatbotId = data.get('chatbotId')

        try:
            messages, statusCode = getMessages(userId, chatbotId)
            print(statusCode)

            data = [
                {
                    "source": msg.get('source', ''), 
                    "value": msg.get('value', ''), 
                    "timestamp": msg.get('timestamp', ''),
                    "metadata": json.dumps(msg.get('metadata', {}))
                }
                for msg in messages
            ]

            # create an in-memory buffer for csv
            csv_buffer = io.StringIO()
            csv_writer = csv.writer(csv_buffer)
            
            # write csv header
            csv_writer.writerow(["timestamp", "source", "value", "metadata"])

            # write the data in
            for msg in data:
                csv_writer.writerow([
                    msg["timestamp"],
                    msg["source"],
                    msg["value"],
                    msg["metadata"]  
                ])

            response = Response(csv_buffer.getvalue(), mimetype="text/csv")
            response.headers["Content-Disposition"] = "attachment; filename=chat_history.csv"

            return response
        except Exception as error:
            print(f"Error: {str(error)}")
            return {"error": "error"}, 500

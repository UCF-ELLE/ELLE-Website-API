from flask import request, jsonify
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
            
            print(data)

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
        termsUsed = data.get('termsUsed')

        try:
            llmValue = handle_message(userValue)
            
            print("LLM output in backend: ", llmValue)
            
            # response from LLM
            llmResponse = llmValue['response']
            llmScore = llmValue['score']

            if not llmValue:
                return jsonify({"error": "Failed to generate LLM response"}), 500

            # dictionary version with counts
            termsUsed = count_words(userValue, termsUsed)
            # convert to list for frontend
            termsUsedList = vocab_dict_to_list(termsUsed)

            #termsUsed = []

            #TODO: try except with statusCode
            statusCode = insertMessages(userId, chatbotId, moduleId, userValue, llmValue, termsUsed)

            data = {
                "llmResponse": llmResponse,
                "termsUsed": termsUsedList,
                "titoConfused": True if llmScore < 6 else False,
                "metadata": metadata
            }
            
            print("Data: ", data)
            print(statusCode)

            jsonify(data)
            return data

        except Exception as error:
            print(f"Error: {str(error)}")
            return {"error": "error"}, 500

# TODO: Remove
class UpdateChatGrade(Resource):
    @jwt_required
    def patch(self, chatbotId):
        userId = 2
        moduleId = 3
        grade = 10
        res = updateChatGrade(chatbotId, userId, moduleId, grade)
        return res

class UpdateChatTime(Resource):
    # TODO: Finish updating query for this one.
    @jwt_required
    def patch(self, chatbotId):
        userId = 2
        moduleId = 3
        res = updateTotalTimeChatted(chatbotId, userId, moduleId, 10)
        return res

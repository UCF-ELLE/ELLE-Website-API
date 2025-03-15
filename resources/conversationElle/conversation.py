from flask import request, jsonify
from flask_restful import Resource
from flask_jwt_extended import jwt_required
from .database import * 
# from .llm import *

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

            # various helper funcs imported from /llm/...
            # syncVocabListWithLLM(terms)
            # userBackground = getUserBackground()
            # userMusicChoice = getUserMusicChoice()
            # response = jsonify({
            #     "chatbotSession": chatbotSession,
            #     "userBackground": userBackground,
            #     "userMusicChoice": userMusicChoice
            # })
            # return response, statusCode

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
                {"source": msg.get('source'), "value": msg.get('value'), 
                 "timestamp": msg.get('timestamp')}
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

        try:
            # We would need to import these from the LLM helper libraries
            # currently mocking with dummy value below
            # llmValue = getLLMResponse(value)
            llmValue = "LLM response is currently WIP"

            if not llmValue:
                return jsonify({"error": "Failed to generate LLM response"}), 500

            # termsUsed = array of strings (of used words)
            # termsUsed = checkTermsUsedLLM(termsUsed)

            # checkAnalyticsLLM() -> this is the analytics feedback, needs to upload data DB after.
            termsUsed = ["apple", "blueberry"]

            statusCode = insertMessages(userId, chatbotId, moduleId, userValue, llmValue)

            data = {
                "llmResponse": llmValue,
                "termsUsed": termsUsed
            }

            jsonify(data)
            return data, statusCode

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

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
        termsUsed = data.get('termsUsed')
        print(termsUsed)

        try:
            chatbotSession, statusCode = getChatbotSession(userId, moduleId)
            chatbotSession = {
                "chatbotId": chatbotSession.get("chatbotId"),
                "termsUsed": chatbotSession.get("termsUsed"),
            }

            # various helper funcs imported from /llm/...
            # syncVocabListWithLLM(termUsed)
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

            # termsUsed = array of the termIds
            # termsUsed = checkTermsUsedLLM(termsUsed)
            # checkGrammarGrade() -> this is the analytics feedback, needs to upload to DB after.
            # but the frontend is not getting this information.
            termsUsed = [1, 2, 3]

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

        # Comments below are all TODO:
        # insertMessage(userId, chatbotId, moduleId, 'llm', llmValue)

        # if the user enters a word in the vocab list, and the llm says they
        # used it correctly, we need to update the chatbot_session with:
        # termsUsed json with the new words, update their grade, and wordsUsed.
        # something like: checkIfVocabWasUsed()

        # the LLM will also give us: responseScore: which we need to attach to
        # each message?, as we will be showing this to the user.

# TODO: think we may not need to update the "grade" from the frontend -> assuming the grade is wordsUsed/totalWords(we can just do this from backend)
# so we can potentially just remove this endpoint
class UpdateChatGrade(Resource):
    # API: PUT/PATCH: elleapi/chat/chatbot/<int:chatbotId>/grade")
    # Updates a chatbot session grade based on userId, chatbotId, and moduleId
    # TODO: Finish updating query for this one.
    @jwt_required
    def patch(self, chatbotId):
        userId = 2
        moduleId = 3
        grade = 10
        res = updateChatGrade(chatbotId, userId, moduleId, grade)
        return res

class UpdateChatTime(Resource):
    # API: PUT/PATCH: elleapi/chat/chatbot/<int:chatbotId>/time")
    # Updates a chatbot session grade based on userId, chatbotId, and moduleId
    # TODO: Finish updating query for this one.
    @jwt_required
    def patch(self, chatbotId):
        userId = 2
        moduleId = 3
        res = updateTotalTimeChatted(chatbotId, userId, moduleId, 10)
        return res

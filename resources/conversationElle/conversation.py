from flask import request, jsonify
from flask_restful import Resource
from flask_jwt_extended import jwt_required
from .database import * 

class ChatbotSessions(Resource):
    # get an existing chatbot session based on userId and moduleId
    # if the chatbot session does not exist for a given module, it creates it.
    # API: GET elleapi/chat/chatbot?userID=${userId}&moduleID=${moduleId}
    # @jwt_required
    def get(self):
        userId = request.args.get('userId')
        moduleId = request.args.get('moduleId')

        try:
            chatbotSession, statusCode = getChatbotSession(userId, moduleId)
            jsonify(chatbotSession)
            return chatbotSession, statusCode
        except Exception as error:
            print(f"Error: {str(error)}")
            return {"error": "error"}, 500

class Messages(Resource):
    # retrieves all messages for a given chatbot session 
    # API: GET elleapi/chat/messages?userId=${userId}&chatbotId=${chatbotId}
    @jwt_required
    def get(self):
        userId = request.args.get('userId')
        chatbotId = request.args.get('chatbotId')

        try:
            messages, statusCode = getMessages(userId, chatbotId)
            jsonify(messages)
            return messages, statusCode
        except Exception as error:
            print(f"Error: {str(error)}")
            return {"error": "error"}, 500

    # save a new message in the conversation based on userId and chatbotId
    # API: POST elleapi/chat/messages
    @jwt_required
    def post(self):
        try:
            moduleId = 1
            userId = 2
            chatbotId = 1
            value = "I want to cook with pans"
            res = insertMessage(userId, chatbotId, moduleId, 'user', value)
            jsonify(res)
            return res, 200
        except Exception as error:
            print(f"Error: {str(error)}")
            return {"error": "error"}, 500

        # insertMessage(userId, chatbotId, moduleId, 'llm', llmValue)
        # Comments below are all TODO:
        # getLLMResponse(userMessage): if successfull: insert both into DB
        # insertMessage(userId, chatbotId, moduleId, 'user', value)
        # insertMessage(userId, chatbotId, moduleId, 'llm', value)

        # if the user enters a word in the vocab list, and the llm says they
        # used it correctly, we need to update the chatbot_session with:
        # termsUsed json with the new words, update their grade, and wordsUsed.
        # something like: checkIfVocabWasUsed()

        # the LLM will also give us: responseScore: which we need to attach to
        # each message?, as we will be showing this to the user.

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

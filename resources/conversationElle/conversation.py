from flask import request, jsonify
from flask_restful import Resource
from flask_jwt_extended import jwt_required
from .database import * 
# from .llm import *

class ChatbotSessions(Resource):
    # get an existing chatbot session based on userId and moduleId, if the chatbot session does not exist for a given module, it creates it.
    # API: POST elleapi/chat/chatbot
    # @jwt_required
    def post(self):
        data = request.get_json()
        userId = data.get('userId')
        moduleId = data.get('moduleId')

        try:
            chatbotSession, statusCode = getChatbotSession(userId, moduleId)

            # various helper funcs imported from /llm/...
            # syncVocabListWithLLM()
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
    # retrieves all messages for a given chatbot session 
    # API: GET elleapi/chat/messages?userId=${userId}&chatbotId=${chatbotId}
    # @jwt_required
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
    # @jwt_required
    def post(self):
        data = request.get_json()  
        userId = data.get('userId')
        chatbotId = data.get('chatbotId')
        moduleId = data.get('moduleId')
        userValue = data.get('userValue')

        try:
            # We would need to import these from the LLM helper libraries
            # llmValue = getLLMResponse(value), currently mocking with dummy value below
            llmValue = "LLM response is currently WIP"

            if not llmValue:
                return jsonify({"error": "Failed to generate LLM response"}), 500

            # wordsUsed, grammarGrade = processLLMValue() --> This is how we get wordsUsed, grammar grade, etc.
            wordsUsed = "test1, test2, test3"

            statusCode = insertMessages(userId, chatbotId, moduleId, userValue, llmValue)

            data = {
                "llmResponse": llmValue,
                "wordsUsed": wordsUsed
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

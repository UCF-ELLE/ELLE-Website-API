import csv, io
from flask import Response, request, jsonify, send_file
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt_claims
# from .config import free_prompt
from .database import * 
from werkzeug.utils import secure_filename
import os
# from .llm_functions import *
# from .utils import *

# Relative to the FLASK START POINT!!!
RELATIVE_UPLOAD_PATH = 'user_audio_files/'


# Check if user can access TWT (Must be enrolled in an active class AND assigned a Tito Module)
class TitoAccess(Resource):
    @jwt_required
    def get(self):
        '''
            Requires server permission to be able to use Talking with Tito (TWT)
                - Only student users may use TWT currently for simplicity of management
                - Returns active, tito-enabled, groups/classes where student is enrolled in 
        '''
        try:
            user_id = get_jwt_identity()
            claims = get_jwt_claims()
            user_permission = claims.get("permission")

            if user_permission != "st":
                return create_response(False, message="User is not a student.", status_code=403)
                
            group_ids, status_code = getActiveTitoUserGroups(user_id)

            if status_code != 200:
                return create_response(False, message="Error fetching user groups", status_code=status_code)

            return create_response(True if group_ids else False, data=group_ids) 

        except Exception as e:
            print(f"Error occurred: {e} when trying to access TitoAccess @ conversationelle")
            return create_response(False, message="Internal server error. Please try again later.", error=str(e), status_code=500) 
 
# Creates a new TWT session for the current user AND module
class ChatbotSessions(Resource):
    @jwt_required
    def post(self):
        '''
            Enables a user to chat with Tito
            Returns a chatbotSID
        '''
        user_id = get_jwt_identity() 
        claims = get_jwt_claims()
        user_permission = claims.get("permission")


        if user_permission != "st":
            return create_response(False, message="user is not a student.", status_code=403)

        data = request.get_json()
        module_id = data.get("moduleID") # the module selected by user

        return create_response(True, message="Chatbot session created.", data=createNewChatbotSession(user_id, module_id))

# Ability to send messages should block until receiving back a response
# stores message to DB and Tito AI
    # Returns response from Tito
class Messages(Resource):
    @jwt_required
    def post(self):
        '''
            Sends a single message to the server
            Returns the messageID of the newly received message for use
        '''
        user_id = get_jwt_identity() 

        data = request.get_json()
        module_id = data.get('moduleID') 
        session_id = data.get('chatbotSID') 
        message = data.get('message') 
        is_vm = data.get('isVoiceMessage') 

        # Attempts to add message to DB, no error, success
        if not newMessage(user_id, module_id, session_id, message, is_vm):
            return create_response(False, message="Failed to send message. User has an invalid session.", status_code=400, resumeMessaging=True)

        # TODO:
        # Update module words used =>
        # Send message to tito
        # Async grammar evaluation
        
        updateTotalTimeChatted(session_id)

        return create_response(True, message="Message sent.", data=message, resumeMessaging=True, messageID=getMessageID(user_id, module_id, session_id), titoResponse="To be implemented.")

    # TODO:
    # Organize JSON response
    @jwt_required
    def get(self):
        '''
            Returns chat history of a user for a given moduleID in ascending order (1 -> N)
            TODO: to be worked on?
        '''
        user_id = get_jwt_identity() 
        claims = get_jwt_claims()
        user_permission = claims.get("permission")

        if user_permission != 'st':
            create_response(False, message="User is not a student.", status_code=403)

        data = request.get_json()
        module_id = request.args.get('moduleID')
        return create_response(True, message="Retrieved chat history.", data=loadModuleChatHistory(user_id, module_id)) 


class UserAudio(Resource):
    @jwt_required
    def post(self):
        '''
            Uploads a user voice message associated to a message to the server
            filename pattern -> {classID}_{userID}_{messageID}
                in order to avoid file collisions and neater FS access
            TODO: 
        '''
        user_id = get_jwt_identity()
        data = request.form
        message_id = data.get('messageID')
        chatbot_sid = data.get('chatbotSID')
        class_id = data.get('classID')

        if not message_id or not chatbot_sid or not class_id:
            return create_response(False, message="Failed to upload. Missing messageID, chatbotSID or classID.", status_code=400) 

        audio_file = request.files.get('audio')
        print(f"received {audio_file}")

        # Points of failure to accept files
        # TODO: Decide on which implementation to fail to accept file (both?)
        # if not audio_file or not audio_file.filename.endswith(".webm") or audio_file.mimetype != "audio/webm":
        if not audio_file or not audio_file.filename.endswith(".webm"):
            return create_response(False, message="Failed to upload. Improper/no file provided.", status_code=415)

        # Saving the file to fs
        filename = f"{class_id}_{user_id}_{message_id}.webm"
        filename = secure_filename(filename) # precautionary, but maybe disable?
        if not filename:
            return create_response(False, message="Failed to upload. Error in creating filename.", status_code=500)
        
        user_path = os.path.join(RELATIVE_UPLOAD_PATH, str(class_id), str(user_id))
        if not os.path.exists(user_path):
            os.makedirs(user_path) 

        file_path = os.path.join(user_path, filename)
        try:
            audio_file.save(file_path)
        except Exception as e:
            return create_response(False, message=f"Failed to save audio file: {str(e)}", status_code=500)

        storeVoiceMessage(user_id, message_id, filename, chatbot_sid)

        # TODO: Create a way to test if file actually written, maybe search up the file and see if not NONE
        # if not voice_message_id:
        #     return create_response(False, message="Failed to store voice message.", status_code=500) 

        return create_response(True, message="Audio message uploaded successfully.")

    @jwt_required
    def get(self):
        '''
            Returns a single audio file of name {classID}_{userID}_{messageID}.webm
            Expects ?classID={id_here1}&messageID={id_here2}

            TODO: check if user is allowed to make the request
        '''
        user_id = get_jwt_identity() 
        claims = get_jwt_claims()
        user_permission = claims.get("permission")

        if user_permission != 'st':
            create_response(False, message="User is not a student.", status_code=403)

        class_id = request.args.get('classID')
        message_id = request.args.get('messageID')

        if not class_id or not message_id:
            return create_response(False, message="Missing required query parameters.", status_code=400)

        filename = getVoiceMessage(user_id, message_id)

        file_path = os.path.join(RELATIVE_UPLOAD_PATH, str(class_id), str(user_id), filename)
        if not os.path.exists(file_path):
            return create_response(False, message="File does not exist.", status_code=404)

        return send_file(file_path, mimetype="audio/webm")


# Unsure if needed as an API
class ModuleTerms(Resource):
    @jwt_required
    def get(self):
        '''
            Fetches all terms associated to a given moduleID
            TODO: error handling when moduleID doesnt exist
        '''
        module_id = request.args.get('moduleID')
        if not module_id:
            return create_response(False, message="improper moduleID given.", status_code=403)

        return create_response(True, message=f"Retrieved module terms from module {module_id}", data=getModuleTerms(module_id))




class GetMessages(Resource):
    @jwt_required
    def get(self):
        '''
            For professors to fetch messages of a student?
            TODO:
        '''
        return


# For Profs
class Classes(Resource):
    @jwt_required
    def get(self):
        '''
            Gets a professors owned classes
        '''
        user_id = get_jwt_identity() 
        claims = get_jwt_claims()
        user_permission = claims.get("permission")

        if user_permission == 'pf':
            return create_response(True, data=getProfessorClasses(user_id))
        else:
            return create_response(False, message="User is not a professor.", status_code=403)
 

# Deprecated for now, unused?
# class ExportChatHistory(Resource):
#     @jwt_required
#     def post(self):
#          data = request.get_json()  
#          userId = data.get('userId')
#          chatbotSID = data.get('chatbotSID')
 
#          try:
#              messages, statusCode = getMessages(userId, chatbotSID)
#              print(statusCode)

#              data = [
#                  {
#                      "source": msg.get('source', ''), 
#                      "value": msg.get('value', ''), 
#                      "timestamp": msg.get('timestamp', ''),
#                      #"metadata": json.dumps(msg.get('metadata', {}))
#                  }
#                  for msg in messages
#              ]

#              data = convert_messages_to_csv(messages, data)

#              # create an in-memory buffer for csv
#              csv_buffer = io.StringIO()
#              csv_writer = csv.writer(csv_buffer)

#              header_row = list(data[len(data)-1].keys())
             
#              # write csv header
#              csv_writer.writerow(header_row)
             
#              # write the data in
#              for msg in data:
#                 row = []
#                 for key, value in msg.items():
#                     row.append(value)
#                 csv_writer.writerow(row)
 
#              response = Response(csv_buffer.getvalue(), mimetype="text/csv")
#              response.headers["Content-Disposition"] = "attachment; filename=chat_history.csv"
 
#              return response
#          except Exception as error:
#              print(f"Error: {str(error)}")
#              return {"error": "error"}, 500

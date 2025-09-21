import csv, io
from flask import Response, request, jsonify, send_file
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt_claims
# from .config import free_prompt
from config import MAX_AUDIO_SIZE_BYTES, MAX_AUDIO_LENGTH_SEC
from .database import * 
from .spacy_service import add_message
import os
from pydub import AudioSegment
# from .llm_functions import *
# from .utils import *

USER_VOICE_FOLDER = "user_audio_files/"

# ======================================
# ++++++ STUDENT ACCESS ONLY APIs ++++++
# ======================================

# TODO: Free chat AND module-based chats to be worked on

# Check if user can access TWT (Must be enrolled in an active class AND assigned a Tito Module)
class TitoAccess(Resource):
    @jwt_required
    def get(self):
        '''
        /elleapi/twt/session/access
            Requires server permission to be able to use Talking with Tito (TWT)
                - Only student users may use TWT currently for simplicity of management
                - Returns: active, tito-enabled, groups/classes where student is enrolled in 
                    A (?) list of tuples [(classID, [(tito_module_id, sequence_id)])]
                    EX  [
                            (
                                class_id=1,
                                [
                                    (module_id_1, sequence_id_x),
                                    (module_id_2, sequence_id_y),
                                    ...
                                    (module_id_N, sequence_id_z),
                                ]


                        ]
            TODO: Error Handling
        '''
        
        try:
            user_perms = get_jwt_claims().get("permission")
            if not validate_user(permission_claim=user_perms, req_student_perm=True):
                return create_response(False, message="User has invalid permissions to access this resource.", status_code=403)
            user_id = get_jwt_identity()
            
            class_ids = getClasses(user_id, user_perms)
            if not class_ids:
                return create_response(success=False, message="User is not enrolled in any classes.", status_code=403)
            
            tito_modules = []
            is_valid_user = False
            counter = 0
            for class_id in class_ids:
                res = getTitoModules(class_id)
                if res:
                    is_valid_user = True
                tito_modules.append((class_id[0], res))

            if not is_valid_user:
                return create_response(message="User not enrolled in valid tito_modules.", status_code=403)
            return create_response(True, data=tito_modules) 
        except Exception as e:
            print(f"Error occurred: {e} when trying to access TitoAccess @ conversation.py")
            return create_response(False, message="Internal server error. Please try again later.", error=str(e), status_code=500) 
 
# Creates a new TWT session for the current user AND module
class ChatbotSessions(Resource):
    @jwt_required
    def post(self):
        '''
        /elleapi/twt/session/create
            Enables a user to chat with Tito
            Returns a chatbotSID
        '''
        if not validate_user(permission_claim=get_jwt_claims().get("permission"), req_student_perm=True):
            return create_response(False, message="User has invalid permissions to access this resource.", status_code=403)
        user_id = get_jwt_identity()

        data = request.get_json()
        module_id = data.get("moduleID")
        class_id = data.get("classID")
        
        if not isTitoModule(class_id, module_id):
            return create_response(success=False, message="Chatbot session failed to be created.", status_code=403)
        return create_response(True, message="Chatbot session created.", data=createNewChatbotSession(user_id, module_id))

# NOTE: Ability to send messages should block until receiving back a response
# stores message to DB and Tito AI And Returns response from Tito
class UserMessages(Resource):
    @jwt_required
    def post(self):
        '''
        /elleapi/twt/session/messages
            Sends a single message to the server
            Returns the messageID of the newly received message for use
        '''
        if not validate_user(permission_claim=get_jwt_claims().get("permission"), req_student_perm=True):
            return create_response(False, message="User has invalid permissions to access this resource.", status_code=403)
        user_id = get_jwt_identity()

        data = request.get_json()
        message = data.get('message')
        session_id = data.get('chatbotSID')
        module_id = data.get('moduleID')

        # Attempts to add message to DB, no error, success returns msg_id
        new_msg_id = newUserMessage(userID=user_id, moduleID=data.get('moduleID'),chatbotSID=session_id, message=message, isVM=data.get('isVoiceMessage'))
        if not new_msg_id:
            return create_response(False, message="Failed to send message. User has an invalid session.", status_code=400, resumeMessaging=True)

        updateTotalTimeChatted(session_id)

        # Send to spacy service to parse key terms
        add_message(message, module_id, user_id, new_msg_id)

        # TODO:
        # Update module words used =>
        # Async grammar evaluation

        # Sends a message to tito with safety check
        # tito_response = ''
        # try:
        #     try:
        #         safety_check = detect_innapropriate_language(message)
        #         if safety_check.get('is_appropriate', False):
        #             tito_response_data = {'response': "I can't respond to that type of message. Let's keep the conversation educational and appropriate"}
        #         else:
        #             tito_response_data = handle_message(message)
        #     except Exception as safety_error:
        #         print(f"Safety check failed: {safety_error}")
        #         tito_response_data = handle_message(message)
            
        #     tito_response = tito_response_data.get('response', "Sorry, I could not understand your message. Please try again!")
            
        #     # TODO: Verify data
        #     newTitoMessage(user_id, session_id, tito_response_data)

        # except Exception as error:
        #     print(f"Error communicating with Tito: {error}")
        #     tito_response = "Sorry, there is a bit of trouble. Please try again!"
        #     tito_response_data = {"response": tito_response}

        if True: # a successful llm message insert
            return create_response(True, message="Message sent.", data=message, resumeMessaging=True, messageID=new_msg_id, titoResponse="To be implemented.")
        else: 
            return 

    @jwt_required
    def get(self):
        '''
        /elleapi/twt/session/messages
            Returns chat history of a user for a given moduleID in ascending order (1 -> N)
            TODO: to be worked on?
        '''
        if not validate_user(permission_claim=get_jwt_claims().get("permission"), req_student_perm=True):
            return create_response(False, message="User has invalid permissions to access this resource.", status_code=403)
        user_id = get_jwt_identity()

        try:
            data = request.get_json()
            module_id = request.args.get('moduleID')
            return create_response(True, message="Retrieved chat history.", data=loadModuleChatHistory(user_id, module_id)) 
        except Exception as e:
            print("[ERROR] In UserMessages @ conversation.py")
            return create_response(False, message="Failed to retrieve user's messages. Error: {e}", status_code=504)

class UserAudio(Resource):
    @jwt_required
    def post(self):
        '''
        /elleapi/twt/session/audio
            Uploads a user voice message associated to a message to the server
            NOTE: File must be < 3MB AND < 90 seconds long
            filename pattern -> {userID}_{messageID}.webm
            File-system pattern ~/class_id/module_id/user_id/"user_id_message_id.webm"
            
            TODO: Audio parsing

        curl -X POST http://127.0.0.1:5050/elleapi/twt/session/audio \
        -H "Authorization: Bearer {JWT_HERE}" \
        -F "messageID=291" \
        -F "chatbotSID=80" \
        -F "classID=1" \
        -F "moduleID=1" \
        -F "audio=@1.webm"
        '''
        if not validate_user(permission_claim=get_jwt_claims().get("permission"), req_student_perm=True):
            return create_response(False, message="User has invalid permissions to access this resource.", status_code=403)
        user_id = get_jwt_identity()

        data = request.form
        message_id = data.get('messageID')
        chatbot_sid = data.get('chatbotSID')
        class_id = data.get('classID')
        module_id = data.get("moduleID")

        if not message_id or not chatbot_sid or not class_id or not module_id:
            return create_response(False, message="Failed to upload. Missing required parameters.", status_code=400) 
        if is_duplicate_audio_upload(user_id, message_id):
            return create_response(False, message="User already has uploaded an audio file for this message.", status_code=403)

        audio_file = request.files.get('audio')
        print(audio_file.content_length)
        print(audio_file.read())  # just to peek at the bytes
        audio_file.seek(0)
        if not audio_file:
            return create_response(False, message="Audio file not received.", status_code=400)
        audio_file.seek(0, 2)
        size_bytes = audio_file.tell()
        audio_file.seek(0)

        if size_bytes > MAX_AUDIO_SIZE_BYTES:
            return create_response(False, message="Failed to upload, file too large.", status_code=400)
        
        audio = AudioSegment.from_file(audio_file)
        if len(audio) / 1000.0 > MAX_AUDIO_LENGTH_SEC:
            return create_response(False, message="Failed to store audio, file too long.", status_code=400)

        # Points of failure to accept files
        # TODO: Decide on which implementation to fail to accept file (both?)
        # if not audio_file or not audio_file.filename.endswith(".webm") or audio_file.mimetype != "audio/webm":
        if not audio_file.filename.endswith(".webm"):
            return create_response(False, message="Failed to upload. Improper file provided.", status_code=415)

        # Saving the file to fs
        filename = f"{user_id}_{message_id}.webm"
        
        user_path = os.path.join(USER_VOICE_FOLDER, str(class_id), str(module_id), str(user_id))
        os.makedirs(user_path, exist_ok=True)

        file_path = os.path.join(user_path, filename)
        try:
            audio_file.seek(0)
            audio_file.save(file_path)
        except Exception as e:
            return create_response(False, message=f"Failed to save audio file: {str(e)}", status_code=500)

        is_stored = storeVoiceMessage(user_id, message_id, filename, chatbot_sid)

        # TODO: Create a way to test if file actually written, maybe search up the file and see if not NONE
        # if not is_stored:
        #     return create_response(False, message="Failed to store voice message.", status_code=500) 

        return create_response(True, message="Audio message uploaded successfully.")

    @jwt_required
    def get(self):
        '''
        /elleapi/twt/session/audio
            Returns a single audio file of name {userID}_{messageID}.webm
            Expects ?classID={id_here1}&messageID={id_here2}&moduleID={id_here3}

            TODO: check if user is allowed to make the request

            curl -X GET "http://127.0.0.1:5050/elleapi/twt/session/audio?classID=1&messageID=295&moduleID=1" \
            -H "Authorization: Bearer {TOKEN}" \
            --output output_audio.webm

        '''
        if not validate_user(permission_claim=get_jwt_claims().get("permission"), req_student_perm=True):
            return create_response(False, message="User has invalid permissions to access this resource.", status_code=403)
        user_id = get_jwt_identity() 

        class_id = request.args.get('classID')
        message_id = request.args.get('messageID')
        module_id = request.args.get('moduleID')

        if not class_id or not message_id or not module_id:
            return create_response(False, message="Missing required query parameters.", status_code=400)

        filename = getVoiceMessage(user_id, message_id)
        if not filename:
            return create_response(False, message="File not found", status_code=503)

        file_path = os.path.join(USER_VOICE_FOLDER, str(class_id), str(module_id), str(user_id), str(filename))
        if not os.path.exists(file_path):
            return create_response(False, message="File does not exist.", status_code=404)

        return send_file(file_path, mimetype="audio/webm")

# Unsure if needed as an API
class ModuleTerms(Resource):
    @jwt_required
    def get(self):
        '''
        /elleapi/twt/module/terms
            Fetches all terms associated to a given moduleID
            TODO: error handling when moduleID doesnt exist
            TODO: ensure only enrolled people can access modules
        '''
        module_id = request.args.get('moduleID')
        if not module_id:
            return create_response(False, message="improper moduleID given.", status_code=403)

        return create_response(True, message=f"Retrieved module terms from module {module_id}", data=getModuleTerms(module_id))


# ========================================
# ++++++ PROFESSOR ACCESS ONLY APIs ++++++
# ========================================

class Classes(Resource):
    @jwt_required
    def get(self):
        '''
        /elleapi/twt/professor/classes
            Gets a professors owned classes
        '''
        if not validate_user(permission_claim=get_jwt_claims().get("permission"), req_prof_perm=True):
            return create_response(False, message="User has invalid permissions to access this resource.", status_code=403)
        user_id = get_jwt_identity()

        return create_response(True, data=getClasses(user_id, get_jwt_claims().get("permission")))
 
# TODO: this
class TitoModule(Resource):
    @jwt_required
    def post(self):
        '''
            makes changes to a module's status on being a tito_module or not
        '''

        return False

class GetStudentMessages(Resource):
    @jwt_required
    def get(self):
        '''
            For professors to fetch messages of a student?
            TODO:
        '''
        return

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

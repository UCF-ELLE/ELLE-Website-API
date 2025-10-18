import csv, io
from flask import Response, request, jsonify, send_file
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt_claims
# from .config import free_prompt
from config import MAX_AUDIO_SIZE_BYTES, MAX_AUDIO_LENGTH_SEC, FREE_CHAT_MODULE
from utils import create_response
from .database import * 
from .spacy_service import add_message
from .convo_grader import suggest_grade as grade_message
import os
from pydub import AudioSegment
from .llm_functions import *
from .utils import *
from .tito_methods import updateLiveDB

USER_VOICE_FOLDER = "user_audio_files/"

# ======================================
# ++++++ TWT ACCESS APIs ++++++
# ======================================

# NOTE: data = request.form is for {Content-Type = application/x-www-form-urlencoded} not application/JSON
# TODO: Free chat AND module-based chats to be worked on

# Check if user can access TWT (Must be enrolled in an active class AND assigned a Tito Module)
class TitoAccess(Resource):
    @jwt_required
    def get(self):
        '''
        /elleapi/twt/session/access
            Requires server permission to be able to use Talking with Tito (TWT)
                - Any user of any access_level [pf, ta, st] may be able to use TWT
                - Returns: active, tito-enabled, class:[modules] where a user has access to 
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
                            ),
                        ]
            TODO: Error Handling or let it be 
        '''
        try:
            class_ids = getTitoClasses(userID=get_jwt_identity(), permissionLevel='any', get_classes_type='active')
            if not class_ids:
                return create_response(success=False, message="User is not enrolled in any active tito classes.", status_code=403)
            
            tito_modules = []
            for class_id in class_ids:
                res = getTitoModules(class_id)
                if not res:
                    return create_response(True, message="Returned user modules", data=[]) 
                tito_modules.append((class_id[0], res))

            return create_response(True, message="Returned user modules", data=tito_modules) 
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
        user_id = get_jwt_identity()
        data = request.form
        module_id = data.get("moduleID")
        class_id = data.get("classID")

        if not module_id or not class_id:
            return create_response(False, message="Missing required parameters.", status_code=404)
        if not isUserInClass(user_id, class_id):
            return create_response(False, message=f"User does not belong to class {class_id}.", status_code=403)

        # A freechat session
        if module_id == FREE_CHAT_MODULE:
            chatbot_sid = createChatbotSession(user_id, FREE_CHAT_MODULE)
            warming_thread = threading.Thread(target = prewarm_llm_context, # Uses threading so that LLM may "warm up" for 
            args = (FREE_CHAT_MODULE, chatbot_sid), daemon = True)          # subsiquent prompts
            warming_thread.start()

            return create_response(True, message="Free chat Chatbot session created.", data=chatbot_sid)
        
        if not isActiveTitoModule(class_id, module_id):
            return create_response(success=False, message="Chatbot session failed to be created. No available modules", status_code=403)
        
        # If a module ID is found
        chatbot_sid = createChatbotSession(user_id, module_id)
        warming_thread = threading.Thread(target = prewarm_llm_context, 
        args = (module_id, chatbot_sid), daemon = True)
        warming_thread.start()

        return create_response(True, message="Chatbot session created.", data=chatbot_sid)

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
        user_id = get_jwt_identity()
        data = request.form
        message = data.get('message')
        session_id = data.get('chatbotSID')
        module_id = data.get('moduleID')
        is_vm = data.get('isVoiceMessage')

        # print(f'{message} and {session_id} and {module_id} and {is_vm}')

        if not session_id or not module_id or not message or is_vm is None:
            return create_response(False, message="Missing required parameters.", status_code=404)


        # Attempts to add message to DB, 0/None = error, success returns msg_id
        new_msg_id = createNewUserMessage(userID=user_id, moduleID=module_id,chatbotSID=session_id, message=message, isVM=is_vm)
        if not new_msg_id:
            return create_response(False, message="Failed to send message. User has an invalid session.", status_code=400, resumeMessaging=True)

        updateTotalTimeChatted(session_id)

        # Rate messages grammar
        msg_graded = grade_message (message=message)
        if msg_graded:
            msg_score = msg_graded.get("suggested_grade")
            matches = msg_graded.get("errors")
            # print(matches)

            res = ""
            if matches:
                for match in matches:   
                    if match.get('rule', {}).get('issueType') == "misspelling":
                        replacements = [replacement['value'] for replacement in match['replacements']]
                        res += " ".join(replacements) + " "
                add_message(message=res, module_id=module_id, user_id=user_id, message_id=0, chatbot_sid=0, update_db=False)

            res = updateMessageScore(new_msg_id, msg_score)
            # print(f"message score is {msg_score}")


        # TODO: a freechat session ADD SUPPORT FOR IT
        # Send to spacy service to parse key terms if NOT in free chat mode
        if module_id != FREE_CHAT_MODULE:
            add_message(message, module_id, user_id, new_msg_id, session_id)

        # TODO:
        # Update module words used =>
        # Async grammar evaluation

        # Sends a message to tito with safety check
        tito_response = ''
        try:
            # try:
            #     safety_check = detect_innapropriate_language(message)
            #     if not safety_check.get('is_appropriate', True):
            #         tito_response_data = {'response': "I can't respond to that type of message. Let's keep the conversation educational and appropriate"}
            #     else:
            #         tito_response_data = handle_message(message)
            # except Exception as safety_error:
            #     print(f"Safety check failed: {safety_error}")
            tito_response = handle_message(message, module_id = module_id)
            
            print("this1")
            # tito_response = tito_response_data.get('response', "Sorry, I could not understand your message. Please try again!")
            print(tito_response)
            
            # TODO: Verify data
            newTitoMessage(user_id, session_id, tito_response, module_id)
            print("this3")

        except Exception as error:
            print(f"Error communicating with Tito: {error}")
            tito_response = "Sorry, there is a bit of trouble. Please try again!"
            tito_response_data = {"response": tito_response}

        if True: # a successful llm message insert
            return create_response(True, message="Message sent.", data=message, resumeMessaging=True, messageID=new_msg_id, titoResponse=tito_response)
        else: 
            return 

    @jwt_required
    def get(self):
        '''
        /elleapi/twt/session/messages
            Returns chat history of a user for a given moduleID in ascending order (1 -> N)
            TODO: to be worked on?
        '''
        user_id = get_jwt_identity()

        try:
            data = request.form
            module_id = request.args.get('moduleID')
            
            if not module_id:
                return create_response(False, message="Missing required paranmeters.", status_code=404)
            return create_response(True, message="Retrieved chat history.", data=fetchModuleChatHistory(user_id, module_id)) 
        except Exception as e:
            print("[ERROR] In UserMessages @ conversation.py")
            return create_response(False, message=f"Failed to retrieve user's messages. Error: {e}", status_code=504)

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
        user_id = get_jwt_identity()
        data = request.form
        message_id = data.get('messageID')
        chatbot_sid = data.get('chatbotSID')
        class_id = data.get('classID')
        module_id = data.get("moduleID")

        if not message_id or not chatbot_sid or not class_id or not module_id:
            return create_response(False, message="Failed to upload. Missing required parameters.", status_code=400) 
        if isDuplicateAudioUpload(user_id, message_id):
            return create_response(False, message="User already has uploaded an audio file for this message.", status_code=403)

        audio_file = request.files.get('audio')
        audio_file.seek(0)
        if not audio_file:
            return create_response(False, message="Audio file not received.", status_code=400)
        audio_file.seek(0, 2)
        filesize_bytes = audio_file.tell()
        audio_file.seek(0)

        if filesize_bytes > MAX_AUDIO_SIZE_BYTES:
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

        # Store to DB if successfully stored in Server
        res = storeVoiceMessage(user_id, message_id, filename, chatbot_sid)

        # TODO: Create a way to test if file actually written, maybe search up the file and see if exists
        # if not is_stored:
        #     return create_response(False, message="Failed to store voice message.", status_code=500) 

        if not res:
            return create_response(False, message="Error occurred when inserting vm data into DB.", voiceID=res)
        return create_response(True, message="Audio message uploaded successfully.", voiceID=res)

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
            TODO: ensure only enrolled people can access modules
        '''
        module_id = request.args.get('moduleID')
        if not module_id:
            return create_response(False, message="improper moduleID given.", status_code=403)
        if module_id == FREE_CHAT_MODULE:
            return create_response(False, message="module is a freechat module, no terms stored", status_code=400)
        return create_response(True, message=f"Retrieved module terms from module {module_id}", data=getModuleTerms(module_id))

class GetModuleProgress(Resource):
    @jwt_required
    def get(self):
        user_id = get_jwt_identity()
        module_id = request.args.get('moduleID')

        if not module_id:
            return create_response(False, message="insufficient params provided", status_code=403)
        res = getUserModuleProgress(user_id, module_id)
        
        return create_response(True, data=res)

class GetTitoLoreAssignment(Resource):
    @jwt_required
    def get(self):
        '''
            Get the assigned tito lore for the class's module
            returns tito lore id via data and respective lores
        '''
        user_id = get_jwt_identity()
        class_id = request.args.get('classID')
        module_id = request.args.get('moduleID')

        if not class_id or not module_id:
            return create_response(False, message="insufficient params provided.", status_code=403)
        if not isUserThisAccessLevel(user_id, class_id, 'pf'):
            return create_response(False, message="insufficient perms.", status_code=403)

        res = getClassModuleTitoLore(class_id, module_id)
        if not res:
            return create_response(False, message="failed to retrieve tito lore id for class module", status_code=400)
        
        lore_texts = getTitoLoreTexts(res)
        if not lore_texts:
            return create_response(False, message="failed to retrieve tito lore_texts for class module", status_code=400)
        
        return create_response(True, message="returned tito lore id", data=lore_texts, loreID=res)


# ========================================
# ++++++ PROFESSOR + (TAs?) ACCESS ONLY APIs ++++++
# ========================================

class Classes(Resource):
    @jwt_required
    def get(self):
        '''
        /elleapi/twt/professor/classes
            Gets a professors owned classes
        '''
        user_id = get_jwt_identity()

        # Should be either 'all', 'active' or 'inactive'
        class_type = request.args.get('classType')

        if class_type is None:
            return create_response(False, message="Missing parameters in request.", status_code=400)

        return create_response(True, data=getTitoClasses(user_id, 'pf', class_type))
 
# TODO: this might need try catch statements
class AddTitoModule(Resource):
    @jwt_required
    def post(self):
        '''
            makes changes to a module's status on being a tito_module or not
            will automatically populate tito_* tables for this module on success
        '''
        user_id = get_jwt_identity()
        data = request.form
        class_id = data.get('classID')
        module_id = data.get('moduleID')
        
        if not class_id or not module_id:
            create_response(False, message="Missing parameters.", status_code=404)
        if not userIsNotAStudent(user_id, class_id):
            return create_response(False, message="user does not have required privileges.", status_code=403)
        if not isTitoClass(user_id, class_id):
            return create_response(False, message="Class is not currently a tito class.", status_code=403)
        if isTitoModule(class_id, module_id):
            return create_response(False, message="module is already a tito module.", status_code=404)
        if not isModuleInClass(class_id, module_id):
            return create_response(False, message="user does not have required privileges.", status_code=403)
        res = addNewTitoModule(module_id, class_id)
        if not res:
            create_response(False, message="failed to insert tito_module, already exists", status_code=403)
        return create_response(True, message="updated respective tables.")

class UpdateTitoModule(Resource):
    @jwt_required
    def post(self):
        '''
            enable/disable tito modules for a class
        '''
        user_id = get_jwt_identity()
        data = request.form
        class_id = data.get('classID')
        module_id = data.get('moduleID')

        # OPTIONAL ARGS
        start_date = data.get('startDate')
        end_date = data.get('endDate')
        status_update_change = data.get('isStatusUpdate') # true or false
        
        if not class_id or not module_id:
            return create_response(False, message="Missing parameters.", status_code=404)
        if not start_date and not end_date and status_update_change is None:
            return create_response(False, message="failed to change anything, missing params.")
        if not userIsNotAStudent(user_id, class_id):
            return create_response(False, message="user does not have required privileges.", status_code=403)
        if not isTitoClass(user_id, class_id):
            return create_response(False, message="Class is not currently a tito class.", status_code=403)
        if not isTitoModule(class_id, module_id):
            return create_response(False, message="module is not a tito module.", status_code=403)

        if start_date is not None and end_date is not None:
            if status_update_change is not None:
                if updateTitoModuleStatus(module_id, class_id, update_status=True, update_date=True, start_date=start_date, end_date=end_date):
                    return create_response(True, message="successfully update tito module date and/or status")
            else:
                if updateTitoModuleStatus(module_id, class_id, update_date=True, start_date=start_date, end_date=end_date):
                    return create_response(True, message="updated start/end dates.")
        elif status_update_change: 
            if updateTitoModuleStatus(module_id, class_id, update_status=True):
                return create_response(True, message="Changed module status successfully")

        return create_response(False, message="error has occurred, no change made in UpdateTitoModule.", status_code=400)

class UpdateTitoClass(Resource):
    @jwt_required
    def post(self):
        '''
            enable/disable tito status for a class
                inserts into tito_class_status if not previously a tito-enrolled class
        '''
        user_id = get_jwt_identity()
        data = request.form
        class_id = data.get('classID')

        if not class_id:
            return create_response(False, message="invalid params", status_code=403)
        if not userIsNotAStudent(user_id, class_id):
            return create_response(False, message="invalid perms", status_code=403)
        if not isTitoClass(user_id, class_id):
            if createTitoClass(user_id, class_id):
                return create_response(True, message="Successfully made class into a tito-enabled class")
            else:
                return create_response(False, message="Failed to make class a Tito class. Valve please fix...", status_code=500)
            
        if not updateTitoClassStatus(user_id, class_id):
            return create_response(False, message="failed to update tito class", status_code=400)

        return create_response(True, message="updated tito class status")
        
class GetStudentMessages(Resource):
    @jwt_required
    def get(self):
        '''
            For professors to fetch messages of a student?
            TODO:
        '''
        return

class GetClassUsers(Resource):
    @jwt_required
    def get(self):
        '''
            twt/professor/getClassUsers
        '''
        class_id = request.args.get('classID')
        users = getUsersInClass(class_id)
        return create_response(message="users retrieved", users=users)

class UpdateLoreAssignment(Resource):
    @jwt_required
    def post(self):
        '''
            Updating the assigned tito lore
            returns nothing
        '''
        user_id = get_jwt_identity()
        data = request.form
        class_id = data.get('classID')
        module_id = data.get('moduleID')
        lore_id = data.get('loreID')

        if not class_id or not module_id or not lore_id:
            return create_response(False, message="insufficient params provided.", status_code=403)
        if isUserThisAccessLevel(user_id, class_id, 'st'):
            return create_response(False, message="insufficient perms.", status_code=403)
        if not updateClassModuleTitoLoreAssignment(class_id, module_id, lore_id):
            return create_response(False, message="unable to make changes. module already assigned this lore or given module id doesnt exist", status_code=500)
        return create_response(True, message="successfully updated assigned lore to class module")
    
class CreateTitoLore(Resource):
    @jwt_required
    def post(self):
        '''
            creates tito lore tied to this user as the owner
            required 4 strings to properly create tito lore
        '''
        user_id = get_jwt_identity()
        claims = get_jwt_claims()
        user_permission = claims.get("permission")
        data = request.form
        lore_1 = data.get('lore_1')
        lore_2 = data.get('lore_2')
        lore_3 = data.get('lore_3')
        lore_4 = data.get('lore_4')

        if not lore_1 or not lore_2 or not lore_3 or not lore_4:
            return create_response(False, message='insufficient params provided', status_code=404)
        if not user_permission or user_permission == 'st':
            return create_response(False, message='insufficient perms', status_code=403)
        
        lore_list = []
        lore_list.append(lore_1)
        lore_list.append(lore_2)
        lore_list.append(lore_3)
        lore_list.append(lore_4)

        res = insertTitoLore(user_id, lore_list)
        if not res:
            return create_response(False, message='failed to fully process insert', status_code=500)
        return create_response(True, message="successfully created tito lore")

class UpdateTitoLore(Resource):
    @jwt_required
    def post(self):
        '''
            Updating the a singular tito lore (1-4)
            returns nothing
        '''
        user_id = get_jwt_identity()
        claims = get_jwt_claims()
        user_permission = claims.get("permission")

        data = request.form
        class_id = data.get('classID')
        module_id = data.get('moduleID')
        lore_id = data.get('loreID')
        sequence_num = data.get('sequenceNumber')
        new_lore_text = data.get('newLoreText')

        if not class_id or not module_id or not lore_id:
            return create_response(False, message="insufficient params provided.", status_code=403)
        if not user_permission or user_permission == 'st':
            return create_response(False, message='insufficient perms', status_code=403)
        if user_permission != 'su' and isTitoLoreOwner(user_id, lore_id):
            return create_response(False, message='insufficient perms', status_code=403)

        res = updateTitoLoreText(lore_id, sequence_num, new_lore_text)
        if not res:
            return create_response(False, message="failed to update tito lore. probably used the same text", status_code=500)
        return create_response(True, message='updated tito lore')

class FetchAllOwnedTitoLore(Resource):
    @jwt_required
    def get(self):
        '''
            Returns a list of tuples containing tito lores owned by this user so they can modify them later:
                    [ ( loreID, sequenceNumber, loreText ),
                    ...(...) 
                    ]
        '''

        user_id = get_jwt_identity()
        claims = get_jwt_claims()
        user_permission = claims.get("permission")

        if not user_permission or user_permission == 'st':
            return create_response(False, message="invalid perms", status_code=403)

        res = getAllTitoLore(user_id, True if user_permission == 'su' else False)
        if not res:
            return create_response(False, message='failed to retrieve info or user has no owned tito lore', status_code=500)  
        return create_response(True, message="returned owned tito lores", loreData=res)

# NOTE: Doesnt work due to current implementation
# class CreateTitoLore(Resource):
#     @jwt_required
#     def post(self):
#         user_id = get_jwt_identity()
#         data = request.form
#         lore_id = data.get('titoLoreID')

#         if not lore_id:
#             return create_response(False, message="invalid params", status_code=403)
        

# ========================================
# ++++++ DB MIGRATION TEMPORARY ++++++
# ========================================

# Disable/Remove AFTER RUNNING ONCE
class Testing(Resource):
    def get(self):
        return create_response(res=updateLiveDB())


# ========================================
# REDO APIS ++++++
# ========================================

# Deprecated for now, unused?
# class ExportChatHistory(Resource):
#     @jwt_required
#     def post(self):
#          data = request.form  
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

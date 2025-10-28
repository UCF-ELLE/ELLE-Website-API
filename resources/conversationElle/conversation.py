import csv, io
from flask import Response, request, jsonify, send_file
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt_claims
# from .config import free_prompt
from config import MAX_AUDIO_SIZE_BYTES, MAX_AUDIO_LENGTH_SEC, FREE_CHAT_MODULE
from utils import create_response, is_ta
from .database import * 
from .spacy_service import add_message
from .convo_grader import suggest_grade as grade_message
import os
from pydub import AudioSegment
from .llm_functions import *
from .utils import *
from .tito_methods import updateLiveDB, merge_user_audio
from datetime import datetime

USER_VOICE_FOLDER = "user_audio_files/"

# ======================================
# ++++++ TWT ACCESS APIs ++++++
# ======================================

# NOTE: data = request.form is for {Content-Type = application/x-www-form-urlencoded} not application/JSON
# TODO: Free chat AND module-based chats to be worked on

# Check if user can access TWT 
# (Must be enrolled in an active tito class AND assigned an active Tito Module)
class TitoAccess(Resource):
    @jwt_required
    def get(self):
        '''
            /elleapi/twt/session/access
                - Returns: active, tito-enabled, class->[modules] where a user has access to 
                    A list of tuples [(classID, [(tito_module_id, sequence_id)])]
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
                tito_modules.append((class_id, res))

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
            Enables a user to chat with Tito for a specific class-module
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
            warming_thread = threading.Thread(
                target = prewarm_llm_context, # Uses threading so that LLM may "warm up" for subsiquent prompts
                args = (FREE_CHAT_MODULE, chatbot_sid), daemon = True
            )  
            warming_thread.start()

            return create_response(True, message="Free chat Chatbot session created.", data=chatbot_sid)
        
        if not isActiveTitoModule(class_id, module_id):
            return create_response(success=False, message="Chatbot session failed to be created. No available modules", status_code=403)
        
        # If a module ID is found
        chatbot_sid = createChatbotSession(user_id, module_id)
        warming_thread = threading.Thread(
            target = prewarm_llm_context, 
            args = (module_id, chatbot_sid), daemon = True
        )
        warming_thread.start()

        return create_response(True, message="Chatbot session created.", data=chatbot_sid)

# NOTE: Ability to send messages should block until receiving back a response
# TODO: for GET calls, consider sending messages in batches then all at once (better for users with lots of msgs?)
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
        class_id = data.get('classID')

        # print(f'{message} and {session_id} and {module_id} and {is_vm}')

        if not session_id or not module_id or not message or is_vm is None or not class_id:
            return create_response(False, message="Missing required parameters.", status_code=404)


        # Attempts to add message to DB, 0/None = error, success returns msg_id
        new_msg_id = createNewUserMessage(userID=user_id, moduleID=module_id,chatbotSID=session_id, message=message, isVM=is_vm, class_id=class_id)
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
            tito_response = handle_message_with_context(message = message, module_id = module_id, session_id = session_id)
            print(f"[DEBUG] session_id={session_id}, module_id={module_id}")
            
            # tito_response = tito_response_data.get('response', "Sorry, I could not understand your message. Please try again!")
            print(tito_response)
            
            # TODO: Verify data
            newTitoMessage(user_id, session_id, class_id, tito_response, module_id)

        except Exception as error:
            tito_response = "Sorry, there is a bit of trouble. Please try again!"
            tito_response_data = {"response": tito_response}

        return create_response(True, message="Message sent.", data=message, resumeMessaging=True, messageID=new_msg_id, titoResponse=tito_response)


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
            class_id = request.args.get('classID')
            
            if not module_id or not class_id:
                return create_response(False, message="Missing required paranmeters.", status_code=404)
            return create_response(True, message="Retrieved chat history.", data=fetchModuleChatHistory(user_id, module_id, class_id)) 
        except Exception as e:
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
        
        if not doesUserMessageExist(message_id):
            return create_response(False, message='invalid message id', status_code=403)
        if not isUserInClass(user_id, class_id):
            return create_response(False, message='user doesnt belong to this class', status_code=403)
        if not isModuleInClass(class_id, module_id):
            return create_response(False, message='invalid module, doesnt belong to this class', status_code=403)

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
            return create_response(False, message="Error occurred when inserting vm data into DB.")
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
        user_id = get_jwt_identity() 
        class_id = request.args.get('classID')
        message_id = request.args.get('messageID')
        module_id = request.args.get('moduleID')

        if not class_id or not message_id or not module_id:
            return create_response(False, message="Missing required query parameters.", status_code=400)
        if not doesUserMessageExist(message_id):
            return create_response(False, message='invalid message id', status_code=403)
        if not isUserInClass(user_id, class_id):
            return create_response(False, message='user doesnt belong to this class', status_code=403)
        if not isModuleInClass(class_id, module_id):
            return create_response(False, message='invalid module, doesnt belong to this class', status_code=403)

        filename = getVoiceMessage(user_id, message_id)
        if not filename:
            return create_response(False, message="File not found", status_code=404)

        file_path = os.path.join(USER_VOICE_FOLDER, str(class_id), str(module_id), str(user_id), str(filename))
        if not os.path.exists(file_path):
            return create_response(False, message="File does not exist.", status_code=404)

        return send_file(file_path, mimetype="audio/webm")

class FetchAllUserAudio(Resource):
    @jwt_required
    def get(self):
        '''
            twt/session/downloadAllUserAudio
            downloads all audio for this user for classID and moduleID
            Returns either a concatenated .webm file (if ffmpeg available) or a ZIP file with all audio files
        '''
        user_id = get_jwt_identity() 
        class_id = request.args.get('classID')
        module_id = request.args.get('moduleID')

        if not class_id or not module_id:
            return create_response(False, message='missing req params', status_code=400)
        
        try:
            class_id = int(class_id)
            module_id = int(module_id)
        except ValueError:
            return create_response(False, message='invalid parameter format', status_code=400)
        
        # Check if user has access to this class
        if not isUserInClass(user_id, class_id):
            return create_response(False, message='user does not have access to this class', status_code=403)
        if not isModuleInClass(class_id, module_id):
            return create_response(False, message='invalid module, doesnt belong to this class', status_code=403)
        
        res = merge_user_audio(class_id, module_id, user_id)
        print(res)
        if not res:
            return create_response(False, message='no audio files found for this user in the specified module', status_code=404)
        
        # Check if the result is a ZIP file or WEBM file
        file_extension = str(res).lower()
        if file_extension.endswith('.zip'):
            return send_file(res, mimetype="application/zip", as_attachment=True, 
                           attachment_filename=f"user_{user_id}_module_{module_id}_audio.zip")
        else:
            # Assume it's a concatenated WEBM file
            return send_file(res, mimetype="audio/webm", as_attachment=True,
                           attachment_filename=f"user_{user_id}_module_{module_id}_audio.webm")


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
        '''
            /elleapi/twt/session/getModuleProgress
            gets the module's key term/phrase mastery % progress
        '''
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
            /elleapi/twt/session/getTitoLore
            Get the assigned tito lore for the class's module
            returns tito lore id via data and respective lores
        '''
        user_id = get_jwt_identity()
        class_id = request.args.get('classID')
        module_id = request.args.get('moduleID')

        if not class_id or not module_id:
            return create_response(False, message="insufficient params provided.", status_code=403)
        # Was i high when i wrote this?
        # if isUserThisAccessLevel(user_id, class_id, 'st'):
        #     return create_response(False, message="insufficient perms.", status_code=403)

        res = getClassModuleTitoLore(class_id, module_id)
        if not res:
            return create_response(False, message="failed to retrieve tito lore id for class module", status_code=400)
        
        lore_texts = getTitoLoreTexts(res)
        if not lore_texts:
            return create_response(False, message="failed to retrieve tito lore_texts for class module", status_code=400)
        
        return create_response(True, message="returned tito lore id", data=lore_texts, loreID=res)

class Classes(Resource):
    @jwt_required
    def get(self):
        '''
        /elleapi/twt/session/classes
            Gets tito_classes according to classType provided
        '''
        user_id = get_jwt_identity()
        claims = get_jwt_claims()
        user_permission = claims.get("permission")

        # Should be either 'all', 'active' or 'inactive'
        class_type = request.args.get('classType')

        if class_type is None:
            return create_response(False, message="Missing parameters in request.", status_code=400)
        if user_permission == 'st':
            return create_response(False, message="invalid perms", status_code=403)

        return create_response(True, message='returned classes', data=getTitoClasses(user_id, 'pf', class_type))
 
# ========================================
# ++++++ PROFESSOR + (TAs?) ACCESS ONLY APIs ++++++
# ========================================

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
        if not isTitoClassOwner(user_id, class_id):
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
        if not isTitoClassOwner(user_id, class_id):
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
        if status_update_change: 
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
        if not isTitoClassOwner(user_id, class_id):
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
            gets a list of all students in class
        '''
        user_id = get_jwt_identity()
        class_id = request.args.get('classID')
        if not class_id:
            return create_response(False, message="invalid params", status_code=403)
        users = getUsersInClass(class_id, user_id)
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

class PFGetStudentMessages(Resource):
    @jwt_required
    def get(self):
        '''
            Front end should handle the drop down logic by using the other APIs to feed in info
            Admins are provided access TO everything, here the logic gets tricky if populating the drop downs
            
            Purpose: retrieves user messages according to the provided parameters with the ability to constrain results via date ranges

            dates expected format: str(YYYY-MM-DD)

            TODO: Support paging?

        '''

        user_id = get_jwt_identity()
        claims = get_jwt_claims()
        user_permission = claims.get("permission")

        student_id = request.args.get('studentID')
        class_id = request.args.get('classID') # the minimum requirement, paired with either studentID or moduleID
        module_id = request.args.get('moduleID')
        filter_date_from = request.args.get('dateFrom')
        filter_date_to = request.args.get('dateTo')

        is_ta = False
        is_tito_class = False

        if user_permission == 'st':
            return create_response(False, message='insufficient perms', status_code=403)
        if not student_id and not class_id and not module_id:
            return create_response(False, message='insufficient params provided', status_code=403)
        if not (module_id and class_id) and not (student_id and class_id):
            return create_response(False, message='insufficient params provided', status_code=403)
        # Check for if user has proper access to resources, either su (access to all), a pf or ta
        if module_id:
            if not isTitoModule(class_id, module_id):
                return create_response(False, message='Module isnt a tito module', status_code=403)
            
            is_ta = is_ta(user_id, class_id)
            is_tito_class = isTitoClassOwner(user_id, class_id)

            if not is_ta and not isTitoClassOwner and not user_permission == 'su':
                return create_response(False, message='user doesnt have access to this class and/or module does not belong to provided class', status_code=403)
        if student_id and not isUserInClass(student_id, class_id):
            return create_response(False, message='student provided not enrolled in class given', status_code=403)

        res = ''
        if user_permission == 'su':
            res = profGetStudentMessages(student_id, class_id, module_id, filter_date_from, filter_date_to)
        else:
            if is_ta or is_tito_class: # either the professor or ta of a class authority
                res = profGetStudentMessages(student_id, class_id, module_id, filter_date_from, filter_date_to)

        if not res:
            return create_response(False, message='failed to retrieve modules. may be missing required params or filters were too strict', status_code=404)

        # Have to convert sql datetime back to str format
        newres = []
        for tup in res:
            newres.append(tup[:6] + (tup[6].strftime('%Y-%m-%d %H:%M:%S'),) + tup[7:])

        return create_response(True, message='returned messages', data=newres)

class AdminFetchData(Resource):
    @jwt_required
    def get(self):
        '''
            TBC
        '''
        
        return

class GenerateModule(Resource):
    # @jwt_required
    def get(self):
        '''
            Returns a list of messages in json
        '''

        # user_id = get_jwt_identity()
        # claims = get_jwt_claims()
        # user_permission = claims.get("permission")

        prompt = request.args.get('prompt')
        term_count = request.args.get('termCount')
        native_lang = request.args.get('nativeLanguage')
        target_lang = request.args.get('targetLanguage')

        if not prompt or not term_count or term_count == 0 or not native_lang or not target_lang:
            return create_response(False, message='insufficient params provided', status_code=400)


        res = create_module(prompt, term_count, native_lang, target_lang)
        if not res:
            return create_response(False, message='failed to generate module outline', status_code=201)

        return create_response(message='returned sample terms', data=res)


# ========================================
# ++++++ DB MIGRATION TEMPORARY ++++++
# ========================================

# Disable/Remove AFTER RUNNING ONCE
class Testing(Resource):
    def get(self):
        return create_response(res=updateLiveDB())

# ========================================
# ++++++ CONVERSATION AUDIO EXPORT ++++++
# ========================================

class ConversationAudioExport(Resource):
    def options(self):
        """Handle CORS preflight requests"""
        return {"message": "CORS preflight OK"}, 200
    
    @jwt_required
    def get(self):
        '''
        /elleapi/twt/session/export-audio
            Exports all audio files from a user's conversation in a specific module
            Creates a ZIP file with all audio messages
            
            Parameters:
            - moduleID: The module ID
            - chatbotSID: (optional) Specific session ID, if not provided exports all audio from module
            - classID: The class ID
        '''
        try:
            user_id = get_jwt_identity()
            module_id = request.args.get('moduleID')
            chatbot_sid = request.args.get('chatbotSID')
            class_id = request.args.get('classID')
            
            if not module_id or not class_id:
                return create_response(False, message="Missing required parameters (moduleID, classID).", status_code=400)
            
            # Convert to integers
            module_id = int(module_id)
            class_id = int(class_id)
            if chatbot_sid:
                chatbot_sid = int(chatbot_sid)
            
            # Check if user has access to this class and module
            if not isUserInClass(user_id, class_id):
                return create_response(False, message="User does not have access to this class.", status_code=403)
            
            # Get audio files for the conversation
            if chatbot_sid:
                audio_files = getConversationAudioFiles(user_id, module_id, chatbot_sid)
                filename_prefix = f"conversation_{user_id}_{module_id}_{chatbot_sid}"
            else:
                audio_files = getAllUserAudioInModule(user_id, module_id)
                filename_prefix = f"module_audio_{user_id}_{module_id}"
            
            if not audio_files:
                return create_response(False, message="No audio files found for this conversation.", status_code=404)
            
            # Create ZIP file with clean naming
            output_filename = self._create_zip_export(audio_files, user_id, class_id, module_id, filename_prefix)
                
            if not output_filename:
                return create_response(False, message="Failed to create audio export.", status_code=500)
            
            # Return the ZIP file
            return send_file(output_filename, 
                           mimetype="application/zip", 
                           as_attachment=True, 
                           attachment_filename=f"{filename_prefix}_audio_files.zip")
            
        except Exception as e:
            return create_response(False, message="Internal server error during audio export.", status_code=500)
    
    def _combine_audio_files(self, audio_files, user_id, class_id, module_id, filename_prefix):
        '''
        Combine multiple audio files into a single MP3 file or create a ZIP file
        Returns the path to the combined file
        '''
        try:
            # Check if ffmpeg is available
            try:
                # Test ffmpeg by creating a small audio segment
                test_audio = AudioSegment.silent(duration=100)  # 100ms of silence
                ffmpeg_available = True
            except Exception as ffmpeg_test_error:
                ffmpeg_available = False
                
            # Try to use AudioSegment for proper audio combining
            combined_audio = AudioSegment.empty()
            
            files_processed = 0
            for audio_file in audio_files:
                filename, message_id, timestamp = audio_file[0], audio_file[1], audio_file[2]
                
                # Construct the full path to the audio file
                file_path = os.path.join(USER_VOICE_FOLDER, str(class_id), str(module_id), str(user_id), filename)
                file_path = os.path.normpath(file_path)  # Normalize path for current OS
                
                if os.path.exists(file_path):
                    try:
                        # Load the audio file and add it to the combination
                        audio_segment = AudioSegment.from_file(file_path)
                        
                        # Add a small silence between files (0.5 seconds)
                        if len(combined_audio) > 0:
                            silence = AudioSegment.silent(duration=500)  # 500ms of silence
                            combined_audio += silence
                        
                        combined_audio += audio_segment
                        files_processed += 1
                    except Exception as audio_error:
                        # Continue with other files instead of breaking
                        if files_processed == 0:
                            # If first file fails, disable ffmpeg
                            ffmpeg_available = False
                else:
                    pass
            # Create output directory if it doesn't exist
            output_dir = os.path.join("temp_exports")
            os.makedirs(output_dir, exist_ok=True)
            
            # Try MP3 combining first, fallback to ZIP if it fails
            if ffmpeg_available and len(combined_audio) > 0:
                # Create output filename
                output_filename = os.path.join(output_dir, f"{filename_prefix}.mp3")
                
                # Export as MP3
                try:
                    combined_audio.export(output_filename, format="mp3")
                    return output_filename
                except Exception as export_error:
                    # Fallback to ZIP if MP3 export fails
                    return self._create_zip_export(audio_files, user_id, class_id, module_id, filename_prefix, output_dir)
            else:
                # Fallback: create a ZIP file with all individual audio files
                return self._create_zip_export(audio_files, user_id, class_id, module_id, filename_prefix, output_dir)
            
            # Original MP3 combining code (commented out for debugging)
            # if ffmpeg_available and len(combined_audio) > 0:
            #     # Create output filename
            #     output_filename = os.path.join(output_dir, f"{filename_prefix}.mp3")
            #     
            #     # Export as MP3
            #     combined_audio.export(output_filename, format="mp3")
            #     return output_filename
            # else:
            #     # Fallback: create a ZIP file with all individual audio files
            #     return self._create_zip_export(audio_files, user_id, class_id, module_id, filename_prefix, output_dir)
            
        except Exception as e:
            # Try fallback ZIP export
            try:
                output_dir = os.path.join("temp_exports")
                os.makedirs(output_dir, exist_ok=True)
                return self._create_zip_export(audio_files, user_id, class_id, module_id, filename_prefix, output_dir)
            except Exception as zip_error:
                return None
    
    def _create_zip_export(self, audio_files, user_id, class_id, module_id, filename_prefix):
        '''
        Create a ZIP file containing all audio files with clean naming
        '''
        import zipfile
        import time
        
        # Create output directory
        output_dir = "temp_exports"
        os.makedirs(output_dir, exist_ok=True)
        
        # Add timestamp to prevent caching
        timestamp = int(time.time())
        zip_filename = os.path.join(output_dir, f"{filename_prefix}_{timestamp}.zip")
        
        with zipfile.ZipFile(zip_filename, 'w') as zipf:
            for i, audio_file in enumerate(audio_files):
                filename, message_id, timestamp = audio_file[0], audio_file[1], audio_file[2]
                
                # Construct the full path to the audio file
                file_path = os.path.join(USER_VOICE_FOLDER, str(class_id), str(module_id), str(user_id), filename)
                file_path = os.path.normpath(file_path)
                
                if os.path.exists(file_path):
                    # Add file to ZIP with clean naming: message_1.webm, message_2.webm, etc.
                    file_extension = os.path.splitext(filename)[1]
                    zip_name = f"message_{i+1}{file_extension}"
                    zipf.write(file_path, zip_name)
        
        return zip_filename


# Audio export endpoint for module conversations
class SimpleAudioExport(Resource):
    def get(self):
        try:
            # Get parameters
            user_id = 1  # TODO: Replace with get_jwt_identity() when JWT is restored
            module_id = int(request.args.get('moduleID', 3))
            class_id = int(request.args.get('classID', 1))
            
            # Get audio files for the module
            audio_files = getAllUserAudioInModule(user_id, module_id)
            
            if not audio_files:
                return create_response(False, message="No audio files found for this module.", status_code=404)
            
            # Create ZIP with clean naming
            import zipfile
            import time
            
            output_dir = "temp_exports"
            os.makedirs(output_dir, exist_ok=True)
            
            # Add timestamp to prevent caching
            timestamp = int(time.time())
            zip_filename = os.path.join(output_dir, f"audio_export_{timestamp}.zip")
            
            with zipfile.ZipFile(zip_filename, 'w') as zipf:
                for i, audio_file in enumerate(audio_files):
                    filename = audio_file[0]
                    file_path = os.path.join("user_audio_files", str(class_id), str(module_id), str(user_id), filename)
                    
                    if os.path.exists(file_path):
                        file_extension = os.path.splitext(filename)[1]
                        new_name = f"message_{i+1}{file_extension}"
                        zipf.write(file_path, new_name)
            
            # Return the ZIP file
            return send_file(zip_filename, 
                           mimetype="application/zip", 
                           as_attachment=True, 
                           attachment_filename="audio_messages.zip")
                           
        except Exception as e:
            return create_response(False, message="Internal server error during audio export.", status_code=500)

# Debug endpoint to check audio files and write to file
class DebugAudioFiles(Resource):
    @jwt_required
    def get(self):
        from .database import getAllUserAudioInModule, getConversationAudioFiles
        import json
        import os
        from pathlib import Path
        
        user_id = get_jwt_identity()
        module_id = request.args.get('moduleID')
        class_id = request.args.get('classID')
        chatbot_sid = request.args.get('chatbotSID')
        
        debug_data = {
            "user_id": user_id,
            "module_id": module_id,
            "class_id": class_id,
            "chatbot_sid": chatbot_sid,
            "timestamp": str(datetime.now()),
            "ffmpeg_available": False
        }
        
        try:
            # Check if ffmpeg is available
            import subprocess
            try:
                subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
                debug_data["ffmpeg_available"] = True
            except (subprocess.CalledProcessError, FileNotFoundError):
                debug_data["ffmpeg_available"] = False
            
            # Check file system for audio files
            if class_id and module_id:
                audio_dir = Path(USER_VOICE_FOLDER) / str(class_id) / str(module_id) / str(user_id)
                debug_data["audio_directory"] = str(audio_dir)
                debug_data["directory_exists"] = audio_dir.exists()
                
                if audio_dir.exists():
                    audio_files = list(audio_dir.glob(f"{user_id}_*.webm"))
                    debug_data["filesystem_audio_files"] = [f.name for f in audio_files]
                    debug_data["filesystem_audio_count"] = len(audio_files)
            
            # Get database voice messages info
            if module_id:
                module_id = int(module_id)
                # Get audio files for module from database
                module_audio = getAllUserAudioInModule(user_id, module_id)
                debug_data["database_module_audio_count"] = len(module_audio)
                debug_data["database_module_audio"] = module_audio
                
                if chatbot_sid:
                    chatbot_sid = int(chatbot_sid)
                    # Get audio files for specific conversation
                    conversation_audio = getConversationAudioFiles(user_id, module_id, chatbot_sid)
                    debug_data["database_conversation_audio_count"] = len(conversation_audio)
                    debug_data["database_conversation_audio"] = conversation_audio
        
            # Write debug data to file
            with open("audio_debug.json", "w") as f:
                json.dump(debug_data, f, indent=2, default=str)
            
            return create_response(True, message="Debug data written to audio_debug.json", data=debug_data)
            
        except Exception as e:
            debug_data["error"] = str(e)
            with open("audio_debug_error.json", "w") as f:
                json.dump(debug_data, f, indent=2, default=str)
            return create_response(False, message=f"Debug error: {e}", data=debug_data)

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


# Stub class for AssignTitoLore - referenced in __init__.py but not implemented
class AssignTitoLore(Resource):
    def post(self):
        return create_response(False, message='AssignTitoLore not implemented', status_code=501)


# AI Module Generation endpoint
class AIModuleGeneration(Resource):
    @jwt_required
    def get(self):
        """
        GET method for backward compatibility with query parameters
        """
        try:
            user_id = get_jwt_identity()
            claims = get_jwt_claims()
            permission = claims.get('permission')
            
            # Only allow professors, TAs, and super admins to generate modules
            if permission not in ['pf', 'ta', 'su']:
                return create_response(False, message="Insufficient permissions to generate modules", status_code=403)
            
            # Get parameters from query string
            name = request.args.get('name')
            target_language = request.args.get('targetLanguage')
            native_language = request.args.get('nativeLanguage')
            num_terms = request.args.get('numTerms', 20)
            group_id = request.args.get('groupID')
            complexity = request.args.get('complexity', 2)
            
            # Convert to int
            try:
                num_terms = int(num_terms)
                complexity = int(complexity)
                if group_id:
                    group_id = int(group_id)
            except ValueError:
                return create_response(False, message="Invalid number format for numTerms or complexity", status_code=400)
            
            # Validate required parameters
            if not all([name, target_language, native_language]):
                return create_response(False, message="Missing required parameters: name, targetLanguage, nativeLanguage", status_code=400)
            
            # Validate num_terms range
            if num_terms < 5 or num_terms > 100:
                return create_response(False, message="numTerms must be between 5 and 100", status_code=400)
            
            # Call the same logic as POST
            return self._generate_module(user_id, name, target_language, native_language, num_terms, group_id, complexity)
            
        except Exception as e:
            return create_response(False, message=f"Error processing request: {str(e)}", status_code=500)
    
    @jwt_required
    def post(self):
        """
        /elleapi/ai/generate-module
        Generates a new module using AI/LLM with specified parameters
        """
        try:
            user_id = get_jwt_identity()
            claims = get_jwt_claims()
            permission = claims.get('permission')
            
            # Only allow professors, TAs, and super admins to generate modules
            if permission not in ['pf', 'ta', 'su']:
                return create_response(False, message="Insufficient permissions to generate modules", status_code=403)
            
            data = request.get_json()
            if not data:
                return create_response(False, message="No JSON data provided", status_code=400)
                
            # Extract parameters
            name = data.get('name')
            target_language = data.get('targetLanguage') 
            native_language = data.get('nativeLanguage')
            num_terms = data.get('numTerms', 20)
            group_id = data.get('groupID')
            complexity = data.get('complexity', 2)
            
            # Validate required parameters
            if not all([name, target_language, native_language]):
                return create_response(False, message="Missing required parameters: name, targetLanguage, nativeLanguage", status_code=400)
                
            # Validate num_terms range
            if not isinstance(num_terms, int) or num_terms < 5 or num_terms > 100:
                return create_response(False, message="numTerms must be an integer between 5 and 100", status_code=400)
            
            # Call the same logic as GET
            return self._generate_module(user_id, name, target_language, native_language, num_terms, group_id, complexity)
            
        except Exception as e:
            return create_response(False, message=f"Error processing request: {str(e)}", status_code=500)
    
    def _generate_module(self, user_id, name, target_language, native_language, num_terms, group_id, complexity):
        """
        Shared method for both GET and POST to generate and save module
        """
        try:
            # Get user permission again for the helper method
            claims = get_jwt_claims()
            permission = claims.get('permission')
            
            # Use the existing create_module function from llm_functions.py
            
            try:
                module_result = create_module(
                    prompt=name,
                    term_count=num_terms,
                    nat_lang=native_language,
                    target_lang=target_language
                )
                
            except Exception as generation_error:
                return create_response(
                    False, 
                    message=f"AI generation failed with exception: {str(generation_error)}", 
                    status_code=500
                )
            
            # Handle both list (success) and dict (error) responses from create_module
            if isinstance(module_result, dict) and module_result.get('status') == 'error':
                error_msg = module_result.get('message', 'Unknown error - no response from AI')
                return create_response(
                    False, 
                    message=f"AI generation failed: {error_msg}", 
                    status_code=500
                )
            
            # Convert list to expected format
            if isinstance(module_result, list):
                terms_list = module_result
            elif isinstance(module_result, dict):
                terms_list = module_result.get('terms', [])
            else:
                return create_response(
                    False, 
                    message="Invalid response from AI", 
                    status_code=500
                )
            
            if not terms_list:
                return create_response(
                    False, 
                    message="AI did not generate any terms", 
                    status_code=500
                )
            
            # Create the actual module in the database
            from db_utils import postToDB, getFromDB
            from db import mysql
            
            try:
                conn = mysql.connect()
                cursor = conn.cursor()
                
                # Insert the new module into the database
                module_insert_query = """
                    INSERT INTO `module` (`name`, `language`, `complexity`, `userID`, `isPastaModule`) 
                    VALUES (%s, %s, %s, %s, %s)
                """
                
                cursor.execute(module_insert_query, (
                    name, 
                    target_language, 
                    complexity, 
                    user_id, 
                    False  # isPastaModule
                ))
                
                # Get the newly created module ID
                new_module_id = cursor.lastrowid
                
                # Insert each AI-generated term into the database
                terms_created = 0
                for term in terms_list:
                    try:
                        # Insert term
                        term_insert_query = """
                            INSERT INTO `term` (`front`, `back`, `type`, `gender`, `language`) 
                            VALUES (%s, %s, %s, %s, %s)
                        """
                        
                        # Clean words - remove any extra text like "- Tutor:", "Response=", etc.
                        native = term.get('native_word', '').strip()
                        target = term.get('target_word', '').strip()
                        
                        # Remove common LLM artifacts
                        for prefix in ['- Tutor:', 'Response=', 'Tutor:', '-', 'Student:', 'Assistant:']:
                            if native.startswith(prefix):
                                native = native[len(prefix):].strip()
                            if target.startswith(prefix):
                                target = target[len(prefix):].strip()
                        
                        cursor.execute(term_insert_query, (
                            target,   # Target language (Spanish) in 'front' column (English column display)
                            native,   # Native language (English) in 'back' column (Translated column display)
                            term.get('part_of_speech', 'noun').upper(),
                            term.get('gender', 'N')[0].upper(),  # First letter: M/F/N
                            target_language
                        ))
                        
                        term_id = cursor.lastrowid
                        
                        # Create a question for this term (MATCH type)
                        question_insert_query = """
                            INSERT INTO `question` (`type`, `questionText`) 
                            VALUES (%s, %s)
                        """
                        
                        cursor.execute(question_insert_query, (
                            'MATCH',
                            f"What is '{term.get('native_word', '')}' in {target_language}?"
                        ))
                        
                        question_id = cursor.lastrowid
                        
                        # Link question to module
                        module_question_query = """
                            INSERT INTO `module_question` (`moduleID`, `questionID`) 
                            VALUES (%s, %s)
                        """
                        
                        cursor.execute(module_question_query, (new_module_id, question_id))
                        
                        # Link term as answer to question
                        answer_query = """
                            INSERT INTO `answer` (`questionID`, `termID`) 
                            VALUES (%s, %s)
                        """
                        
                        cursor.execute(answer_query, (question_id, term_id))
                        
                        terms_created += 1
                        
                    except Exception as term_error:
                        continue
                
                # Link module to group if specified
                if group_id and permission != 'su':
                    group_module_query = """
                        INSERT INTO `group_module` (`groupID`, `moduleID`) 
                        VALUES (%s, %s)
                    """
                    cursor.execute(group_module_query, (group_id, new_module_id))
                
                # Commit all changes
                conn.commit()
                
                # Prepare response data
                generated_content = {
                    'terms': terms_list,
                    'phrases': [],
                    'questions': []
                }
                
                return create_response(
                    True,
                    message=f"AI module '{name}' created successfully with {terms_created} terms!",
                    data={
                        'moduleID': new_module_id,
                        'name': name,
                        'language': target_language,
                        'content': generated_content
                    }
                )
                
            except Exception as db_error:
                if conn:
                    conn.rollback()
                return create_response(
                    False,
                    message=f"AI generated content but failed to save to database: {str(db_error)}",
                    status_code=500
                )
            finally:
                if conn and conn.open:
                    cursor.close()
                    conn.close()
            
        except Exception as error:
            return create_response(
                False, 
                message="Internal server error during AI module generation", 
                error=str(error),
                status_code=500
            )


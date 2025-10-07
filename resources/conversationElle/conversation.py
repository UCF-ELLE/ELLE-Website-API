import csv, io
from flask import Response, request, jsonify, send_file
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt_claims
# from .config import free_prompt
from config import MAX_AUDIO_SIZE_BYTES, MAX_AUDIO_LENGTH_SEC, FREE_CHAT_MODULE
from .database import * 
from .spacy_service import add_message
from .convo_grader import suggest_grade as grade_message
import os
from pydub import AudioSegment
from .llm_functions import *
from .utils import *

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

        print(f"[ChatbotSessions] Session creation request: user_id={user_id}, module_id={module_id}, class_id={class_id}")

        if not module_id or not class_id:
            print(f"[ChatbotSessions] Missing parameters: module_id={module_id}, class_id={class_id}")
            return create_response(False, message="Missing required parameters.", status_code=404)
            
        if not isUserInClass(user_id, class_id):
            print(f"[ChatbotSessions] User {user_id} does not belong to class {class_id}")
            return create_response(False, message=f"User does not belong to class {class_id}.", status_code=403)

        # A freechat session
        if module_id == FREE_CHAT_MODULE:
            print(f"[ChatbotSessions] Creating free chat session for user {user_id}")
            return create_response(True, message="Free chat Chatbot session created.", data=createChatbotSession(user_id, FREE_CHAT_MODULE))

        # Check if module is configured as a Tito module for this class
        is_active_tito_module = isActiveTitoModule(class_id, module_id)
        print(f"[ChatbotSessions] Checking if module {module_id} is active Tito module in class {class_id}: {is_active_tito_module}")
        
        if not is_active_tito_module:
            print(f"[ChatbotSessions] Module {module_id} is not configured as a Tito module for class {class_id}")
            
            # Check if the module exists and is assigned to this class
            if not isModuleInClass(class_id, module_id):
                print(f"[ChatbotSessions] Module {module_id} is not assigned to class {class_id}")
                return create_response(success=False, message=f"Module {module_id} is not assigned to your class.", status_code=403)
            
            # Auto-configure the module as a Tito module
            print(f"[ChatbotSessions] Auto-configuring module {module_id} as Tito module for class {class_id}")
            try:
                insertNewTitoModule(module_id, class_id)
                print(f"[ChatbotSessions] Successfully configured module {module_id} as Tito module")
            except Exception as e:
                print(f"[ChatbotSessions] Failed to configure module {module_id} as Tito module: {e}")
                return create_response(success=False, message=f"Failed to configure module for Tito chat: {str(e)}", status_code=500)
            
        print(f"[ChatbotSessions] Creating chatbot session for user {user_id}, module {module_id}")
        session_id = createChatbotSession(user_id, module_id)
        print(f"[ChatbotSessions] Created session with ID: {session_id}")
        return create_response(True, message="Chatbot session created.", data=session_id)

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
            tito_response_data = handle_message(message)
            
            print("this1")
            tito_response = tito_response_data.get('response', "Sorry, I could not understand your message. Please try again!")
            print(tito_response)
            
            # TODO: Verify data
            newTitoMessage(user_id, session_id, tito_response_data.get('response'), module_id)
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

# COMMENTED OUT - Unused API endpoint
# class GetModuleProgress(Resource):
#     @jwt_required
#     def get(self):
#         user_id = get_jwt_identity()
#         module_id = request.args.get('moduleID')
# 
#         if not module_id:
#             return create_response(False, message="insufficient params provided", status_code=403)
#         res = getUserModuleProgress(user_id, module_id)
#         
#         return create_response(True, data=res)



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
            return create_response(False, message="Missing parameters.", status_code=404)
        if not userIsNotStudent(user_id, class_id):
            return create_response(False, message="user does not have required privileges.", status_code=403)
        if not isTitoClass(user_id, class_id):
            return create_response(False, message="Class is not currently a tito class.", status_code=403)
        if isTitoModule(class_id, module_id):
            return create_response(False, message="module is already a tito module.", status_code=404)
        if not isModuleInClass(class_id, module_id):
            return create_response(False, message="user does not have required privileges.", status_code=403)
        insertNewTitoModule(module_id, class_id)

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
        if not userIsNotStudent(user_id, class_id):
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
                inserts into tito_group_status if not previously a tito-enrolled class
        '''
        user_id = get_jwt_identity()
        data = request.form
        class_id = data.get('classID')

        if not class_id:
            return create_response(False, message="invalid params", status_code=403)
        if not userIsNotStudent(user_id, class_id):
            return create_response(False, message="invalid perms", status_code=403)
        if not isTitoClass(user_id, class_id):
            if createTitoClass(user_id, class_id):
                return create_response(True, message="Successfully made class into a tito-enabled class")
            else:
                return create_response(False, message="Failed to make class a Tito class. Valve please fix...", status_code=500)
            
        if not updateTitoGroupStatus(user_id, class_id):
            return create_response(False, message="failed to update tito class", status_code=400)

        return create_response(True, message="updated tito class status")

# COMMENTED OUT - Unused API endpoint
# class GetClassModules(Resource):
#     @jwt_required
#     def get(self):
#         '''
#         /elleapi/twt/professor/modules
#             Gets all modules in a class and their Tito status
#             Requires: classID
#         '''
#         user_id = get_jwt_identity()
#         class_id = request.args.get('classID')
#         
#         if not class_id:
#             return create_response(False, message="Missing classID parameter.", status_code=400)
#         
#         # Check if user has professor/TA permissions for this class
#         if not userIsNotStudent(user_id, class_id):
#             return create_response(False, message="User does not have required privileges.", status_code=403)
#         
#         try:
#             # Get all modules in the class
#             from resources.modules import RetrieveGroupModules
#             from utils import getFromDB
#             
#             # Query to get all modules in the class with Tito status
#             query = '''
#                 SELECT DISTINCT m.moduleID, m.name, m.language, m.complexity,
#                        tm.status as titoStatus, tm.startDate, tm.endDate
#                 FROM module m
#                 INNER JOIN group_module gm ON m.moduleID = gm.moduleID
#                 LEFT JOIN tito_module tm ON m.moduleID = tm.moduleID AND tm.classID = %s
#                 WHERE gm.groupID = %s
#                 ORDER BY m.name
#             '''
#             
#             result = getFromDB(query, (class_id, class_id))
#             
#             modules = []
#             for row in result:
#                 modules.append({
#                     'moduleID': row[0],
#                     'name': row[1],
#                     'language': row[2],
#                     'complexity': row[3],
#                     'titoStatus': row[4] if row[4] else 'not_configured',
#                     'startDate': str(row[5]) if row[5] else None,
#                     'endDate': str(row[6]) if row[6] else None,
#                     'isTitoModule': bool(row[4])
#                 })
#             
#             print(f"[GetClassModules] Found {len(modules)} modules for class {class_id}")
#             return create_response(True, message=f"Retrieved {len(modules)} modules for class.", data=modules)
#             
#         except Exception as e:
#             print(f"[GetClassModules] Error retrieving modules: {e}")
#             return create_response(False, message="Error retrieving class modules.", status_code=500)

# COMMENTED OUT - Unused API endpoint
# class GetClassStudents(Resource):
    @jwt_required
    def get(self):
        '''
        /elleapi/twt/professor/students
            Gets all students enrolled in a class
            Requires: classID
        '''
        user_id = get_jwt_identity()
        class_id = request.args.get('classID')
        
        if not class_id:
            return create_response(False, message="Missing classID parameter.", status_code=400)
        
        # Check if user has professor/TA permissions for this class
        if not userIsNotStudent(user_id, class_id):
            return create_response(False, message="User does not have required privileges.", status_code=403)
        
        try:
            from utils import getFromDB
            
            # Query to get all students in the class
            query = '''
                SELECT DISTINCT u.userID, u.userName, u.email, gu.accessLevel
                FROM user u
                INNER JOIN group_user gu ON u.userID = gu.userID
                WHERE gu.groupID = %s
                ORDER BY gu.accessLevel, u.userName
            '''
            
            result = getFromDB(query, (class_id,))
            
            students = []
            for row in result:
                students.append({
                    'userID': row[0],
                    'userName': row[1],
                    'email': row[2],
                    'accessLevel': row[3],
                    'isStudent': row[3] == 'st'
                })
            
            print(f"[GetClassStudents] Found {len(students)} users in class {class_id}")
            return create_response(True, message=f"Retrieved {len(students)} users for class.", data=students)
            
        except Exception as e:
            print(f"[GetClassStudents] Error retrieving students: {e}")
            return create_response(False, message="Error retrieving class students.", status_code=500)
        
# COMMENTED OUT - Unused API endpoint
# class GetStudentMessages(Resource):
    @jwt_required
    def get(self):
        '''
        /elleapi/twt/professor/messages
            For professors to fetch chat messages of a student in a specific module
            Requires: studentID, moduleID, classID
        '''
        user_id = get_jwt_identity()
        student_id = request.args.get('studentID')
        module_id = request.args.get('moduleID')
        class_id = request.args.get('classID')
        
        print(f"[GetStudentMessages] Professor {user_id} requesting messages for student {student_id}, module {module_id}, class {class_id}")
        
        if not student_id or not module_id or not class_id:
            return create_response(False, message="Missing required parameters: studentID, moduleID, classID", status_code=400)
        
        # Check if user has professor/TA permissions for this class
        if not userIsNotStudent(user_id, class_id):
            return create_response(False, message="User does not have required privileges to view student messages.", status_code=403)
        
        # Check if student is in the class
        if not isUserInClass(student_id, class_id):
            return create_response(False, message="Student is not enrolled in this class.", status_code=403)
        
        # Check if module is a Tito module in this class
        if not isTitoModule(class_id, module_id):
            return create_response(False, message="Module is not configured as a Tito module in this class.", status_code=404)
        
        try:
            # Get the student's chat history for this module
            messages = loadModuleChatHistory(student_id, module_id)
            print(f"[GetStudentMessages] Found {len(messages)} messages for student {student_id} in module {module_id}")
            
            return create_response(True, message=f"Retrieved {len(messages)} messages for student.", data=messages)
        except Exception as e:
            print(f"[GetStudentMessages] Error retrieving messages: {e}")
            return create_response(False, message="Error retrieving student messages.", status_code=500)

# COMMENTED OUT - Unused API endpoint
# class GetStudentProgress(Resource):
    @jwt_required
    def get(self):
        '''
        /elleapi/twt/professor/progress
            Gets a student's progress in a specific Tito module
            Requires: studentID, moduleID, classID
        '''
        user_id = get_jwt_identity()
        student_id = request.args.get('studentID')
        module_id = request.args.get('moduleID')
        class_id = request.args.get('classID')
        
        if not student_id or not module_id or not class_id:
            return create_response(False, message="Missing required parameters: studentID, moduleID, classID", status_code=400)
        
        # Check if user has professor/TA permissions for this class
        if not userIsNotStudent(user_id, class_id):
            return create_response(False, message="User does not have required privileges.", status_code=403)
        
        # Check if student is in the class
        if not isUserInClass(student_id, class_id):
            return create_response(False, message="Student is not enrolled in this class.", status_code=403)
        
        # Check if module is a Tito module in this class
        if not isTitoModule(class_id, module_id):
            return create_response(False, message="Module is not configured as a Tito module in this class.", status_code=404)
        
        try:
            from utils import getFromDB
            
            # Get student's module progress
            progress_query = '''
                SELECT tmp.totalTermsUsed, tmp.termsMastered, tmp.proficiencyRate,
                       COUNT(DISTINCT cs.chatbotSID) as totalSessions,
                       SUM(cs.totalTimeChatted) as totalTimeMinutes,
                       COUNT(DISTINCT m.messageID) as totalMessages
                FROM tito_module_progress tmp
                LEFT JOIN chatbot_sessions cs ON tmp.studentID = cs.userID AND tmp.moduleID = cs.moduleID
                LEFT JOIN messages m ON cs.chatbotSID = m.chatbotSID AND m.source = 'user'
                WHERE tmp.studentID = %s AND tmp.moduleID = %s
                GROUP BY tmp.studentID, tmp.moduleID
            '''
            
            progress_result = getFromDB(progress_query, (student_id, module_id))
            
            if not progress_result:
                return create_response(False, message="No progress data found for this student and module.", status_code=404)
            
            progress = progress_result[0]
            
            # Get term-specific progress
            terms_query = '''
                SELECT ttp.termID, t.front, t.back, ttp.timesUsed, ttp.timesMisspelled, ttp.hasMastered
                FROM tito_term_progress ttp
                INNER JOIN term t ON ttp.termID = t.termID
                WHERE ttp.userID = %s AND ttp.moduleID = %s
                ORDER BY t.front
            '''
            
            terms_result = getFromDB(terms_query, (student_id, module_id))
            
            terms_progress = []
            for term_row in terms_result:
                terms_progress.append({
                    'termID': term_row[0],
                    'front': term_row[1],
                    'back': term_row[2],
                    'timesUsed': term_row[3],
                    'timesMisspelled': term_row[4],
                    'hasMastered': bool(term_row[5])
                })
            
            student_progress = {
                'studentID': int(student_id),
                'moduleID': int(module_id),
                'totalTermsUsed': progress[0] or 0,
                'termsMastered': progress[1] or 0,
                'proficiencyRate': float(progress[2]) if progress[2] else 0.0,
                'totalSessions': progress[3] or 0,
                'totalTimeMinutes': float(progress[4]) if progress[4] else 0.0,
                'totalMessages': progress[5] or 0,
                'termsProgress': terms_progress
            }
            
            print(f"[GetStudentProgress] Retrieved progress for student {student_id} in module {module_id}")
            return create_response(True, message="Retrieved student progress.", data=student_progress)
            
        except Exception as e:
            print(f"[GetStudentProgress] Error retrieving progress: {e}")
            return create_response(False, message="Error retrieving student progress.", status_code=500)

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

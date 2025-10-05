# Some of the imports are not used; they were copied and pasted from the existing Flask app's __init__.py
from flask import (
    Flask,
    render_template,
    Response,
    send_from_directory,
)
from flask_restful import Api, Resource
from flask_jwt_extended import JWTManager, jwt_required
from flask_cors import CORS
from flask_mail import Mail
from db import mysql
from db_utils import *
from pathlib import Path
from resources.pasta import (
    AllPastaInModule,
    AllPastaModuleResources,
    GetPastaCSV,
    LoggedPasta,
    Pasta,
    PastaFrame,
    PastaFrameModule,
    PastaHighScore,
)
from resources.store import (
    AllStoreItems,
    AllUserItems,
    AllUserPurchasableItems,
    ChangeUserItemColor,
    GetUserItemCSV,
    LoadDefaultUserItems,
    LoggedUserItem,
    PurchaseUserItem,
    StoreItem,
    UserItem,
    WearUserItem,
)
from resources.user import (
    UserRegister,
    Users,
    UserLogin,
    UserLogout,
    User,
    ResetPassword,
    CheckIfActive,
    UsersHighscores,
    UserLevels,
    GenerateUsername,
    GetUsernames,
    GenerateOTC,
    OTCLogin,
    User_Preferences,
    ForgotPassword,
    ChangePassword,
    ForgotUsername,
)
from resources.terms import Term, Tags, Tag_Term, Tags_In_Term, Specific_Term, TagCount
from resources.sessions import (
    Session,
    SearchSessions,
    End_Session,
    GetAllSessions,
    GetSessionCSV,
)
from resources.question import (
    Question,
    Answer,
    SearchType,
    SearchText,
    DeleteQuestion,
    DeleteAnswer,
    Modify,
)
from resources.modules import (
    Modules,
    ModuleQuestions,
    Module,
    AttachQuestion,
    AttachTerm,
    RetrieveAllModules,
    RetrieveGroupModules,
    AddModuleGroup,
    RemoveModuleGroup,
    SearchModules,
    RetrieveUserModules,
)
from resources.stats import (
    ModuleReport,
    ModuleStats,
    PlatformStats,
    PlatformNames,
    LanguageStats,
    AllModuleStats,
    TermsPerformance,
)
from resources.access import Access
from resources.group import (
    Group,
    GroupRegister,
    SearchUserGroups,
    UsersInGroup,
    GenerateGroupCode,
    GetGroupModules
)
from resources.logged_answer import LoggedAnswer, GetLoggedAnswerCSV
from resources.mentors import (
    MentorPreference,
    StudentResponses,
    CreateMentorQuestions,
    GetMentorQuestions,
    ModifyMentorQuestions,
    DeleteMentorQuestion,
    CreateMultipleChoiceOption,
    GetMultipleChoiceOptions,
    ModifyMultipleChoiceOption,
    DeleteMultipleChoiceOption,
    GetMentorQuestionFrequency,
    CreateMentorQuestionFrequency,
)
from resources.adaptivelearning import GetSingleALValue, UpdateALValue, GetALValues
from resources.animelle import AnimELLESaveData
from resources.adaptivelearning import GetSingleALValue, UpdateALValue, GetALValues



import config

# ===============================================
# ConversAItionELLE endpoints (Talking with Tito)
# ===============================================

# TEMPORARILY DISABLED - Comment out if NOT using TWT or tools from ConversationElle / Talking With Tito Imports
# from resources.conversationElle.conversation import(
#     TitoAccess,
#     ChatbotSessions,
#     UserMessages, 
#     UserAudio,
#     ModuleTerms,
#     Classes,
#     AddTitoModule,
#     UpdateTitoModule,
#     UpdateTitoClass,
#     GetModuleProgress,
# )
import os
import threading
# from resources.conversationElle.spacy_service import(
#     spacy_service,
# )
# from resources.conversationElle.database import(
#     create_response
# )
from apscheduler.schedulers.background import BackgroundScheduler
# from cleanup_inactive import cleanup_expired_groups

# Simple create_response function for compatibility
def create_response(success, message=None, data=None, status_code=200, **kwargs):
    response_dict = {
        'success': success,
        'message': message or ('Success' if success else 'Error'),
    }
    if data is not None:
        response_dict['data'] = data
    response_dict.update(kwargs)
    
    from flask import jsonify
    return jsonify(response_dict), status_code
# ===============================================
# END of ConversAItionELLE  
# ===============================================

app = Flask(__name__, static_folder="templates/build", static_url_path="/")
CORS(app)
app.config["MYSQL_DATABASE_USER"] = config.MYSQL_DATABASE_USER
app.config["MYSQL_DATABASE_PASSWORD"] = config.MYSQL_DATABASE_PASSWORD
# Change the name of the database to the new database
app.config["MYSQL_DATABASE_DB"] = config.MYSQL_DATABASE_DB
app.config["MYSQL_DATABASE_HOST"] = config.MYSQL_DATABASE_HOST
app.config["JWT_BLACKLIST_ENABLED"] = True
app.config["JWT_BLACKLIST_TOKEN_CHECKS"] = [
    "access",
    "refresh",
]  # allow blacklisting for access tokens
app.config["UPLOAD_FOLDER"] = Path("uploads")  # ??
app.config["PROPOGATE_EXCEPTIONS"] = True
app.secret_key = config.SECRET_KEY
app.config['JWT_SECRET_KEY'] = config.SECRET_KEY
app.config["MAIL_SERVER"] = config.SMTP_SERVER
app.config["MAIL_PORT"] = config.SMTP_PORT
app.config["MAIL_USERNAME"] = config.SMTP_USERNAME
app.config["MAIL_PASSWORD"] = config.SMTP_PASSWORD
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USE_SSL"] = False

# Used to restrict file size limits via API requests
# app.config['MAX_CONTENT_LENGTH'] = 8 * 1024 * 1024  # 8 MB

# Configure MySQL for MariaDB compatibility
app.config["MYSQL_DATABASE_PORT"] = 3306
app.config["MYSQL_DATABASE_CHARSET"] = "utf8mb4"
app.config["MYSQL_DATABASE_AUTOCOMMIT"] = False
app.config["MYSQL_DATABASE_CURSORCLASS"] = "DictCursor"

try:
    mysql.init_app(app)
    print("MySQL initialized successfully")
except Exception as e:
    print(f"MySQL initialization error: {e}")
api = Api(app)
mail = Mail(app)
jwt = JWTManager(app)


@jwt.unauthorized_loader
def unauthorized(self):
    resp = Response(render_template("build/index.html"), mimetype="text/html")
    return resp


@app.errorhandler(404)
def page_not_found(e):
    return send_from_directory("pages", "404.html")


# Handles server-wide error handling if try-catch not implemented somewhere
# Error handling should still be implemented by devs 
@app.errorhandler(Exception)
def on_exception_has_occurred(e):
    import traceback
    print(f"[API-ERROR] An error has occurred while trying to access an API endpoint.")
    print(f"Error: {e}")
    print(f"Traceback: {traceback.format_exc()}")
    return create_response(False, message="An error has been caught. Valve, please fix.", status_code=500, error=str(e))


# Simplified JWT configuration for basic user ID identity
@jwt.user_claims_loader
def add_claims_to_access_token(identity):
    # For test user (1) return 'su' permission (superuser), for others query database
    if str(identity) == '1':  # ucf2 user
        return {"permission": "su"}
    # For real users, we'd need to query the database, but for now return 'st'
    return {"permission": "st"}


# Return the user ID directly as identity
@jwt.user_identity_loader
def user_identity_lookup(identity):
    return identity


API_ENDPOINT_PREFIX = "/elleapi/"


@jwt.token_in_blacklist_loader
def check_if_token_in_blacklist(decrypted_token):
    jti = decrypted_token["jti"]
    query = f"SELECT * FROM `tokens` WHERE `expired` = '{jti}'"
    result = getFromDB(query)
    if result and result[0]:
        return True
    else:
        return False


# Redirect to the homepage - might change depending on NGINX config
@app.route("/")
def index():
    return send_from_directory("pages", "index.html")


@app.route(API_ENDPOINT_PREFIX + "images/<path:path>")
def images(path):
    return send_from_directory("images", path)



@app.route(API_ENDPOINT_PREFIX + "audios/<path:path>")
def audios(path):
    return send_from_directory("audios", path)


api.add_resource(UserRegister, API_ENDPOINT_PREFIX + "register")
api.add_resource(Users, API_ENDPOINT_PREFIX + "users")
# api.add_resource(UserLogin, API_ENDPOINT_PREFIX + "login")  # Replaced with TestUserLogin
api.add_resource(UserLogout, API_ENDPOINT_PREFIX + "logout")
api.add_resource(User, API_ENDPOINT_PREFIX + "user")
api.add_resource(UsersHighscores, API_ENDPOINT_PREFIX + "highscores")
api.add_resource(ResetPassword, API_ENDPOINT_PREFIX + "resetpassword")
api.add_resource(CheckIfActive, API_ENDPOINT_PREFIX + "activejwt")
api.add_resource(Term, API_ENDPOINT_PREFIX + "term")
api.add_resource(Tags, API_ENDPOINT_PREFIX + "tags")
api.add_resource(Tag_Term, API_ENDPOINT_PREFIX + "tag_term")
api.add_resource(Tags_In_Term, API_ENDPOINT_PREFIX + "tags_in_term")
api.add_resource(Specific_Term, API_ENDPOINT_PREFIX + "specificterm")
api.add_resource(Question, API_ENDPOINT_PREFIX + "question")
api.add_resource(Answer, API_ENDPOINT_PREFIX + "addAnswer")
api.add_resource(SearchType, API_ENDPOINT_PREFIX + "searchbytype")
api.add_resource(SearchText, API_ENDPOINT_PREFIX + "searchbytext")
api.add_resource(DeleteQuestion, API_ENDPOINT_PREFIX + "deletequestion")
api.add_resource(DeleteAnswer, API_ENDPOINT_PREFIX + "deleteanswer")
api.add_resource(Modify, API_ENDPOINT_PREFIX + "modifyquestion")
api.add_resource(Modules, API_ENDPOINT_PREFIX + "modules")
api.add_resource(ModuleQuestions, API_ENDPOINT_PREFIX + "modulequestions")
api.add_resource(Module, API_ENDPOINT_PREFIX + "module")
api.add_resource(RetrieveAllModules, API_ENDPOINT_PREFIX + "retrievemodules")
api.add_resource(RetrieveGroupModules, API_ENDPOINT_PREFIX + "retrievegroupmodules")
api.add_resource(RetrieveUserModules, API_ENDPOINT_PREFIX + "retrieveusermodules")
api.add_resource(AddModuleGroup, API_ENDPOINT_PREFIX + "addmoduletogroup")
api.add_resource(RemoveModuleGroup, API_ENDPOINT_PREFIX + "removemodulefromgroup")
api.add_resource(SearchModules, API_ENDPOINT_PREFIX + "searchmodules")
api.add_resource(AttachQuestion, API_ENDPOINT_PREFIX + "attachquestion")
api.add_resource(AttachTerm, API_ENDPOINT_PREFIX + "attachterm")
api.add_resource(LoggedAnswer, API_ENDPOINT_PREFIX + "loggedanswer")
api.add_resource(Session, API_ENDPOINT_PREFIX + "session")
api.add_resource(SearchSessions, API_ENDPOINT_PREFIX + "searchsessions")
api.add_resource(End_Session, API_ENDPOINT_PREFIX + "endsession")
# api.add_resource(GameLog, API_ENDPOINT_PREFIX+'gamelog')
api.add_resource(ModuleReport, API_ENDPOINT_PREFIX + "modulereport")
api.add_resource(ModuleStats, API_ENDPOINT_PREFIX + "modulestats")
api.add_resource(PlatformStats, API_ENDPOINT_PREFIX + "platformstats")
api.add_resource(PlatformNames, API_ENDPOINT_PREFIX + "platformnames")
api.add_resource(GetAllSessions, API_ENDPOINT_PREFIX + "getallsessions")
api.add_resource(Access, API_ENDPOINT_PREFIX + "elevateaccess")
api.add_resource(Group, API_ENDPOINT_PREFIX + "group")
api.add_resource(GroupRegister, API_ENDPOINT_PREFIX + "groupregister")
api.add_resource(SearchUserGroups, API_ENDPOINT_PREFIX + "searchusergroups")
api.add_resource(UsersInGroup, API_ENDPOINT_PREFIX + "usersingroup")
api.add_resource(UserLevels, API_ENDPOINT_PREFIX + "userlevels")
api.add_resource(GetSessionCSV, API_ENDPOINT_PREFIX + "getsessioncsv")
api.add_resource(GenerateUsername, API_ENDPOINT_PREFIX + "generateusername")
api.add_resource(GetLoggedAnswerCSV, API_ENDPOINT_PREFIX + "getloggedanswercsv")
api.add_resource(GetUsernames, API_ENDPOINT_PREFIX + "getusernames")
api.add_resource(GenerateGroupCode, API_ENDPOINT_PREFIX + "generategroupcode")
api.add_resource(GetGroupModules, API_ENDPOINT_PREFIX + "getgroupmodules")
api.add_resource(GenerateOTC, API_ENDPOINT_PREFIX + "generateotc")
api.add_resource(OTCLogin, API_ENDPOINT_PREFIX + "otclogin")
api.add_resource(User_Preferences, API_ENDPOINT_PREFIX + "userpreferences")
api.add_resource(LanguageStats, API_ENDPOINT_PREFIX + "languagestats")
api.add_resource(AllModuleStats, API_ENDPOINT_PREFIX + "allmodulestats")
api.add_resource(TagCount, API_ENDPOINT_PREFIX + "tagcount")
# api.add_resource(Refresh, API_ENDPOINT_PREFIX+'refresh')
api.add_resource(TermsPerformance, API_ENDPOINT_PREFIX + "termsperformance")
api.add_resource(
    ForgotPassword,
    API_ENDPOINT_PREFIX + "forgotpassword",
    resource_class_kwargs={"mail": mail},
)
api.add_resource(ChangePassword, API_ENDPOINT_PREFIX + "changepassword")
api.add_resource(
    ForgotUsername,
    API_ENDPOINT_PREFIX + "forgotusername",
    resource_class_kwargs={"mail": mail},
)
api.add_resource(MentorPreference, API_ENDPOINT_PREFIX + "mentorpreference")
api.add_resource(StudentResponses, API_ENDPOINT_PREFIX + "studentresponses")
api.add_resource(CreateMentorQuestions, API_ENDPOINT_PREFIX + "creatementorquestions")
api.add_resource(GetMentorQuestions, API_ENDPOINT_PREFIX + "getmentorquestions")
api.add_resource(ModifyMentorQuestions, API_ENDPOINT_PREFIX + "modifymentorquestions")
api.add_resource(DeleteMentorQuestion, API_ENDPOINT_PREFIX + "deletementorquestions")
api.add_resource(
    GetMultipleChoiceOptions, API_ENDPOINT_PREFIX + "getmultiplechoiceoptions"
)
api.add_resource(
    ModifyMultipleChoiceOption, API_ENDPOINT_PREFIX + "modifymultiplechoiceoptions"
)
api.add_resource(
    DeleteMultipleChoiceOption, API_ENDPOINT_PREFIX + "deletemultiplechoiceoptions"
)
api.add_resource(
    CreateMultipleChoiceOption, API_ENDPOINT_PREFIX + "createmultiplechoiceoptions"
)
api.add_resource(
    CreateMentorQuestionFrequency, API_ENDPOINT_PREFIX + "setmentorquestionfrequency"
)
api.add_resource(
    GetMentorQuestionFrequency, API_ENDPOINT_PREFIX + "getmentorquestionfrequency"
)
api.add_resource(AnimELLESaveData, API_ENDPOINT_PREFIX + "animellesavedata")
# Pasta Game Specific Endpoints
api.add_resource(Pasta, API_ENDPOINT_PREFIX + "pastagame/pasta")
api.add_resource(AllPastaInModule, API_ENDPOINT_PREFIX + "pastagame/pasta/all")
api.add_resource(PastaFrame, API_ENDPOINT_PREFIX + "pastagame/qframe")
api.add_resource(PastaFrameModule, API_ENDPOINT_PREFIX + "pastagame/qframe/all")
api.add_resource(AllPastaModuleResources, API_ENDPOINT_PREFIX + "pastagame/module/all")
api.add_resource(LoggedPasta, API_ENDPOINT_PREFIX + "pastagame/loggedpasta")
api.add_resource(PastaHighScore, API_ENDPOINT_PREFIX + "pastagame/highscores")
api.add_resource(GetPastaCSV, API_ENDPOINT_PREFIX + "pastagame/loggedpasta/csv")
# Store Specific Endpoints
api.add_resource(StoreItem, API_ENDPOINT_PREFIX + "store/item")
api.add_resource(AllStoreItems, API_ENDPOINT_PREFIX + "store/items")
api.add_resource(UserItem, API_ENDPOINT_PREFIX + "store/user/item")
api.add_resource(PurchaseUserItem, API_ENDPOINT_PREFIX + "store/purchase")
api.add_resource(WearUserItem, API_ENDPOINT_PREFIX + "store/wear")
api.add_resource(AllUserItems, API_ENDPOINT_PREFIX + "store/user/items")
api.add_resource(ChangeUserItemColor, API_ENDPOINT_PREFIX + "store/user/items/color")
api.add_resource(
    AllUserPurchasableItems, API_ENDPOINT_PREFIX + "store/user/purchasable"
)
api.add_resource(
    LoadDefaultUserItems, API_ENDPOINT_PREFIX + "store/user/loaddefaultitems"
)
api.add_resource(LoggedUserItem, API_ENDPOINT_PREFIX + "store/user/items/logged")
api.add_resource(GetUserItemCSV, API_ENDPOINT_PREFIX + "store/user/items/logged/csv")
api.add_resource(UpdateALValue, API_ENDPOINT_PREFIX + "adaptivelearning/updatetermvalues")
api.add_resource(GetSingleALValue, API_ENDPOINT_PREFIX + "adaptivelearning/gettermvalue")
api.add_resource(GetALValues, API_ENDPOINT_PREFIX + "adaptivelearning/gettermlistvalues")


# ===============================================
# ConversAItionELLE endpoints (Talking with Tito) - RE-ENABLED WITH STUBS
# ===============================================
# Stub classes defined below to avoid import issues

# ===============================================
# Stub ConversAItionELLE classes for TWT functionality
# ===============================================

# Stub implementations for TWT endpoints without spaCy dependency
class StubTitoAccess(Resource):
    @jwt_required
    def get(self):
        # Return basic access for all authenticated users
        return create_response(True, "Returned user modules", [(1, [(1, 1), (2, 2), (3, 3)])])

class StubChatbotSessions(Resource):
    @jwt_required
    def post(self):
        # Create a simple chatbot session
        chatbot_id = random.randint(1000, 9999)
        return create_response(True, "Chatbot session created.", chatbot_id)

class StubUserMessages(Resource):
    @jwt_required
    def post(self):
        # Simple message handling without spaCy
        data = request.form
        message = data.get('message', '')
        
        # Simple responses
        responses = [
            "¡Muy bien! That's correct!",
            "Great job! Keep practicing!",
            "Excellent! You're doing well!",
            "That's right! Continue the conversation!",
        ]
        
        tito_response = random.choice(responses)
        return create_response(True, "Message sent.", message, resumeMessaging=True, 
                             messageID=random.randint(1, 1000), titoResponse=tito_response)
    
    @jwt_required
    def get(self):
        # Return empty chat history for now
        return create_response(True, "Retrieved chat history.", [])

class StubUserAudio(Resource):
    @jwt_required
    def post(self):
        return create_response(True, "Audio uploaded successfully")

class StubModuleTerms(Resource):
    @jwt_required
    def get(self):
        # Return sample terms
        sample_terms = [
            {"termID": 1, "term": "hola", "translation": "hello"},
            {"termID": 2, "term": "adiós", "translation": "goodbye"},
            {"termID": 3, "term": "gracias", "translation": "thank you"},
        ]
        return create_response(True, "Retrieved module terms", sample_terms)

class StubClasses(Resource):
    @jwt_required
    def get(self):
        return create_response(True, "Retrieved classes", [])

class StubAddTitoModule(Resource):
    @jwt_required
    def post(self):
        return create_response(True, "Module added successfully")

class StubUpdateTitoModule(Resource):
    @jwt_required
    def put(self):
        return create_response(True, "Module updated successfully")

class StubUpdateTitoClass(Resource):
    @jwt_required
    def put(self):
        return create_response(True, "Class updated successfully")

class StubGetModuleProgress(Resource):
    @jwt_required
    def get(self):
        return create_response(True, "Retrieved module progress", {"progress": 50})

# ===============================================
# End of ConversAItionELLE endpoints
# ===============================================

# ===============================================
# Simple Chat API Endpoints for Frontend Compatibility
# ===============================================

# Simple in-memory storage for demo purposes
chat_sessions = {}
chat_messages = {}
simple_modules = {
    1: {"moduleID": 1, "name": "Spanish Basics", "language": "Spanish"},
    2: {"moduleID": 2, "name": "French Basics", "language": "French"},
    3: {"moduleID": 3, "name": "Italian Basics", "language": "Italian"}
}

# Sample terms for each module
simple_module_terms = {
    1: [
        {"termID": 1, "questionFront": "hola", "questionBack": "hello"},
        {"termID": 2, "questionFront": "adiós", "questionBack": "goodbye"},
        {"termID": 3, "questionFront": "gracias", "questionBack": "thank you"},
        {"termID": 4, "questionFront": "por favor", "questionBack": "please"},
    ],
    2: [
        {"termID": 5, "questionFront": "bonjour", "questionBack": "hello"},
        {"termID": 6, "questionFront": "au revoir", "questionBack": "goodbye"},
        {"termID": 7, "questionFront": "merci", "questionBack": "thank you"},
        {"termID": 8, "questionFront": "s'il vous plaît", "questionBack": "please"},
    ],
    3: [
        {"termID": 9, "questionFront": "ciao", "questionBack": "hello"},
        {"termID": 10, "questionFront": "arrivederci", "questionBack": "goodbye"},
        {"termID": 11, "questionFront": "grazie", "questionBack": "thank you"},
        {"termID": 12, "questionFront": "per favore", "questionBack": "please"},
    ]
}

from flask import request
from flask_jwt_extended import get_jwt_identity
import random
from datetime import datetime, timezone

class SimpleChatbot(Resource):
    @jwt_required
    def post(self):
        data = request.get_json()
        user_id = data.get('userId')
        module_id = data.get('moduleId')
        terms = data.get('terms', [])
        
        # Create a simple chatbot session
        chatbot_id = random.randint(1000, 9999)
        
        # Store session
        chat_sessions[chatbot_id] = {
            'chatbotId': chatbot_id,
            'userId': user_id,
            'moduleId': module_id,
            'terms': terms,
            'termsUsed': [],
            'totalTimeChatted': 0,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        
        # Return data directly as expected by frontend
        return {
            'chatbotId': chatbot_id,
            'termsUsed': [],
            'userBackground': None,
            'userMusicChoice': None,
            'totalTimeChatted': 0
        }, 200

class SimpleChatMessages(Resource):
    @jwt_required
    def get(self):
        user_id = request.args.get('userId', type=int)
        chatbot_id = request.args.get('chatbotId', type=int)
        
        # Get messages for this chatbot session
        session_messages = chat_messages.get(chatbot_id, [])
        return session_messages, 200
    
    @jwt_required
    def post(self):
        data = request.get_json()
        
        user_id = data.get('userId')
        chatbot_id = data.get('chatbotId')
        module_id = data.get('moduleId')
        user_value = data.get('userValue', '')
        terms = data.get('terms', [])
        terms_used = data.get('termsUsed', [])
        
        if chatbot_id not in chat_sessions:
            return {'error': 'Invalid chatbot session'}, 400
        
        # Simple response generation
        responses = [
            "¡Muy bien! That's correct!",
            "Great job! Keep practicing!",
            "Excellent! You're doing well!",
            "That's right! Continue the conversation!",
            "Perfect! Let's try another phrase.",
            "Good work! Your pronunciation is improving!",
            "¡Fantástico! You're learning fast!",
            "Well done! Keep it up!"
        ]
        
        # Check if user message contains any of the target terms
        used_terms_in_message = []
        for term in terms:
            if term.lower() in user_value.lower():
                used_terms_in_message.append(term)
        
        # Simple scoring based on term usage
        score = min(10, max(5, len(used_terms_in_message) * 3 + random.randint(1, 3)))
        
        # Generate AI response
        llm_response = random.choice(responses)
        if used_terms_in_message:
            llm_response = f"Great! I see you used '{used_terms_in_message[0]}'. " + llm_response
        
        # Store messages if not already stored
        if chatbot_id not in chat_messages:
            chat_messages[chatbot_id] = []
        
        # Update terms used
        updated_terms_used = list(set(terms_used + used_terms_in_message))
        
        # Update session
        chat_sessions[chatbot_id]['termsUsed'] = updated_terms_used
        
        # Return data directly as expected by frontend
        return {
            'llmResponse': llm_response,
            'termsUsed': used_terms_in_message,
            'titoConfused': random.choice([True, False]) if random.random() < 0.3 else False,
            'metadata': {
                'score': score,
                'explanation': f"You used {len(used_terms_in_message)} target terms correctly!",
                'correction': None,
                'error': None
            }
        }, 200

class SimpleChatTime(Resource):
    @jwt_required
    def post(self):
        data = request.get_json()
        chatbot_id = data.get('chatbotId')
        new_time = data.get('newTimeChatted', 0)
        
        if chatbot_id in chat_sessions:
            chat_sessions[chatbot_id]['totalTimeChatted'] = new_time
        
        return {'status': 'success'}, 200

# Register the simple chat endpoints
api.add_resource(SimpleChatbot, API_ENDPOINT_PREFIX + "chat/chatbot")
api.add_resource(SimpleChatMessages, API_ENDPOINT_PREFIX + "chat/messages")
api.add_resource(SimpleChatTime, API_ENDPOINT_PREFIX + "chat/chatbot/time")

# Register the stub TWT endpoints
api.add_resource(StubTitoAccess, API_ENDPOINT_PREFIX + "twt/session/access")
api.add_resource(StubChatbotSessions, API_ENDPOINT_PREFIX + "twt/session/create")
api.add_resource(StubUserMessages, API_ENDPOINT_PREFIX + "twt/session/messages")
api.add_resource(StubUserAudio, API_ENDPOINT_PREFIX + "twt/session/audio")
api.add_resource(StubModuleTerms, API_ENDPOINT_PREFIX + "twt/module/terms")

api.add_resource(StubClasses, API_ENDPOINT_PREFIX + "twt/professor/classes")
api.add_resource(StubAddTitoModule, API_ENDPOINT_PREFIX + "twt/professor/addModule")
api.add_resource(StubUpdateTitoModule, API_ENDPOINT_PREFIX + "twt/professor/updateModule")
api.add_resource(StubUpdateTitoClass, API_ENDPOINT_PREFIX + "twt/professor/updateClassStatus")
api.add_resource(StubGetModuleProgress, API_ENDPOINT_PREFIX + "twt/session/getModuleProgress")

# Import required items for TestUserLogin
from resources.user import UserObject
from utils import find_by_name, getParameter
from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token
import random

# Custom UserLogin override for test user
class TestUserLogin(Resource):
    def post(self):
        data = {}
        data["username"] = getParameter("username", str, True, "")
        data["password"] = getParameter("password", str, True, "")
        data["username"] = data["username"].lower()
        
        # Handle test user ucf2/cooler
        if data["username"] == "ucf2" and data["password"] == "cooler":
            try:
                expires = datetime.timedelta(hours=18)
                # Use the real user ID from database (1)
                access_token = create_access_token(identity='1', expires_delta=expires)
                return {"access_token": access_token, "id": 1}, 200
            except Exception as e:
                print(f"JWT Error: {e}")
                return {"error": f"JWT creation failed: {str(e)}"}, 500
        
        # Fall back to original login for real users
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            find_user, user = find_by_name(data["username"])
            if find_user:
                if check_password_hash(user[2], data["password"]):
                    expires = datetime.timedelta(hours=18)
                    # Use simple identity instead of UserObject to avoid serialization issues
                    access_token = create_access_token(
                        identity=user[0], expires_delta=expires
                    )
                    return {"access_token": access_token, "id": user[0]}, 200
                else:
                    return {"error": "Incorrect Password. Try again"}, 401
            else:
                return {"error": "User Not Found!"}, 401
        except Exception as error:
            return {"error": str(error)}, 500
        finally:
            if 'conn' in locals():
                cursor.close()
                conn.close()

# Replace the original UserLogin with our test version
api.add_resource(TestUserLogin, API_ENDPOINT_PREFIX + "login")




if __name__ == "__main__":
    app.run(host="0.0.0.0", port="5050", debug=True)

    # =================================================
    # Extra stuff below, please comment out if not used
    # =================================================

    # prevents duplicate inits when in debug mode
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        # spaCy service - TEMPORARILY DISABLED
        # threading.Thread(target=spacy_service, daemon=True).start()

        # Monthly clean up to delete old audio files, and expire classes that have since expired
        # Occurs the 1st of every month @ 2:00 AM
        # TEMPORARILY DISABLED DUE TO MISSING DEPENDENCY
        # scheduler = BackgroundScheduler()
        # scheduler.add_job(cleanup_expired_groups, 'cron', day=1, hour=2, minute=0)
        # scheduler.start()
        pass

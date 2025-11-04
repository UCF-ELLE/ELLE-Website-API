# Some of the imports are not used; they were copied and pasted from the existing Flask app's __init__.py
from flask import (
    Flask,
    render_template,
    Response,
    send_from_directory,
)
from flask_restful import Api
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from db import mysql
from db_utils import *
from utils import create_response
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

# Comment out if NOT using TWT or tools from ConversationELLE / Talking With Tito Imports
from resources.conversationElle.conversation import(
    TitoAccess,
    ChatbotSessions,
    UserMessages, 
    UserAudio,
    ModuleTerms,
    Classes,
    AddTitoModule,
    UpdateTitoModule,
    UpdateTitoClass,
    GetModuleProgress,
    GetClassUsers,
    GetTitoLoreAssignment,
    UpdateLoreAssignment,
    CreateTitoLore,
    UpdateTitoLore,
    FetchAllOwnedTitoLore,
    FetchAllUserAudio,
    PFGetStudentMessages,
    GetTermProgress,
    # GenerateModule,

    # Testing,
    AIModuleGeneration,
)
import os
import threading
from resources.conversationElle.spacy_service import(
    spacy_service,
)

from apscheduler.schedulers.background import BackgroundScheduler
from cleanup_inactive import cleanup_expired_groups
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
app.config["MAIL_SERVER"] = config.SMTP_SERVER
app.config["MAIL_PORT"] = config.SMTP_PORT
app.config["MAIL_USERNAME"] = config.SMTP_USERNAME
app.config["MAIL_PASSWORD"] = config.SMTP_PASSWORD
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USE_SSL"] = False

# Used to restrict file size limits via API requests
# app.config['MAX_CONTENT_LENGTH'] = 8 * 1024 * 1024  # 8 MB

mysql.init_app(app)
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
    print(f"[API-ERROR] An error has occurred while trying to access an API endpoint. error: {e}")
    return create_response(False, message="An error has been caught. Valve, please fix.", status_code=500, error=str(e))


# Given a complex object, this returns the permission group
# stored in it when get_jwt_identity() is called
@jwt.user_claims_loader
def add_claims_to_access_token(user):
    return {"permission": user.permissionGroup}


# Given a complex object, this returns the user id stored in it
# when get_jwt_claims() is called
@jwt.user_identity_loader
def user_identity_lookup(user):
    return user.user_id


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
api.add_resource(UserLogin, API_ENDPOINT_PREFIX + "login")
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
# ConversAItionELLE endpoints (Talking with Tito)
# ===============================================
api.add_resource(TitoAccess, API_ENDPOINT_PREFIX + "twt/session/access")
api.add_resource(ChatbotSessions, API_ENDPOINT_PREFIX + "twt/session/create")
api.add_resource(UserMessages, API_ENDPOINT_PREFIX + "twt/session/messages")
api.add_resource(UserAudio, API_ENDPOINT_PREFIX + "twt/session/audio")
api.add_resource(ModuleTerms, API_ENDPOINT_PREFIX + "twt/module/terms")
api.add_resource(GetModuleProgress, API_ENDPOINT_PREFIX + "twt/session/getModuleProgress")
api.add_resource(FetchAllUserAudio, API_ENDPOINT_PREFIX + "twt/session/downloadAllUserAudio")

api.add_resource(Classes, API_ENDPOINT_PREFIX + "twt/session/classes")
api.add_resource(GetTitoLoreAssignment, API_ENDPOINT_PREFIX + "twt/session/getTitoLore")

api.add_resource(AddTitoModule, API_ENDPOINT_PREFIX + "twt/professor/addModule")
api.add_resource(UpdateTitoModule, API_ENDPOINT_PREFIX + "twt/professor/updateModule")
api.add_resource(UpdateTitoClass, API_ENDPOINT_PREFIX + "twt/professor/updateClassStatus")
api.add_resource(GetClassUsers, API_ENDPOINT_PREFIX + "twt/professor/getClassUsers")
api.add_resource(UpdateLoreAssignment, API_ENDPOINT_PREFIX + "twt/professor/changeAssignedLore")
api.add_resource(CreateTitoLore, API_ENDPOINT_PREFIX + "twt/professor/createNewTitoLore")
api.add_resource(UpdateTitoLore, API_ENDPOINT_PREFIX + "twt/professor/updateTitoLore")
api.add_resource(FetchAllOwnedTitoLore, API_ENDPOINT_PREFIX + "twt/professor/fetchOwnedTitoLore")
api.add_resource(PFGetStudentMessages, API_ENDPOINT_PREFIX + "twt/professor/getStudentMessages")
api.add_resource(GetTermProgress, "/elleapi/twt/session/getTermProgress")
# api.add_resource(GenerateModule, API_ENDPOINT_PREFIX + "twt/professor/generateModule")


# api.add_resource(UpdateTitoModule, API_ENDPOINT_PREFIX + "twt/professor/a")
# api.add_resource(UpdateTitoModule, API_ENDPOINT_PREFIX + "twt/professor/a")
# api.add_resource(UpdateTitoModule, API_ENDPOINT_PREFIX + "twt/professor/a")
# api.add_resource(UpdateTitoModule, API_ENDPOINT_PREFIX + "twt/professor/a")
# api.add_resource(UpdateTitoModule, API_ENDPOINT_PREFIX + "twt/professor/a")

# Temporary
# api.add_resource(Testing, API_ENDPOINT_PREFIX + "twt/testing")
api.add_resource(AIModuleGeneration, API_ENDPOINT_PREFIX + "ai/generate-module")  # Use /twt/professor/generateModule instead


# ===============================================
# End of ConversAItionELLE endpoints
# ===============================================




if __name__ == "__main__":
    app.run(host="0.0.0.0", port="5050", debug=True)

    # =================================================
    # Extra stuff below, please comment out if not used
    # =================================================

    # prevents duplicate inits when in debug mode
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        # spaCy service
        threading.Thread(target=spacy_service, daemon=True).start()

        # Monthly clean up to delete old audio files, and expire classes that have since expired
        # Occurs the 1st of every month @ 2:00 AM
        scheduler = BackgroundScheduler()
        scheduler.add_job(cleanup_expired_groups, 'cron', day_of_week='sun', hour=1, minute=0)
        scheduler.start()
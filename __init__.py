#Some of the imports are not used; they were copied and pasted from the existing Flask app's __init__.py
from flask import (Flask, render_template, Response, 
				   request, send_file, send_from_directory, jsonify)
from flask_restful import Resource, Api
from flask_jwt_extended import JWTManager
from flaskext.mysql import MySQL
from flask_cors import CORS
from flask_mail import Mail
from db import mysql
from db_utils import *
from pathlib import Path
from resources.user import (UserRegister, Users, UserLogin, UserLogout,
							User, ResetPassword, CheckIfActive, UsersHighscores,
							UserLevels, GenerateUsername, GetUsernames,
							GenerateOTC, OTCLogin, User_Preferences,
							ForgotPassword, ChangePassword, ForgotUsername)
from resources.terms import (Term, Tags, Tag_Term, Tags_In_Term, 
							 Specific_Term, TagCount)
from resources.sessions import (Session, SearchSessions, End_Session, 
								GetAllSessions, GetSessionCSV)
from resources.question import (Question, Answer, SearchType, SearchText, 
								DeleteQuestion, DeleteAnswer, Modify)
from resources.modules import (Modules, ModuleQuestions, Module, AttachQuestion, 
							   AttachTerm, RetrieveAllModules, RetrieveGroupModules, 
							   AddModuleGroup, SearchModules, RetrieveUserModules)
from resources.stats import (ModuleReport, ModuleStats, PlatformStats, 
							 PlatformNames, LanguageStats, AllModuleStats,
							 TermsPerformance)
from resources.access import Access
from resources.group import (Group, GroupRegister, SearchUserGroups, 
							 UsersInGroup, GenerateGroupCode)
from resources.logged_answer import LoggedAnswer, GetLoggedAnswerCSV
from resources.mentors import MentorPreference, StudentResponses
import os.path
import config

app = Flask(__name__, static_folder='templates/build', static_url_path='/')
CORS(app)
app.config['MYSQL_DATABASE_USER'] = config.MYSQL_DATABASE_USER
app.config['MYSQL_DATABASE_PASSWORD'] = config.MYSQL_DATABASE_PASSWORD
#Change the name of the database to the new database
app.config['MYSQL_DATABASE_DB'] = config.MYSQL_DATABASE_DB
app.config['MYSQL_DATABASE_HOST'] = config.MYSQL_DATABASE_HOST
app.config['JWT_BLACKLIST_ENABLED'] = True
app.config['JWT_BLACKLIST_TOKEN_CHECKS'] = ['access', 'refresh']  # allow blacklisting for access tokens
app.config['UPLOAD_FOLDER'] = Path('uploads') #??
app.config['PROPOGATE_EXCEPTIONS'] = True
app.secret_key = config.SECRET_KEY
app.config['MAIL_SERVER'] = config.SMTP_SERVER
app.config['MAIL_PORT'] = config.SMTP_PORT
app.config['MAIL_USERNAME'] = config.SMTP_USERNAME
app.config['MAIL_PASSWORD'] = config.SMTP_PASSWORD
app.config['MAIL_USE_TLS'] = True

mysql.init_app(app)
api = Api(app)
mail = Mail(app)
jwt = JWTManager(app)

@jwt.unauthorized_loader
def unauthorized(self):
	resp = Response(render_template('build/index.html'), mimetype='text/html')
	return resp

@app.errorhandler(404)
def page_not_found(e):
	resp = Response(render_template('build/index.html'), mimetype='text/html')
	return resp


# Given a complex object, this returns the permission group
# stored in it when get_jwt_identity() is called
@jwt.user_claims_loader
def add_claims_to_access_token(user):
    return {'permission' : user.permissionGroup}


# Given a complex object, this returns the user id stored in it
# when get_jwt_claims() is called
@jwt.user_identity_loader
def user_identity_lookup(user):
    return user.user_id


API_ENDPOINT_PREFIX = '/elleapi/'


class HomePage(Resource):
	def get(self):
		resp = Response(render_template('build/index.html'), mimetype='text/html')
		return resp


@jwt.token_in_blacklist_loader
def check_if_token_in_blacklist(decrypted_token):
    jti = decrypted_token['jti']
    query = f"SELECT * FROM `tokens` WHERE `expired` = '{jti}'"
    result = getFromDB(query)
    if result and result[0]:
    	return True
    else:
    	return False

# Redirect to the homepage - might change depending on NGINX config
@app.route('/')
def index():
	return app.send_static_file('index.html')

api.add_resource(UserRegister, API_ENDPOINT_PREFIX+'register')
api.add_resource(Users, API_ENDPOINT_PREFIX+'users')
api.add_resource(UserLogin, API_ENDPOINT_PREFIX+'login')
api.add_resource(UserLogout, API_ENDPOINT_PREFIX+'logout')
api.add_resource(User, API_ENDPOINT_PREFIX+'user')
api.add_resource(UsersHighscores,API_ENDPOINT_PREFIX+'highscores')
api.add_resource(ResetPassword, API_ENDPOINT_PREFIX+'resetpassword')
api.add_resource(CheckIfActive, API_ENDPOINT_PREFIX+'activejwt')
api.add_resource(Term, API_ENDPOINT_PREFIX+'term')
api.add_resource(Tags, API_ENDPOINT_PREFIX+'tags')
api.add_resource(Tag_Term, API_ENDPOINT_PREFIX+'tag_term')
api.add_resource(Tags_In_Term, API_ENDPOINT_PREFIX+'tags_in_term')
api.add_resource(Specific_Term, API_ENDPOINT_PREFIX+'specificterm')
api.add_resource(Question, API_ENDPOINT_PREFIX+'question')
api.add_resource(Answer, API_ENDPOINT_PREFIX+'addAnswer')
api.add_resource(SearchType,API_ENDPOINT_PREFIX+'searchbytype')
api.add_resource(SearchText,API_ENDPOINT_PREFIX+'searchbytext')
api.add_resource(DeleteQuestion,API_ENDPOINT_PREFIX+'deletequestion')
api.add_resource(DeleteAnswer,API_ENDPOINT_PREFIX+'deleteanswer')
api.add_resource(Modify, API_ENDPOINT_PREFIX+'modifyquestion')
api.add_resource(Modules,API_ENDPOINT_PREFIX+'modules')
api.add_resource(ModuleQuestions,API_ENDPOINT_PREFIX+'modulequestions')
api.add_resource(Module,API_ENDPOINT_PREFIX+'module')
api.add_resource(RetrieveAllModules, API_ENDPOINT_PREFIX+'retrievemodules')
api.add_resource(RetrieveGroupModules, API_ENDPOINT_PREFIX+'retrievegroupmodules')
api.add_resource(RetrieveUserModules, API_ENDPOINT_PREFIX+'retrieveusermodules')
api.add_resource(AddModuleGroup, API_ENDPOINT_PREFIX+'addmoduletogroup')
api.add_resource(SearchModules, API_ENDPOINT_PREFIX+'searchmodules')
api.add_resource(AttachQuestion, API_ENDPOINT_PREFIX+'attachquestion')
api.add_resource(AttachTerm, API_ENDPOINT_PREFIX+'attachterm')
api.add_resource(LoggedAnswer, API_ENDPOINT_PREFIX+'loggedanswer')
api.add_resource(Session, API_ENDPOINT_PREFIX+'session')
api.add_resource(SearchSessions, API_ENDPOINT_PREFIX+'searchsessions')
api.add_resource(End_Session, API_ENDPOINT_PREFIX+'endsession')
# api.add_resource(GameLog, API_ENDPOINT_PREFIX+'gamelog')
api.add_resource(ModuleReport, API_ENDPOINT_PREFIX+'modulereport')
api.add_resource(ModuleStats, API_ENDPOINT_PREFIX+'modulestats')
api.add_resource(PlatformStats, API_ENDPOINT_PREFIX+'platformstats')
api.add_resource(PlatformNames, API_ENDPOINT_PREFIX+'platformnames')
api.add_resource(GetAllSessions, API_ENDPOINT_PREFIX+'getallsessions')
api.add_resource(Access, API_ENDPOINT_PREFIX+'elevateaccess')
api.add_resource(Group, API_ENDPOINT_PREFIX+'group')
api.add_resource(GroupRegister, API_ENDPOINT_PREFIX+'groupregister')
api.add_resource(SearchUserGroups, API_ENDPOINT_PREFIX+'searchusergroups')
api.add_resource(UsersInGroup, API_ENDPOINT_PREFIX+'usersingroup')
api.add_resource(UserLevels, API_ENDPOINT_PREFIX+'userlevels')
api.add_resource(GetSessionCSV, API_ENDPOINT_PREFIX+'getsessioncsv')
api.add_resource(GenerateUsername, API_ENDPOINT_PREFIX+'generateusername')
api.add_resource(GetLoggedAnswerCSV, API_ENDPOINT_PREFIX+'getloggedanswercsv')
api.add_resource(GetUsernames, API_ENDPOINT_PREFIX+'getusernames')
api.add_resource(GenerateGroupCode, API_ENDPOINT_PREFIX+'generategroupcode')
api.add_resource(GenerateOTC, API_ENDPOINT_PREFIX+'generateotc')
api.add_resource(OTCLogin, API_ENDPOINT_PREFIX+'otclogin')
api.add_resource(User_Preferences, API_ENDPOINT_PREFIX+'userpreferences')
api.add_resource(LanguageStats, API_ENDPOINT_PREFIX+'languagestats')
api.add_resource(AllModuleStats, API_ENDPOINT_PREFIX+'allmodulestats')
api.add_resource(TagCount, API_ENDPOINT_PREFIX+'tagcount')
# api.add_resource(Refresh, API_ENDPOINT_PREFIX+'refresh')
api.add_resource(TermsPerformance, API_ENDPOINT_PREFIX+'termsperformance')
api.add_resource(ForgotPassword, API_ENDPOINT_PREFIX+'forgotpassword', resource_class_kwargs={'mail' : mail})
api.add_resource(ChangePassword, API_ENDPOINT_PREFIX+'changepassword')
api.add_resource(ForgotUsername, API_ENDPOINT_PREFIX+'forgotusername', resource_class_kwargs={'mail' : mail})
api.add_resource(MentorPreference, API_ENDPOINT_PREFIX + 'mentorpreference')
api.add_resource(StudentResponses, API_ENDPOINT_PREFIX + 'studentresponses')

if __name__ == '__main__':
	app.run(host='0.0.0.0', port='5050', debug=True)

from flask import request
from flask_restful import Resource, reqparse
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    get_jwt_claims,
    jwt_required,
    jwt_refresh_token_required,
    get_raw_jwt,
    get_current_user,
    get_jti
)
from werkzeug.security import generate_password_hash, check_password_hash
from flaskext.mysql import MySQL
from flask_mail import Message
from db import mysql
from db_utils import *
from utils import *
from exceptions_util import *
from random_username.generate import generate_username
import json
import datetime
import string
import random
from config import HAND_PREFERENCES

# A complex object that stores the user's userID and permissionGroup
# that'll be stored in the JWT token
class UserObject:
    def __init__(self, user_id, permissionGroup):
        self.user_id = user_id
        self.permissionGroup = permissionGroup

#returns list of all the users
class Users(Resource):
    @jwt_required
    def get(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id or permission != 'su':
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()
            query = "SELECT * FROM `user` WHERE `user`.`userID` != %s"
            result = getFromDB(query, user_id, conn, cursor)

            final_list_users = []
            for row in result:
                new_item = {}
                new_item['userID'] = row[0]
                new_item['username'] = row[1]
                new_item['permissionGroup'] = row[4]
                final_list_users.append(new_item)
            
            get_group_query = """SELECT `group`.* FROM `group` JOIN `group_user` 
                                    ON `group_user`.`groupID`=`group`.`groupID` 
                                    WHERE `group_user`.`userID`= %s"""
            for user in final_list_users:
                if user['permissionGroup'] == 'pf':
                    groups = getFromDB(get_group_query, user['userID'], conn, cursor)
                    groups_list = []
                    if groups and groups[0]:
                        for indv_groupID in groups:
                            groups_list.append({'groupID' : indv_groupID[0], 'groupName' : indv_groupID[1], 'groupCode' : indv_groupID[2]})
                    user['groups'] = groups_list
            raise ReturnSuccess(final_list_users, 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()

class User(Resource):
    @jwt_required
    def get(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "SELECT * FROM `user` WHERE `userID` = %s"
            result = getFromDB(query, user_id, conn, cursor)
            for row in result:
                newUserObject = {}
                newUserObject['id'] = row[0]
                newUserObject['username'] = row[1]
                newUserObject['permissionGroup'] = row[4]
                newUserObject['email'] = row[6]

            raise ReturnSuccess(newUserObject, 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()

    @jwt_required
    def put(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        data = {}
        data['newEmail'] = getParameter("newEmail", str, True, "")

        try:
            conn = mysql.connect()
            cursor = conn.cursor()
            if data['newEmail'] == '':
                data['newEmail'] = None
            update_email_query = "UPDATE `user` SET `email` = %s WHERE `user`.`userID` = %s"
            postToDB(update_email_query, (data['newEmail'], user_id), conn, cursor)

            raise ReturnSuccess("Successfully changed email", 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()


class UserLogout(Resource):
    @jwt_required
    def post(self):
        data = {}
        # data['refresh_token'] = getParameter("refresh_token", str, False, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        jti = get_raw_jwt()['jti']
        query = "INSERT INTO `tokens` VALUES (%s)"
        postToDB(query, jti)

        # if data['refresh_token']:
        #     jti = get_jti(data['refresh_token'])
        #     query = "INSERT INTO `tokens` VALUES (%s)"
        #     postToDB(query, jti)

        return returnMessage("Successfully logged out"), 200


#logs the user in and assigns them a jwt access token
class UserLogin(Resource):
    def post(self):
        data = {}
        data['username'] = getParameter("username", str, True, "")
        data['password'] = getParameter("password", str, True, "")
        data['username'] = data['username'].lower()

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            find_user, user = find_by_name(data['username'])
            if find_user:
                if check_password_hash(user[2], data['password']):
                    expires = datetime.timedelta(hours=18)
                    user_obj = UserObject(user_id=user[0], permissionGroup=user[4])
                    access_token = create_access_token(identity=user_obj, expires_delta=expires)
                    # refresh_token = create_refresh_token(identity=user_obj)
                    # raise ReturnSuccess({'access_token': access_token, 'refresh_token' : refresh_token, 'id' : user[0]}, 200)
                    raise ReturnSuccess({'access_token': access_token, 'id' : user[0]}, 200)
                else:
                    raise CustomException("Incorrect Password. Try again", 401)
            else:
                raise CustomException("User Not Found!", 401)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()

#register the user to the database
class UserRegister(Resource):
    def post(self):
        data = {}
        data['username'] = getParameter("username", str, True, "")
        data['password'] = getParameter("password", str, True, "")
        data['password_confirm'] = getParameter("password_confirm", str, True, "")
        data['email'] = getParameter("email", str, False, "")
        data['groupCode'] = getParameter("groupCode", str, False, "")
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            #adds user to the database if passwords match and username isn't taken
            if data['password'] != data['password_confirm']:
                raise CustomException("Password do not match.", 401)

            data['username'] = data['username'].lower()

            find_user, user = find_by_name(data['username'])
            if find_user == True:
                raise CustomException("Username already exists.", 401)

            if len(data['username']) > 20:
                raise CustomException("Username should be less than 20 characters", 400)
            if CheckIfStrHasNum(data['username']) == False:
                raise CustomException("Username should contain at least one number", 400)


            if not data['email']:
                data['email'] = ''
            else:
                data['email'] = data['email'].lower()
                find_email, _ = find_by_email(data['email'])
                if find_email:
                    raise CustomException("Email already exists.", 401)
 
            query = "INSERT INTO `user` (`username`, `password`, `permissionGroup`, `email`) VALUES (%s, %s, %s, %s)"
            salted_password = generate_password_hash(data['password'])
            postToDB(query, (data['username'], salted_password, 'st', data['email']), conn, cursor)

            query = "SELECT `userID` FROM `user` WHERE `username`= %s"
            results = getFromDB(query, data['username'], conn, cursor)
            user_id = results[0][0]

            add_preferences = "INSERT INTO `user_preferences` (`userID`) VALUES (%s)"
            postToDB(add_preferences, (user_id), conn, cursor)

            if data['groupCode']:
                gc_query = "SELECT `groupID` FROM `group` WHERE `groupCode`= %s"
                results = getFromDB(gc_query, data['groupCode'], conn, cursor)
                if results:
                    group_id = results[0][0]
                    gu_query = "INSERT INTO `group_user` (`userID`, `groupID`, `accessLevel`) VALUES (%s, %s, %s)"
                    postToDB(gu_query, (user_id, group_id, 'st'), conn, cursor)
          
            raise ReturnSuccess("Successfully registered!", 201)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()

#resets password for the given UserID
class ResetPassword(Resource):
    def post(self):
        data = {}
        data['email'] = getParameter("email", str, True, "")
        data['resetToken'] = getParameter("resetToken", str, True, "")
        data['password'] = getParameter("password", str, True, "")
        data['confirmPassword'] = getParameter("confirmPassword", str, True, "")

        if data['password'] != data['confirmPassword']:
            return errorMessage("Passwords do not match!"), 400

        get_associated_user = "SELECT `user`.`userID`, `user`.`pwdResetToken` FROM `user` WHERE `user`.`email` = %s"
        associated_user = getFromDB(get_associated_user, data['email'].lower())

        if not associated_user or not associated_user[0] \
           or not associated_user[0][1] \
           or not check_password_hash(associated_user[0][1], data['resetToken']):
            return errorMessage("No records match what was provided"), 404
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()
            
            password = generate_password_hash(data['password'])
            query = "UPDATE `user` SET `pwdResetToken` = NULL, `password` = %s WHERE `userID` = %s"
            postToDB(query, (password, associated_user[0][0]), conn, cursor)

            raise ReturnSuccess("Successfully reset password", 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error))
        finally:
            if(conn.open):
                cursor.close()
                conn.close()


# Send a reset token to the email for user to reset password
class ForgotPassword(Resource):
    def __init__(self, **kwargs):
        # smart_engine is a black box dependency
        self.mail = kwargs['mail']

    def post(self):
        data = {}
        data['email'] = getParameter("email", str, True, "")
        data['email'] = data['email'].lower()

        returnMessage = {"Message" : "Processed"}

        get_user = "SELECT `user`.`userID` FROM `user` WHERE `user`.`email` = %s"
        associated_user = getFromDB(get_user, data['email'])
        if not associated_user or not associated_user[0]:
            return returnMessage, 202
        
        resetToken = otcGenerator(20, string.hexdigits + '!#_@')
        check_token_query = "SELECT `user`.`userID` FROM `user` WHERE `user`.`pwdResetToken` = %s"
        if_exist = getFromDB(check_token_query, resetToken)
        while if_exist and if_exist[0]:
            resetToken = otcGenerator(20, string.hexdigits + '!#_@')
            check_token_query = "SELECT `user`.`userID` FROM `user` WHERE `user`.`pwdResetToken` = %s"
            if_exist = getFromDB(check_token_query, resetToken)

        update_pwdToken_query = "UPDATE `user` SET `pwdResetToken` = %s WHERE `userID` = %s"
        postToDB(update_pwdToken_query, (generate_password_hash(resetToken), associated_user[0][0]))

        msg = Message("Forgot Password - EndLess Learner",
                    sender="donotreply@endlesslearner.com",
                    recipients=[data['email']])
        msg.body = f"""You are recieving this email because you requested to reset your Endlesslearner password. \nPlease visit https://endlesslearner.com/resetpassword and use the token {resetToken} to reset your password.\nIf you did not request to reset your password, ignore this email."""
        self.mail.send(msg)

        return returnMessage, 202


class ChangePassword(Resource):
    # This API to used to reset another user's password or the current user's password
    @jwt_required
    def post(self):
        data = {}
        data['userID'] = getParameter("userID", str, False, "")
        data['password'] = getParameter("password", str, True, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Unauthorized user"), 401
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            if permission == 'pf' and data['userID'] and data['userID'] != '':
                get_user_status = "SELECT `user`.`permissionGroup` FROM `user` WHERE `user`.`userID` = %s"
                user_status = getFromDB(get_user_status, data['userID'], conn, cursor)
                if not user_status or not user_status[0]:
                    raise CustomException("Referred user not found", 400)
                if user_status[0][0] != 'st':
                    raise CustomException("A professor cannot reset non-student users' password", 400)

            # Only superadmins and professors can reset another user's password
            if permission != 'su' and permission != 'pf' and data['userID']:
                raise CustomException("Cannot reset another user's password", 400)
            elif ((permission == 'su' or permission == 'pf') and (not data['userID'] or data['userID'] == '')) or permission == 'st':
                data['userID'] = user_id
 
            password = generate_password_hash(data['password'])
            query = "UPDATE `user` SET `password` = %s WHERE `userID` = %s"
            postToDB(query, (password, data['userID']), conn, cursor)
          
            raise ReturnSuccess("Successfully reset password", 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()


# Send a reset token to the email for user to reset password
class ForgotUsername(Resource):
    def __init__(self, **kwargs):
        # smart_engine is a black box dependency
        self.mail = kwargs['mail']

    def post(self):
        data = {}
        data['email'] = getParameter("email", str, True, "")
        data['email'] = data['email'].lower()

        returnMessage = {"Message" : "Processed"}

        get_user = "SELECT `user`.`username` FROM `user` WHERE `user`.`email` = %s"
        username = getFromDB(get_user, data['email'])
        if not username or not username[0]:
            return returnMessage, 202

        msg = Message("Forgot Username - EndLess Learner",
                    sender="donotreply@endlesslearner.com",
                    recipients=[data['email']])
        msg.body = f"""You are recieving this email because you requested to receive your Endlesslearner username.\nThe username associated with this email is {username[0][0]}.\nPlease visit https://endlesslearner.com/login to login with that username."""
        self.mail.send(msg)

        return returnMessage, 202

#Checks to see whether given token is active or not
class CheckIfActive(Resource):
    @jwt_required
    def post(self):
        data = {}
        data['token'] = getParameter("token", str, True, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if find_by_token(data['token']):
            return user_id, 200
        return -1, 401

class UsersHighscores(Resource):
    def post(self):
        data = {}
        data['moduleID'] = getParameter("moduleID", str, True, "")
        data['platform'] = getParameter("platform", str, True, "")

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "SELECT `userID`,`playerScore` FROM `session` WHERE `moduleID`= %s AND`platform`= %s ORDER BY LENGTH(`playerScore`),`playerScore`"
            result = getFromDB(query, (data['moduleID'], data['platform']), conn, cursor)
            user = []

            for row in result:
                userscores = {}
                userscores['score'] = row[1]
                query = "SELECT `username` FROM `user` WHERE `userID`= %s"
                name = getFromDB(query, row[0], conn, cursor)
                for row2 in name:
                    userscores['usernames'] = name[0][0]
                user.append(userscores)

            raise ReturnSuccess(user, 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()

class UserLevels(Resource):
    @jwt_required
    def get(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "SELECT `group`.groupID, `group`.groupName, `group_user`.accessLevel \
                     FROM `group_user` \
                     INNER JOIN `group` \
                     ON `group`.groupId = `group_user`.groupID \
                     WHERE `group_user`.userID= %s" 
            results = getFromDB(query, user_id, conn, cursor)

            userLevels = []
            for userLevel in results:
                userLevels.append(convertUserLevelsToJSON(userLevel))
          
            raise ReturnSuccess(userLevels, 201)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()

class GenerateUsername(Resource):
    def get(self):
        return {"username" : generate_username(1)[0]}

class GetUsernames(Resource):
    @jwt_required
    def get(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "SELECT `username` FROM `user`" 
            results = getFromDB(query, None, conn, cursor)

            usernames = []
            for username in results:
                usernames.append(username[0])
          
            raise ReturnSuccess(usernames, 201)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()


class GenerateOTC(Resource):
    @jwt_required
    def get(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            otc = otcGenerator()
            query = "UPDATE `user` SET `otc`= %s WHERE `userID`= %s"
            results = postToDB(query, (otc, user_id), conn, cursor)

            raise ReturnSuccess({"otc" : otc}, 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()

class OTCLogin(Resource):
    def post(self):
        data = {}
        data['otc'] = getParameter("otc", str, True, "")
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "SELECT * FROM `user` WHERE `otc`= %s"
            results = getFromDB(query, data['otc'], conn, cursor)
            
            # Remove the otc from user after logging in
            if results and results[0]:
                query = "UPDATE `user` SET `otc`= %s WHERE `userID`= %s"
                postToDB(query, (None, results[0][0]), conn, cursor)
            else:
                raise CustomException("Invalid otc", 400)

            expires = datetime.timedelta(hours=18)
            user_obj = UserObject(user_id=results[0][0], permissionGroup=results[0][4])
            access_token = create_access_token(identity=user_obj, expires_delta=expires)
            # refresh_token = create_refresh_token(identity=user_obj)

            # raise ReturnSuccess({"access_token" : access_token, "refresh_token" : refresh_token, "id" : results[0][0]}, 200)
            raise ReturnSuccess({"access_token" : access_token, "id" : results[0][0]}, 200)

        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()


class User_Preferences(Resource):
    #Get current user's preferences
    @jwt_required
    def get(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "SELECT * from `user_preferences` WHERE `userID` = %s"
            user_preference = getFromDB(query, user_id, conn, cursor)
            if not user_preference or not user_preference[0]:
                return errorMessage("An error occured"), 500
            raise ReturnSuccess(userPreferencesToJSON(user_preference[0]), 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()

    #Update the user preferences
    @jwt_required
    def put(self):
        # Validate the user
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        data = {}
        data['preferredHand'] = getParameter("preferredHand", str, True, "preferred hand of each user is required. R for right hand, L for Left, or A for Ambidextrous")
        data['vrGloveColor'] = getParameter("vrGloveColor", str, True, "Specify a glove value that represents a glove color in VR game. Max 15 characters")
    
        if data['preferredHand'] not in HAND_PREFERENCES:
            return errorMessage("Please pass in either R, L, or A for hand preferences"), 400

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            update_query = "UPDATE `user_preferences` SET `preferredHand` = %s, `vrGloveColor` = %s WHERE `user_preferences`.`userID` = %s"
            postToDB(update_query, (data['preferredHand'], data['vrGloveColor'], user_id), conn, cursor)
            
            raise ReturnSuccess("Successfully updated preferences", 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()


# class Refresh(Resource):
#     @jwt_refresh_token_required
#     def post(self):

#         try:
#             conn = mysql.connect()
#             cursor = conn.cursor()

#             user_id = get_jwt_identity()
#             query = "SELECT `permissionGroup`, `email` FROM `user` WHERE `userID`= %s"
#             permission = getFromDB(query, user_id, conn, cursor)
#             user_obj = UserObject(user_id=user_id, permissionGroup=permission[0][0])
#             raise ReturnSuccess({'access_token': create_access_token(identity=user_obj), 'user_id' : user_id }, 200)
#         except CustomException as error:
#             conn.rollback()
#             return error.msg, error.returnCode
#         except ReturnSuccess as success:
#             conn.commit()
#             return success.msg, success.returnCode
#         except Exception as error:
#             conn.rollback()
#             return errorMessage(str(error)), 500
#         finally:
#             if(conn.open):
#                 cursor.close()
#                 conn.close()
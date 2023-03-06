from flask import request
from flask_restful import Resource, reqparse
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt_claims
from werkzeug.utils import secure_filename
from flaskext.mysql import MySQL
from db import mysql
from db_utils import *
from utils import *
from exceptions_util import *
import os
import string
import random

class Group(Resource):
    # Add a group to the database
    @jwt_required
    def post(self):
        data = {}
        data['groupName'] = getParameter("groupName", str, True, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            if (permission == 'pf' or permission == 'su'):
                pass
            else:
                raise CustomException("User cannot create classes.", 400)


            # Checks if the groupName already exists
            dupe_query = "SELECT `groupID` FROM `group` WHERE `groupName`= %s"
            dupe_results = getFromDB(dupe_query, data['groupName'], conn, cursor)

            if dupe_results:
                raise CustomException("groupName already exists.", 400)
            else:
                # Randomly generate 6-long string of numbers and letters
                # String must be unique for each class
                group_code = groupCodeGenerator()
                gc_query = "SELECT `groupID` FROM `group` WHERE `groupCode`= %s"
                gc_results = getFromDB(gc_query, group_code, conn, cursor)

                if gc_results:
                    raise CustomException("groupCode already exists", 400)

                query = "INSERT INTO `group` (`groupName`, `groupCode`) VALUES (%s, %s)"
                postToDB(query, (data['groupName'], group_code), conn, cursor)

                g_query = "SELECT `groupID` FROM `group` WHERE `groupName`= %s"
                g_results = getFromDB(g_query, data['groupName'], conn, cursor)
                group_id = g_results[0][0]

                # Users who creates a class have their accesLevel default to 'pf'
                gu_query = "INSERT INTO `group_user` (`userID`, `groupID`, `accessLevel`) VALUES (%s, %s, %s)"
                postToDB(gu_query, (user_id, group_id, 'pf'), conn, cursor)

                raise ReturnSuccess("Successfully created the class.", 200)
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

    # Edit a group
    @jwt_required
    def put(self):
        data = {}
        data['groupID'] = getParameter("groupID", str, True, "")
        data['groupName'] = getParameter("groupName", str, False, "")
        data['groupCode'] = getParameter("groupCode", str, False, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if 'groupName' not in data or not data['groupName']:
            data['groupName'] = None

        if 'groupCode' not in data or not data['groupCode']:
            data['groupCode'] = None

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            # Only professors and superadmins can edit groups
            if permission == 'st':
                raise CustomException("Invalid permissions.", 400)
        
            # Checking groupName and make sure it is unique
            if data['groupName'] is not None:
                gn_query = "SELECT `groupID` FROM `group` WHERE `groupName`= %s"
                gn_results = getFromDB(gn_query, data['groupName'], conn, cursor)
            
                if gn_results:
                    raise CustomException("groupName already in use.", 400)

            # Checking groupCode and make sure it is unique
            if data['groupCode'] is not None:
                gc_query = "SELECT `groupID` FROM `group` WHERE `groupCode`= %s"
                gc_results = getFromDB(gc_query, data['groupCode'], conn, cursor)
            
                if gc_results:
                    raise CustomException("groupCode already in use.", 400)
        
            if data['groupCode'] is not None and data['groupName'] is None:
                query = "UPDATE `group` SET `groupCode`= %s WHERE `groupID`= %s"
                results = postToDB(query, (data['groupCode'], data['groupID']), conn, cursor)
            elif data['groupCode'] is None and data['groupName'] is not None:
                query = "UPDATE `group` SET `groupName`= %s WHERE `groupID`= %s"
                results = postToDB(query, (data['groupName'], data['groupID']), conn, cursor)
            elif data['groupCode'] is not None and data['groupName'] is not None:
                query = "UPDATE `group` SET `groupName`= %s, `groupCode`= %s WHERE `groupID`= %s"
                results = postToDB(query, (data['groupName'], data['groupCode'], data['groupID']), conn, cursor)
            else:
                raise ReturnSuccess("No values passed in, nothing changed.", 200)

            raise ReturnSuccess("Successfully updated group.", 200)
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

    # Delete a group
    @jwt_required
    def delete(self):
        data = {}
        data['groupID'] = getParameter("groupID", str, True, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            # Only professors and superadmins can delete groups
            if permission == 'st':
                raise CustomException("Invalid permissions.", 400)

            query = "DELETE FROM `group` WHERE `groupID` = %s"
            deleteFromDB(query, data['groupID'], conn, cursor)
        
            raise ReturnSuccess("Successfully deleted group.", 200)
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

class GroupRegister(Resource):  
    # Register for a group
    @jwt_required
    def post(self):
        data = {}
        data['groupCode'] = getParameter("groupCode", str, True, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            if permission == 'su':
                return CustomException("Superadmins cannot register for classes."), 400

            query = "SELECT `groupID` FROM `group` WHERE `groupCode` = %s"
            results = getFromDB(query, data['groupCode'], conn, cursor)

            # if groupCode exists in group table
            if results:
                group_id = results[0][0]    

                # Check if the user has already registered for the group
                # otherwise continue with registering the user for the group
                dupe_query = "SELECT `userID` FROM `group_user` WHERE `groupID`= %s AND `userID`= %s"
                dupe_results = getFromDB(dupe_query, (group_id, user_id), conn, cursor)

                if dupe_results:
                    raise CustomException("User has already registered for the class.", 207)
                else:
                    gu_query = "INSERT INTO `group_user` (`userID`, `groupID`, `accessLevel`) VALUES (%s, %s, %s)"
                    postToDB(gu_query, (user_id, group_id, permission), conn, cursor)
            else:
                raise CustomException("Invalid class code.", 206)

            raise ReturnSuccess("Successfully registered for group", 205)
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

class SearchUserGroups(Resource):
    # Search for the groups (classes) the user is in
    @jwt_required
    def get(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            # Get the group's information and append the user's accessLevel in the group
            query = "SELECT `group`.*, `group_user`.`accessLevel` \
                     FROM `group` \
                     INNER JOIN `group_user` \
                     ON `group_user`.`groupID` = `group`.`groupID` \
                     WHERE `group_user`.`userID` = %s" 
            results = getFromDB(query, user_id, conn, cursor)
            
            # Get all users in the group
            get_group_users_query = "SELECT `user`.`userID`, `user`.`username`, `group_user`.`accessLevel` \
                                    FROM `group_user` \
                                    INNER JOIN `user` \
                                    ON `user`.`userID` = `group_user`.`userID` \
                                    WHERE `group_user`.`groupID` = %s" 

            groups = []
            if results and results[0]:
                for group in results:
                    group_obj = convertGroupsToJSON(group)

                    if permission == 'pf' or permission == 'su':
                        group_users = []
                        group_users_from_db = getFromDB(get_group_users_query, group_obj['groupID'], conn, cursor)
                        for indv_group_user in group_users_from_db:
                            group_users.append(convertUsersToJSON(indv_group_user))
                        group_obj['group_users'] = group_users

                    groups.append(group_obj)
            
            raise ReturnSuccess(groups, 200)
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

class UsersInGroup(Resource):
    # Get's all the users in a specific group
    @jwt_required
    def get(self):
        data = {}
        data['groupID'] = getParameter("groupID", str, True, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            # Only superadmins/professors can search for users in a group
            if permission == 'st':
                raise CustomException("User cannot search for users in a group.", 400)

            query = "SELECT `user`.`userID`, `user`.`username`, `group_user`.`accessLevel` \
                     FROM `group_user` \
                     INNER JOIN `user` \
                     ON `user`.`userID` = `group_user`.`userID` \
                     WHERE `group_user`.`groupID` = %s" 
            results = getFromDB(query, data['groupID'], conn, cursor)
            
            users = []
            if results and results[0]:
                for user in results:
                    users.append(convertUsersToJSON(user))
            
            raise ReturnSuccess(users, 200)
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

class GenerateGroupCode(Resource):
    @jwt_required
    def get(self):
        data = {}
        data['groupID'] = getParameter('groupID', str, True, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            if permission == 'st':
                raise CustomException("User cannot generate new group codes.", 400)

            group_code = groupCodeGenerator()
            while True:
                gc_query = "SELECT `groupID` FROM `group` WHERE `groupCode`= %s"
                gc_results = getFromDB(gc_query, group_code, conn, cursor)

                if gc_results:
                    group_code = groupCodeGenerator()
                else:
                    break
            
            query = "UPDATE `group` SET `groupCode`= %s WHERE `groupID`= %s"
            results = postToDB(query, (group_code, data['groupID']), conn, cursor)

            raise ReturnSuccess({"groupCode" : group_code}, 200)
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
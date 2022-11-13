from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import mysql
from db_utils import *
from utils import *
from datetime import date
from config import PERMISSION_LEVELS
from exceptions_util import *


class Access(Resource):
    """API to change an user's access level"""

    @jwt_required
    # Change the access level for the given user 
    def post(self):
        """
        Change the access level of an user.

        Available levels are 'su', 'pf', and 'st'. In a group, there can be 'st', 'ta', and 'pf' accounts.
        Professors and superadmins can promote students to TA while only superadmins can promote anyone to a professor status.
        """
        
        data = {}
        data['userID'] = getParameter("userID", int, True, "Invalid userID format")
        data['accessLevel'] = getParameter("accessLevel", str, True, "Please specify the access level you want to change the user to")
        data['groupID'] = getParameter("groupID", int, False, "Invalid groupID format")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return "Invalid user", 401
        
        # Only superadmins and professors can change access levels
        if (permission != 'su' and permission != 'pf') or not user_id:
            return errorMessage("User is not authorized to do this operation"), 401

        data['accessLevel'] = data['accessLevel'][:2]

        if data['accessLevel'] not in PERMISSION_LEVELS:
            return errorMessage("Invalid access type"), 400

        childPermission, _ = getUser(data['userID'])
        if childPermission is None:
            return errorMessage("user not found"), 400
        
        # Only superadmins can assign an user as a professor or superadmin
        if (data['accessLevel'] == 'pf' or data['accessLevel'] == 'su') and permission != 'su':
            return errorMessage("Current user is not authorized to grant the requested level"), 401

        # For sanity, we enforce that groupID be passed in only to change a student's access level 
        # for a class to TA or revert back to student
        if data['groupID'] is not None and data['accessLevel'] != 'ta' and data['accessLevel'] != 'st':
            return errorMessage("Please don't pass in groupID if not trying to set group specific access level"), 400

        # TA status is only valid within a group context, so groupID is required (see hierarchy)
        if data['accessLevel'] == 'ta' and data['groupID'] is None:
            return errorMessage("groupID of the group/class is required to make the student a TA"), 400
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            # Because of previous condition, if group id is passed in, then they are either setting a
            # student to either TA or revert back to student status/level
            if data['groupID'] is not None:
                query = f"""UPDATE `group_user` SET `accessLevel` = '{data['accessLevel']}' 
                        WHERE `userID` = {int(data['userID'])} AND `groupID` = {int(data['groupID'])}"""
            else:
                query = f"""UPDATE `user` SET `permissionGroup` = '{data['accessLevel']}' 
                        WHERE `userID` = {int(data['userID'])}"""
            
            postToDB(query, None, conn, cursor)
            
            raise ReturnSuccess("Successfully changed permission", 200)
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
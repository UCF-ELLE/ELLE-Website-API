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


class AnimELLESaveData(Resource):
    @jwt_required
    def get(self):
        """
        Return the save data that is linked to the current user.

        This API should mainly be used by the AnimELLE game to get the save data necessary to play
        """

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
       
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = """
                SELECT DISTINCT `animelle_save_data`.* FROM `animelle_save_data` 
                WHERE `userID`=%s
                """
            result = getFromDB(query, user_id)
            if not result:
                return errorMessage("User does not have AnimELLE save data."), 404

            jsondata = json.loads(result[0][2])

            return jsondata, 200
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
    def post(self):
        data = {}
        data['savedata'] = getParameter("savedata", str, True, "")
        """
        Return the save data that is linked to the current user.

        This API should mainly be used by the AnimELLE game to initialize the save data necessary to play
        """

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = """
                        SELECT DISTINCT `animelle_save_data`.* FROM `animelle_save_data` 
                        WHERE `userID`=%s
                        """
            result = getFromDB(query, user_id)

            if not result:
                query = """
                        INSERT INTO `animelle_save_data` (`userID`, `saveData`) VALUES (%s, %s);
                        """
                jsondata = json.dumps(data['savedata'], separators=(',', ':'))
                result = postToDB(query, (user_id, jsondata))
            else:
                query = """
                                    UPDATE `animelle_save_data` set saveData = %s where userID = %s;
                                    """
                jsondata = json.dumps(data['savedata'], separators=(',', ':'))
                result = postToDB(query, (jsondata, user_id))

            raise ReturnSuccess("Post was successfull", 201)
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
        data = {}
        data['savedata'] = getParameter("savedata", str, True, "")
        """
        Return the save data that is linked to the current user.

        This API should mainly be used by the AnimELLE game to update the save data necessary to play
        """

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = """
                SELECT DISTINCT `animelle_save_data`.* FROM `animelle_save_data` 
                WHERE `userID`=%s
                """
            result = getFromDB(query, user_id)

            if not result:
                return errorMessage("User does not have AnimELLE save data."), 404

            query = """
                        UPDATE `animelle_save_data` set saveData = %s where userID = %s;
                        """
            jsondata = json.dumps(data['savedata'], separators=(',', ':'))
            result = postToDB(query, (jsondata, user_id))

            raise ReturnSuccess("Put was successfull", 204)
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

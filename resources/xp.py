from flask import request, Response
from flask_restful import Resource, reqparse
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import mysql
from db_utils import *
from utils import *
from exceptions_util import *

class UpdateXP(Resource):
    # Initialize/update xp values for a user
    @jwt_required
    def post(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        XP = getParameter("XP", int, True)
        game = getParameter("game", str, True)

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            if game == "bELLEtro":
                query = "INSERT INTO xp (userID, belletro_xp) VALUES (%s, %s) ON DUPLICATE KEY UPDATE belletro_xp = %s"

            elif game == "VirtuELLE":
                query = "INSERT INTO xp (userID, virtuelle_xp) VALUES (%s, %s) ON DUPLICATE KEY UPDATE virtuelle_xp = %s"

            else:
                raise CustomException("ELLE game unsupported, please try again", 401)
            
            postToDB(query, (user_id, XP, XP), conn, cursor)

            raise ReturnSuccess("XP successfully updated", 200)

        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(error), 500
        finally:
            if conn.open:
                cursor.close()
                conn.close()

class RetrieveXP(Resource):
    # Retrieve xp values
    @jwt_required
    def get(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        game = getParameter("game", str, True)
        target_id = getParameter("target_id", int, True)

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            if game == "bELLEtro":
                query = "SELECT belletro_xp FROM xp WHERE userID = %s"

            elif game == "VirtuELLE":
                query = "SELECT virtuelle_xp FROM xp WHERE userID = %s"

            else:
                raise CustomException("ELLE game unsupported, please try again", 401)
            
            result = getFromDB(query, target_id, conn, cursor)
            
            if not result:
                raise CustomException("No XP results could be retrieved", 401)

            raise ReturnSuccess({"XP": result[0][0]}, 200)
            
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(error), 500
        finally:
            if conn.open:
                cursor.close()
                conn.close()
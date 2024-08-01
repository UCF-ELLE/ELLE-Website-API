from flask import request
from config import (
    IMAGE_EXTENSIONS, AUDIO_EXTENSIONS, TEMP_DELETE_FOLDER,
    TEMP_UPLOAD_FOLDER, IMG_UPLOAD_FOLDER, AUD_UPLOAD_FOLDER,
    IMG_RETRIEVE_FOLDER, AUD_RETRIEVE_FOLDER
    )
from flask_restful import Resource, reqparse
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from flaskext.mysql import MySQL
from db import mysql
from db_utils import *
from utils import *
from datetime import date
from exceptions_util import *
import os
import time
import requests


class GetSingleALValue(Resource):
    @jwt_required
    def post(self):
        # Validate the user
        termID = getParameter("termID", int, True, "ID of the term is required")


        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()
            
            query = "SELECT * FROM `term` where `termID` = %s"

            term_check = getFromDB(query, (termID), conn, cursor)

            if term_check and term_check[0]:
                query = "SELECT * FROM `adaptive_learning` where `userID` = %s and `termID` = %s"
                adaptive_values = getFromDB(query, (user_id, termID), conn, cursor)

                if adaptive_values and adaptive_values[0]:
                    for row in adaptive_values:
                        term_values = {}
                        term_values["userID"] = user_id
                        term_values["termID"] = termID
                        term_values["activation_val"] = row[2]
                        term_values["decay_val"] = row[3]
                        term_values["alpha_val"] = row[5]
                        term_values["dates"] = row[4]
                        term_values["times"] = row[6]
                    raise ReturnSuccess(term_values, 200)
                else:
                    default_values = {}
                    default_values["userID"] = user_id
                    default_values["termID"] = termID
                    default_values["activation_val"] = -9999
                    default_values["decay_val"] = 0.3
                    default_values["alpha_val"] = 0.3
                    default_values["dates"] = ""
                    default_values["times"] = ""
                    raise ReturnSuccess(default_values, 200)
            else :
                raise CustomException("Invalid TermID", 406)
        
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

class UpdateALValue(Resource):
    @jwt_required
    def post(self):

        termID = getParameter("termID", int, True, "ID of the term is required")
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        data = {}
        data["activation_val"] = getParameter("activation_val", str, True, "")
        data["decay_val"] = getParameter("decay_val", str, True, "")
        data["alpha_val"] = getParameter("alpha_val", str, True, "")
        data["dates"] = getParameter("dates", str, True, "")
        data["times"] = getParameter("times", str, True, "")
        

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "SELECT * FROM `adaptive_learning` where `userID` = %s and `termID` = %s"
            adaptive_values = getFromDB(query, (user_id, termID), conn, cursor)

            if adaptive_values and adaptive_values[0]:
                update_adaptive_query = (
                    "UPDATE `adaptive_learning` SET `activation_val` = %s, `decay_val` = %s, `alpha_val` = %s, `dates` = %s, `times` = %s WHERE `userID` = %s AND `termID` = %s"
                )
                postToDB(update_adaptive_query, (data["activation_val"], data["decay_val"], data["alpha_val"], data["dates"], data["times"], user_id, termID), conn, cursor)
                raise ReturnSuccess("Updated Adaptive Values", 200)
            else:
                insert_adaptive_query = (
                    "INSERT INTO `adaptive_learning` (`userID`, `termID`, `activation_val`, `decay_val`, `dates`, `alpha_val`, `times`) VALUES (%s, %s, %s, %s, %s, %s, %s)"
                )
                postToDB(insert_adaptive_query, (user_id, termID, data["activation_val"], data["decay_val"], data["dates"], data["alpha_val"], data["times"]), conn, cursor)
                raise ReturnSuccess("Inserted Adaptive Values", 200)

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
            if conn.open:
                cursor.close()
                conn.close()

class GetALValues(Resource):
    @jwt_required
    def post(self):
        # Validate the user

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        list_of_termIDs = getParameter("list_of_termIDs", str, True, "List of termIDs is required")
        if len(list_of_termIDs) == 0:
            return errorMessage("No terms listed"), 401
        
        list_of_termIDs = list_of_termIDs.split(',')
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "SELECT * FROM `adaptive_learning` where `userID` = %s and `termID` in ("

            query += ",".join(list_of_termIDs)
            
            query += ")"
                     

            adaptive_values = getFromDB(query, (user_id), conn, cursor)
            
            # raise ReturnSuccess(query, 200)
            list_of_vals = []
            list_of_termIDs_without_values = list_of_termIDs

            for row in adaptive_values:
                if adaptive_values:
                    list_of_termIDs_without_values.remove(str(row[1]))
                    term_values = {}
                    term_values["userID"] = user_id
                    term_values["termID"] = row[1]
                    term_values["activation_val"] = row[2]
                    term_values["decay_val"] = row[3]
                    term_values["alpha_val"] = row[5]
                    term_values["dates"] = row[4]
                    term_values["times"] = row[6]
                    list_of_vals.append(term_values)


            for term in list_of_termIDs_without_values:
                default_values = {}
                default_values["userID"] = user_id
                default_values["termID"] = int(term)
                default_values["activation_val"] = -9999
                default_values["decay_val"] = 0.3
                default_values["alpha_val"] = 0.3
                default_values["dates"] = ""
                default_values["times"] = ""
                list_of_vals.append(default_values)
            
            raise ReturnSuccess(list_of_vals, 200)
        
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
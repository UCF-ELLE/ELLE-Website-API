from flask import request, Response
from flask_restful import Resource, reqparse
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from flaskext.mysql import MySQL
from db import mysql
from db_utils import *
from utils import *
from exceptions_util import *
import os
import datetime
import redis
from config import REDIS_HOST, REDIS_PORT, REDIS_CHARSET

class LoggedAnswer(Resource):
    # Create a logged_answer that stores if the user got the question correct
    @jwt_required
    def post(self):
        data = {}
        data['questionID'] = getParameter("questionID", str, False, "")
        data['termID'] = getParameter("termID", str, True, "")
        data['sessionID'] = getParameter("sessionID", str, True, "")
        data['correct'] = getParameter("correct", str, True, "")
        data['mode'] = getParameter("mode", str, False, "")
 
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            if data['correct'] == '' or data['correct'].lower() == 'false':
                data['correct'] = '0'
            elif data['correct'].lower() == 'true':
                data['correct'] = '1'

            formatted_time = datetime.datetime.now().time().strftime('%H:%M')

            if data['mode']:
                query = "INSERT INTO `logged_answer` (`questionID`, `termID`, `sessionID`, `correct`, `mode`, `log_time`) \
                    VALUES (%s, %s, %s, %s, %s, %s)"
                postToDB(query, (data['questionID'], data['termID'], data['sessionID'], data['correct'], data['mode'], formatted_time), conn, cursor)
            else:
                query = "INSERT INTO `logged_answer` (`questionID`, `termID`, `sessionID`, `correct`, `log_time`) \
                    VALUES (%s, %s, %s, %s, %s)"
                postToDB(query, (data['questionID'], data['termID'], data['sessionID'], data['correct'], formatted_time), conn, cursor)
            raise ReturnSuccess("Successfully created a logged_answer record", 205)
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

    # Pull a user's logged_answers based on a given module
    @jwt_required
    def get(self):
        data = {}
        data['moduleID'] = getParameter("moduleID", str, False, "")
        data['userID'] = getParameter("userID", str, False, "")
        data['sessionID'] = getParameter("sessionID", str, False, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            if not data['moduleID'] or data['moduleID'] == "":
                module_exp = "REGEXP '.*'"
            else:
                data['moduleID'] = data['moduleID'].split("'")
                data['moduleID'] = data['moduleID'][0]
                module_exp = " = " + str(data['moduleID'])
            
            if not data['sessionID'] or data['sessionID'] == "":
                sessionID = "REGEXP '.*'"
            else:
                data['sessionID'] = data['sessionID'].split("'")
                data['sessionID'] = data['sessionID'][0]
                sessionID = " = " + str(data['sessionID'])
            
            #TODO: STUDENT USERS CAN ONLY PULL THEIR OWN RECORDS, ONLY ADMINS AND SUPER USERS
            # CAN REQUEST OTHER STUDENTS' OR ALL SESSIONS
            if (not data['userID'] or data['userID'] == "") and (permission == 'pf' or permission == 'su'):
                user_exp = "REGEXP '.*'"
            elif (permission == 'pf' or permission == 'su'):
                user_exp = " = " + int(data['userID'])
            else:
                user_exp = " = " + int(user_id)
            
            get_questions_query = f"SELECT DISTINCT `sessionID` FROM `session` WHERE `moduleID` {module_exp} AND userID {user_exp} AND sessionID {sessionID}"
            session_id_list = getFromDB(get_questions_query, None, conn, cursor)

            get_logged_answer_query = "SELECT `logged_answer`.*, `term`.`front` FROM `logged_answer` \
                                    INNER JOIN `term` ON `term`.`termID` = `logged_answer`.`termID` \
                                    WHERE `sessionID` = %s"
            logged_answers = []

            for sessionID in session_id_list:
                db_results = getFromDB(get_logged_answer_query, sessionID, conn, cursor)
                for result in db_results:
                    la_record = {
                        'logID' : result[0],
                        'questionID' : result[1],
                        'termID' : result[2],
                        'sessionID' : result[3],
                        'correct' : result[4],
                        'mode' : result[5],
                        'front' : result[9]
                    }
                    logged_answers.append(la_record)

            if logged_answers:
                raise ReturnSuccess(logged_answers, 200)
            else:
                raise ReturnSuccess("No associated logged answers found for that module and/or user", 200)
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

class GetLoggedAnswerCSV(Resource):
    @jwt_required
    def get(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id or permission != 'su':
            return errorMessage("Invalid user"), 401
        
        try:
            redis_conn = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, charset=REDIS_CHARSET, decode_responses=True)
        except redis.exceptions.ConnectionError:
            redis_conn = None

        checksum_query = "CHECKSUM TABLE `logged_answer`"
        checksum = getFromDB(checksum_query)
        checksum = str(checksum[0][1])

        if redis_conn is not None:
            logged_ans_chks = redis_conn.get('logged_ans_chks')
        else:
            logged_ans_chks = None

        if checksum == logged_ans_chks:
            csv = redis_conn.get('logged_ans_csv')
        else:
            last_query = "SELECT MAX(logged_answer.logID) FROM `logged_answer`"
            last_db_id = getFromDB(last_query)
            last_db_id = str(last_db_id[0][0])

            if redis_conn is not None:
                last_rd_id = redis_conn.get('last_logged_ans_id')
            else:
                last_rd_id = None

            count_query = "SELECT COUNT(*) FROM `logged_answer`"
            db_count = getFromDB(count_query)
            db_count = str(db_count[0][0])

            if redis_conn is not None:
                rd_log_ans_count = redis_conn.get('log_ans_count')
            else:
                rd_log_ans_count = None

            if db_count != rd_log_ans_count or rd_log_ans_count is None:
                csv = 'Log ID, User ID, Username, Module ID, Deleted Module ID, Module Name, Question ID, Deleted Question ID, Term ID, Deleted Term ID, Session ID, Correct, Log time, Mode\n'
                query = """
                        SELECT `logged_answer`.*, `session`.`userID`, `user`.`username`, `module`.`moduleID`, `module`.`name`, `session`.`deleted_moduleID` FROM `logged_answer` 
                        INNER JOIN `session` ON `session`.`sessionID` = `logged_answer`.`sessionID`
                        INNER JOIN `user` ON `user`.`userID` = `session`.`userID`
                        INNER JOIN `module` on `module`.`moduleID` = `session`.`moduleID`
                        """
                results = getFromDB(query)
                if results and results[0]:
                    for record in results:
                        if record[11] is None:
                            replace_query = "SELECT `name` FROM `deleted_module` WHERE `moduleID` = %s"
                            replace = getFromDB(replace_query, record[13])
                            record[12] = replace[0][0]
                        csv = csv + f"""{record[0]}, {record[9]}, {record[10]}, {record[11]}, {record[13]}, {record[12]}, {record[1]}, {record[7]}, {record[2]}, {record[8]}, {record[3]}, {record[4]}, {str(record[6])}, {record[5]}\n"""
            else:
                csv = ""
                query = "SELECT `logged_answer`.*, `session`.`userID`, `user`.`username`, `module`.`moduleID`, `module`.`name`, `session`.`deleted_moduleID` FROM `logged_answer` \
                        INNER JOIN `session` ON `session`.`sessionID` = `logged_answer`.`sessionID` \
                        INNER JOIN `user` ON `user`.`userID` = `session`.`userID` \
                        INNER JOIN `module` on `module`.`moduleID` = `session`.`moduleID` \
                        WHERE logID > %s"
                results = getFromDB(query, last_db_id)
                if redis_conn.get('logged_ans_csv') is not None:
                    csv = redis_conn.get('logged_ans_csv')

                if results and results[0]:
                    for record in results:
                        if record[11] is None:
                            replace_query = "SELECT `name` FROM `deleted_module` WHERE `moduleID` = %s"
                            replace = getFromDB(replace_query, record[13])
                            record[12] = replace[0][0]
                        csv = csv + f"""{record[0]}, {record[9]}, {record[10]}, {record[11]}, {record[13]}, {record[12]}, {record[1]}, {record[7]}, {record[2]}, {record[8]}, {record[3]}, {record[4]}, {str(record[6])}, {record[5]}\n"""

            last_record_id = results[-1][0]
            
            if redis_conn is not None:
                redis_conn.set('logged_ans_csv', csv)
                redis_conn.set('logged_ans_chks', checksum)
                redis_conn.set('last_logged_ans_id', last_record_id)
                redis_conn.set('log_ans_count', db_count)

        return Response(
            csv,
            mimetype="text/csv",
            headers={"Content-disposition":
            "attachment; filename=Logged_Answers.csv"})
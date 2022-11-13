from flask import request, Response
from flask_restful import Resource, reqparse
from flask_jwt_extended import jwt_required, get_jwt_identity
from config import REDIS_CHARSET, REDIS_HOST, REDIS_PORT, GAME_PLATFORMS
from db import mysql
from db_utils import *
from utils import *
from exceptions_util import *
import os
import dateutil.parser as dateutil
import datetime
import time
import redis


class Session(Resource):
    """API calls related to starting a session and retrieving a specific session."""

    @jwt_required
    def post(self):
        """
        Start a session record.

        Stores the starting time, ID of the module to be played, date of the session, and in which platform it is being played.
        Returns the sessionID that is used to end the session
        """

        moduleID = getParameter("moduleID", str, True, "moduleID of module used in session required")
        mode = getParameter("mode", str, False)
        sessionDate = getParameter("sessionDate", str, False)
        startTime = getParameter("startTime", str, False, "Starting time of the session")
        platform = getParameter("platform", str, True, "Need to specify what platform this session was played on (pc, mob, or vr)")

        if not sessionDate or sessionDate == '':
            sessionDate = time.strftime("%m/%d/%Y")

        # Validate the user
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        platform = platform.lower()
        if platform == "pc":
            platform = "cp"
        
        if platform not in GAME_PLATFORMS:
            return errorMessage("Not a valid platform"), 400

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            formatted_date = dateutil.parse(sessionDate).strftime('%Y-%m-%d')
            if not startTime:
                formatted_time = datetime.datetime.now().time().strftime('%H:%M')
            else:
                formatted_time = startTime

            if mode:
                query = """INSERT INTO `session` (`userID`, `moduleID`, `sessionDate`, `startTime`, `mode`, `platform`)
                        VALUES (%s, %s, %s, %s, %s, %s)"""
                postToDB(query, (user_id, moduleID, formatted_date, formatted_time, mode, platform[:3]), conn, cursor)
                sessionID = cursor.lastrowid
            else:
                query = """INSERT INTO `session` (`userID`, `moduleID`, `sessionDate`, `startTime`, `platform`) 
                        VALUES (%s, %s, %s, %s, %s)"""
                postToDB(query, (user_id, moduleID, formatted_date, formatted_time, platform[:3]), conn, cursor)
                sessionID = cursor.lastrowid
            raise ReturnSuccess({'sessionID' : sessionID}, 201)
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
    def get(self):
        """Get a specific session log and all the logged answers associated with it"""

        sessionID = getParameter("sessionID", str, True, "ID of session needed to retrieve is required")

        # Validate the user
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()
            sessionData = {"session" : [], "logged_answers" : []}

            query = """SELECT `session`.*, `module`.`name` FROM `session` 
                    INNER JOIN `module` ON `module`.`moduleID` = `session`.`moduleID` WHERE
                    `session`.`sessionID` = %s"""
            results = getFromDB(query, sessionID, conn, cursor)
            if results and results[0]:
                sessionData['session'].append(convertSessionsToJSON(results[0]))
                if permission == 'st' and sessionData['session']['userID'] != user_id:
                    raise CustomException("Unauthorized to access this session", 400)
            else:
                raise CustomException("No sessions found for the given ID", 400)

            query = "SELECT * FROM `logged_answer` WHERE `sessionID` = %s"
            results = getFromDB(query, sessionID, conn, cursor)
            if results and results[0]:
                for log in results:
                    record = {
                        'logID' : log[0],
                        'questionID' : log[1],
                        'termID' : log[2],
                        'sessionID' : log[3],
                        'correct' : log[4],
                        'mode' : log[5]
                    }
                    sessionData['logged_answers'].append(record)
            raise ReturnSuccess(sessionData, 200)
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()


class End_Session(Resource):
    """Ending a session API"""

    @jwt_required
    def post(self):
        """
        End a previously started session
        
        Provided the sessionID and the player's final score, this API updated the session record as ended and stores the score.
        Throws an error if trying to end a previously ended session and provided an non-exist sessionID.
        """

        sessionID = getParameter("sessionID", int, True, "ID of session needed in int format to retrieve is required")
        endTime = getParameter("endTime", str, False, "Time that the session was ended")
        playerScore = getParameter("playerScore", int, True, "Need to specify what's the score of the user in this session (integer format)")

        # Validate the user
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            formatted_time = datetime.datetime.now().time().strftime('%H:%M')

            query = "SELECT * FROM `session` WHERE `sessionID` = %s"
            result = getFromDB(query, sessionID, conn, cursor)
            if not result or not result[0]:
                raise CustomException("Session not found for provided ID", 400)
            elif result[0][6]:
                    raise CustomException("Wrong session ID provided", 400)

            query = "UPDATE `session` SET `endTime` = %s, `playerScore` = %s WHERE `session`.`sessionID` = %s"

            if not endTime:
                postToDB(query, (formatted_time, playerScore, sessionID), conn, cursor)
            else:
                postToDB(query, (endTime, playerScore, sessionID), conn, cursor)
                
            raise ReturnSuccess("Session successfully ended", 200)
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()
        

class SearchSessions(Resource):
    """Searching through the session records."""

    @jwt_required
    def get(self):
        """
        Get sessions that match the given parameters.
        
        Gets sessions associated with a specific user, current user, specific module belonging to either the current user or specific user, 
        specific platform sessions of current or specified user, or logs that matches all the provided information.
        """

        data = {}
        data['userID'] = getParameter("userID", int, False, "Invalid userID format")
        data['userName'] = getParameter("userName", str, False)
        data['moduleID'] = getParameter("moduleID", int, False, "Invalid moduleID format")
        data['platform'] = getParameter("platform", str, False)
        data['sessionDate'] = getParameter("sessionDate", str, False)

        # Validate the user
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            # If any data is not provided, change it to a regular expression
            # that selects everything in order to ignore that as a condition
            # "REGEXP '.*'" selects everything
            if not data['moduleID'] or data['moduleID'] == '':
                data['moduleID'] = "REGEXP '.*'"
            else:
                data['moduleID'] = "= '" + str(data['moduleID']) + "'"

            if not data['userName'] or data['userName'] == '':
                data['userName'] = "REGEXP '.*'"
            else:
                data['userName'] = data['userName'].split("'")
                data['userName'] = data['userName'][0]
                data['userName'] = "= '" + str(data['userName']) + "'"
            
            # Students (and TAs) cannot pull another user's session data
            if permission != 'su' and permission != 'pf':
                data['userID'] = "= '" + str(user_id) + "'"
            elif data['userID'] and data['userID'] != '':
                data['userID'] = "= '" + str(data['userID']) + "'"
            else:
                data['userID'] = "REGEXP '.*'"

            if not data['platform'] or data['platform'] == '':
                data['platform'] = "REGEXP '.*'"
            else:
                data['platform'] = data['platform'].split("'")
                data['platform'] = data['platform'][0]
                data['platform'] = "= '" + str(data['platform']) + "'"

            if not data['sessionDate'] or data['sessionDate'] == '':
                data['sessionDate'] = "REGEXP '.*'"
            else:
                data['sessionDate'] = data['sessionDate'].split("'")
                data['sessionDate'] = data['sessionDate'][0]
                data['sessionDate'] = "= '" + str(data['sessionDate']) + "'"

            query = f"""SELECT `session`.*, `module`.`name` from `session`
                    INNER JOIN `module` on `module`.`moduleID` = `session`.`moduleID`
                    INNER JOIN `user` on `user`.`userID` = `session`.`userID`
                    WHERE `session`.`moduleID` {data['moduleID']}
                    AND `user`.`userName` {data['userName']}
                    AND `session`.`userID` {data['userID']} 
                    AND `session`.`platform` {data['platform']}
                    AND `session`.`sessionDate` {data['sessionDate']}"""

            results = getFromDB(query, None, conn, cursor)
            records = []
            if results and results[0]:
                for session in results:
                    records.append(convertSessionsToJSON(session))
            if records:
                raise ReturnSuccess(records, 200)
            else:
                raise ReturnSuccess("No sessions found for the user", 204)

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

class GetAllSessions(Resource):
    """Retrieves all sessions from the database"""

    @jwt_required
    def get(self):
        """Retrieve all sessions from the database if the current user is a super-admin"""

        # Validate the user
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        if permission != 'su':
            return errorMessage("Unauthorized user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = """SELECT `session`.*, `module`.`name` FROM `session` 
                    INNER JOIN `module` ON `module`.`moduleID` = `session`.`moduleID`"""
            results = getFromDB(query, None, conn, cursor)
            records = []
            if results and results[0]:
                for session in results:
                    records.append(convertSessionsToJSON(session))
            if records:
                raise ReturnSuccess(records, 200)
            else:
                raise ReturnSuccess("No sessions found for the chosen module", 210)
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


class GetSessionCSV(Resource):
    """API to download a CSV of all session records"""

    @jwt_required
    def get(self):
        """Download all the session records on the database, including sessions associated with deleted modules, as a CSV file"""

        permission, user_id = validate_permissions()
        if not permission or not user_id or permission != 'su':
            return errorMessage("Invalid user"), 401
        
        try:
            redis_conn = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, charset=REDIS_CHARSET, decode_responses=True)
            redis_sessions_chksum = redis_conn.get('sessions_checksum')
            redis_sesssions_csv = redis_conn.get('sessions_csv')
            redis_lastseen_sessionID = redis_conn.get('lastseen_sessionID')
            redis_session_count = redis_conn.get('session_count')
        except redis.exceptions.ConnectionError:
            redis_conn = None
            redis_sessions_chksum = None
            redis_sesssions_csv = None
            redis_lastseen_sessionID = None
            redis_session_count = None

        get_max_sessionID = "SELECT MAX(`session`.`sessionID`) FROM `session`"
        get_sessions_chksum = "CHECKSUM TABLE `session`"
        max_sessionID = getFromDB(get_max_sessionID)
        chksum_session = getFromDB(get_sessions_chksum)
        
        if max_sessionID and max_sessionID[0] and chksum_session and chksum_session[0]:
            max_sessionID = str(max_sessionID[0][0])
            chksum_session = str(chksum_session[0][1])
        else:
            return errorMessage("Error retrieving data"), 500

        if not redis_session_count or not redis_sessions_chksum or not redis_sesssions_csv or not redis_lastseen_sessionID or redis_sessions_chksum != chksum_session:
            if redis_session_count and redis_sessions_chksum and redis_sesssions_csv and redis_sessions_chksum != chksum_session:
                #if the checksum values don't match, then something changed
                get_sub_session_count = f"SELECT COUNT(`session`.`sessionID`) FROM `session` WHERE `session`.`sessionID` <= {redis_lastseen_sessionID}"
                get_all_session_count = f"SELECT COUNT(`session`.`sessionID`) FROM `session`"
                sub_session_count = getFromDB(get_sub_session_count)
                all_session_count = getFromDB(get_all_session_count)

                if sub_session_count and sub_session_count[0] and all_session_count and all_session_count[0]:
                    sub_session_count = str(sub_session_count[0][0])
                    all_session_count = str(all_session_count[0][1])
                else:
                    return errorMessage("Error retrieving data"), 500
                
                if all_session_count != redis_session_count and sub_session_count == redis_session_count:
                    # The only time we want to just fetch newly added values is when the subcount is the same
                    # as cached (meaning nothing that we cached has changed).
                    csv = redis_sesssions_csv
                    query = f"""
                        SELECT `session`.*, `user`.`username`, `module`.`name`, COUNT(`logged_answer`.`logID`) FROM `session`
                        LEFT JOIN `logged_answer` ON `logged_answer`.`sessionID` = `session`.`sessionID`
                        INNER JOIN `user` ON `user`.`userID` = `session`.`userID`
                        INNER JOIN `module` on `module`.`moduleID` = `session`.`moduleID`
                        WHERE `session`.`sessionID` > {redis_lastseen_sessionID}
                        GROUP BY `session`.`sessionID`
                        """
                else:
                    csv = 'Session ID, User ID, User Name, Module ID, Deleted Module ID, Module Name, Session Date, Player Score, Total Attempted Questions, Percentage Correct, Start Time, End Time, Time Spent, Platform, Mode\n'
                    query = """
                            SELECT `session`.*, `user`.`username`, `module`.`name`, COUNT(`logged_answer`.`logID`) FROM `session`
                            LEFT JOIN `logged_answer` ON `logged_answer`.`sessionID` = `session`.`sessionID`
                            INNER JOIN `user` ON `user`.`userID` = `session`.`userID`
                            INNER JOIN `module` on `module`.`moduleID` = `session`.`moduleID`
                            GROUP BY `session`.`sessionID`
                            """
            else:
                csv = csv = 'Session ID, User ID, User Name, Module ID, Deleted Module ID, Module Name, Session Date, Player Score, Total Attempted Questions, Percentage Correct, Start Time, End Time, Time Spent, Platform, Mode\n'
                query = """
                        SELECT `session`.*, `user`.`username`, `module`.`name`, COUNT(`logged_answer`.`logID`) FROM `session` 
                        LEFT JOIN `logged_answer` ON `logged_answer`.`sessionID` = `session`.`sessionID`
                        INNER JOIN `user` ON `user`.`userID` = `session`.`userID`
                        INNER JOIN `module` on `module`.`moduleID` = `session`.`moduleID`
                        GROUP BY `session`.`sessionID`
                        """
            
            get_max_session_count = "SELECT COUNT(session.sessionID) FROM session"
            max_session_count = getFromDB(get_max_session_count)
            if max_session_count and max_session_count[0]:
                max_session_count = str(max_session_count[0][0])
            else:
                return errorMessage("Error retrieving data"), 500
            
            results = getFromDB(query)
            if results and results[0]:
                for record in results:
                    if record[6]:
                        time_spent, _ = getTimeDiffFormatted(record[5], record[6])
                    else:
                        log_time_query = "SELECT `logged_answer`.`log_time` FROM `logged_answer` WHERE `sessionID`=%s ORDER BY `logID` DESC LIMIT 1"
                        last_log_time = getFromDB(log_time_query, record[0])
                        if last_log_time and last_log_time[0] and last_log_time[0][0] != None:
                            time_spent, _ = getTimeDiffFormatted(record[5], last_log_time[0][0])
                            record[6], _ = getTimeDiffFormatted(time_obj = last_log_time[0][0])
                            if record[3] != time.strftime("%Y-%m-%d"):
                                query_update_time = f"UPDATE `session` SET `session`.`endTime` = '{dateTimeToMySQL(last_log_time[0][0])}' WHERE `session`.`sessionID` = {record[0]}"
                                postToDB(query_update_time)
                        else:
                            time_spent = None
                    if not record[4]:
                        get_logged_answer_score = """
                                                  SELECT `logged_answer`.`correct`
                                                  FROM `logged_answer`
                                                  WHERE `logged_answer`.`sessionID` = %s
                                                  """
                        answer_data = getFromDB(get_logged_answer_score, record[0])
                        if answer_data and answer_data[0]:
                            correct_answers = 0
                            for answer_record in answer_data:
                                correct_answers = correct_answers + answer_record[0]
                            update_score_query = """
                                                 UPDATE `session` SET `session`.`playerScore` = %s
                                                 WHERE `session`.`sessionID` = %s
                                                 """
                            postToDB(update_score_query, (correct_answers, record[0]))
                            record[4] = correct_answers
                    platform = "Mobile" if record[7] == 'mb' else "PC" if record[7] == 'cp' else "Virtual Reality"
                    if record[2] is None:
                        replace_query = "SELECT `name` FROM `deleted_module` WHERE `moduleID` = %s"
                        replace = getFromDB(replace_query, record[9])
                        record[11] = replace[0][0]
                    # csv = 'Session ID, User ID, User Name, Module ID, Deleted Module ID, Module Name, Session Date, Player Score, Percentage Correct, Total Attempted Questions, Start Time, End Time, Time Spent, Platform, Mode\n'
                    csv = csv + f"""{record[0]}, {record[1]}, {record[10]}, {record[2]}, {record[9]}, {record[11]}, {record[3]}, {record[4]}, {record[12]}, {record[4]/record[12] if record[12] != 0 and record[12] and record[4] else None},{getTimeDiffFormatted(time_obj = record[5])[0]}, {getTimeDiffFormatted(time_obj = record[6])[0] if record[6] else None}, {time_spent}, {platform}, {record[8]}\n"""
                if redis_conn:
                    redis_conn.set('sessions_csv', csv)
                    redis_conn.set('sessions_checksum', chksum_session)
                    redis_conn.set('lastseen_sessionID', max_sessionID)
                    redis_conn.set('session_count', max_session_count)
            return Response(
                csv,
                mimetype="text/csv",
                headers={"Content-disposition":
                "attachment; filename=Sessions.csv"})
        elif max_sessionID == redis_lastseen_sessionID and chksum_session == redis_sessions_chksum:
            return Response(
                redis_sesssions_csv,
                mimetype="text/csv",
                headers={"Content-disposition":
                "attachment; filename=Sessions.csv"})
        else:
            return errorMessage("Something went wrong with computing CSV"), 500

from db import mysql
from db_utils import *
from pathlib import Path
from time import sleep
import os
import shutil
import csv
import redis
from config import *
import time
import subprocess
import ffmpeg
import string
import datetime
import random
from decimal import *
from flask_restful import reqparse
from flask_jwt_extended import get_jwt_identity, get_jwt_claims
from config import (
    IMAGE_EXTENSIONS,
    AUDIO_EXTENSIONS,
    TEMP_DELETE_FOLDER,
    TEMP_UPLOAD_FOLDER,
    IMG_UPLOAD_FOLDER,
    AUD_UPLOAD_FOLDER,
    IMG_RETRIEVE_FOLDER,
    AUD_RETRIEVE_FOLDER,
    PERMISSION_LEVELS,
    PERMISSION_GROUPS,
    ACCESS_LEVELS,
)

# this line was missing and causing redis_host to cause errors
from config import REDIS_HOST, REDIS_PORT, REDIS_CHARSET


########################################################################################
# TERM FUNCTIONS
########################################################################################


def check_if_term_exists(_id):

    query = "SELECT * FROM term WHERE termID = %s"
    result = getFromDB(
        query,
        str(
            _id,
        ),
    )
    for row in result:
        if str(row[0]) == str(_id):
            return True

    return False


def convert_audio(filename):

    try:
        true_filename = cross_plat_path("uploads/" + filename)
        filename, file_extension = os.path.splitext(filename)
        output_name = cross_plat_path("Audio/" + filename + ".ogg")
        # command = ['ffmpeg','-i']
        # command.append(true_filename)
        # command.append('-c:a')
        # command.append('libvorbis')
        # command.append('-b:a')
        # command.append('64k')
        # command.append(output_name)
        # output = subprocess.check_output(command)

        ffmpeg.input(true_filename, acodec="libvorbis").output(
            output_name, audio_bitrate="64k"
        ).run()

        return True
    except Exception as e:
        print(str(e))
        return False


def addNewTags(tagList, termID, conn=None, cursor=None):
    for tag in tagList:
        # check if a record of these two combinations exist, if not insert
        query = "SELECT * from tag WHERE termID = %s AND tagName = %s"
        result = getFromDB(query, (termID, str(tag).lower()), conn, cursor)
        if result:
            if DEBUG:
                # DEBUG Here is not defined ?
                print(result)
                print("Trying to insert a duplicate tag")
        else:
            query = "INSERT into tag (termID, tagName) VALUES (%s, %s)"
            postToDB(query, (termID, str(tag).lower()), conn, cursor)


########################################################################################
# GROUPS FUNCTIONS
########################################################################################


def check_groups_db(_id):

    query = "SELECT * FROM grouptb WHERE groupID = %s"
    result = getFromDB(query, (_id,))

    for row in result:
        if row[0] == _id:
            return True

    return False


########################################################################################
# USERS FUNCTIONS
########################################################################################
def getUser(_id):
    # Returns the permission group of the user and whether the user_id is valid or not
    query = "SELECT permissionGroup from user WHERE userID = %s"
    permission = getFromDB(query, str(_id))

    if not permission:
        return None, False

    permission = permission[0][0]

    if permission not in PERMISSION_LEVELS:
        # This should never be the case, but as a safeguard
        return permission, None
    else:
        return permission, True


def validate_permissions():
    # Checks and validates permission group and user id from jwt token
    # Returns permission group and user id
    permission = get_jwt_claims()
    user_id = get_jwt_identity()

    permission = permission["permission"]
    if (
        not user_id
        or user_id == ""
        or not permission
        or permission == ""
        or permission not in PERMISSION_LEVELS
    ):
        return None, None
    else:
        return permission, user_id


def is_ta(user_id, group_id):
    # checks if the user if a TA for the group
    # returns true or false
    if not user_id or not group_id:
        return False

    query = "SELECT accessLevel from group_user WHERE userID = %s AND groupID = %s"
    accessLevel = getFromDB(query, (user_id, group_id))
    if accessLevel and accessLevel[0]:
        if accessLevel[0][0] != "ta":
            return False
        else:
            return True

    return False


def find_by_name(username):
    query = "SELECT * FROM user WHERE username = %s"
    result = getFromDB(query, (username,))

    for row in result:
        if row[1].lower() == username:
            return True, row

    return False, None


def find_by_email(email):

    query = "SELECT user.userID FROM user WHERE email = %s"
    result = getFromDB(query, email)

    if result and result[0]:
        return True, result[0][0]

    return False, None


def find_by_token(token):

    query = "SELECT * FROM tokens WHERE expired = %s"
    result = getFromDB(query, (token,))

    for row in result:
        if row[0] == token:
            return False

    return True


def check_user_db(_id):

    query = "SELECT * FROM user WHERE userID = %s"
    result = getFromDB(query, (_id,))

    for row in result:
        if row[0] == _id:
            return True

    return False


# TODO: GOT TO CHANGE THIS LOGIC AS GROUPID ISN'T REQUIRED - JUST THE groupCode
def check_group_db(id, password):
    query = "SELECT * FROM `group` WHERE `groupID` = %s"
    result = getFromDB(query, (id,))

    for row in result:
        if row[0] == id:
            if row[2] == password:
                return True
    return False


# Convert user_preferences information returned from the database into JSON obj
def userPreferencesToJSON(data):
    # Update this as the user_preferences table is updated
    return {
        "userPreferenceID": data[0],
        "userID": data[1],
        "preferredHand": data[2],
        "vrGloveColor": data[3],
    }


def otcGenerator(size=6, chars=string.digits):
    return "".join(random.choice(chars) for _ in range(size))


def convertUserLevelsToJSON(userLevel):
    if len(userLevel) < 3:
        return errorMessage("passed wrong amount of values to convertUserLevelsToJSON")
    result = {
        "groupID": userLevel[0],
        "groupName": userLevel[1],
        "accessLevel": userLevel[2],
    }
    return result


########################################################################################
# MENTORS FUNCTIONS
########################################################################################


def get_mentor_preference(_id, conn, cursor):
    query = "SELECT mentorName FROM mentor_preferences WHERE userID = %s"
    result = getFromDB(query, _id, conn, cursor)

    return result


def store_mentor_preference(_id, mentor_name, conn, cursor):

    if len(get_mentor_preference(_id, conn, cursor)) > 0:
        query = "UPDATE mentor_preferences SET mentorName = %s WHERE userID = %s"
        postToDB(query, (mentor_name, _id), conn, cursor)
        return True
    else:
        query = (
            "INSERT INTO mentor_preferences (`userID`, `mentorName`) VALUES (%s, %s)"
        )
        postToDB(query, (_id, mentor_name), conn, cursor)
        return False


def get_student_response(session_id, conn, cursor):
    query = "SELECT * FROM mentor_responses WHERE sessionID = %s"
    result = getFromDB(query, session_id, conn, cursor)
    return result


def store_student_response(question_id, response, session_id, conn, cursor):
    query = "INSERT INTO mentor_responses (`questionID`, `response`, `sessionID`) VALUES (%s, %s, %s)"
    postToDB(query, (question_id, response, session_id), conn, cursor)


def store_mentor_question(type, question_text, conn, cursor, mc_options):
    if type == "MENTOR_FR":
        query = "INSERT INTO question (`type`, `questionText`) VALUES (%s, %s)"
        postToDB(query, (type, question_text), conn, cursor)
        return True
    else:
        query = "INSERT INTO question (`type`, `questionText`) VALUES (%s, %s)"
        postToDB(query, (type, question_text), conn, cursor)

        query = "SELECT questionID FROM question WHERE type = %s AND questionText = %s"
        questionID = getFromDB(query, (type, question_text), conn, cursor)

        for answerChoice in mc_options:
            query = "INSERT INTO multiple_choice_answers (`questionID`, `answerChoice`) VALUES (%s, %s)"
            postToDB(query, (questionID[0], answerChoice), conn, cursor)
        return False


def create_mc_option(answerChoice, questionID, conn, cursor):
    query = "INSERT INTO multiple_choice_answers (`questionID`, `answerChoice`) VALUES (%s, %s)"
    postToDB(query, (questionID, answerChoice), conn, cursor)


def modify_mentor_question(question_id, question_text, conn, cursor):
    query = "UPDATE `question` SET `questionText` = %s WHERE `questionID` = %s"
    postToDB(query, (question_text, question_id), conn, cursor)
    return True


def get_mentor_questions(moduleID, conn, cursor):
    query = (
        "SELECT question.questionID, question.type, question.questionText FROM question INNER JOIN module_question ON "
        "question.questionID = module_question.questionID AND module_question.moduleID = %s AND "
        "question.type IN ('MENTOR_FR', 'MENTOR_MC')"
    )
    return getFromDB(query, moduleID, conn, cursor)


def delete_mc_option(mc_id, conn, cursor):
    query = "DELETE FROM multiple_choice_answers WHERE multipleChoiceID = %s"
    deleteFromDB(query, mc_id, conn, cursor)
    return True


def modify_mc_options(updated_option, mc_id, conn, cursor):
    query = "UPDATE multiple_choice_answers SET answerChoice = %s WHERE multipleChoiceID = %s"
    postToDB(query, (updated_option, mc_id), conn, cursor)
    return True


def get_mc_options(question_id, conn, cursor):
    query = "SELECT * FROM multiple_choice_answers WHERE questionID = %s"
    return getFromDB(query, question_id, conn, cursor)


def modify_mentor_question_frequency(
    module_id, incorrectCards=None, correctCards=None, time=None, conn=None, cursor=None
):
    query = "UPDATE mentor_question_frequency SET numIncorrectCards = %s, numCorrectCards = %s,	time = %s WHERE moduleID = %s"
    return postToDB(
        query, (incorrectCards, correctCards, time, module_id), conn, cursor
    )


def set_mentor_question_frequency(
    module_id, incorrectCards=None, correctCards=None, time=None, conn=None, cursor=None
):
    if len(get_mentor_question_frequency(module_id, conn, cursor)) < 1:
        query = "INSERT INTO mentor_question_frequency (`numIncorrectCards`, `numCorrectCards`,	`time`, `moduleID`) VALUES \
            (%s, %s, %s, %s)"
        postToDB(query, (incorrectCards, correctCards, time, module_id), conn, cursor)
        return True
    else:
        modify_mentor_question_frequency(
            module_id, incorrectCards, correctCards, time, conn, cursor
        )
        return False


def get_mentor_question_frequency(module_id, conn, cursor):
    query = "SELECT * FROM mentor_question_frequency WHERE moduleID = %s"
    return getFromDB(query, module_id, conn, cursor)


########################################################################################
# GROUP FUNCTIONS
########################################################################################


def convertGroupsToJSON(session):
    if len(session) < 4:
        return errorMessage(
            "passed wrong amount of values to convertSessionsToJSON, it needs all elements in session table"
        )
    result = {
        "groupID": session[0],
        "groupName": session[1],
        "groupCode": session[2],
        "accessLevel": session[3],
    }
    return result


def convertUsersToJSON(session):
    if len(session) < 3:
        return errorMessage(
            "passed wrong amount of values to convertSessionsToJSON, it needs all elements in session table"
        )
    result = {
        "userID": session[0],
        "username": session[1],
        "accessLevel": session[2],
    }
    return result


def groupCodeGenerator(size=5, chars=string.ascii_uppercase + string.digits):
    return "".join(random.choice(chars) for _ in range(size))


########################################################################################
# ALL FUNCTIONS
########################################################################################


def check_max_id(result):

    if result[0][0]:
        return result[0][0] + 1

    else:
        return 1


def cross_plat_path(unixpath):
    return str(Path(unixpath).absolute())


def getParameter(parameter_name, what_type, is_required=True, help="Parameter Error"):
    parser = reqparse.RequestParser()
    parser.add_argument(parameter_name, type=what_type, required=is_required, help=help)
    data = parser.parse_args()
    return data[parameter_name]


########################################################################################
# RETURN MESSAGE FORMATS
########################################################################################


def returnMessage(message, DEBUG=False):
    if DEBUG:
        print(str(message))
    return {"Message": str(message)}


def errorMessage(message, DEBUG=False):
    if DEBUG:
        print(str(message))
    return {"Error": str(message)}


########################################################################################
# OTHER UTIL FUNCTIONS
########################################################################################


def getTimeDiffFormatted(
    time_1=None,
    time_2=None,
    # str_format = "{days} day {hours}:{minutes}:{seconds}",
    str_format="{hours}:{minutes}:{seconds}",
    time_obj=None,
):
    """
    Returns the time object in a CSV-friendly way.

    If time_1 and time_2 provided, it calculates the time different between two time objects formats them CSV-friendly
    If time_obj is provided, formats that CSV-friendly

    Keyword arguments:
    time_1 -- the first time object from which time_2 is subtracted with (time_2 - time_1)
    time_2 -- the second time object from which time_1 is subtracted from
    str_format -- the format in which the final string should look like
    time_obj -- if simply just want to convert a time object (time delta) into a CSV-friendly string, pass it to this argument
    """

    if time_1 is None and time_2 is None and time_obj is None:
        return None, None

    if time_1 and time_2:
        try:
            time_delta = time_2 - time_1
        except TypeError as e:
            print(f"Error: {e}")
            return None, None
    elif time_obj:
        time_delta = time_obj
    else:
        return None, None

    if isinstance(time_delta, str):
        return None, None

    if time_delta.days != 0:
        d = {"days": time_delta.days}
        d["hours"], rem = divmod(time_delta.seconds, 3600)
        d["minutes"], d["seconds"] = divmod(rem, 60)
        # if d['days'] != 1 and d['days'] != -1:
        #       str_format = "{days} days {hours}:{minutes}:{seconds}"
        str_format = "{hours}:{minutes}:{seconds}"
        time_spent_str = str_format.format(**d)
    else:
        time_spent_str = str(time_delta)[:-3]
    return time_spent_str, time_delta


def dateTimeToMySQL(time_delta):
    """
    Takes in a timedelta object and formats it MySQL friendly.

    Keyword arguments:
    time_delta -- the time object that should be converted to MySQL friendly format
    """

    str_format = "{hours}:{minutes}:{seconds}"
    if time_delta.days != 0:
        d = {}
        d["hours"], rem = divmod(time_delta.seconds, 3600)
        d["hours"] = d["hours"] + (time_delta.days * 24)
        d["minutes"], d["seconds"] = divmod(rem, 60)
        time_spent_str = str_format.format(**d)
    else:
        time_spent_str = str(time_delta)[:-3]
    return time_spent_str


def convertSessionsToJSON(session):
    """
    Converts the session object into a JSON object and returns the latter.

    A session record has 10 fields. If the passed in object has less than 10 fields, it is assumed to be just a regular
    session object, and so it is converted into a JSON object those the keys are the respective field names.
    But if the passed in object's size is greater than 10, it is assumed to have the module name as the 11th object, so appends that.

    Keyword arguments:
    session -- the session record object (list/array)
    """

    if len(session) < 10:
        return errorMessage(
            "passed wrong amount of values to convertSessionsToJSON, it needs all elements in session table"
        )

    result = {
        "sessionID": session[0],
        "userID": session[1],
        "moduleID": session[2],
        "sessionDate": str(session[3]),
        "playerScore": session[4],
        "startTime": str(session[5]),
        "endTime": str(session[6]),
        "platform": session[7],
        "mode": session[8],
    }

    if len(session) >= 11:
        result["moduleName"] = session[10]

    return result


def convertTermToJSON(data):
    """
    Convert the given term data record into JSON format.

    A term record has 8 field. If the passed in object has length of 8, we simply convert it to JSON object and return that.
    If the passed in object has length more than 8, then the function assume that the last two fields are the image and audio location fields and adds that to the return object.

    Keyword arguments:
    data -- the term record object (list/array)
    """

    if len(data) < 8:
        return errorMessage(
            "passed wrong amount of values to convertTermToJSON, it needs all elements in terms table"
        )

    result = {
        "termID": data[0],
        "imageID": data[1],
        "audioID": data[2],
        "front": data[3],
        "back": data[4],
        "type": data[5],
        "gender": data[6],
        "language": data[7],
    }

    if len(data) > 8:
        result["imageLocation"] = IMG_RETRIEVE_FOLDER + data[8] if data[8] else None
        result["audioLocation"] = AUD_RETRIEVE_FOLDER + data[9] if data[9] else None
    return result


def convertGameLogsToJSON(game_log):
    if len(game_log) < 6:
        return errorMessage(
            "passed wrong amount of values to convertSessionsToJSON, it needs all elements in session table"
        )
    result = {
        "logID": game_log[0],
        "userID": game_log[1],
        "moduleID": game_log[2],
        "correct": game_log[3],
        "incorrect": game_log[4],
        "platform": game_log[5],
        "time": game_log[6].__str__(),
        "gameName": game_log[7],
    }
    return result


def getImageLocation(image_id):
    """
    Get the image location from given the imageID

    Keyword arguments:
    image_id -- the ID of the image record
    """

    # If ID is null
    if image_id == None:
        return ""
    response = {}
    query = "SELECT `imageLocation` FROM `image` WHERE `imageID` = %s"
    result = getFromDB(query, image_id)
    if result and result[0]:
        return IMG_RETRIEVE_FOLDER + result[0][0]
    else:
        return ""


def getAudioLocation(audio_id):
    """
    Get the audio location from given the audioID

    Keyword arguments:
    audio_id -- the ID of the audio record
    """

    # If ID is null
    if audio_id == None:
        return ""
    query = "SELECT `audioLocation` FROM `audio` WHERE `audioID` = %s"
    result = getFromDB(query, audio_id)
    if result and result[0]:
        return AUD_RETRIEVE_FOLDER + result[0][0]
    else:
        return ""


def attachQuestion(module_id, question_id, conn=None, cursor=None):
    """
    Attache or detach a question from the module; returns false if the question was detached

    Keyword arguments:
    module_id -- the ID of the module record
    question_id -- the ID of the question record
    conn -- the connection object, if this record is called under a function that already established a connection to the database
    cursor -- the cursor object, if already connected to the database
    """

    query = (
        "SELECT * FROM `module_question` WHERE `moduleID` = %s AND `questionID` = %s"
    )
    result = getFromDB(query, (module_id, question_id), conn, cursor)
    # If an empty list is returned, post new link
    if not result or not result[0]:
        query = (
            "INSERT INTO `module_question` (`moduleID`, `questionID`) VALUES (%s, %s)"
        )
        postToDB(query, (module_id, question_id), conn, cursor)
        return True
    else:
        # Delete link if it exists
        query = (
            "DELETE FROM `module_question` WHERE `moduleID` = %s AND `questionID` = %s"
        )
        postToDB(query, (module_id, question_id), conn, cursor)
        return False


def GetTAList(professorID):
    """
    Get the list of TA for the professor's classes

    Keyword arguments:
    professorID -- the ID of the professor whose TA list should be returned
    """

    TA_list = []
    get_ta_query = "SELECT `user`.`userID` FROM `user` \
                    INNER JOIN `group_user` on `group_user`.`userID` = `user`.`userID` \
                    AND `group_user`.`groupID` IN \
                    (SELECT `group_user`.`groupID` from `group_user` WHERE `group_user`.`userID` = %s) \
                    WHERE `group_user`.`accessLevel` = 'ta'"
    ta_results = getFromDB(get_ta_query, professorID)
    if ta_results and ta_results[0]:
        for ta in ta_results:
            TA_list.append(ta[0])
    return TA_list


def convertModuleToJSON(module, seventh_param_name="seventhParam"):
    """
    Converting a module record into a JSON object

    Keyword arguments:
    module -- the module record from database (list/array)
    """

    if len(module) < 4:
        return errorMessage(
            "Wrong amount of values in the object. Module record has 4 fields, or 5 with groupID"
        )

    moduleObj = {}
    moduleObj["moduleID"] = module[0]
    moduleObj["name"] = module[1]
    moduleObj["language"] = module[2]
    moduleObj["complexity"] = module[3]
    moduleObj["userID"] = module[4]
    moduleObj["isPastaModule"] = module[5]

    if len(module) > 6:
        moduleObj[seventh_param_name] = module[6]

    return moduleObj


def querySessionsToJSON(query, parameters=None):
    """
    The passed in query related to retrieving sessions will be executed and will return a JSON object of the retrieved values.

    Keyword Arguments
    query -- the query that retrives session information
    parameters -- any parameters that has to be passed in to the query
    """

    result = getFromDB(query, parameters)
    sessions = []

    for row in result:
        session = {}
        session["sessionID"] = row[0]
        session["userID"] = row[1]
        session["moduleID"] = row[2]
        session["sessionDate"] = str(row[3])
        session["playerScore"] = row[4]
        session["startTime"] = row[5]
        session["endTime"] = row[6]
        session["platform"] = row[7]
        # Ignoring unfinished sessions
        if (
            session["endTime"] != None
            and session["startTime"] != None
            and session["playerScore"] != None
        ):
            sessions.append(session)
        # If an unfinished session, we get the last loggedd answer time associated with the session and update the session end time
        else:
            log_time_query = "SELECT `logged_answer`.`log_time` FROM `logged_answer` WHERE `sessionID`= %s ORDER BY `logID` DESC LIMIT 1"
            last_log_time = getFromDB(log_time_query, row[0])
            if last_log_time and last_log_time[0] and last_log_time[0][0] != None:
                if session["sessionDate"] != time.strftime("%Y-%m-%d"):
                    query_update_time = "UPDATE `session` SET `session`.`endTime` = %s WHERE `session`.`sessionID` = %s"
                    postToDB(
                        query_update_time,
                        (dateTimeToMySQL(last_log_time[0][0]), row[0]),
                    )
                    session["endTime"] = last_log_time[0][0]
                    sessions.append(session)
                    try:
                        # Since we changed the sessions data on db, invalidate Redis cache
                        redis_conn = redis.StrictRedis(
                            host=REDIS_HOST,
                            port=REDIS_PORT,
                            charset=REDIS_CHARSET,
                            decode_responses=True,
                        )
                        redis_conn.delete("sessions_csv")
                    except redis.exceptions.ConnectionError:
                        pass
    return sessions


def getAverages(sessions):
    """
    Returns the average score and average session length each session record in sessions object

    Keyword arguments
    sessions -- an array of session records
    """

    if len(sessions) == 0:
        return None
    score_total = 0
    time_total = 0
    logged_answer_count = 0
    for session in sessions:
        # Accumulating score

        if not session["startTime"]:
            continue

        if not session["endTime"]:
            # If an unfinished session, we get the last loggedd answer time associated with the session and update the session end time

            log_time_query = "SELECT `logged_answer`.`log_time` FROM `logged_answer` WHERE `sessionID`= %s ORDER BY `logID` DESC LIMIT 1"
            last_log_time = getFromDB(log_time_query, session["sessionID"])
            if last_log_time and last_log_time[0] and last_log_time[0][0] != None:
                if session["sessionDate"] != time.strftime("%Y-%m-%d"):
                    query_update_time = "UPDATE `session` SET `session`.`endTime` = %s WHERE `session`.`sessionID` = %s"
                    postToDB(
                        query_update_time,
                        (dateTimeToMySQL(last_log_time[0][0]), session["sessionID"]),
                    )
                    session["endTime"] = last_log_time[0][0]
                    sessions.append(session)
                    try:
                        # Since we changed the sessions data on db, invalidate Redis cache
                        redis_conn = redis.StrictRedis(
                            host=REDIS_HOST,
                            port=REDIS_PORT,
                            charset=REDIS_CHARSET,
                            decode_responses=True,
                        )
                        redis_conn.delete("sessions_csv")
                    except redis.exceptions.ConnectionError:
                        pass
            else:
                # No associated logged answer was found
                continue

        if not session["playerScore"]:
            # If playerscore was not found, we retrieve a sum of all associated logged answer's correct values and use that as playerscore
            get_logged_answer_sum = "SELECT SUM(`logged_answer`.`correct`) FROM `logged_answer` WHERE `logged_answer`.`sessionID` = %s"
            logged_answer_sum = getFromDB(get_logged_answer_sum, session["sessionID"])
            if session["sessionDate"] != time.strftime("%Y-%m-%d"):
                update_session = "UPDATE `session` SET `playerScore` = %s WHERE `session`.`sessionID` = %s"
                postToDB(update_session, (logged_answer_sum[0], session["sessionID"]))
                try:
                    # Since we changed the sessions data on db, invalidate Redis cache
                    redis_conn = redis.StrictRedis(
                        host=REDIS_HOST,
                        port=REDIS_PORT,
                        charset=REDIS_CHARSET,
                        decode_responses=True,
                    )
                    redis_conn.delete("sessions_csv")
                except redis.exceptions.ConnectionError:
                    pass
            if (
                logged_answer_sum
                and logged_answer_sum[0]
                and logged_answer_sum[0][0] != None
            ):
                session["playerScore"] = logged_answer_sum[0][0]
            else:
                # If no associated logged answers were found
                continue

        score_total += session["playerScore"]
        get_log_count = "SELECT COUNT(`logged_answer`.`logID`) FROM `logged_answer` WHERE `logged_answer`.`sessionID` = %s"
        logged_answer_count += (getFromDB(get_log_count, session["sessionID"]))[0][0]
        start_date_time = session["startTime"]
        # Accumulating time
        end_date_time = session["endTime"]
        elapsedTime = end_date_time - start_date_time
        time_total += elapsedTime.seconds
    # Returning statistics object
    stat = {}
    stat["averageScore"] = (
        (score_total / logged_answer_count)
        if (score_total and logged_answer_count != 0.0)
        else 0.0
    )
    # Session length in minutes
    stat["averageSessionLength"] = str(datetime.timedelta(seconds=(time_total)))
    return stat


def ObjectToJSONString(o):
    """This function is to be used for json.dumps()'s default parameter. Converts unsupported objects into a serializable object for JSON"""

    if isinstance(o, datetime.datetime):
        return str(o)
    elif isinstance(o, datetime.timedelta):
        return str(o)
    elif isinstance(o, Decimal):
        return str(o)


def convertListToSQL(list):
    if len(list) <= 0:
        return "= ''"
    if len(list) < 2:
        return "= " + str(list[0])
    else:
        return "IN " + str(tuple(list))


def find_question(questionID):
    query = "SELECT * FROM question WHERE questionID = %s"
    result = getFromDB(query, (questionID,))
    if int(result[0][0]) == int(questionID):
        return True
    return False


def CheckIfStrHasNum(string):
    """Returns true if the given string contains at least one number"""
    for char in string:
        if char.isdigit():
            return True
    return False

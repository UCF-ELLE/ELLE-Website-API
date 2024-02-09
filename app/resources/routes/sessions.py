import random
import string
import time
from flask import Blueprint, jsonify, make_response, request, Response
from app.db import db
from app.resources.models.User import User
from utils import token_required
from app.resources.models.Session import Session
from app.resources.models.Module import Module
from app.resources.models.LoggedAnswer import LoggedAnswer
from app.config import GAME_PLATFORMS
import redis


def getTimeDiffFormatted(
    time_1=None,
    time_2=None,
    # str_format = "{days} day {hours}:{minutes}:{seconds}",
    str_format="{hours}:{minutes}:{seconds}",
    time_obj=None,
):

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


sessions_bp = Blueprint("sessions", __name__)


@sessions_bp.post("/session")
@token_required
def post_session(current_user):
    data = request.form
    moduleID = data["moduleID"]
    mode = data.get("mode")
    sessionDate = data.get("sessionDate")
    startTime = data.get("startTime")
    platform = data["platform"]

    if not sessionDate or sessionDate == "":
        sessionDate = time.strftime("%m/%d/%Y")

    platform = platform.lower()
    if platform == "pc":
        platform = "cp"

    if platform not in GAME_PLATFORMS:
        return make_response(jsonify({"message": "Not a valid platform"}), 400)
    try:
        if mode:
            session = Session(
                moduleID, sessionDate, startTime, mode, platform, current_user.userID
            )
        else:
            session = Session(
                moduleID, sessionDate, startTime, None, platform, current_user.userID
            )
        db.session.add(session)
        db.session.commit()
        return make_response(jsonify({"sessionID": session.sessionID}), 201)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@sessions_bp.get("/session")
@token_required
def get_session(current_user):
    sessionID = request.args.get("sessionID")

    try:
        session = (
            Session.join(Module.moduleID == Session.moduleID)
            .filter(Session.sessionID == sessionID)
            .first()
        )
        if not session:
            return make_response(
                jsonify({"message": "No sessions found for the given ID"}), 400
            )

        if (
            current_user.permissionGroup == "st"
            and session.userID != current_user.userID
        ):
            return make_response(
                jsonify({"message": "Unauthorized to access this session"}), 403
            )

        logged_answers = LoggedAnswer.query.filter_by(sessionID=sessionID).all()
        logged_answers = [logged_answer.to_dict() for logged_answer in logged_answers]
        session = session.to_dict()
        session["logged_answers"] = logged_answers
        return make_response(jsonify(session), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@sessions_bp.post("/endsession")
@token_required
def end_session(current_user):
    data = request.form
    sessionID = data["sessionID"]
    endTime = data.get("endTime")
    playerScore = data["playerScore"]

    try:
        session = Session.query.filter_by(sessionID=sessionID).first()
        if not session:
            return make_response(
                jsonify({"message": "Session not found for provided ID"}), 400
            )
        elif session.endTime:
            return make_response(jsonify({"message": "Session has already ended"}), 400)

        if not endTime:
            endTime = time.strftime("%H:%M")

        session.endTime = endTime
        session.playerScore = playerScore
        db.session.commit()
        return make_response(jsonify({"message": "Session successfully ended"}), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@sessions_bp.get("/searchsessions")
@token_required
def search_sessions(current_user):
    data = request.args
    userID = data.get("userID")
    userName = data.get("userName")
    moduleID = data.get("moduleID")
    platform = data.get("platform")
    sessionDate = data.get("sessionDate")

    if not moduleID or moduleID == "":
        moduleID = "REGEXP '.*'"
    else:
        moduleID = f"= '{moduleID}'"

    if not userName or userName == "":
        userName = "REGEXP '.*'"
    else:
        userName = f"= '{userName}'"

    if not userID or userID == "":
        userID = "REGEXP '.*'"
    elif current_user.permissionGroup != "su" and current_user.permissionGroup != "pf":
        userID = f"= '{current_user.userID}'"
    else:
        userID = f"= '{userID}'"

    if not platform or platform == "":
        platform = "REGEXP '.*'"
    else:
        platform = f"= '{platform}'"

    if not sessionDate or sessionDate == "":
        sessionDate = "REGEXP '.*'"
    else:
        sessionDate = f"= '{sessionDate}'"

    try:
        sessions = (
            db.session.query(Session, Module.name)
            .join(Module, Module.moduleID == Session.moduleID)
            .join(User.userID == Session.userID)
            .filter(
                Session.moduleID == moduleID,
                Session.userID == userID,
                Session.platform == platform,
                Session.sessionDate == sessionDate,
            )
            .order_by(Session.sessionID)
            .all()
        )
        if not sessions:
            return make_response(
                jsonify({"message": "No sessions found for the user"}), 204
            )

        records = []
        for session in sessions:
            session = session[0].to_dict()
            records.append(session)
        return make_response(jsonify(records), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@sessions_bp.get("/getallsessions")
@token_required
def get_all_sessions(current_user):
    if current_user.permissionGroup != "su":
        return make_response(jsonify({"message": "Unauthorized user"}), 401)

    try:
        sessions = (
            db.session.query(Session, Module.name)
            .join(Module, Module.moduleID == Session.moduleID)
            .all()
        )
        if not sessions:
            return make_response(
                jsonify({"message": "No sessions found for the chosen module"}), 210
            )

        records = []
        for session in sessions:
            session = session[0].to_dict()
            records.append(session)
        return make_response(jsonify(records), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@sessions_bp.get("/getsessioncsv")
@token_required
def get_session_csv(current_user):
    if current_user.permissionGroup != "su":
        return make_response(jsonify({"message": "Unauthorized user"}), 401)

    try:
        redis_conn = redis.StrictRedis(
            host="localhost", port=6379, charset="utf-8", decode_responses=True
        )
        redis_sessions_chksum = redis_conn.get("sessions_checksum")
        redis_sessions_csv = redis_conn.get("sessions_csv")
        redis_lastseen_sessionID = redis_conn.get("lastseen_sessionID")
        redis_session_count = redis_conn.get("session_count")
    except redis.exceptions.ConnectionError:
        redis_conn = None
        redis_sessions_chksum = None
        redis_sessions_csv = None
        redis_lastseen_sessionID = None
        redis_session_count = None

    get_max_sessionID = "SELECT MAX(`session`.`sessionID`) FROM `session`"
    get_sessions_chksum = "CHECKSUM TABLE `session`"
    max_sessionID = db.session.execute(get_max_sessionID).fetchall()
    chksum_session = db.session.execute(get_sessions_chksum).fetchall()

    if max_sessionID and max_sessionID[0] and chksum_session and chksum_session[0]:
        max_sessionID = str(max_sessionID[0][0])
        chksum_session = str(chksum_session[0][1])
    else:
        return make_response(jsonify({"message": "Error retrieving data"}), 500)

    if (
        not redis_session_count
        or not redis_sessions_chksum
        or not redis_sessions_csv
        or not redis_lastseen_sessionID
        or redis_sessions_chksum != chksum_session
    ):
        if (
            redis_session_count
            and redis_sessions_chksum
            and redis_sessions_csv
            and redis_sessions_chksum != chksum_session
        ):
            get_sub_session_count = f"SELECT COUNT(`session`.`sessionID`) FROM `session` WHERE `session`.`sessionID` <= {redis_lastseen_sessionID}"
            get_all_session_count = (
                f"SELECT COUNT(`session`.`sessionID`) FROM `session`"
            )
            sub_session_count = db.session.execute(get_sub_session_count).fetchall()
            all_session_count = db.session.execute(get_all_session_count).fetchall()

            if (
                sub_session_count
                and sub_session_count[0]
                and all_session_count
                and all_session_count[0]
            ):
                sub_session_count = str(sub_session_count[0][0])
                all_session_count = str(all_session_count[0][0])
            else:
                return make_response(jsonify({"message": "Error retrieving data"}), 500)

            if (
                all_session_count != redis_session_count
                and sub_session_count == redis_session_count
            ):
                csv = redis_sessions_csv
                query = f"""
                    SELECT `session`.*, `user`.`username`, `module`.`name`, COUNT(`logged_answer`.`logID`) FROM `session`
                    LEFT JOIN `logged_answer` ON `logged_answer`.`sessionID` = `session`.`sessionID`
                    INNER JOIN `user` ON `user`.`userID` = `session`.`userID`
                    INNER JOIN `module` on `module`.`moduleID` = `session`.`moduleID`
                    WHERE `session`.`sessionID` > {redis_lastseen_sessionID}
                    GROUP BY `session`.`sessionID`
                """
            else:
                csv = "Session ID, User ID, User Name, Module ID, Deleted Module ID, Module Name, Session Date, Player Score, Total Attempted Questions, Percentage Correct, Start Time, End Time, Time Spent, Platform, Mode\n"
                query = """
                    SELECT `session`.*, `user`.`username`, `module`.`name`, COUNT(`logged_answer`.`logID`) FROM `session`
                    LEFT JOIN `logged_answer` ON `logged_answer`.`sessionID` = `session`.`sessionID`
                    INNER JOIN `user` ON `user`.`userID` = `session`.`userID`
                    INNER JOIN `module` on `module`.`moduleID` = `session`.`moduleID`
                    GROUP BY `session`.`sessionID`
                """
        else:
            csv = "Session ID, User ID, User Name, Module ID, Deleted Module ID, Module Name, Session Date, Player Score, Total Attempted Questions, Percentage Correct, Start Time, End Time, Time Spent, Platform, Mode\n"
            query = """
                SELECT `session`.*, `user`.`username`, `module`.`name`, COUNT(`logged_answer`.`logID`) FROM `session`
                LEFT JOIN `logged_answer` ON `logged_answer`.`sessionID` = `session`.`sessionID`
                INNER JOIN `user` ON `user`.`userID` = `session`.`userID`
                INNER JOIN `module` on `module`.`moduleID` = `session`.`moduleID`
                GROUP BY `session`.`sessionID`
            """

        get_max_session_count = "SELECT COUNT(session.sessionID) FROM session"
        max_session_count = db.session.execute(get_max_session_count).fetchall()
        if max_session_count and max_session_count[0]:
            max_session_count = str(max_session_count[0][0])
        else:
            return make_response(jsonify({"message": "Error retrieving data"}), 500)

        results = db.session.execute(query).fetchall()

        for record in results:
            if record[6]:
                time_spent, _ = getTimeDiffFormatted(record[5], record[6])
            else:
                log_time_query = "SELECT `logged_answer`.`log_time` FROM `logged_answer` WHERE `sessionID`=%s ORDER BY `logID` DESC LIMIT 1"
                last_log_time = db.session.execute(log_time_query, record[0]).fetchall()
                if last_log_time and last_log_time[0] and last_log_time[0][0] != None:
                    time_spent, _ = getTimeDiffFormatted(record[5], last_log_time[0][0])
                    record[6], _ = getTimeDiffFormatted(time_obj=last_log_time[0][0])
                    if record[3] != time.strftime("%Y-%m-%d"):
                        query_update_time = f"UPDATE `session` SET `session`.`endTime` = '{dateTimeToMySQL(last_log_time[0][0])}' WHERE `session`.`sessionID` = {record[0]}"
                        db.session.execute(query_update_time)
                else:
                    time_spent = None
            if not record[4]:
                get_logged_answer_score = """
                    SELECT `logged_answer`.`correct`
                    FROM `logged_answer`
                    WHERE `logged_answer`.`sessionID` = %s
                """
                answer_data = db.session.execute(
                    get_logged_answer_score, record[0]
                ).fetchall()
                if answer_data and answer_data[0]:
                    correct_answers = 0
                    for answer_record in answer_data:
                        correct_answers = correct_answers + answer_record[0]
                    update_score_query = """
                        UPDATE `session` SET `session`.`playerScore` = %s
                        WHERE `session`.`sessionID` = %s
                    """
                    db.session.execute(update_score_query, (correct_answers, record[0]))
                    record[4] = correct_answers
            platform = (
                "Mobile"
                if record[7] == "mb"
                else "PC" if record[7] == "cp" else "Virtual Reality"
            )
            if record[2] is None:
                replace_query = (
                    "SELECT `name` FROM `deleted_module` WHERE `moduleID` = %s"
                )
                replace = db.session.execute(replace_query, record[9]).fetchall()
                record[11] = replace[0][0]
            if record[12] != 0 and record[12] and record[4]:
                percentCorrect = record[4] / record[12]
                roundedPercentCorrect = round(percentCorrect, 3)
            else:
                roundedPercentCorrect = None

            csv = (
                csv
                + f"""{record[0]}, {record[1]}, {record[10]}, {record[2]}, {record[9]}, {record[11]}, {record[3]}, {record[4]}, {record[12]}, {roundedPercentCorrect},{getTimeDiffFormatted(time_obj = record[5])[0]}, {getTimeDiffFormatted(time_obj = record[6])[0] if record[6] else None}, {time_spent}, {platform}, {record[8]}\n"""
            )

        if redis_conn:
            redis_conn.set("sessions_csv", csv)
            redis_conn.set("sessions_checksum", chksum_session)
            redis_conn.set("lastseen_sessionID", max_sessionID)
            redis_conn.set("session_count", max_session_count)
        return Response(
            csv,
            mimetype="text/csv",
            headers={"Content-disposition": "attachment; filename=Sessions.csv"},
        )
    elif (
        max_sessionID == redis_lastseen_sessionID
        and chksum_session == redis_sessions_chksum
    ):
        return Response(
            redis_sessions_csv,
            mimetype="text/csv",
            headers={"Content-disposition": "attachment; filename=Sessions.csv"},
        )
    else:
        return make_response(
            jsonify({"message": "Something went wrong with computing CSV"}), 500
        )

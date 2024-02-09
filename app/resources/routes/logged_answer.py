import datetime
from flask import Blueprint, jsonify, make_response, request, Response
from app.db import db
from app.resources.models.Session import Session
from app.resources.models.Term import Term
from app.resources.models.DeletedTerm import DeletedTerm
from app.resources.models.LoggedAnswer import LoggedAnswer
from utils import token_required
import redis
from app.config import REDIS_HOST, REDIS_PORT, REDIS_CHARSET

logged_answer_bp = Blueprint("loggedAnswer", __name__)


@logged_answer_bp.post("/loggedanswer")
@token_required
def post_logged_answer(current_user):
    data = request.form
    questionID = data["questionID"]
    termID = data["termID"]
    sessionID = data["sessionID"]
    correct = data["correct"]
    mode = data["mode"]

    try:
        if correct == "" or correct.lower() == "false":
            correct = "0"
        elif correct.lower() == "true":
            correct = "1"

        formatted_time = datetime.datetime.now().time().strftime("%H:%M")

        if mode:
            logged_answer = LoggedAnswer(
                questionID, termID, sessionID, correct, mode, formatted_time
            )
        else:
            logged_answer = LoggedAnswer(
                questionID, termID, sessionID, correct, formatted_time
            )
        db.session.add(logged_answer)
        db.session.commit()
        return make_response(
            jsonify({"message": "Successfully created a logged_answer record"}), 201
        )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@logged_answer_bp.get("/loggedanswer")
@token_required
def get_logged_answer(current_user):
    data = request.form
    moduleID = data["moduleID"]
    userID = data["userID"]
    sessionID = data["sessionID"]

    try:
        if not moduleID or moduleID == "":
            module_exp = "REGEXP '.*'"
        else:
            moduleID = moduleID.split("'")
            moduleID = moduleID[0]
            module_exp = " = " + str(moduleID)

        if not sessionID or sessionID == "":
            sessionID = "REGEXP '.*'"
        else:
            sessionID = sessionID.split("'")
            sessionID = sessionID[0]
            sessionID = " = " + str(sessionID)

        if (not userID or userID == "") and (
            current_user.permissionGroup == "pf" or current_user.permissionGroup == "su"
        ):
            user_exp = "REGEXP '.*'"
        elif (
            current_user.permissionGroup == "pf" or current_user.permissionGroup == "su"
        ):
            user_exp = " = " + int(userID)
        else:
            user_exp = " = " + int(current_user.userID)

        #    get_questions_query = f"SELECT DISTINCT `sessionID` FROM `session` WHERE `moduleID` {module_exp} AND userID {user_exp} AND sessionID {sessionID}"
        questions = Session.query.filter_by(
            moduleID=module_exp, userID=user_exp, sessionID=sessionID
        ).all()
        logged_answers = []

        for sessionID in questions:
            answer_terms = (
                LoggedAnswer.join(Term, LoggedAnswer.termID == Term.termID)
                .join(DeletedTerm, LoggedAnswer.deleted_termID == DeletedTerm.termID)
                .filter(LoggedAnswer.sessionID == sessionID)
            )
            for result in answer_terms:
                logged_answers.append(result.serialize())

        if logged_answers:
            return make_response(jsonify(logged_answers), 200)
        else:
            return make_response(
                jsonify(
                    {
                        "message": "No associated logged answers found for that module and/or user"
                    }
                ),
                200,
            )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


# TODO: Make this fit within SQLAlchemy instead of using raw SQL statements
@logged_answer_bp.get("/getloggedanswercsv")
@token_required
def get_logged_answer_csv(current_user):
    try:
        redis_conn = redis.StrictRedis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            charset=REDIS_CHARSET,
            decode_responses=True,
        )
    except redis.exceptions.ConnectionError:
        redis_conn = None

    checksum_query = "CHECKSUM TABLE `logged_answer`"
    checksum = db.engine.execute(checksum_query)
    checksum = str(checksum[0][1])

    if redis_conn is not None:
        logged_ans_chks = redis_conn.get("logged_ans_chks")
    else:
        logged_ans_chks = None

    if checksum == logged_ans_chks:
        csv = redis_conn.get("logged_ans_csv")
    else:
        last_query = "SELECT MAX(logged_answer.logID) FROM `logged_answer`"
        last_db_id = db.engine.execute(last_query)
        last_db_id = str(last_db_id[0][0])

        if redis_conn is not None:
            last_rd_id = redis_conn.get("last_logged_ans_id")
        else:
            last_rd_id = None

        count_query = "SELECT COUNT(*) FROM `logged_answer`"
        db_count = db.engine.execute(count_query)
        db_count = str(db_count[0][0])

        if redis_conn is not None:
            rd_log_ans_count = redis_conn.get("log_ans_count")
        else:
            rd_log_ans_count = None

        if db_count != rd_log_ans_count or rd_log_ans_count is None:
            csv = "Log ID, User ID, Username, Module ID, Deleted Module ID, Module Name, Question ID, Deleted Question ID, Term ID, Deleted Term ID, Session ID, Correct, Log time, Mode\n"
            query = """
                    SELECT `logged_answer`.*, `session`.`userID`, `user`.`username`, `module`.`moduleID`, `module`.`name`, `session`.`deleted_moduleID` FROM `logged_answer`
                    INNER JOIN `session` ON `session`.`sessionID` = `logged_answer`.`sessionID`
                    INNER JOIN `user` ON `user`.`userID` = `session`.`userID`
                    INNER JOIN `module` on `module`.`moduleID` = `session`.`moduleID`
                    """
            results = db.engine.execute(query)
            if results and results[0]:
                for record in results:
                    if record[11] is None:
                        replace_query = (
                            "SELECT `name` FROM `deleted_module` WHERE `moduleID` = %s"
                        )
                        replace = db.engine.execute(replace_query, record[13])
                        record[12] = replace[0][0]
                    csv = (
                        csv
                        + f"""{record[0]}, {record[9]}, {record[10]}, {record[11]}, {record[13]}, {record[12]}, {record[1]}, {record[7]}, {record[2]}, {record[8]}, {record[3]}, {record[4]}, {str(record[6])}, {record[5]}\n"""
                    )
        else:
            csv = ""
            query = "SELECT `logged_answer`.*, `session`.`userID`, `user`.`username`, `module`.`moduleID`, `module`.`name`, `session`.`deleted_moduleID` FROM `logged_answer` \
                    INNER JOIN `session` ON `session`.`sessionID` = `logged_answer`.`sessionID` \
                    INNER JOIN `user` ON `user`.`userID` = `session`.`userID` \
                    INNER JOIN `module` on `module`.`moduleID` = `session`.`moduleID` \
                    WHERE logID > %s"
            results = db.engine.execute(query, last_db_id)
            if redis_conn.get("logged_ans_csv") is not None:
                csv = redis_conn.get("logged_ans_csv")

            if results and results[0]:
                for record in results:
                    if record[11] is None:
                        replace_query = (
                            "SELECT `name` FROM `deleted_module` WHERE `moduleID` = %s"
                        )
                        replace = db.engine.execute(replace_query, record[12])
                        record[12] = replace[0][0]
                    csv = (
                        csv
                        + f"""{record[0]}, {record[9]}, {record[10]}, {record[11]}, {record[13]}, {record[12]}, {record[1]}, {record[7]}, {record[2]}, {record[8]}, {record[3]}, {record[4]}, {str(record[6])}, {record[5]}\n"""
                    )

            last_record_id = results[-1][0]

            if redis_conn is not None:
                redis_conn.set("logged_ans_csv", csv)
                redis_conn.set("logged_ans_chks", checksum)
                redis_conn.set("last_logged_ans_id", last_record_id)
                redis_conn.set("log_ans_count", db_count)

    return Response(
        csv,
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=Logged_Answers.csv"},
    )

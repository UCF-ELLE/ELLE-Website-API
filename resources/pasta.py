import json
from flask import request
from flask_restful import Resource
from flask_jwt_extended import (
    jwt_required,
)
from db import mysql
from db_utils import *
from utils import *
from exceptions_util import *


class Pasta(Resource):
    @jwt_required
    def get(self):
        data = {}
        data["pastaID"] = getParameter("pastaID", int, False, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "SELECT * FROM `pasta` WHERE `pastaID` = %s"
            result = getFromDB(query, data["pastaID"], conn, cursor)
            pasta = []
            for row in result:
                new_pasta_object = {}
                new_pasta_object["pastaID"] = row[0]
                new_pasta_object["moduleID"] = row[1]
                new_pasta_object["category"] = row[2]
                new_pasta_object["utterance"] = row[3]
                new_pasta_object["mc1Answer"] = row[4]
                new_pasta_object["splitAnswer"] = row[5]
                new_pasta_object["identifyAnswer"] = row[6]
                new_pasta_object["mc2Answer"] = row[7]
                pasta.append(new_pasta_object)

            raise ReturnSuccess(pasta, 200)
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

    @jwt_required
    def post(self):
        data = {}
        data["moduleID"] = getParameter("moduleID", int, True, "")
        data["category"] = getParameter("category", str, True, "")
        data["utterance"] = getParameter("utterance", str, True, "")
        data["mc1Answer"] = getParameter("mc1Answer", int, False, "")
        data["splitAnswer"] = json.loads(
            json.dumps(request.form.getlist("splitAnswer"))
        )
        data["identifyAnswer"] = getParameter("identifyAnswer", str, False, "")
        data["mc2Answer"] = getParameter("mc2Answer", int, False, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if permission == "st" and not is_ta(user_id, data["groupID"]):
            return errorMessage("User not authorized to add pasta."), 400

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "INSERT INTO `pasta` (`moduleID`, `category`, `utterance`, `mc1Answer`, `splitAnswer`, `identifyAnswer`, `mc2Answer`) VALUES (%s, %s, %s, %s, %s, %s, %s)"
            postToDB(
                query,
                (
                    data["moduleID"],
                    data["category"],
                    data["utterance"],
                    data["mc1Answer"],
                    data["splitAnswer"],
                    data["identifyAnswer"],
                    data["mc2Answer"],
                ),
                conn,
                cursor,
            )

            query = "SELECT MAX(`pastaID`) FROM `pasta`"
            result = getFromDB(query, None, conn, cursor)
            pasta_id = check_max_id(result) - 1

            raise ReturnSuccess(
                {
                    "Message": "Successfully created a pasta",
                    "pastaID": int(pasta_id),
                },
                201,
            )
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

    @jwt_required
    def put(self):
        data = {}
        data["pastaID"] = getParameter("pastaID", int, True, "")
        data["moduleID"] = getParameter("moduleID", int, False, "")
        data["category"] = getParameter("category", str, False, "")
        data["utterance"] = getParameter("utterance", str, False, "")
        data["mc1Answer"] = getParameter("mc1Answer", int, False, "")
        data["splitAnswer"] = json.loads(request.form.getlist("splitAnswer"))
        data["identifyAnswer"] = getParameter("identifyAnswer", str, False, "")
        data["mc2Answer"] = getParameter("mc2Answer", int, False, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if permission == "st" and not is_ta(user_id, data["groupID"]):
            return errorMessage("User not authorized to update pasta."), 400

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            update_fields = []
            query_parameters = []

            for key, value in data.items():
                if value:
                    update_fields.append("`{}` = %s".format(key))
                    query_parameters.append(value)

            if not update_fields:
                return errorMessage("No fields to update provided."), 400

            query = "UPDATE `pasta` SET {} WHERE `pastaID` = %s".format(
                ", ".join(update_fields)
            )
            query_parameters.append(data["pastaID"])

            postToDB(query, tuple(query_parameters), conn, cursor)

            raise ReturnSuccess({"Message": "Successfully updated the pasta"}, 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage("An error occurred while updating the pasta."), 500
        finally:
            if conn.open:
                cursor.close()
                conn.close()

    @jwt_required
    def delete(self):
        data = {}
        data["pastaID"] = getParameter("pastaID", int, True, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if permission == "st" and not is_ta(user_id, data["groupID"]):
            return errorMessage("User not authorized to delete pasta."), 400

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "DELETE FROM `pasta` WHERE `pastaID` = %s"
            postToDB(query, (data["pastaID"],), conn, cursor)

            raise ReturnSuccess({"Message": "Successfully deleted the pasta"}, 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage("An error occurred while deleting the pasta."), 500
        finally:
            if conn.open:
                cursor.close()
                conn.close()


class AllPastaInModule(Resource):
    @jwt_required
    def get(self):
        data = {}
        data["moduleID"] = request.args.get("moduleID")

        if not data["moduleID"]:
            return errorMessage("No moduleID provided"), 400

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "SELECT * FROM `pasta` WHERE `moduleID` = %s"
            result = getFromDB(query, data["moduleID"], conn, cursor)
            pasta = []
            for row in result:
                new_pasta_object = {}
                new_pasta_object["pastaID"] = row[0]
                new_pasta_object["moduleID"] = row[1]
                new_pasta_object["category"] = row[2]
                new_pasta_object["utterance"] = row[3]
                new_pasta_object["mc1Answer"] = row[4]
                if row[5]:
                    new_pasta_object["splitAnswer"] = json.loads(row[5])
                if row[6]:
                    new_pasta_object["identifyAnswer"] = json.loads(row[6])
                new_pasta_object["mc2Answer"] = row[7]
                pasta.append(new_pasta_object)

            raise ReturnSuccess(pasta, 200)
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


class PastaFrame(Resource):
    # adds a question frame to the database table
    @jwt_required
    def post(self):
        data = {}
        data["moduleID"] = getParameter("moduleID", int, True, "")
        data["category"] = getParameter("category", str, True, "")
        data["mc1QuestionText"] = getParameter("mc1QuestionText", str, False, "")
        data["mc1Options"] = request.form.getlist("mc1Options")
        data["splitQuestionVar"] = getParameter("splitQuestionVar", str, True, "")
        data["identifyQuestionVar"] = getParameter(
            "identifyQuestionVar", str, False, ""
        )
        data["mc2QuestionText"] = getParameter("mc2QuestionText", str, False, "")
        data["mc2Options"] = request.form.getlist("mc2Options")
        data["displayName"] = getParameter("displayName", str, False, "")

        maxID = -1

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if permission == "st" and not is_ta(user_id, data["groupID"]):
            return errorMessage("User not authorized to add question frames."), 400

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            # Check if the module exists
            query = "SELECT * FROM `module` WHERE `moduleID` = %s"
            result = getFromDB(query, data["moduleID"], conn, cursor)
            if len(result) == 0:
                raise CustomException("Module does not exist!", 404)

            query = "INSERT INTO `question_frame` (`moduleID`, `category`, `mc1QuestionText`, `mc1Options`, `splitQuestionVar`, `identifyQuestionVar`, `mc2QuestionText`, `mc2Options`, `displayName`) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"
            postToDB(
                query,
                (
                    data["moduleID"],
                    data["category"],
                    data["mc1QuestionText"],
                    json.dumps(data["mc1Options"]) if data["mc1Options"] else None,
                    data["splitQuestionVar"],
                    data["identifyQuestionVar"],
                    data["mc2QuestionText"],
                    json.dumps(data["mc2Options"]) if data["mc2Options"] else None,
                    data["displayName"],
                ),
                conn,
                cursor,
            )

            print("eh")

            query = "SELECT MAX(`qframeID`) FROM `question_frame`"
            result = getFromDB(query, None, conn, cursor)
            question_frame_id = check_max_id(result) - 1

            raise ReturnSuccess(
                {
                    "Message": "Successfully created a question frame",
                    "qframeID": int(question_frame_id),
                },
                201,
            )
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return
        finally:
            if conn.open:
                cursor.close()
                conn.close()

    # returns the question frame specified with the ID and returns the question frame with of properties assoicatied with that question frame
    @jwt_required
    def get(self):
        data = {}
        data["qframeID"] = request.args.get("qframeID")

        if not data["qframeID"]:
            return errorMessage("No qframeID provided"), 400

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "SELECT * FROM `question_frame` WHERE `qframeID` = %s"
            result = getFromDB(query, data["qframeID"], conn, cursor)
            new_question_frame_object = {}
            if len(result) == 0:
                raise CustomException("Question frame does not exist!", 404)
            for row in result:
                new_question_frame_object["qframeID"] = row[0]
                new_question_frame_object["moduleID"] = row[1]
                new_question_frame_object["category"] = row[2]
                new_question_frame_object["mc1QuestionText"] = row[3]
                if row[4]:
                    new_question_frame_object["mc1Options"] = json.loads(row[4])
                new_question_frame_object["splitQuestionVar"] = row[5]
                new_question_frame_object["identifyQuestionVar"] = row[6]
                new_question_frame_object["mc2QuestionText"] = row[7]
                if row[8]:
                    new_question_frame_object["mc2Options"] = json.loads(row[8])
                new_question_frame_object["displayName"] = row[9]

            raise ReturnSuccess(new_question_frame_object, 200)
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

    # updates a question frame in the database table
    @jwt_required
    def put(self):
        data = {}
        data["qframeID"] = getParameter("qframeID", int, True, "")
        data["moduleID"] = getParameter("moduleID", int, False, "")
        data["category"] = getParameter("category", str, False, "")
        data["mc1QuestionText"] = getParameter("mc1QuestionText", str, False, "")
        data["mc1Options"] = (
            json.dumps(request.form.getlist("mc1Options"))
            if request.form.getlist("mc1Options")
            else None
        )
        data["splitQuestionVar"] = getParameter("splitQuestionVar", str, False, "")
        data["identifyQuestionVar"] = getParameter(
            "identifyQuestionVar", str, False, ""
        )
        data["mc2QuestionText"] = getParameter("mc2QuestionText", str, False, "")
        data["mc2Options"] = (
            json.dumps(request.form.getlist("mc2Options"))
            if request.form.getlist("mc2Options")
            else None
        )
        data["displayName"] = getParameter("displayName", str, False, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if permission == "st" and not is_ta(user_id, data["groupID"]):
            return errorMessage("User not authorized to update question frames."), 400

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            update_fields = []
            query_parameters = []

            for key, value in data.items():
                if value:
                    update_fields.append("`{}` = %s".format(key))
                    query_parameters.append(value)

            if not update_fields:
                return errorMessage("No fields to update provided."), 400

            query = "UPDATE `question_frame` SET {} WHERE `qframeID` = %s".format(
                ", ".join(update_fields)
            )
            query_parameters.append(data["qframeID"])

            postToDB(query, tuple(query_parameters), conn, cursor)

            raise ReturnSuccess(
                {"Message": "Successfully updated the question frame"}, 200
            )
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return (
                errorMessage("An error occurred while updating the question frame."),
                500,
            )
        finally:
            if conn.open:
                cursor.close()
                conn.close()

    # deletes a question frame from the database table
    @jwt_required
    def delete(self):
        data = {}
        data["qframeID"] = getParameter("qframeID", int, True, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if permission == "st" and not is_ta(user_id, data["groupID"]):
            return errorMessage("User not authorized to delete question frames."), 400

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "DELETE FROM `question_frame` WHERE `qframeID` = %s"
            postToDB(query, (data["qframeID"],), conn, cursor)

            raise ReturnSuccess(
                {"Message": "Successfully deleted the question frame"}, 200
            )
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return (
                errorMessage("An error occurred while deleting the question frame."),
                500,
            )
        finally:
            if conn.open:
                cursor.close()
                conn.close()


class PastaFrameModule(Resource):
    # returns all the question frames for a specific module
    @jwt_required
    def get(self):
        data = {}
        data["moduleID"] = request.args.get("moduleID")

        if not data["moduleID"]:
            return errorMessage("No moduleID provided"), 400

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "SELECT * FROM `question_frame` WHERE `moduleID` = %s"
            result = getFromDB(query, data["moduleID"], conn, cursor)
            question_frames = []
            for row in result:
                new_question_frame_object = {}
                new_question_frame_object["qframeID"] = row[0]
                new_question_frame_object["moduleID"] = row[1]
                new_question_frame_object["category"] = row[2]
                new_question_frame_object["mc1QuestionText"] = row[3]
                if row[4]:
                    new_question_frame_object["mc1Options"] = json.loads(row[4])
                new_question_frame_object["splitQuestionVar"] = row[5]
                new_question_frame_object["identifyQuestionVar"] = row[6]
                new_question_frame_object["mc2QuestionText"] = row[7]
                if row[8]:
                    new_question_frame_object["mc2Options"] = json.loads(row[8])
                new_question_frame_object["displayName"] = row[9]
                question_frames.append(new_question_frame_object)

            raise ReturnSuccess(question_frames, 200)
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

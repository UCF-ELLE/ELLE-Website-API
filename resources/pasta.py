from flask import request
from flask_restful import Resource
from flask_jwt_extended import (
    jwt_required,
)
from db import mysql
from db_utils import *
from utils import *
from exceptions_util import *
from datetime import datetime


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
                new_pasta_object["mc2Answer"] = row[5]
                pasta.append(new_pasta_object)

            query = "SELECT * FROM `pasta_answer` WHERE `pastaID` = %s"
            result = getFromDB(query, data["pastaID"], conn, cursor)

            splitAnswer = []
            identifyAnswer = []
            for row in result:
                if row[3] == "split":
                    splitAnswer.append(row[2])
                elif row[3] == "identify":
                    identifyAnswer.append(row[2])

            if splitAnswer:
                pasta[0]["splitAnswer"] = splitAnswer
            if identifyAnswer:
                pasta[0]["identifyAnswer"] = identifyAnswer

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
        data["splitAnswer"] = request.form.getlist("splitAnswer") or request.json.get(
            "splitAnswer", []
        )
        data["identifyAnswer"] = request.form.getlist(
            "identifyAnswer"
        ) or request.json.get("identifyAnswer", [])
        data["mc2Answer"] = getParameter("mc2Answer", int, False, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if permission == "st" and not is_ta(user_id, data["groupID"]):
            return errorMessage("User not authorized to add pasta."), 400

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "INSERT INTO `pasta` (`moduleID`, `category`, `utterance`, `mc1Answer`, `mc2Answer`) VALUES (%s, %s, %s, %s, %s)"
            postToDB(
                query,
                (
                    data["moduleID"],
                    data["category"],
                    data["utterance"],
                    data["mc1Answer"],
                    data["mc2Answer"],
                ),
                conn,
                cursor,
            )

            query = "SELECT MAX(`pastaID`) FROM `pasta`"
            result = getFromDB(query, None, conn, cursor)
            pasta_id = check_max_id(result) - 1

            query = "INSERT INTO `pasta_answer` (`pastaID`, `value`, `answerType`) VALUES (%s, %s, %s)"
            if data["splitAnswer"]:
                print("splitAnswer", data["splitAnswer"])
                for answer in data["splitAnswer"]:
                    postToDB(query, (pasta_id, answer, "split"), conn, cursor)

            if data["identifyAnswer"]:
                for answer in data["identifyAnswer"]:
                    postToDB(query, (pasta_id, answer, "identify"), conn, cursor)

            raise ReturnSuccess(
                {
                    "Message": "Successfully created a pasta",
                    "pasta": {
                        "pastaID": int(pasta_id),
                        "moduleID": data["moduleID"],
                        "category": data["category"],
                        "utterance": data["utterance"],
                        "mc1Answer": data["mc1Answer"],
                        "mc2Answer": data["mc2Answer"],
                        "splitAnswer": data["splitAnswer"],
                        "identifyAnswer": data["identifyAnswer"],
                    },
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
        data["splitAnswer"] = request.form.getlist("splitAnswer") or request.json.get(
            "splitAnswer", []
        )
        data["identifyAnswer"] = request.form.getlist(
            "identifyAnswer"
        ) or request.json.get("identifyAnswer", None)
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
                if key == "pastaID" or key == "splitAnswer" or key == "identifyAnswer":
                    continue
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

            # Update the splitAnswer and identifyAnswer
            query = "DELETE FROM `pasta_answer` WHERE `pastaID` = %s"
            postToDB(query, (data["pastaID"],), conn, cursor)

            query = "INSERT INTO `pasta_answer` (`pastaID`, `value`, `answerType`) VALUES (%s, %s, %s)"
            if data["splitAnswer"]:
                for answer in data["splitAnswer"]:
                    postToDB(query, (data["pastaID"], answer, "split"), conn, cursor)

            if data["identifyAnswer"]:
                for answer in data["identifyAnswer"]:
                    postToDB(query, (data["pastaID"], answer, "identify"), conn, cursor)

            raise ReturnSuccess(
                {
                    "Message": "Successfully updated the pasta",
                    "pasta": {
                        "pastaID": data["pastaID"],
                        "moduleID": data["moduleID"],
                        "category": data["category"],
                        "utterance": data["utterance"],
                        "mc1Answer": data["mc1Answer"],
                        "mc2Answer": data["mc2Answer"],
                        "splitAnswer": data["splitAnswer"],
                        "identifyAnswer": data["identifyAnswer"],
                    },
                },
                200,
            )
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            print(error)
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

            query = "DELETE FROM `pasta_answer` WHERE `pastaID` = %s"
            postToDB(query, (data["pastaID"],), conn, cursor)

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
                new_pasta_object["mc2Answer"] = row[5]
                pasta.append(new_pasta_object)

            query = "SELECT * FROM `pasta_answer` WHERE `pastaID` = %s"
            for pasta_object in pasta:
                result = getFromDB(query, pasta_object["pastaID"], conn, cursor)
                splitAnswer = []
                identifyAnswer = []
                for row in result:
                    if row[3] == "split":
                        splitAnswer.append(row[2])
                    elif row[3] == "identify":
                        identifyAnswer.append(row[2])

                if splitAnswer:
                    pasta_object["splitAnswer"] = splitAnswer
                if identifyAnswer:
                    pasta_object["identifyAnswer"] = identifyAnswer

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
        data["mc1Options"] = request.form.getlist("mc1Options") or request.json.get(
            "mc1Options", None
        )
        data["splitQuestionVar"] = getParameter("splitQuestionVar", str, True, "")
        data["identifyQuestionVar"] = getParameter(
            "identifyQuestionVar", str, False, ""
        )
        data["mc2QuestionText"] = getParameter("mc2QuestionText", str, False, "")
        data["mc2Options"] = request.form.getlist("mc2Options") or request.json.get(
            "mc2Options", None
        )
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

            query = "INSERT INTO `question_frame` (`moduleID`, `category`, `mc1QuestionText`, `splitQuestionVar`, `identifyQuestionVar`, `mc2QuestionText`, `displayName`) VALUES (%s, %s, %s, %s, %s, %s, %s)"
            postToDB(
                query,
                (
                    data["moduleID"],
                    data["category"],
                    data["mc1QuestionText"],
                    data["splitQuestionVar"],
                    data["identifyQuestionVar"],
                    data["mc2QuestionText"],
                    data["displayName"],
                ),
                conn,
                cursor,
            )

            query = "SELECT MAX(`qframeID`) FROM `question_frame`"
            result = getFromDB(query, None, conn, cursor)
            question_frame_id = check_max_id(result) - 1

            query = "INSERT INTO `question_option` (`qframeID`, `optionText`, `mcQuestionNumber`) VALUES (%s, %s, %s)"
            if data["mc1Options"]:
                for option in data["mc1Options"]:
                    postToDB(query, (question_frame_id, option, 1), conn, cursor)

            if data["mc2Options"]:
                for option in data["mc2Options"]:
                    postToDB(query, (question_frame_id, option, 2), conn, cursor)

            raise ReturnSuccess(
                {
                    "Message": "Successfully created a question frame",
                    "question_frame": {
                        "qframeID": question_frame_id,
                        "moduleID": data["moduleID"],
                        "category": data["category"],
                        "mc1QuestionText": data["mc1QuestionText"],
                        "splitQuestionVar": data["splitQuestionVar"],
                        "identifyQuestionVar": data["identifyQuestionVar"],
                        "mc2QuestionText": data["mc2QuestionText"],
                        "mc1Options": data["mc1Options"],
                        "mc2Options": data["mc2Options"],
                        "displayName": data["displayName"],
                    },
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
                new_question_frame_object["splitQuestionVar"] = row[4]
                new_question_frame_object["identifyQuestionVar"] = row[5]
                new_question_frame_object["mc2QuestionText"] = row[6]
                new_question_frame_object["displayName"] = row[7]

            query = "SELECT * FROM `question_option` WHERE `qframeID` = %s"
            result = getFromDB(query, data["qframeID"], conn, cursor)
            mc1Options = []
            mc2Options = []
            for row in result:
                if row[3] == 1:
                    mc1Options.append(row[2])
                elif row[3] == 2:
                    mc2Options.append(row[2])

            if mc1Options:
                new_question_frame_object["mc1Options"] = mc1Options
            if mc2Options:
                new_question_frame_object["mc2Options"] = mc2Options

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
        data["mc1Options"] = request.form.getlist("mc1Options") or request.json.get(
            "mc1Options", []
        )
        data["splitQuestionVar"] = getParameter("splitQuestionVar", str, False, "")
        data["identifyQuestionVar"] = getParameter(
            "identifyQuestionVar", str, False, ""
        )
        data["mc2QuestionText"] = getParameter("mc2QuestionText", str, False, "")
        data["mc2Options"] = request.form.getlist("mc2Options") or request.json.get(
            "mc2Options", []
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
                if key == "mc1Options" or key == "mc2Options":
                    continue
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

            query = "DELETE FROM `question_option` WHERE `qframeID` = %s"
            postToDB(query, (data["qframeID"],), conn, cursor)

            query = "INSERT INTO `question_option` (`qframeID`, `optionText`, `mcQuestionNumber`) VALUES (%s, %s, %s)"
            if data["mc1Options"]:
                for option in data["mc1Options"]:
                    postToDB(query, (data["qframeID"], option, 1), conn, cursor)

            if data["mc2Options"]:
                for option in data["mc2Options"]:
                    postToDB(query, (data["qframeID"], option, 2), conn, cursor)

            raise ReturnSuccess(
                {
                    "Message": "Successfully updated the question frame",
                    "question_frame": {
                        "qframeID": data["qframeID"],
                        "moduleID": data["moduleID"],
                        "category": data["category"],
                        "mc1QuestionText": data["mc1QuestionText"],
                        "splitQuestionVar": data["splitQuestionVar"],
                        "identifyQuestionVar": data["identifyQuestionVar"],
                        "mc2QuestionText": data["mc2QuestionText"],
                        "mc1Options": data["mc1Options"],
                        "mc2Options": data["mc2Options"],
                        "displayName": data["displayName"],
                    },
                },
                200,
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

            query = "DELETE FROM `question_option` WHERE `qframeID` = %s"
            postToDB(query, (data["qframeID"],), conn, cursor)

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
                new_question_frame_object["splitQuestionVar"] = row[4]
                new_question_frame_object["identifyQuestionVar"] = row[5]
                new_question_frame_object["mc2QuestionText"] = row[6]
                new_question_frame_object["displayName"] = row[7]
                question_frames.append(new_question_frame_object)

            query = "SELECT * FROM `question_option` WHERE `qframeID` = %s"
            for question_frame in question_frames:
                result = getFromDB(query, question_frame["qframeID"], conn, cursor)
                mc1Options = []
                mc2Options = []
                for row in result:
                    if row[3] == 1:
                        mc1Options.append(row[2])
                    elif row[3] == 2:
                        mc2Options.append(row[2])

                if mc1Options:
                    question_frame["mc1Options"] = mc1Options
                if mc2Options:
                    question_frame["mc2Options"] = mc2Options

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


# Retrieve all question frames and pastas associated with a module
class AllPastaModuleResources(Resource):
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

            # Get all question frames
            query = "SELECT * FROM `question_frame` WHERE `moduleID` = %s"
            result = getFromDB(query, data["moduleID"], conn, cursor)
            question_frames = []
            for row in result:
                new_question_frame_object = {}
                new_question_frame_object["qframeID"] = row[0]
                new_question_frame_object["moduleID"] = row[1]
                new_question_frame_object["category"] = row[2]
                new_question_frame_object["mc1QuestionText"] = row[3]
                new_question_frame_object["splitQuestionVar"] = row[4]
                new_question_frame_object["identifyQuestionVar"] = row[5]
                new_question_frame_object["mc2QuestionText"] = row[6]
                new_question_frame_object["displayName"] = row[7]
                question_frames.append(new_question_frame_object)

            query = "SELECT * FROM `question_option` WHERE `qframeID` = %s"
            for question_frame in question_frames:
                result = getFromDB(query, question_frame["qframeID"], conn, cursor)
                mc1Options = []
                mc2Options = []
                for row in result:
                    if row[3] == 1:
                        mc1Options.append(row[2])
                    elif row[3] == 2:
                        mc2Options.append(row[2])

                if mc1Options:
                    question_frame["mc1Options"] = mc1Options
                if mc2Options:
                    question_frame["mc2Options"] = mc2Options

            # Get all pastas
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
                new_pasta_object["mc2Answer"] = row[5]
                pasta.append(new_pasta_object)

            query = "SELECT * FROM `pasta_answer` WHERE `pastaID` = %s"
            for pasta_object in pasta:
                result = getFromDB(query, pasta_object["pastaID"], conn, cursor)
                splitAnswer = []
                identifyAnswer = []
                for row in result:
                    if row[3] == "split":
                        splitAnswer.append(row[2])
                    elif row[3] == "identify":
                        identifyAnswer.append(row[2])

                if splitAnswer:
                    pasta_object["splitAnswer"] = splitAnswer
                if identifyAnswer:
                    pasta_object["identifyAnswer"] = identifyAnswer

            raise ReturnSuccess(
                {"question_frames": question_frames, "pasta": pasta}, 200
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


class LoggedPasta(Resource):
    @jwt_required
    def post(self):
        data = {}
        data["pastaID"] = getParameter("pastaID", int, True, "")
        data["attempts"] = getParameter("attempts", int, False, "")
        data["attemptsCorrect"] = getParameter("attemptsCorrect", int, False, "")
        data["sessionID"] = getParameter("sessionID", int, True, "")
        data["log_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "INSERT INTO `logged_pasta` (`pastaID`, `attempts`, `attemptsCorrect`, `sessionID`, `log_time`) VALUES (%s, %s, %s, %s, %s)"
            postToDB(
                query,
                (
                    data["pastaID"],
                    data["attempts"],
                    data["attemptsCorrect"],
                    data["sessionID"],
                    data["log_time"],
                ),
                conn,
                cursor,
            )

            raise ReturnSuccess(
                {
                    "Message": "Successfully logged the pasta response",
                    "logged_pasta": {
                        "pastaID": data["pastaID"],
                        "attempts": data["attempts"],
                        "attemptsCorrect": data["attemptsCorrect"],
                        "sessionID": data["sessionID"],
                        "log_time": data["log_time"],
                    },
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
    def get(self):
        data = {}
        data["logID"] = getParameter("logID", int, False, "")
        data["pastaID"] = getParameter("pastaID", int, False, "")
        data["sessionID"] = getParameter("sessionID", int, False, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()
            query = "SELECT * FROM `logged_pasta` WHERE `logID` = %s OR `pastaID` = %s OR `sessionID` = %s"
            result = getFromDB(
                query, (data["logID"], data["pastaID"], data["sessionID"]), conn, cursor
            )
            logged_pasta = []
            for row in result:
                new_logged_pasta_object = {}
                new_logged_pasta_object["logID"] = row[0]
                new_logged_pasta_object["pastaID"] = row[1]
                new_logged_pasta_object["attempts"] = row[2]
                new_logged_pasta_object["attemptsCorrect"] = row[3]
                new_logged_pasta_object["sessionID"] = row[4]
                new_logged_pasta_object["log_time"] = row[5]
                logged_pasta.append(new_logged_pasta_object)

            raise ReturnSuccess(logged_pasta, 200)
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
    def delete(self):
        data = {}
        data["logID"] = getParameter("logID", int, True, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()
            query = "DELETE FROM `logged_pasta` WHERE `logID` = %s"
            postToDB(query, (data["logID"],), conn, cursor)

            raise ReturnSuccess(
                {"Message": "Successfully deleted the logged pasta"}, 200
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
                errorMessage("An error occurred while deleting the logged pasta."),
                500,
            )
        finally:
            if conn.open:
                cursor.close()
                conn.close()


class PastaHighScore(Resource):
    @jwt_required
    def get(self):
        data = {}
        data["userID"] = request.args.get("userID")
        data["moduleID"] = request.args.get("moduleID")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()
            query = """
            SELECT 
                s.sessionID, 
                s.userID,
                s.moduleID,
                MAX(lp.sum_attemptsCorrect) AS highest_sum_attemptsCorrect,
                MAX(lp.sum_attemptsCorrect) / MAX(lp.sum_attempts) AS highest_ratio_attemptsCorrect_to_attempts
            FROM session s
            INNER JOIN (
                SELECT 
                    sessionID, 
                    SUM(attemptsCorrect) AS sum_attemptsCorrect,
                    SUM(attempts) AS sum_attempts
                FROM logged_pasta
                GROUP BY sessionID
            ) AS lp ON s.sessionID = lp.sessionID
            WHERE s.userID = %s
            """

            if data["moduleID"]:
                query += " AND s.moduleID = %s GROUP BY s.sessionID, s.userID;"
                result = getFromDB(
                    query, (data["userID"], data["moduleID"]), conn, cursor
                )
            else:
                query += " GROUP BY s.sessionID, s.userID;"
                result = getFromDB(query, data["userID"], conn, cursor)

            high_scores = []
            for row in result:
                new_high_score_object = {}
                new_high_score_object["sessionID"] = row[0]
                new_high_score_object["userID"] = row[1]
                new_high_score_object["moduleID"] = row[2]
                new_high_score_object["highest_sum_attemptsCorrect"] = row[3]
                new_high_score_object["highest_ratio_attemptsCorrect_to_attempts"] = (
                    row[4]
                )
                high_scores.append(new_high_score_object)

            raise ReturnSuccess(high_scores, 200)
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

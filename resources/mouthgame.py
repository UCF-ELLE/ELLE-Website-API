from flask import request
from flask_restful import Resource
from flask_jwt_extended import (
    jwt_required,
)
from db import mysql
from db_utils import *
from utils import *
from exceptions_util import *


class MouthGameLessonProgress(Resource):
    """
    Per-user lesson progress for the Mouth Game.

    Table: `mouthgame_lesson_progress` (one row per userID x lessonID).
    lessonID values are defined client-side in LessonData.cs:
      1-17    consonant lessons
      18-26   vowel lessons
      99      endless mode (bestScore only)
      101/103 vowel/consonant quiz results
    """

    # returns all lesson progress rows for the current user
    @jwt_required
    def get(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = """
                SELECT `lessonID`, `completed`, `score`, `totalAttempts`, `bestScore`
                FROM `mouthgame_lesson_progress`
                WHERE `userID` = %s
                """
            result = getFromDB(query, user_id, conn, cursor)

            rows = []
            for row in result:
                rows.append(
                    {
                        "lessonID": row[0],
                        "completed": bool(row[1]),
                        "score": row[2],
                        "totalAttempts": row[3],
                        "bestScore": row[4],
                    }
                )

            raise ReturnSuccess(rows, 200)
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

    # upserts one lesson progress row for the current user
    # params: lessonID (req), completed, score, totalAttempts, bestScore (opt)
    @jwt_required
    def post(self):
        data = {}
        data["lessonID"] = getParameter("lessonID", int, True, "")
        data["completed"] = getParameter("completed", str, False, "")
        data["score"] = getParameter("score", int, False, "")
        data["totalAttempts"] = getParameter("totalAttempts", int, False, "")
        data["bestScore"] = getParameter("bestScore", int, False, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if data["completed"] and (
            data["completed"].lower() == "true" or data["completed"] == "1"
        ):
            data["completed"] = 1
        else:
            data["completed"] = 0

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = """
                INSERT INTO `mouthgame_lesson_progress`
                    (`userID`, `lessonID`, `completed`, `score`, `totalAttempts`, `bestScore`)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    `completed` = GREATEST(`completed`, VALUES(`completed`)),
                    `score` = VALUES(`score`),
                    `totalAttempts` = GREATEST(`totalAttempts`, VALUES(`totalAttempts`)),
                    `bestScore` = GREATEST(`bestScore`, VALUES(`bestScore`))
                """
            postToDB(
                query,
                (
                    user_id,
                    data["lessonID"],
                    data["completed"],
                    data["score"] if data["score"] is not None else 0,
                    data["totalAttempts"]
                    if data["totalAttempts"] is not None
                    else 0,
                    data["bestScore"] if data["bestScore"] is not None else 0,
                ),
                conn,
                cursor,
            )

            raise ReturnSuccess(
                {
                    "Message": "Successfully saved lesson progress",
                    "lessonID": data["lessonID"],
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
            return errorMessage(str(error)), 500
        finally:
            if conn.open:
                cursor.close()
                conn.close()

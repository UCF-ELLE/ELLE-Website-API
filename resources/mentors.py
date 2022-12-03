from flask_restful import Resource
from utils import *
from exceptions_util import *

#saves the user's preferred mentor
class MentorPreference(Resource):
    def post(self):
        data = {}
        data['mentor_name'] = getParameter("mentor_name", str, True, "")
        data['user_id'] = getParameter("user_id", str, True, "")

        # permission, user_id = validate_permissions()
        # if not permission or not user_id:
        #     return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            updated = store_mentor_preference(data['user_id'], data['mentor_name'], conn, cursor)

            if updated:
                raise ReturnSuccess('Mentor preference updated.', 200)
            else:
                raise ReturnSuccess('Mentor preference created.', 201)
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

    def get(self):
        # data = {}
        # data['user_id'] = getParameter("user_id", str, True, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:

            conn = mysql.connect()
            cursor = conn.cursor()

            mentorPreference = get_mentor_preference(user_id, conn, cursor)

            raise ReturnSuccess(mentorPreference[0], 200)

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
            if (conn.open):
                cursor.close()
                conn.close()

#store mentor answers
class StudentResponses(Resource):
    def post(self):
        data = {}
        data['response'] = getParameter("response", str, True, "")
        data['user_id'] = getParameter("user_id", str, True, "")
        data['question_id'] = getParameter("question_id", str, True, "")

        # permission, user_id = validate_permissions()
        # if not permission or not user_id:
        #     return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            updated = store_student_response(data['user_id'], data['question_id'], data['response'], conn, cursor)

            if updated:
                raise ReturnSuccess('Student response updated for question %s.' % data['question_id'], 200)
            else:
                raise ReturnSuccess('Student response created for question %s.' % data['question_id'], 201)
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

    def get(self):
        data = {}
        data['user_id'] = getParameter("question_id", str, True, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:

            conn = mysql.connect()
            cursor = conn.cursor()

            studentResponse = get_student_response(user_id, data['question_id'], conn, cursor)

            raise ReturnSuccess(studentResponse[0], 200)

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
            if (conn.open):
                cursor.close()
                conn.close()

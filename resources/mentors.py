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
        data = {}
        data['user_id'] = getParameter("user_id", str, True, "")

        # permission, user_id = validate_permissions()
        # if not permission or not user_id:
        #     return errorMessage("Invalid user"), 401

        try:

            conn = mysql.connect()
            cursor = conn.cursor()

            mentorPreference = get_mentor_preference(data['user_id'], conn, cursor)

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

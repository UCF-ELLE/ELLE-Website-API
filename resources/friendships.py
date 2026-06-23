from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required
from db import mysql
from db_utils import *
from utils import *
from exceptions_util import *

class Friendship(Resource):
    @jwt_required
    def get(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = """
                SELECT f.friendship_id, f.requester_id, f.addressee_id, f.status,
                       u_req.username AS req_name, 
                       u_req.virtuelle_level AS req_v_lvl, u_req.belletro_level AS req_b_lvl,
                       u_add.username AS add_name, 
                       u_add.virtuelle_level AS add_v_lvl, u_add.belletro_level AS add_b_lvl
                FROM friendships f
                JOIN user u_req ON f.requester_id = u_req.userID
                JOIN user u_add ON f.addressee_id = u_add.userID
                WHERE (f.requester_id = %s OR f.addressee_id = %s)
            """
            results = getFromDB(query, (user_id, user_id), conn, cursor)

            friendship_list = []

            if results:
                for row in results:
                    f_id, req_id, add_id, status, req_name, req_v_lvl, req_b_lvl, add_name, add_v_lvl, add_b_lvl = row
                    
                    v_lvl = None
                    b_lvl = None

                    if status == 'Accepted':
                        relationship_type = "friend"
                        if req_id == user_id:
                            other_user = add_name
                            v_lvl = add_v_lvl
                            b_lvl = add_b_lvl
                        else:
                            other_user = req_name
                            v_lvl = req_v_lvl
                            b_lvl = req_b_lvl
                        
                    elif status == 'Pending':
                        if req_id == user_id:
                            other_user = add_name
                            relationship_type = "request_sent"
                        else:
                            other_user = req_name
                            relationship_type = "request_received"
                            
                    elif status == 'Declined':
                        if add_id == user_id:
                            other_user = req_name
                            relationship_type = "ignored_user" 
                        else:
                            other_user = add_name
                            relationship_type = "ignored_by_user"
                    
                    friend_data = {
                        "friendshipID": f_id,
                        "username": other_user,
                        "status": status,
                        "type": relationship_type
                    }

                    if status == 'Accepted':
                        friend_data["virtuelle_level"] = v_lvl
                        friend_data["belletro_level"] = b_lvl

                    friendship_list.append(friend_data)

            raise ReturnSuccess(friendship_list, 200)

        except CustomException as error:
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            return success.msg, success.returnCode
        except Exception as error:
            return errorMessage(str(error)), 500
        finally:
            if conn.open:
                cursor.close()
                conn.close()

    @jwt_required
    def post(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        target_username = getParameter("target_username", str, True)
        action = getParameter("action", str, True) 

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            id_query = "SELECT userID FROM user WHERE username = %s"
            target_res = getFromDB(id_query, (target_username,), conn, cursor)
            
            if not target_res or not target_res[0]:
                raise CustomException("Target user not found", 404)
            
            target_id = target_res[0][0]

            if user_id == target_id:
                raise CustomException("You cannot befriend yourself", 400)

            check_query = """SELECT friendship_id, requester_id, addressee_id, status 
                             FROM friendships 
                             WHERE (requester_id = %s AND addressee_id = %s) 
                             OR (requester_id = %s AND addressee_id = %s)"""
            params = (user_id, target_id, target_id, user_id)
            existing = getFromDB(check_query, params, conn, cursor)

            if action == "send":
                if not existing:
                    insert_query = "INSERT INTO friendships (requester_id, addressee_id, status) VALUES (%s, %s, 'Pending')"
                    postToDB(insert_query, (user_id, target_id), conn, cursor)
                    raise ReturnSuccess("Friend request sent", 201)
                
                f_id, req_id, add_id, status = existing[0]

                if status == 'Accepted':
                    raise ReturnSuccess("You are already friends", 200)
                
                if status == 'Pending':
                    if add_id == user_id:
                        update_query = "UPDATE friendships SET status = 'Accepted' WHERE friendship_id = %s"
                        postToDB(update_query, (f_id,), conn, cursor)
                        raise ReturnSuccess("Friend request accepted", 200)
                    else:
                        raise ReturnSuccess("Friend request is already pending", 200)

                if status == 'Declined':
                    if req_id == user_id:
                        raise CustomException("This user has declined your requests", 403)
                    else:
                        update_query = "UPDATE friendships SET requester_id = %s, addressee_id = %s, status = 'Pending' WHERE friendship_id = %s"
                        postToDB(update_query, (user_id, target_id, f_id), conn, cursor)
                        raise ReturnSuccess("Friend request re-sent", 200)

            elif action == "decline":
                if not existing:
                    raise CustomException("No friendship record found", 404)

                f_id, req_id, add_id, status = existing[0]

                update_query = "UPDATE friendships SET requester_id = %s, addressee_id = %s, status = 'Declined' WHERE friendship_id = %s"
                postToDB(update_query, (target_id, user_id, f_id), conn, cursor)
                raise ReturnSuccess("Friendship declined/ignored", 200)

            else:
                raise CustomException("Invalid action provided", 400)

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
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        target_username = getParameter("target_username", str, True)

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            id_query = "SELECT userID FROM user WHERE username = %s"
            target_res = getFromDB(id_query, (target_username,), conn, cursor)
            if not target_res:
                raise CustomException("Target user not found", 404)
            target_id = target_res[0][0]

            delete_query = """DELETE FROM friendships 
                              WHERE (requester_id = %s AND addressee_id = %s) 
                              OR (requester_id = %s AND addressee_id = %s)"""
            postToDB(delete_query, (user_id, target_id, target_id, user_id), conn, cursor)
            
            raise ReturnSuccess("Friendship record permanently removed", 200)

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
    
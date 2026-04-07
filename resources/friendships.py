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
        # 1. Identify the user from the JWT
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            # 2. Query for all non-declined friendships involving this user
            query = """
                SELECT f.friendship_id, f.requester_id, f.addressee_id, f.status,
                       u_req.username AS requester_name, 
                       u_add.username AS addressee_name
                FROM friendships f
                JOIN user u_req ON f.requester_id = u_req.userID
                JOIN user u_add ON f.addressee_id = u_add.userID
                WHERE (f.requester_id = %s OR f.addressee_id = %s)
                AND f.status != 'Declined'
            """
            results = getFromDB(query, (user_id, user_id), conn, cursor)

            friendship_list = []

            if results:
                for row in results:
                    f_id, req_id, add_id, status, req_name, add_name = row
                    
                    # Determine the "other" person's info and the relationship type
                    if status == 'Accepted':
                        other_user = add_name if req_id == user_id else req_name
                        relationship_type = "friend"
                    elif status == 'Pending':
                        if req_id == user_id:
                            other_user = add_name
                            relationship_type = "request_sent"
                        else:
                            other_user = req_name
                            relationship_type = "request_received"
                    
                    friendship_list.append({
                        "friendshipID": f_id,
                        "username": other_user,
                        "status": status,
                        "type": relationship_type
                    })

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
        # 1. Identify the Requester via JWT
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        # 2. Extract parameters from the JSON body
        target_username = getParameter("target_username", str, True)
        action = getParameter("action", str, True) # Expected: "send" or "delete"

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            # 3. Lookup the Target ID from the provided username
            id_query = "SELECT userID FROM user WHERE username = %s"
            target_res = getFromDB(id_query, (target_username,), conn, cursor)
            
            if not target_res or not target_res[0]:
                raise CustomException("Target user not found", 404)
            
            target_id = target_res[0][0]

            if user_id == target_id:
                raise CustomException("You cannot befriend yourself", 400)

            # 4. Check for an existing relationship record between these two users
            check_query = """SELECT friendship_id, requester_id, addressee_id, status 
                             FROM friendships 
                             WHERE (requester_id = %s AND addressee_id = %s) 
                             OR (requester_id = %s AND addressee_id = %s)"""
            params = (user_id, target_id, target_id, user_id)
            existing = getFromDB(check_query, params, conn, cursor)

            # --- CASE: SEND OR ACCEPT ---
            if action == "send":
                if not existing:
                    # Create a new 'Pending' request row
                    insert_query = "INSERT INTO friendships (requester_id, addressee_id, status) VALUES (%s, %s, 'Pending')"
                    postToDB(insert_query, (user_id, target_id), conn, cursor)
                    raise ReturnSuccess("Friend request sent", 201)
                
                f_id, req_id, add_id, status = existing[0]

                if status == 'Accepted':
                    raise ReturnSuccess("You are already friends", 200)
                
                if status == 'Pending':
                    if add_id == user_id:
                        # Current user is the receiver -> Accept the request
                        update_query = "UPDATE friendships SET status = 'Accepted' WHERE friendship_id = %s"
                        postToDB(update_query, (f_id,), conn, cursor)
                        raise ReturnSuccess("Friend request accepted", 200)
                    else:
                        raise ReturnSuccess("Friend request is already pending", 200)

                if status == 'Declined':
                    if req_id == user_id:
                        # User previously declined (or was the rescinder); they can re-send the request
                        update_query = "UPDATE friendships SET requester_id = %s, addressee_id = %s, status = 'Pending' WHERE friendship_id = %s"
                        postToDB(update_query, (user_id, target_id, f_id), conn, cursor)
                        raise ReturnSuccess("Friend request re-sent", 200)
                    else:
                        # The target user declined this user previously; original sender cannot force a new request
                        raise CustomException("This user has declined your requests", 403)

            # --- CASE: DELETE OR RESCIND ---
            elif action == "delete":
                if not existing:
                    raise CustomException("No friendship record found", 404)

                f_id, req_id, add_id, status = existing[0]

                # Role Swap Logic: The person rescinding becomes the 'requester' of the 'Declined' status
                # This ensures the other person cannot send a request to them until the rescinder decides otherwise.
                update_query = "UPDATE friendships SET requester_id = %s, addressee_id = %s, status = 'Declined' WHERE friendship_id = %s"
                postToDB(update_query, (user_id, target_id, f_id), conn, cursor)
                raise ReturnSuccess("Friendship rescinded/declined", 200)

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
                
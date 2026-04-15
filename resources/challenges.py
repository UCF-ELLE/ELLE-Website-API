from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required
from db import mysql
from db_utils import *
from utils import *
from exceptions_util import *
from datetime import datetime, timezone, timedelta

class Challenges(Resource):
    
    def _handle_expiration(self, challenge, conn, cursor):
        c_id, s_id, r_id, status, s_score, r_score, end_time = challenge
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        if end_time > now:
            return challenge

        if status == 'pending':
            delete_query = "DELETE FROM challenges WHERE challenge_id = %s"
            postToDB(delete_query, (c_id,), conn, cursor)
            return None 

        if status == 'active':
            winner_id = None
            if s_score > r_score:
                winner_id = s_id
            elif r_score > s_score:
                winner_id = r_id

            update_query = """
                UPDATE challenges 
                SET status = 'complete_unviewed', winner_id = %s 
                WHERE challenge_id = %s
            """
            postToDB(update_query, (winner_id, c_id), conn, cursor)
            return (c_id, s_id, r_id, 'complete_unviewed', s_score, r_score, end_time)
            
        return challenge

    def _expire_stale_challenges(self, user_id, conn, cursor):
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        
        delete_query = """
            DELETE FROM challenges 
            WHERE status = 'pending' AND end_time <= %s 
              AND (sender_id = %s OR receiver_id = %s)
        """
        postToDB(delete_query, (now, user_id, user_id), conn, cursor)

        expire_query = """
            UPDATE challenges 
            SET status = 'complete_unviewed',
                winner_id = CASE 
                    WHEN sender_score > receiver_score THEN sender_id 
                    WHEN receiver_score > sender_score THEN receiver_id 
                    ELSE NULL 
                END
            WHERE status = 'active' AND end_time <= %s 
              AND (sender_id = %s OR receiver_id = %s)
        """
        postToDB(expire_query, (now, user_id, user_id), conn, cursor)

    @jwt_required
    def get(self):
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

            query = """
                SELECT challenge_id, sender_id, receiver_id, status, 
                    sender_score, receiver_score, end_time, 
                    game_type, challenge_type, winner_id
                FROM challenges
                WHERE (sender_id = %s AND receiver_id = %s)
                OR (sender_id = %s AND receiver_id = %s)
                ORDER BY end_time DESC
            """
            rows = getFromDB(query, (user_id, target_id, target_id, user_id), conn, cursor)
            
            challenge_list = []
            if rows:
                for row in rows:
                    c_id, s_id, r_id, status, s_score, r_score, end_time, g_type, c_type, w_id = row
                    
                    processed = self._handle_expiration(
                        (c_id, s_id, r_id, status, s_score, r_score, end_time), conn, cursor
                    )
                    
                    if processed is None: continue 
                    
                    _, _, _, new_status, _, _, _ = processed
                    
                    challenge_list.append({
                        "challengeID": c_id, "senderID": s_id, "receiverID": r_id,
                        "status": new_status, "senderScore": s_score, "receiverScore": r_score,
                        "endTime": end_time.isoformat(), "gameType": g_type, 
                        "challengeType": c_type, "winnerID": w_id
                    })

            conn.commit()
            raise ReturnSuccess(challenge_list, 200)
        except CustomException as e: return e.msg, e.returnCode
        except ReturnSuccess as s: return s.msg, s.returnCode
        except Exception as e: return errorMessage(str(e)), 500
        finally:
            if conn.open: cursor.close(); conn.close()

    @jwt_required
    def post(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id: return errorMessage("Invalid user"), 401
        
        action = getParameter("action", str, True)

        try:
            conn = mysql.connect()
            cursor = conn.cursor()
            self._expire_stale_challenges(user_id, conn, cursor)

            if action == "send":
                self._send_challenge(user_id, conn, cursor)
                success_msg = "Challenge request sent successfully"
            elif action == "accept":
                self._accept_challenge(user_id, conn, cursor)
                success_msg = "Challenge accepted and is now active"
            elif action == "update_score":
                self._update_scores(user_id, conn, cursor)
                success_msg = "Scores updated across all active challenges"
            elif action == "view_results": 
                self._view_results(user_id, conn, cursor)
                success_msg = "Challenge marked as viewed"
            else:
                raise CustomException("Invalid action provided", 400)

            conn.commit()
            raise ReturnSuccess(success_msg, 200)
        except CustomException as e: conn.rollback(); return e.msg, e.returnCode
        except ReturnSuccess as s: return s.msg, s.returnCode
        except Exception as e: conn.rollback(); return errorMessage(str(e)), 500
        finally:
            if conn.open: cursor.close(); conn.close()

    def _send_challenge(self, user_id, conn, cursor):
        target_username = getParameter("target_username", str, True)
        duration_hours = getParameter("duration_hours", int, True)
        challenge_type = getParameter("challenge_type", str, True)
        game_type = getParameter("game_type", str, True)

        id_query = "SELECT userID FROM user WHERE username = %s"
        target_res = getFromDB(id_query, (target_username,), conn, cursor)
        if not target_res: raise CustomException("Target user not found", 404)
        target_id = target_res[0][0]

        friend_query = "SELECT status FROM friendships WHERE (requester_id = %s AND addressee_id = %s) OR (requester_id = %s AND addressee_id = %s)"
        friend_status = getFromDB(friend_query, (user_id, target_id, target_id, user_id), conn, cursor)
        if not friend_status or friend_status[0][0] != 'Accepted':
            raise CustomException("You can only challenge friends", 403)

        pending_check = "SELECT 1 FROM challenges WHERE sender_id = %s AND receiver_id = %s AND status = 'pending'"
        if getFromDB(pending_check, (user_id, target_id), conn, cursor):
            raise CustomException("You already have a pending challenge request to this user", 409)

        end_time = (datetime.now(timezone.utc) + timedelta(hours=duration_hours)).replace(tzinfo=None)
        insert_query = "INSERT INTO challenges (sender_id, receiver_id, game_type, challenge_type, status, end_time) VALUES (%s, %s, %s, %s, 'pending', %s)"
        postToDB(insert_query, (user_id, target_id, game_type, challenge_type, end_time), conn, cursor)

    def _accept_challenge(self, user_id, conn, cursor):
        challenge_id = getParameter("challenge_id", int, True)
        update_query = "UPDATE challenges SET status = 'active' WHERE challenge_id = %s AND receiver_id = %s AND status = 'pending'"
        if postToDB(update_query, (challenge_id, user_id), conn, cursor) == 0:
            raise CustomException("Challenge not found or already processed", 404)

    def _update_scores(self, user_id, conn, cursor):
        game_type = getParameter("game_type", str, True)
        new_score = getParameter("score", int, True)

        update_logic = """
            SET %s = CASE 
                WHEN challenge_type = 'cumulative' THEN %s + %%s
                WHEN challenge_type = 'high score' THEN GREATEST(%s, %%s)
                WHEN challenge_type = 'duel' AND %s = -1 THEN %%s
                ELSE %s END
        """
        postToDB(f"UPDATE challenges {update_logic % ('sender_score', 'sender_score', 'sender_score', 'sender_score', 'sender_score')} WHERE sender_id = %s AND game_type = %s AND status = 'active'", (new_score, new_score, new_score, user_id, game_type), conn, cursor)
        postToDB(f"UPDATE challenges {update_logic % ('receiver_score', 'receiver_score', 'receiver_score', 'receiver_score', 'receiver_score')} WHERE receiver_id = %s AND game_type = %s AND status = 'active'", (new_score, new_score, new_score, user_id, game_type), conn, cursor)

        completion_query = "UPDATE challenges SET status = 'complete_unviewed', winner_id = CASE WHEN sender_score > receiver_score THEN sender_id WHEN receiver_score > sender_score THEN receiver_id ELSE NULL END WHERE status = 'active' AND challenge_type = 'duel' AND sender_score != -1 AND receiver_score != -1"
        postToDB(completion_query, (), conn, cursor)

    def _view_results(self, user_id, conn, cursor):
        c_id = getParameter("challenge_id", int, True)
        query = "SELECT status, sender_id, receiver_id FROM challenges WHERE challenge_id = %s"
        res = getFromDB(query, (c_id,), conn, cursor)
        if not res: raise CustomException("Challenge not found", 404)
        status, s_id, r_id = res[0]

        new_status = status
        if user_id == s_id: 
            if status == 'complete_unviewed': new_status = 'complete_sender'
            elif status == 'complete_receiver': new_status = 'complete'
        elif user_id == r_id: 
            if status == 'complete_unviewed': new_status = 'complete_receiver'
            elif status == 'complete_sender': new_status = 'complete'
        
        if new_status != status:
            postToDB("UPDATE challenges SET status = %s WHERE challenge_id = %s", (new_status, c_id), conn, cursor)

    @jwt_required
    def put(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id: return errorMessage("Invalid user"), 401
        challenge_id = getParameter("challenge_id", int, True)

        try:
            conn = mysql.connect()
            cursor = conn.cursor()
            delete_query = "DELETE FROM challenges WHERE challenge_id = %s AND (sender_id = %s OR receiver_id = %s)"
            if postToDB(delete_query, (challenge_id, user_id, user_id), conn, cursor) == 0:
                raise CustomException("Challenge not found or permission denied", 404)
            conn.commit()
            raise ReturnSuccess("Challenge record permanently removed", 200)
        except CustomException as e: conn.rollback(); return e.msg, e.returnCode
        except ReturnSuccess as s: return s.msg, s.returnCode
        except Exception as e: conn.rollback(); return errorMessage(str(e)), 500
        finally:
            if conn.open: cursor.close(); conn.close()

            
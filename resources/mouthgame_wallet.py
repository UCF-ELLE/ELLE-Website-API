from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required
from db import mysql
from db_utils import getFromDB
from utils import validate_permissions
import datetime
import uuid

REWARD = 100
MOUTH_MODULE_ID = 66

def _user():
    permission, user_id = validate_permissions()
    return user_id if permission and user_id else None

def _snapshot(user_id, conn, cursor):
    getFromDB("INSERT IGNORE INTO mouth_game_wallet (userID, balance) VALUES (%s, 0)", (user_id,), conn, cursor)
    balance = getFromDB("SELECT balance FROM mouth_game_wallet WHERE userID=%s", (user_id,), conn, cursor)[0][0]
    owned = getFromDB("SELECT item.name FROM user_item JOIN item ON item.itemID=user_item.itemID WHERE user_item.userID=%s AND user_item.game='mouthgame' AND item.game='mouthgame'", (user_id,), conn, cursor)
    return {"success": True, "balance": int(balance), "awarded": 0, "userItemID": 0, "ownedItems": [str(x[0]) for x in owned]}

class MouthGameWallet(Resource):
    @jwt_required
    def get(self):
        user_id = _user()
        if not user_id: return {"success": False, "message": "Invalid user"}, 401
        conn = mysql.connect()
        cursor = conn.cursor()
        try:
            result = _snapshot(user_id, conn, cursor)
            conn.commit()
            return result, 200
        except Exception as e:
            conn.rollback()
            return {"success": False, "message": str(e)}, 500
        finally:
            cursor.close()
            conn.close()

class MouthGameWalletAnswer(Resource):
    @jwt_required
    def post(self):
        user_id = _user()
        if not user_id: return {"success": False, "message": "Invalid user"}, 401
        data = request.get_json(silent=True) or request.form
        conn = mysql.connect()
        cursor = conn.cursor()
        try:
            sid, qid, tid = int(data["sessionID"]), int(data["questionID"]), int(data["termID"])
            event = str(data.get("eventID") or uuid.uuid4())
            correct = str(data.get("correct", "")).lower() in ("true", "1")
            session = getFromDB("SELECT userID,moduleID FROM session WHERE sessionID=%s FOR UPDATE", (sid,), conn, cursor)
            if not session or int(session[0][0]) != int(user_id) or int(session[0][1]) != MOUTH_MODULE_ID:
                conn.rollback()
                return {"success": False, "message": "Invalid mouth-game session"}, 403
            prior = getFromDB("SELECT amount,balanceAfter FROM mouth_game_wallet_transaction WHERE userID=%s AND eventID=%s", (user_id,event), conn,cursor)
            if prior:
                result = _snapshot(user_id,conn,cursor)
                result["awarded"], result["balance"] = int(prior[0][0]), int(prior[0][1])
                conn.commit()
                return result, 200
            awarded = REWARD if correct else 0
            getFromDB("INSERT IGNORE INTO mouth_game_wallet (userID,balance) VALUES (%s,0)", (user_id,),conn,cursor)
            getFromDB("UPDATE mouth_game_wallet SET balance=balance+%s WHERE userID=%s",(awarded,user_id),conn,cursor)
            balance = int(getFromDB("SELECT balance FROM mouth_game_wallet WHERE userID=%s",(user_id,),conn,cursor)[0][0])
            getFromDB("INSERT INTO logged_answer (questionID,termID,sessionID,correct,mode,log_time) VALUES (%s,%s,%s,%s,'mouth',%s)",(qid,tid,sid,int(correct),datetime.datetime.now().strftime("%H:%M")),conn,cursor)
            getFromDB("INSERT INTO mouth_game_wallet_transaction (userID,eventID,transactionType,amount,balanceAfter,sourceSessionID) VALUES (%s,%s,'answer',%s,%s,%s)",(user_id,event,awarded,balance,sid),conn,cursor)
            result = _snapshot(user_id,conn,cursor)
            result["balance"], result["awarded"] = balance, awarded
            conn.commit()
            return result, 200
        except (ValueError, KeyError, TypeError) as e:
            conn.rollback()
            return {"success": False, "message": str(e)}, 400
        except Exception as e:
            conn.rollback()
            return {"success": False, "message": str(e)}, 500
        finally:
            cursor.close()
            conn.close()

class MouthGameWalletPurchase(Resource):
    @jwt_required
    def post(self):
        user_id = _user()
        if not user_id: return {"success": False, "message": "Invalid user"}, 401
        data = request.get_json(silent=True) or request.form
        conn = mysql.connect()
        cursor = conn.cursor()
        try:
            event = str(data.get("requestID") or uuid.uuid4())
            if data.get("itemID"):
                products = getFromDB("SELECT itemID,points FROM item WHERE itemID=%s AND game='mouthgame'",(data["itemID"],),conn,cursor)
            else:
                products = getFromDB("SELECT itemID,points FROM item WHERE name=%s AND game='mouthgame'",(data.get("itemName"),),conn,cursor)
            if not products:
                conn.rollback()
                return {"success": False, "message": "Mouth-game item not found"}, 404
            item_id, price = int(products[0][0]), int(products[0][1] or 0)
            prior = getFromDB("SELECT balanceAfter FROM mouth_game_wallet_transaction WHERE userID=%s AND eventID=%s",(user_id,event),conn,cursor)
            if prior:
                result = _snapshot(user_id,conn,cursor)
                result["balance"] = int(prior[0][0])
                conn.commit()
                return result, 200
            owned = getFromDB("SELECT userItemID FROM user_item WHERE userID=%s AND itemID=%s AND game='mouthgame'",(user_id,item_id),conn,cursor)
            if owned:
                conn.rollback()
                return {"success": False, "message": "Item already owned"}, 409
            getFromDB("INSERT IGNORE INTO mouth_game_wallet (userID,balance) VALUES (%s,0)",(user_id,),conn,cursor)
            wallet = getFromDB("SELECT balance FROM mouth_game_wallet WHERE userID=%s FOR UPDATE",(user_id,),conn,cursor)
            if int(wallet[0][0]) < price:
                conn.rollback()
                return {"success": False, "message": "Insufficient mouth-game credits"}, 409
            getFromDB("INSERT INTO user_item (userID,itemID,timeOfPurchase,game,isWearing,color) VALUES (%s,%s,%s,'mouthgame',0,'')",(user_id,item_id,datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")),conn,cursor)
            user_item_id = cursor.lastrowid
            balance = int(wallet[0][0])-price
            getFromDB("UPDATE mouth_game_wallet SET balance=%s WHERE userID=%s",(balance,user_id),conn,cursor)
            getFromDB("INSERT INTO mouth_game_wallet_transaction (userID,eventID,transactionType,amount,balanceAfter) VALUES (%s,%s,'purchase',%s,%s)",(user_id,event,-price,balance),conn,cursor)
            result = _snapshot(user_id,conn,cursor)
            result["balance"], result["userItemID"] = balance, int(user_item_id)
            conn.commit()
            return result, 201
        except (ValueError, KeyError, TypeError) as e:
            conn.rollback()
            return {"success": False, "message": str(e)}, 400
        except Exception as e:
            conn.rollback()
            return {"success": False, "message": str(e)}, 500
        finally:
            cursor.close()
            conn.close()


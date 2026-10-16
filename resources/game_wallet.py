from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required
from db import mysql
from db_utils import getFromDB
from utils import validate_permissions
import datetime
import uuid


def _user_id():
    permission, user_id = validate_permissions()
    return user_id if permission and user_id else None


def _game(payload=None):
    payload = payload or {}
    game = payload.get("game") or request.args.get("game")
    if not isinstance(game, str):
        return None
    game = game.strip().lower()
    return game if game and len(game) <= 64 else None


def _request_id(payload):
    value = payload.get("requestID") or payload.get("eventID")
    value = str(value or uuid.uuid4())
    return value if len(value) <= 64 else None


def _ensure_wallet(user_id, game, conn, cursor):
    getFromDB(
        "INSERT IGNORE INTO game_wallet (userID, game, balance) VALUES (%s, %s, 0)",
        (user_id, game), conn, cursor,
    )


def _snapshot(user_id, game, conn, cursor):
    _ensure_wallet(user_id, game, conn, cursor)
    balance = getFromDB(
        "SELECT balance FROM game_wallet WHERE userID=%s AND game=%s",
        (user_id, game), conn, cursor,
    )[0][0]
    owned = getFromDB(
        "SELECT item.name FROM user_item JOIN item ON item.itemID=user_item.itemID "
        "WHERE user_item.userID=%s AND user_item.game=%s AND item.game=%s",
        (user_id, game, game), conn, cursor,
    )
    return {
        "success": True,
        "game": game,
        "balance": int(balance),
        "ownedItems": [str(row[0]) for row in owned],
    }


def _existing_transaction(user_id, game, request_id, conn, cursor):
    rows = getFromDB(
        "SELECT transactionType, amount, balanceAfter, itemID "
        "FROM game_wallet_transaction WHERE userID=%s AND game=%s AND eventID=%s",
        (user_id, game, request_id), conn, cursor,
    )
    return rows[0] if rows else None


class GameWallet(Resource):
    @jwt_required
    def get(self):
        user_id = _user_id()
        game = _game()
        if not user_id:
            return {"success": False, "message": "Invalid user"}, 401
        if not game:
            return {"success": False, "message": "A game value is required"}, 400

        conn = mysql.connect()
        cursor = conn.cursor()
        try:
            result = _snapshot(user_id, game, conn, cursor)
            conn.commit()
            return result, 200
        except Exception as error:
            conn.rollback()
            return {"success": False, "message": str(error)}, 500
        finally:
            cursor.close()
            conn.close()


class GameWalletReward(Resource):
    @jwt_required
    def post(self):
        user_id = _user_id()
        data = request.get_json(silent=True) or request.form
        game = _game(data)
        if not user_id:
            return {"success": False, "message": "Invalid user"}, 401
        if not game:
            return {"success": False, "message": "A game value is required"}, 400
        try:
            amount = int(data["amount"])
            if amount < 0:
                raise ValueError("Reward amount must be nonnegative")
        except (KeyError, TypeError, ValueError) as error:
            return {"success": False, "message": str(error)}, 400

        request_id = _request_id(data)
        if not request_id:
            return {"success": False, "message": "requestID/eventID must be 64 characters or fewer"}, 400

        conn = mysql.connect()
        cursor = conn.cursor()
        try:
            _ensure_wallet(user_id, game, conn, cursor)
            wallet = getFromDB(
                "SELECT balance FROM game_wallet WHERE userID=%s AND game=%s FOR UPDATE",
                (user_id, game), conn, cursor,
            )
            prior = _existing_transaction(user_id, game, request_id, conn, cursor)
            if prior:
                if prior[0] != "reward":
                    conn.rollback()
                    return {"success": False, "message": "requestID was already used for another transaction"}, 409
                result = _snapshot(user_id, game, conn, cursor)
                result["awarded"] = int(prior[1])
                result["duplicate"] = True
                conn.commit()
                return result, 200

            balance = int(wallet[0][0]) + amount
            getFromDB(
                "UPDATE game_wallet SET balance=%s WHERE userID=%s AND game=%s",
                (balance, user_id, game), conn, cursor,
            )
            source = data.get("sourceReference")
            getFromDB(
                "INSERT INTO game_wallet_transaction "
                "(userID, game, eventID, transactionType, amount, balanceAfter, sourceReference) "
                "VALUES (%s, %s, %s, 'reward', %s, %s, %s)",
                (user_id, game, request_id, amount, balance, source), conn, cursor,
            )
            result = _snapshot(user_id, game, conn, cursor)
            result["awarded"] = amount
            result["duplicate"] = False
            conn.commit()
            return result, 200
        except Exception as error:
            conn.rollback()
            return {"success": False, "message": str(error)}, 500
        finally:
            cursor.close()
            conn.close()


class GameWalletPurchase(Resource):
    @jwt_required
    def post(self):
        user_id = _user_id()
        data = request.get_json(silent=True) or request.form
        game = _game(data)
        if not user_id:
            return {"success": False, "message": "Invalid user"}, 401
        if not game:
            return {"success": False, "message": "A game value is required"}, 400
        request_id = _request_id(data)
        if not request_id:
            return {"success": False, "message": "requestID/eventID must be 64 characters or fewer"}, 400
        if not data.get("itemID") and not data.get("itemName"):
            return {"success": False, "message": "itemID or itemName is required"}, 400

        conn = mysql.connect()
        cursor = conn.cursor()
        try:
            _ensure_wallet(user_id, game, conn, cursor)
            wallet = getFromDB(
                "SELECT balance FROM game_wallet WHERE userID=%s AND game=%s FOR UPDATE",
                (user_id, game), conn, cursor,
            )
            prior = _existing_transaction(user_id, game, request_id, conn, cursor)
            if prior:
                if prior[0] != "purchase":
                    conn.rollback()
                    return {"success": False, "message": "requestID was already used for another transaction"}, 409
                result = _snapshot(user_id, game, conn, cursor)
                owned = getFromDB(
                    "SELECT userItemID FROM user_item WHERE userID=%s AND itemID=%s AND game=%s",
                    (user_id, int(prior[3]), game), conn, cursor,
                )
                result["userItemID"] = int(owned[0][0]) if owned else 0
                result["duplicate"] = True
                conn.commit()
                return result, 200

            if data.get("itemID"):
                products = getFromDB(
                    "SELECT itemID, points FROM item WHERE itemID=%s AND game=%s",
                    (data["itemID"], game), conn, cursor,
                )
            else:
                products = getFromDB(
                    "SELECT itemID, points FROM item WHERE name=%s AND game=%s",
                    (data["itemName"], game), conn, cursor,
                )
            if not products:
                conn.rollback()
                return {"success": False, "message": "Game item not found"}, 404

            item_id, price = int(products[0][0]), max(0, int(products[0][1] or 0))
            owned = getFromDB(
                "SELECT userItemID FROM user_item WHERE userID=%s AND itemID=%s AND game=%s",
                (user_id, item_id, game), conn, cursor,
            )
            if owned:
                conn.rollback()
                return {"success": False, "message": "Item already owned"}, 409

            current_balance = int(wallet[0][0])
            if current_balance < price:
                conn.rollback()
                return {"success": False, "message": "Insufficient game credits"}, 409

            getFromDB(
                "INSERT INTO user_item (userID, itemID, timeOfPurchase, game, isWearing, color) "
                "VALUES (%s, %s, %s, %s, 0, '')",
                (user_id, item_id, datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), game),
                conn, cursor,
            )
            user_item_id = int(cursor.lastrowid)
            balance = current_balance - price
            getFromDB(
                "UPDATE game_wallet SET balance=%s WHERE userID=%s AND game=%s",
                (balance, user_id, game), conn, cursor,
            )
            getFromDB(
                "INSERT INTO game_wallet_transaction "
                "(userID, game, eventID, transactionType, amount, balanceAfter, itemID) "
                "VALUES (%s, %s, %s, 'purchase', %s, %s, %s)",
                (user_id, game, request_id, -price, balance, item_id), conn, cursor,
            )
            result = _snapshot(user_id, game, conn, cursor)
            result["balance"], result["userItemID"] = balance, user_item_id
            result["duplicate"] = False
            conn.commit()
            return result, 201
        except (TypeError, ValueError, KeyError) as error:
            conn.rollback()
            return {"success": False, "message": str(error)}, 400
        except Exception as error:
            conn.rollback()
            return {"success": False, "message": str(error)}, 500
        finally:
            cursor.close()
            conn.close()

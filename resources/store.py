from flask_restful import Resource
from flask_jwt_extended import (
    jwt_required,
)
from flask import request
from db import mysql
from db_utils import *
from utils import *
from exceptions_util import *
from datetime import datetime


class StoreItem(Resource):
    # adds an item to the database table
    @jwt_required
    def post(self):
        data = {}
        data["name"] = getParameter("name", str, True, "")
        data["game"] = getParameter("game", str, True, "")
        data["itemType"] = getParameter("itemType", str, True, "")
        data["points"] = getParameter("points", int, False, "")
        data["isDefault"] = getParameter("isDefault", str, False, "")
        data["gender"] = getParameter("gender", str, False, "")

        if not data["isDefault"] or data["isDefault"].lower() == "false":
            data["isDefault"] = False
        else:
            data["isDefault"] = True

        if not data["gender"] or data["gender"].upper() not in ["M", "F", "N"]:
            data["gender"] = "N"

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if permission == "st":
            return errorMessage("User not authorized to add items."), 400

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "INSERT INTO `item` (`name`, `game`, `itemType`, `points`, `isDefault`, `gender`) VALUES (%s, %s, %s, %s, %s, %s)"
            postToDB(
                query,
                (
                    data["name"],
                    data["game"],
                    data["itemType"],
                    data["points"],
                    data["isDefault"],
                    data["gender"],
                ),
                conn,
                cursor,
            )

            # Get itemID of the item that was just added
            query = "SELECT `itemID` FROM `item` WHERE `name` = %s AND `game` = %s"
            result = getFromDB(query, (data["name"], data["game"]), conn, cursor)
            for row in result:
                data["itemID"] = row[0]

            raise ReturnSuccess(
                {
                    "Message": "Successfully created an item",
                    "itemID": int(data["itemID"]),
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

    # returns the item specified with the ID and returns the item with of properties assoicatied with that item
    @jwt_required
    def get(self):
        data = {}
        data["itemID"] = getParameter("itemID", int, False, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "SELECT * FROM `item` WHERE `itemID` = %s"
            result = getFromDB(query, data["itemID"], conn, cursor)
            new_item_object = {}
            if len(result) == 0:
                raise CustomException("Item does not exist!", 404)
            for row in result:
                new_item_object["itemID"] = row[0]
                new_item_object["name"] = row[1]
                new_item_object["game"] = row[2]
                new_item_object["itemType"] = row[3]
                new_item_object["points"] = row[4]
                new_item_object["isDefault"] = row[5]
                new_item_object["gender"] = row[6]

            raise ReturnSuccess(new_item_object, 200)
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

    # updates an item in the database table
    @jwt_required
    def put(self):
        data = {}
        data["itemID"] = getParameter("itemID", int, True, "")
        data["name"] = getParameter("name", str, False, "")
        data["game"] = getParameter("game", str, False, "")
        data["itemType"] = getParameter("itemType", str, False, "")
        data["points"] = getParameter("points", int, False, "")
        data["isDefault"] = getParameter("isDefault", str, False, False)
        data["gender"] = getParameter("gender", str, False, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        query = "SELECT * FROM `item` WHERE `itemID` = %s"
        result = getFromDB(query, data["itemID"])
        if len(result) == 0:
            return errorMessage("Item does not exist."), 404

        if data["isDefault"] and (
            data["isDefault"].lower() == "true" or data["isDefault"] == "1"
        ):
            data["isDefault"] = True
        elif data["isDefault"] and (
            data["isDefault"].lower() == "false" or data["isDefault"] == "0"
        ):
            data["isDefault"] = False

        if permission == "st":
            return errorMessage("User not authorized to update items."), 400

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            update_fields = []
            query_parameters = []

            for key, value in data.items():
                if key != "itemID" and value != None:
                    update_fields.append("`{}` = %s".format(key))
                    query_parameters.append(value)

            if not update_fields:
                return errorMessage("No fields to update provided."), 400

            query = "UPDATE `item` SET {} WHERE `itemID` = %s".format(
                ", ".join(update_fields)
            )
            query_parameters.append(data["itemID"])

            postToDB(query, tuple(query_parameters), conn, cursor)

            raise ReturnSuccess({"Message": "Successfully updated the item"}, 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage("An error occurred while updating the item."), 500
        finally:
            if conn.open:
                cursor.close()
                conn.close()

    # deletes an item from the database table
    @jwt_required
    def delete(self):
        data = {}
        data["itemID"] = getParameter("itemID", int, True, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if permission == "st":
            return errorMessage("User not authorized to delete items."), 400

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "DELETE FROM `item` WHERE `itemID` = %s"
            postToDB(query, (data["itemID"],), conn, cursor)

            # Delete all UserItem entries with the itemID
            query = "DELETE FROM `user_item` WHERE `itemID` = %s"
            postToDB(query, (data["itemID"],), conn, cursor)

            raise ReturnSuccess({"Message": "Successfully deleted the item"}, 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage("An error occurred while deleting the item."), 500
        finally:
            if conn.open:
                cursor.close()
                conn.close()


class AllStoreItems(Resource):
    # returns all items in the database table
    # optional: game
    @jwt_required
    def get(self):
        data = {}
        data["game"] = getParameter("game", str, False, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            if data["game"]:
                query = "SELECT * FROM `item` WHERE `game` = %s"
                result = getFromDB(query, data["game"], conn, cursor)
            else:
                query = "SELECT * FROM `item`"
                result = getFromDB(query, None, conn, cursor)

            items = []
            for row in result:
                new_item_object = {}
                new_item_object["itemID"] = row[0]
                new_item_object["name"] = row[1]
                new_item_object["game"] = row[2]
                new_item_object["itemType"] = row[3]
                new_item_object["points"] = row[4]
                new_item_object["isDefault"] = row[5]
                new_item_object["gender"] = row[6]
                items.append(new_item_object)

            raise ReturnSuccess(items, 200)
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


class PurchaseUserItem(Resource):
    # adds a user item to the database table
    @jwt_required
    def post(self):
        data = {}
        data["userID"] = getParameter("userID", int, True, "")
        data["itemID"] = getParameter("itemID", int, True, "")
        data["timeOfPurchase"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        data["game"] = getParameter("game", str, True, "")
        data["isWearing"] = getParameter("isWearing", str, False, False)
        data["color"] = getParameter("color", str, False, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if (
            data["isWearing"]
            and data["isWearing"].lower() == "true"
            or data["isWearing"] == "1"
        ):
            data["isWearing"] = 1
        else:
            data["isWearing"] = 0

        query = "SELECT * FROM `user_item` WHERE `userID` = %s AND `itemID` = %s"
        result = getFromDB(query, (data["userID"], data["itemID"]))
        if len(result) > 0:
            return errorMessage("User item already purchased"), 400

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "INSERT INTO `user_item` (`userID`, `itemID`, `timeOfPurchase`, `game`, `isWearing`, `color`) VALUES (%s, %s, %s, %s, %s, %s)"
            postToDB(
                query,
                (
                    data["userID"],
                    data["itemID"],
                    data["timeOfPurchase"],
                    data["game"],
                    data["isWearing"],
                    data["color"],
                ),
                conn,
                cursor,
            )

            # Get userItemID of the user item that was just added
            query = "SELECT `userItemID` FROM `user_item` WHERE `userID` = %s AND `itemID` = %s"
            result = getFromDB(query, (data["userID"], data["itemID"]), conn, cursor)
            for row in result:
                userItemID = row[0]

            raise ReturnSuccess(
                {
                    "Message": "Successfully purchased an item",
                    "userItemID": int(userItemID),
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


# When the user logs in to a game, the default items for that game are loaded into the user_item table
class LoadDefaultUserItems(Resource):
    @jwt_required
    def post(self):
        data = {}
        data["userID"] = getParameter("userID", int, True, "")
        data["game"] = request.args.get("game", "")
        # If the user is logging in for the first time, wear the default items
        data["firstTime"] = getParameter("firstTime", str, False, "")

        if (
            not data["firstTime"]
            or data["firstTime"].lower() == "false"
            or data["firstTime"] == "0"
        ):
            data["firstTime"] = False
        elif data["firstTime"].lower() == "true" or data["firstTime"] == "1":
            data["firstTime"] = True
        else:
            return errorMessage("Invalid firstTime parameter"), 400

        permission, user_id = validate_permissions()

        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if not data["game"]:
            return errorMessage("Game not provided"), 400

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            # If the request does not provide the firstTime parameter, check if the user already has items
            # If so, we can assume it is not the first time
            if not data["firstTime"]:
                query = "SELECT COUNT(userItemID) FROM `user_item` WHERE `userID` = %s"
                result = getFromDB(query, data["userID"], conn, cursor)

                if result[0][0] > 0:
                    data["firstTime"] = False
                else:
                    data["firstTime"] = True

            # Get all default items for the game
            query = "SELECT `itemID`, `itemType` FROM `item` WHERE `game` = %s AND `isDefault` = 1"
            result = getFromDB(query, data["game"], conn, cursor)
            default_items = []
            for row in result:
                default_items.append({"itemID": row[0], "itemType": row[1]})

            item_types = set()
            # If the user already has the default item, don't add it again
            # Otherwise, add (and wear if first time) the default item
            for item in default_items:
                itemID = item["itemID"]
                itemType = item["itemType"]

                query = (
                    "SELECT * FROM `user_item` WHERE `userID` = %s AND `itemID` = %s"
                )
                result = getFromDB(query, (data["userID"], itemID), conn, cursor)
                if len(result) == 0:
                    query = "INSERT INTO `user_item` (`userID`, `itemID`, `timeOfPurchase`, `game`, `isWearing`) VALUES (%s, %s, %s, %s, %s)"
                    postToDB(
                        query,
                        (
                            data["userID"],
                            itemID,
                            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                            data["game"],
                            data["firstTime"] and not item["itemType"] in item_types,
                        ),
                        conn,
                        cursor,
                    )
                    item_types.add(itemType)

            raise ReturnSuccess({"Message": "Successfully loaded default items"}, 201)
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


class WearUserItem(Resource):
    # updates a user item in the database table
    @jwt_required
    def put(self):
        data = {}
        data["userItemID"] = getParameter("userItemID", int, True, "")
        data["isWearing"] = getParameter("isWearing", str, True, "")
        data["replaceItem"] = getParameter("replaceItem", str, False, "")

        if data["isWearing"].lower() == "true" or data["isWearing"] == "1":
            data["isWearing"] = 1
        elif data["isWearing"].lower() == "false" or data["isWearing"] == "0":
            data["isWearing"] = 0
        else:
            return errorMessage("Invalid isWearing parameter"), 400

        if (
            data["replaceItem"] == None
            or data["replaceItem"].lower() == "true"
            or data["replaceItem"] == "1"
        ):
            data["replaceItem"] = 1
        elif data["replaceItem"].lower() == "false" or data["replaceItem"] == "0":
            data["replaceItem"] = 0

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "SELECT * FROM `user_item` WHERE `userItemID` = %s"
            result = getFromDB(query, data["userItemID"], conn, cursor)
            if len(result) == 0:
                return errorMessage("User item does not exist!"), 404
            user_item = {
                "userItemID": result[0][0],
                "userID": result[0][1],
                "itemID": result[0][2],
                "timeOfPurchase": result[0][3].strftime("%Y-%m-%d %H:%M:%S"),
                "game": result[0][4],
                "isWearing": result[0][5],
                "color": result[0][6],
            }

            # Check if the user has the item
            if user_item["userID"] != user_id and permission != "su":
                return errorMessage("You do not have access to this item!"), 404

            success = {}
            # Check if the user is currently wearing an item of the same type. If so, remove the wear flag from that item
            if data["isWearing"] == 1 and data["replaceItem"] == 1:
                query = f"""
                    SELECT ui.*, i.name
                    FROM user_item ui
                    INNER JOIN item i ON ui.itemID = i.itemID
                    WHERE i.game = (SELECT game FROM user_item WHERE userItemID = {data["userItemID"]})
                    AND i.itemType = (SELECT itemType FROM item WHERE itemID = (SELECT itemID FROM user_item WHERE userItemID = {data["userItemID"]}))
                    AND ui.isWearing = 1
                    AND ui.userItemID != {data["userItemID"]};
                """
                result = getFromDB(query, None, conn, cursor)

                if len(result) > 0:
                    query = (
                        "UPDATE `user_item` SET `isWearing` = 0 WHERE `userItemID` = %s"
                    )
                    postToDB(query, result[0][0], conn, cursor)
                    success["ReplacedItem"] = {
                        "itemID": result[0][0],
                        "name": result[0][7],
                    }

            query = "UPDATE `user_item` SET `isWearing` = %s WHERE `userItemID` = %s"
            postToDB(query, (data["isWearing"], data["userItemID"]), conn, cursor)

            # Success message should mention if an item was replaced by the new item if applicable
            success["Message"] = (
                f"Successfully wore user item {user_item['userItemID']}"
            )

            raise ReturnSuccess(success, 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            print(error)
            conn.rollback()
            return errorMessage("An error occurred while updating the user item."), 500
        finally:
            if conn.open:
                cursor.close()
                conn.close()


class ChangeUserItemColor(Resource):
    # updates a user item in the database table
    @jwt_required
    def put(self):
        data = {}
        data["userItemID"] = getParameter("userItemID", int, True, "")
        data["color"] = getParameter("color", str, True, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "SELECT * FROM `user_item` WHERE `userItemID` = %s"
            result = getFromDB(query, data["userItemID"], conn, cursor)
            if len(result) == 0:
                return errorMessage("User item does not exist!"), 404
            user_item = {
                "userItemID": result[0][0],
                "userID": result[0][1],
                "itemID": result[0][2],
                "timeOfPurchase": result[0][3].strftime("%Y-%m-%d %H:%M:%S"),
                "game": result[0][4],
                "isWearing": result[0][5],
            }

            # Check if the user has the item
            if user_item["userID"] != user_id and permission != "su":
                return errorMessage("You do not have access to this item!"), 404

            query = "UPDATE `user_item` SET `color` = %s WHERE `userItemID` = %s"
            postToDB(query, (data["color"], data["userItemID"]), conn, cursor)

            raise ReturnSuccess(
                {
                    "Message": f"Successfully changed color of user item {user_item['userItemID']}"
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
            print(error)
            conn.rollback()
            return errorMessage("An error occurred while updating the user item."), 500
        finally:
            if conn.open:
                cursor.close()
                conn.close()


class AllUserItems(Resource):
    # returns all user items in the database table
    # optional: userID, game
    @jwt_required
    def get(self):
        data = {}
        data["userID"] = getParameter("userID", int, False, "")
        data["game"] = getParameter("game", str, False, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if permission == "st" and data["userID"] and data["userID"] != user_id:
            return errorMessage("User not authorized to view other user's items."), 400

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "SELECT * FROM `user_item`"
            query_parameters = []
            if data["userID"] or permission == "st":
                query_user_id = data["userID"] if data["userID"] else user_id
                query += " WHERE `userID` = %s"
                query_parameters.append(query_user_id)
            if data["game"]:
                if data["userID"] or permission == "st":
                    query += " AND `game` = %s"
                else:
                    query += " WHERE `game` = %s"
                query_parameters.append(data["game"])

            result = getFromDB(query, tuple(query_parameters), conn, cursor)

            user_items = []
            for row in result:
                new_user_item_object = {}
                new_user_item_object["userItemID"] = row[0]
                new_user_item_object["userID"] = row[1]
                new_user_item_object["itemID"] = row[2]
                new_user_item_object["timeOfPurchase"] = row[3].strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
                new_user_item_object["game"] = row[4]
                new_user_item_object["isWearing"] = row[5]
                new_user_item_object["color"] = row[6]
                user_items.append(new_user_item_object)

            raise ReturnSuccess(user_items, 200)
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
        data["game"] = getParameter("game", str, True, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "DELETE FROM `user_item` WHERE `userID` = %s AND `game` = %s"
            postToDB(query, (user_id, data["game"]), conn, cursor)

            raise ReturnSuccess({"Message": "Successfully deleted the user items"}, 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage("An error occurred while deleting the user items."), 500
        finally:
            if conn.open:
                cursor.close()
                conn.close()


class AllUserPurchasableItems(Resource):
    # returns all items that a user can purchase
    # optional: game
    @jwt_required
    def get(self):
        data = {}
        data["game"] = getParameter("game", str, False, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            if data["game"]:
                query = "SELECT * FROM `item` WHERE `game` = %s"
                result = getFromDB(query, data["game"], conn, cursor)
            else:
                query = "SELECT * FROM `item`"
                result = getFromDB(query, None, conn, cursor)

            items = []
            for row in result:
                new_item_object = {}
                new_item_object["itemID"] = row[0]
                new_item_object["name"] = row[1]
                new_item_object["game"] = row[2]
                new_item_object["itemType"] = row[3]
                new_item_object["points"] = row[4]
                new_item_object["isDefault"] = row[5]

            # Check if the user already has the item
            query = "SELECT `itemID` FROM `user_item` WHERE `userID` = %s"
            result = getFromDB(query, user_id, conn, cursor)
            user_items = []
            for row in result:
                user_items.append(row[0])

            for item in items:
                if item["itemID"] in user_items:
                    items.remove(item)

            raise ReturnSuccess(items, 200)
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


class LoggedUserItem(Resource):
    @jwt_required
    def post(self):
        data = {}
        data["userID"] = getParameter("userID", int, True, "")
        data["sessionID"] = getParameter("sessionID", int, True, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if permission == "st" and data["userID"] != user_id:
            return errorMessage("User not authorized to log other user's items."), 400

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = f"""
                SELECT ui.*
                FROM user_item ui
                WHERE ui.userID = {data["userID"]} AND ui.isWearing = 1;
            """
            result = getFromDB(query, None, conn, cursor)

            for row in result:
                query = "INSERT INTO `logged_user_item` (`userItemID`, `sessionID`) VALUES (%s, %s)"
                postToDB(query, (row[0], data["sessionID"]), conn, cursor)

            raise ReturnSuccess({"Message": "Successfully logged user items"}, 201)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage("An error occurred while logging the user items."), 500
        finally:
            if conn.open:
                cursor.close()
                conn.close()


class GetUserItemCSV(Resource):
    """API to download a CSV of all logged pasta records"""

    @jwt_required
    def get(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id or permission != "su":
            return errorMessage("Invalid user"), 401

        try:
            redis_conn = redis.StrictRedis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                charset=REDIS_CHARSET,
                decode_responses=True,
            )
        except redis.exceptions.ConnectionError:
            redis_conn = None

        checksum_query = "CHECKSUM TABLE `logged_pasta`"
        checksum = getFromDB(checksum_query)
        checksum = str(checksum[0][1])

        if redis_conn is not None:
            logged_user_item_chks = redis_conn.get("logged_user_item_chks")
        else:
            logged_user_item_chks = None

        if checksum == logged_user_item_chks:
            csv = redis_conn.get("logged_user_item_csv")
        else:
            last_query = "SELECT MAX(logID) FROM `logged_pasta`"
            last_db_id = getFromDB(last_query)
            last_db_id = str(last_db_id[0][0])

            if redis_conn is not None:
                last_rd_id = redis_conn.get("last_logged_user_item_id")
            else:
                last_rd_id = None

            count_query = "SELECT COUNT(*) FROM `logged_pasta`"
            db_count = getFromDB(count_query)
            db_count = str(db_count[0][0])

            if redis_conn is not None:
                rd_log_user_item_count = redis_conn.get("log_user_item_count")
            else:
                rd_log_user_item_count = None

            query = """
                    SELECT lui.logID, ui.userID, u.username, s.moduleID, m.name, i.game, i.itemID, i.itemType, i.name, ui.color, i.gender, lui.sessionID
                    FROM logged_user_item lui
                    INNER JOIN user_item ui ON lui.userItemID = ui.userItemID
                    INNER JOIN user u ON ui.userID = u.userID
                    INNER JOIN item i ON ui.itemID = i.itemID
                    INNER JOIN module m ON i.game = m.game
                    INNER JOIN session s ON lui.sessionID = s.sessionID;
                    """

            if db_count != rd_log_user_item_count or rd_log_user_item_count is None:
                csv = "Logged Item ID, User ID, Username, Module ID, Module Name, Game, Item ID, Item Type, Item Name, Color, Gender, Session ID\n"
                results = getFromDB(query)

            else:
                csv = ""
                query += f"WHERE lp.logID > {last_db_id}"
                results = getFromDB(query)
                if redis_conn.get("logged_user_item_csv") is not None:
                    csv = redis_conn.get("logged_user_item_csv")

            if results and results[0]:
                for record in results:
                    if record[4] is None:
                        replace_query = (
                            "SELECT `name` FROM `deleted_module` WHERE `moduleID` = %s"
                        )
                        replace = getFromDB(replace_query, record[3])
                        record[4] = replace[0][0]
                    csv = (
                        csv
                        + f"""{record[0]}, {record[1]}, {record[2]}, {record[3]}, {record[4]}, {record[5]}, {record[6]}, {record[7]}, {record[8]}, {record[9]}, {record[10]}, {record[11]}\n"""
                    )

            last_record_id = results[-1][0]

            if redis_conn is not None:
                redis_conn.set("logged_user_item_csv", csv)
                redis_conn.set("logged_user_item_chks", checksum)
                redis_conn.set("last_logged_user_item_id", last_record_id)
                redis_conn.set("log_user_item_count", db_count)

        return Response(
            csv,
            mimetype="text/csv",
            headers={"Content-disposition": "attachment; filename=Logged_Pastas.csv"},
        )

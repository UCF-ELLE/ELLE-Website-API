from flask_restful import Resource
from flask_jwt_extended import (
    jwt_required,
)
from flask import request
from db import mysql
from db_utils import *
from utils import *
from exceptions_util import *


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
        data["isDefault"] = getParameter("isDefault", bool, False, False)
        data["gender"] = getParameter("gender", str, False, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if permission == "st":
            return errorMessage("User not authorized to update items."), 400

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            update_fields = []
            query_parameters = []

            for key, value in data.items():
                if value:
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
        data["timeOfPurchase"] = time.strftime("%Y-%m-%d %H:%M:%S")
        data["game"] = getParameter("game", str, True, "")
        data["isUsing"] = getParameter("isUsing", bool, False, False)

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "INSERT INTO `user_item` (`userID`, `itemID`, `timeOfPurchase`, `game`, `isWearing`) VALUES (%s, %s, %s, %s, %s)"
            postToDB(
                query,
                (
                    data["userID"],
                    data["itemID"],
                    data["timeOfPurchase"],
                    data["game"],
                    data["isWearing"],
                ),
                conn,
                cursor,
            )

            raise ReturnSuccess(
                {
                    "Message": "Successfully purchased an item",
                    "userItemID": int(data["userItemID"]),
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

            # Get all default items for the game
            query = "SELECT `itemID` FROM `item` WHERE `game` = %s AND `isDefault` = 1"
            result = getFromDB(query, data["game"], conn, cursor)
            default_items = []
            for row in result:
                default_items.append(row[0])

            # If the user already has the default item, don't add it again
            # Otherwise, add (and wear if first time) the default item
            for item in default_items:
                query = (
                    "SELECT * FROM `user_item` WHERE `userID` = %s AND `itemID` = %s"
                )
                result = getFromDB(query, (data["userID"], item), conn, cursor)
                if len(result) == 0:
                    query = "INSERT INTO `user_item` (`userID`, `itemID`, `timeOfPurchase`, `game`, `isWearing`) VALUES (%s, %s, %s, %s, %s)"
                    postToDB(
                        query,
                        (
                            data["userID"],
                            item,
                            time.strftime("%Y-%m-%d %H:%M:%S"),
                            data["game"],
                            data["firstTime"],
                        ),
                        conn,
                        cursor,
                    )

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
        data["isWearing"] = getParameter("isWearing", bool, True, "")

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "UPDATE `user_item` SET `isWearing` = %s WHERE `userItemID` = %s"
            postToDB(query, (data["isWearing"], data["userItemID"]), conn, cursor)

            raise ReturnSuccess({"Message": "Successfully updated the user item"}, 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
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
                new_user_item_object["timeOfPurchase"] = row[3]
                new_user_item_object["game"] = row[4]
                new_user_item_object["isWearing"] = row[5]
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

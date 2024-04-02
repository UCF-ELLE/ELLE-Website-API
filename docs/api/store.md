### `StoreItem` Class

**Endpoint**: `/api/store/item`

#### Methods:

1. `POST`

    - **Description:** Adds an item to the database table.
    - **Authorization:** JWT token required.
    - **Request Body:**
        - `name` (str, required): Name of the item.
        - `game` (str, required): Game associated with the item.
        - `itemType` (str, required): Type of the item.
        - `points` (int, optional): Points associated with the item.
        - `isDefault` (bool, optional): Indicates if the item is default.
        - `gender` (enum('M', 'F', 'N'), optional): Gender associated with the item.
    - **Returns:**
        - If successful:
            - Status Code: 201
            - Content: JSON object containing the newly created item's ID and a success message.
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

2. `GET`

    - **Description:** Retrieves the item specified by `itemID` along with its properties.
    - **Authorization:** JWT token required.
    - **Query Parameters:**
        - `itemID` (int, required): ID of the item to retrieve.
    - **Returns:**
        - If successful:
            - Status Code: 200
            - Content: JSON object containing the retrieved item's properties.
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If the item does not exist:
            - Status Code: 404
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

3. `PUT`

    - **Description:** Updates an item in the database table.
    - **Authorization:** JWT token required.
    - **Request Body:**
        - `itemID` (int, required): ID of the item to update.
        - `name` (str, optional): Updated name of the item.
        - `game` (str, optional): Updated game associated with the item.
        - `itemType` (str, optional): Updated type of the item.
        - `points` (int, optional): Updated points associated with the item.
        - `isDefault` (bool, optional): Updated indication if the item is default.
        - `gender` (enum('M', 'F', 'N'), optional): Updated gender associated with the item.
    - **Returns:**
        - If successful:
            - Status Code: 200
            - Content: JSON object containing a success message.
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

4. `DELETE`

    - **Description:** Deletes an item from the database table.
    - **Authorization:** JWT token required.
    - **Query Parameters:**
        - `itemID` (int, required): ID of the item to delete.
    - **Returns:**
        - If successful:
            - Status Code: 200
            - Content: JSON object containing a success message.
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

### `AllStoreItems` Class

**Endpoint**: `/api/store/items`

#### Methods:

1. `GET`

    - **Description:** Retrieves all items from the database table. Can be filtered by game.
    - **Authorization:** JWT token required.
    - **Query Parameters:**
        - `game` (str, optional): Filters items by the specified game.
    - **Returns:**
        - If successful:
            - Status Code: 200
            - Content: JSON array containing objects representing items.
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

### `PurchaseUserItem` Class

**Endpoint**: `/api/store/purchase`

#### Methods:

1. `POST`

    - **Description:** Adds a user item to the database table upon purchase.
    - **Authorization:** JWT token required.
    - **Request Body:**
        - `userID` (int, required): ID of the user purchasing the item.
        - `itemID` (int, required): ID of the item being purchased.
        - `game` (str, required): Game associated with the purchase.
        - `isWearing` (bool, optional): Indicates if the item is being worn by the user (default: False).
    - **Returns:**
        - If successful:
            - Status Code: 201
            - Content: JSON object containing a success message and the ID of the purchased user item.
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

### `LoadDefaultUserItems` Class

**Endpoint**: `/api/store/user/loaddefaultitems`

#### Methods:

1. `POST`

    - **Description:** Loads default items for a game into the `user_item` table when the user logs in. If the user is logging in for the first time, default items are worn automatically.
    - **Authorization:** JWT token required.
    - **Request Body:**
        - `userID` (int, required): ID of the user logging in.
        - `firstTime` (bool, optional): Indicates if the user is logging in for the first time (default: False).
    - **Query Parameters:**
        - `game` (str, required): Game for which default items should be loaded.
    - **Returns:**
        - If successful:
            - Status Code: 201
            - Content: JSON object containing a success message.
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If the game is not provided:
            - Status Code: 400
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

### `WearUserItem` Class

**Endpoint**: `/api/store/wear`

#### Methods:

1. `PUT`

    - **Description:** Updates a user item in the database table, indicating whether it is being worn or not.
    - **Authorization:** JWT token required.
    - **Request Body:**
        - `userItemID` (int, required): ID of the user item to update.
        - `isWearing` (str, required): Indicates whether the item is being worn (`"true"` or `"false"`).
    - **Returns:**
        - If successful:
            - Status Code: 200
            - Content: JSON object containing a success message. Optionally, if another item was replaced by the updated item, the replaced item's name is included in the response.
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

### `AllUserItems` Class

**Endpoint**: `/api/store/user/items`

#### Methods:

1. `GET`

    - **Description:** Retrieves all user items from the database table. Can be filtered by userID and/or game.
    - **Authorization:** JWT token required.
    - **Query Parameters:**
        - `userID` (int, optional): ID of the user whose items to retrieve.
        - `game` (str, optional): Game associated with the items to retrieve.
    - **Returns:**
        - If successful:
            - Status Code: 200
            - Content: JSON array containing objects representing user items.
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If the user is not authorized to view other users' items:
            - Status Code: 400
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

2. `DELETE`

    - **Description:** Deletes all user items for a specific game from the database table.
    - **Authorization:** JWT token required.
    - **Request Body:**
        - `game` (str, required): Game for which user items should be deleted.
    - **Returns:**
        - If successful:
            - Status Code: 200
            - Content: JSON object containing a success message.
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

### `AllUserPurchasableItems` Class

**Endpoint**: `/api/store/user/purchasable`

#### Methods:

1. `GET`

    - **Description:** Retrieves all items that a user can purchase from the database table. Can be filtered by game.
    - **Authorization:** JWT token required.
    - **Query Parameters:**
        - `game` (str, optional): Game for which purchasable items should be retrieved.
    - **Returns:**
        - If successful:
            - Status Code: 200
            - Content: JSON array containing objects representing purchasable items.
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

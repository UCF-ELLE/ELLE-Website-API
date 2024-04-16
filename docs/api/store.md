### `StoreItem` Class

**Endpoint:** `/elleapi/store/item`

#### Methods:

1. `POST`

    - Adds an item to the database table.
    - **Headers:**
        - Authorization: JWT token
    - **Body:**
        - name (string, required): Name of the item.
        - game (string, required): Name of the game associated with the item.
        - itemType (string, required): Type of the item.
        - points (int, optional): Points associated with the item.
        - isDefault (string, optional): Whether the item is default. If not provided, defaults to False.
        - gender (string, optional): Gender associated with the item. If not provided or invalid, defaults to "N".
    - **Returns:**
        - JSON object containing a success message and the ID of the newly created item.

2. `GET`

    - Returns the item specified with the ID and returns the item with properties associated with that item.
    - **Headers:**
        - Authorization: JWT token
    - **Params:**
        - itemID (int, optional): ID of the item.
    - **Returns:**
        - JSON object representing the item with properties associated with it.

3. `PUT`

    - Updates an item in the database table.
    - **Headers:**
        - Authorization: JWT token
    - **Body:**
        - itemID (int, required): ID of the item to update.
        - name (string, optional): Name of the item.
        - game (string, optional): Name of the game associated with the item.
        - itemType (string, optional): Type of the item.
        - points (int, optional): Points associated with the item.
        - isDefault (string, optional): Whether the item is default. If not provided, defaults to False.
        - gender (string, optional): Gender associated with the item.
    - **Returns:**
        - JSON object containing a success message confirming the update of the item.

4. `DELETE`

    - Deletes an item from the database table.
    - **Headers:**
        - Authorization: JWT token
    - **Params:**
        - itemID (int, required): ID of the item.
    - **Returns:**
        - JSON object containing a success message confirming the deletion of the item.

### `AllStoreItems` Class

**Endpoint:** `/elleapi/store/items`

#### Methods:

1. `GET`

    - Returns all items in the database table.
    - **Headers:**
        - Authorization: JWT token
    - **Params:**
        - game (string, optional): Name of the game to filter items by.
    - **Returns:**
        - JSON array containing objects representing each item with their respective properties.

### `UserItem` Class

**Endpoint:** `/elleapi/user/item`

#### Methods:

1. `GET`

    - Returns the user item specified with the ID and returns the user item with properties associated with that user item.
    - **Headers:**
        - Authorization: JWT token
    - **Params:**
        - userItemID (int, required): ID of the user item.
    - **Returns:**
        - JSON object representing the user item with properties associated with it.

2. `POST`

    - Adds a user item to the database table.
    - **Headers:**
        - Authorization: JWT token
    - **Body:**
        - userID (int, required): ID of the user purchasing the item.
        - itemID (int, required): ID of the item being purchased.
        - timeOfPurchase (string, required): Time of purchase in the format YYYY-MM-DD HH:MM:SS.
        - game (string, required): Name of the game associated with the item.
        - isWearing (string, required): Indicates whether the user is wearing the item.
        - color (string, required): Color of the item.
    - **Returns:**
        - JSON object containing a success message and the ID of the newly created user item.

3. `DELETE`

    - Deletes a user item from the database table.
    - **Headers:**
        - Authorization: JWT token
    - **Params:**
        - userItemID (int, required): ID of the user item.
    - **Returns:**
        - JSON object containing a success message confirming the deletion of the user item.

4. `PUT`

    - Updates a user item in the database table.
    - **Headers:**
        - Authorization: JWT token
    - **Body:**
        - userItemID (int, required): ID of the user item to update.
        - userID (int, optional): ID of the user purchasing the item.
        - itemID (int, optional): ID of the item being purchased.
        - timeOfPurchase (string, optional): Time of purchase in the format YYYY-MM-DD HH:MM:SS.
        - game (string, optional): Name of the game associated with the item.
        - isWearing (string, optional): Indicates whether the user is wearing the item.
        - color (string, optional): Color of the item.
    - **Returns:**
        - JSON object containing a success message confirming the update of the user item.

### `PurchaseUserItem` Class

**Endpoint:** `/elleapi/store/purchase`

#### Methods:

1. `POST`

    - Adds a user item to the database table.
    - **Headers:**
        - Authorization: JWT token
    - **Body:**
        - userID (int, required): ID of the user purchasing the item.
        - itemID (int, required): ID of the item being purchased.
        - game (string, required): Name of the game associated with the item.
        - isWearing (string, optional): Indicates whether the user is wearing the item. If not provided, defaults to False.
        - color (string, optional): Color of the item.
    - **Returns:**
        - JSON object containing a success message and the ID of the newly purchased user item.

### `LoadDefaultUserItems` Class

**Endpoint:** `/elleapi/store/loaddefaultitems`

#### Methods:

1. `POST`

    - Loads default user items for a specific game.
    - **Headers:**
        - Authorization: JWT token
    - **Body:**
        - userID (int, required): ID of the user.
        - game (string, required): Name of the game for which default items are to be loaded.
        - firstTime (string, optional): Indicates whether it is the user's first time logging in. If not provided, the system checks if the user already has items. If provided, must be a valid boolean value (true/false or 1/0).
    - **Returns:**
        - JSON object containing a success message confirming the loading of default items.

### `WearUserItem` Class

**Endpoint:** `/elleapi/store/wear`

#### Methods:

1. `PUT`

    - Updates a user item to indicate whether it is being worn.
    - **Headers:**
        - Authorization: JWT token
    - **Body:**
        - userItemID (int, required): ID of the user item.
        - isWearing (string, required): Indicates whether the item is being worn. Must be a valid boolean value (true/false or 1/0).
        - replaceItem (string, optional): Indicates whether the item is replacing a currently worn item. Must be a valid boolean value (true/false or 1/0). If true, and if the user is currently wearing an item of the same type, the wear flag will be removed from that item.
    - **Returns:**
        - JSON object containing a success message indicating the update status of the user item. If applicable, it also contains information about the replaced item.

### `ChangeUserItemColor` Class

**Endpoint:** `/elleapi/store/user/items/color`

#### Methods:

1. `PUT`

    - Updates the color of a user item in the database table.
    - **Headers:**
        - Authorization: JWT token
    - **Body:**
        - userItemID (int, required): ID of the user item.
        - color (string, required): New color value for the user item.
    - **Returns:**
        - JSON object containing a success message indicating the color change status of the user item.

### `AllUserItems` Class

**Endpoint:** `/elleapi/store/user/items`

#### Methods:

1. `GET`

    - Returns all user items in the database table.
    - **Headers:**
        - Authorization: JWT token
    - **Query Parameters:**
        - userID (int, optional): ID of the user whose items are to be fetched.
        - game (string, optional): Name of the game for filtering items.
    - **Returns:**
        - JSON object containing a list of user items with their details.

2. `DELETE`

    - Deletes all user items for a specific game from the database table.
    - **Headers:**
        - Authorization: JWT token
    - **Query Parameters:**
        - game (string, required): Name of the game for which user items are to be deleted.
    - **Returns:**
        - JSON object containing a success message indicating the deletion status of the user items.

### `AllUserPurchasableItems` Class

**Endpoint:** `/elleapi/store/user/purchasable`

#### Method:

1. `GET`

    - Returns all items that a user can purchase.
    - **Headers:**
        - Authorization: JWT token
    - **Query Parameters:**
        - game (string, optional): Name of the game for filtering purchasable items.
    - **Returns:**
        - JSON object containing a list of purchasable items for the user with their details.

### `LoggedUserItem` Class

**Endpoint:** `/elleapi/store/user/items/logged`

#### Method:

1. `POST`

    - Logs user items for a specific session.
    - **Headers:**
        - Authorization: JWT token
    - **Parameters:**
        - userID (int, required): The ID of the user whose items are being logged.
        - sessionID (int, required): The ID of the session to which the user items are being logged.
    - **Returns:**
        - JSON object with a success message indicating that user items have been successfully logged.

### `GetUserItemCSV` Class

**Endpoint:** `/elleapi/store/user/items/logged/csv`

#### Method:

1. `GET`

    - Allows downloading a CSV file containing all logged `user_item` records.
    - **Headers:**
        - Authorization: JWT token
    - **Returns:**
        - CSV file containing the logged `user_item` records.
    - **Additional Notes:**
        - The CSV file is formatted with the following columns:
            1. Logged Item ID
            2. User ID
            3. Username
            4. Module ID
            5. Module Name
            6. Game
            7. Item ID
            8. Item Type
            9. Item Name
            10. Color
            11. Gender
            12. Session ID
        - If the connection to Redis is available and the checksum of the table matches with the cached checksum, the CSV is retrieved from the cache. Otherwise, a new CSV is generated from the database query and cached in Redis.
        - The CSV file is returned as a downloadable attachment with the filename "Logged_User_Items.csv".

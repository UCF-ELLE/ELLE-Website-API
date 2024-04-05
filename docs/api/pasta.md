### `Pasta` Class

**Endpoint:** `/api/pastagame/pasta`

#### Methods:

1. `GET`

    - Retrieves pasta data by ID.
    - **Headers:**
        - Authorization: JWT token
    - **Params:**
        - pastaID (int, required): ID of the pasta.

2. `POST`

    - Creates a new pasta entry.
    - **Headers:**
        - Authorization: JWT token
    - **Body:**
        - moduleID (int, required)
        - category (string, required)
        - utterance (string, required)
        - mc1Answer (int, optional)
        - splitAnswer (list of strings, optional)
        - identifyAnswer (list of strings, optional)
        - mc2Answer (int, optional)

3. `PUT`

    - Updates an existing pasta entry.
    - **Headers:**
        - Authorization: JWT token
    - **Body:**
        - pastaID (int, required)
        - moduleID (int, optional)
        - category (string, optional)
        - utterance (string, optional)
        - mc1Answer (int, optional)
        - splitAnswer (list of strings, optional)
        - identifyAnswer (list of strings, optional)
        - mc2Answer (int, optional)

4. `DELETE`
    - Deletes a pasta entry by ID.
    - **Headers:**
        - Authorization: JWT token
    - **Params:**
        - pastaID (int, required)

### `AllPastaInModule` Class

**Endpoint:** `/api/pastagame/pasta/all`

#### Methods:

1. `GET`
    - Retrieves all pasta entries in a module.
    - **Headers:**
        - Authorization: JWT token
    - **Query Parameters:**
        - moduleID (int, required): ID of the module.
    - **Returns:**
        - If successful:
            - Status Code: 200
            - Content: List of pasta objects
        - If moduleID is not provided:
            - Status Code: 400
            - Content: Error message
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

### `PastaFrame` Class

**Endpoint:** `/api/pastagame/qframe`

#### Methods:

1. `POST`
    - Adds a question frame to the database table.
    - **Headers:**
        - Authorization: JWT token
    - **Body:**
        - moduleID (int, required): ID of the module.
        - category (string, required): Category of the question frame.
        - mc1QuestionText (string, optional): Text for multiple choice 1 question.
        - mc1Options (list of strings, optional): Options for multiple choice 1.
        - splitQuestionVar (string, required): Variable for split question.
        - identifyQuestionVar (string, optional): Variable for identify question.
        - mc2QuestionText (string, optional): Text for multiple choice 2 question.
        - mc2Options (list of strings, optional): Options for multiple choice 2.
        - displayName (string, optional): Display name of the question frame.
    - **Returns:**
        - If successful:
            - Status Code: 201
            - Content: Message confirming creation and question frame data
        - If module does not exist:
            - Status Code: 404
            - Content: Error message
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

### `PastaFrame` Class

**Endpoint:** `/api/pastagame/qframe`

#### Methods:

1. `POST`

    - Adds a question frame to the database table.
    - **Headers:**
        - Authorization: JWT token
    - **Body:**
        - moduleID (int, required)
        - category (string, required)
        - mc1QuestionText (string, optional)
        - mc1Options (list of strings, optional)
        - splitQuestionVar (string, required)
        - identifyQuestionVar (string, optional)
        - mc2QuestionText (string, optional)
        - mc2Options (list of strings, optional)
        - displayName (string, optional)
    - **Returns:**
        - If successful:
            - Status Code: 201
            - Content: Message confirming creation and question frame data
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

2. `GET`

    - Returns the question frame specified with the ID and returns the question frame with of properties associated with that question frame.
    - **Headers:**
        - Authorization: JWT token
    - **Query Parameters:**
        - qframeID (int, required): ID of the question frame.
    - **Returns:**
        - If successful:
            - Status Code: 200
            - Content: Question frame object
        - If qframeID is not provided:
            - Status Code: 400
            - Content: Error message
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If question frame does not exist:
            - Status Code: 404
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

3. `PUT`

    - Updates a question frame in the database table.
    - **Headers:**
        - Authorization: JWT token
    - **Body:**
        - qframeID (int, required)
        - moduleID (int, optional)
        - category (string, optional)
        - mc1QuestionText (string, optional)
        - mc1Options (list of strings, optional)
        - splitQuestionVar (string, optional)
        - identifyQuestionVar (string, optional)
        - mc2QuestionText (string, optional)
        - mc2Options (list of strings, optional)
        - displayName (string, optional)
    - **Returns:**
        - If successful:
            - Status Code: 200
            - Content: Message confirming update and updated question frame data
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

4. `DELETE`
    - Deletes a question frame from the database table.
    - **Headers:**
        - Authorization: JWT token
    - **Query Parameters:**
        - qframeID (int, required): ID of the question frame.
    - **Returns:**
        - If successful:
            - Status Code: 200
            - Content: Message confirming deletion
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

### `PastaFrameModule` Class

**Endpoint:** `/api/pastagame/qframe/all`

#### Methods:

1. `GET`
    - Returns all the question frames for a specific module.
    - **Headers:**
        - Authorization: JWT token
    - **Query Parameters:**
        - moduleID (int, required): ID of the module.
    - **Returns:**
        - If successful:
            - Status Code: 200
            - Content: List of question frame objects
        - If moduleID is not provided:
            - Status Code: 400
            - Content: Error message
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

### `AllPastaModuleResources` Class

**Endpoint:** `/api/pastagame/module/all`

#### Method:

1. `GET`
    - Retrieves all question frames and pastas associated with a module.
    - **Headers:**
        - Authorization: JWT token
    - **Query Parameters:**
        - moduleID (int, required): ID of the module.
    - **Returns:**
        - If successful:
            - Status Code: 200
            - Content: JSON object containing question frames and pastas
        - If moduleID is not provided:
            - Status Code: 400
            - Content: Error message
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

### `LoggedPasta` Class

**Endpoint:** `/api/pastagame/logged_pasta`

#### Methods:

1. `POST`

    - Logs a pasta response.
    - **Headers:**
        - Authorization: JWT token
    - **Request Body:**
        - pastaID (int, required): ID of the pasta.
        - correct (bool, required): Indicates whether the response is correct.
        - qFrameID (int, required): ID of the question frame associated with the response.
        - questionType (enum('identify', 'split', 'mc1', 'mc2'), required): Type of the question.
        - sessionID (int, required): ID of the session.
    - **Returns:**
        - If successful:
            - Status Code: 201
            - Content: JSON object containing the logged pasta response
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

2. `GET`

    - Retrieves logged pasta responses based on logID, pastaID, or sessionID.
    - **Headers:**
        - Authorization: JWT token
    - **Query Parameters:**
        - logID (int, optional): ID of the log.
        - pastaID (int, optional): ID of the pasta.
        - sessionID (int, optional): ID of the session.
    - **Returns:**
        - If successful:
            - Status Code: 200
            - Content: JSON object containing logged pasta responses
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

3. `DELETE`
    - Deletes a logged pasta response.
    - **Headers:**
        - Authorization: JWT token
    - **Query Parameters:**
        - logID (int, required): ID of the log.
    - **Returns:**
        - If successful:
            - Status Code: 200
            - Content: Success message
        - If invalid user:
            - Status Code: 401
            - Content: Error message
        - If an error occurs:
            - Status Code: 500
            - Content: Error message

### `PastaHighScore` Class

**Endpoint:** `/api/pastagame/pasta_high_score`

#### Method:

-   `GET`
    -   Retrieves high scores for pastas attempted by a user in a specific module.
    -   **Headers:**
        -   Authorization: JWT token
    -   **Query Parameters:**
        -   userID (str, required): ID of the user.
        -   moduleID (str, optional): ID of the module. If not provided, retrieves high scores for all modules.
    -   **Returns:**
        -   If successful:
            -   Status Code: 200
            -   Content: JSON object containing high scores and session duration
        -   If invalid user:
            -   Status Code: 401
            -   Content: Error message
        -   If an error occurs:
            -   Status Code: 500
            -   Content: Error message

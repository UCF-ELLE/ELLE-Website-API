### `Pasta` Class

**Endpoint:** `/elleapi/pastagame/pasta`

#### Methods:

1. `GET`

    - Retrieves pasta data by ID.
    - **Headers:**
        - Authorization: JWT token
    - **Params:**
        - pastaID (int, required): ID of the pasta.
    - **Returns:**
        - JSON object representing the pasta data including pastaID, moduleID, category, utterance, mc1Answer, mc2Answer, splitAnswer (if available), and identifyAnswer (if available).

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
    - **Returns:**
        - JSON object containing a success message and the details of the newly created pasta entry.

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
    - **Returns:**
        - JSON object containing a success message and the details of the updated pasta entry.

4. `DELETE`

    - Deletes a pasta entry by ID.
    - **Headers:**
        - Authorization: JWT token
    - **Params:**
        - pastaID (int, required)
    - **Returns:**
        - JSON object containing a success message confirming the deletion of the pasta entry.

### `AllPastaInModule` Class

**Endpoint:** `/elleapi/pastagame/all`

#### Methods:

1. `GET`

    - Retrieves all pasta entries within a specific module.
    - **Headers:**
        - Authorization: JWT token
    - **Params:**
        - moduleID (int, required): ID of the module to retrieve pasta entries from.
    - **Returns:**
        - JSON array containing objects representing each pasta entry within the specified module.

### `PastaFrame` Class

**Endpoint:** `/elleapi/pastagame/qframe`

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
        - JSON object containing a success message and the details of the newly created question frame.

2. `GET`

    - Returns the question frame specified with the ID and returns the question frame with properties associated with that question frame.
    - **Headers:**
        - Authorization: JWT token
    - **Params:**
        - qframeID (int, required): ID of the question frame.
    - **Returns:**
        - JSON object representing the question frame including qframeID, moduleID, category, mc1QuestionText, splitQuestionVar, identifyQuestionVar, mc2QuestionText, mc1Options (if available), mc2Options (if available), and displayName.

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
        - JSON object containing a success message and the details of the updated question frame.

4. `DELETE`

    - Deletes a question frame from the database table.
    - **Headers:**
        - Authorization: JWT token
    - **Params:**
        - qframeID (int, required): ID of the question frame.
    - **Returns:**
        - JSON object containing a success message confirming the deletion of the question frame.

### `PastaFrameModule` Class

**Endpoint:** `/elleapi/pastagame/qframe/all`

#### Method:

1. `GET`

    - Returns all the question frames for a specific module.
    - **Headers:**
        - Authorization: JWT token
    - **Params:**
        - moduleID (int, required): ID of the module for which question frames are requested.
    - **Returns:**
        - JSON array containing question frame objects for the specified module.

### `AllPastaModuleResources` Class

**Endpoint:** `/api/pastagame/module/all`

#### Method:

1. `GET`

    - Returns all question frames and pastas for a specific module.
    - **Headers:**
        - Authorization: JWT token
    - **Params:**
        - moduleID (int, required): ID of the module for which resources are requested.
    - **Returns:**
        - JSON object containing two arrays:
            - "question_frames": Array of question frame objects, each containing qframeID, moduleID, category, mc1QuestionText, splitQuestionVar, identifyQuestionVar, mc2QuestionText, displayName, and optionally mc1Options and mc2Options.
            - "pasta": Array of pasta objects, each containing pastaID, moduleID, category, utterance, mc1Answer, mc2Answer, and optionally splitAnswer and identifyAnswer.

### `LoggedPasta` Class

**Endpoint:** `/elleapi/pastagame/loggedpasta`

#### Methods:

1. `POST`

    - Logs a pasta response.
    - **Headers:**
        - Authorization: JWT token
    - **Params:**
        - pastaID (int, required): ID of the pasta being logged.
        - correct (str, required): Indicates whether the response was correct. Can be "1" or "true" for True, "0" or "false" for False.
        - qFrameID (int, required): ID of the question frame associated with the response.
        - questionType (str, required): Type of the question.
        - sessionID (int, required): ID of the session.
    - **Returns:**
        - JSON object with a message confirming successful logging and details of the logged pasta response.

2. `GET`

    - Retrieves logged pasta responses based on log ID, pasta ID, or session ID.
    - **Headers:**
        - Authorization: JWT token
    - **Params:**
        - logID (int, optional): ID of the log entry.
        - pastaID (int, optional): ID of the pasta.
        - sessionID (int, optional): ID of the session.
    - **Returns:**
        - JSON array containing logged pasta response objects, each containing logID, pastaID, correct, qFrameID, questionType, sessionID, and log_time.

3. `DELETE`

    - Deletes a logged pasta entry.
    - **Headers:**
        - Authorization: JWT token
    - **Params:**
        - logID (int, required): ID of the log entry to be deleted.
    - **Returns:**
        - JSON object with a message confirming successful deletion.

### `PastaHighScore` Class

**Endpoint:** `/elleapi/pastagame/highscores`

#### Method:

-   `GET`

    -   Retrieves high scores for pasta games.
    -   **Headers:**
        -   Authorization: JWT token
    -   **Params:**
        -   userID (str): ID of the user.
        -   moduleID (str, optional): ID of the module.
    -   **Returns:**
        -   JSON array containing high score objects, each containing sessionID, userID, session_duration, moduleID, total_correct_pasta, total_logged_pasta, and correct_to_total_ratio.

### `GetPastaCSV` Class

**Endpoint:** `/elleapi/pastagame/loggedpasta/csv`

#### Method:

-   `GET`

    -   Retrieves a CSV file containing all logged pasta records.
    -   **Headers:**
        -   Authorization: JWT token
    -   **Returns:**
        -   CSV file containing logged pasta records.
    -   **Additional Notes:**
        -   The CSV file is formatted with the following columns:
            1. Log ID
            2. User ID
            3. Username
            4. Module ID
            5. Pasta Module Name
            6. Question
            7. Pasta Utterance
            8. Correct
            9. Log Time
        -   If the connection to Redis is available and the checksum of the table matches with the cached checksum, the CSV is retrieved from the cache. Otherwise, a new CSV is generated from the database query and cached in Redis.
        -   The CSV file is returned as a downloadable attachment with the filename "Logged_Pastas.csv".

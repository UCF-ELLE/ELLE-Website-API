#### Considering /elleapi/twt/... for the api, less vague
#### /elleapi/tools/... for grammar tools & tokenizer for potential future use, locked for now?

### General notes on API documentation:
---
#### > GET: 
- calls should NOT cause any changes no matter how many times it is called
- Uses query parameters or path parameters:
- Provided examples are simple, but may be made more complex to support multiple parameters.
```
  a query parameter: 
    ?userID=123&classID=456

  a path parameter:
    /path/to/api/{id}
```
<ul>
  <ul>
    <li>Where query parameters initialize a query using a `?` after api-path then followed by key-value pairings {key-value}</li>
    <li>Combine many parameters using an `&` after each pair of key-value pairs</li>
      <ul>
        <li>What is primarily used by us</li>
        <li> /path/to/api<b>?key_1=val_1&key_2=val_2&...</b></li>
      </ul>
  </ul>
</ul>

#### > POST:
- POST calls are for when you cause any change in the backened
- Nothing else to say...

### Other notes:
- Returns values are a *little* inconsistent. Sometimes its in `data` other times in a more specific `retval`

## > Creating Responses
- I have streamlined the api response generation to make it prettier and handy.
- API responses uses the `create_response()` method found in `database.py` ***(tentative to move elsewhere)*** to streamline reponses instead of manually making the JSON format every time

Parameters of the `create_response()` method
  ```python
  def create_response(
                    success=True,         # status = success or error, unsure how useful this is tbh
                    message=None,         # information about the transaction
                    data=None,            # information retrieved and to be parsed                    
                    status_code=200       # server status response (200 = OK)
                    **extra_json_fields   # accepts an arbitrary amount key=value pairs for extra information
                  ):
  ```

**Error codes**:
  - `400`: Bad Request (e.g., missing required fields)
  - `500`: Internal Server Error (e.g., database failure)
  - `xxx`: TBD

# ALL API CALLS HERE REQUIRE A JWT TOKEN FOR SECURITY PURPOSES

## **API Overview**
   - **Purpose**: A brief description of what the API does.
   - **Base URLs**: URL endpoint for the API `/elleapi/twt/` for core functionality and `/elleapi/tools/` for a multi-purpose shared API library
   - **General Notes**: ALL API endpoints **REQUIRE** a jwt_token: primarily for security AND then for ease of access to `user_id` and `user_permission` which are encoded in the JWT
---

### 1. **GET /elleapi/twt/session/access**
- **Purpose**: Users requests permission from the server to access TWT. Recieves a list of `enrolled classes` mapped to `tito-modules`, if none, user has no access to TWT.
- **Notes**: Client should store the `class_id` -> [`module_id`] pairs locally for ease of access later on or call this API once more. 
- **Query Parameters**:
  ```
    None
  ```
- **Returns**:
  ```JSON
  {
    "success": true or false,
    "message": "text" or "",
    "data": []    // Returns a list of tuples -> [(classID, [(moduleID, sequenceOrderOfThisModule)]]
    /*
                      EX  [
                            (
                                class_id=1,
                                [
                                  (module_id_1, sequence_id_x),
                                  (module_id_2, sequence_id_y),
                                    ...
                                  (module_id_N, sequence_id_z),
                                ]
                            ),
                            ...
                            (
                              class_id=N,
                              [
                                  (module_id_1, sequence_id_x),
                                  (module_id_2, sequence_id_y),
                                    ...
                                  (module_id_N, sequence_id_z),
                              ]
                            )
                          ]
    */
  }
  ```

---

### 2. **POST /elleapi/twt/session/create**
- **Purpose**: Creates a chatbot session to allow the user to send messages to Tito. Only 1 session may be active for a user and is *exclusive* to one module at a time.
- **Notes**: Must create a NEW session any time user loads modules for a new CLASS OR selects a new module
- **Request body** (JSON)
  ```JSON
    "moduleID": int,
    "classID": int
  ```
- **Response**
  ```JSON
  {
    "success": bool,
    "message": string,
    "data": int,            // returns a single int, representing the chatbot_session_id
  }
  ```
---

### 3. **POST /elleapi/twt/session/messages**
- **Purpose**: Sends a single user message from the current session to the chatbot and returns the messageID for relating to a voice message & ordering (if needed) and more (TBD)
- **Notes**: Audio messages are requested on top of this API
- **Request body** (JSON):
  ```json
  {
    "chatbotSID": int,          // Permission session token id
    "moduleID": int,            // The currently selected module  
    "message": string,          // The user's message to LLM
    "isVoiceMessage": boolean   // if user will send an audio file after
  }
  ```

- **Response** (JSON):
  ```json
  {
    "success": true or false,
    "message": "text",
    "data": string,             // the message the user sent (single string)
    "resumeMessaging": boolean, // allows user to send another message (from the front end)
    "messageID": int,           // insertion of new message returns id for the message sent, REQUIRED for voice messages 
    "titoResponse": "text"      // Tito's response to user message
  }
  ```
- **Notes**:
    - API process:
        1. User sends a message
        2. Backend process the message (checks for free talk or module-based chat)
        3. Message passed into the key-word counting function for terms/phrases used for this module. spaCy + DB
        4. Grammar is rated for the message
        5. The LLM process the user message
        6. Once the backend gets all of this data back, send to front end


---

### 4. **GET twt/session/messages?moduleID={#}**
- **Purpose**: Retrieve a list of chat messages for a user's chat history on a given moduleID. Given in ascending order.
- **Note**: 
- **Query parameters**:
  ```JSON
  ?
  moduleID={int}
  ```
- **Response** (JSON):
  ```json
  {
    "success": true or false,
    "message": "text",
    "data": [
      {
        "messageID": 1,
        "moduleID": 2,
        "source": "user",
        "value": "Hello, Tito!",
        "timestamp": "2025-02-20T14:30:00",
        "voiceMessage": true,
      },
      ...,
      {
        "messageID": N,
        "moduleID": 2,
        "source": "llm",
        "value": "Hello! What would you like to talk about today?",
        "timestamp": "2025-02-20T14:30:05",
        "voiceMessage": false,
      },
     ...,
    ],    
  }
  ```

---

### 5. **POST /elleapi/twt/session/audio**
- **Purpose**: Uploads and stores a recorded user voice message associated to a message to the server
- **Notes**: File saved with filename pattern -> `{userID}_{messageID}.webm` under path `USER_VOICE_FOLDER`/classID/moduleID/userID/userID_messageID.webm
- **Request body** (JSON)
```JSON
{
  "messageID": int,
  "chatbotSID": int,
  "classID": int,
  "moduleID": int,
  "audio": "file.webm" // the audio file to be uploaded
}
```
- **Response**
```JSON
{
  "success": false,
  "message": "text",
  "data": []         // no data returned
}
```

---

### 6. **GET /elleapi/twt/session/audio**
- **Purpose**: Returns a single audio file from the user.
- **Notes**: File returns file with filename pattern -> `{classID}_{userID}_{messageID}.webm`
- **Note**: 2 expected return behaviors `status=200`(ok, file received) && `status != 200` (error, no file received)
- **Query Parameters**: (JSON)
```JSON
    ?
    classID={int}   // user's class
    &
    messageID={int} // message associated to voice message
```

- **Response:** check status code, 200 OK, other = failure

### success, no JSON
```JSON
response header
{
  status=200
  Content-Type: audio/webm  
}
```
### OR failed to retrieve file, yes JSON
```JSON
{
  "success": false,
  "message": "text",
  "data": []               // no data returned
}
```

---

### 7. **GET /elleapi/twt/module/terms**
- **Purpose**: Gets all the terms/phrases associated to this modules as a list of (id, term)
- **Notes**: 
- **Query Parameters**
```JSON
  ?
  moduleID={int}
```
- **Response**
```JSON
{
  "success": true or false,
  "message": "text",
  "data": [(termID, term)]  // A list of pairs of tuples are returned (tuple_1 = `termID`, tuple_2 = `front`) 
}                             // front is the table `term`'s word in the foreign language (the target word to be used)
```

---

### 8. **GET /elleapi/twt/session/getModuleProgress**
- **Purpose**: Returns the percentage of words mastered for this module
- **Notes**: At every 25% progress interval, new tito lore is provided
- **Query Parameters**
```JSON
  ?
  moduleID={int}
```
- **Response**
```JSON
{
  "success": true or false,
  "message": "text",
  "data": float  // A list of pairs of tuples are returned (tuple_1 = `termID`, tuple_2 = `front`) 
}                             // front is the table `term`'s word in the foreign language (the target word to be used)
```

---
## Universal

### 9. **GET /elleapi/twt/session/classes**
- **Purpose**: Retrieves a list of all tito_classes (either owned by professor, or enrolled by student)
- **Notes**: Can request for `all`, `active` or `inactive` tito_classes
- **Query Parameters** 
```JSON
  ?
  classType={string}
```
- **Response**
```JSON
{
  "success": true or false,
  "message": "text",
  "data": int[]               // returns a list of class ids owned by user (the prof)
```

---

### 10. **GET /elleapi/twt/session/getTitoLore**
- **Purpose**: Get the assigned tito lore for the class's module a list of strings + the loreID
- **Notes**: User must not be a `st`
- **Query Parameters** 
```JSON
  ?
  classID={int}
  &
  moduleID={int}
```
- **Response**
```JSON
{
  "success": true or false,
  "message": "text",
  "data": string[],               // returns a list of 4 ordered tito lore strings for the module
  "loreID": int
}
```

---

## FOR PROFESSORS

### 11. **POST /elleapi/twt/professor/addModule**
- **Purpose**:  makes changes to a module's status on being a tito_module or not
- **Notes**: automatically populate `tito_*` tables for this module
- **Request body** (JSON)
```JSON
{
  "classID": int,
  "moduleID": int
}
```
- **Response**
```JSON
{
  "success": true or false,
  "message": "text"
}
```

---

### 12. **POST /elleapi/twt/professor/updateModule**
- **Purpose**: enable/disable a tito module for a class
- **Notes**: Can also update start/end dates
- **Request body** (JSON)
```JSON

```
- **Response**
```JSON
{
  "success": true or false,
  "message": "text"
}
```

---

### 13. **POST /elleapi/twt/professor/updateClassStatus**
- **Purpose**: enable/disable tito status for a class ()
- **Notes**: inserts into tito_class_status if not previously a tito-enrolled class
- **Request body** (JSON)
```JSON
{
  "classID": int
}
```
- **Response**
```JSON
{
  "success": true or false,
  "message": "text"
}
```

---

### 14. **POST /elleapi/twt/professor/getClassUsers**
- **Purpose**: gets a list of all students in class
- **Notes**: 
- **Request body** (JSON)
```JSON
{
  "classID": int
}

```
- **Response**
```JSON
{
  "success": true or false,
  "message": "text",
  "users": int[],
}
```

---

### 15. **POST /elleapi/twt/professor/changeAssignedLore**
- **Purpose**: Updating the assigned tito lore
- **Notes**: 
- **Request body** (JSON)
```JSON
{
  "classID": int,
  "moduleID": int,
  "loreID": int
}
```
- **Response**
```JSON
{
  "success": true or false,
  "message": "text"
}
```

---

### 16. **POST /elleapi/twt/professor/createNewTitoLore**
- **Purpose**: creates tito lore tied to this user as the owner
- **Notes**: Accepts either 4 separate strings OR a single body parameter that will be split into 4 parts
- **Request body** (JSON)
```JSON
{
  // Option 1: Single body parameter (recommended)
  "body": "text content separated by double newlines"
  
  // Option 2: Legacy format with 4 separate parameters
  "lore_1": "text1",
  "lore_2": "text2",
  "lore_3": "text3",
  "lore_4": "text4"
}

```
- **Response**
```JSON
{
  "success": true or false,
  "message": "text",
  "loreID": int // The ID of the newly created lore
}
```

---

### 17. **POST /elleapi/twt/professor/updateTitoLore**
- **Purpose**: Updating a singular tito lore part (1-4)
- **Notes**: 
- **Request body** (JSON)
```JSON
{
  "classID": int,
  "moduleID": int,
  "loreID": int,
  "sequenceNumber": int (1-4),
  "newLoreText": "new text"
} 
```
- **Response**
```JSON
{
  "success": true or false,
  "message": "text"
}
```

---

### 18. **POST /elleapi/twt/professor/fetchOwnedTitoLore**
- **Purpose**: Returns a list of tuples containing tito lores owned by this user so they can modify them later
- **Notes**: 
- **Request body** (JSON)
```JSON

```
- **Response**
```JSON
{
  "success": true or false,
  "message": "text",
  "loreData": [(loreID, sequenceNumber, loreText)]
      /*
        EX:
        [ 
         (1, 1, "lore1"),
         (1, 2, "lore2"),
         (1, 3, "lore3"),
         (1, 4, "lore4"),
         ...
         (4, 4, "lore4")
        ]
      */
}
```

---

### 444. **POST /elleapi/PLACEHOLDER**
- **Purpose**: Returns a list of tuples containing tito lores owned by this user so they can modify them later
- **Notes**: 
- **Request body** (JSON)
```JSON

```
- **Response**
```JSON
{
}  
```

---

### 444. **POST /elleapi/PLACEHOLDER**
- **Purpose**: Returns a list of tuples containing tito lores owned by this user so they can modify them later
- **Notes**: 
- **Request body** (JSON)
```JSON

```
- **Response**
```JSON
{
}  
```

---

### 444. **POST /elleapi/PLACEHOLDER**
- **Purpose**: Returns a list of tuples containing tito lores owned by this user so they can modify them later
- **Notes**: 
- **Request body** (JSON)
```JSON

```
- **Response**
```JSON
{
}  
```

---

### 444. **POST /elleapi/PLACEHOLDER**
- **Purpose**: Returns a list of tuples containing tito lores owned by this user so they can modify them later
- **Notes**: 
- **Request body** (JSON)
```JSON

```
- **Response**
```JSON
{
}  
```

---

### 444. **POST /elleapi/PLACEHOLDER**
- **Purpose**: Returns a list of tuples containing tito lores owned by this user so they can modify them later
- **Notes**: 
- **Request body** (JSON)
```JSON

```
- **Response**
```JSON
{
}  
```

---

### SAMPLE. **POST /elleapi/twt/...**
- **Purpose**: Sends a user's message from the current session to the chatbot
- **Request body** (JSON):
  ```json
  {
    "id_1":       data_type,          // notes A
    // ...
    "id_N":       data_type,          // notes Z 
  }
  ```

- **Response** (JSON):
  ```json
  { 
    "id_1":       data_type,          // notes A
    // ...
    "id_N":       data_type,          // notes Z 
  }
  ```
- **Notes**:
    - process:
        1. ...

- **Error codes**:
  - `400`: Bad Request (e.g., missing required fields)
  - `500`: Internal Server Error (e.g., database failure)
  - `xxx`: TBD
---
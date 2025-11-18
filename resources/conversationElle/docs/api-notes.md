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
- Do be aware there are different ways to encode data, the API below suffers from that fact... *painfully* so...
- I'll name API's that used `request.form` which encode `application/x-www-form-urlencoded` and `multipart/form-data` as `encoding: form` and `request.get_json()` which does `application/json` as json

### Other notes:
- Returns values are a *little* inconsistent. Sometimes its in `data` other times in a more specific `retval`
- Some of the later APIs and helper methods were not created by me and instead were made by others team members who may or may not have tested and/or documented the API.

## > Creating Responses
- I have streamlined the api response generation to make it prettier and handy.
- API responses uses the `create_response()` method found in `utils.py` to streamline reponses instead of manually assembling JSON return values

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
  - To be worked on (Didn't have time to note them down)

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
- **Encoding**: form
- **Request body** 
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
- **Encoding**: form
- **Request body** :
  ```json
  {
    "chatbotSID": int,          // Permission session token id
    "moduleID": int,            // The currently selected module  
    "message": string,          // The user's message to LLM
    "isVoiceMessage": boolean,  // if user will send an audio file after
    "classID": int              // Class module and user belongs to
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

### 4. **GET /elleapi/twt/session/messages?moduleID={#}**
- **Purpose**: Retrieve a list of chat messages for a user's chat history on a given moduleID. Given in ascending order.
- **Note**: 
- **Query parameters**:
  ```JSON
  ?
  moduleID={int}
  &
  classID={int}
  ```
- **Response** (JSON):
  ```json
  {
    "success": true or false,
    "message": "text",
    "data": [
      {
        "messageID": int,
        "moduleID": int,
        "source": "user",
        "message": string,
        "creationTimestamp": "2025-02-20T14:30:00",
        "grammarScore": float,
        "isVoiceMessage": boolean,
      },
      ...,
      {
        "messageID": int,
          ...
        "voiceMessage": boolean,
      },
     ...,
    ],    
  }
  ```

---

### 5. **POST /elleapi/twt/session/audio**
- **Purpose**: Uploads and stores a recorded user voice message associated to a message to the server
- **Notes**: File saved with filename pattern -> `{userID}_{messageID}.webm` under path `USER_VOICE_FOLDER`/classID/moduleID/userID/userID_messageID.webm
- **Encoding**: form
- **Request body** 
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
- **TODO**: Implement allowing professors to load user audio messages
- **Query Parameters**: (JSON)
```JSON
    ?
    classID={int}   // user's class
    &
    messageID={int} // message associated to voice message
    &
    moduleID={int} 
    &
    studentID={int} // search up user
```

- **Response:** check status code, 200 OK, other = failure

**success, no JSON**
```JSON
response header
{
  status=200
  Content-Type: audio/webm  
}
```
**OR failed to retrieve file, yes JSON**
```JSON
{
  "success": false,
  "message": "text",
  "data": []               // no data returned
}
```

---


### 7. **GET /elleapi/twt/session/downloadAllUserAudio**
- **Purpose**: downloads all audio messages for this user for classID and moduleID all compiled to 1 audio file.
- **Notes**: File returns file with filename pattern -> `{classID}_{userID}_{messageID}.webm`
- **Query Parameters**: (JSON)
```JSON
    ?
    classID={int}   // user's class
    &
    moduleID={int} 
```

- **Response:** check status code, 200 OK, other = failure

**success, no JSON**
```JSON
response header
{
  status=200
  Content-Type: audio/webm  
}
```
**OR failed to retrieve file, yes JSON**
```JSON
{
  "success": false,
  "message": "text",
  "data": []               // no data returned
}
```

---



### 8. **GET /elleapi/twt/module/terms**
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


### 9. **GET /elleapi/twt/session/getTermProgress?moduleID=**
- **Purpose**: Returns the percentage of words mastered for this module
- **Notes**: Other member created this. Should return information relevant to the progress of a list of terms for a given module
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
  "data": {
      "masteredIDs": [int?],
      "usedIDs": [int?],
      "progressByTerm": {
          "[termID]": { "hasMastered", "timesUsed", "timesMisspelled" }
        }
    } 
}
```

---

### 10. **GET /elleapi/twt/session/getModuleProgress**
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

### 11. **GET /elleapi/twt/session/getTitoLore**
- **Purpose**: Get the assigned tito lore for the class's module
- **Notes**: 
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
  "data": str[                // returns the 4 lores associated to loreID
                "loretext1",
                "loretext2",
                "loretext3",
                "loretext4"
              ],              
  "loreID": int               // the loreID that maps 4 lores to it and assigned to this class
```

---

### 12. **GET /elleapi/twt/session/classes**
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

## FOR PROFESSORS

### 13. **POST /elleapi/twt/professor/addModule**
- **Purpose**: makes changes to a module's status on being a tito_module or not
- **Notes**: will automatically populate tito_* tables for this module on success
- **Encoding**: form 
- **Request body** 
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
  "message": "text",
  "data": []                // nothing
}
```

---

### 14. **POST /elleapi/twt/professor/updateModule**
- **Purpose**: enable/disable a tito module for a class
- **Notes**: Can also update start/end dates
- **Encoding**: form 
- **Request body** 
```JSON
{
  "classID": int,
  "moduleID": int,
  "startDate": date,  // optional
  "endDate": date     // optional
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

### 15. **POST /elleapi/twt/professor/updateClassStatus**
- **Purpose**: enable/disable tito status for a class ()
- **Notes**: inserts into tito_class_status if not previously a tito-enrolled class
- **Encoding**: form 
- **Request body** 
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

### 16. **GET /elleapi/twt/professor/getClassUsers**
- **Purpose**: gets a list of all students in class
- **Notes**: 
- **Query Parameters** 
```
{
  ?
  classID={int}
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

### 17. **POST /elleapi/twt/professor/changeAssignedLore**
- **Purpose**: Updating the assigned tito lore
- **Notes**: 
- **Encoding**: json 
- **Request body** 
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

### 18. **POST /elleapi/twt/professor/createNewTitoLore**
- **Purpose**: creates tito lore tied to this user as the owner
- **Notes**: Accepts either 4 separate strings OR a single body parameter that will be split into 4 parts
- **Request body** 
```JSON
{
  // Option 1: Single body parameter (NOT recommended)
  "body": "text content separated by double newlines",
  
  // Option 2: 4 separate parameters
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

### 19. **POST /elleapi/twt/professor/updateTitoLore**
- **Purpose**: Updating a singular tito lore text (1-4)
- **Notes**: 
- **Request body** 
```JSON
{
  "classID": int,
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

### 20. **POST /elleapi/twt/professor/fetchOwnedTitoLore**
- **Purpose**: Returns a list of tuples containing tito lores owned by this user so they can modify them later
- **Notes**: 
- **Request body** 
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

### 21. **GET /elleapi/twt/professor/getStudentMessages**
- **Purpose**: Retrieves user messages according to the provided parameters with the ability to constrain results via date ranges
- **Notes**: dates expected format: str(YYYY-MM-DD)
- **Query Parameters** 
```JSON
{
  "studentID": int,   // 
  "classID": int,     // required
  "moduleID": int,    // 
  "dateFrom": date,   // 
  "dateTo": date      // 
}
```
- **Response**
```JSON
{
  "data": [
    [
      `userID`, 
      `chatbotSID`, 
      `keywordsUsed`, 
      `grammarScore`, 
      `source`,             // user or llm
      `message`, 
      `creationTimestamp`, 
      `isVoiceMessage`,     // has an associated audio message
      `moduleID`, 
      `classID`, 
    ]
  ]
}  
```

---

### 22. **GET /elleapi/twt/professor/generateModule**
- **Purpose**: Returns a list of AI generated terms
- **Notes**: 
- **Query Parameters** 
```JSON
{
  "prompt": str,          // What kind of module to generate
  "termCount": int,       // How many terms to include (more terms require more time to gen)
  "nativeLanguage": str,  // the learning environments local language (typically english)
  "targetLanguage": str,  // what the class is learning
}
```
- **Response**
```JSON
{
  "data": [
            {
                "native_word": "Jaguar",
                "target_word": "leon",
                "part_of_speech": "NN",
                "gender": "M"
            },...
          ]
}  
```

---


### 444. **POST /elleapi/PLACEHOLDER**
- **Purpose**: 
- **Notes**: 
- **Request body** 
```JSON

```
- **Response**
```JSON
{
}  
```
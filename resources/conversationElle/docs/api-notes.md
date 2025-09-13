#### Considering /elleapi/twt/... for the api, less vague
#### /elleapi/tools/... for grammar tools & tokenizer for potential future use, locked for now?

### General notes on API documentation:
---
#### > GET: 
- calls should NOT cause any changes no matter how many times it is called
- Uses query parameters or path parameters:
```
  ?userID=123&classID=456

  /path/to/api/{id}
```
<ul>
  <ul>
    <li>Where query parameters initialize using a `?` then followed by key-value pairings {key-value}</li>
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

## > Creating Responses
- API responses uses the `create_response()` method found in `database.py` to streamline reponses instead of manually making the JSON format every time

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

# ALL API CALLS HERE REQUIRE A JWT TOKEN 

## **API Overview**
   - **Purpose**: A brief description of what the API does.
   - **Base URLs**: URL endpoint for the API `/elleapi/twt/` for core functionality and `/elleapi/tools/` for a multi-purpose shared API library
   - **General Notes**: ALL API endpoints **REQUIRE** a jwt_token: primarily for security AND then for ease of access to `user_id` and `user_permission` which are encoded in the JWT
---

### 1. **GET /elleapi/twt/session/access**
- **Purpose**: Users requests permission from the server to access TWT.
- **Notes**: Client should store the class -> ID pairs locally for ease of access later on.
- **Query Parameters**:
  ```
    None
  ```
- **Returns**:
  ```JSON
  {
    "success": true or false,
    "message": "text",
    "data": []    // Returns a list of tuples -> [(classID, [(moduleID, sequenceOrderofModule)]]
  }
  ```

---

### 2. **POST /elleapi/twt/session/create**
- **Purpose**: Creates a chatbot session to allow the user to send messages to Tito
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
    "data": int,            // returns a single int inside a list, the users chatbot session id
  }
  ```
---

### 3. **POST /elleapi/twt/session/messages**
- **Purpose**: Sends a single user message from the current session to the chatbot and returns the messageID
- **Request body** (JSON):
  ```json
  {
    "chatbotSID": int,          // Permission "token"
    "moduleID": int,            // The currently selected module  
    "message": string,          // The user's message 
    "isVoiceMessage": boolean   // if user will send an audio file after
  }
  ```

- **Response** (JSON):
  ```json
  {
    "success": true or false,
    "message": "text",
    "data": [string],           // the message the user sent (single string)
    "resumeMessaging": boolean, // allows user to send another message (from the front end)
    "messageID": int,           // insertion of new message returns id for the message sent, used in tandem with voice messages 
    "titoResponse": text        // Tito's response to user message
  }
  ```
- **Notes**:
    - API process:
        1. User sends a message
        2. Backend process the message, calls the LLM. (checks for free talk or module-based chat)
        3. The LLM process the user message
        4. The LLM calls the word counting function for terms used that are part of this module. spaCy + DB
        5. Once the backend gets all of this data back, send to front end
        6. Asynchronously grades the users grammar. LanguageTools

---

### 4. **GET twt/session/messages?moduleID={#}**
- **Purpose**: Retrieve a list of chat messages for a user's chat history on a given moduleID.
- **Note**: We can keep a counter for each message that way we dont need unique message IDs (???)
- **Query parameters**:
  ```JSON
  ?
  moduleID={int} // where int is the ID for a tito_module
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
        "value": "Hello, chatbot!",
        "timestamp": "2025-02-20T14:30:00",
        "voiceMessage": true,
      },
      {
        "messageID": 2,
        "moduleID": 2,
        "source": "llm",
        "value": "Hello! How can I assist you today?",
        "timestamp": "2025-02-20T14:30:05",
        "voiceMessage": false,
      },
     ...
    ],    
  }
  ```

---

### 5. **POST /elleapi/twt/session/audio**
- **Purpose**: Uploads a recorded user voice message associated to a message to the server
- **Notes**: File saved with filename pattern -> `{classID}_{userID}_{messageID}.webm`
- **Request body** (JSON)
```JSON
{
  "messageID": int,
  "chatbotSID": int,
  "classID": int,
  "audio": file
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

- **Response:**

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
  "success": true or false,
  "message": "text",
  "data": []               // no data returned
}
```

---

### 7. **GET /elleapi/twt/module/terms**
- **Purpose**: 
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
  "data": [(tuple_1, tuple_2)]            // A list of pairs of tuples are returned (tuple_1 = `termID`, tuple_2 = `front`) 
                                          // front is the table `term`'s word in the foreign language (the target word to be used)
```

---

## FOR PROFESSORS


### 8. **POST /elleapi/twt/professor/classes**
- **Purpose**: Retrieves a list of all classes owned by professor (maybe only tito-enrolled classes?)
- **Notes**: 
- **Query Parameters** 
```JSON
  NONE
```
- **Response**
```JSON
{
  "success": true or false,
  "message": "text",
  "data": int[]               // returns a list of class ids owned by user (the prof)
```

---



### 444. **POST /elleapi/twt/session/create**
- **Purpose**: 
- **Notes**: 
- **Request body** (JSON)
```JSON

```
- **Response**
```JSON
{
  "success": true or false,
  "message": "text",
  "data": int[],
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
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
                    success=True,              # status = success or error, unsure how useful this is tbh
                    message=None,         # information about the transaction
                    data=None,            # information retrieved and to be parsed
                    status_code=200,      # explanatory
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
- Purpose: Users requests permission from the server to access TWT.
- URL Parameters:
```
  None
```
- Returns:
```JSON
{
  "success": true or false,
  "message": "text",
  "data": [],               // Returns a single int in a list, which is the chatbotSessionID
  "status_code": int
}
```

---

### 2. **POST /elleapi/twt/session/create**
- **Purpose**: Creates a chatbot session to allow the user to send messages to Tito
- **Notes**: 
- **Request body** (JSON)
```JSON
  "moduleID": int
```
- **Response**
```JSON
{
  "success": true or false,
  "message": "text",
  "data": int,
  "status_code": int
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
    "data": [string],           // the message the user sent
    "status_code": int,
    "resumeMessaging": boolean, // allows user to send another message (from the front end)
    "messageID": int,
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
  "status_code": int
}
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
  "status_code": int
}
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
  "status_code": int
}
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
  "status_code": int
}
```


### 3. **GET twt/session/messages?moduleID={#}**
- **Purpose**: Retrieve a list of chat messages for a user's chat history on a given moduleID.
- **Note**: We can keep a counter for each message that way we dont need unique message IDs (???)
- **Query parameters**:
  - `moduleID` = `int`.

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
    "status_code": int
    
  }
  ```

- **Error codes**:
  - `404`: Not Found (e.g., no messages found for the given user or chatbot)
  - `500`: Internal Server Error
  - `TO BE DECIDED`: **Extra parameters?**

---

### 5. **POST /elleapi/twt/session/fetch-session-messages**

- **OLD PATH**: /elleapi/chatbot/{userId}{moduleID}
- **Probably ignore the URL params**

- **Purpose**: Get the chatbot session for a specific user, logging purposes and history viewing.
- **URL parameters**:
  - `userId`: (required) The user ID for which to fetch the chatbot.
  - `moduleID`: (required) The moduleID for the the chatbot session

- **Request body** (JSON):
  ```json
  {
    "jwt":        string,
    "userID":     int,
    "chatbotSID": int,
  }
  ```

- **Response** (JSON):
  ```json
  {
    {
      "chatbotSID": 123,
      "userId": 456,
      "moduleID": 789,
      "totalTimeChatted": 15.5,
      "wordsUsed": 1200,
      "moduleWordsUsed": 5000,
      "timestamp": "2025-02-20T14:30:00",
      "grade": 85.7
    }
  }

  If the chatbot session did not exist:

  {
    {
      "chatbotSID": -1
    }
  }
  ```

- **Error codes**:
  - `500`: Internal Server Error

---
### 6. **POST /elleapi/twt/session/update-time**

- **OLD URL**: PATCH /elleapi/chat/chatbot/{chatbotSID}/time
- **Purpose**: Update the total time a user has chatted.
- **Request body** (JSON):
  ```json
  {
    "chatbotSID": int,              # ID of the user
    "timeChatted": float,          # New time chatted for session 
  }
  ```

- **Response** (JSON):
  ```json
  {
    "status": "success",
  }
  ```

- **Error codes**:
  - `400`: Bad Request (e.g., missing fields)
  - `500`: Internal Server Error

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
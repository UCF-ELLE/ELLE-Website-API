#### TODO: Consider /elleapi/chat/messages VS ellapi/messages for all APIs
#### Still a WIP

#### Considering /elleapi/twt/... for the api, less vague
#### /elleapi/tools/... for grammar tools & tokenizer for potential future use, locked for now?

### 1. **API Overview**
   - **Purpose**: A brief description of what the API does.
   - **Base URL**: URL endpoint for the API.
---

### 2. **POST /elleapi/twt/session/send-message**
- **OLD PATH**: /elleapi/chat/messages
- **Purpose**: Sends a user's message from the current session to the chatbot
- **Request body** (JSON):
  ```json
  {
    "userId":       int,         // User's ID
    "chatbotSID":   int,         // Chatbot Session ID
    "moduleID":     int,         // Currently Selected Module ID  
    "userMessage":  string,      // The text message sent by 
  }
  ```

- **Response** (JSON):
  ```json
  { 
    "llmResponse":  String  # What the LLM responded,
    "statusCode":   int     # Success or error?  
  }
  ```
- **Notes**:
    - API process:
        1. User sends a message
        2. Backend process the message, calls the LLM. (checks for free talk or module-based chat)
        3. The LLM process the user message
        4. The LLM calls the grammar function, grades the users grammar. LanguageTools
        5. The LLM calls the word counting function for terms used that are part of this module. spaCy + DB
        6. Once the backend gets all of this data back, send to front end

- **Error codes**:
  - `400`: Bad Request (e.g., missing required fields)
  - `500`: Internal Server Error (e.g., database failure)
  - `xxx`: TBD
---

### 3. **POST /elleapi/twt/session/fetch-messages**

- **OLD PATH**: /elleapi/chat/messages
- **Purpose**: Retrieve a list of chat messages for a user or chatbot to load in the chat history.
- **Note**: We can keep a counter for each message that way we dont need unique message IDs
- **Query parameters**:
  - `userId`: (required) ID of the user to fetch messages for.
  - `chatbotSID`: (required) ID of the chatbot to filter messages.
  - `TO BE DECIDED`: **Extra parameters?**

- **Request body** (JSON):
  ```json
  {
    "jwt":        string,
    "userID":     int,
    "moduleID":   int,
    "classID":    int,
    "chatbotSID": int,
  }
  ```

- **Response** (JSON):
  ```json
  {
    [
      {
        "messageID": 1,
        "moduleID": 2,
        "source": "user",
        "value": "Hello, chatbot!",
        "timestamp": "2025-02-20T14:30:00",
        "voiceMessage": "{voiceMessageID} ",
      },
      {
        "messageID": 2,
        "moduleID": 2,
        "source": "llm",
        "value": "Hello! How can I assist you today?",
        "timestamp": "2025-02-20T14:30:05",
        "voiceMessage": null,
      },
     ...
    ]
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
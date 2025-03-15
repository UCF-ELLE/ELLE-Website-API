#### TODO: Consider /elleapi/chat/messages VS ellapi/messages for all APIs
#### Still a WIP

### 1. **API Overview**
   - **Purpose**: A brief description of what the API does.
   - **Base URL**: URL endpoint for the API.
---

### 2. **POST /elleapi/chat/messages**
- **Purpose**: Saves a users message to the chatbot
- **Request body** (JSON):
  ```json
  {
    "userId":    int,        // User's ID
    "chatbotId": int,        // Chatbot ID
    "moduleId":  int,        // Module ID  
    "source":    string,     // User || LLM
    "value":     string,     // content
  }
  ```

- **Response** (JSON):
  ```json
  { 
    "llmValue":  String  # What the LLM responded,
    "termsUsed": JSON    # Terms the LLM deemed successful(for the used word counter) * see note
    "wordUsed":  int     # Numer of vocab/terms successfully used 
  }
  ```
- **Notes**:
    - We need to decide how the API is gonna send back the following:
        1. User sends a message
        2. Backend process the message, calls the LLM.
        3. The LLM process the user message
        4. The LLM calls the grammar function, grades the users grammar.
        5. The LLM calls the word counting function
        6. Once the backend gets all of this data back, do we send it back
           to the frontend via the POST /chat/message endpoint? Or should the
           frontend call a seperate end point to get termsUsed? Seems easier to
           just send it back in this endpoint since we'll have it availiable.

- **Error codes**:
  - `400`: Bad Request (e.g., missing required fields)
  - `500`: Internal Server Error (e.g., database failure)
---

### 3. **GET /elleapi/chat/messages**

- **Purpose**: Retrieve a list of chat messages for a user or chatbot.
- **Query parameters**:
  - `userId`: (required) ID of the user to fetch messages for.
  - `chatbotId`: (required) ID of the chatbot to filter messages.

- **Response** (JSON):
  ```json
  {
    [
      {
        "id": 1,
        "userId": 101,
        "chatbotId": 10,
        "moduleId": 2,
        "source": "user",
        "value": "Hello, chatbot!",
        "timestamp": "2025-02-20T14:30:00"
      },
      {
        "id": 2,
        "userId": 101,
        "chatbotId": 10,
        "moduleId": 2,
        "source": "llm",
        "value": "Hello! How can I assist you today?",
        "timestamp": "2025-02-20T14:30:05"
      },
     ...
    ]
  }
  ```

- **Error codes**:
  - `404`: Not Found (e.g., no messages found for the given user or chatbot)
  - `500`: Internal Server Error

---

### 5. **GET /elleapi/chatbot/{userId}{moduleId}**

- **Purpose**: Get the chatbot for a specific user.
- **URL parameters**:
  - `userId`: (required) The user ID for which to fetch the chatbot.
  - `moduleId`: (required) The moduleID for the the chatbot session

- **Response** (JSON):
  ```json
  {
    {
      "chatbotId": 123,
      "userId": 456,
      "moduleId": 789,
      "totalTimeChatted": 15.5,
      "wordsUsed": 1200,
      "totalWordsForModule": 5000,
      "grade": 85.7,
      "termsUsed": {"term1": 10, "term2": 5},
      "timestamp": "2025-02-20T14:30:00"
    }
  }

  If the chatbot session did not exist:

  {
    {
      "chatbotId": 123
    }
  }
  ```

- **Error codes**:
  - `500`: Internal Server Error

---
### 6. **PATCH /elleapi/chat/chatbot/{chatbotId}/time**
- **Purpose**: Update the total time a user has chatted.
- **Request body** (JSON):
  ```json
  {
    "chatbotId": int,              # ID of the user
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

### 7. **PATCH /elleapi/chat/chatbot/{chatbotId}/grade**

- **Purpose**: Update the grade for a user.
- **Request body** (JSON):
  ```json
  {
    "user_id": "string",       // ID of the user
    "grade": "number"          // The grade to be updated
  }
  ```

- **Response** (JSON):
  ```json
  {
    "status": "success",
    "message": "Grade updated successfully"
  }
  ```

- **Error codes**:
  - `400`: Bad Request
  - `500`: Internal Server Error

---
### TBD/In Progress
### 8. **GET /elleapi/chat/wordsUsed**

- **Purpose**: Retrieve a JSON object of words used in chats.
- **Response** (JSON):
  ```json
  {
    "status": "success",
    "words_used": {
      "word1": 10, // Word usage count
      "word2": 5
    }
  }
  ```

- **Error codes**:
  - `500`: Internal Server Error

---
### TODO/In Progress
### 9. **GET /elleapi/chat/incorrect-word**

- **Purpose**: Report a word used incorrectly.
- **Request body** (JSON):
  ```json
  {
  }
  ```

- **Response** (JSON):
  ```json
  {
  }
  ```

- **Error codes**:
  - `400`: Bad Request
  - `500`: Internal Server Error

---

### 10. **GET /elleapi/chat/word-analytics**

- **Purpose**: Retrieve word analytics (e.g. correctness, timesUsed, etc).
- **Response** (JSON):
  ```json
  {
    "status": "success",
    "word_analytics": {}
  }
  ```

- **Error codes**:
  - `500`: Internal Server Error

---



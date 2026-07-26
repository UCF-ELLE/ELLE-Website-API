# Talking With Tito (TWT) - Backend Documentation

This document explains the architecture, directories, files, and core workflows of the **Talking With Tito (TWT)** backend. It is designed to help future groups quickly understand and extend the TWT backend codebase.

---

## 1. High-Level Architecture

The TWT backend is integrated into the core Flask-based **ELLE API**. It interacts with three main external entities:
1. **MySQL Database**: Stores chat histories, vocabulary lists, session info, and vocabulary usage progress.
2. **LanguageTool Server**: An external Java/HTTP service used to detect grammatical/spelling errors in student messages.
3. **Llama-Server (`llama.cpp`)**: Runs the Large Language Model (LLM) loaded with the Tito model to generate contextual Spanish/French/Portuguese responses.

### Data Flow Diagram
```
    ┌────────────────┐
    │  React Frontend│
    └───────┬────────┘
            │ HTTP Request (e.g., /twt/session/messages)
            ▼
    ┌────────────────┐       Grading Request       ┌────────────────┐
    │  Flask Server  ├────────────────────────────►│  LanguageTool  │
    │  (ELLE API)    │◄────────────────────────────┤  Grammar API   │
    └───────┬────────┘      Grammar Score/Errors   └────────────────┘
            │
            ├───────────────┐
            │               │ Queue Message
            ▼               ▼
    ┌───────────────┐  ┌───────────────┐
    │ Llama Server  │  │ Background    │ (SpaCy & Aho-Corasick)
    │ (LLM Engine)  │  │ SpaCy Worker  │
    └───────┬───────┘  └───────┬───────┘
            │                  │
            │ Tito Response    │ Increment Vocab Progress
            ▼                  ▼
    ┌──────────────────────────────────┐
    │          MySQL Database          │
    └──────────────────────────────────┘
```

---

## 2. File Directory Breakdown

All TWT-related backend files reside in `resources/conversationElle/`. Below is a breakdown of the key files and their responsibilities:

### 📄 `config.py`
Contains configuration constants for the TWT feature:
- `TWT_ENABLED`: Global boolean flag to enable or disable the Tito feature set.
- `LANGUAGETOOL_API_URL`: The URL endpoint for the local/remote LanguageTool grammar API.
- `SPACY_MODELS`: A dictionary mapping supported language codes (e.g., `es`, `fr`, `pt`) to their corresponding pre-trained spaCy pipeline packages.
- Constants for audio size/length limits, session timeouts, and default modules.

### 📄 `conversation.py`
Defines the **Flask-RESTful API Resources** (routing endpoints). It acts as the gateway between the React frontend and the python database/processing layers. Major resources include:
- `ChatbotSessions`: Handles session creation and termination.
- `UserMessages`: Accepts user chat inputs, coordinates grading, queues the message for vocabulary tracking, and initiates LLM prompt generation.
- `TitoMessages`: Logs Tito's response back to the database.
- `GetTermProgress`: Retrieves (and resets via POST) vocabulary usage counts.
- `GetModuleProgress`: Gets overall module mastery percentage.

### 📄 `database.py`
Contains all **SQL queries and operations** directly modifying the MySQL database tables. Key functions:
- `createNewChatbotSession()`: Spawns a new session and pre-populates `tito_term_progress` with vocabulary terms.
- `getTermProgress()` / `resetTermProgress()`: Gets or resets vocabulary term scores/uses for a session.
- `updateWordsUsed()`: Increments usage counts for matched vocabulary terms.
- `fetchSessionChatHistory()`: Retrieves clean conversation histories.

### 📄 `convo_grader.py`
Interacts with the **LanguageTool API** to parse grammar:
- `suggest_grade(message, language)`: Takes a user's text message and the target language code, checks it against spelling/grammatical rules, calculates a numeric grade (0-10) based on error rates, and returns the corrections list, errors list, and suggested grade.

### 📄 `spacy_service.py`
Manages **asynchronous vocabulary term tracking**:
- Spawns a daemon worker thread (`spacy_service`) that continuously polls `MESSAGE_QUEUE`.
- Processes messages using **spaCy** pipelines (for lemmatization) and **Aho-Corasick Automata** (for fast substring matching) to detect if a student used a target vocabulary word in their sentence.
- If matches are found and `update_db` is `True`, it calls `updateWordsUsed()` in `database.py` to write progress to the database.

### 📄 `llm_functions.py`
Coordinates context windowing and **LLM inference**:
- Fetches past message history to assemble a prompt context.
- Inject system prompts containing Tito's persona instructions, the current language rules, and the target vocabulary terms.
- Sends the prompt payload to the `llama.cpp` server and returns the generated response.

### 📄 `tito_methods.py`
Houses general utility and audio processing helpers (e.g. converting and merging user speech files).

---

## 3. Message Lifecycle Flow

When a user types a message and clicks "Send", the following sequence executes:

```
[1] Frontend POSTs to `/elleapi/twt/session/messages`
     │
     ▼
[2] `UserMessages.post` in `conversation.py` receives request
     │
     ├─► [3] Call `grade_message()` in `convo_grader.py`
     │        └─► Calls LanguageTool API to get grammar score and corrections list
     │
     ├─► [4] Call `createNewUserMessage()` in `database.py`
     │        └─► Writes the user's message and grammar metadata to the `messages` table
     │
     ├─► [5] Call `add_message()` in `spacy_service.py` (Asynchronous)
     │        └─► Puts message on the `MESSAGE_QUEUE` queue
     │        └─► Worker parses the text, matches it with vocab terms, and updates `tito_term_progress`
     │
     └─► [6] Calls the LLM to generate Tito's reply
              └─► Calls `handle_message_with_context()` in `llm_functions.py`
              └─► Posts payload to llama-server, gets the raw output, and returns it to Frontend
```

---

## 4. Registering Endpoints (`__init__.py`)

To make these endpoints accessible, they must be registered in the root-level `__init__.py` file:
- Resources are imported at the top of the file:
  `from resources.conversationElle.conversation import TitoAccess, ChatbotSessions, ...`
- Resources are registered under the API routing block:
  `api.add_resource(UserMessages, API_ENDPOINT_PREFIX + "twt/session/messages")`

---

## 5. Recommended Backend Improvements

Here are identified technical gaps and recommended improvements for future groups to optimize the TWT backend performance and reliability:

### 1. Robust LLM Server Lifespan and Cache Eviction
- **The Issue**: The Llama LLM server (`llama.cpp`) currently undergoes daily hard restarts because context caching bloats RAM usage over time, and it occasionally becomes unresponsive after periods of inactivity.
- **Recommendation**:
  - Configure `llama.cpp`'s slot allocations and dynamic cache eviction policies (`--ctx-size` configuration parameters) so that old conversation slots are automatically recycled when memory limits are reached.
  - Implement a lightweight python cron-job or server keep-alive ping script that periodically hits the llama server (e.g. once every few hours) to prevent it from slipping into sleep/unresponsive states, avoiding cold-start delays for students.

### 2. Lazy Model Loading & Memory Management in SpaCy
- **The Issue**: Language models (like French and Portuguese spaCy packages) are loaded into memory synchronously when the user switches to a module of that language. This can introduce latency on the very first message processed.
- **Recommendation**:
  - Pre-load supported language models asynchronously in background threads when the Flask app initializes.
  - Implement a simple LRU (Least Recently Used) cache wrapper for `NLP` pipelines so that if system RAM reaches a certain threshold, infrequently used language models are unloaded from memory.

### 3. Migrating Business Logic out of SQL Triggers
- **The Issue**: Critical calculations (such as updating overall module progress and marking terms as mastered) are handled directly via MySQL triggers (e.g. `afterUpdateTermProgress_change_termsMastered`). SQL triggers are hard to version-control, test, or troubleshoot.
- **Recommendation**:
  - Migrate this progress and mastery calculation logic into transactional Python service handlers inside `database.py`.
  - Use database migration tools (like Alembic) to cleanly track schema modifications rather than raw script imports.

- **Recommendation**:
  - Replace the custom thread pool in `spacy_service.py` with a simple task-queue system (like Celery or Redis Queue) to manage background processes with automatic retries and dead-letter queue support.

---

## 6. Existing API Documentation (Postman)

Before making any modifications to the backend or creating new API calls, it is highly recommended to review the existing API endpoints. The ELLE ecosystem, including all user management, module generation, and Tito conversational endpoints, is documented via Postman.

You can view the live, interactive API documentation here:
**[ELLE 2023 API Documentation (Postman)](https://documenter.getpostman.com/view/25426921/2s93JnT6RM)**

This documentation contains all request payloads, HTTP methods (GET, POST, PUT, DELETE), and expected JSON responses for both legacy and newly refactored endpoints.

---

## 7. How to Create a New API Endpoint (Step-by-Step Tutorial)

Follow these steps to create a new backend API endpoint and connect it to the React frontend:

### Step 1: Create Database Operations (Optional)
If your API interacts with the database, define a query function in `resources/conversationElle/database.py`:
```python
def deleteTitoCustomSetting(user_id: int, setting_key: str):
    query = "DELETE FROM tito_settings WHERE userID = %s AND settingKey = %s;"
    db.post(query, (user_id, setting_key))
```

### Step 2: Define the REST Resource Class
Open `resources/conversationElle/conversation.py` and create a subclass of `Resource`:
```python
class TitoDeleteSetting(Resource):
    @jwt_required  # Forces JWT token verification
    def post(self):
        user_id = get_jwt_identity() # Extracts userID from token claims
        
        # Parse arguments from JSON body
        data = request.get_json(silent=True) or request.form
        setting_key = data.get('settingKey')
        
        if not setting_key:
            return create_response(False, message="settingKey is required", status_code=400)
            
        deleteTitoCustomSetting(user_id, setting_key)
        return create_response(True, message="Setting deleted successfully.")
```

### Step 3: Register the URL Route
Open the root `__init__.py` file:
1. Import the class:
   ```python
   from resources.conversationElle.conversation import TitoDeleteSetting
   ```
2. Bind the class to a route under `API_ENDPOINT_PREFIX`:
   ```python
   api.add_resource(TitoDeleteSetting, API_ENDPOINT_PREFIX + "twt/session/deleteSetting")
   ```

### Step 4: Add the Service Function on the Frontend
Open `templates/services/TitoService.tsx` and write the API call:
```typescript
export const deleteSetting = async (access_token: string, settingKey: string): Promise<boolean> => {
  try {
    const response = await axios.post(`${ELLE_URL}/twt/session/deleteSetting`, {
      settingKey
    }, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    return response.data.success || false;
  } catch (error) {
    handleError(error);
    return false;
  }
};
```
Now, you can import and call `deleteSetting()` inside any of your React components (like `ChatScreen.tsx` or `Settings.tsx`).
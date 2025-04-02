# ConversAItionELLE Backend Documentation

The backend receives data JSON files directly from the frontend via [conversation.py](conversation.py).

All code related to accessing/storing to the MySQL database is found in [database.py](database.py).

Code related to the LLM calls are found in [llm_functions.py](llm_functions.py).

Code related to configuring the LLM calls (prompts, generation path, generation variables, etc.) are found in [config.py](config.py).

[utils.py](utils.py) contains various utility functions used in the backend.

[ecosystem.config.js](ecosystem.config.js) and [loading_qwen.py](loading_qwen.py) are used for LLM setup.
Please do not touch these files unless you know what you are doing.

# LLM Instructions

To START the LLM in CHDR:
```bash
pm2 start ecosystem.config.js
```

To POST a message to Tito (LLM chatbot) from TERMINAL use the following command. (Testing purposes only)

```bash
curl -X POST "http://10.200.8.216:8000/generate" \
-H "Content-Type: application/json" \
-d '{
    "user_text": "Hola, tito!",
    "max_new_tokens": 50,
    "temperature": 0.7,
    "top_k": 50,
    "top_p": 0.9
}'
```

Call tito from terminal:

curl -X POST "http://10.200.8.216:8000/generate" \
-H "Content-Type: application/json" \
-d '{
    "user_text": "Hola, tito!",
    "max_new_tokens": 50,
    "temperature": 0.7,
    "top_k": 50,
    "top_p": 0.9
}'
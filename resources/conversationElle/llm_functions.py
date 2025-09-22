from datetime import datetime
from pydantic import BaseModel
from config import *
from convo_grader import *
import language_tool_python
import ast
import re
import json
import sys
import os
import requests 

# tool = None
# current_language = 'en-US'
# #user_language_history = defaultdict(list)

# Defining the API request and response formats, format was created for use with llama.cpp
def GenerateRequest(user_text, max_new_tokens=MAX_NEW_TOKENS, temperature=TEMPERATURE, top_k=TOP_K, top_p=TOP_P):
    return {
        "prompt": user_text,
        "n_predict": max_new_tokens,
        "temperature": temperature,
        "top_k": top_k,
        "top_p": top_p,
        "stop": ["User:", "\nUser:", "Instruction"],
        "stream": False
    }


def generate_message(message, prompt):
    """
    Sends API request to the running llama.cpp server.
    """
    full_prompt = f"Instruction: {prompt}\nUser: {message}\nAssistant:"
    request = GenerateRequest(user_text=full_prompt)
    #print("request: ", request)

    try:
        response = requests.post(model_path, json=request, timeout=30)
        response.raise_for_status()  # Raise an exception for bad status codes
        response_data = response.json()
        #print("LLM response: ", response_data)
        
        # llama.cpp returns response in "content" field
        if "content" in response_data:
            return response_data["content"]
        else:
            # Fallback for different response formats
            return str(response_data)
            
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return "Sorry, I'm having trouble connecting to the language model."
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        return "Sorry, I received an invalid response from the language model."

def handle_message(message: str, prompt=None):
    """
    Handles the incoming message and generates a response using the LLM.
    """
    try:
        if prompt == None:
            prompt = main_prompt

        response = generate_message(message, prompt)
        response = response[response.index("{"):response.index("}")+1]
        response = ast.literal_eval(response)
        #print("returned message: ", response)
    except Exception as e:
        print(e)
        return {"response" : "Sorry, Tito could not understand your message! Please try again."}
    
    return response
        

def detect_innapropriate_language(message: str):
    """
    Safety filter for educational environment.
    """

    try:
        response = generate_message(message, content_filter_prompt)
        response = response["Assistant"]
        response = response[response.index("{"):response.index("}")+1]
        response = ast.literal_eval(response)
        
        return {
            "is_appropriate": response.get("appropriate", True),
            "reason": response.get("reason", ""),
            "severity": response.get("severity", "low")
        }
        
    except Exception as e:
        print(f"Content filter error: {e}")
        # Default to appropriate if filter fails
        return {
            "is_appropriate": True,
            "reason": "",
            "severity": "low"
        }

def getUserBackgroundandMusic(vocab_list: str):
    """
    Returns a filename in the background folder and music folder
    with the name that is the most similar to the words in the vocab list.
    """
    try:
        response = generate_message(vocab_list, background_music_prompt)
        
        # clean response
        response = response["Assistant"]
        response = response[response.index("{"):response.index("}")+1]
        response = ast.literal_eval(response)
        
    except Exception as e:
        return background_files[0], music_files[0]

    return response["background_file"], response["music_file"]

from datetime import datetime
from pydantic import BaseModel
from .config import *
from config import FREE_CHAT_MODULE
from .database import getModuleTerms, getModuleLanguage
# from .convo_grader import *
import ast
import re
import json
import sys
import os
import requests 
import threading

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


def prewarm_llm_context(module_id, session_id):
    """
    Pre-warm the LLM with module context so first real message is fast.
    Sends a dummy message to cache the prompt.
    """
    # Determines what prompt to use based on module ID
    try: 
        if module_id == FREE_CHAT_MODULE or module_id is None:
            base_prompt = free_prompt
        else:
            base_prompt = main_prompt


            # If module is not a free chat then acquire language and vocab to pass into prompt
            try:
               terms = getModuleTerms(module_id)
               language = getModuleLanguage(module_id)

               if terms and language:
                    vocab_list = [term[1] for term in terms[:20]]
                    vocab_context = ", ".join(vocab_list)
                    base_prompt = f"""{base_prompt}
                    Context: Student learning {language[0]}. Key vocab: {vocab_context}
                    , When a vocab word remark that you remember more and thank for reminding"""

            except Exception as error:
                print(f"Could not load module context: {error}")

        # Short "warming" message for LLM
        warming_message = "Hi"
        full_prompt = f"{base_prompt}\n\nStudent: {warming_message}\n\nTito:"

        request = GenerateRequest(user_text = full_prompt, max_new_tokens = 10) # Uses minimal tokens
        response = requests.post(model_path, json=request, timeout = 30)

        if response.status_code == 200:
            print(f" Pre-Warmed LLM context for module {module_id} (session {session_id})")
        else:
            print(f"Pre-warming got status {response.status_code}")

    except Exception as error:
        print(f"Pre-warming falied: {error}")


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

def handle_message(message: str, module_id: int = None, prompt=None):
    """
    Handles the incoming message and generates a response using the LLM.
    """
    try:
        if module_id == FREE_CHAT_MODULE or module_id is None:
            if prompt is None:
                prompt = free_prompt
        else:
            if prompt is None:
                prompt = main_prompt

        response = generate_message(message, prompt)
        response = response.strip()

        print(f"[DEBUG] Raw LLM response: {response}")
        
        # Try to find JSON in the response
        # if "{" in response and "}" in response:
        #     json_start = response.index("{")
        #     json_end = response.index("}") + 1
        #     json_response = response[json_start:json_end]
        #     print(f"[DEBUG] Extracted JSON: {json_response}")
        #     parsed_response = ast.literal_eval(json_response)
        #     print(f"[DEBUG] Parsed response: {parsed_response}")
        #     return parsed_response
        # else:
        #     # No JSON found, create a response from the raw text
        #     print(f"[DEBUG] No JSON found, using raw response")
        #     clean_response = response.strip()
        #     return {"response": clean_response}
            
    except Exception as e:
        print(f"[DEBUG] Exception in handle_message: {e}")
        print(f"[DEBUG] Raw response was: {response if 'response' in locals() else 'No response'}")
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



# TODO: Figure out about
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

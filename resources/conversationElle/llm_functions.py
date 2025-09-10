from datetime import datetime
from pydantic import BaseModel
from resources.conversationElle.config import *
import language_tool_python
import ast
import re
import json
import sys
import os
import requests 

tool = None
current_language = 'en-US'
user_language_history = defaultdict(list)


LANGUAGE_MAPPINGS = {
    'english': 'en-US',
    'spanish': 'es',
    'french': 'fr', 
    'portuguese': 'pt',
}

# Defining the API request and response formats.
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


def init_language_cache(default_language = current_language):
    """
    Initializes LanguageTool cache with the defualt language
    If more languages available, more can be added as needed
    """

    global tool_cache, current_language
    try:
        tool_cache[default_language] = language_tool_python.LanguageTool(default_language)
        current_language = default_language
        print(f"LanguageTool cache initialized with {defualt_language}")
    except Exception as error:
        print(f"Failed to initialize LanguageTool cache: {error}")

def get_or_create_language_tool(language_tool):
    """
    Get existing LanguageTool instance or create a new one for language
    """
    global tool_cache

    if language_code not in tool_cache:
        try:
            print(f"Creating new LanguageTool instance for {language_code}")
            tool_cache[language_code] = language_tool_python.LanguageTool(language_code)
        except Exception as error:
            print(f"Failed to create LanguageTool for {language_code}: {error}")
            return tool_cache.get('en-US') # Fallsback to english




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
            return {"Assistant": response_data["content"]}
        else:
            # Fallback for different response formats
            return {"Assistant": str(response_data)}
            
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return {"Assistant": "Sorry, I'm having trouble connecting to the language model."}
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        return {"Assistant": "Sorry, I received an invalid response from the language model."}


def assess_grammar(message: str, target_language: str = None):
    """
    Evaluates grammar correctness in the user's message.
    Returns grammar score and specific corrections.
    """

    try:
        grammar_prompt = grammar_assessment_prompt.format(
            target_language = target_language or "the target language",
            message = message
        )

        response = generate_message(message, grammar_prompt)
        response = response['Assistant']

        #Extract Json
        response = response[response.index("{"):response.index("}") + 1]
        response = ast.literal_eval(response)

        return {
            "grammar_score": response.get("grammar_score", 0),
            "corrections": response.get("corrections", []),
            "feedback": response.get("feedback", "")
        }

    except Exception as error:
        print(f"Grammar assessment error: {error}")
        return {
            "grammar_score": 0,
            "corrections": [],
            "feedback": "Could not assess grammar."
        }


def evaluate_language_level(conversation_history: list):
    """
    Assesses user's current proficiency based on conversation history.
    """

    try:
        # Prepare context
        conversation_text = ""
        for msg in conversation_history[-10]:
            if msg.get('source') == user:
                conversation_text += f"User: {msg.get('value', '')}\n"
        
        response = generate_message(conversation_text, language_level_prompt)
        response = response["Assistant"]
        response = response[response.index("{"):response.index("}")+1]
        response = ast.literal_eval(response)

        return {
            "level": response.get("level", "beginner"),
            "confidence": response.get("confidence", 0.5),
            "recommendations": response.get("recommendations", [])
        }

    except Exception as error:
        print(f"Language level evaluation error: {error}")
        return {
            "level": "beginner",
            "confidence": 0.5,
            "recommendations": ["Continue beginner vocab"]
        }


# Not used since LLM generation speed is slow
def identify_language(message: str):
    """
    Identifies the language of the user input.
    """
    return generate_message(message, identify_language_prompt)

def handle_message(message: str, prompt=None):
    """
    Handles the incoming message and generates a response using the LLM.
    """
    try:
        if prompt == None:
            prompt = main_prompt
        response = generate_message(message, prompt)
        response = response["Assistant"]
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

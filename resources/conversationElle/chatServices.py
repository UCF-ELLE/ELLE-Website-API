from datetime import datetime
from fastapi import FastAPI, HTTPException
from transformers import AutoModelForCausalLM, AutoTokenizer
from safetensors.torch import load_file
from pydantic import BaseModel
#from config import MAX_NEW_TOKENS, TEMPERATURE, TOP_K, TOP_P, model_path, main_prompt, device, music_prompt, vocab_list, background_prompt
from config import MAX_NEW_TOKENS, TEMPERATURE, TOP_K, TOP_P, model_path, main_prompt, device
import re
import json
import sys
import os
import llm_functions
import requests
import torch
import uvicorn
import logging

# Logging: does not work on CHDR server (perm issues).
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Global Variables.
app = FastAPI()
logger.info("Loading model...")
tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
model = AutoModelForCausalLM.from_pretrained(model_path, local_files_only=True, use_safetensors=True)
logger.info("Model and tokenizer loaded successfully.")
conversation_log = []

# Defining the API request and response formats.
class GenerateRequest(BaseModel):
    user_text: str
    max_new_tokens: int = MAX_NEW_TOKENS
    temperature: float = TEMPERATURE
    top_k: int = TOP_K
    top_p: float = TOP_P

class GenerateResponse(BaseModel):
    generated_text: str

def createNewChatbot(data):
    # Return choice of background.
    '''
    full_prompt = f"Instruction: {background_prompt}\nUser: {vocab_list}\nAssistant:"
    inputs = tokenizer(full_prompt, return_tensors="pt").to(device)

    with torch.no_grad():
        outputs = model.generate(
            inputs["input_ids"],
            max_new_tokens=MAX_NEW_TOKENS,
            temperature=TEMPERATURE,
            top_k=TOP_K,
            top_p=TOP_P,
            do_sample=True
        )
    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    chosen_background = GenerateResponse(generated_text=generated_text)

    # Return choice of music.
    full_prompt = f"Instruction: {music_prompt}\nUser: {vocab_list}\nAssistant:"
    inputs = tokenizer(full_prompt, return_tensors="pt").to(device)

    with torch.no_grad():
        outputs = model.generate(
            inputs["input_ids"],
            max_new_tokens=MAX_NEW_TOKENS,
            temperature=TEMPERATURE,
            top_k=TOP_K,
            top_p=TOP_P,
            do_sample=True
        )
    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    chosen_music = GenerateResponse(generated_text=generated_text)'''

    #connect with LLM LATER HERE.
    response = "Hola soy Tito"

    #append_new_message('llm', response)
    
    #return {'reply': response, 'background': chosen_background, 'music': chosen_music}
    return {'reply': response}

def handle_message(message: str) -> GenerateResponse:
    """
    Handles the incoming message and generates a response using the LLM.
    """
    logger.info(f"Processing message: {message}")

    request = GenerateRequest(
        user_text=message,
        max_new_tokens=MAX_NEW_TOKENS,
        temperature=TEMPERATURE,
        top_k=TOP_K,
        top_p=TOP_P
    )

    # Construct the full prompt
    full_prompt = f"Instruction: {main_prompt}\nUser: {request.user_text}\nAssistant:"
    inputs = tokenizer(full_prompt, return_tensors="pt").to(device)

    try:
        with torch.no_grad():
            outputs = model.generate(
                inputs["input_ids"],
                max_new_tokens=request.max_new_tokens,
                temperature=request.temperature,
                top_k=request.top_k,
                top_p=request.top_p,
                do_sample=True
            )

        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        response_data = GenerateResponse(assistant_text=generated_text)
        logger.info(f"Generated response: {response_data}")
        return response_data
    except Exception as e:
        logger.error(f"Error generating response: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate response")

def append_new_message(sender_type: str, message: str):
    """
    Appends a new message to the conversation log (optional).
    """
    new_message = {
        "sender": sender_type,
        "text": message,
        "timestamp": datetime.utcnow().isoformat()
    }
    conversation_log.append(new_message)
    logger.info(f"New message logged: {new_message}")

def log_thoughts(user_prompt: str, llm_thought: str, text_response: str):
    """
    Logs the LLM's thoughts and responses for debugging (optional).
    """
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "user_prompt": user_prompt,
        "llm_thought": llm_thought,
        "text_response": text_response
    }
    logger.info(f"Thoughts logged: {log_entry}")

# Root endpoint to test if the server is up
@app.get("/")
async def root():
    return {"message": "Hola soy Tito!"}

# Endpoint to generate text using the LLM
@app.post("/generate", response_model=GenerateResponse)
async def generate_text(request: GenerateRequest):
    """
    Generates text based on the user's input using the LLM.
    """
    try:
        instruction_text = main_prompt
        user = request.user_text

        instruction_tokens = tokenizer.encode(instruction_text, return_tensors="pt").to(device)
        user_tokens = tokenizer.encode(user, return_tensors="pt").to(device)

        input_ids = torch.cat([instruction_tokens, user_tokens], dim=-1)

        with torch.no_grad():
            outputs = model.generate(
                input_ids,
                max_new_tokens=request.max_new_tokens,
                temperature=request.temperature,
                top_k=request.top_k,
                top_p=request.top_p,
                do_sample=True
            )

        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        assistant_response = generated_text.split(user)[-1].strip()

        append_new_message("user", user)
        append_new_message("assistant", assistant_response)

        return GenerateResponse(assistant_text=assistant_response)
    except Exception as e:
        logger.error(f"Error in /generate endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Run the server
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
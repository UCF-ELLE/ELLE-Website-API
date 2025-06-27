from fastapi import FastAPI, HTTPException
from transformers import AutoModelForCausalLM, AutoTokenizer
from pathlib import Path
from pydantic import BaseModel
import os
import torch

# Path to the model checkpoint
curr_path = os.path.abspath(__file__)
curr_dir = os.path.dirname(curr_path)
par_dir = str(Path(curr_dir).parent)
os.chdir(par_dir)
# model_path = os.path.join(par_dir, "Qwen-3B")
model_path = "Qwen/Qwen3-4B"


# Variables important for accessing the LLM.
app = FastAPI()
print("Loading model...")
tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
model = AutoModelForCausalLM.from_pretrained(model_path, local_files_only=True, use_safetensors=True)
print("Model finished loading...")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Device: ", device)

@app.post("/generate")
async def generate(data: dict):
    print(data)
    inputs = tokenizer(data["user_text"], return_tensors="pt").to(device)
    
    try:
        with torch.no_grad():
            outputs = model.generate(
                inputs["input_ids"], 
                attention_mask=inputs["attention_mask"],
                max_new_tokens = data["max_new_tokens"],
                temperature = data["temperature"],
                top_k = data["top_k"],
                top_p = data["top_p"]
            )  
        
        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # # Return in JSON format
        response = {}
        gen_list = generated_text.split("\n")
        for item in gen_list:
            dict_key = item[:item.index(":")]
            dict_value = item[item.index(":")+2:]
            response[dict_key] = dict_value
        print(response)
        return response
        # return {"output": generated_text}

    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# For calling the llm in the terminal using: python3 loading_qwen.py
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

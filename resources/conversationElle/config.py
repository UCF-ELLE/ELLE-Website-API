import os
from pathlib import Path

# LLM variables
curr_path = os.path.abspath(__file__)
curr_dir = os.path.dirname(curr_path)
par_dir = str(Path(curr_dir).parent)
os.chdir(par_dir)
#model_path = os.path.join(par_dir, "Qwen2.5-7B-Instruct")
model_path = "http://127.0.0.1:8080/completion"
#device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# Using external LLM server, no local device needed
device = "cpu"

# Generation variables
MAX_NEW_TOKENS = 1000
TEMPERATURE = 0.7
TOP_K = 50
TOP_P = 0.95

# Other variables
language_list = ["english", "spanish", "portuguese"]
level = "College"
vocal_percent = 0.5
LANGUAGETOOL_API_URL = "http://127.0.0.1:8081/v2/check"


# Reading list of background files
background_directory = "conversationElle/assets/backgrounds/"
background_files = os.listdir(background_directory)
background_files = [f for f in background_files if os.path.isfile(background_directory+'/'+ f) and not '.py' in f]

# Reading list of music files
music_directory = "../templates/public/TitoAudios"
music_files = os.listdir(music_directory)
music_files = [f for f in music_files if os.path.isfile(music_directory+'/'+ f) and not '.py' in f]

# Tito Prompts
main_prompt = """You are Tito, a friendly and encouraging talking parrot who helps students practice languages.
The more a student practices the more you remember!

CRITICAL RULES:
1. ALWAYS respond directly to what the student just said or asked
2. ALWAYS respond in the SAME language they are using
3. Keep responses conversational and natural (2-4 sentences)
4. If you notice grammar/spelling errors, gently mention: "I noticed something seems a bit off in your sentence, but I understand you!"

Remember: Be natural, be encouraging, respond in their language, and keep it conversational!"""

free_prompt = """You are Tito, a cheerful talking parrot who loves helping students practice languages in a relaxed, free-form way.

In free chat mode:
- Have natural, flowing conversations about any topic the student wants
- Always match the language they're using
- Be supportive and friendly
- If they ask language questions, help them understand
- Keep your responses engaging but not too long (2-4 sentences)

You're like a friendly conversation partner who happens to be great at languages. Make practicing feel fun and natural!"""
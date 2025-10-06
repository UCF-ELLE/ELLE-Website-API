import requests
from config import LANGUAGETOOL_API_URL

# LANGUAGE_MAPPINGS = {
#     'english': 'en-US',
#     'spanish': 'es',
#     'french': 'fr',
#     'portuguese': 'pt',
# }

def get_letter_grade(score):
    """Convert numeric score to letter grade"""
    if score >= 9.5:
        return "A+"
    elif score >= 9:
        return "A"
    elif score >= 8:
        return "B"
    elif score >= 7:
        return "C"
    elif score >= 6:
        return "D"
    else:
        return "F"

def suggest_grade(message: str, expected_language: str = None):
    """
    Use LanguageTool API for language dectection and grammar checking.
    """

    try:
        data = {
            'text': message,
            'enabledOnly': 'false'
        }

        # if expected_language and expected_language.lower() in LANGUAGE_MAPPINGS:
        #     language_code = LANGUAGE_MAPPINGS[expected_language.lower()]
        #     data['language'] = language_code
        #     print(f"Using specified language: {expected_language}")
        # else:
        data['language'] = 'auto'
        print("Using LanguageTool auto-detection")

        response = requests.post(LANGUAGETOOL_API_URL, data = data, timeout = 10)
        response.raise_for_status()

        result = response.json()

        detected_language_info = result.get('language', {})
        detected_name = detected_language_info.get('name', 'Unknown')
        detected_code = detected_language_info.get('code', 'en-US')

        matches = result.get('matches', [])
        total_words = len(message.split())
        error_count = len(matches)

        if total_words == 0:
            grade_score = 0.0
        else:
            error_rate = error_count / total_words

            if error_rate == 0: # No errors (A+)
                grade_score = 100.0
            elif error_rate < 0.10:  # Less than 10% errors (A)
                grade_score = 90.0
            elif error_rate < 0.20:  # Less than 20% errors (B)
                grade_score = 80.0
            elif error_rate < 0.30:  # Less than 30% errors (C)
                grade_score = 70.0
            elif error_rate < 0.40:  # Less than 40% errors (D)
                grade_score = 60.0
            else:
                grade_score = 50.0 # Less than 50% errors (F)

        detected_language_info = result.get('language', {})
        detected_name = detected_language_info.get('name', 'Unknown')

        return {
            "suggested_grade": round(grade_score, 1),
            "letter_grade": get_letter_grade(grade_score),
            "error_count": error_count,
            "total_words": total_words,
            "detected_language": detected_name,
            "errors": matches,
            "status": "success"
        }

    except requests.exceptions.Timeout:
        return {
            "suggested_grade": 0,
            "letter_grade": "NA",
            "error_count": 0,
            "total_words": len(message.split()),
            "detected_language": "Unknown",
            "status": "timeout"
        }
    except Exception as error:
        print(f"Grade suggestion error: {error}")
        return {
            "suggested_grade": 0,
            "letter_grade": "NA",
            "error_count": 0,
            "total_words": len(message.split()),
            "detected_language": "Unknown",
            "status": "timeout"
        }



# grader testing
if __name__ == "__main__":
    test_texts = [
        ("Hello, my name is John and I am twenty years old.", "english"), # Counts this as wrong not entirely sure why
        ("Hello, my name are John and I am twenty year old.", "english"),
        ("Hola, me llamo María y tengo veinte años.", "spanish"),
        ("Hola, me llamas María y tengo veinte año.", "spanish"),
        ("Bonjour, je m'appelle Pierre.", "french"),
        ("Hello como estas today?", None),  # Auto-detect
    ]
    
    print("=== Simple LanguageTool Grade Suggester ===")
    print(f"Using local server: {LANGUAGETOOL_API_URL}")
    print("-" * 60)
    
    for text, lang in test_texts:
        print(f"\nText: {text}")
        print(f"Expected: {lang or 'auto-detect'}")
        
        result = suggest_grade(text, lang)
        
        if result['status'] == 'success':
            print(f"✅ Grade: {result['suggested_grade']}/10 ({result['letter_grade']})")
            print(f"   Errors: {result['error_count']}/{result['total_words']} words")
            print(f"   Language: {result['detected_language']}")
        else:
            print(f"❌ {result['status'].title()}: {result.get('message', 'Error occurred')}")
    
    print(f"\n{'='*60}")
    print("Usage: result = suggest_grade('Your text here', 'spanish')")
    print("Returns: {'suggested_grade': 8.5, 'letter_grade': 'A', ...}")
    


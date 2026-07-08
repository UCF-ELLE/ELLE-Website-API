import requests
from config import LANGUAGETOOL_API_URL

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

def suggest_grade(message: str, language: str = "auto"):
    """
    Use LanguageTool API for language dectection and grammar checking.
    """

    try:
        data = {
            'text': message,
            'language': language,
            'enabledOnly': 'false'
        }

        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        print("Using LanguageTool auto-detection")

        response = requests.post(LANGUAGETOOL_API_URL, data = data, headers=headers, timeout = 10)
        response.raise_for_status()

        result = response.json()

        detected_language_info = result.get('language', {})
        detected_name = detected_language_info.get('name', 'Unknown')

        matches = result.get('matches', [])
        total_words = len(message.split())
        error_count = len(matches)

        if total_words == 0:
            grade_score = 0.0
            error_words = ""
            corrected_text = message
            explanation_text = ""
        else:
            error_rate = error_count / total_words

            if error_rate == 0: # No errors (A+)
                grade_score = 10.0
            elif error_rate < 0.10:  # Less than 10% errors (A)
                grade_score = 9.0
            elif error_rate < 0.20:  # Less than 20% errors (B)
                grade_score = 8.0
            elif error_rate < 0.30:  # Less than 30% errors (C)
                grade_score = 7.0
            elif error_rate < 0.40:  # Less than 40% errors (D)
                grade_score = 6.0
            else:
                grade_score = 5.0 # Less than 50% errors (F)

        # Sort matches in reverse order of offset to apply corrections right-to-left
            sorted_matches = sorted(matches, key=lambda x: x.get('offset', 0), reverse=True)
            corrected_message = message
            errors_list = []
            explanations_list = []

            for match in sorted_matches:
                offset = match.get('offset', 0)
                length = match.get('length', 0)
                original_word = message[offset:offset+length]
                replacements = match.get('replacements', [])
                suggested_word = replacements[0].get('value') if replacements else None

                errors_list.append(original_word)
                explanations_list.append(f"'{original_word}': {match.get('message', 'Incorrect word')}")

                if suggested_word is not None:
                    corrected_message = corrected_message[:offset] + suggested_word + corrected_message[offset+length:]

            errors_list.reverse()
            explanations_list.reverse()
            error_words = ", ".join(errors_list)
            corrected_text = corrected_message
            explanation_text = "; ".join(explanations_list)
            
        detected_language_info = result.get('language', {})
        detected_name = detected_language_info.get('name', 'Unknown')

        return {
            "suggested_grade": round(grade_score, 1),
            "letter_grade": get_letter_grade(grade_score),
            "error_count": error_count,
            "total_words": total_words,
            "detected_language": detected_name,
            "error_words": error_words,
            "corrected_text": corrected_text,
            "explanation_text": explanation_text,
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
        ("Hello, my name is John and I am twenty years old.", "en"), 
        ("Hello, my name are John and I am twenty year old.", "en"),
        ("Hola, me llamo María y tengo veinte años.", "es"),
        ("Hola, me llamas María y tengo veinte año.", "es"),
        ("Bonjour, je m'appelle Pierre.", "fr"),
        ("Hello como estas today?", "auto"),  # Auto-detect
    ]
    
    print("=== Simple LanguageTool Grade Suggester ===")
    print(f"Using local server: {LANGUAGETOOL_API_URL}")
    print("-" * 60)
    
    for text, lang in test_texts:
        print(f"\nText: {text}")
        print(f"Expected: {lang or 'auto-detect'}")
        
        result = suggest_grade(text, lang)
        
        if result['status'] == 'success':
            print(f"Grade: {result['suggested_grade']}/10 ({result['letter_grade']})")
            print(f"Errors: {result['error_count']}/{result['total_words']} words")
            print(f"Language: {result['detected_language']}")
        else:
            print(f"{result['status'].title()}: {result.get('message', 'Error occurred')}")
    
    print(f"\n{'='*60}")
    print("Usage: result = suggest_grade('Your text here', 'spanish')")
    print("Returns: {'suggested_grade': 8.5, 'letter_grade': 'A', ...}")
    


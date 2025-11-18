# ELLE 2024 Website & API

  Conversationelle part 2

## Notes
  - **SEE MORE NOTES IN THE ELLE DOCUMENTATION REPO**
  - ***LIMIT USERS IN `classID=74` to be only `TWT_Professor` and only a few students due to explosive nature of the class***
  - `ucf2` is not goated here
  - All of the documentation here are is written by the DB/Backend guy, so can't really inform too much on stuff about AI/LangTool/Frontend implementations
    - I can prob answer most questions relating to the above unless it is something created by someone that is not I
  - Llama.cpp restarts DAILY in the early morning (due to caches filling up and causing slow generation)
    - On restart, llama is at its slowest
  - 

## TWT Notes:
  - `spacy_service.py` supports only 24 languages, so only the languages listed under `SPACY_MODELS` will be allowed when processing messages
    - Furthermore, there doesn't seem to be that much of a benefit of using the larger models seen from limited testing
  - ClassID = `74` is the dedicated class for `Talking with Tito` as it contains **ALL** the modules and is owned by `TWT_Professor`
    - *See the docs for the password* 
  - Our project auto-hijacks existing APIs so newer projects that don't disable TWT WILL have issues if some of the stuff is not set up properly or `TWT_ENABLED` flag is made to be `False` in `config.py`

## Known flaws:
  -  Audio file cleanup (for normal audio messages, not combined ones)

## Potential flaws:
  - Term miscount when adding/deleting terms 
    - attempted solution (not foolproof): 
      - currently hijacks existing APIs that are known to associate terms to modules, but if done outside or missed to include certain APIs counters will be misaligned
  

## TODO:
  - for `group_status` make sure to update it to + 1 year from current date on insertion
  - Cleaner free chat sessions
  - in convgrader.py > suggest_grade() figure out how to better match errors to key terms
  - Remove audio files whose creationdate is greater than a year


# Suggestions:
  - Preload user audio messages `on message hover`
  - Allow professors to listen to audio files in the `Professor Console` tab

# ELLE 2024 Website & API

  Conversationelle part 2

## Notes
  - Table `group_user` doesn't have a primary key, when would you *ever* need a user in a group to be a student, ta ***and*** a prof? I don't work on the other projects and don't have the ability to test if it breaks anything, but worth noting, but this is annoying to work around potentially.
  - ***ONLY EVER HAVE 2 USERS IN THE `TITO-TEST-GROUP`, `ucf2` and `{tentativeUsername}`***

## TWT Notes:
  - `tito_module` overlaps `ucf2` with existing professor's for their classes, causing duplicate (?) classes to be created 
    - >Solution: Have only 1 class with all modules? therefore update the migrate script + triggers and stuff

## Known flaws:
  - when uploading voice audio, doesnt check for if the `messageID` exists
  

## TODO:
  - Sanitize SQL queries & text
  - On STUDENT registering to a class
    create TRIGGER to auto create related Tito {termprogress, moduleprogress}
  - for `group_status` make sure to update it to + 1 year from current date on insertion
  - Free chat sessions
  - inserts/updates to `tito` tables
  - in convgrader.py > suggest_grade() figure out how to match errors to key terms
  - CREATE TRIGGER WHEN A MODULE IS TITO-FIED for `tito_lore` table
  - Remove concatenated user audio files from the fs in the cron scheduler `{userID}.webm`

  - Weird addNewTitoModule() logic in database.py, plz fix
  - addNewGroupUserToTitoGroup() too
  - UpdateTitoClass class 74

# Suggestions:
  - Preload user audio messages `on message hover`

# Changes on upload to CHDR server:
  - everything from tito_methods.py except flatten_list and merge_user_audio
  - from config.py set TWT_ENABLED to False on `MAIN` branch

  - Create super teacher and super student account
  - update tito class owner to user 74


## Freechat module = 228
## TWT test class = 74
## TWT test pf = 570
## TWT test st
## ucf2 has access to all
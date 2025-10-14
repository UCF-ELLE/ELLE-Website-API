# ELLE 2024 Website & API

  Conversationelle part 2

## Notes
  - Table `group_user` doesn't have a primary key, when would you *ever* need a user in a group to be a student, ta ***and*** a prof? I don't work on the other projects and don't have the ability to test if it breaks anything, but worth noting, but this is annoying to work around potentially.

## TODO:
  - Sanitize SQL queries & text
  - On STUDENT registering to a class
    create TRIGGER to auto create related Tito {termprogress, moduleprogress}
  - for `group_status` make sure to update it to + 1 year from current date on insertion
  - Free chat sessions
  - inserts/updates to `tito` tables
  - in convgrader.py > suggest_grade() figure out how to match errors to key terms
  - CREATE TRIGGER WHEN A MODULE IS TITO-FIED for `tito_lore` table

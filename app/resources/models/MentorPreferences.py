from sqlalchemy import Column, Integer, String
from app.db import db

"""
MentorPreferences:
    mentorPreferenceID: int (primary key) (autoincrement)
    userID: int (foreign key)
    mentorName: string (255) (nullable) 
"""


class MentorPreferences(db.Model):
    __tablename__ = "mentor_preferences"

    mentorPreferenceID = Column(Integer, primary_key=True, autoincrement=True)
    userID = Column(Integer, db.ForeignKey("user.userID"), nullable=False)
    mentorName = Column(String(255), nullable=True)

    def __init__(self, userID, mentorName):
        self.userID = userID
        self.mentorName = mentorName

    def __repr__(self):
        return f"<MentorPreferences {self.mentorPreferenceID}>"

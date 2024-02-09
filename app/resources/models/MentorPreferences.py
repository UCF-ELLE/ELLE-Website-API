from sqlalchemy import Column, Integer, String, Index
from app.db import db
from app.serializer import Serializer

"""
MentorPreferences:
    mentorPreferenceID: int (primary key) (autoincrement)
    userID: int (foreign key)
    mentorName: string (255) (nullable) 
"""


class MentorPreferences(db.Model, Serializer):
    __tablename__ = "mentor_preferences"

    mentorPreferenceID = Column(Integer, primary_key=True, autoincrement=True)
    userID = Column(Integer, db.ForeignKey("user.userID"), nullable=False)
    mentorName = Column(String(255), nullable=True)

    __table_args__ = (Index("mentor_preferences_userID", "userID"),)

    def __init__(self, userID, mentorName):
        self.userID = userID
        self.mentorName = mentorName

    def __repr__(self):
        return f"<MentorPreferences {self.mentorPreferenceID}>"

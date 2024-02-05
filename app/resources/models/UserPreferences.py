from sqlalchemy import Column, Integer, String
from app.db import db

"""
UserPreferences:
    userPreferenceID: int (primary key) (autoincrement)
    userID: int (multiple foreign key)
    preferredHand: enum('R', 'L', 'A', '') (default 'A')
    vrGloveColor: str (15) default 'brown'
"""


class UserPreferences(db.Model):
    __tablename__ = "user_preferences"

    userPreferenceID = Column(Integer, primary_key=True, autoincrement=True)
    userID = Column(Integer, db.ForeignKey("user.userID"), nullable=False)
    preferredHand = Column(String(1), nullable=False, default="A")
    vrGloveColor = Column(String(15), nullable=False, default="brown")

    def __init__(self, userID, preferredHand="A", vrGloveColor="brown"):
        self.userID = userID
        self.preferredHand = preferredHand
        self.vrGloveColor = vrGloveColor

    def __repr__(self):
        return f"<UserPreferences {self.userPreferencesID} for user {self.userID}>"

from sqlalchemy import Column, Integer, String, Enum
import enum
from app.db import db
from app.serializer import Serializer

"""
UserPreferences:
    userPreferenceID: int (primary key) (autoincrement)
    userID: int (multiple foreign key)
    preferredHand: enum('R', 'L', 'A', '') (default 'A')
    vrGloveColor: str (15) default 'brown'
"""


class HandPreference(enum.Enum):
    R = "R"
    L = "L"
    A = "A"
    N = ""


class UserPreferences(db.Model, Serializer):
    __tablename__ = "user_preferences"

    userPreferenceID = Column(Integer, primary_key=True, autoincrement=True)
    userID = Column(Integer, db.ForeignKey("user.userID"), nullable=False)
    preferredHand = Column(
        Enum(
            HandPreference, values_callable=lambda x: [i.value for i in HandPreference]
        ),
        nullable=False,
        default=HandPreference.A,
    )
    vrGloveColor = Column(String(15), nullable=False, default="brown")

    def __init__(self, userID, preferredHand="A", vrGloveColor="brown"):
        self.userID = userID
        self.preferredHand = preferredHand
        self.vrGloveColor = vrGloveColor

    def __repr__(self):
        return f"<UserPreferences {self.userPreferencesID} for user {self.userID}>"

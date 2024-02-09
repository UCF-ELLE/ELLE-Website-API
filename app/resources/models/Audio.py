from sqlalchemy import Column, Integer, String
from app.db import db
from app.serializer import Serializer

"""
Audio:
    audioID: int (primary key) (autoincrement)
    audioLocation: string (255) (nullable)
"""


class Audio(db.Model, Serializer):
    __tablename__ = "audio"

    audioID = Column(Integer, primary_key=True, autoincrement=True)
    audioLocation = Column(String(255), nullable=True)

    def __init__(self, audioLocation):
        self.audioLocation = audioLocation

    def __repr__(self):
        return f"<Audio {self.audioID} with audioLocation '{self.audioLocation}'>"

from sqlalchemy import Column, Integer, String, Enum
import enum
from app.db import db
from app.serializer import Serializer

"""
Term:
    termID: int (primary key) (autoincrement)
    imageID: int (foreign key) (nullable)
    audioID: int (foreign key) (nullable)
    front: string (255) (nullable)
    back: string (255) (nullable)
    type: string (2) (nullable)
    gender: enum ('M', 'F', 'N') (default 'N')
    language: string (50) (nullable)
"""


class Gender(enum.Enum):
    F = "F"
    M = "M"
    N = "N"


class Term(db.Model, Serializer):
    __tablename__ = "term"

    termID = Column(Integer, primary_key=True, autoincrement=True)
    imageID = Column(Integer, db.ForeignKey("image.imageID"), nullable=True)
    audioID = Column(Integer, db.ForeignKey("audio.audioID"), nullable=True)
    front = Column(String(255), nullable=True)
    back = Column(String(255), nullable=True)
    type = Column(String(2), nullable=True)
    gender = Column(
        Enum(Gender, values_callable=lambda x: [e.value for e in Gender]),
        nullable=False,
        default=Gender.N,
    )
    language = Column(String(50), nullable=True)

    def __init__(
        self, imageID, audioID, front, back, type, gender=Gender.N, language=None
    ):
        self.imageID = imageID
        self.audioID = audioID
        self.front = front
        self.back = back
        self.type = type
        self.gender = gender
        self.language = language

    def __repr__(self):
        return f"<Term {self.termID}>"

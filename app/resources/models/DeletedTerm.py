from sqlalchemy import (
    Column,
    ForeignKeyConstraint,
    Integer,
    String,
    Enum,
    ForeignKey,
    Index,
)
from sqlalchemy.dialects.mysql import VARCHAR
from app.db import db
import enum
from app.resources.models.Audio import Audio
from app.resources.models.Image import Image
from app.serializer import Serializer

"""
DeletedTerm:
    termID: int (primary key) (autoincrement)
    imageID: int (foreign key) (nullable)
    audioID: int (foreign key) (nullable)
    front: string (255) (nullable)
    back: string (255) (nullable)
    type: string (2) (nullable)
    gender: enum ('M', 'F', 'N') (default 'N')
    language: string (50) (nullable)
"""


class Gender(str, enum.Enum):
    F = "F"
    M = "M"
    N = "N"


class DeletedTerm(db.Model, Serializer):
    __tablename__ = "deleted_term"

    termID = Column(Integer, primary_key=True, autoincrement=True)
    imageID = Column(
        Integer,
        ForeignKey("image.imageID"),
        nullable=True,
    )
    audioID = Column(
        Integer,
        ForeignKey("audio.audioID"),
        nullable=True,
    )

    front = Column(
        VARCHAR(charset="utf8mb3", collation="utf8mb3_unicode_ci", length=50),
        nullable=True,
    )
    back = Column(
        VARCHAR(charset="utf8mb3", collation="utf8mb3_unicode_ci", length=50),
        nullable=True,
    )
    type = Column(String(2), nullable=True)
    gender = Column(
        Enum(Gender, values_callable=lambda x: [e.value for e in Gender]),
        nullable=False,
        default=Gender.N,
    )
    LANGUAGE = Column(
        VARCHAR(charset="utf8mb3", collation="utf8mb3_unicode_ci", length=2),
        nullable=True,
    )

    __table_args__ = (
        Index("term_ibfk_1", "imageID"),
        Index("term_ibfk_2", "audioID"),
    )

    def __init__(
        self, imageID, audioID, front, back, type, gender=Gender.N, language=None
    ):
        self.imageID = imageID
        self.audioID = audioID
        self.front = front
        self.back = back
        self.type = type
        self.gender = gender
        self.LANGUAGE = language

    def __repr__(self):
        return f"<Term {self.termID}>"

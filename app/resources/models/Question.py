from sqlalchemy import Column, Integer, String
from app.db import db
from app.serializer import Serializer

"""
Question:
    questionID: int (primary key) (autoincrement)
    audioID: int (foreign key) (nullable)
    imageID: int (foreign key) (nullable)
    type: string (10) (nullable)
    questionText: string (75) (nullable)
"""


class Question(db.Model, Serializer):
    __tablename__ = "question"

    questionID = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String(10), nullable=True)
    questionText = Column(String(75), nullable=True)
    audioID = Column(Integer, db.ForeignKey("audio.audioID"), nullable=True)
    imageID = Column(Integer, db.ForeignKey("image.imageID"), nullable=True)

    def __init__(self, audioID, imageID, type, questionText):
        self.audioID = audioID
        self.imageID = imageID
        self.type = type
        self.questionText = questionText

    def __repr__(self):
        return f"<Question {self.questionID}>"


class DeletedQuestion(db.Model):
    __tablename__ = "deleted_question"

    questionID = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String(10), nullable=True)
    questionText = Column(String(75), nullable=True)
    audioID = Column(Integer, db.ForeignKey("audio.audioID"), nullable=True)
    imageID = Column(Integer, db.ForeignKey("image.imageID"), nullable=True)

    def __init__(self, audioID, imageID, type, questionText):
        self.audioID = audioID
        self.imageID = imageID
        self.type = type
        self.questionText = questionText

    def __repr__(self):
        return f"<DeletedQuestion {self.questionID}>"

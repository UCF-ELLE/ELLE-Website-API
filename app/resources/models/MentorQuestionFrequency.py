from sqlalchemy import Column, Index, Integer
from app.db import db
from app.serializer import Serializer

"""
MentorQuestionFrequency:
    ID: int (primary key) (autoincrement)
    numIncorrectCards: int (nullable)
    numCorrectCards: int (nullable)
    time: int (nullable)
    moduleID: int (foreign key)
"""


class MentorQuestionFrequency(db.Model, Serializer):
    __tablename__ = "mentor_question_frequency"

    ID = Column(Integer, primary_key=True, autoincrement=True)
    numIncorrectCards = Column(Integer, nullable=True)
    numCorrectCards = Column(Integer, nullable=True)
    time = Column(Integer, nullable=True)
    moduleID = Column(Integer, db.ForeignKey("module.moduleID"), nullable=False)

    __table_args__ = (Index("module_key", "moduleID"),)

    def __init__(self, numIncorrectCards, numCorrectCards, time, moduleID):
        self.numIncorrectCards = numIncorrectCards
        self.numCorrectCards = numCorrectCards
        self.time = time
        self.moduleID = moduleID

    def __repr__(self):
        return f"<MentorQuestionFrequency {self.ID}>"

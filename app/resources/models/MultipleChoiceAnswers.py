from sqlalchemy import Column, Integer, String, Index
from app.db import db
from app.serializer import Serializer

"""
MultipleChoiceAnswers:
    multipleChoiceID: int (primary key) (autoincrement)
    questionID: int (foreign key) (nullable)
    answerChoice: string (255) (nullable)
"""


class MultipleChoiceAnswers(db.Model, Serializer):
    __tablename__ = "multiple_choice_answers"

    multipleChoiceID = Column(Integer, primary_key=True, autoincrement=True)
    questionID = Column(Integer, db.ForeignKey("question.questionID"), nullable=False)
    answerChoice = Column(String(255), nullable=True)

    __table_args__ = (Index("multiple_choice_answers_questionID", "questionID"),)

    def __init__(self, questionID, answerChoice):
        self.questionID = questionID
        self.answerChoice = answerChoice

    def __repr__(self):
        return f"<MultipleChoiceAnswers {self.multipleChoiceID}>"

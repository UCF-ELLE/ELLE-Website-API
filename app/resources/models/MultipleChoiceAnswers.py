from sqlalchemy import Column, Integer, String
from app.db import db

"""
MultipleChoiceAnswers:
    multipleChoiceID: int (primary key) (autoincrement)
    questionID: int (foreign key) (nullable)
    answerChoice: string (255) (nullable)
"""


class MultipleChoiceAnswers(db.Model):
    __tablename__ = "multiple_choice_answers"

    multipleChoiceID = Column(Integer, primary_key=True, autoincrement=True)
    questionID = Column(Integer, db.ForeignKey("question.questionID"), nullable=True)
    answerChoice = Column(String(255), nullable=True)

    def __init__(self, questionID, answerChoice):
        self.questionID = questionID
        self.answerChoice = answerChoice

    def __repr__(self):
        return f"<MultipleChoiceAnswers {self.multipleChoiceID}>"

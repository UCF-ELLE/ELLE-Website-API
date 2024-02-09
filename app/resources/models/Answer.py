from sqlalchemy import Column, Integer, String, Index
from app.db import db
from app.serializer import Serializer

"""
Answer:
    answerID: int (primary key) (autoincrement)
    questionID: int (foreign key)
    termID: int (foreign key)
"""


class Answer(db.Model, Serializer):
    __tablename__ = "answer"

    answerID = Column(Integer, primary_key=True, autoincrement=True)
    questionID = Column(Integer, db.ForeignKey("question.questionID"), nullable=False)
    termID = Column(Integer, db.ForeignKey("term.termID"), nullable=False)

    __table_args__ = (
        Index("answer_ibfk_1", "questionID"),
        Index("answer_ibfk_2", "termID"),
    )

    def __init__(self, questionID, termID):
        self.questionID = questionID
        self.termID = termID

    def __repr__(self):
        return f"<Answer {self.answerID}>"

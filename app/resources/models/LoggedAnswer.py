from sqlalchemy import Column, Integer, String, Index
from sqlalchemy.dialects.mysql import TINYINT, TIME
from app.db import db
from app.serializer import Serializer

"""
LoggedAnswer:
    logID: int (primary key) (autoincrement)
    questionID: int (foreign key) (nullable)
    termID: int (foreign key) (nullable)
    sessionID: int (foreign key) (nullable)
    correct: bool (nullable)
    mode: string (7) default 'quiz'
    log_time: datetime (nullable)
    deleted_questionID: int (foreign key) (nullable)
    deleted_termID: int (foreign key) (nullable)
"""


class LoggedAnswer(db.Model, Serializer):
    __tablename__ = "logged_answer"

    logID = Column(Integer, primary_key=True, autoincrement=True)
    questionID = Column(Integer, db.ForeignKey("question.questionID"), nullable=True)
    termID = Column(Integer, db.ForeignKey("term.termID"), nullable=True)
    sessionID = Column(Integer, db.ForeignKey("session.sessionID"), nullable=True)
    correct = Column(TINYINT, nullable=True)
    mode = Column(String(7), default="quiz", nullable=False)
    log_time = Column(TIME, nullable=True)
    deleted_questionID = Column(
        Integer, db.ForeignKey("deleted_question.questionID"), nullable=True
    )
    deleted_termID = Column(
        Integer, db.ForeignKey("deleted_term.termID"), nullable=True
    )

    __table_args__ = (
        Index("logged_answer_ibfk_1", "questionID"),
        Index("logged_answer_ibfk_4", "termID"),
    )

    def __init__(
        self,
        questionID,
        termID,
        sessionID,
        correct,
        mode,
        log_time,
        deleted_questionID,
        deleted_termID,
    ):
        self.questionID = questionID
        self.termID = termID
        self.sessionID = sessionID
        self.correct = correct
        self.mode = mode
        self.log_time = log_time
        self.deleted_questionID = deleted_questionID
        self.deleted_termID = deleted_termID

    def __repr__(self):
        return f"<LoggedAnswer {self.logID}>"

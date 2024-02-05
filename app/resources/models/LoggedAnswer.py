from sqlalchemy import Column, Integer, String
from app.db import db

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


class LoggedAnswer(db.Model):
    __tablename__ = "logged_answer"

    logID = Column(Integer, primary_key=True, autoincrement=True)
    questionID = Column(Integer, db.ForeignKey("question.questionID"), nullable=True)
    termID = Column(Integer, db.ForeignKey("term.termID"), nullable=True)
    sessionID = Column(Integer, db.ForeignKey("session.sessionID"), nullable=True)
    correct = Column(Integer, nullable=True)
    mode = Column(String(7), default="quiz")
    log_time = Column(String(19), nullable=True)
    deleted_questionID = Column(Integer, nullable=True)
    deleted_termID = Column(Integer, nullable=True)

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

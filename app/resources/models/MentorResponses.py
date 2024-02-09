from sqlalchemy import Column, Integer, String, Index
from app.db import db
from app.serializer import Serializer

"""
MentorResponses:
    mentorResponseID: int (primary key) (autoincrement)
    questionID: int (foreign key)
    sessionID: int (foreign key)
    response: string (255) (nullable)
    deleted_questionID: int (foreign key) (nullable)
"""


class MentorResponses(db.Model, Serializer):
    __tablename__ = "mentor_responses"

    mentorResponseID = Column(Integer, primary_key=True, autoincrement=True)
    questionID = Column(Integer, db.ForeignKey("question.questionID"), nullable=False)
    sessionID = Column(Integer, db.ForeignKey("session.sessionID"), nullable=False)
    response = Column(String(255), nullable=True)
    deleted_questionID = Column(Integer, nullable=True)

    __table_args__ = (
        Index("mentor_responses_questionID", "questionID"),
        Index("mentor_responses_sessionID", "sessionID"),
    )

    def __init__(self, questionID, sessionID, response, deleted_questionID):
        self.questionID = questionID
        self.sessionID = sessionID
        self.response = response
        self.deleted_questionID = deleted_questionID

    def __repr__(self):
        return f"<MentorResponses {self.mentorResponseID}>"

from sqlalchemy import Column, Integer, String
from app.db import db

"""
MentorResponses:
    mentorResponseID: int (primary key) (autoincrement)
    questionID: int (foreign key)
    sessionID: int (foreign key)
    response: string (255) (nullable)
    deleted_questionID: int (foreign key) (nullable)
"""


class MentorResponses(db.Model):
    __tablename__ = "mentor_responses"

    mentorResponseID = Column(Integer, primary_key=True, autoincrement=True)
    questionID = Column(Integer, db.ForeignKey("question.questionID"), nullable=False)
    sessionID = Column(Integer, db.ForeignKey("session.sessionID"), nullable=False)
    response = Column(String(255), nullable=True)
    deleted_questionID = Column(Integer, nullable=True)

    def __init__(self, questionID, sessionID, response, deleted_questionID):
        self.questionID = questionID
        self.sessionID = sessionID
        self.response = response
        self.deleted_questionID = deleted_questionID

    def __repr__(self):
        return f"<MentorResponses {self.mentorResponseID}>"

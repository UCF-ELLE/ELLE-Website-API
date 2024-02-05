from sqlalchemy import Column, Integer, String
from app.db import db

"""
Session:
    sessionID: int (primary key) (autoincrement)
    userID: int (foreign key)
    moduleID: int (foreign key)
    sessionDate: date (nullable)
    playerScore: int (nullable)
    startTime: time (5) (nullable)
    endTime: time (5) (nullable)
    platform: string (3) (nullable)
    mode: string (7)
    deleted_moduleID: int (foreign key) (nullable)
"""


class Session(db.Model):
    __tablename__ = "session"

    sessionID = Column(Integer, primary_key=True, autoincrement=True)
    userID = Column(Integer, nullable=False)
    moduleID = Column(Integer, nullable=False)
    sessionDate = Column(String(10), nullable=True)
    playerScore = Column(Integer, nullable=True)
    startTime = Column(String(5), nullable=True)
    endTime = Column(String(5), nullable=True)
    platform = Column(String(3), nullable=True)
    mode = Column(String(7), nullable=False)
    deleted_moduleID = Column(Integer, nullable=True)

    def __init__(
        self,
        userID,
        moduleID,
        sessionDate=None,
        playerScore=None,
        startTime=None,
        endTime=None,
        platform=None,
        mode=None,
        deleted_moduleID=None,
    ):
        self.userID = userID
        self.moduleID = moduleID
        self.sessionDate = sessionDate
        self.playerScore = playerScore
        self.startTime = startTime
        self.endTime = endTime
        self.platform = platform
        self.mode = mode
        self.deleted_moduleID = deleted_moduleID

    def __repr__(self):
        return f"<Session {self.sessionID}>"

from sqlalchemy import Column, Integer, String, Index
from sqlalchemy.dialects.mysql import DATE, TIME
from app.db import db
from app.serializer import Serializer

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


class Session(db.Model, Serializer):
    __tablename__ = "session"

    sessionID = Column(Integer, primary_key=True, autoincrement=True)
    userID = Column(Integer, nullable=False)
    moduleID = Column(Integer, nullable=True)
    sessionDate = Column(DATE, nullable=True)
    playerScore = Column(Integer, nullable=True)
    startTime = Column(TIME(fsp=5), nullable=True)
    endTime = Column(TIME(fsp=5), nullable=True)
    platform = Column(String(3), nullable=True)
    mode = Column(String(7), nullable=False)
    deleted_moduleID = Column(Integer, nullable=True)

    __table_args__ = (Index("deleted_module_key", "deleted_moduleID"),)

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

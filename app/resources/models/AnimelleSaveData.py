from sqlalchemy import Column, Index, Integer, String, JSON, ForeignKey
from app.db import db
from app.serializer import Serializer

"""
AnimelleSaveData:
    saveID: int (primary key) (autoincrement)
    userID: int (unique) (foreign key)
    saveData: json (nullable)
"""


class AnimelleSaveData(db.Model, Serializer):
    __tablename__ = "animelle_save_data"

    saveID = Column(Integer, primary_key=True, autoincrement=True)
    userID = Column(Integer, ForeignKey("user.userID", name="userID"), nullable=False)
    saveData = Column(JSON, nullable=True)

    __table_args__ = (Index("userID", "userID", unique=True),)

    def __init__(self, userID, saveData):
        self.userID = userID
        self.saveData = saveData

    def __repr__(self):
        return f"<AnimelleSaveData {self.saveID}>"

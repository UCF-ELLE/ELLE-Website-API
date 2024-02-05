from sqlalchemy import Column, Integer, String
from app.db import db

"""
AnimelleSaveData:
    saveID: int (primary key) (autoincrement)
    userID: int (unique) (foreign key)
    saveData: json (nullable)
"""


class AnimelleSaveData(db.Model):
    __tablename__ = "animelle_save_data"

    saveID = Column(Integer, primary_key=True, autoincrement=True)
    userID = Column(Integer, db.ForeignKey("user.userID"), nullable=False)
    saveData = Column(String(400), nullable=True)

    def __init__(self, userID, saveData):
        self.userID = userID
        self.saveData = saveData

    def __repr__(self):
        return f"<AnimelleSaveData {self.saveID}>"

from sqlalchemy import Column, Integer, String
from app.db import db

"""
Group:
    groupID: int (primary key) (autoincrement)
    groupName: str (50)
    groupCode: str (10) (unique)
"""


class Group(db.Model):
    __tablename__ = "group"

    groupID = Column(Integer, primary_key=True, autoincrement=True)
    groupName = Column(String(50), nullable=False)
    groupCode = Column(String(10), unique=True, nullable=False)

    def __init__(self, groupName, groupCode):
        self.groupName = groupName
        self.groupCode = groupCode

    def __repr__(self):
        return f"<Group {self.groupID} with name '{self.groupName}'>"

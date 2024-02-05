from sqlalchemy import Column, Integer, String
from app.db import db

"""
GroupUser:
    userID: int (multiple foreign key)
    groupID: int (multiple foreign key)
    accessLevel: enum('st', 'pf', 'su') (default 'st')
"""


class GroupUser(db.Model):
    __tablename__ = "group_user"

    groupUserID = Column(Integer, primary_key=True, autoincrement=True)
    userID = Column(Integer, db.ForeignKey("user.userID"), nullable=False)
    groupID = Column(Integer, db.ForeignKey("group.groupID"), nullable=False)
    accessLevel = Column(String(2), nullable=False, default="st")

    def __init__(self, userID, groupID, accessLevel="st"):
        self.userID = userID
        self.groupID = groupID
        self.accessLevel = accessLevel

    def __repr__(self):
        return f"<User {self.userID} in group {self.groupID} with access level '{self.accessLevel}'>"

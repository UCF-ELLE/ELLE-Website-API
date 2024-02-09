from sqlalchemy import Column, Integer, String, Enum
from app.db import db
from app.serializer import Serializer
import enum

"""
GroupUser:
    userID: int (multiple foreign key)
    groupID: int (multiple foreign key)
    accessLevel: enum('st', 'pf', 'su') (default 'st')
"""


class AccessLevel(enum.Enum):
    st = "st"
    pf = "pf"
    ta = "ta"


class GroupUser(db.Model, Serializer):
    __tablename__ = "group_user"

    groupUserID = Column(Integer, primary_key=True, autoincrement=True)
    userID = Column(Integer, db.ForeignKey("user.userID"), nullable=False)
    groupID = Column(Integer, db.ForeignKey("group.groupID"), nullable=False)
    accessLevel = Column(
        Enum(AccessLevel, values_callable=lambda x: [e.value for e in AccessLevel]),
        nullable=False,
        default=AccessLevel.st,
    )

    def __init__(self, userID, groupID, accessLevel=AccessLevel.st):
        self.userID = userID
        self.groupID = groupID
        self.accessLevel = accessLevel

    def __repr__(self):
        return f"<User {self.userID} in group {self.groupID} with access level '{self.accessLevel}'>"

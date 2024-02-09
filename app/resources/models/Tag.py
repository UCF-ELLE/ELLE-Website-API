from sqlalchemy import Column, Integer, String
from app.db import db
from app.serializer import Serializer

"""
Tag:
    termID: int (foreign key) (autoincrement)
    tagName: string (20) (nullable)
"""


class Tag(db.Model, Serializer):
    __tablename__ = "tag"

    termID = Column(
        Integer, db.ForeignKey("term.termID"), primary_key=True, autoincrement=True
    )
    tagName = Column(String(20), nullable=True)

    def __init__(self, tagName):
        self.tagName = tagName

    def __repr__(self):
        return f"<Tag {self.termID} with tagName '{self.tagName}'>"

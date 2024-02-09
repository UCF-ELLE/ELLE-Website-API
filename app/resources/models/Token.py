from sqlalchemy import Column, Integer, String
from app.db import db
from app.serializer import Serializer

"""
Token:
    tokenID: int (primary key)
    expired: string (400) (nullable)
"""


class Token(db.Model, Serializer):
    __tablename__ = "tokens"

    tokenID = Column(Integer, primary_key=True)
    expired = Column(String(400), nullable=True)

    def __init__(self, expired):
        self.expired = expired

    def __repr__(self):
        return f"<Token {self.tokenID}>"

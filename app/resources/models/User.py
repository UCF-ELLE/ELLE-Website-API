from sqlalchemy import Column, Integer, String
from app.db import db

"""
User:
    userID: int
    username: str (20)
    password: str (100)
    pwdResetToken: str (100) (nullable)
    permissionGroup: enum('st', 'pf', 'su') (default 'st')
    otc: str (6) (nullable)
    email: str (255) (nullable)
"""


class User(db.Model):
    __tablename__ = "user"

    userID = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(20), unique=True, nullable=False)
    password = Column(String(100), nullable=False)
    pwdResetToken = Column(String(100), nullable=True)
    permissionGroup = Column(String(2), nullable=False, default="st")
    otc = Column(String(6), nullable=True)
    email = Column(String(255), nullable=True)

    def __init__(self, username, password, permissionGroup="st", email=None):
        self.username = username
        self.password = password
        self.permissionGroup = permissionGroup
        self.email = email

    def __repr__(self):
        return f"<User {self.userID} with username '{self.username}'>"

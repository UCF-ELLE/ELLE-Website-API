from sqlalchemy import Column, Integer, String
from app.db import db
from app.serializer import Serializer

"""
Image:
    imageID: int (primary key) (autoincrement)
    imageLocation: string (255) (nullable)
"""


class Image(db.Model, Serializer):
    __tablename__ = "image"

    imageID = Column(Integer, primary_key=True, autoincrement=True)
    imageLocation = Column(String(255), nullable=True)

    def __init__(self, imageLocation):
        self.imageLocation = imageLocation

    def __repr__(self):
        return f"<Image {self.imageID} with imageLocation '{self.imageLocation}'>"

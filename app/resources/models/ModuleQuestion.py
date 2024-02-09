from sqlalchemy import Column, Integer
from app.db import db
from app.serializer import Serializer

"""
ModuleQuestion:
    moduleID: int (primary key) (autoincrement)
    questionID: int (foreign key) (nullable)
"""


class ModuleQuestion(db.Model, Serializer):
    __tablename__ = "module_question"

    moduleID = Column(Integer, primary_key=True, autoincrement=True)
    questionID = Column(Integer, db.ForeignKey("question.questionID"), nullable=False)

    def __init__(self, questionID):
        self.questionID = questionID

    def __repr__(self):
        return f"<ModuleQuestion {self.moduleID}>"

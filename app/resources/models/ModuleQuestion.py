from sqlalchemy import Column, Integer, String
from app.db import db

"""
ModuleQuestion:
    moduleID: int (primary key) (autoincrement)
    questionID: int (foreign key) (nullable)
"""


class ModuleQuestion(db.Model):
    __tablename__ = "module_question"

    moduleID = Column(Integer, primary_key=True, autoincrement=True)
    questionID = Column(Integer, db.ForeignKey("question.questionID"), nullable=True)

    def __init__(self, questionID):
        self.questionID = questionID

    def __repr__(self):
        return f"<ModuleQuestion {self.moduleID}>"

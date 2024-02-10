from sqlalchemy import Column, Integer, String
from sqlalchemy.dialects.mysql import TINYINT
from app.db import db
from app.serializer import Serializer

"""
Modules:
    moduleID: int (primary key) (autoincrement)
    name: string (250) (nullable)
    language: string (2)
    complexity: tinyint (nullable)
    userID: int (foreign key)
"""


class Module(db.Model, Serializer):
    __tablename__ = "module"

    moduleID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(250), nullable=True)
    language = Column(String(2), nullable=False)
    complexity = Column(TINYINT, nullable=True)
    userID = Column(Integer, db.ForeignKey("user.userID"), nullable=False)

    def __init__(self, name, language, complexity, useID):
        self.name = name
        self.language = language
        self.complexity = complexity
        self.userID = useID

    def __repr__(self):
        return f"<Module {self.moduleID} with name '{self.name}'>"


"""
GroupModule:
    groupModuleID: int (primary key) (autoincrement)
    moduleID: int (foreign key)
    groupID: int (foreign key)
"""


class GroupModule(db.Model, Serializer):
    __tablename__ = "group_module"

    groupModuleID = Column(Integer, primary_key=True, autoincrement=True)
    moduleID = Column(Integer, db.ForeignKey("module.moduleID"), nullable=False)
    groupID = Column(Integer, db.ForeignKey("group.groupID"), nullable=False)

    def __init__(self, moduleID, groupID):
        self.moduleID = moduleID
        self.groupID = groupID

    def __repr__(self):
        return f"<GroupModule {self.groupModuleID}>"


"""
DeletedModule:
    moduleID: int (primary key) (autoincrement)
    name: string (250) (nullable)
    language: string (2)
    complexity: tinyint (nullable)
    userID: int (foreign key)
"""


class DeletedModule(db.Model, Serializer):
    __tablename__ = "deleted_module"

    moduleID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(250), nullable=False)
    language = Column(String(2), nullable=False)
    complexity = Column(TINYINT, nullable=True)
    userID = Column(Integer, db.ForeignKey("user.userID"), nullable=True)

    def __init__(self, name, language, complexity, useID):
        self.name = name
        self.language = language
        self.complexity = complexity
        self.userID = useID

    def __repr__(self):
        return f"<DeletedModule {self.moduleID} with name '{self.name}'>"

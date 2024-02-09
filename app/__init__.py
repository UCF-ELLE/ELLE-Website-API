from flask import Flask
from app.resources.root import root_bp
from app.db import db, mail, migrate


def create_app():
    # create and configure the app
    app = Flask(__name__)

    app.config.from_pyfile("config.py", silent=True)

    print(app.config.get("SQLALCHEMY_DATABASE_URI"))

    db.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)

    with app.app_context():
        db.create_all()

    app.register_blueprint(root_bp)

    return app

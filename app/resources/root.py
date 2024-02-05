from flask import (
    Blueprint,
)
from app.resources.auth import auth_bp
from app.resources.user import user_bp
from app.resources.access import access_bp
from app.resources.animelle import animelle_bp
from app.resources.group import group_bp

root_bp = Blueprint("root", __name__, url_prefix="/elleapi")
root_bp.register_blueprint(auth_bp)
root_bp.register_blueprint(user_bp)
root_bp.register_blueprint(access_bp)
root_bp.register_blueprint(animelle_bp)
root_bp.register_blueprint(group_bp)

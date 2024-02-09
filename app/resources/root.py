from flask import (
    Blueprint,
)
from app.resources.routes.auth import auth_bp
from app.resources.routes.user import user_bp
from app.resources.routes.access import access_bp
from app.resources.routes.animelle import animelle_bp
from app.resources.routes.group import group_bp
from app.resources.routes.logged_answer import logged_answer_bp
from app.resources.routes.mentors import mentors_bp
from app.resources.routes.modules import modules_bp
from app.resources.routes.question import question_bp
from app.resources.routes.sessions import sessions_bp
from app.resources.routes.stats import stats_bp
from app.resources.routes.terms import terms_bp

root_bp = Blueprint("root", __name__, url_prefix="/elleapi")
root_bp.register_blueprint(auth_bp)
root_bp.register_blueprint(user_bp)
root_bp.register_blueprint(access_bp)
root_bp.register_blueprint(animelle_bp)
root_bp.register_blueprint(group_bp)
root_bp.register_blueprint(logged_answer_bp)
root_bp.register_blueprint(mentors_bp)
root_bp.register_blueprint(modules_bp)
root_bp.register_blueprint(question_bp)
root_bp.register_blueprint(sessions_bp)
root_bp.register_blueprint(stats_bp)
root_bp.register_blueprint(terms_bp)

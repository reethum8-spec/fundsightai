from flask import Blueprint, jsonify
from config import Config

bp = Blueprint("health", __name__)


@bp.get("/health")
def health():
    return jsonify(
        status="ok",
        env=Config.ENV,
        mock=Config.USE_MOCK,
        service="fundsight-ai-backend",
        version="0.1.0",
    )

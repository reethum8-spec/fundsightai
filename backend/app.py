"""FundSight AI — Flask application entrypoint.

Mock-mode by default (Phase 1). Wire Supabase in Phase 3 by setting USE_MOCK=false.
"""
from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from routes.health import bp as health_bp
from routes.funds import bp as funds_bp
from routes.expenses import bp as expenses_bp
from routes.ai import bp as ai_bp
from routes.me import bp as me_bp
from routes.reports import bp as reports_bp
from routes.admin import bp as admin_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    Config.validate()

    CORS(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}}, supports_credentials=True)

    # ---------------- Security headers ----------------
    @app.after_request
    def _secure_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if not Config.DEBUG:
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        return response

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(funds_bp, url_prefix="/api/funds")
    app.register_blueprint(expenses_bp, url_prefix="/api/expenses")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(me_bp, url_prefix="/api/me")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    @app.errorhandler(404)
    def _404(_):
        return jsonify(error="not_found"), 404

    @app.errorhandler(500)
    def _500(e):
        return jsonify(error="internal_error", detail=str(e)), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)

"""Centralized configuration loaded from environment variables."""
import os
import logging
from dotenv import load_dotenv

load_dotenv()
log = logging.getLogger(__name__)


class Config:
    ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = ENV == "development"
    PORT = int(os.getenv("PORT", "5000"))
    USE_MOCK = os.getenv("USE_MOCK", "true").lower() == "true"
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
    JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
    CORS_ORIGINS = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()
    ]

    @classmethod
    def validate(cls):
        """Warn about unsafe defaults in production."""
        if not cls.DEBUG:
            issues = []
            if cls.JWT_SECRET in ("change-me", "", None):
                issues.append("JWT_SECRET is using the default value")
            if not cls.SUPABASE_JWT_SECRET:
                issues.append("SUPABASE_JWT_SECRET is not set")
            if cls.USE_MOCK:
                issues.append("USE_MOCK is enabled in production")
            if issues:
                for issue in issues:
                    log.warning("SECURITY: %s", issue)
        else:
            log.info("Running in DEBUG mode — disable for production")

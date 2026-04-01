"""
Application Configuration Module

Uses Pydantic BaseSettings for secure, validated environment variable loading.
This is the SINGLE SOURCE OF TRUTH for all configuration in the application.

Security Best Practices:
- NEVER hardcode secrets in this file or anywhere else
- ALWAYS use environment variables for sensitive data
- .env files are gitignored by default (see .gitignore)
- Only .env.example (template) should be committed
"""

from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Usage:
        from app.core.config import get_settings
        settings = get_settings()
        api_key = settings.gemini_api_key
    """
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Ignore extra env vars not defined here
    )
    
    # ==========================================
    # Database Configuration
    # ==========================================
    database_url: str = Field(
        default="postgresql://postgres:password@localhost:5432/period_tracker",
        description="PostgreSQL connection string"
    )
    
    # ==========================================
    # Security & Authentication
    # ==========================================
    secret_key: str = Field(
        default="your-super-secret-key-change-this-in-production",
        description="JWT signing key - MUST be changed in production!",
        min_length=32,
    )
    
    access_token_expire_minutes: int = Field(
        default=60,
        description="JWT token expiration time in minutes"
    )
    
    # ==========================================
    # AI/ML Services (SENSITIVE - Load from env only)
    # ==========================================
    gemini_api_key: Optional[str] = Field(
        default=None,
        description="Google Gemini API key for AI chatbot",
    )
    
    # ==========================================
    # Server Configuration
    # ==========================================
    host: str = Field(
        default="0.0.0.0",
        description="Server bind address"
    )
    
    port: int = Field(
        default=8000,
        description="Server port",
        ge=1,
        le=65535,
    )
    
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        description="Comma-separated list of allowed CORS origins"
    )
    
    # ==========================================
    # Environment Detection
    # ==========================================
    environment: str = Field(
        default="development",
        description="Application environment (development, staging, production)"
    )
    
    debug: bool = Field(
        default=False,
        description="Enable debug mode"
    )
    
    @field_validator("cors_origins")
    @classmethod
    def parse_cors_origins(cls, v: str) -> str:
        """Validate CORS origins format."""
        if not v:
            return "http://localhost:3000"
        return v
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Return CORS origins as a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment.lower() == "development"
    
    def get_database_url(self) -> str:
        """
        Get database URL with validation.
        
        In production, ensures we're not using default credentials.
        """
        if self.is_production:
            if "password" in self.database_url.lower():
                raise ValueError(
                    "PRODUCTION SECURITY ERROR: Database URL contains default password! "
                    "Please set a secure DATABASE_URL in your .env file."
                )
        return self.database_url
    
    def require_gemini_api_key(self) -> str:
        """
        Get Gemini API key with strict validation.
        
        Raises:
            ValueError: If API key is not configured
        """
        if not self.gemini_api_key:
            raise ValueError(
                "GEMINI_API_KEY is not configured!\n\n"
                "To fix this:\n"
                "1. Copy backend/.env.example to backend/.env\n"
                "2. Add your Gemini API key from https://makersuite.google.com/app/apikey\n"
                "3. Restart the server\n\n"
                "The chatbot will run in mock mode without an API key."
            )
        return self.gemini_api_key


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    This function uses @lru_cache to ensure settings are only loaded once
    per application lifecycle, improving performance.
    
    Returns:
        Settings: Application configuration object
    """
    return Settings()


# Convenience export for direct access
settings = get_settings()

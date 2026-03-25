from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    rapidapi_key: str = ""
    opensky_username: str = ""
    opensky_password: str = ""
    opensky_client_id: str = ""
    opensky_client_secret: str = ""
    groq_api_key: str = ""
    aisstream_api_key: str = ""
    supabase_url: str = ""
    supabase_service_key: str = ""
    upstash_redis_rest_url: str = ""
    upstash_redis_rest_token: str = ""
    cors_origins: str = "*"
    port: int = 8000

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()

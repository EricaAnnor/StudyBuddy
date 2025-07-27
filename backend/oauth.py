from authlib.integrations.starlette_client import OAuth
from .config import Settings

settings = Settings()

oauth = OAuth()

oauth.register(
    name='google',
    client_id = settings.google_client_id,
    client_secret = settings.google_client_secret,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
      client_kwargs={
        'scope': 'openid email profile',
        'response_type':'code'
        
        
    }

)


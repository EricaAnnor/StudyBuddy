from pydantic_settings import BaseSettings,SettingsConfigDict

class Settings(BaseSettings):
    postgres_user:str
    postgres_name:str
    postgres_password:str
    postgres_port:int
    mongo_user:str
    mongo_password:str
    mongo_port:int
    secret_key:str
    algorithm:str
    accessexpiretime:int
    refreshtime:int
    google_client_id:str
    google_client_secret:str
    google_redirect_uri:str
    session_secret:str
    maxgroupcapacity:int
    user_folders:str
    message_images_folder:str
    message_documents_folder:str


    model_config = SettingsConfigDict(env_file=".env")
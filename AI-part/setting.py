import os 
from dotenv import load_dotenv

load_dotenv()

SPEECH_KEY = os.getenv("speech_key")
REGION = os.getenv("region")

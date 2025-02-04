from azure.cognitiveservices.speech import SpeechConfig, SpeechRecognizer, AudioConfig, AutoDetectSourceLanguageConfig, ResultReason
from setting import *


class speech_to_text:

    def __init__(self):
        self.speech_config = SpeechConfig(subscription=SPEECH_KEY, region=REGION)
        self.languages=["en-US", "hi-IN"]

        self.auto_detect_config = AutoDetectSourceLanguageConfig(languages=self.languages)


    def convertor(self,audio):
        print(audio)
        audio_input = AudioConfig(filename=audio)

        speech_recognizer = SpeechRecognizer(
        speech_config=self.speech_config,
        auto_detect_source_language_config=self.auto_detect_config,
        audio_config=audio_input
        )

        result = speech_recognizer.recognize_once()

        # Process response
        print(result)

        if result.reason == ResultReason.RecognizedSpeech:  # Use ResultReason directly
            return result.text
        else:
            return {
                "error": "Speech recognition failed",
                "reason": str(result.reason)
            }

audio_to_text=speech_to_text()

# audio_to_text.convertor("/home/rahulladaniya/Downloads/बंगाल की खाड़ी के शी.wav","hindi")
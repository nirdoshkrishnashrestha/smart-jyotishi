import asyncio
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Use absolute path to backend .env
backend_env = "/Users/nirdosh/Desktop/nepali-jyotish-backend/.env"
load_dotenv(backend_env)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

async def test_gemini():
    if not GEMINI_API_KEY:
        print("GEMINI_API_KEY not found in backend .env")
        return
    
    print(f"Testing Gemini with key: {GEMINI_API_KEY[:5]}...{GEMINI_API_KEY[-5:]}")
    
    genai.configure(api_key=GEMINI_API_KEY)
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        response = await model.generate_content_async("Namaste! Reply with a short greeting in Nepali.")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error calling Gemini API: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini())

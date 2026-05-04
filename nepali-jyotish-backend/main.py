import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import auth, profile, chat, questions, payments

app = FastAPI(title="Smart Jyotishi Backend")

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "https://smartjyotishi.netlify.app",
]

app.add_middleware(
    CORSMiddleware,
allow_origins=["*"],
allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(questions.router, tags=["questions"])
# app.include_router(payments.router, prefix="/api/payments", tags=["payments"])

@app.get("/")
async def health_check():
    return {"status": "ok", "message": "Nepali Jyotish Backend API is running"}

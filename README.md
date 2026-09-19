# Bhasha

Bhasha is an Indian Sign Language (ISL) translation project that converts hand signs into text and speech.

## Project Structure

- `frontend/` — React/Vite frontend
- `backend/` — FastAPI backend and ML inference

## Frontend

The frontend handles:

- Camera access
- Hand tracking
- ISL recognition interface
- Text output
- Sentence building
- Speech output

## Backend

The backend handles:

- MediaPipe landmark input
- Machine-learning inference
- FastAPI API
- Supabase model storage

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
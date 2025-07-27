FROM python:3.11-slim

WORKDIR /studyBuddy

COPY requirements.txt .

RUN pip install  --no-cache-dir -r requirements.txt 

COPY ./backend ./backend

EXPOSE 8000

CMD ["fastapi", "dev", "backend/main.py", "--host", "0.0.0.0", "--port", "8000"]


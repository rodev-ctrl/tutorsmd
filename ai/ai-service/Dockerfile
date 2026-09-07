FROM python:3.12-slim

WORKDIR /app

# requirements копируется отдельно и раньше остального кода: слой с
# pip install переиспользуется из кэша, пока не изменится сам файл.
# При COPY . . перед установкой любая правка в .py заново тянула бы все
# зависимости.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

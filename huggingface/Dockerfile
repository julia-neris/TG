FROM python:3.11-slim

# Instala dependências de sistema necessárias para processamento de áudio
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instala dependências Python (separado para aproveitar o cache do Docker)
COPY requirements.txt .

# PyTorch CPU-only (muito menor que a versão com CUDA)
RUN pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu

# Demais dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código do backend
COPY *.py .

# HF Spaces expõe a porta 7860 por padrão
EXPOSE 7860

# Inicia o servidor
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]

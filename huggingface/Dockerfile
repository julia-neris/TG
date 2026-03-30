FROM python:3.11-slim

# Instala dependências de sistema necessárias para processamento de áudio
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    git \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# 1) PyTorch CPU-only primeiro (índice separado, muito menor que versão CUDA)
RUN pip install --no-cache-dir \
    torch==2.1.0 \
    torchaudio==2.1.0 \
    --index-url https://download.pytorch.org/whl/cpu

# 2) Demais dependências (sem spleeter/tensorflow para caber no timeout do HF)
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código do backend
COPY *.py .

# HF Spaces expõe a porta 7860 por padrão
EXPOSE 7860

# Inicia o servidor
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]

---
title: SinfonIA Backend
emoji: 🎵
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
app_port: 7860
---

# SinfonIA Backend API

API FastAPI para transcrição musical com separação de instrumentos.

## Endpoints

- `GET /health` — verifica se a API está online
- `GET /instruments` — lista instrumentos disponíveis
- `POST /transcribe` — transcrição completa com isolamento de instrumento
- `POST /transcribe/quick` — transcrição rápida sem separação
- `GET /docs` — documentação interativa (Swagger)

## Como usar

Após o deploy, use a URL do Space como `VITE_API_URL` no frontend:

```
VITE_API_URL=https://<seu-usuario>-sinfonia-backend.hf.space
```

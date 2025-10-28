# Gunakan image resmi n8n
FROM n8nio/n8n:latest

# Set timezone & port custom
ENV GENERIC_TIMEZONE=Asia/Jakarta
ENV TZ=Asia/Jakarta
ENV N8N_PORT=1234
ENV N8N_HOST=0.0.0.0
ENV N8N_DISABLE_EXTERNAL_MODULES=false
ENV N8N_EXTERNAL_MODULES_ALLOW_LIST=axios,form-data

# Salin .env agar variabel environment juga dibaca
COPY .env /home/node/.n8n/.env

EXPOSE 1234

# Jalankan n8n
CMD ["n8n", "start"]

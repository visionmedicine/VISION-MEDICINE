# Gunakan image resmi n8n
FROM n8nio/n8n:latest

# Salin file .env ke direktori config n8n
COPY .env /home/node/.n8n/.env

# Set environment
ENV N8N_PORT=1234
ENV N8N_HOST=0.0.0.0
EXPOSE 1234

FROM python:3.11-slim

WORKDIR /app

# Copy the parser script
COPY parse_playlists.py .

# The txt directory will be mounted as a volume
# Output will also be written to mounted volumes

CMD ["python", "parse_playlists.py"]

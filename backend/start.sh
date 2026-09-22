#!/bin/bash
# Start Celery worker & beat in the background
celery -A main worker -B -l info &

# Start Daphne
daphne -b 0.0.0.0 -p $PORT main.asgi:application

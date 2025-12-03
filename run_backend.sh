#!/bin/bash
# Auto-activates venv and runs backend server

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Activate virtual environment
source "$DIR/.venv/bin/activate"

# Run uvicorn
uvicorn app.main:app --reload

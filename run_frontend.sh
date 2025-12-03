#!/bin/bash
# Runs frontend development server

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Navigate to frontend and run
cd "$DIR/frontend"
npm run dev

#!/bin/bash
# Activate virtual environment and run the example

# Activate venv
source venv/bin/activate

# Install dependencies if needed
pip install -q -r requirements.txt

# Check if ANTHROPIC_API_KEY is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ Error: ANTHROPIC_API_KEY environment variable not set"
    echo "   Please run: export ANTHROPIC_API_KEY='your_api_key'"
    exit 1
fi

# Check if SCORECARD_API_KEY is set
if [ -z "$SCORECARD_API_KEY" ]; then
    echo "❌ Error: SCORECARD_API_KEY environment variable not set"
    echo "   Please run: export SCORECARD_API_KEY='your_api_key'"
    exit 1
fi

# Run the script
python3 main.py

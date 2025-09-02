#!/bin/bash

# Tunnel to production Cloud SQL database
# Usage: ./scripts/tunnel-to-prod-db.sh [CONNECTION_NAME] [LOCAL_PORT]

set -e

# Default values
DEFAULT_PORT=5433
PROJECT_ID="stoked-utility-453816-e2"

# Check if connection name is provided
if [ -z "$1" ]; then
    echo "❌ Error: Connection name is required"
    echo ""
    echo "Usage: $0 [CONNECTION_NAME] [LOCAL_PORT]"
    echo ""
    echo "Examples:"
    echo "  $0 stoked-utility-453816-e2:us-central1:dob-validator-prod"
    echo "  $0 stoked-utility-453816-e2:us-central1:dob-validator-prod 5434"
    echo ""
    echo "To find connection names, run:"
    echo "  ./scripts/list-cloud-sql-instances.sh"
    exit 1
fi

CONNECTION_NAME="$1"
LOCAL_PORT="${2:-$DEFAULT_PORT}"

echo "🚀 Starting Cloud SQL tunnel..."
echo "=================================================="
echo "Project: $PROJECT_ID"
echo "Connection: $CONNECTION_NAME"
echo "Local Port: $LOCAL_PORT"
echo "Credentials: ./account.json"
echo "=================================================="

# Set the service account credentials
export GOOGLE_APPLICATION_CREDENTIALS="../account.json"

# Check if the connection name is valid
echo "🔍 Verifying connection name..."
if ! gcloud sql instances list --project="$PROJECT_ID" --filter="connectionName=$CONNECTION_NAME" --format="value(name)" | grep -q .; then
    echo "❌ Error: Invalid connection name '$CONNECTION_NAME'"
    echo ""
    echo "Available connections:"
    gcloud sql instances list --project="$PROJECT_ID" --format="value(connectionName)"
    exit 1
fi

echo "✅ Connection name verified"

# Check if port is available
if lsof -Pi :$LOCAL_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Warning: Port $LOCAL_PORT is already in use"
    echo "   You may need to choose a different port or stop the existing process"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🔗 Starting tunnel..."
echo "   Local: localhost:$LOCAL_PORT"
echo "   Remote: $CONNECTION_NAME"
echo ""
echo "📋 Connection details for DBeaver/psql:"
echo "   Host: localhost"
echo "   Port: $LOCAL_PORT"
echo "   Database: [your_database_name]"
echo "   Username: [your_database_user]"
echo "   Password: [your_database_password]"
echo ""
echo "🛑 Press Ctrl+C to stop the tunnel"
echo "=================================================="

# Start the tunnel
../cloud_sql_proxy \
    --credentials-file=../account.json \
    --port=$LOCAL_PORT \
    --project=$PROJECT_ID \
    $CONNECTION_NAME

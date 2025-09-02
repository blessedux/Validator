#!/bin/bash

# Get database credentials from Cloud SQL
# Usage: ./scripts/get-db-credentials.sh [INSTANCE_NAME]

set -e

PROJECT_ID="stoked-utility-453816-e2"

# Check if instance name is provided
if [ -z "$1" ]; then
    echo "❌ Error: Instance name is required"
    echo ""
    echo "Usage: $0 [INSTANCE_NAME]"
    echo ""
    echo "To find instance names, run:"
    echo "  ./scripts/list-cloud-sql-instances.sh"
    exit 1
fi

INSTANCE_NAME="$1"

echo "🔍 Getting database credentials for instance: $INSTANCE_NAME"
echo "=================================================="

# Set the service account credentials
export GOOGLE_APPLICATION_CREDENTIALS="../account.json"

# Check if instance exists
if ! gcloud sql instances list --project="$PROJECT_ID" --filter="name=$INSTANCE_NAME" --format="value(name)" | grep -q .; then
    echo "❌ Error: Instance '$INSTANCE_NAME' not found"
    echo ""
    echo "Available instances:"
    gcloud sql instances list --project="$PROJECT_ID" --format="value(name)"
    exit 1
fi

echo "✅ Instance found"

# Get instance details
echo ""
echo "📊 Instance details:"
gcloud sql instances describe $INSTANCE_NAME --project="$PROJECT_ID" --format="table(name,region,settings.tier,state,connectionName)"

# List databases
echo ""
echo "🗄️  Available databases:"
gcloud sql databases list --instance=$INSTANCE_NAME --project="$PROJECT_ID" --format="table(name,charset,collation)"

# List users
echo ""
echo "👥 Database users:"
gcloud sql users list --instance=$INSTANCE_NAME --project="$PROJECT_ID" --format="table(name,host,type)"

echo ""
echo "🔗 Connection string format:"
echo "   postgresql://[USERNAME]:[PASSWORD]@localhost:[TUNNEL_PORT]/[DATABASE_NAME]"
echo ""
echo "📋 Next steps:"
echo "   1. Start tunnel: ./scripts/tunnel-to-prod-db.sh [CONNECTION_NAME]"
echo "   2. Connect with DBeaver using localhost:[TUNNEL_PORT]"
echo "   3. Use the database name and user from above"

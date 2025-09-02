#!/bin/bash

# List Cloud SQL instances using the service account
# This script will help identify the production database instance

set -e

echo "🔍 Listing Cloud SQL instances for project: stoked-utility-453816-e2"
echo "=================================================="

# Set the service account credentials
export GOOGLE_APPLICATION_CREDENTIALS="../account.json"

# List all Cloud SQL instances
echo "📋 Available Cloud SQL instances:"
gcloud sql instances list --project=stoked-utility-453816-e2 --format="table(name,region,settings.tier,state,connectionName)"

echo ""
echo "🔗 Connection names (use these for tunneling):"
gcloud sql instances list --project=stoked-utility-453816-e2 --format="value(connectionName)"

echo ""
echo "📊 Instance details:"
gcloud sql instances list --project=stoked-utility-453816-e2 --format="table(name,region,settings.tier,state,createTime,settings.databaseVersion)"

echo ""
echo "✅ Use the connection name from above to create a tunnel"
echo "   Example: ./scripts/tunnel-to-prod-db.sh [CONNECTION_NAME]"

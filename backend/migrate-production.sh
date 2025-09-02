#!/bin/bash

echo "🚀 Starting production database migration..."
echo "📅 $(date)"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the backend directory."
    exit 1
fi

# Check if Prisma is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js and npm."
    exit 1
fi

echo "🔍 Checking current database status..."
npx prisma migrate status

echo "📦 Installing dependencies if needed..."
npm install --frozen-lockfile

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "✅ Migration completed successfully!"
echo "🔍 Final database status:"
npx prisma migrate status

echo "📅 Migration finished at: $(date)" 
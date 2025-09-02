# Production Database Migration Guide

## Issue Description

The production environment is experiencing 500 errors on `/api/auth/verify` because the database schema is missing the `profileImage` field that was added to the `profiles` table.

## Root Cause

- **Local environment**: Database is up-to-date with latest migrations
- **Production environment**: Database schema is outdated, missing the `profileImage` field
- **CI/CD workflow**: Does not include database migrations, only builds the applications

## Solution

Apply the database migration manually on the production server.

## Files Provided

1. `migration-add-profile-image.sql` - Main migration script
2. `migration-rollback-profile-image.sql` - Rollback script (if needed)
3. `migrate-production.sh` - Automated migration script

## Migration Steps

### Option 1: Manual SQL Execution (Recommended)

```bash
# Connect to production database
psql -h [PRODUCTION_DB_HOST] -U [DB_USER] -d [DB_NAME]

# Run the migration
\i migration-add-profile-image.sql
```

### Option 2: Automated Script

```bash
# Navigate to backend directory on production server
cd /opt/DOBVALIDATOR/backend

# Make script executable
chmod +x migrate-production.sh

# Run the migration
./migrate-production.sh
```

### Option 3: Direct Command

```bash
# Run migration directly
psql -h [PRODUCTION_DB_HOST] -U [DB_USER] -d [DB_NAME] -f migration-add-profile-image.sql
```

## Verification

After running the migration, verify it was successful:

```sql
-- Check if the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'profileImage';

-- Should return:
-- column_name | data_type | is_nullable
-- profileImage | text | YES
```

## Rollback (If Needed)

If the migration causes issues, you can rollback:

```bash
psql -h [PRODUCTION_DB_HOST] -U [DB_USER] -d [DB_NAME] -f migration-rollback-profile-image.sql
```

## Safety Notes

- ✅ This migration is **safe** - it only adds a nullable column
- ✅ No existing data will be affected
- ✅ The column is optional, so existing code will continue to work
- ✅ Can be rolled back if needed

## Expected Result

After applying this migration:

- ✅ `/api/auth/verify` endpoint will work correctly
- ✅ Profile image upload functionality will work
- ✅ No breaking changes to existing functionality

## Contact

If you encounter any issues, please contact the development team.

---

**Migration Date**: 2025-07-17  
**Affected Table**: `profiles`  
**Change**: Add `profileImage TEXT` column

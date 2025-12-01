# Database Security Guide

This guide explains the security fixes applied to resolve Supabase database linter warnings and best practices for maintaining a secure database.

## 🔒 Security Issues Fixed

### 1. Function Search Path Mutable (WARN)

**Issue**: Functions `update_updated_at_column` and `bookings_check_max_guests` had mutable search_path, which could be exploited for SQL injection attacks.

**Fix Applied**:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions  -- Fixed: Explicit search_path
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
```

**Why This Matters**: 
- Prevents search_path manipulation attacks
- Ensures functions always use the intended schema
- Follows PostgreSQL security best practices

### 2. Extension in Public Schema (WARN)

**Issue**: Extensions `uuid-ossp` and `btree_gist` were installed in the public schema, which is a security risk.

**Fix Applied**:
```sql
-- Create dedicated schema for extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move extensions to dedicated schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "btree_gist" SCHEMA extensions;

-- Grant usage on the extensions schema
GRANT USAGE ON SCHEMA extensions TO public;
```

**Why This Matters**:
- Isolates extensions from public schema
- Reduces attack surface
- Follows principle of least privilege

## 🛡️ Security Features Implemented

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:

```sql
-- Example: Properties are only viewable if active
CREATE POLICY "Properties are viewable by everyone" ON properties
    FOR SELECT USING (status = 'active');

-- Example: Guests can only see their own data
CREATE POLICY "Guests can view own profile" ON guests
    FOR SELECT USING (auth.uid()::text = id::text);
```

### Input Validation
Comprehensive constraints and checks:

```sql
-- Email validation
CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')

-- Coordinate validation
CONSTRAINT valid_coordinates CHECK (
    (latitude IS NULL AND longitude IS NULL) OR 
    (latitude IS NOT NULL AND longitude IS NOT NULL AND 
     latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
)

-- Business logic validation
CONSTRAINT valid_dates CHECK (check_out_date > check_in_date)
```

### Conflict Prevention
Advanced constraints to prevent data inconsistencies:

```sql
-- Prevent overlapping bookings
CONSTRAINT no_overlapping_bookings EXCLUDE USING extensions.gist (
    property_id WITH =,
    daterange(check_in_date, check_out_date) WITH &&
) WHERE (status IN ('confirmed', 'pending'))

-- Ensure only one primary image per property
CONSTRAINT unique_primary_image EXCLUDE (property_id WITH =) WHERE (is_primary = true)
```

## 🔧 Migration Instructions

### For Existing Databases

1. **Run the migration script**:
   ```sql
   -- Execute database/migration_fix_security.sql in Supabase SQL Editor
   ```

2. **Verify the fixes**:
   ```sql
   -- Check function security
   SELECT proname, proconfig FROM pg_proc 
   WHERE proname IN ('update_updated_at_column', 'bookings_check_max_guests');
   
   -- Check extension placement
   SELECT extname, n.nspname FROM pg_extension e
   JOIN pg_namespace n ON e.extnamespace = n.oid
   WHERE extname IN ('uuid-ossp', 'btree_gist');
   ```

### For New Databases

Use the fixed schema:
```sql
-- Execute database/schema_fixed.sql in Supabase SQL Editor
```

## 🚨 Security Best Practices

### 1. Function Security
Always use `SECURITY DEFINER` and explicit `search_path` for functions:

```sql
CREATE OR REPLACE FUNCTION my_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions  -- Always specify
AS $$
BEGIN
    -- Function body
END;
$$;
```

### 2. Extension Management
Install extensions in dedicated schemas:

```sql
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION "extension_name" SCHEMA extensions;
```

### 3. RLS Policies
Implement granular access control:

```sql
-- Public read access
CREATE POLICY "public_read" ON table_name
    FOR SELECT USING (true);

-- User-specific access
CREATE POLICY "user_own_data" ON table_name
    FOR ALL USING (auth.uid()::text = user_id::text);
```

### 4. Input Validation
Validate all inputs at the database level:

```sql
-- Numeric constraints
CHECK (price > 0)
CHECK (bedrooms > 0)

-- String constraints
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')

-- Date constraints
CHECK (check_out_date > check_in_date)
```

## 🔍 Monitoring and Auditing

### Database Linter
Regularly run Supabase database linter to catch security issues:

```bash
# In Supabase CLI
supabase db lint
```

### Security Checklist
- [ ] All functions have explicit `search_path`
- [ ] Extensions are in dedicated schemas
- [ ] RLS is enabled on all tables
- [ ] Input validation constraints are in place
- [ ] Business logic constraints prevent conflicts
- [ ] Proper permissions are granted

### Regular Audits
1. **Monthly**: Review RLS policies
2. **Quarterly**: Audit function security
3. **Annually**: Full security assessment

## 🚀 Performance Considerations

### Indexes for Security
Security-related indexes for efficient policy evaluation:

```sql
-- Index for RLS policy performance
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_guests_auth_id ON guests(id) WHERE auth.uid()::text = id::text;
```

### Query Optimization
Optimize queries that work with RLS:

```sql
-- Good: Uses indexed column in WHERE clause
SELECT * FROM properties WHERE status = 'active';

-- Avoid: Complex expressions in RLS policies
-- Use simple column comparisons when possible
```

## 📚 Additional Resources

- [Supabase Security Guide](https://supabase.com/docs/guides/database/security)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/security.html)
- [Row Level Security Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## 🆘 Troubleshooting

### Common Issues

1. **Function not found errors**:
   - Ensure extensions are in the correct schema
   - Use fully qualified names: `extensions.uuid_generate_v4()`

2. **RLS blocking legitimate queries**:
   - Check policy conditions
   - Verify user authentication status
   - Test with `SET row_security = off` (temporarily)

3. **Permission denied errors**:
   - Verify GRANT statements
   - Check schema permissions
   - Ensure proper role assignments

### Debug Commands

```sql
-- Check current user and permissions
SELECT current_user, current_role;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check function security
SELECT proname, prosecdef, proconfig 
FROM pg_proc 
WHERE proname LIKE '%update%';
```

This security implementation ensures your database is protected against common attack vectors while maintaining optimal performance and functionality.

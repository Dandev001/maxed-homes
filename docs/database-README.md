# Database Schema Setup Guide

This directory contains the complete, production-ready database schema for Maxed Homes.

## 📁 Files

- **`schema_complete.sql`** - Complete database schema with all tables, indexes, triggers, and security policies
- **`seed_data.sql`** - Sample data to get you started (optional)

## 🚀 Quick Start

### 1. Create Your Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish provisioning

### 2. Run the Schema

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `schema_complete.sql`
5. Click **Run** (or press `Ctrl+Enter`)

The schema will create:
- ✅ 7 tables (hosts, properties, property_images, guests, bookings, availability_calendar, reviews)
- ✅ All necessary indexes for optimal performance
- ✅ Triggers for automatic timestamp updates
- ✅ Business logic constraints (overlapping bookings, max guests, etc.)
- ✅ Row Level Security (RLS) policies
- ✅ Helper functions for common queries

### 3. (Optional) Seed Sample Data

If you want to populate your database with sample data:

1. In the SQL Editor, create a new query
2. Copy and paste the contents of `seed_data.sql`
3. Click **Run**

## 📊 Database Structure

### Core Tables

1. **hosts** - Property owners/managers
2. **properties** - Property listings
3. **property_images** - Property image gallery
4. **guests** - Guest/user accounts
5. **bookings** - Reservations
6. **availability_calendar** - Date availability and pricing
7. **reviews** - Ratings and reviews

### Relationships

```
hosts (1) ──→ (many) properties
properties (1) ──→ (many) property_images
properties (1) ──→ (many) bookings
properties (1) ──→ (many) availability_calendar
properties (1) ──→ (many) reviews
guests (1) ──→ (many) bookings
guests (1) ──→ (many) reviews
bookings (1) ──→ (1) reviews
```

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies for:
- **Public access**: View active properties, images, and availability
- **Guest access**: Manage own profile and bookings
- **Host access**: Manage own properties, images, and availability
- **Review access**: Guests can create reviews, hosts can respond

### Data Validation

- Email format validation
- Coordinate validation (latitude/longitude)
- Date range validation
- Business logic constraints (no overlapping bookings, max guests, etc.)

## 🎯 Key Features

### Optimized Indexes

- Search by location, price, city, status
- Fast property lookups
- Efficient booking queries
- Quick availability checks

### Automatic Updates

- `updated_at` timestamps automatically updated on record changes
- Host response timestamps for reviews

### Business Logic

- Prevents overlapping bookings
- Validates guest count against property capacity
- Ensures only one primary image per property
- Validates booking dates and amounts

## 🔧 Helper Functions

### `get_property_rating(property_uuid)`

Returns the average rating and total review count for a property.

```sql
SELECT * FROM get_property_rating('property-uuid-here');
```

### `check_property_availability(property_uuid, check_in, check_out)`

Checks if a property is available for the given date range.

```sql
SELECT check_property_availability('property-uuid', '2024-06-01', '2024-06-05');
```

## 📝 Next Steps

1. **Set up Authentication**: Link Supabase Auth users to `guests` and `hosts` tables
2. **Configure Storage**: Set up Supabase Storage for property images
3. **Test RLS Policies**: Verify security policies work as expected
4. **Seed Data**: Add sample data for development/testing

## 🐛 Troubleshooting

### Error: "extension btree_gist does not exist"

If you get this error, it means your Supabase instance doesn't have the extension. The schema will still work, but the unique primary image constraint uses a different method.

### Error: "permission denied for schema public"

Make sure you're running the SQL as a database admin. In Supabase, this should work automatically in the SQL Editor.

### RLS Policies Not Working

1. Make sure RLS is enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Check that your auth is set up correctly
3. Verify the policy conditions match your auth.uid()

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)


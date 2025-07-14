# Migrating from JSON to Supabase PostgreSQL

This guide will help you migrate your data from the local `db.json` file to Supabase PostgreSQL database.

## Prerequisites

1. **Supabase Account**: Make sure you have created a Supabase account and project.
2. **Database Setup**: Ensure your Supabase database has the following tables set up:
   - `usuarios` (users)
   - `categories`
   - `transactions`
   - `transactionsType`

## Migration Steps

### 1. Setup Environment Variables

Create a `.env` file in the backend folder with the following content:

```
SUPABASE_URL=https://uastoompfymjolifijjj.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
JWT_SECRET=your-jwt-secret-key-here
PORT=3000
```

Replace `your-supabase-anon-key-here` with your actual Supabase anon key from the API settings in your Supabase dashboard.

### 2. Run Migration Script

Run the following command in the terminal:

```bash
npm run migrate
```

This will:
1. Read data from the local `db.json` file
2. Migrate transaction types, users, categories, and transactions to Supabase
3. Display progress during migration

### 3. Verify Migration

After migration completes successfully:
1. Check your Supabase dashboard to verify that all data has been migrated correctly
2. Make a test request to the API to ensure it's working with Supabase

### 4. Update API Configuration

The `api.js` file has been updated to use Supabase PostgreSQL. Make sure the `.env` file contains the correct credentials.

## Troubleshooting

- **Error: SUPABASE_ANON_KEY is not set**: Make sure to add your Supabase anon key in the `.env` file.
- **Duplicate records**: The migration script will skip any duplicate records.
- **Data format issues**: The script handles date format conversion from DD/MM/YY to YYYY-MM-DD format needed by Supabase.

## After Migration

Once migration is complete, your backend API will use Supabase PostgreSQL instead of the local JSON file. You don't need to make any changes to the frontend if the API endpoints remain the same. 
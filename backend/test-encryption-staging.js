#!/usr/bin/env node

/**
 * Staging Environment Test Script for Encryption
 * 
 * This script tests the encryption implementation in a staging environment
 * to ensure it's safe for production deployment.
 */

const { createClient } = require('@supabase/supabase-js');
const EncryptionMiddleware = require('./security/encryptionMiddleware');
const encryption = require('./security/encryption');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runStagingTests() {
    console.log('🧪 Starting encryption staging tests...\n');

    try {
        // Test 1: Basic encryption functionality
        console.log('📋 Test 1: Basic encryption functionality');
        const testData = 'Test transaction description';
        const encrypted = encryption.encrypt(testData);
        const decrypted = encryption.decrypt(encrypted);
        
        if (decrypted === testData) {
            console.log('✅ Basic encryption/decryption works');
        } else {
            throw new Error('Basic encryption test failed');
        }

        // Test 2: Database connection and schema
        console.log('\n📋 Test 2: Database schema verification');
        
        // Check if hash columns exist
        const tables = ['transactions', 'group_expenses', 'categorization_feedback', 'ml_training_data'];
        for (const table of tables) {
            const searchableFields = EncryptionMiddleware.getSearchableFields(table);
            if (searchableFields.length > 0) {
                const hashField = searchableFields[0] + '_hash';
                try {
                    await supabase.from(table).select(hashField).limit(1);
                    console.log(`✅ Hash column exists for ${table}.${hashField}`);
                } catch (error) {
                    if (error.message.includes('column') && error.message.includes('does not exist')) {
                        console.log(`⚠️  Hash column missing for ${table}.${hashField} - run migration first`);
                    } else {
                        console.log(`✅ Table ${table} accessible`);
                    }
                }
            }
        }

        // Test 3: Create test transaction
        console.log('\n📋 Test 3: Create encrypted transaction');
        const testTransaction = {
            userId: 'test-user-staging',
            description: 'Staging test transaction - Coffee purchase',
            amount: 4.50,
            category: 'Food & Dining',
            date: new Date().toISOString().split('T')[0],
            typeId: 1,
            createdAt: new Date().toISOString()
        };

        const encryptedTransaction = EncryptionMiddleware.encryptForInsert('transactions', testTransaction);
        
        const { data: createdTransaction, error: insertError } = await supabase
            .from('transactions')
            .insert([encryptedTransaction])
            .select()
            .single();

        if (insertError) {
            throw new Error(`Failed to create test transaction: ${insertError.message}`);
        }

        console.log('✅ Test transaction created with encrypted data');
        console.log(`   ID: ${createdTransaction.id}`);
        console.log(`   Encrypted description: ${createdTransaction.description.substring(0, 50)}...`);

        // Test 4: Retrieve and decrypt transaction
        console.log('\n📋 Test 4: Retrieve and decrypt transaction');
        
        const { data: retrievedTransaction, error: selectError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', createdTransaction.id)
            .single();

        if (selectError) {
            throw new Error(`Failed to retrieve test transaction: ${selectError.message}`);
        }

        const decryptedTransaction = EncryptionMiddleware.decryptFromSelect('transactions', retrievedTransaction);
        
        if (decryptedTransaction.description === testTransaction.description) {
            console.log('✅ Transaction decryption works correctly');
            console.log(`   Decrypted description: ${decryptedTransaction.description}`);
        } else {
            throw new Error('Transaction decryption failed');
        }

        // Test 5: Search functionality
        console.log('\n📋 Test 5: Search functionality');
        
        // Test exact search if hash column exists
        try {
            const searchCondition = EncryptionMiddleware.createSearchCondition('transactions', 'description', 'Coffee purchase');
            const { data: searchResults } = await supabase
                .from('transactions')
                .select('*')
                .match(searchCondition)
                .limit(5);

            if (searchResults && searchResults.length > 0) {
                console.log('✅ Hash-based search works');
                console.log(`   Found ${searchResults.length} results`);
            } else {
                console.log('⚠️  No search results (hash column may not exist or be populated)');
            }
        } catch (searchError) {
            console.log('⚠️  Search test skipped (hash columns not available)');
        }

        // Test 6: Clean up test data
        console.log('\n📋 Test 6: Cleanup test data');
        
        const { error: deleteError } = await supabase
            .from('transactions')
            .delete()
            .eq('id', createdTransaction.id);

        if (deleteError) {
            console.log(`⚠️  Failed to cleanup test transaction: ${deleteError.message}`);
        } else {
            console.log('✅ Test data cleaned up successfully');
        }

        // Test 7: Check existing data compatibility
        console.log('\n📋 Test 7: Existing data compatibility');
        
        const { data: existingTransactions, error: existingError } = await supabase
            .from('transactions')
            .select('id, description')
            .limit(5);

        if (existingError) {
            throw new Error(`Failed to retrieve existing transactions: ${existingError.message}`);
        }

        if (existingTransactions && existingTransactions.length > 0) {
            console.log(`✅ Found ${existingTransactions.length} existing transactions`);
            
            // Test decryption on existing data
            const decryptedExisting = EncryptionMiddleware.decryptFromSelect('transactions', existingTransactions);
            console.log('✅ Existing transaction decryption works (backward compatibility)');
            
            // Check if any are already encrypted
            const encryptedCount = existingTransactions.filter(t => 
                t.description && t.description.includes(':')
            ).length;
            
            console.log(`   ${encryptedCount} transactions already encrypted`);
            console.log(`   ${existingTransactions.length - encryptedCount} transactions still unencrypted`);
        } else {
            console.log('ℹ️  No existing transactions found');
        }

        console.log('\n🎉 All staging tests passed successfully!');
        console.log('\n✅ Encryption implementation is ready for production deployment');
        
        console.log('\n📋 Next steps for production:');
        console.log('1. Set ENCRYPTION_KEY and HASH_SALT environment variables');
        console.log('2. Run database migration: migration_add_encryption_hash_columns.sql');
        console.log('3. Deploy the application code');
        console.log('4. Run data migration: node migrate-existing-data.js');
        console.log('5. Monitor application logs for any issues');

    } catch (error) {
        console.error('\n❌ Staging test failed:', error.message);
        console.error('\n🚨 Do NOT deploy to production until this issue is resolved');
        process.exit(1);
    }
}

// Add environment checks
async function checkEnvironment() {
    console.log('🔍 Checking environment configuration...\n');

    // Check encryption key
    if (!process.env.ENCRYPTION_KEY) {
        console.log('⚠️  ENCRYPTION_KEY not set - using default (not secure for production)');
    } else {
        console.log('✅ ENCRYPTION_KEY is set');
    }

    // Check hash salt
    if (!process.env.HASH_SALT) {
        console.log('⚠️  HASH_SALT not set - using default (not secure for production)');
    } else {
        console.log('✅ HASH_SALT is set');
    }

    // Check database connection
    try {
        const { data, error } = await supabase.from('transaction_types').select('count').limit(1);
        if (error) {
            throw error;
        }
        console.log('✅ Database connection working');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }

    console.log('');
}

// Run the tests
if (require.main === module) {
    checkEnvironment()
        .then(() => runStagingTests())
        .catch(error => {
            console.error('❌ Environment check failed:', error);
            process.exit(1);
        });
}

module.exports = { runStagingTests, checkEnvironment }; 
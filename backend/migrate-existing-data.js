#!/usr/bin/env node

/**
 * Data Migration Script for Encryption
 * 
 * This script migrates existing unencrypted data to the new encrypted format.
 * It should be run once when deploying the encryption feature to production.
 * 
 * IMPORTANT: 
 * - Make a database backup before running this script
 * - Run this script during a maintenance window
 * - Test thoroughly in a staging environment first
 */

const { createClient } = require('@supabase/supabase-js');
const EncryptionMiddleware = require('./security/encryptionMiddleware');
require('dotenv').config();

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Use service role key for migration

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required environment variables: SUPABASE_URL and SUPABASE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tables and their sensitive fields to migrate
const MIGRATION_CONFIG = {
    transactions: {
        fields: ['description'],
        batchSize: 100
    },
    categories: {
        fields: ['name'],
        batchSize: 500
    },
    groups: {
        fields: ['name'],
        batchSize: 100
    },
    group_expenses: {
        fields: ['description'],
        batchSize: 100
    },
    savings_goals: {
        fields: ['goal_name'],
        batchSize: 100
    },
    ml_training_data: {
        fields: ['description'],
        batchSize: 100
    },
    categorization_feedback: {
        fields: ['transaction_description'],
        batchSize: 100
    }
};

/**
 * Check if a table has already been migrated
 */
async function checkMigrationStatus(tableName) {
    try {
        // Check if hash columns exist for searchable fields
        const searchableFields = EncryptionMiddleware.getSearchableFields(tableName);
        
        if (searchableFields.length === 0) {
            return { isMigrated: false, reason: 'No searchable fields to check' };
        }

        // Try to query for hash column
        const hashField = searchableFields[0] + '_hash';
        const { data, error } = await supabase
            .from(tableName)
            .select(hashField)
            .limit(1);

        if (error && error.message.includes('column') && error.message.includes('does not exist')) {
            return { isMigrated: false, reason: 'Hash columns do not exist' };
        }

        // Check if any data has been encrypted (look for ':' in encrypted fields)
        const sensitiveField = EncryptionMiddleware.getSensitiveFields(tableName)[0];
        if (sensitiveField) {
            const { data: sampleData } = await supabase
                .from(tableName)
                .select(sensitiveField)
                .not(sensitiveField, 'is', null)
                .limit(10);

            if (sampleData && sampleData.length > 0) {
                const hasEncrypted = sampleData.some(row => 
                    row[sensitiveField] && typeof row[sensitiveField] === 'string' && row[sensitiveField].includes(':')
                );
                
                if (hasEncrypted) {
                    return { isMigrated: true, reason: 'Encrypted data found' };
                } else {
                    return { isMigrated: false, reason: 'No encrypted data found' };
                }
            }
        }

        return { isMigrated: false, reason: 'Unable to determine status' };
    } catch (error) {
        return { isMigrated: false, reason: `Error checking: ${error.message}` };
    }
}

/**
 * Migrate a single table
 */
async function migrateTable(tableName, config) {
    console.log(`\n🔄 Starting migration for table: ${tableName}`);
    
    const status = await checkMigrationStatus(tableName);
    console.log(`   Status check: ${status.reason}`);
    
    if (status.isMigrated) {
        console.log(`   ⏭️  Table ${tableName} appears to already be migrated, skipping`);
        return { success: true, processed: 0, skipped: true };
    }

    try {
        // Get total count
        const { count: totalCount, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (countError) {
            throw new Error(`Failed to count records: ${countError.message}`);
        }

        console.log(`   📊 Total records to process: ${totalCount}`);

        if (totalCount === 0) {
            console.log(`   ✅ No records to migrate in ${tableName}`);
            return { success: true, processed: 0 };
        }

        let processed = 0;
        let offset = 0;
        const batchSize = config.batchSize;

        while (offset < totalCount) {
            console.log(`   🔄 Processing batch ${Math.floor(offset / batchSize) + 1}/${Math.ceil(totalCount / batchSize)}`);

            // Get batch of records
            const { data: records, error: fetchError } = await supabase
                .from(tableName)
                .select('*')
                .range(offset, offset + batchSize - 1);

            if (fetchError) {
                throw new Error(`Failed to fetch records: ${fetchError.message}`);
            }

            if (!records || records.length === 0) {
                break;
            }

            // Prepare updates for this batch
            const updates = [];

            for (const record of records) {
                // Check if record needs encryption
                const needsEncryption = config.fields.some(field => {
                    const value = record[field];
                    return value && typeof value === 'string' && !value.includes(':');
                });

                if (needsEncryption) {
                    // Encrypt the record
                    const encryptedRecord = EncryptionMiddleware.encryptForInsert(tableName, record);
                    
                    // Only update if there are changes
                    const hasChanges = config.fields.some(field => 
                        encryptedRecord[field] !== record[field]
                    );

                    if (hasChanges) {
                        updates.push({
                            id: record.id,
                            ...encryptedRecord
                        });
                    }
                }
            }

            // Perform batch update if there are changes
            if (updates.length > 0) {
                const { error: updateError } = await supabase
                    .from(tableName)
                    .upsert(updates);

                if (updateError) {
                    throw new Error(`Failed to update records: ${updateError.message}`);
                }

                processed += updates.length;
                console.log(`   ✅ Encrypted ${updates.length} records`);
            } else {
                console.log(`   ⏭️  No records needed encryption in this batch`);
            }

            offset += batchSize;

            // Small delay to avoid overwhelming the database
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`   ✅ Completed migration for ${tableName}: ${processed} records processed`);
        return { success: true, processed };

    } catch (error) {
        console.error(`   ❌ Failed to migrate ${tableName}: ${error.message}`);
        return { success: false, error: error.message, processed: 0 };
    }
}

/**
 * Verify migration was successful
 */
async function verifyMigration(tableName) {
    try {
        const sensitiveFields = EncryptionMiddleware.getSensitiveFields(tableName);
        
        if (sensitiveFields.length === 0) {
            return { success: true, message: 'No sensitive fields to verify' };
        }

        // Sample some records and verify they can be decrypted
        const { data: sampleRecords, error } = await supabase
            .from(tableName)
            .select('*')
            .not(sensitiveFields[0], 'is', null)
            .limit(5);

        if (error) {
            return { success: false, message: `Error fetching sample: ${error.message}` };
        }

        if (!sampleRecords || sampleRecords.length === 0) {
            return { success: true, message: 'No records to verify' };
        }

        // Try to decrypt a sample
        try {
            const decrypted = EncryptionMiddleware.decryptFromSelect(tableName, sampleRecords[0]);
            return { success: true, message: 'Decryption successful' };
        } catch (decryptError) {
            return { success: false, message: `Decryption failed: ${decryptError.message}` };
        }

    } catch (error) {
        return { success: false, message: `Verification error: ${error.message}` };
    }
}

/**
 * Main migration function
 */
async function runMigration() {
    console.log('🚀 Starting data encryption migration...\n');
    
    // Check environment
    if (!process.env.ENCRYPTION_KEY) {
        console.error('❌ ENCRYPTION_KEY environment variable not set');
        process.exit(1);
    }

    console.log('✅ Environment check passed');

    const results = {};
    let totalProcessed = 0;
    let hasErrors = false;

    // Migrate each table
    for (const [tableName, config] of Object.entries(MIGRATION_CONFIG)) {
        const result = await migrateTable(tableName, config);
        results[tableName] = result;
        
        if (result.success) {
            totalProcessed += result.processed;
            
            // Verify the migration
            console.log(`   🔍 Verifying migration for ${tableName}...`);
            const verification = await verifyMigration(tableName);
            
            if (verification.success) {
                console.log(`   ✅ Verification passed: ${verification.message}`);
            } else {
                console.error(`   ❌ Verification failed: ${verification.message}`);
                hasErrors = true;
            }
        } else {
            hasErrors = true;
        }
    }

    // Print summary
    console.log('\n📋 Migration Summary');
    console.log('========================');
    
    for (const [tableName, result] of Object.entries(results)) {
        const status = result.success ? '✅' : '❌';
        const processed = result.skipped ? 'skipped' : `${result.processed} records`;
        console.log(`${status} ${tableName}: ${processed}`);
        
        if (!result.success) {
            console.log(`   Error: ${result.error}`);
        }
    }

    console.log(`\n📊 Total records encrypted: ${totalProcessed}`);

    if (hasErrors) {
        console.log('\n⚠️  Migration completed with errors. Please review the output above.');
        process.exit(1);
    } else {
        console.log('\n🎉 Migration completed successfully!');
        console.log('\n⚠️  Important next steps:');
        console.log('   1. Verify the application works correctly with encrypted data');
        console.log('   2. Run the hash column migration: migration_add_encryption_hash_columns.sql');
        console.log('   3. Update existing data to populate hash columns (run this script again)');
        console.log('   4. Consider removing plaintext backups after thorough testing');
    }
}

// Handle command line execution
if (require.main === module) {
    // Add safety check
    if (process.env.NODE_ENV === 'production') {
        console.log('⚠️  PRODUCTION ENVIRONMENT DETECTED');
        console.log('This migration will encrypt existing data in your production database.');
        console.log('Please ensure you have made a complete backup before proceeding.\n');
        
        // In production, require explicit confirmation
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Type "CONFIRM" to proceed with production migration: ', (answer) => {
            rl.close();
            
            if (answer === 'CONFIRM') {
                runMigration().catch(error => {
                    console.error('❌ Migration failed:', error);
                    process.exit(1);
                });
            } else {
                console.log('Migration cancelled.');
                process.exit(0);
            }
        });
    } else {
        // Non-production environment - proceed directly
        runMigration().catch(error => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
    }
}

module.exports = {
    runMigration,
    migrateTable,
    checkMigrationStatus,
    verifyMigration
}; 
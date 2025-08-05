const encryption = require('./encryption');

/**
 * Configuration for sensitive fields per table
 * Maps table names to arrays of sensitive field names that should be encrypted
 */
const SENSITIVE_FIELDS = {
    transactions: ['description'],
    group_expenses: ['description'],
    recurring_transactions: ['description'],
    savings_goals: ['goal_name'],
    categories: ['name'],
    groups: ['name'],
    merchant_patterns: ['pattern'],
    categorization_feedback: ['transaction_description'],
    ml_training_data: ['description'],
    profiles: ['name']
};

/**
 * Configuration for searchable fields that need hashed versions
 * These fields will have corresponding _hash columns in the database
 */
const SEARCHABLE_FIELDS = {
    transactions: ['description'],
    group_expenses: ['description'],
    categorization_feedback: ['transaction_description'],
    ml_training_data: ['description']
};

/**
 * Middleware to encrypt sensitive data before database operations
 */
class EncryptionMiddleware {
    /**
     * Encrypt data before inserting into database
     * @param {string} tableName - Name of the table
     * @param {Object|Array} data - Data to encrypt
     * @returns {Object|Array} - Data with encrypted sensitive fields
     */
    static encryptForInsert(tableName, data) {
        const sensitiveFields = SENSITIVE_FIELDS[tableName] || [];
        const searchableFields = SEARCHABLE_FIELDS[tableName] || [];
        
        if (sensitiveFields.length === 0) {
            return data;
        }

        // Handle single object
        if (!Array.isArray(data)) {
            return this.encryptObject(data, sensitiveFields, searchableFields);
        }

        // Handle array of objects
        return data.map(item => this.encryptObject(item, sensitiveFields, searchableFields));
    }

    /**
     * Decrypt data after retrieving from database
     * @param {string} tableName - Name of the table
     * @param {Object|Array} data - Data to decrypt
     * @returns {Object|Array} - Data with decrypted sensitive fields
     */
    static decryptFromSelect(tableName, data) {
        const sensitiveFields = SENSITIVE_FIELDS[tableName] || [];
        
        if (sensitiveFields.length === 0 || !data) {
            return data;
        }

        // Handle single object
        if (!Array.isArray(data)) {
            return this.decryptObject(data, sensitiveFields);
        }

        // Handle array of objects
        return data.map(item => this.decryptObject(item, sensitiveFields));
    }

    /**
     * Encrypt sensitive fields in an object and create search hashes
     * @param {Object} obj - Object to encrypt
     * @param {Array} sensitiveFields - Fields to encrypt
     * @param {Array} searchableFields - Fields that need search hashes
     * @returns {Object} - Object with encrypted fields and search hashes
     */
    static encryptObject(obj, sensitiveFields, searchableFields = []) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        const encrypted = { ...obj };

        // Encrypt sensitive fields
        sensitiveFields.forEach(field => {
            if (encrypted[field] !== null && encrypted[field] !== undefined) {
                const originalValue = String(encrypted[field]);
                encrypted[field] = encryption.encrypt(originalValue);

                // Create search hash if this field is searchable
                if (searchableFields.includes(field)) {
                    encrypted[field + '_hash'] = encryption.hash(originalValue.toLowerCase());
                }
            }
        });

        return encrypted;
    }

    /**
     * Decrypt sensitive fields in an object
     * @param {Object} obj - Object to decrypt
     * @param {Array} sensitiveFields - Fields to decrypt
     * @returns {Object} - Object with decrypted fields
     */
    static decryptObject(obj, sensitiveFields) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        const decrypted = { ...obj };

        sensitiveFields.forEach(field => {
            if (decrypted[field] !== null && decrypted[field] !== undefined) {
                decrypted[field] = encryption.decrypt(String(decrypted[field]));
            }
        });

        // Remove hash fields from output (they're internal)
        Object.keys(decrypted).forEach(key => {
            if (key.endsWith('_hash')) {
                delete decrypted[key];
            }
        });

        return decrypted;
    }

    /**
     * Create search conditions for encrypted fields
     * @param {string} tableName - Name of the table
     * @param {string} field - Field to search
     * @param {string} value - Value to search for
     * @returns {Object} - Search condition using hash
     */
    static createSearchCondition(tableName, field, value) {
        const searchableFields = SEARCHABLE_FIELDS[tableName] || [];
        
        if (!searchableFields.includes(field)) {
            // Field is not searchable, return original condition
            return { [field]: value };
        }

        // Use hash for searching encrypted field
        const hashField = field + '_hash';
        const hashValue = encryption.hash(value.toLowerCase());
        
        return { [hashField]: hashValue };
    }

    /**
     * Create partial search conditions for encrypted fields (LIKE operations)
     * @param {string} tableName - Name of the table
     * @param {string} field - Field to search
     * @param {string} value - Value to search for
     * @returns {Object} - Search conditions for partial matching
     */
    static createPartialSearchCondition(tableName, field, value) {
        const searchableFields = SEARCHABLE_FIELDS[tableName] || [];
        
        if (!searchableFields.includes(field)) {
            // Field is not searchable, return original LIKE condition
            return { [field]: { like: `%${value}%` } };
        }

        // For encrypted fields, we can only do exact word matching
        // Split the search value into words and create hash conditions
        const words = value.toLowerCase().split(/\s+/).filter(word => word.length > 0);
        const hashField = field + '_hash';
        
        if (words.length === 0) {
            return {};
        }

        // Create conditions for each word
        const wordHashes = words.map(word => encryption.hash(word));
        
        // Return condition that matches any of the word hashes
        return {
            or: wordHashes.map(hash => ({ [hashField]: hash }))
        };
    }

    /**
     * Get list of sensitive fields for a table
     * @param {string} tableName - Name of the table
     * @returns {Array} - Array of sensitive field names
     */
    static getSensitiveFields(tableName) {
        return SENSITIVE_FIELDS[tableName] || [];
    }

    /**
     * Get list of searchable fields for a table
     * @param {string} tableName - Name of the table
     * @returns {Array} - Array of searchable field names
     */
    static getSearchableFields(tableName) {
        return SEARCHABLE_FIELDS[tableName] || [];
    }

    /**
     * Check if a field is sensitive for a given table
     * @param {string} tableName - Name of the table
     * @param {string} fieldName - Name of the field
     * @returns {boolean} - True if field is sensitive
     */
    static isSensitiveField(tableName, fieldName) {
        const sensitiveFields = SENSITIVE_FIELDS[tableName] || [];
        return sensitiveFields.includes(fieldName);
    }

    /**
     * Check if a field is searchable for a given table
     * @param {string} tableName - Name of the table
     * @param {string} fieldName - Name of the field
     * @returns {boolean} - True if field is searchable
     */
    static isSearchableField(tableName, fieldName) {
        const searchableFields = SEARCHABLE_FIELDS[tableName] || [];
        return searchableFields.includes(fieldName);
    }
}

module.exports = EncryptionMiddleware; 
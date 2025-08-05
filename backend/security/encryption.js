const crypto = require('crypto');

class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32; // 256 bits
        this.ivLength = 16; // 128 bits
        this.tagLength = 16; // 128 bits for GCM auth tag
        
        // Use environment variable for encryption key
        const envKey = process.env.ENCRYPTION_KEY;
        if (!envKey) {
            console.warn('⚠️  ENCRYPTION_KEY not set in environment variables. Using temporary key. Set ENCRYPTION_KEY for production.');
            this.secretKey = this.generateDefaultKey();
        } else {
            // Derive key from environment variable using PBKDF2
            this.secretKey = this.deriveKey(envKey);
        }
        
        // Hash salt for searchable hashing
        this.hashSalt = process.env.HASH_SALT || 'monity-default-salt';
    }

    /**
     * Generate a default key for development (NOT for production)
     */
    generateDefaultKey() {
        return crypto.scryptSync('monity-default-secret', 'salt', this.keyLength);
    }

    /**
     * Derive encryption key from environment variable using PBKDF2
     */
    deriveKey(password) {
        const salt = crypto.createHash('sha256').update('monity-encryption-salt').digest();
        return crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha256');
    }

    /**
     * Encrypt sensitive data using AES-256-GCM
     * @param {string} text - Text to encrypt
     * @returns {string} - Encrypted text with IV and auth tag
     */
    encrypt(text) {
        if (!text || typeof text !== 'string') {
            return text;
        }

        try {
            // Generate random initialization vector
            const iv = crypto.randomBytes(this.ivLength);
            
            // Create cipher
            const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
            
            // Encrypt the text
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // Get authentication tag
            const tag = cipher.getAuthTag();
            
            // Combine IV, tag, and encrypted data
            const result = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
            
            return result;
        } catch (error) {
            console.error('Encryption error:', error.message);
            throw new Error('Failed to encrypt data');
        }
    }

    /**
     * Decrypt sensitive data using AES-256-GCM
     * @param {string} encryptedText - Encrypted text with IV and auth tag
     * @returns {string} - Decrypted text
     */
    decrypt(encryptedText) {
        if (!encryptedText || typeof encryptedText !== 'string') {
            return encryptedText;
        }

        // Check if the text looks encrypted (contains multiple colons)
        const parts = encryptedText.split(':');
        if (parts.length < 3) {
            // Assume it's not encrypted and return as-is (for backward compatibility)
            return encryptedText;
        }

        try {
            const iv = Buffer.from(parts[0], 'hex');
            const tag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];
            
            // Create decipher
            const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
            decipher.setAuthTag(tag);
            
            // Decrypt the text
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error.message);
            // If decryption fails, return the original text (might not be encrypted)
            return encryptedText;
        }
    }

    /**
     * Hash sensitive data for searching (one-way)
     * @param {string} text - Text to hash
     * @returns {string} - Hashed text
     */
    hash(text) {
        if (!text || typeof text !== 'string') return text;
        
        const hash = crypto.createHash('sha256');
        hash.update(text + this.hashSalt);
        return hash.digest('hex');
    }

    /**
     * Create searchable hash for encrypted data
     * @param {string} text - Text to create searchable hash for
     * @returns {string} - Searchable hash
     */
    createSearchableHash(text) {
        if (!text || typeof text !== 'string') return text;
        
        // Create multiple hashes for partial matching
        const fullHash = this.hash(text.toLowerCase());
        const words = text.toLowerCase().split(/\s+/);
        const wordHashes = words.map(word => this.hash(word));
        
        return {
            full: fullHash,
            words: wordHashes,
            partial: text.length > 3 ? this.hash(text.toLowerCase().substring(0, 3)) : null
        };
    }

    /**
     * Encrypt an object's sensitive fields
     * @param {Object} obj - Object to encrypt
     * @param {Array} sensitiveFields - Fields to encrypt
     * @returns {Object} - Object with encrypted fields
     */
    encryptObject(obj, sensitiveFields = []) {
        if (!obj || typeof obj !== 'object') return obj;
        
        const encrypted = { ...obj };
        
        sensitiveFields.forEach(field => {
            if (encrypted[field] !== null && encrypted[field] !== undefined) {
                encrypted[field] = this.encrypt(String(encrypted[field]));
            }
        });
        
        return encrypted;
    }

    /**
     * Decrypt an object's sensitive fields
     * @param {Object} obj - Object to decrypt
     * @param {Array} sensitiveFields - Fields to decrypt
     * @returns {Object} - Object with decrypted fields
     */
    decryptObject(obj, sensitiveFields = []) {
        if (!obj || typeof obj !== 'object') return obj;
        
        const decrypted = { ...obj };
        
        sensitiveFields.forEach(field => {
            if (decrypted[field] !== null && decrypted[field] !== undefined) {
                decrypted[field] = this.decrypt(String(decrypted[field]));
            }
        });
        
        return decrypted;
    }

    /**
     * Encrypt an array of objects
     * @param {Array} array - Array of objects to encrypt
     * @param {Array} sensitiveFields - Fields to encrypt
     * @returns {Array} - Array with encrypted objects
     */
    encryptArray(array, sensitiveFields = []) {
        if (!Array.isArray(array)) return array;
        
        return array.map(obj => this.encryptObject(obj, sensitiveFields));
    }

    /**
     * Decrypt an array of objects
     * @param {Array} array - Array of objects to decrypt
     * @param {Array} sensitiveFields - Fields to decrypt
     * @returns {Array} - Array with decrypted objects
     */
    decryptArray(array, sensitiveFields = []) {
        if (!Array.isArray(array)) return array;
        
        return array.map(obj => this.decryptObject(obj, sensitiveFields));
    }

    /**
     * Generate a secure encryption key for production use
     * @returns {string} - Hex string of secure random key
     */
    static generateSecureKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Generate a secure hash salt for production use
     * @returns {string} - Hex string of secure random salt
     */
    static generateSecureSalt() {
        return crypto.randomBytes(16).toString('hex');
    }
}

module.exports = new EncryptionService(); 
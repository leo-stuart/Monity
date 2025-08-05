const crypto = require('crypto');

class EncryptionService {
    constructor() {
        // Use environment variable for encryption key or generate a secure default
        this.algorithm = 'aes-256-gcm';
        this.secretKey = process.env.ENCRYPTION_KEY || this.generateSecretKey();
        
        if (!process.env.ENCRYPTION_KEY) {
            console.warn('⚠️  ENCRYPTION_KEY not set in environment variables. Using temporary key. Set ENCRYPTION_KEY for production.');
        }
    }

    generateSecretKey() {
        return crypto.scryptSync('monity-default-secret', 'salt', 32);
    }

    /**
     * Encrypt sensitive data
     * @param {string} text - Text to encrypt
     * @returns {string} - Encrypted text with IV and auth tag
     */
    encrypt(text) {
        if (!text || typeof text !== 'string') {
            return text;
        }

        try {
            // Generate random initialization vector
            const iv = crypto.randomBytes(16);
            
            // Create cipher with proper algorithm and key
            const cipher = crypto.createCipher('aes-256-gcm', this.secretKey);
            
            // Encrypt the text
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // Get the authentication tag
            const authTag = cipher.getAuthTag();
            
            // Combine IV, auth tag, and encrypted data
            const result = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
            
            return result;
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    /**
     * Decrypt sensitive data
     * @param {string} encryptedText - Encrypted text with IV and auth tag
     * @returns {string} - Decrypted text
     */
    decrypt(encryptedText) {
        if (!encryptedText || typeof encryptedText !== 'string') {
            return encryptedText;
        }

        // Check if the text looks encrypted (contains colons)
        if (!encryptedText.includes(':')) {
            // Assume it's not encrypted and return as-is
            return encryptedText;
        }

        try {
            // Split the encrypted text into components
            const parts = encryptedText.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }
            
            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];
            
            // Create decipher
            const decipher = crypto.createDecipher('aes-256-gcm', this.secretKey);
            decipher.setAuthTag(authTag);
            
            // Decrypt the text
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
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
        if (!text) return text;
        
        const hash = crypto.createHash('sha256');
        hash.update(text + (process.env.HASH_SALT || 'monity-salt'));
        return hash.digest('hex');
    }

    /**
     * Encrypt an object's sensitive fields
     * @param {Object} obj - Object to encrypt
     * @param {Array} sensitiveFields - Fields to encrypt
     * @returns {Object} - Object with encrypted fields
     */
    encryptObject(obj, sensitiveFields = []) {
        const encrypted = { ...obj };
        
        sensitiveFields.forEach(field => {
            if (encrypted[field]) {
                encrypted[field] = this.encrypt(encrypted[field]);
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
        const decrypted = { ...obj };
        
        sensitiveFields.forEach(field => {
            if (decrypted[field]) {
                decrypted[field] = this.decrypt(decrypted[field]);
            }
        });
        
        return decrypted;
    }
}

module.exports = new EncryptionService(); 
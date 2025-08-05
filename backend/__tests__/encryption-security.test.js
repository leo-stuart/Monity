const encryption = require('../security/encryption');
const EncryptionMiddleware = require('../security/encryptionMiddleware');

describe('Encryption Security Tests', () => {
    describe('Basic Encryption Service', () => {
        test('should encrypt and decrypt strings correctly', () => {
            const originalText = 'This is sensitive financial data';
            const encrypted = encryption.encrypt(originalText);
            const decrypted = encryption.decrypt(encrypted);

            expect(decrypted).toBe(originalText);
            expect(encrypted).not.toBe(originalText);
            expect(encrypted).toContain(':'); // Should contain separators
        });

        test('should handle empty or null values gracefully', () => {
            expect(encryption.encrypt('')).toBe('');
            expect(encryption.encrypt(null)).toBe(null);
            expect(encryption.encrypt(undefined)).toBe(undefined);
            
            expect(encryption.decrypt('')).toBe('');
            expect(encryption.decrypt(null)).toBe(null);
            expect(encryption.decrypt(undefined)).toBe(undefined);
        });

        test('should create consistent hashes', () => {
            const text = 'Coffee at Starbucks';
            const hash1 = encryption.hash(text);
            const hash2 = encryption.hash(text);

            expect(hash1).toBe(hash2);
            expect(hash1).not.toBe(text);
            expect(hash1.length).toBe(64); // SHA-256 hex string
        });

        test('should create different hashes for different inputs', () => {
            const hash1 = encryption.hash('Coffee at Starbucks');
            const hash2 = encryption.hash('Lunch at McDonald\'s');

            expect(hash1).not.toBe(hash2);
        });

        test('should handle special characters in encryption', () => {
            const specialText = 'Payment for café & restaurant - €50.00 💰';
            const encrypted = encryption.encrypt(specialText);
            const decrypted = encryption.decrypt(encrypted);

            expect(decrypted).toBe(specialText);
        });

        test('should generate secure keys', () => {
            const key1 = encryption.constructor.generateSecureKey();
            const key2 = encryption.constructor.generateSecureKey();
            const salt1 = encryption.constructor.generateSecureSalt();
            const salt2 = encryption.constructor.generateSecureSalt();

            expect(key1).not.toBe(key2);
            expect(salt1).not.toBe(salt2);
            expect(key1.length).toBe(64); // 32 bytes in hex
            expect(salt1.length).toBe(32); // 16 bytes in hex
        });
    });

    describe('Encryption Middleware', () => {
        describe('Transaction Encryption', () => {
            test('should encrypt transaction data for insert', () => {
                const transaction = {
                    userId: 'user-123',
                    description: 'Coffee at Starbucks',
                    amount: 4.50,
                    category: 'Food & Dining',
                    date: '2024-01-15'
                };

                const encrypted = EncryptionMiddleware.encryptForInsert('transactions', transaction);

                expect(encrypted.description).not.toBe(transaction.description);
                expect(encrypted.description).toContain(':');
                expect(encrypted.description_hash).toBeDefined();
                expect(encrypted.userId).toBe(transaction.userId); // Non-sensitive field unchanged
                expect(encrypted.amount).toBe(transaction.amount); // Non-sensitive field unchanged
            });

            test('should decrypt transaction data from select', () => {
                const encryptedTransaction = {
                    userId: 'user-123',
                    description: encryption.encrypt('Coffee at Starbucks'),
                    description_hash: encryption.hash('coffee at starbucks'),
                    amount: 4.50,
                    category: 'Food & Dining',
                    date: '2024-01-15'
                };

                const decrypted = EncryptionMiddleware.decryptFromSelect('transactions', encryptedTransaction);

                expect(decrypted.description).toBe('Coffee at Starbucks');
                expect(decrypted.description_hash).toBeUndefined(); // Hash should be removed
                expect(decrypted.userId).toBe(encryptedTransaction.userId);
                expect(decrypted.amount).toBe(encryptedTransaction.amount);
            });

            test('should handle arrays of transactions', () => {
                const transactions = [
                    { description: 'Coffee at Starbucks', amount: 4.50 },
                    { description: 'Lunch at McDonald\'s', amount: 8.99 }
                ];

                const encrypted = EncryptionMiddleware.encryptForInsert('transactions', transactions);
                const decrypted = EncryptionMiddleware.decryptFromSelect('transactions', encrypted);

                expect(encrypted).toHaveLength(2);
                expect(decrypted).toHaveLength(2);
                expect(decrypted[0].description).toBe('Coffee at Starbucks');
                expect(decrypted[1].description).toBe('Lunch at McDonald\'s');
            });
        });

        describe('Category Encryption', () => {
            test('should encrypt category data', () => {
                const category = {
                    name: 'Personal Coffee Fund',
                    typeId: 1,
                    userId: 'user-123'
                };

                const encrypted = EncryptionMiddleware.encryptForInsert('categories', category);
                const decrypted = EncryptionMiddleware.decryptFromSelect('categories', encrypted);

                expect(encrypted.name).not.toBe(category.name);
                expect(decrypted.name).toBe(category.name);
                expect(decrypted.typeId).toBe(category.typeId);
            });
        });

        describe('Group Operations Encryption', () => {
            test('should encrypt group data', () => {
                const group = {
                    name: 'Weekend Trip Group',
                    created_by: 'user-123'
                };

                const encrypted = EncryptionMiddleware.encryptForInsert('groups', group);
                const decrypted = EncryptionMiddleware.decryptFromSelect('groups', encrypted);

                expect(encrypted.name).not.toBe(group.name);
                expect(decrypted.name).toBe(group.name);
                expect(decrypted.created_by).toBe(group.created_by);
            });

            test('should encrypt group expense data', () => {
                const expense = {
                    group_id: 'group-123',
                    description: 'Hotel booking for weekend trip',
                    amount: 250.00,
                    paid_by: 'user-123'
                };

                const encrypted = EncryptionMiddleware.encryptForInsert('group_expenses', expense);
                const decrypted = EncryptionMiddleware.decryptFromSelect('group_expenses', encrypted);

                expect(encrypted.description).not.toBe(expense.description);
                expect(encrypted.description_hash).toBeDefined();
                expect(decrypted.description).toBe(expense.description);
                expect(decrypted.amount).toBe(expense.amount);
            });
        });

        describe('Savings Goals Encryption', () => {
            test('should encrypt savings goal data', () => {
                const goal = {
                    user_id: 'user-123',
                    goal_name: 'Emergency Fund for Medical Expenses',
                    target_amount: 10000.00,
                    current_amount: 2500.00,
                    target_date: '2024-12-31'
                };

                const encrypted = EncryptionMiddleware.encryptForInsert('savings_goals', goal);
                const decrypted = EncryptionMiddleware.decryptFromSelect('savings_goals', encrypted);

                expect(encrypted.goal_name).not.toBe(goal.goal_name);
                expect(decrypted.goal_name).toBe(goal.goal_name);
                expect(decrypted.target_amount).toBe(goal.target_amount);
            });
        });

        describe('Smart Categorization Data Encryption', () => {
            test('should encrypt ML training data', () => {
                const trainingData = {
                    user_id: 'user-123',
                    description: 'Starbucks coffee purchase',
                    amount: 4.50,
                    category: 'Food & Dining',
                    transaction_type_id: 1,
                    processed_features: '{"merchant": "starbucks", "amount_range": "small"}',
                    is_verified: true
                };

                const encrypted = EncryptionMiddleware.encryptForInsert('ml_training_data', trainingData);
                const decrypted = EncryptionMiddleware.decryptFromSelect('ml_training_data', encrypted);

                expect(encrypted.description).not.toBe(trainingData.description);
                expect(encrypted.description_hash).toBeDefined();
                expect(decrypted.description).toBe(trainingData.description);
                expect(decrypted.amount).toBe(trainingData.amount);
            });

            test('should encrypt categorization feedback', () => {
                const feedback = {
                    user_id: 'user-123',
                    transaction_description: 'Amazon Prime subscription',
                    suggested_category: 'Shopping',
                    actual_category: 'Entertainment',
                    was_suggestion_accepted: false,
                    confidence_score: 0.75,
                    transaction_amount: 14.99
                };

                const encrypted = EncryptionMiddleware.encryptForInsert('categorization_feedback', feedback);
                const decrypted = EncryptionMiddleware.decryptFromSelect('categorization_feedback', encrypted);

                expect(encrypted.transaction_description).not.toBe(feedback.transaction_description);
                expect(encrypted.transaction_description_hash).toBeDefined();
                expect(decrypted.transaction_description).toBe(feedback.transaction_description);
                expect(decrypted.was_suggestion_accepted).toBe(feedback.was_suggestion_accepted);
            });
        });

        describe('Search Functionality', () => {
            test('should create search conditions for encrypted fields', () => {
                const condition = EncryptionMiddleware.createSearchCondition('transactions', 'description', 'Starbucks');
                
                expect(condition).toHaveProperty('description_hash');
                expect(condition.description_hash).toBe(encryption.hash('starbucks'));
            });

            test('should create search conditions for non-encrypted fields', () => {
                const condition = EncryptionMiddleware.createSearchCondition('transactions', 'amount', 4.50);
                
                expect(condition).toHaveProperty('amount');
                expect(condition.amount).toBe(4.50);
            });

            test('should create partial search conditions', () => {
                const condition = EncryptionMiddleware.createPartialSearchCondition('transactions', 'description', 'Coffee Shop');
                
                expect(condition).toHaveProperty('or');
                expect(condition.or).toBeInstanceOf(Array);
                expect(condition.or.length).toBe(2); // Two words: "coffee" and "shop"
            });
        });

        describe('Utility Functions', () => {
            test('should identify sensitive fields correctly', () => {
                expect(EncryptionMiddleware.isSensitiveField('transactions', 'description')).toBe(true);
                expect(EncryptionMiddleware.isSensitiveField('transactions', 'amount')).toBe(false);
                expect(EncryptionMiddleware.isSensitiveField('categories', 'name')).toBe(true);
                expect(EncryptionMiddleware.isSensitiveField('categories', 'typeId')).toBe(false);
            });

            test('should identify searchable fields correctly', () => {
                expect(EncryptionMiddleware.isSearchableField('transactions', 'description')).toBe(true);
                expect(EncryptionMiddleware.isSearchableField('transactions', 'amount')).toBe(false);
                expect(EncryptionMiddleware.isSearchableField('group_expenses', 'description')).toBe(true);
            });

            test('should return correct field lists', () => {
                const transactionFields = EncryptionMiddleware.getSensitiveFields('transactions');
                const searchableFields = EncryptionMiddleware.getSearchableFields('transactions');

                expect(transactionFields).toContain('description');
                expect(searchableFields).toContain('description');
                expect(transactionFields).toBeInstanceOf(Array);
                expect(searchableFields).toBeInstanceOf(Array);
            });
        });

        describe('Error Handling', () => {
            test('should handle malformed encrypted data gracefully', () => {
                const malformedData = {
                    description: 'not-encrypted-data'
                };

                const decrypted = EncryptionMiddleware.decryptFromSelect('transactions', malformedData);
                
                expect(decrypted.description).toBe('not-encrypted-data'); // Should return as-is
            });

            test('should handle null and undefined values', () => {
                expect(EncryptionMiddleware.encryptForInsert('transactions', null)).toBeNull();
                expect(EncryptionMiddleware.decryptFromSelect('transactions', null)).toBeNull();
                expect(EncryptionMiddleware.encryptForInsert('transactions', undefined)).toBeUndefined();
            });

            test('should handle empty objects', () => {
                const result = EncryptionMiddleware.encryptForInsert('transactions', {});
                expect(result).toEqual({});
            });
        });
    });

    describe('Security Properties', () => {
        test('encrypted data should be significantly different from original', () => {
            const original = 'Sensitive financial transaction data';
            const encrypted = encryption.encrypt(original);

            // Should not contain any substring of original (case-insensitive)
            const originalWords = original.toLowerCase().split(' ');
            const encryptedLower = encrypted.toLowerCase();
            
            originalWords.forEach(word => {
                if (word.length > 3) { // Check words longer than 3 chars
                    expect(encryptedLower).not.toContain(word);
                }
            });
        });

        test('should produce different ciphertext for same plaintext', () => {
            const text = 'Identical plaintext';
            const encrypted1 = encryption.encrypt(text);
            const encrypted2 = encryption.encrypt(text);

            expect(encrypted1).not.toBe(encrypted2); // Should be different due to random IV
            expect(encryption.decrypt(encrypted1)).toBe(text);
            expect(encryption.decrypt(encrypted2)).toBe(text);
        });

        test('should not leak information in hash fields', () => {
            const sensitiveData = 'Private medical expenses for John Doe';
            const hash = encryption.hash(sensitiveData);

            // Hash should not contain any identifiable information
            expect(hash).not.toContain('medical');
            expect(hash).not.toContain('john');
            expect(hash).not.toContain('doe');
            expect(hash).not.toContain('private');
            expect(hash.length).toBe(64); // Standard SHA-256 length
        });

        test('should maintain data integrity', () => {
            const complexData = {
                description: 'Payment for rent & utilities - $1,250.00 💰',
                unicode: '🏠 Maison française café ñoño',
                special: 'Data with "quotes" and \'apostrophes\' & symbols!',
                multiline: 'Line 1\nLine 2\nLine 3'
            };

            Object.values(complexData).forEach(value => {
                const encrypted = encryption.encrypt(value);
                const decrypted = encryption.decrypt(encrypted);
                expect(decrypted).toBe(value);
            });
        });
    });

    describe('Performance Considerations', () => {
        test('should handle large datasets efficiently', () => {
            const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                description: `Transaction ${i}: Purchase at merchant ${i}`,
                amount: Math.random() * 1000,
                category: `Category ${i % 10}`
            }));

            const startTime = Date.now();
            const encrypted = EncryptionMiddleware.encryptForInsert('transactions', largeDataset);
            const decrypted = EncryptionMiddleware.decryptFromSelect('transactions', encrypted);
            const endTime = Date.now();

            expect(encrypted).toHaveLength(1000);
            expect(decrypted).toHaveLength(1000);
            expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
            
            // Verify some random samples
            const randomIndex = Math.floor(Math.random() * 1000);
            expect(decrypted[randomIndex].description).toBe(largeDataset[randomIndex].description);
        });
    });
}); 
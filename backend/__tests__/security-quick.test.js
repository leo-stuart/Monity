const { validationSchemas, sanitizeData } = require('../security/validation');

describe('Security Core Features', () => {
    describe('Input Validation', () => {
        test('should validate transaction data correctly', () => {
            const validTransaction = {
                description: 'Test transaction',
                amount: 100.50,
                category: 'Food',
                date: '2024-01-01',
                typeId: 1
            };

            const { error, value } = validationSchemas.transaction.validate(validTransaction);
            expect(error).toBeUndefined();
            expect(value.amount).toBe(100.50);
        });

        test('should reject invalid transaction data', () => {
            const invalidTransaction = {
                description: '', // Too short
                amount: -50, // Negative
                category: '',
                date: '2025-12-31', // Future date
                typeId: 5 // Invalid type
            };

            const { error } = validationSchemas.transaction.validate(invalidTransaction);
            expect(error).toBeDefined();
            expect(error.details.length).toBeGreaterThan(0);
        });

        test('should sanitize XSS attempts', () => {
            const maliciousData = {
                name: '<script>alert("xss")</script>John',
                description: '<img src="x" onerror="alert(1)">Safe text'
            };

            const sanitized = sanitizeData(maliciousData);
            expect(sanitized.name).not.toContain('<script>');
            expect(sanitized.description).not.toContain('<img');
        });

        test('should validate user registration', () => {
            const validUser = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'SecureP@ss123!',
                role: 'user'
            };

            const { error } = validationSchemas.signup.validate(validUser);
            expect(error).toBeUndefined();
        });

        test('should validate category data', () => {
            const validCategory = {
                name: 'Entertainment',
                typeId: 1,
                color: '#FF5733',
                icon: '🎬'
            };

            const { error } = validationSchemas.category.validate(validCategory);
            expect(error).toBeUndefined();
        });

        test('should reject invalid hex colors', () => {
            const invalidCategory = {
                name: 'Entertainment',
                typeId: 1,
                color: 'invalid-color',
                icon: '🎬'
            };

            const { error } = validationSchemas.category.validate(invalidCategory);
            expect(error).toBeDefined();
        });
    });

    describe('Data Sanitization', () => {
        test('should handle arrays of data', () => {
            const maliciousArray = [
                '<script>alert(1)</script>',
                'normal text',
                '<img src="x" onerror="alert(2)">'
            ];

            const sanitized = sanitizeData(maliciousArray);
            expect(sanitized[0]).not.toContain('<script>');
            expect(sanitized[1]).toBe('normal text');
            expect(sanitized[2]).not.toContain('<img');
        });

        test('should handle nested objects', () => {
            const maliciousObject = {
                user: {
                    name: '<script>alert("hack")</script>User',
                    bio: 'Normal bio'
                },
                transactions: [
                    { description: '<img src="x">Transaction' }
                ]
            };

            const sanitized = sanitizeData(maliciousObject);
            expect(sanitized.user.name).not.toContain('<script>');
            expect(sanitized.user.bio).toBe('Normal bio');
            expect(sanitized.transactions[0].description).not.toContain('<img');
        });
    });

    describe('AI Feedback Validation', () => {
        test('should validate AI feedback data', () => {
            const validFeedback = {
                transaction_description: 'STARBUCKS COFFEE SHOP',
                suggested_category: 'Food & Drink',
                actual_category: 'Coffee',
                was_suggestion_accepted: false,
                transaction_amount: 6.50
            };

            const { error } = validationSchemas.aiFeedback.validate(validFeedback);
            expect(error).toBeUndefined();
        });

        test('should reject invalid feedback data', () => {
            const invalidFeedback = {
                transaction_description: '', // Too short
                suggested_category: '',
                actual_category: '',
                was_suggestion_accepted: 'invalid', // Should be boolean
                transaction_amount: -5 // Negative amount
            };

            const { error } = validationSchemas.aiFeedback.validate(invalidFeedback);
            expect(error).toBeDefined();
        });
    });
}); 
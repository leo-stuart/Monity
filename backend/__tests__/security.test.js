const request = require('supertest');
const express = require('express');
const encryption = require('../security/encryption');
const { validationSchemas, validate, sanitizeData } = require('../security/validation');
const { rateLimiters, securityHeaders, auditLogger } = require('../security/middleware');

// Mock Express app for testing
const app = express();
app.use(express.json());

describe('Security Features', () => {
    describe('Encryption Service', () => {
        test('should encrypt and decrypt text correctly', () => {
            const originalText = 'sensitive data';
            const encrypted = encryption.encrypt(originalText);
            const decrypted = encryption.decrypt(encrypted);
            
            expect(encrypted).not.toBe(originalText);
            expect(encrypted).toContain(':'); // Should have IV and auth tag
            expect(decrypted).toBe(originalText);
        });

        test('should handle empty or invalid inputs gracefully', () => {
            expect(encryption.encrypt('')).toBe('');
            expect(encryption.encrypt(null)).toBe(null);
            expect(encryption.decrypt('')).toBe('');
            expect(encryption.decrypt('invalid:format')).toBe('invalid:format');
        });

        test('should hash data consistently', () => {
            const text = 'test data';
            const hash1 = encryption.hash(text);
            const hash2 = encryption.hash(text);
            
            expect(hash1).toBe(hash2);
            expect(hash1).toHaveLength(64); // SHA-256 hex length
        });

        test('should encrypt/decrypt objects correctly', () => {
            const obj = {
                name: 'John Doe',
                email: 'john@example.com',
                description: 'Sensitive description'
            };
            const sensitiveFields = ['name', 'description'];
            
            const encrypted = encryption.encryptObject(obj, sensitiveFields);
            const decrypted = encryption.decryptObject(encrypted, sensitiveFields);
            
            expect(encrypted.name).not.toBe(obj.name);
            expect(encrypted.email).toBe(obj.email); // Not encrypted
            expect(decrypted.name).toBe(obj.name);
            expect(decrypted.description).toBe(obj.description);
        });
    });

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
            expect(error.details).toHaveLength(5);
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

        test('should reject weak passwords', () => {
            const weakPassword = {
                name: 'John Doe',
                email: 'john@example.com',
                password: '123456', // Weak password
                role: 'user'
            };

            const { error } = validationSchemas.signup.validate(weakPassword);
            expect(error).toBeDefined();
            expect(error.details[0].message).toContain('Password must contain');
        });
    });

    describe('Security Middleware', () => {
        test('should apply security headers', (done) => {
            app.use(securityHeaders);
            app.get('/test-headers', (req, res) => {
                res.json({ status: 'ok' });
            });

            request(app)
                .get('/test-headers')
                .expect(200)
                .expect((res) => {
                    expect(res.headers['x-content-type-options']).toBe('nosniff');
                    expect(res.headers['x-frame-options']).toBe('DENY');
                })
                .end(done);
        });

        test('should create audit logs', (done) => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            app.use(auditLogger('test_action', 'test_resource'));
            app.get('/test-audit', (req, res) => {
                res.json({ status: 'ok' });
            });

            request(app)
                .get('/test-audit')
                .expect(200)
                .end(() => {
                    expect(consoleSpy).toHaveBeenCalledWith(
                        expect.stringContaining('[AUDIT]')
                    );
                    consoleSpy.mockRestore();
                    done();
                });
        });
    });

    describe('Rate Limiting', () => {
        test('should allow requests within limits', (done) => {
            const testApp = express();
            testApp.use(express.json());
            testApp.use('/api', rateLimiters.general);
            testApp.get('/api/test', (req, res) => {
                res.json({ status: 'ok' });
            });

            request(testApp)
                .get('/api/test')
                .expect(200)
                .expect((res) => {
                    expect(res.headers['ratelimit-remaining']).toBeDefined();
                })
                .end(done);
        });

        test('should have stricter limits for auth endpoints', () => {
            expect(rateLimiters.auth.max).toBeLessThan(rateLimiters.general.max);
            expect(rateLimiters.auth.skipSuccessfulRequests).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should not leak sensitive information in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const { secureErrorHandler } = require('../security/middleware');
            const mockReq = { user: { id: 'test-user' }, path: '/test' };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const mockError = new Error('Sensitive database error');

            secureErrorHandler(mockError, mockReq, mockRes, () => {});

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Internal server error'
            });

            process.env.NODE_ENV = originalEnv;
        });
    });
}); 
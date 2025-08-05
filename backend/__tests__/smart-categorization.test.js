const SmartCategorizationEngine = require('../smart-categorization');

// Mock Supabase client
const mockSupabase = {
    from: jest.fn(() => ({
        select: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
                data: [],
                error: null
            })),
            eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                    data: null,
                    error: { code: 'PGRST116' }
                })),
                limit: jest.fn(() => Promise.resolve({
                    data: [],
                    error: null
                })),
                order: jest.fn(() => Promise.resolve({
                    data: [],
                    error: null
                }))
            })),
            not: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                    data: [],
                    error: null
                }))
            }))
        })),
        insert: jest.fn(() => Promise.resolve({
            error: null
        })),
        update: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({
                error: null
            }))
        }))
    }))
};

describe('Smart Categorization Engine', () => {
    let engine;

    beforeEach(() => {
        engine = new SmartCategorizationEngine(mockSupabase);
        jest.clearAllMocks();
    });

    describe('Feature Extraction', () => {
        test('should extract basic features from transaction description', () => {
            const features = engine.extractFeatures('UBER EATS DELIVERY', 25.50);
            
            expect(features).toContain('uber');
            expect(features).toContain('eat');
            expect(features).toContain('deliveri'); // Stemmed
            expect(features).toContain('amount_small');
            expect(features).toContain('length_medium');
        });

        test('should handle Portuguese text', () => {
            const features = engine.extractFeatures('PAGAMENTO SUPERMERCADO EXTRA', 89.90);
            
            expect(features).toContain('payment');
            expect(features).toContain('supermercado');
            expect(features).toContain('amount_medium');
        });

        test('should extract merchant patterns', () => {
            const merchant1 = engine.extractMerchant('AMAZON PRIME VIDEO SUBSCRIPTION');
            expect(merchant1).toContain('amazon');

            const merchant2 = engine.extractMerchant('STARBUCKS COFFEE SHOP 1234');
            expect(merchant2).toContain('starbucks');

            const merchant3 = engine.extractMerchant('TEF PAGAMENTO CONTA ENERGIA');
            expect(merchant3).toContain('pagamento');
        });

        test('should add Brazilian banking features', () => {
            const features = [];
            engine.addBrazilianFeatures('TEF PIX TRANSFERENCIA R$ 100', features);
            
            // Check that at least some Brazilian features are detected
            expect(features.length).toBeGreaterThan(0);
            const hasAnyBankingFeature = features.some(f => f.includes('banking') || f.includes('currency'));
            expect(hasAnyBankingFeature).toBe(true);
        });

        test('should detect Brazilian document patterns', () => {
            const features = [];
            engine.addBrazilianFeatures('COMPRA CPF 123.456.789-01 CNPJ 12.345.678/0001-90', features);
            
            expect(features).toContain('document_cpf');
            expect(features).toContain('document_cnpj');
        });
    });

    describe('Amount Range Classification', () => {
        test('should classify amounts correctly', () => {
            expect(engine.getAmountRangeFeature(5)).toBe('amount_very_small');
            expect(engine.getAmountRangeFeature(25)).toBe('amount_small');
            expect(engine.getAmountRangeFeature(150)).toBe('amount_medium');
            expect(engine.getAmountRangeFeature(500)).toBe('amount_large');
            expect(engine.getAmountRangeFeature(2000)).toBe('amount_very_large');
        });
    });

    describe('String Similarity', () => {
        test('should calculate similarity correctly', () => {
            const similarity1 = engine.calculateStringSimilarity(
                'STARBUCKS COFFEE',
                'STARBUCKS CAFE'
            );
            expect(similarity1).toBeGreaterThan(0.3);

            const similarity2 = engine.calculateStringSimilarity(
                'UBER EATS',
                'MCDONALDS'
            );
            expect(similarity2).toBeLessThan(0.5);
        });
    });

    describe('Category Suggestions', () => {
        beforeEach(async () => {
            // Mock merchant patterns
            mockSupabase.from.mockImplementation((table) => {
                if (table === 'merchant_patterns') {
                    return {
                        select: () => ({
                            order: () => Promise.resolve({
                                data: [
                                    {
                                        pattern: 'starbucks',
                                        suggested_category: 'Food & Drink',
                                        confidence_score: 0.9,
                                        usage_count: 50
                                    }
                                ],
                                error: null
                            })
                        })
                    };
                }
                if (table === 'default_category_rules') {
                    return {
                        select: () => ({
                            eq: () => ({
                                order: () => Promise.resolve({
                                    data: [
                                        {
                                            rule_type: 'keyword',
                                            rule_value: 'uber',
                                            suggested_category: 'Transportation',
                                            confidence_score: 0.8,
                                            transaction_type_id: 1
                                        }
                                    ],
                                    error: null
                                })
                            })
                        })
                    };
                }
                if (table === 'transactions') {
                    return {
                        select: () => ({
                            not: () => ({
                                limit: () => Promise.resolve({
                                    data: [],
                                    error: null
                                })
                            }),
                            eq: () => ({
                                not: () => ({
                                    limit: () => Promise.resolve({
                                        data: [
                                            {
                                                description: 'STARBUCKS COFFEE',
                                                category: 'Food & Drink'
                                            }
                                        ],
                                        error: null
                                    })
                                })
                            })
                        })
                    };
                }
                return {
                    select: () => ({
                        order: () => Promise.resolve({ data: [], error: null }),
                        eq: () => ({
                            order: () => Promise.resolve({ data: [], error: null })
                        })
                    })
                };
            });

            await engine.initialize();
        });

        test('should suggest category based on merchant patterns', async () => {
            const suggestions = await engine.suggestCategory('STARBUCKS COFFEE SHOP', 5.50, 1);
            
            expect(suggestions).toHaveLength(1);
            expect(suggestions[0].category).toBe('Food & Drink');
            expect(suggestions[0].confidence).toBeGreaterThan(0.8);
            expect(suggestions[0].source).toBe('merchant_pattern');
        });

        test('should suggest category based on rules', async () => {
            const suggestions = await engine.suggestCategory('UBER RIDE TO AIRPORT', 25.00, 1);
            
            expect(suggestions.length).toBeGreaterThan(0);
            const transportSuggestion = suggestions.find(s => s.category === 'Transportation');
            expect(transportSuggestion).toBeDefined();
            expect(transportSuggestion.source).toBe('rule');
        });

        test('should handle user-specific suggestions', async () => {
            const suggestions = await engine.suggestCategory('STARBUCKS LOCATION', 4.50, 1, 'user123');
            
            expect(suggestions.length).toBeGreaterThan(0);
        });

        test('should rank suggestions by confidence', async () => {
            const suggestions = await engine.suggestCategory('STARBUCKS UBER', 15.00, 1);
            
            // Should be sorted by confidence descending
            for (let i = 1; i < suggestions.length; i++) {
                expect(suggestions[i-1].confidence).toBeGreaterThanOrEqual(suggestions[i].confidence);
            }
        });
    });

    describe('Feedback and Learning', () => {
        test('should record feedback correctly', async () => {
            await engine.recordFeedback(
                'user123',
                'NEW MERCHANT COFFEE',
                'Food & Drink',
                'Coffee',
                false,
                0.7,
                6.50
            );

            expect(mockSupabase.from).toHaveBeenCalledWith('categorization_feedback');
        });

        test('should update merchant patterns based on feedback', async () => {
            await engine.updateMerchantPattern('new merchant', 'Coffee');
            
            expect(mockSupabase.from).toHaveBeenCalledWith('merchant_patterns');
        });

        test('should add to training data', async () => {
            await engine.addToTrainingData(
                'user123',
                'COFFEE SHOP PURCHASE',
                'Coffee',
                5.00,
                1
            );

            expect(mockSupabase.from).toHaveBeenCalledWith('ml_training_data');
        });
    });

    describe('Model Retraining', () => {
        test('should retrain model with sufficient data', async () => {
            // Mock training data
            mockSupabase.from.mockImplementation((table) => {
                if (table === 'ml_training_data') {
                    return {
                        select: () => ({
                            eq: () => Promise.resolve({
                                data: Array.from({ length: 60 }, (_, i) => ({
                                    description: `Transaction ${i}`,
                                    category: i % 2 === 0 ? 'Food' : 'Transport',
                                    amount: 50 + i,
                                    transaction_type_id: 1
                                })),
                                error: null
                            })
                        })
                    };
                }
                return {
                    select: () => ({
                        order: () => Promise.resolve({ data: [], error: null })
                    })
                };
            });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            await engine.retrainModel();
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Model retrained with 60 samples')
            );
            
            consoleSpy.mockRestore();
        });

        test('should skip retraining with insufficient data', async () => {
            // Mock insufficient training data
            mockSupabase.from.mockImplementation(() => ({
                select: () => ({
                    eq: () => Promise.resolve({
                        data: Array.from({ length: 10 }, (_, i) => ({
                            description: `Transaction ${i}`,
                            category: 'Food',
                            amount: 50,
                            transaction_type_id: 1
                        })),
                        error: null
                    })
                })
            }));

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            await engine.retrainModel();
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Insufficient data for retraining')
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('Error Handling', () => {
        test('should handle database errors gracefully', async () => {
            // Mock database error
            mockSupabase.from.mockImplementation(() => ({
                select: () => ({
                    order: () => Promise.resolve({
                        data: null,
                        error: new Error('Database connection failed')
                    })
                })
            }));

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            
            await expect(engine.initialize()).rejects.toThrow();
            
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        test('should provide fallback suggestions on errors', async () => {
            // Force an error in suggestion process
            engine.checkMerchantPatterns = jest.fn(() => {
                throw new Error('Test error');
            });

            const suggestions = await engine.suggestCategory('ANY DESCRIPTION', 50, 1);
            
            expect(suggestions).toHaveLength(1);
            expect(suggestions[0].category).toBe('Uncategorized');
            expect(suggestions[0].source).toBe('fallback');
        });
    });
}); 
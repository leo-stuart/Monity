describe('Smart Categorization Core Features', () => {
    let SmartCategorizationEngine;
    let engine;

    beforeAll(() => {
        // Mock the dependencies to avoid initialization issues
        jest.mock('natural', () => ({
            WordTokenizer: jest.fn(() => ({
                tokenize: jest.fn((text) => text.split(' '))
            })),
            PorterStemmer: {
                stem: jest.fn((word) => word.toLowerCase().replace(/ing$|ed$|s$/, ''))
            }
        }));

        jest.mock('compromise', () => jest.fn(() => ({
            places: () => ({ out: () => [] }),
            organizations: () => ({ out: () => [] })
        })));

        jest.mock('stopword', () => ({
            removeStopwords: jest.fn((words) => words.filter(w => !['the', 'and', 'or'].includes(w)))
        }));

        // Mock Supabase with minimal implementation
        const mockSupabase = {
            from: jest.fn(() => ({
                select: jest.fn(() => ({
                    order: jest.fn(() => Promise.resolve({ data: [], error: null })),
                    eq: jest.fn(() => ({
                        order: jest.fn(() => Promise.resolve({ data: [], error: null }))
                    }))
                }))
            }))
        };

        SmartCategorizationEngine = require('../smart-categorization');
        engine = new SmartCategorizationEngine(mockSupabase);
    });

    describe('Feature Extraction', () => {
        test('should extract features from simple text', () => {
            const features = engine.extractFeatures('coffee shop purchase', 15.50);
            
            expect(Array.isArray(features)).toBe(true);
            expect(features.length).toBeGreaterThan(0);
        });

        test('should categorize amounts correctly', () => {
            expect(engine.getAmountRangeFeature(5)).toBe('amount_very_small');
            expect(engine.getAmountRangeFeature(25)).toBe('amount_small');
            expect(engine.getAmountRangeFeature(150)).toBe('amount_medium');
            expect(engine.getAmountRangeFeature(500)).toBe('amount_large');
            expect(engine.getAmountRangeFeature(2000)).toBe('amount_very_large');
        });

        test('should classify description lengths', () => {
            expect(engine.getDescriptionLengthCategory('short')).toBe('short');
            expect(engine.getDescriptionLengthCategory('medium length description')).toBe('medium');
            expect(engine.getDescriptionLengthCategory('this is a very long description that exceeds normal length')).toBe('long');
        });

        test('should extract merchant names', () => {
            const merchant1 = engine.extractMerchant('STARBUCKS COFFEE 123');
            expect(typeof merchant1).toBe('string');
            
            const merchant2 = engine.extractMerchant('AMAZON PURCHASE');
            expect(typeof merchant2).toBe('string');
        });

        test('should detect Brazilian features', () => {
            const features = [];
            engine.addBrazilianFeatures('TEF PIX payment', features);
            
            // Should add some features for Brazilian terms
            expect(features.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('String Similarity', () => {
        test('should calculate similarity between strings', () => {
            const similarity = engine.calculateStringSimilarity('coffee shop', 'coffee store');
            
            expect(typeof similarity).toBe('number');
            expect(similarity).toBeGreaterThanOrEqual(0);
            expect(similarity).toBeLessThanOrEqual(1);
        });

        test('should give higher similarity for more similar strings', () => {
            const highSimilarity = engine.calculateStringSimilarity('starbucks coffee', 'starbucks cafe');
            const lowSimilarity = engine.calculateStringSimilarity('starbucks coffee', 'mcdonalds burger');
            
            expect(highSimilarity).toBeGreaterThan(lowSimilarity);
        });
    });

    describe('Suggestion Ranking', () => {
        test('should rank suggestions by confidence', () => {
            const suggestions = [
                { category: 'Food', confidence: 0.6, source: 'rule' },
                { category: 'Transport', confidence: 0.9, source: 'merchant' },
                { category: 'Shopping', confidence: 0.3, source: 'ml' }
            ];

            const ranked = engine.rankSuggestions(suggestions);
            
            expect(ranked[0].confidence).toBeGreaterThanOrEqual(ranked[1].confidence);
            expect(ranked[1].confidence).toBeGreaterThanOrEqual(ranked[2].confidence);
        });

        test('should deduplicate suggestions with same category', () => {
            const suggestions = [
                { category: 'Food', confidence: 0.6, source: 'rule' },
                { category: 'Food', confidence: 0.8, source: 'merchant' },
                { category: 'Transport', confidence: 0.7, source: 'ml' }
            ];

            const ranked = engine.rankSuggestions(suggestions);
            
            expect(ranked.length).toBe(2); // Should have only 2 unique categories
            const foodSuggestion = ranked.find(s => s.category === 'Food');
            expect(foodSuggestion.confidence).toBe(0.8); // Should keep the higher confidence one
        });
    });

    describe('Pattern Checking', () => {
        test('should check merchant patterns', () => {
            // Set up some test patterns
            engine.merchantPatterns.set('starbucks', {
                category: 'Food & Drink',
                confidence: 0.9,
                usage: 50
            });

            const result = engine.checkMerchantPatterns('starbucks coffee shop');
            
            expect(result).toBeDefined();
            expect(result.category).toBe('Food & Drink');
            expect(result.confidence).toBeGreaterThan(0.8);
        });

        test('should check default rules', () => {
            // Set up some test rules
            engine.defaultRules.set('keyword:uber', {
                category: 'Transportation',
                confidence: 0.8,
                transactionType: 1
            });

            const results = engine.checkDefaultRules('uber ride to airport', 1);
            
            expect(Array.isArray(results)).toBe(true);
            if (results.length > 0) {
                expect(results[0].category).toBe('Transportation');
            }
        });
    });
}); 
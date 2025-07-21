const natural = require('natural');
const compromise = require('compromise');
const { removeStopwords } = require('stopword');
const { Matrix } = require('ml-matrix');
const NaiveBayes = require('ml-naivebayes');

/**
 * Smart Categorization Engine
 * Provides AI-powered transaction categorization with learning capabilities
 */
class SmartCategorizationEngine {
    constructor(supabase) {
        this.supabase = supabase;
        this.tokenizer = new natural.WordTokenizer();
        this.stemmer = natural.PorterStemmer;
        this.classifier = null;
        this.merchantPatterns = new Map();
        this.defaultRules = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize the categorization engine
     * Load trained models, merchant patterns, and default rules
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('[SmartCategorization] Initializing engine...');
            
            // Load merchant patterns
            await this.loadMerchantPatterns();
            
            // Load default category rules
            await this.loadDefaultRules();
            
            // Load and train the ML model
            await this.loadMLModel();
            
            this.isInitialized = true;
            console.log('[SmartCategorization] Engine initialized successfully');
        } catch (error) {
            console.error('[SmartCategorization] Failed to initialize:', error);
            throw error;
        }
    }

    /**
     * Load merchant patterns from database
     */
    async loadMerchantPatterns() {
        const { data: patterns, error } = await this.supabase
            .from('merchant_patterns')
            .select('*')
            .order('confidence_score', { ascending: false });

        if (error) {
            console.error('[SmartCategorization] Error loading merchant patterns:', error);
            return;
        }

        this.merchantPatterns.clear();
        patterns.forEach(pattern => {
            this.merchantPatterns.set(pattern.pattern.toLowerCase(), {
                category: pattern.suggested_category,
                confidence: pattern.confidence_score,
                usage: pattern.usage_count
            });
        });

        console.log(`[SmartCategorization] Loaded ${patterns.length} merchant patterns`);
    }

    /**
     * Load default categorization rules from database
     */
    async loadDefaultRules() {
        const { data: rules, error } = await this.supabase
            .from('default_category_rules')
            .select('*')
            .eq('is_active', true)
            .order('confidence_score', { ascending: false });

        if (error) {
            console.error('[SmartCategorization] Error loading default rules:', error);
            return;
        }

        this.defaultRules.clear();
        rules.forEach(rule => {
            const key = `${rule.rule_type}:${rule.rule_value.toLowerCase()}`;
            this.defaultRules.set(key, {
                category: rule.suggested_category,
                confidence: rule.confidence_score,
                transactionType: rule.transaction_type_id
            });
        });

        console.log(`[SmartCategorization] Loaded ${rules.length} default rules`);
    }

    /**
     * Load and train the machine learning model
     */
    async loadMLModel() {
        try {
            // Get training data from existing transactions
            const { data: trainingData, error } = await this.supabase
                .from('transactions')
                .select('description, category, amount, typeId')
                .not('category', 'is', null)
                .limit(5000); // Limit for performance

            if (error) {
                console.error('[SmartCategorization] Error loading training data:', error);
                return;
            }

            if (trainingData.length < 10) {
                console.log('[SmartCategorization] Insufficient training data, using rule-based approach only');
                return;
            }

            // Train Naive Bayes classifier
            await this.trainNaiveBayesModel(trainingData);
            
        } catch (error) {
            console.error('[SmartCategorization] Error training ML model:', error);
        }
    }

    /**
     * Train Naive Bayes model with transaction data
     */
    async trainNaiveBayesModel(trainingData) {
        const features = [];
        const labels = [];

        for (const transaction of trainingData) {
            const extractedFeatures = this.extractFeatures(transaction.description, transaction.amount);
            features.push(extractedFeatures);
            labels.push(transaction.category);
        }

        // Create and train the model
        this.classifier = new NaiveBayes();
        
        // Convert features to the format expected by ml-naivebayes
        const trainingSet = features.map((feature, index) => ({
            input: feature,
            output: labels[index]
        }));

        this.classifier.train(trainingSet);

        console.log(`[SmartCategorization] Trained Naive Bayes model with ${trainingData.length} samples`);
    }

    /**
     * Extract features from transaction description and amount
     */
    extractFeatures(description, amount = 0) {
        if (!description) return [];

        const features = [];
        const cleanDesc = description.toLowerCase().trim();
        
        // Tokenize and remove stop words (supports Portuguese)
        let tokens = this.tokenizer.tokenize(cleanDesc) || [];
        
        // Remove Portuguese stop words
        const portugueseStopWords = ['de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com', 'sem', 'sob', 'sobre', 'entre', 'durante', 'antes', 'depois', 'ate', 'desde', 'contra', 'segundo', 'conforme', 'perante', 'mediante', 'durante', 'excepto', 'salvo', 'menos', 'fora', 'afora', 'alem', 'aquem', 'atraves', 'junto', 'perto', 'longe', 'dentro', 'fora', 'cima', 'baixo', 'frente', 'tras', 'lado', 'vez', 'vezes'];
        
        tokens = removeStopwords(tokens, portugueseStopWords);
        
        // Stem words
        tokens = tokens.map(token => this.stemmer.stem(token));
        
        // Add normalized tokens
        features.push(...tokens);
        
        // Add merchant detection
        const merchant = this.extractMerchant(cleanDesc);
        if (merchant) {
            features.push(`merchant_${merchant}`);
        }
        
        // Add amount ranges as features
        if (amount > 0) {
            features.push(this.getAmountRangeFeature(amount));
        }
        
        // Add length feature
        features.push(`length_${this.getDescriptionLengthCategory(cleanDesc)}`);
        
        // Add Brazilian transaction type features
        this.addBrazilianFeatures(cleanDesc, features);
        
        // Use NLP to extract key entities
        const doc = compromise(cleanDesc);
        const places = doc.places().out('array');
        const organizations = doc.organizations().out('array');
        
        places.forEach(place => features.push(`place_${place.toLowerCase()}`));
        organizations.forEach(org => features.push(`org_${org.toLowerCase()}`));

        return features;
    }

    /**
     * Add Brazilian-specific transaction features
     */
    addBrazilianFeatures(description, features) {
        // Brazilian banking terms
        const bankingTerms = {
            'tef': 'banking_tef',
            'pix': 'banking_pix',
            'transferencia': 'banking_transfer',
            'saque': 'banking_withdrawal',
            'deposito': 'banking_deposit',
            'pgto': 'payment',
            'pagamento': 'payment',
            'compra': 'purchase',
            'debito': 'debit',
            'credito': 'credit'
        };

        for (const [term, feature] of Object.entries(bankingTerms)) {
            if (description.includes(term)) {
                features.push(feature);
            }
        }

        // Brazilian currency patterns
        if (description.includes('r$') || description.includes('real')) {
            features.push('currency_brl');
        }

        // Brazilian document patterns
        if (/\d{3}\.\d{3}\.\d{3}-\d{2}/.test(description)) {
            features.push('document_cpf');
        }
        if (/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/.test(description)) {
            features.push('document_cnpj');
        }
    }

    /**
     * Extract merchant name from transaction description
     */
    extractMerchant(description) {
        // Common patterns for merchant extraction (English and Portuguese)
        const patterns = [
            /^([A-Z]+[A-Z\s&]+?)[\s\*]/,  // All caps merchant names
            /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,  // Title case names
            /^([\w\s]+?)(?:\s+\d+|\s*\*|$)/,  // Extract first part before numbers/symbols
            // Portuguese patterns
            /^([A-ZÁÇÉÍÓÚÂÊÎÔÛÀÈÌÒÙÃ]+[\w\s&]*?)[\s\*]/,  // Portuguese accented caps
            /(TEF|PIX|TRANSFERENCIA|SAQUE|DEPOSITO)/i,  // Brazilian banking terms
        ];

        for (const pattern of patterns) {
            const match = description.match(pattern);
            if (match && match[1] && match[1].length > 2) {
                return match[1].trim().toLowerCase();
            }
        }

        // Handle common Brazilian transaction prefixes
        const brazilianPatterns = [
            /^(.*?)\s+(LTDA|S\/A|SA|ME|EPP)(\s|$)/i,  // Company suffixes
            /^(PGTO|PAG|COMPRA)\s+(.*)/i,  // Payment prefixes
            /^(.*?)\s+(\d{2}\/\d{2}|\d{4})/,  // Before dates
        ];

        for (const pattern of brazilianPatterns) {
            const match = description.match(pattern);
            if (match && match[1] && match[1].length > 2) {
                return match[1].trim().toLowerCase();
            }
        }

        return null;
    }

    /**
     * Get amount range feature for ML training
     */
    getAmountRangeFeature(amount) {
        if (amount <= 10) return 'amount_very_small';
        if (amount <= 50) return 'amount_small';
        if (amount <= 200) return 'amount_medium';
        if (amount <= 1000) return 'amount_large';
        return 'amount_very_large';
    }

    /**
     * Get description length category
     */
    getDescriptionLengthCategory(description) {
        const length = description.length;
        if (length <= 10) return 'short';
        if (length <= 30) return 'medium';
        return 'long';
    }

    /**
     * Main categorization function - returns category suggestions
     */
    async suggestCategory(description, amount = 0, transactionType = 1, userId = null) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const suggestions = [];
        const cleanDesc = description.toLowerCase().trim();

        try {
            // 1. Check for direct merchant matches (highest confidence)
            const merchantSuggestion = this.checkMerchantPatterns(cleanDesc);
            if (merchantSuggestion) {
                suggestions.push(merchantSuggestion);
            }

            // 2. Check default rules
            const ruleSuggestions = this.checkDefaultRules(cleanDesc, transactionType);
            suggestions.push(...ruleSuggestions);

            // 3. Use ML model if available
            if (this.classifier) {
                const mlSuggestion = this.getMLPrediction(description, amount);
                if (mlSuggestion) {
                    suggestions.push(mlSuggestion);
                }
            }

            // 4. Get user-specific patterns if userId provided
            if (userId) {
                const userSuggestion = await this.getUserSpecificSuggestion(description, userId);
                if (userSuggestion) {
                    suggestions.push(userSuggestion);
                }
            }

            // Sort by confidence and return top suggestions
            const sortedSuggestions = this.rankSuggestions(suggestions);
            
            // Return top 3 suggestions
            return sortedSuggestions.slice(0, 3);

        } catch (error) {
            console.error('[SmartCategorization] Error in categorization:', error);
            return [{
                category: 'Uncategorized',
                confidence: 0.3,
                source: 'fallback'
            }];
        }
    }

    /**
     * Check merchant pattern matches
     */
    checkMerchantPatterns(description) {
        for (const [pattern, data] of this.merchantPatterns) {
            if (description.includes(pattern)) {
                return {
                    category: data.category,
                    confidence: Math.min(data.confidence + (data.usage / 1000), 0.98),
                    source: 'merchant_pattern',
                    pattern: pattern
                };
            }
        }
        return null;
    }

    /**
     * Check default categorization rules
     */
    checkDefaultRules(description, transactionType) {
        const suggestions = [];

        for (const [ruleKey, data] of this.defaultRules) {
            const [ruleType, ruleValue] = ruleKey.split(':');
            
            // Skip if rule doesn't match transaction type
            if (data.transactionType !== transactionType) continue;

            let matches = false;
            
            if (ruleType === 'keyword' && description.includes(ruleValue)) {
                matches = true;
            } else if (ruleType === 'merchant' && description.includes(ruleValue)) {
                matches = true;
            }

            if (matches) {
                suggestions.push({
                    category: data.category,
                    confidence: data.confidence,
                    source: 'rule',
                    rule: ruleKey
                });
            }
        }

        return suggestions;
    }

    /**
     * Get ML model prediction
     */
    getMLPrediction(description, amount) {
        if (!this.classifier) return null;

        try {
            const features = this.extractFeatures(description, amount);
            const prediction = this.classifier.predict(features);
            
            return {
                category: prediction.category,
                confidence: Math.min(prediction.probability * 0.8, 0.9), // Cap ML confidence
                source: 'ml_model'
            };
        } catch (error) {
            console.error('[SmartCategorization] ML prediction error:', error);
            return null;
        }
    }

    /**
     * Get user-specific suggestion based on their transaction history
     */
    async getUserSpecificSuggestion(description, userId) {
        try {
            // Find similar transactions by this user
            const { data: userTransactions, error } = await this.supabase
                .from('transactions')
                .select('description, category')
                .eq('userId', userId)
                .not('category', 'is', null)
                .limit(100);

            if (error || !userTransactions.length) return null;

            // Find best match using simple string similarity
            let bestMatch = null;
            let bestSimilarity = 0;

            for (const transaction of userTransactions) {
                const similarity = this.calculateStringSimilarity(
                    description.toLowerCase(), 
                    transaction.description.toLowerCase()
                );
                
                if (similarity > bestSimilarity && similarity > 0.6) {
                    bestSimilarity = similarity;
                    bestMatch = transaction;
                }
            }

            if (bestMatch) {
                return {
                    category: bestMatch.category,
                    confidence: Math.min(bestSimilarity * 0.8, 0.85),
                    source: 'user_history'
                };
            }

        } catch (error) {
            console.error('[SmartCategorization] User suggestion error:', error);
        }

        return null;
    }

    /**
     * Calculate simple string similarity
     */
    calculateStringSimilarity(str1, str2) {
        const tokens1 = new Set(this.tokenizer.tokenize(str1) || []);
        const tokens2 = new Set(this.tokenizer.tokenize(str2) || []);
        
        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const union = new Set([...tokens1, ...tokens2]);
        
        return intersection.size / union.size;
    }

    /**
     * Rank and deduplicate suggestions
     */
    rankSuggestions(suggestions) {
        // Group by category
        const categoryMap = new Map();
        
        for (const suggestion of suggestions) {
            if (!categoryMap.has(suggestion.category)) {
                categoryMap.set(suggestion.category, suggestion);
            } else {
                // Keep the one with higher confidence
                const existing = categoryMap.get(suggestion.category);
                if (suggestion.confidence > existing.confidence) {
                    categoryMap.set(suggestion.category, suggestion);
                }
            }
        }

        // Convert back to array and sort by confidence
        return Array.from(categoryMap.values())
            .sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Record user feedback for model improvement
     */
    async recordFeedback(userId, transactionDescription, suggestedCategory, actualCategory, wasAccepted, confidence, amount = null) {
        try {
            const merchantPattern = this.extractMerchant(transactionDescription.toLowerCase());
            
            const feedbackData = {
                user_id: userId,
                transaction_description: transactionDescription,
                suggested_category: suggestedCategory,
                actual_category: actualCategory,
                was_suggestion_accepted: wasAccepted,
                confidence_score: confidence,
                transaction_amount: amount,
                merchant_pattern: merchantPattern
            };

            const { error } = await this.supabase
                .from('categorization_feedback')
                .insert([feedbackData]);

            if (error) {
                console.error('[SmartCategorization] Error recording feedback:', error);
                return;
            }

            // Update merchant patterns if this creates a new pattern
            if (merchantPattern && !wasAccepted) {
                await this.updateMerchantPattern(merchantPattern, actualCategory);
            }

            // Add to training data
            await this.addToTrainingData(userId, transactionDescription, actualCategory, amount);

            console.log(`[SmartCategorization] Recorded feedback: ${wasAccepted ? 'accepted' : 'corrected'}`);

        } catch (error) {
            console.error('[SmartCategorization] Error in recordFeedback:', error);
        }
    }

    /**
     * Update merchant pattern based on feedback
     */
    async updateMerchantPattern(pattern, category) {
        try {
            const { data: existing, error: fetchError } = await this.supabase
                .from('merchant_patterns')
                .select('*')
                .eq('pattern', pattern.toUpperCase())
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('[SmartCategorization] Error checking merchant pattern:', fetchError);
                return;
            }

            if (existing) {
                // Update existing pattern
                const { error: updateError } = await this.supabase
                    .from('merchant_patterns')
                    .update({ 
                        suggested_category: category,
                        usage_count: existing.usage_count + 1,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);

                if (updateError) {
                    console.error('[SmartCategorization] Error updating merchant pattern:', updateError);
                }
            } else {
                // Create new pattern
                const { error: insertError } = await this.supabase
                    .from('merchant_patterns')
                    .insert([{
                        pattern: pattern.toUpperCase(),
                        suggested_category: category,
                        confidence_score: 0.7,
                        usage_count: 1
                    }]);

                if (insertError) {
                    console.error('[SmartCategorization] Error creating merchant pattern:', insertError);
                }
            }

            // Reload patterns to include the update
            await this.loadMerchantPatterns();

        } catch (error) {
            console.error('[SmartCategorization] Error in updateMerchantPattern:', error);
        }
    }

    /**
     * Add transaction to training data
     */
    async addToTrainingData(userId, description, category, amount, transactionType = 1) {
        try {
            const features = this.extractFeatures(description, amount);
            
            const trainingDataEntry = {
                user_id: userId,
                description: description,
                amount: amount,
                category: category,
                transaction_type_id: transactionType,
                processed_features: JSON.stringify(features),
                is_verified: true
            };

            const { error } = await this.supabase
                .from('ml_training_data')
                .insert([trainingDataEntry]);

            if (error) {
                console.error('[SmartCategorization] Error adding training data:', error);
            }

        } catch (error) {
            console.error('[SmartCategorization] Error in addToTrainingData:', error);
        }
    }

    /**
     * Retrain the model with latest data (to be called periodically)
     */
    async retrainModel() {
        console.log('[SmartCategorization] Starting model retraining...');
        
        try {
            // Get all verified training data
            const { data: trainingData, error } = await this.supabase
                .from('ml_training_data')
                .select('description, category, amount, transaction_type_id')
                .eq('is_verified', true);

            if (error) {
                console.error('[SmartCategorization] Error fetching training data for retraining:', error);
                return;
            }

            if (trainingData.length < 50) {
                console.log('[SmartCategorization] Insufficient data for retraining');
                return;
            }

            await this.trainNaiveBayesModel(trainingData);
            
            console.log(`[SmartCategorization] Model retrained with ${trainingData.length} samples`);

        } catch (error) {
            console.error('[SmartCategorization] Error during model retraining:', error);
        }
    }
}

module.exports = SmartCategorizationEngine; 
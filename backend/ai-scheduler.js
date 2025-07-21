const cron = require('node-cron');
const SmartCategorizationEngine = require('./smart-categorization');

/**
 * AI Scheduler for Smart Categorization
 * Handles background tasks like model retraining and performance monitoring
 */
class AIScheduler {
    constructor(supabase) {
        this.supabase = supabase;
        this.smartCategorization = new SmartCategorizationEngine(supabase);
        this.isInitialized = false;
    }

    /**
     * Initialize the scheduler
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('[AIScheduler] Initializing AI Scheduler...');
            
            // Initialize the smart categorization engine
            await this.smartCategorization.initialize();
            
            // Start scheduled tasks
            this.scheduleModelRetraining();
            this.schedulePerformanceMonitoring();
            this.scheduleDataCleanup();
            
            this.isInitialized = true;
            console.log('[AIScheduler] AI Scheduler initialized successfully');
            
        } catch (error) {
            console.error('[AIScheduler] Failed to initialize:', error);
        }
    }

    /**
     * Schedule daily model retraining (runs at 2 AM daily)
     */
    scheduleModelRetraining() {
        // Run daily at 2:00 AM
        cron.schedule('0 2 * * *', async () => {
            console.log('[AIScheduler] Starting scheduled model retraining...');
            
            try {
                // Check if there's enough new feedback to warrant retraining
                const feedbackCount = await this.getNewFeedbackCount();
                
                if (feedbackCount < 10) {
                    console.log(`[AIScheduler] Insufficient new feedback (${feedbackCount}), skipping retraining`);
                    return;
                }
                
                // Retrain the model
                await this.smartCategorization.retrainModel();
                
                // Update model metrics
                await this.updateModelMetrics();
                
                console.log('[AIScheduler] Scheduled model retraining completed successfully');
                
            } catch (error) {
                console.error('[AIScheduler] Error during scheduled retraining:', error);
            }
        }, {
            scheduled: true,
            timezone: "UTC"
        });
        
        console.log('[AIScheduler] Model retraining scheduled for 2:00 AM daily');
    }

    /**
     * Schedule performance monitoring (runs every 6 hours)
     */
    schedulePerformanceMonitoring() {
        // Run every 6 hours
        cron.schedule('0 */6 * * *', async () => {
            console.log('[AIScheduler] Running performance monitoring...');
            
            try {
                await this.monitorModelPerformance();
                await this.updateMerchantPatterns();
                
                console.log('[AIScheduler] Performance monitoring completed');
                
            } catch (error) {
                console.error('[AIScheduler] Error during performance monitoring:', error);
            }
        }, {
            scheduled: true,
            timezone: "UTC"
        });
        
        console.log('[AIScheduler] Performance monitoring scheduled every 6 hours');
    }

    /**
     * Schedule data cleanup (runs weekly on Sunday at midnight)
     */
    scheduleDataCleanup() {
        // Run weekly on Sunday at midnight
        cron.schedule('0 0 * * 0', async () => {
            console.log('[AIScheduler] Running weekly data cleanup...');
            
            try {
                await this.cleanupOldFeedback();
                await this.optimizeMerchantPatterns();
                
                console.log('[AIScheduler] Data cleanup completed');
                
            } catch (error) {
                console.error('[AIScheduler] Error during data cleanup:', error);
            }
        }, {
            scheduled: true,
            timezone: "UTC"
        });
        
        console.log('[AIScheduler] Data cleanup scheduled for Sundays at midnight');
    }

    /**
     * Get count of new feedback since last retraining
     */
    async getNewFeedbackCount() {
        try {
            // Get the last model metrics to see when we last retrained
            const { data: lastMetrics, error: metricsError } = await this.supabase
                .from('ml_model_metrics')
                .select('created_at')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            let since = '1970-01-01'; // Default to epoch if no previous metrics
            if (!metricsError && lastMetrics) {
                since = lastMetrics.created_at;
            }

            const { data: feedback, error } = await this.supabase
                .from('categorization_feedback')
                .select('id', { count: 'exact' })
                .gte('feedback_timestamp', since);

            if (error) {
                console.error('[AIScheduler] Error getting feedback count:', error);
                return 0;
            }

            return feedback?.length || 0;

        } catch (error) {
            console.error('[AIScheduler] Error in getNewFeedbackCount:', error);
            return 0;
        }
    }

    /**
     * Monitor model performance and alert if accuracy drops
     */
    async monitorModelPerformance() {
        try {
            // Get recent feedback (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: recentFeedback, error } = await this.supabase
                .from('categorization_feedback')
                .select('was_suggestion_accepted, confidence_score')
                .gte('feedback_timestamp', sevenDaysAgo.toISOString());

            if (error || !recentFeedback.length) {
                console.log('[AIScheduler] No recent feedback to analyze');
                return;
            }

            // Calculate current accuracy
            const totalFeedback = recentFeedback.length;
            const acceptedSuggestions = recentFeedback.filter(f => f.was_suggestion_accepted).length;
            const currentAccuracy = acceptedSuggestions / totalFeedback;

            console.log(`[AIScheduler] Current 7-day accuracy: ${(currentAccuracy * 100).toFixed(2)}%`);

            // Alert if accuracy drops below threshold
            const accuracyThreshold = 0.65; // 65%
            if (currentAccuracy < accuracyThreshold) {
                console.warn(`[AIScheduler] WARNING: Model accuracy (${(currentAccuracy * 100).toFixed(2)}%) below threshold (${accuracyThreshold * 100}%)`);
                
                // Could add email notifications or other alerting here
                await this.recordPerformanceAlert(currentAccuracy, totalFeedback);
            }

        } catch (error) {
            console.error('[AIScheduler] Error monitoring performance:', error);
        }
    }

    /**
     * Update model metrics in database
     */
    async updateModelMetrics() {
        try {
            // Get all feedback to calculate overall metrics
            const { data: allFeedback, error } = await this.supabase
                .from('categorization_feedback')
                .select('was_suggestion_accepted, confidence_score');

            if (error || !allFeedback.length) {
                console.log('[AIScheduler] No feedback data for metrics calculation');
                return;
            }

            const totalPredictions = allFeedback.length;
            const correctPredictions = allFeedback.filter(f => f.was_suggestion_accepted).length;
            const accuracy = correctPredictions / totalPredictions;

            // Get training data size
            const { data: trainingData, error: trainingError } = await this.supabase
                .from('ml_training_data')
                .select('id', { count: 'exact' });

            const trainingDataSize = trainingError ? 0 : (trainingData?.length || 0);

            // Insert new metrics record
            const metricsData = {
                model_version: `v${Date.now()}`,
                accuracy_score: accuracy,
                precision_score: accuracy, // Simplified for now
                recall_score: accuracy,    // Simplified for now
                total_predictions: totalPredictions,
                correct_predictions: correctPredictions,
                training_data_size: trainingDataSize
            };

            const { error: insertError } = await this.supabase
                .from('ml_model_metrics')
                .insert([metricsData]);

            if (insertError) {
                console.error('[AIScheduler] Error inserting model metrics:', insertError);
            } else {
                console.log(`[AIScheduler] Model metrics updated: ${(accuracy * 100).toFixed(2)}% accuracy`);
            }

        } catch (error) {
            console.error('[AIScheduler] Error updating model metrics:', error);
        }
    }

    /**
     * Update merchant patterns based on recent feedback
     */
    async updateMerchantPatterns() {
        try {
            // Get recent feedback with merchant information
            const { data: feedback, error } = await this.supabase
                .from('categorization_feedback')
                .select('merchant_pattern, actual_category, was_suggestion_accepted')
                .not('merchant_pattern', 'is', null)
                .gte('feedback_timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

            if (error || !feedback.length) {
                return;
            }

            // Group by merchant pattern
            const merchantStats = {};
            for (const f of feedback) {
                const pattern = f.merchant_pattern.toUpperCase();
                if (!merchantStats[pattern]) {
                    merchantStats[pattern] = {
                        categories: {},
                        totalFeedback: 0,
                        correctPredictions: 0
                    };
                }

                merchantStats[pattern].totalFeedback++;
                if (f.was_suggestion_accepted) {
                    merchantStats[pattern].correctPredictions++;
                }

                // Track category usage
                if (!merchantStats[pattern].categories[f.actual_category]) {
                    merchantStats[pattern].categories[f.actual_category] = 0;
                }
                merchantStats[pattern].categories[f.actual_category]++;
            }

            // Update patterns that have significant data
            for (const [pattern, stats] of Object.entries(merchantStats)) {
                if (stats.totalFeedback >= 3) { // At least 3 feedback instances
                    // Find most common category
                    const mostCommonCategory = Object.entries(stats.categories)
                        .sort((a, b) => b[1] - a[1])[0][0];

                    const confidence = Math.min(0.95, stats.correctPredictions / stats.totalFeedback + 0.1);

                    // Update merchant pattern
                    const { error: updateError } = await this.supabase
                        .from('merchant_patterns')
                        .upsert({
                            pattern: pattern,
                            suggested_category: mostCommonCategory,
                            confidence_score: confidence,
                            usage_count: stats.totalFeedback,
                            updated_at: new Date().toISOString()
                        });

                    if (updateError) {
                        console.error(`[AIScheduler] Error updating merchant pattern ${pattern}:`, updateError);
                    } else {
                        console.log(`[AIScheduler] Updated merchant pattern: ${pattern} -> ${mostCommonCategory}`);
                    }
                }
            }

        } catch (error) {
            console.error('[AIScheduler] Error updating merchant patterns:', error);
        }
    }

    /**
     * Clean up old feedback data (keep last 6 months)
     */
    async cleanupOldFeedback() {
        try {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const { data, error } = await this.supabase
                .from('categorization_feedback')
                .delete()
                .lt('feedback_timestamp', sixMonthsAgo.toISOString());

            if (error) {
                console.error('[AIScheduler] Error cleaning up old feedback:', error);
            } else {
                console.log('[AIScheduler] Old feedback data cleaned up');
            }

        } catch (error) {
            console.error('[AIScheduler] Error in cleanupOldFeedback:', error);
        }
    }

    /**
     * Optimize merchant patterns by removing unused ones
     */
    async optimizeMerchantPatterns() {
        try {
            // Remove patterns with very low usage and confidence
            const { data, error } = await this.supabase
                .from('merchant_patterns')
                .delete()
                .lt('usage_count', 2)
                .lt('confidence_score', 0.3);

            if (error) {
                console.error('[AIScheduler] Error optimizing merchant patterns:', error);
            } else {
                console.log('[AIScheduler] Merchant patterns optimized');
            }

        } catch (error) {
            console.error('[AIScheduler] Error in optimizeMerchantPatterns:', error);
        }
    }

    /**
     * Record performance alert
     */
    async recordPerformanceAlert(accuracy, sampleSize) {
        try {
            // For now, just log. In production, this could send notifications
            console.log(`[AIScheduler] PERFORMANCE ALERT: Accuracy ${(accuracy * 100).toFixed(2)}% (${sampleSize} samples)`);
            
            // Could implement email notifications, Slack alerts, etc.
            
        } catch (error) {
            console.error('[AIScheduler] Error recording performance alert:', error);
        }
    }

    /**
     * Manually trigger model retraining (for testing or admin use)
     */
    async manualRetrain() {
        console.log('[AIScheduler] Manual retraining initiated...');
        
        try {
            await this.smartCategorization.retrainModel();
            await this.updateModelMetrics();
            
            console.log('[AIScheduler] Manual retraining completed successfully');
            return true;
            
        } catch (error) {
            console.error('[AIScheduler] Error during manual retraining:', error);
            return false;
        }
    }

    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            scheduledTasks: {
                modelRetraining: '2:00 AM daily',
                performanceMonitoring: 'Every 6 hours',
                dataCleanup: 'Sundays at midnight'
            }
        };
    }
}

module.exports = AIScheduler; 
# Smart Categorization System

An AI-powered transaction categorization system for Monity that automatically learns from user behavior and provides intelligent category suggestions.

## Overview

The Smart Categorization system uses machine learning and natural language processing to automatically suggest appropriate categories for financial transactions. It learns from historical data and user feedback to continuously improve its accuracy.

## Features

### 🤖 AI-Powered Suggestions
- **Natural Language Processing**: Analyzes transaction descriptions using advanced NLP techniques
- **Machine Learning**: Uses Naive Bayes classification trained on historical transaction data
- **Merchant Recognition**: Identifies common merchants and their typical categories
- **Confidence Scoring**: Provides confidence levels for each suggestion (0-100%)

### 📚 Multiple Data Sources
- **Historical Transactions**: Learns from existing categorized transactions
- **User Feedback**: Continuously improves based on user corrections
- **Merchant Patterns**: Global database of merchant-to-category mappings
- **Rule-Based System**: Fallback rules for common transaction types

### 🔄 Continuous Learning
- **Feedback Loop**: Records when users accept/reject suggestions
- **Model Retraining**: Automatically retrains models with new data
- **Pattern Recognition**: Identifies new merchant patterns from user behavior
- **Performance Monitoring**: Tracks accuracy and alerts on degradation

### ⚡ Real-Time Integration
- **Instant Suggestions**: Provides suggestions as users type transaction descriptions
- **Seamless UI**: Integrated into existing expense/income forms
- **Debounced Requests**: Optimized to avoid excessive API calls

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ useSmartCat │◄├────┤ │ AI Endpoints│ │    │ │ ML Tables   │ │
│ │ Hook        │ │    │ │             │ │    │ │             │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ AddExpense  │ │    │ │ Smart       │ │    │ │ Feedback    │ │
│ │ Component   │ │    │ │ Categoriz.  │ │    │ │ Data        │ │
│ └─────────────┘ │    │ │ Engine      │ │    │ └─────────────┘ │
│                 │    │ └─────────────┘ │    │                 │
│                 │    │                 │    │ ┌─────────────┐ │
│                 │    │ ┌─────────────┐ │    │ │ Merchant    │ │
│                 │    │ │ AI          │ │    │ │ Patterns    │ │
│                 │    │ │ Scheduler   │ │    │ └─────────────┘ │
│                 │    │ └─────────────┘ │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Installation & Setup

### 1. Install Dependencies

The Smart Categorization system requires additional ML dependencies:

```bash
cd backend
npm install natural compromise ml-matrix ml-naivebayes stopword node-cron
```

### 2. Database Migration

Run the smart categorization migration to set up the required database tables:

```sql
-- Execute migration_add_smart_categorization_tables.sql in your Supabase dashboard
-- This creates tables for:
-- - merchant_patterns
-- - categorization_feedback  
-- - ml_training_data
-- - default_category_rules
-- - ml_model_metrics
```

### 3. Environment Variables

Ensure your backend `.env` file includes the required Supabase configuration:

```env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Start the System

Start the backend server - the AI system will initialize automatically:

```bash
cd backend
npm start
```

You should see initialization logs like:
```
[SmartCategorization] Initializing engine...
[SmartCategorization] Loaded 10 merchant patterns
[SmartCategorization] Loaded 25 default rules
[AIScheduler] AI Scheduler initialized successfully
```

## API Documentation

### POST `/ai/suggest-category`

Get AI-powered category suggestions for a transaction.

**Request:**
```json
{
  "description": "STARBUCKS COFFEE #1234",
  "amount": 4.95,
  "transactionType": 1
}
```

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "category": "Dining Out",
      "confidence": 0.95,
      "source": "merchant_pattern",
      "pattern": "starbucks"
    },
    {
      "category": "Coffee",
      "confidence": 0.82,
      "source": "ml_model"
    }
  ],
  "description": "STARBUCKS COFFEE #1234"
}
```

### POST `/ai/feedback`

Record user feedback to improve the AI model.

**Request:**
```json
{
  "transactionDescription": "STARBUCKS COFFEE #1234",
  "suggestedCategory": "Dining Out",
  "actualCategory": "Coffee",
  "wasAccepted": false,
  "confidence": 0.95,
  "amount": 4.95
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback recorded successfully"
}
```

### GET `/ai/stats` (Admin Only)

Get AI system performance statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalFeedback": 1250,
    "acceptedSuggestions": 987,
    "accuracy": "78.96",
    "merchantPatternsCount": 45,
    "avgConfidence": "0.742"
  }
}
```

### POST `/ai/retrain` (Admin Only)

Manually trigger model retraining.

**Response:**
```json
{
  "success": true,
  "message": "Model retraining completed successfully"
}
```

## Frontend Integration

### Using the Smart Categorization Hook

```jsx
import { useSmartCategorization } from '../hooks/useSmartCategorization';

function MyComponent() {
    const { 
        suggestions, 
        isLoading, 
        getSuggestions, 
        recordFeedback 
    } = useSmartCategorization();

    const handleDescriptionChange = async (description) => {
        if (description.length >= 3) {
            await getSuggestions(description, amount, transactionType);
        }
    };

    const handleSuggestionSelect = (suggestion) => {
        setCategory(suggestion.category);
        // Record feedback when user accepts suggestion
        recordFeedback(description, suggestion.category, suggestion.category, true, suggestion.confidence);
    };

    return (
        // Your component JSX
    );
}
```

### AI Suggestions UI Components

The system includes pre-built UI components that display:

- **Loading indicator** while fetching suggestions
- **Suggestion cards** with confidence scores and visual indicators
- **Source information** (ML model, merchant pattern, rules, etc.)
- **Visual confidence bars** showing prediction certainty

## Machine Learning Details

### Feature Extraction

The system extracts the following features from transaction descriptions:

1. **Tokenized Words**: Normalized, stemmed words from the description
2. **Merchant Names**: Extracted merchant identifiers
3. **Amount Ranges**: Categorized transaction amounts (small, medium, large, etc.)
4. **Length Categories**: Description length indicators
5. **Named Entities**: Places and organizations identified via NLP

### Classification Approach

- **Primary**: Naive Bayes classifier trained on historical transactions
- **Fallback**: Rule-based system using keywords and merchant patterns
- **Hybrid**: Combines multiple prediction sources with confidence weighting

### Training Data

The model trains on:
- Historical transactions with confirmed categories
- User feedback data (corrections and acceptances)
- Manually curated default rules
- Merchant pattern database

## Background Jobs & Maintenance

### Scheduled Tasks

1. **Model Retraining** (Daily at 2 AM UTC)
   - Checks for sufficient new feedback data (≥10 samples)
   - Retrains the ML model with latest data
   - Updates model metrics

2. **Performance Monitoring** (Every 6 hours)
   - Calculates current accuracy metrics
   - Updates merchant patterns based on feedback
   - Alerts if accuracy drops below 65%

3. **Data Cleanup** (Weekly on Sundays)
   - Removes feedback data older than 6 months
   - Optimizes merchant patterns by removing unused ones

### Manual Administration

Admins can:
- View real-time AI statistics at `/ai/stats`
- Manually trigger retraining via `/ai/retrain`
- Monitor merchant patterns at `/ai/patterns`

## Performance & Optimization

### Response Times
- **Suggestion Generation**: < 200ms typical
- **Feedback Recording**: < 100ms typical
- **Model Initialization**: 2-5 seconds on startup

### Accuracy Metrics
- **Initial Accuracy**: 60-70% (with default rules only)
- **With Training Data**: 75-85% (after 100+ transactions)
- **Mature System**: 85-95% (after 1000+ transactions with feedback)

### Scalability
- Supports thousands of users with shared merchant patterns
- Individual user patterns for personalized suggestions
- Efficient feature extraction and caching

## Configuration & Customization

### Default Categories

The system includes pre-configured categories for:
- **Expenses**: Groceries, Dining Out, Transportation, Utilities, Shopping, Entertainment, Healthcare
- **Income**: Salary, Freelance, Investment Returns, etc.

### Merchant Patterns

Built-in patterns for popular merchants:
- Coffee shops (Starbucks, Dunkin)
- Grocery stores (Walmart, Target, Costco)
- Gas stations (Shell, Exxon, BP)
- Restaurants (McDonald's, Subway)
- Online services (Amazon, Netflix, Spotify)

### Confidence Thresholds

- **High Confidence**: ≥80% (auto-suggest in UI)
- **Medium Confidence**: 60-79% (show as suggestion)
- **Low Confidence**: 40-59% (include in list)
- **Very Low**: <40% (fallback to "Uncategorized")

## Troubleshooting

### Common Issues

1. **No Suggestions Appearing**
   - Check if description is ≥3 characters
   - Verify API endpoint connectivity
   - Check browser console for errors

2. **Low Accuracy**
   - Ensure sufficient training data (≥50 transactions)
   - Check feedback loop is working
   - Verify merchant patterns are loading

3. **Slow Performance**
   - Check database indexes are created
   - Verify ML model initialization completed
   - Monitor server resources

### Debug Endpoints

- `GET /ai/stats` - View system metrics
- `GET /ai/patterns` - Check merchant patterns
- Server logs contain detailed AI operation information

## Future Enhancements

### Planned Features
- **Category Confidence Learning**: Adapt confidence thresholds per user
- **Multi-language Support**: NLP processing for non-English transactions
- **Advanced ML Models**: Experiment with deep learning approaches
- **Smart Splitting**: AI-powered expense splitting suggestions
- **Budget Integration**: Category suggestions based on budget goals

### Extensibility
- **Custom Rules**: User-defined categorization rules
- **API Integration**: Connect to bank APIs for real-time categorization
- **Mobile App**: Native mobile AI categorization support

## Support

For issues related to the Smart Categorization system:

1. Check the server logs for AI-related error messages
2. Verify database migrations were applied correctly
3. Ensure all ML dependencies are installed
4. Review the API documentation for correct request formats

The system is designed to gracefully degrade - if AI suggestions fail, users can still manually categorize transactions normally. 
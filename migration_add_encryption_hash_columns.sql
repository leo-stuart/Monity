-- Migration to add hash columns for encrypted searchable fields
-- These columns will store hashes of encrypted data to enable searching

-- Add hash column for transaction descriptions
ALTER TABLE transactions ADD COLUMN description_hash TEXT;
CREATE INDEX idx_transactions_description_hash ON transactions(description_hash);

-- Add hash column for group expense descriptions
ALTER TABLE group_expenses ADD COLUMN description_hash TEXT;
CREATE INDEX idx_group_expenses_description_hash ON group_expenses(description_hash);

-- Add hash column for categorization feedback transaction descriptions
ALTER TABLE categorization_feedback ADD COLUMN transaction_description_hash TEXT;
CREATE INDEX idx_categorization_feedback_transaction_description_hash ON categorization_feedback(transaction_description_hash);

-- Add hash column for ML training data descriptions
ALTER TABLE ml_training_data ADD COLUMN description_hash TEXT;
CREATE INDEX idx_ml_training_data_description_hash ON ml_training_data(description_hash);

-- Note: These hash columns will be populated automatically by the encryption middleware
-- when new data is inserted or existing data is updated 
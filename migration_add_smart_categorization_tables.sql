-- Migration for Smart Categorization System
-- This adds tables to support AI-powered transaction categorization

-- Create table to store merchant patterns and their most common categories
CREATE TABLE "merchant_patterns" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "pattern" TEXT NOT NULL, -- e.g., "STARBUCKS", "AMAZON", "ATM"
    "suggested_category" TEXT NOT NULL,
    "confidence_score" DECIMAL(3,2) DEFAULT 0.8, -- 0.0 to 1.0
    "usage_count" INTEGER DEFAULT 1,
    "created_at" TIMESTAMPTZ DEFAULT now(),
    "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- Create table to store user feedback on categorization suggestions
CREATE TABLE "categorization_feedback" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES auth.users("id"),
    "transaction_description" TEXT NOT NULL,
    "suggested_category" TEXT NOT NULL,
    "actual_category" TEXT NOT NULL,
    "was_suggestion_accepted" BOOLEAN NOT NULL,
    "confidence_score" DECIMAL(3,2),
    "transaction_amount" NUMERIC,
    "feedback_timestamp" TIMESTAMPTZ DEFAULT now(),
    "merchant_pattern" TEXT
);

-- Create table to store ML model training data
CREATE TABLE "ml_training_data" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES auth.users("id"),
    "description" TEXT NOT NULL,
    "amount" NUMERIC,
    "category" TEXT NOT NULL,
    "transaction_type_id" INTEGER REFERENCES "transaction_types"("id"),
    "processed_features" JSONB, -- Store extracted features for ML
    "date_added" TIMESTAMPTZ DEFAULT now(),
    "is_verified" BOOLEAN DEFAULT false -- Whether this data is confirmed accurate
);

-- Create table to store default category mappings and rules
CREATE TABLE "default_category_rules" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "rule_type" TEXT NOT NULL, -- 'keyword', 'merchant', 'amount_range', 'pattern'
    "rule_value" TEXT NOT NULL, -- The actual rule (keyword, pattern, etc.)
    "suggested_category" TEXT NOT NULL,
    "transaction_type_id" INTEGER REFERENCES "transaction_types"("id"),
    "confidence_score" DECIMAL(3,2) DEFAULT 0.7,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

-- Create table to track model performance metrics
CREATE TABLE "ml_model_metrics" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "model_version" TEXT NOT NULL,
    "accuracy_score" DECIMAL(5,4),
    "precision_score" DECIMAL(5,4),
    "recall_score" DECIMAL(5,4),
    "total_predictions" INTEGER DEFAULT 0,
    "correct_predictions" INTEGER DEFAULT 0,
    "training_data_size" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_merchant_patterns_pattern ON "merchant_patterns"("pattern");
CREATE INDEX idx_categorization_feedback_user_id ON "categorization_feedback"("user_id");
CREATE INDEX idx_categorization_feedback_timestamp ON "categorization_feedback"("feedback_timestamp");
CREATE INDEX idx_ml_training_data_user_id ON "ml_training_data"("user_id");
CREATE INDEX idx_ml_training_data_category ON "ml_training_data"("category");
CREATE INDEX idx_default_category_rules_type ON "default_category_rules"("rule_type");

-- Set up Row Level Security
ALTER TABLE "merchant_patterns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categorization_feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ml_training_data" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "default_category_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ml_model_metrics" ENABLE ROW LEVEL SECURITY;

-- Merchant patterns are global (no user restriction needed)
CREATE POLICY "Allow read access to merchant patterns" ON "merchant_patterns" FOR SELECT USING (true);
CREATE POLICY "Allow insert to merchant patterns" ON "merchant_patterns" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to merchant patterns" ON "merchant_patterns" FOR UPDATE USING (true);

-- User-specific policies for feedback and training data
CREATE POLICY "Allow individual access to categorization feedback" ON "categorization_feedback" FOR ALL USING (auth.uid() = "user_id");
CREATE POLICY "Allow individual access to ml training data" ON "ml_training_data" FOR ALL USING (auth.uid() = "user_id");

-- Default category rules are global
CREATE POLICY "Allow read access to default category rules" ON "default_category_rules" FOR SELECT USING (true);

-- Model metrics are global read-only
CREATE POLICY "Allow read access to model metrics" ON "ml_model_metrics" FOR SELECT USING (true);

-- Insert default category rules (English and Portuguese)
INSERT INTO "default_category_rules" ("rule_type", "rule_value", "suggested_category", "transaction_type_id", "confidence_score") VALUES
-- English Grocery stores
('keyword', 'grocery', 'Groceries', 1, 0.9),
('keyword', 'supermarket', 'Groceries', 1, 0.9),
('merchant', 'walmart', 'Groceries', 1, 0.8),
('merchant', 'target', 'Shopping', 1, 0.8),
('merchant', 'costco', 'Groceries', 1, 0.8),

-- Portuguese Grocery stores / Supermercados
('keyword', 'supermercado', 'Supermercado', 1, 0.9),
('keyword', 'mercado', 'Supermercado', 1, 0.9),
('keyword', 'feira', 'Supermercado', 1, 0.85),
('merchant', 'carrefour', 'Supermercado', 1, 0.9),
('merchant', 'extra', 'Supermercado', 1, 0.9),
('merchant', 'pao de acucar', 'Supermercado', 1, 0.9),
('merchant', 'assai', 'Supermercado', 1, 0.9),
('merchant', 'big', 'Supermercado', 1, 0.9),

-- English Restaurants
('keyword', 'restaurant', 'Dining Out', 1, 0.9),
('merchant', 'mcdonalds', 'Dining Out', 1, 0.95),
('merchant', 'starbucks', 'Dining Out', 1, 0.95),
('merchant', 'subway', 'Dining Out', 1, 0.95),
('keyword', 'pizza', 'Dining Out', 1, 0.9),

-- Portuguese Restaurants / Restaurantes
('keyword', 'restaurante', 'Restaurante', 1, 0.9),
('keyword', 'lanchonete', 'Restaurante', 1, 0.9),
('keyword', 'pizzaria', 'Restaurante', 1, 0.9),
('keyword', 'padaria', 'Alimentação', 1, 0.85),
('keyword', 'cafe', 'Alimentação', 1, 0.8),
('keyword', 'bar', 'Entretenimento', 1, 0.8),
('merchant', 'bobs', 'Restaurante', 1, 0.95),
('merchant', 'habib', 'Restaurante', 1, 0.95),
('merchant', 'dominos', 'Restaurante', 1, 0.95),

-- English Transportation
('keyword', 'gas', 'Transportation', 1, 0.9),
('keyword', 'fuel', 'Transportation', 1, 0.9),
('merchant', 'shell', 'Transportation', 1, 0.9),
('merchant', 'exxon', 'Transportation', 1, 0.9),
('merchant', 'uber', 'Transportation', 1, 0.95),
('merchant', 'lyft', 'Transportation', 1, 0.95),

-- Portuguese Transportation / Transporte
('keyword', 'combustivel', 'Transporte', 1, 0.9),
('keyword', 'gasolina', 'Transporte', 1, 0.9),
('keyword', 'alcool', 'Transporte', 1, 0.9),
('keyword', 'posto', 'Transporte', 1, 0.85),
('keyword', 'uber', 'Transporte', 1, 0.95),
('keyword', '99', 'Transporte', 1, 0.95),
('keyword', 'onibus', 'Transporte', 1, 0.9),
('keyword', 'metro', 'Transporte', 1, 0.9),
('merchant', 'petrobras', 'Transporte', 1, 0.9),
('merchant', 'ipiranga', 'Transporte', 1, 0.9),
('merchant', 'ale', 'Transporte', 1, 0.9),

-- English Utilities
('keyword', 'electric', 'Utilities', 1, 0.9),
('keyword', 'water', 'Utilities', 1, 0.9),
('keyword', 'internet', 'Utilities', 1, 0.9),
('keyword', 'phone', 'Utilities', 1, 0.8),

-- Portuguese Utilities / Utilidades
('keyword', 'energia', 'Utilidades', 1, 0.9),
('keyword', 'eletrica', 'Utilidades', 1, 0.9),
('keyword', 'agua', 'Utilidades', 1, 0.9),
('keyword', 'internet', 'Utilidades', 1, 0.9),
('keyword', 'telefone', 'Utilidades', 1, 0.8),
('keyword', 'celular', 'Utilidades', 1, 0.8),
('keyword', 'conta de luz', 'Utilidades', 1, 0.95),
('merchant', 'vivo', 'Utilidades', 1, 0.9),
('merchant', 'tim', 'Utilidades', 1, 0.9),
('merchant', 'claro', 'Utilidades', 1, 0.9),
('merchant', 'oi', 'Utilidades', 1, 0.9),

-- English Shopping
('merchant', 'amazon', 'Shopping', 1, 0.8),
('merchant', 'ebay', 'Shopping', 1, 0.8),
('keyword', 'online', 'Shopping', 1, 0.6),

-- Portuguese Shopping / Compras
('keyword', 'compras', 'Compras', 1, 0.8),
('keyword', 'loja', 'Compras', 1, 0.7),
('keyword', 'shopping', 'Compras', 1, 0.8),
('merchant', 'magazine luiza', 'Compras', 1, 0.9),
('merchant', 'casas bahia', 'Compras', 1, 0.9),
('merchant', 'americanas', 'Compras', 1, 0.9),
('merchant', 'mercado livre', 'Compras', 1, 0.9),

-- English Entertainment
('keyword', 'movie', 'Entertainment', 1, 0.9),
('keyword', 'theater', 'Entertainment', 1, 0.9),
('merchant', 'netflix', 'Entertainment', 1, 0.95),
('merchant', 'spotify', 'Entertainment', 1, 0.95),

-- Portuguese Entertainment / Entretenimento
('keyword', 'cinema', 'Entretenimento', 1, 0.9),
('keyword', 'filme', 'Entretenimento', 1, 0.9),
('keyword', 'teatro', 'Entretenimento', 1, 0.9),
('keyword', 'show', 'Entretenimento', 1, 0.9),
('keyword', 'balada', 'Entretenimento', 1, 0.8),
('merchant', 'netflix', 'Entretenimento', 1, 0.95),
('merchant', 'spotify', 'Entretenimento', 1, 0.95),
('merchant', 'globo play', 'Entretenimento', 1, 0.95),

-- English Healthcare
('keyword', 'pharmacy', 'Healthcare', 1, 0.9),
('keyword', 'doctor', 'Healthcare', 1, 0.9),
('keyword', 'medical', 'Healthcare', 1, 0.9),

-- Portuguese Healthcare / Saúde
('keyword', 'farmacia', 'Saúde', 1, 0.9),
('keyword', 'medico', 'Saúde', 1, 0.9),
('keyword', 'hospital', 'Saúde', 1, 0.9),
('keyword', 'clinica', 'Saúde', 1, 0.9),
('keyword', 'dentista', 'Saúde', 1, 0.9),
('keyword', 'laboratorio', 'Saúde', 1, 0.9),
('merchant', 'drogasil', 'Saúde', 1, 0.9),
('merchant', 'droga raia', 'Saúde', 1, 0.9),
('merchant', 'pacheco', 'Saúde', 1, 0.9),

-- English Income patterns
('keyword', 'salary', 'Salary', 2, 0.95),
('keyword', 'payroll', 'Salary', 2, 0.95),
('keyword', 'wage', 'Salary', 2, 0.9),
('keyword', 'freelance', 'Freelance', 2, 0.9),
('keyword', 'consulting', 'Freelance', 2, 0.8),

-- Portuguese Income patterns / Receitas
('keyword', 'salario', 'Salário', 2, 0.95),
('keyword', 'pagamento', 'Salário', 2, 0.9),
('keyword', 'freelance', 'Freelance', 2, 0.9),
('keyword', 'consultoria', 'Freelance', 2, 0.8),
('keyword', 'rendimento', 'Investimento', 2, 0.8),
('keyword', 'dividendo', 'Investimento', 2, 0.9),
('keyword', 'bonus', 'Salário', 2, 0.9);

-- Insert common merchant patterns (English and Portuguese)
INSERT INTO "merchant_patterns" ("pattern", "suggested_category", "confidence_score", "usage_count") VALUES
-- English/International merchants
('STARBUCKS', 'Dining Out', 0.95, 100),
('AMAZON', 'Shopping', 0.8, 200),
('WALMART', 'Groceries', 0.85, 150),
('MCDONALDS', 'Dining Out', 0.95, 80),
('SHELL', 'Transportation', 0.9, 90),
('TARGET', 'Shopping', 0.8, 70),
('UBER', 'Transportation', 0.95, 120),
('NETFLIX', 'Entertainment', 0.95, 60),
('ATM', 'Cash Withdrawal', 0.9, 200),
('PAYPAL', 'Online Payment', 0.7, 50),

-- Brazilian merchants / Comerciantes brasileiros
('CARREFOUR', 'Supermercado', 0.9, 150),
('EXTRA', 'Supermercado', 0.9, 120),
('PAO DE ACUCAR', 'Supermercado', 0.9, 100),
('ASSAI', 'Supermercado', 0.9, 80),
('BIG', 'Supermercado', 0.85, 60),
('PETROBRAS', 'Transporte', 0.9, 100),
('IPIRANGA', 'Transporte', 0.9, 90),
('ALE', 'Transporte', 0.9, 70),
('99', 'Transporte', 0.95, 150),
('BOBS', 'Restaurante', 0.95, 80),
('HABIBS', 'Restaurante', 0.95, 70),
('DOMINOS', 'Restaurante', 0.95, 60),
('MAGAZINE LUIZA', 'Compras', 0.9, 120),
('CASAS BAHIA', 'Compras', 0.9, 100),
('AMERICANAS', 'Compras', 0.9, 110),
('MERCADO LIVRE', 'Compras', 0.9, 140),
('DROGASIL', 'Saúde', 0.9, 80),
('DROGA RAIA', 'Saúde', 0.9, 70),
('PACHECO', 'Saúde', 0.85, 50),
('VIVO', 'Utilidades', 0.9, 90),
('TIM', 'Utilidades', 0.9, 80),
('CLARO', 'Utilidades', 0.9, 85),
('OI', 'Utilidades', 0.85, 60),
('GLOBO PLAY', 'Entretenimento', 0.95, 40),
('TEF', 'Transferência', 0.9, 200),
('PIX', 'Transferência', 0.9, 300),
('CAIXA ELETRONICO', 'Saque', 0.9, 250),
('BANCO DO BRASIL', 'Banco', 0.8, 100),
('ITAU', 'Banco', 0.8, 120),
('BRADESCO', 'Banco', 0.8, 110),
('SANTANDER', 'Banco', 0.8, 90),
('NUBANK', 'Banco', 0.8, 80),
('INTER', 'Banco', 0.8, 60); 
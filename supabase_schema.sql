-- Create transaction_types table
CREATE TABLE "transaction_types" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL
);

-- Seed transaction_types
INSERT INTO "transaction_types" ("name") VALUES ('Expense'), ('Income'), ('Savings');

-- Create categories table
CREATE TABLE "categories" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "typeId" INTEGER REFERENCES "transaction_types"("id"),
  "userId" UUID REFERENCES auth.users("id")
);
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow individual access to categories" ON "categories" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Allow individual insert to categories" ON "categories" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Allow individual update to categories" ON "categories" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Allow individual delete to categories" ON "categories" FOR DELETE USING (auth.uid() = "userId");


-- Create transactions table
CREATE TABLE "transactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "description" TEXT,
  "amount" NUMERIC NOT NULL,
  "category" TEXT,
  "date" DATE NOT NULL,
  "typeId" INTEGER REFERENCES "transaction_types"("id"),
  "userId" UUID REFERENCES auth.users("id"),
  "createdAt" TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow individual access to transactions" ON "transactions" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Allow individual insert to transactions" ON "transactions" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Allow individual update to transactions" ON "transactions" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Allow individual delete to transactions" ON "transactions" FOR DELETE USING (auth.uid() = "userId");


-- Create a "profiles" table to store public user data
CREATE TABLE "profiles" (
  "id" UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  "name" TEXT,
  "role" TEXT DEFAULT 'user'
);
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow individual read access to profiles" ON "profiles" FOR SELECT USING (auth.uid() = "id");
CREATE POLICY "Allow individual update access to profiles" ON "profiles" FOR UPDATE USING (auth.uid() = "id");

-- Function to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'role');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create budgets table
CREATE TABLE "budgets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES auth.users("id"),
  "categoryId" UUID REFERENCES "categories"("id"),
  "amount" NUMERIC NOT NULL,
  "month" DATE NOT NULL,
  UNIQUE("userId", "categoryId", "month")
);

ALTER TABLE "budgets" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow individual access to budgets" ON "budgets" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Allow individual insert to budgets" ON "budgets" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Allow individual update to budgets" ON "budgets" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Allow individual delete to budgets" ON "budgets" FOR DELETE USING (auth.uid() = "userId");

-- Create recurring_transactions table
CREATE TABLE "recurring_transactions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES auth.users("id"),
    "description" TEXT,
    "amount" NUMERIC NOT NULL,
    "typeId" INTEGER REFERENCES "transaction_types"("id"),
    "categoryId" UUID REFERENCES "categories"("id"),
    "frequency" TEXT NOT NULL, -- e.g., 'daily', 'weekly', 'monthly', 'yearly'
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "lastProcessedDate" DATE,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "recurring_transactions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow individual access to recurring_transactions" ON "recurring_transactions" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Allow individual insert to recurring_transactions" ON "recurring_transactions" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Allow individual update to recurring_transactions" ON "recurring_transactions" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Allow individual delete to recurring_transactions" ON "recurring_transactions" FOR DELETE USING (auth.uid() = "userId"); 
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.budgets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  userId uuid,
  categoryId uuid,
  amount numeric NOT NULL,
  month date NOT NULL,
  CONSTRAINT budgets_pkey PRIMARY KEY (id),
  CONSTRAINT budgets_categoryId_fkey FOREIGN KEY (categoryId) REFERENCES public.categories(id),
  CONSTRAINT budgets_userId_fkey FOREIGN KEY (userId) REFERENCES auth.users(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  typeId integer,
  userId uuid,
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_typeId_fkey FOREIGN KEY (typeId) REFERENCES public.transaction_types(id),
  CONSTRAINT categories_userId_fkey FOREIGN KEY (userId) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name text,
  role text DEFAULT 'user'::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.recurring_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  userId uuid,
  description text,
  amount numeric NOT NULL,
  typeId integer,
  categoryId uuid,
  frequency text NOT NULL,
  startDate date NOT NULL,
  endDate date,
  lastProcessedDate date,
  createdAt timestamp with time zone DEFAULT now(),
  CONSTRAINT recurring_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT recurring_transactions_userId_fkey FOREIGN KEY (userId) REFERENCES auth.users(id),
  CONSTRAINT recurring_transactions_typeId_fkey FOREIGN KEY (typeId) REFERENCES public.transaction_types(id),
  CONSTRAINT recurring_transactions_categoryId_fkey FOREIGN KEY (categoryId) REFERENCES public.categories(id)
);
CREATE TABLE public.transaction_types (
  id integer NOT NULL DEFAULT nextval('transaction_types_id_seq'::regclass),
  name text NOT NULL,
  CONSTRAINT transaction_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  description text,
  amount numeric NOT NULL,
  category text,
  date date NOT NULL,
  typeId integer,
  userId uuid,
  createdAt timestamp with time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_typeId_fkey FOREIGN KEY (typeId) REFERENCES public.transaction_types(id),
  CONSTRAINT transactions_userId_fkey FOREIGN KEY (userId) REFERENCES auth.users(id)
); 
const express = require('express')
const app = express()
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const Papa = require('papaparse');

// Load environment variables
require('dotenv').config();

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
// Use the ANONYMOUS key for all normal user operations
const supabaseKey = process.env.SUPABASE_ANON_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.status(200).send('Monity API is running.');
});
console.log('Route registered: GET /');

const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    req.user.role = user.user_metadata.role; // Attach role to user object
    
    // Create a new Supabase client based on user's role
    let supabaseClient;
    if (user.user_metadata.role === 'admin') {
        supabaseClient = createClient(supabaseUrl, process.env.SUPABASE_KEY);
    } else {
        supabaseClient = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        });
    }
    
    req.supabase = supabaseClient; // Attach user-specific Supabase client to the request
    
    next();
};

// Signup route
app.post('/signup', async (req, res) => {
    const { email, password, name } = req.body; // Add name
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: 'user', // Default role
                name: name    // Add user's name
            }
        }
    });

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    // After successful signup, create default investment categories for the new user
    if (data.user) {
        const userId = data.user.id;
        const defaultCategories = [
            { name: 'Make Investments', typeId: 3, userId: userId },
            { name: 'Withdraw Investments', typeId: 3, userId: userId }
        ];

        const { error: insertError } = await supabase
            .from('categories')
            .insert(defaultCategories);

        if (insertError) {
            // Log the error, but don't block the signup process
            console.error('Failed to create default categories for user:', userId, insertError.message);
        }
    }

    res.status(201).json({ user: data.user, session: data.session });
});
console.log('Route registered: POST /signup');

// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.json({ user: data.user, session: data.session });
});
console.log('Route registered: POST /login');


// Get categories
app.get('/categories', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data: categories, error } = await req.supabase
            .from('categories')
            .select('*')
            .eq('userId', userId);
        
        if (error) {
            console.error('Get categories error:', error.message);
            return res.status(500).json({ error: 'Failed to fetch categories' });
        }
        res.json(categories || []);
    } catch (error) {
        console.error('Get categories error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});
console.log('Route registered: GET /categories');

// Add a new category
app.post('/categories', authMiddleware, async (req, res) => {
    try {
        const { name, typeId } = req.body; // typeId refers to transactionTypes.id
        if (!name || !typeId) {
            return res.status(400).json({ message: 'Category name and type are required' });
        }
        
        const userId = req.user.id; 
        
        const newCategory = {
            name,
            typeId,
            userId: userId 
        };
        
        const { data: createdCategories, error } = await req.supabase.from('categories').insert([newCategory]).select();
        
        if (error) {
            console.error('Add category error:', error.message);
            return res.status(500).json({ error: 'Failed to create category' });
        }
        
        if (!createdCategories || createdCategories.length === 0) {
            return res.status(500).json({ error: "Category creation failed in Supabase" });
        }
        res.status(201).json(createdCategories[0]);
    } catch (error) {
        console.error('Add category error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to create category' });
    }
});
console.log('Route registered: POST /categories');

// Delete a category
app.delete('/categories/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const categoryId = req.params.id;

        const { data, error } = await req.supabase
            .from('categories')
            .delete()
            .eq('id', categoryId)
            .eq('userId', userId)
            .select();

        if (error) {
            console.error('Delete category error:', error.message);
            return res.status(500).json({ error: 'Failed to delete category' });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Category not found or you do not have permission to delete it.' });
        }

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});
console.log('Route registered: DELETE /categories/:id');

// Get budgets for the logged-in user
app.get('/budgets', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data, error } = await req.supabase
            .from('budgets')
            .select(`
                *,
                categories (
                    name
                )
            `)
            .eq('userId', userId);

        if (error) {
            console.error('Get budgets error:', error.message);
            return res.status(500).json({ error: 'Failed to fetch budgets' });
        }
        res.json(data || []);
    } catch (error) {
        console.error('Get budgets error:', error.message);
        res.status(500).json({ error: 'Failed to fetch budgets' });
    }
});
console.log('Route registered: GET /budgets');

// Add or update a budget
app.post('/budgets', authMiddleware, async (req, res) => {
    try {
        const { categoryId, amount, month } = req.body;
        const userId = req.user.id;

        if (!categoryId || !amount || !month) {
            return res.status(400).json({ message: 'Category, amount, and month are required' });
        }
        
        // Use upsert to either insert a new budget or update an existing one
        const { data, error } = await req.supabase
            .from('budgets')
            .upsert({
                userId,
                categoryId,
                amount,
                month,
            }, {
                onConflict: 'userId,categoryId,month'
            })
            .select();

        if (error) {
            console.error('Upsert budget error:', error.message);
            return res.status(500).json({ error: 'Failed to save budget' });
        }
        
        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Upsert budget error:', error.message);
        res.status(500).json({ error: 'Failed to save budget' });
    }
});
console.log('Route registered: POST /budgets');


// Delete a budget
app.delete('/budgets/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { error } = await req.supabase
            .from('budgets')
            .delete()
            .eq('id', id)
            .eq('userId', userId);

        if (error) {
            console.error('Delete budget error:', error.message);
            return res.status(500).json({ error: 'Failed to delete budget' });
        }
        
        res.json({ message: 'Budget deleted successfully' });
    } catch (error) {
        console.error('Delete budget error:', error.message);
        res.status(500).json({ error: 'Failed to delete budget' });
    }
});
console.log('Route registered: DELETE /budgets/:id');


// --- Recurring Transactions Endpoints ---

// Get all recurring transactions for the logged-in user
app.get('/recurring-transactions', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data, error } = await req.supabase
            .from('recurring_transactions')
            .select(`
                *,
                categories (name),
                transaction_types (name)
            `)
            .eq('userId', userId);
        
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Get recurring transactions error:', error.message);
        res.status(500).json({ error: 'Failed to fetch recurring transactions' });
    }
});
console.log('Route registered: GET /recurring-transactions');

// Add a new recurring transaction
app.post('/recurring-transactions', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { description, amount, typeId, categoryId, frequency, startDate, endDate } = req.body;

        if (!description || !amount || !typeId || !categoryId || !frequency || !startDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const { data, error } = await req.supabase
            .from('recurring_transactions')
            .insert([{ userId, description, amount, typeId, categoryId, frequency, startDate, endDate }])
            .select();
        
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Add recurring transaction error:', error.message);
        res.status(500).json({ error: 'Failed to add recurring transaction' });
    }
});
console.log('Route registered: POST /recurring-transactions');

// Update a recurring transaction
app.put('/recurring-transactions/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { description, amount, typeId, categoryId, frequency, startDate, endDate } = req.body;

        const { data, error } = await req.supabase
            .from('recurring_transactions')
            .update({ description, amount, typeId, categoryId, frequency, startDate, endDate })
            .eq('id', id)
            .eq('userId', userId)
            .select();
        
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Update recurring transaction error:', error.message);
        res.status(500).json({ error: 'Failed to update recurring transaction' });
    }
});
console.log('Route registered: PUT /recurring-transactions/:id');

// Delete a recurring transaction
app.delete('/recurring-transactions/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await req.supabase
            .from('recurring_transactions')
            .delete()
            .eq('id', id)
            .eq('userId', userId);
            
        if (error) throw error;
        res.json({ message: 'Recurring transaction deleted' });
    } catch (error) {
        console.error('Delete recurring transaction error:', error.message);
        res.status(500).json({ error: 'Failed to delete recurring transaction' });
    }
});
console.log('Route registered: DELETE /recurring-transactions/:id');

// Process recurring transactions
app.post('/recurring-transactions/process', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data: recurring, error: fetchError } = await req.supabase
            .from('recurring_transactions')
            .select('*')
            .eq('userId', userId);

        if (fetchError) throw fetchError;

        const newTransactions = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const r of recurring) {
            let lastProcessed = r.lastProcessedDate ? new Date(r.lastProcessedDate) : new Date(r.startDate);
            let nextDueDate = new Date(lastProcessed);

            while (true) {
                if (r.frequency === 'daily') {
                    nextDueDate.setDate(nextDueDate.getDate() + 1);
                } else if (r.frequency === 'weekly') {
                    nextDueDate.setDate(nextDueDate.getDate() + 7);
                } else if (r.frequency === 'monthly') {
                    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                } else if (r.frequency === 'yearly') {
                    nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
                } else {
                    break; // Invalid frequency
                }

                if (nextDueDate > today) {
                    break; // Future transaction, stop processing
                }
                
                if (r.endDate && nextDueDate > new Date(r.endDate)) {
                    break; // Past the end date
                }
                
                newTransactions.push({
                    description: r.description,
                    amount: r.amount,
                    category: r.categoryId,
                    date: nextDueDate.toISOString().split('T')[0],
                    typeId: r.typeId,
                    userId: r.userId,
                });
                
                r.lastProcessedDate = nextDueDate.toISOString().split('T')[0];
            }
        }
        
        if (newTransactions.length > 0) {
            const { error: insertError } = await req.supabase.from('transactions').insert(newTransactions);
            if (insertError) throw insertError;

            for (const r of recurring) {
                if(r.lastProcessedDate) {
                    await req.supabase.from('recurring_transactions').update({ lastProcessedDate: r.lastProcessedDate }).eq('id', r.id);
                }
            }
        }

        res.json({ message: `Processed ${newTransactions.length} new transactions.` });
    } catch (error) {
        console.error('Process recurring transactions error:', error.message);
        res.status(500).json({ error: 'Failed to process recurring transactions' });
    }
});
console.log('Route registered: POST /recurring-transactions/process');


// Get months
app.get('/months', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await req.supabase
            .from('transactions')
            .select('date')
            .eq('userId', userId);

        if (error) {
            console.error('Error fetching months:', error.message);
            return res.status(500).json({ error: 'Failed to fetch transaction months' });
        }

        const months = new Set();
        data.forEach(transaction => {
            const date = new Date(transaction.date);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            months.add(`${year}/${month}`);
        });

        res.json(Array.from(months));
    } catch (error) {
        console.error('Error in /months endpoint:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});
console.log('Route registered: GET /months');

app.get('/balance/:year/:month', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { year, month } = req.params;

        // Calculate start and end dates for the given month
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const nextMonth = parseInt(month, 10) === 12 ? 1 : parseInt(month, 10) + 1;
        const nextYear = parseInt(month, 10) === 12 ? parseInt(year, 10) + 1 : parseInt(year, 10);
        const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

        const { data, error } = await req.supabase
            .from('transactions')
            .select('amount, typeId')
            .eq('userId', userId)
            .gte('date', startDate)
            .lt('date', endDate);

        if (error) {
            console.error('Error fetching balance:', error.message);
            return res.status(500).json({ error: 'Failed to fetch balance' });
        }

        const balance = data.reduce((acc, transaction) => {
            if (transaction.typeId === 2) { // Income
                return acc + transaction.amount;
            } else { // Expense
                return acc - transaction.amount;
            }
        }, 0);

        res.json({ balance });
    } catch (error) {
        console.error('Error in /balance endpoint:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get transaction types
app.get('/transaction-types', authMiddleware, async (req, res) => {
    try {
        const { data: transactionTypes } = await req.supabase.from('transaction_types').select('*');
        res.json(transactionTypes || []);
    } catch (error) {
        console.error('Get transaction types error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch transaction types' });
    }
});
console.log('Route registered: GET /transaction-types');

app.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data, error } = await req.supabase
            .from('transactions')
            .select('*')
            .eq('userId', userId);
        if (error) {
            console.error('Get transactions error:', error.message);
            return res.status(500).json({ error: 'Failed to fetch transactions' });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Add expense, income, or savings (generic transaction adder)
const addTransaction = async (req, res, typeId, successMessage, body) => {
    try {
        const { description, amount, category, date } = body || req.body;
        const userId = req.user.id;
        
        if (!description || !amount || !category || !date) {
            return res.status(400).json({ message: 'Description, amount, category, and date are required' });
        }
        
        const newTransaction = {
            userId,
            description,
            amount: parseFloat(amount),
            category,
            date: date, 
            typeId,
            createdAt: new Date().toISOString()
        };
        
        const { data: createdTransactions, error } = await req.supabase.from('transactions').insert([newTransaction]).select();
        
        if (error) {
            console.error(`Add transaction (type ${typeId}) error:`, error.message);
            return res.status(500).json({ success: false, message: `Failed to add ${successMessage.toLowerCase().split(' ')[0]}.` });
        }

        if (!createdTransactions || createdTransactions.length === 0) {
             return res.status(500).json({ success: false, message: `${successMessage.replace(" added!", "")} creation failed in Supabase` });
        }
        res.status(201).json({ success: true, message: successMessage, transaction: createdTransactions[0] });
    } catch (error) {
        console.error(`Add transaction (type ${typeId}) error:`, error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: `Failed to add ${successMessage.toLowerCase().split(' ')[0]}.` });
    }
};

app.post('/add-expense', authMiddleware, (req, res) => addTransaction(req, res, 1, "Expense added!"));
console.log('Route registered: POST /add-expense');
app.post('/add-income', authMiddleware, async (req, res) => {
    // Assuming typeId for 'income' is 2
    const { category, amount, date } = req.body;
    const description = `Income - ${category}`; // Construct description
    await addTransaction(req, res, 2, 'Income added', { description, category, amount, date });
});
console.log('Route registered: POST /add-income');
app.post('/add-savings', authMiddleware, (req, res) => addTransaction(req, res, "3", "Savings transaction added!"));
console.log('Route registered: POST /add-savings');

// Get transactions
app.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data: transactions } = await req.supabase.from('transactions').select('*').eq('userId', userId).order('date', { ascending: false }).order('createdAt', { ascending: false });
        res.json(transactions || []);
    } catch (error) {
        console.error('Get transactions error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});
console.log('Route registered: GET /transactions');

// Get all transactions (admin only)
app.get('/transactions/all', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admins only' });
    }

    try {
        // The authMiddleware already provides an admin-level Supabase client for admin users.
        const { data: transactions } = await req.supabase.from('transactions').select('*').order('date', { ascending: false });
        res.json(transactions || []);
    } catch (error) {
        console.error('Get all transactions error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch all transactions' });
    }
});
console.log('Route registered: GET /transactions/all');

// Get transactions for a specific month
app.get('/transactions/month/:month/:year', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        let { month, year } = req.params;

        if (isNaN(month) || isNaN(year)) {
            return res.status(400).json({ error: 'Invalid month or year format.' });
        }

        month = parseInt(month, 10);
        year = parseInt(year, 10);

        if (month < 1 || month > 12) {
            return res.status(400).json({ error: 'Invalid month. Must be between 1 and 12.' });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const { data, error } = await req.supabase
            .from('transactions')
            .select('*')
            .eq('userId', userId)
            .gte('date', startDate.toISOString())
            .lte('date', endDate.toISOString());

        if (error) {
            console.error('Error fetching monthly transactions:', error.message);
            return res.status(500).json({ error: 'Failed to fetch transactions.' });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Error in /transactions/month/:month/:year:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
});
console.log('Route registered: GET /transactions/month/:month/:year');


// Balance for all time
app.get('/balance/all', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch all transactions for the user
        const { data: transactions, error } = await req.supabase
            .from('transactions')
            .select('amount, typeId, category')
            .eq('userId', userId);

        if (error) {
            console.error('Error fetching all transactions for balance:', error.message);
            return res.status(500).json({ error: 'Failed to fetch transactions for balance calculation.' });
        }

        // Calculate balance
        const balance = transactions.reduce((acc, transaction) => {
            if (transaction.typeId === 1) { // Expense
                return acc - transaction.amount;
            } else if (transaction.typeId === 2) { // Income
                return acc + transaction.amount;
            } else if (transaction.typeId === 3) { // Savings
                // "Make Investments" is a debit, "Withdraw Investments" is a credit
                if (transaction.category === "Make Investments") {
                    return acc - transaction.amount;
                } else if (transaction.category === "Withdraw Investments") {
                    return acc + transaction.amount;
                }
            }
            return acc;
        }, 0);

        res.json({ balance });
    } catch (error) {
        console.error('Error in /balance/all endpoint:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});
console.log('Route registered: GET /balance/all');


// Get user count (admin-only)
app.get('/users/count', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admins only' });
    }

    try {
        const { count, error } = await req.supabase.from('profiles').select('*', { count: 'exact', head: true });

        if (error) {
            throw error;
        }

        res.json({ count });
    } catch (error) {
        console.error('Get user count error:', error.message);
        res.status(500).json({ error: 'Failed to fetch user count' });
    }
});
console.log('Route registered: GET /users/count');


// Get transactions by month (e.g., /transactions/month/07/2024)
app.get('/transactions/month/:month/:year', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { month, year } = req.params;

        if (!month || !year || month.length !== 2 || year.length !== 4) {
            return res.status(400).json({ error: 'Invalid date format. Use MM and YYYY' });
        }
        
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const tempDate = new Date(parseInt(year), parseInt(month), 0);
        const endDate = `${year}-${month.padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;

        const { data: transactions } = await req.supabase.from('transactions').select('*').eq('userId', userId).gte('date', startDate).lte('date', endDate).order('date', { ascending: true });
        res.json(transactions || []);
    } catch (error) {
        console.error('Get transactions by month error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch transactions for the month' });
    }
});
console.log('Route registered: GET /transactions/month/:month/:year');

// Get transactions by category
app.get('/transactions/category/:category', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const category = req.params.category;
        const { data: transactions } = await req.supabase.from('transactions').select('*').eq('userId', userId).eq('category', category).order('date', { ascending: false });
        res.json(transactions || []);
    } catch (error) {
        console.error('Get transactions by category error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch transactions for the category' });
    }
});
console.log('Route registered: GET /transactions/category/:category');

// Delete a transaction
app.delete('/transactions/:id', authMiddleware, async (req, res) => {
    try {
        const transactionId = req.params.id;
        const userId = req.user.id;
        
        await req.supabase.from('transactions').delete().eq('id', transactionId).eq('userId', userId);
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Delete transaction error:', error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 404) {
             return res.status(404).json({ message: 'Transaction not found or not authorized to delete' });
        }
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});
console.log('Route registered: DELETE /transactions/:id');

// Balance for a specific month
app.get('/balance/:month/:year', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        let { month, year } = req.params;

        // Basic validation to ensure month and year are numbers
        if (isNaN(month) || isNaN(year)) {
            return res.status(400).json({ error: 'Invalid month or year format.' });
        }

        month = parseInt(month, 10);
        year = parseInt(year, 10);
        
        // Swap if year is smaller (likely month)
        if (year < month) {
            [month, year] = [year, month];
        }

        if (month < 1 || month > 12) {
            return res.status(400).json({ error: 'Invalid month. Must be between 1 and 12.' });
        }
        
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const { data: userTransactions } = await req.supabase.from('transactions').select('amount,typeId,category').eq('userId', userId).gte('date', startDate).lte('date', endDate);

        if (!userTransactions) {
             return res.json({ month: `${month}/${year}`, totalExpenses: 0, totalIncome: 0, totalSavings: 0, balance: 0 });
        }
        
        let totalExpenses = 0;
        let totalIncome = 0;
        let totalSavings = 0;
        
        userTransactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount);
            if (transaction.typeId === "1") totalExpenses += amount;
            else if (transaction.typeId === "2") totalIncome += amount;
            else if (transaction.typeId === "3") {
                if (transaction.category === "Make Investments") totalSavings -= amount;
                else if (transaction.category === "Withdraw Investments") totalSavings += amount;
            }
        });
        
        const balance = totalIncome - totalExpenses + totalSavings;
        res.json({ month: `${month}/${year}`, totalExpenses, totalIncome, totalSavings, balance });
    } catch (error) {
        console.error('Get balance error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to calculate balance' });
    }
});
console.log('Route registered: GET /balance/:month/:year');

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = server;

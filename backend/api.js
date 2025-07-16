const express = require('express')
const app = express()
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

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
        // TODO: Add user-specific logic if categories are tied to users.
        const { data: categories } = await req.supabase.from('categories').select('*');
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
        // TODO: Add user-specific logic for deletion if categories are tied to users.
        await req.supabase.from('categories').delete().eq('id', req.params.id);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});
console.log('Route registered: DELETE /categories/:id');

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
            .select('amount, typeId')
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

// Import initial data from .txt files if Supabase is empty for the default user
const importExistingData = async () => {
    try {
        console.log('Checking if data needs to be imported to Supabase...');
        
        // Get the first user (assuming it's the default/admin user for legacy data)
        // This needs a reliable way to identify the "default" user in Supabase.
        // For now, let's assume we fetch the first user by creation date or a specific email.
        // This part is tricky without a defined "default" user ID for legacy data.
        // Let's assume process.env.DEFAULT_USER_ID_FOR_IMPORT exists or use first created user.
        
        let defaultUserId = process.env.DEFAULT_USER_ID_FOR_IMPORT;
        if (!defaultUserId) {
            const { data: users } = await supabase.from('users').select('id').order('created_at', { ascending: true }).limit(1);
            if (users && users.length > 0) {
                defaultUserId = users[0].id;
            } else {
                console.log('No users in Supabase to assign legacy data to. Skipping import.');
                return;
            }
        }
        
        const { data: existingTransactions } = await supabase.from('transactions').select('id').eq('userId', defaultUserId).limit(1);

        if (existingTransactions && existingTransactions.length > 0) {
            console.log('Transactions already exist in Supabase for the default user, skipping import.');
            return;
        }
        
        console.log(`Importing legacy data from .txt files for user ID: ${defaultUserId}...`);
        const transactionsToImport = [];

        const expensesFilePath = process.env.EXPENSES_FILE_PATH || path.join(__dirname, 'expenses.txt');
        const incomesFilePath = process.env.INCOMES_FILE_PATH || path.join(__dirname, 'incomes.txt');

        if (fs.existsSync(expensesFilePath)) {
            const expensesData = fs.readFileSync(expensesFilePath, 'utf8');
            expensesData.split('\n').filter(line => line.trim()).forEach(line => {
                const parts = line.split(',');
                if (parts.length >= 4) {
                    const [description, amount, category, dateStr] = parts.map(p => p.trim());
                    const [d, m, yShort] = dateStr.split('/');
                    const formattedDate = `20${yShort}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                    transactionsToImport.push({
                        id: uuidv4(), userId: defaultUserId, description, 
                        amount: parseFloat(amount), category, date: formattedDate,
                        typeId: "1", createdAt: new Date().toISOString()
                    });
                }
            });
        }
        
        if (fs.existsSync(incomesFilePath)) {
            const incomesData = fs.readFileSync(incomesFilePath, 'utf8');
            incomesData.split('\n').filter(line => line.trim()).forEach(line => {
                const parts = line.split(',');
                if (parts.length >= 3) {
                    const [category, amount, dateStr] = parts.map(p => p.trim());
                    const [d, m, yShort] = dateStr.split('/');
                    const formattedDate = `20${yShort}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                    let typeId = "2"; // Default Income
                    if (category === "Make Investments" || category === "Withdraw Investments") typeId = "3"; // Savings
                    transactionsToImport.push({
                        id: uuidv4(), userId: defaultUserId, description: category, // Income used category as desc
                        amount: parseFloat(amount), category, date: formattedDate,
                        typeId, createdAt: new Date().toISOString()
                    });
                }
            });
        }

        if (transactionsToImport.length > 0) {
            // Supabase REST API can accept an array of objects to insert multiple rows
            const { data, error } = await supabase.from('transactions').insert(transactionsToImport);
            if (error) {
                console.error('Error bulk inserting legacy data to Supabase:', error.response ? error.response.data : error);
            } else {
                console.log(`✅ Successfully imported ${data ? data.length : 0} legacy transactions to Supabase.`);
            }
        } else {
            console.log('No legacy data found in .txt files to import.');
        }
        
    } catch (error) {
        console.error('Error during Supabase legacy data import process:', error.response ? error.response.data : error.message);
    }
};

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = server;

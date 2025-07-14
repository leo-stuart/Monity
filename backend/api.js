const express = require('express')
const app = express()
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.status(200).send('Monity API is running.');
});

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
    next();
};

// Signup route
app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ user: data.user, session: data.session });
});

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


// Get categories
app.get('/categories', authMiddleware, async (req, res) => {
    try {
        // TODO: Add user-specific logic if categories are tied to users.
        const { data: categories } = await supabase.from('categories').select('*');
        res.json(categories || []);
    } catch (error) {
        console.error('Get categories error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Add a new category
app.post('/categories', authMiddleware, async (req, res) => {
    try {
        const { name, typeId } = req.body; // typeId refers to transactionTypes.id
        if (!name || !typeId) {
            return res.status(400).json({ message: 'Category name and type are required' });
        }
        
        const userId = req.user.id; 
        
        const newCategory = {
            id: uuidv4(),
            name,
            typeId,
            userId: userId 
        };
        
        const { data: createdCategories } = await supabase.from('categories').insert([newCategory]).select();
        if (!createdCategories || createdCategories.length === 0) {
            throw new Error("Category creation failed in Supabase");
        }
        res.status(201).json(createdCategories[0]);
    } catch (error) {
        console.error('Add category error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// Delete a category
app.delete('/categories/:id', authMiddleware, async (req, res) => {
    try {
        // TODO: Add user-specific logic for deletion if categories are tied to users.
        await supabase.from('categories').delete().eq('id', req.params.id);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// Get transaction types
app.get('/transaction-types', authMiddleware, async (req, res) => {
    try {
        const { data: transactionTypes } = await supabase.from('transaction_types').select('*');
        res.json(transactionTypes || []);
    } catch (error) {
        console.error('Get transaction types error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch transaction types' });
    }
});

// Add expense, income, or savings (generic transaction adder)
const addTransaction = async (req, res, typeId, successMessage) => {
    try {
        const { description, amount, category, date } = req.body;
        const userId = req.user.id;
        
        if (!description || !amount || !category || !date) {
            return res.status(400).json({ message: 'Description, amount, category, and date are required' });
        }

        const [day, month, yearShort] = date.split('/');
        const formattedDate = `20${yearShort}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        const newTransaction = {
            id: uuidv4(),
            userId,
            description,
            amount: parseFloat(amount),
            category,
            date: formattedDate, 
            typeId,
            createdAt: new Date().toISOString()
        };
        
        const { data: createdTransactions } = await supabase.from('transactions').insert([newTransaction]).select();
        if (!createdTransactions || createdTransactions.length === 0) {
             throw new Error(`${successMessage.replace(" added!", "")} creation failed in Supabase`);
        }
        res.status(201).json({ success: true, message: successMessage, transaction: createdTransactions[0] });
    } catch (error) {
        console.error(`Add transaction (type ${typeId}) error:`, error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: `Failed to add ${successMessage.toLowerCase().split(' ')[0]}.` });
    }
};

app.post('/add-expense', authMiddleware, (req, res) => addTransaction(req, res, "1", "Expense added!"));
app.post('/add-income', authMiddleware, (req, res) => {
    if (!req.body.description && req.body.category) req.body.description = req.body.category;
    addTransaction(req, res, "2", "Income added!");
});
app.post('/add-savings', authMiddleware, (req, res) => addTransaction(req, res, "3", "Savings transaction added!"));

// Get transactions
app.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data: transactions } = await supabase.from('transactions').select('*').eq('userId', userId).order('date', { ascending: false }).order('createdAt', { ascending: false });
        res.json(transactions || []);
    } catch (error) {
        console.error('Get transactions error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Get transactions by month (e.g., /transactions/month/05/2025)
app.get('/transactions/month/:monthStr', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [month, yearShort] = req.params.monthStr.split('/');
        const year = `20${yearShort}`;

        if (!month || !year || month.length !== 2 || year.length !== 4) {
            return res.status(400).json({ error: 'Invalid month format. Use MM/YY' });
        }
        
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const tempDate = new Date(parseInt(year), parseInt(month), 0);
        const endDate = `${year}-${month.padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;

        const { data: transactions } = await supabase.from('transactions').select('*').eq('userId', userId).gte('date', startDate).lte('date', endDate).order('date', { ascending: true });
        res.json(transactions || []);
    } catch (error) {
        console.error('Get transactions by month error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch transactions for the month' });
    }
});

// Get transactions by category
app.get('/transactions/category/:category', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const category = req.params.category;
        const { data: transactions } = await supabase.from('transactions').select('*').eq('userId', userId).eq('category', category).order('date', { ascending: false });
        res.json(transactions || []);
    } catch (error) {
        console.error('Get transactions by category error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch transactions for the category' });
    }
});

// Delete a transaction
app.delete('/transactions/:id', authMiddleware, async (req, res) => {
    try {
        const transactionId = req.params.id;
        const userId = req.user.id;
        
        await supabase.from('transactions').delete().eq('id', transactionId).eq('userId', userId);
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Delete transaction error:', error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 404) {
             return res.status(404).json({ message: 'Transaction not found or not authorized to delete' });
        }
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

// Calculate monthly balance (e.g. /balance/month/05/2025)
app.get('/balance/:monthStr', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [month, yearShort] = req.params.monthStr.split('/');
        const year = `20${yearShort}`;

        if (!month || !year || month.length !== 2 || year.length !== 4) {
            return res.status(400).json({ error: 'Invalid month format. Use MM/YY' });
        }
        
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const tempDate = new Date(parseInt(year), parseInt(month), 0);
        const endDate = `${year}-${month.padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;

        const { data: userTransactions } = await supabase.from('transactions').select('amount,typeId,category').eq('userId', userId).gte('date', startDate).lte('date', endDate);

        if (!userTransactions) {
             return res.json({ month: req.params.monthStr, totalExpenses: 0, totalIncome: 0, totalSavings: 0, balance: 0 });
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
        res.json({ month: req.params.monthStr, totalExpenses, totalIncome, totalSavings, balance });
    } catch (error) {
        console.error('Get balance error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to calculate balance' });
    }
});

// Get all unique months with transactions
app.get('/months', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data: userTransactions } = await supabase.from('transactions').select('date').eq('userId', userId).order('date', { ascending: true });
        
        if (!userTransactions) {
            return res.json([]);
        }
        
        const months = new Set();
        userTransactions.forEach(transaction => {
            const parts = transaction.date.split('-');
            if (parts.length >= 3) {
                const monthYear = `${parts[1]}/${parts[0].substring(2)}`;
                months.add(monthYear);
            }
        });
        
        res.json(Array.from(months).sort((a, b) => {
            const [m1, y1] = a.split('/');
            const [m2, y2] = b.split('/');
            if (y1 !== y2) return y1.localeCompare(y2);
            return m1.localeCompare(m2);
        }));
    } catch (error) {
        console.error('Get months error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch months' });
    }
});

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

const port = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
        // importExistingData();
    });
}

module.exports = { app };

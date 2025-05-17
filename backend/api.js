const express = require('express')
const app = express()
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Load environment variables (ensure .env is at the root or backend/ and dotenv is configured)
// require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // If .env is at project root
require('dotenv').config(); // If .env is in backend/ or handled by execution environment

app.use(cors())
app.use(express.json())

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-fallback';

// Supabase Configuration
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// URLs for Supabase tables (as provided by user)
const SUPABASE_URL_USUARIOS = 'https://uastoompfymjolifijjj.supabase.com/v1/rest/usuarios';
const SUPABASE_URL_CATEGORIES = 'https://uastoompfymjolifijjj.supabase.com/v1/rest/categories';
const SUPABASE_URL_TRANSACTIONS = 'https://uastoompfymjolifijjj.supabase.com/v1/rest/transactions';
const SUPABASE_URL_TRANSACTIONSTYPES = 'https://uastoompfymjolifijjj.supabase.com/v1/rest/transactionsType';

// Axios instance for Supabase requests
const supabaseAPI = axios.create();

supabaseAPI.interceptors.request.use(config => {
    config.headers = {
        ...config.headers,
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation', // Get created/updated data back
    };
    return config;
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user; // user should contain { id, email }
        next();
    });
};

// Login route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Get user from Supabase
        const { data: users } = await supabaseAPI.get(`${SUPABASE_URL_USUARIOS}?email=eq.${email}&select=*`);
        
        if (!users || users.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const user = users[0];

        // Compare passwords
        // Assuming 'senha' stores the hashed password in Supabase
        const passwordMatch = await bcrypt.compare(password, user.senha);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        const { senha, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, token });

    } catch (error) {
        console.error('Login error:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Signup route
app.post('/signup', async (req, res) => {
    try {
        const { nome, email, password } = req.body;
        if (!nome || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        // Check if user already exists
        const { data: existingUsers } = await supabaseAPI.get(`${SUPABASE_URL_USUARIOS}?email=eq.${email}&select=id`);
        if (existingUsers && existingUsers.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserId = uuidv4(); // Assuming Supabase 'id' column for usuarios is UUID and client-settable

        const { data: createdUsers } = await supabaseAPI.post(SUPABASE_URL_USUARIOS, {
            id: newUserId,
            nome,
            email,
            senha: hashedPassword
            // Add other fields like createdAt if your Supabase table has them
        });
        
        if (!createdUsers || createdUsers.length === 0) {
            throw new Error("User creation failed in Supabase");
        }
        const newUser = createdUsers[0];

        const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });
        const { senha, ...userWithoutPassword } = newUser;
        res.status(201).json({ user: userWithoutPassword, token });

    } catch (error) {
        console.error('Signup error:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

// Change password route
app.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        const { data: users } = await supabaseAPI.get(`${SUPABASE_URL_USUARIOS}?id=eq.${userId}&select=*`);
        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = users[0];

        const passwordMatch = await bcrypt.compare(currentPassword, user.senha);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await supabaseAPI.patch(`${SUPABASE_URL_USUARIOS}?id=eq.${userId}`, { senha: hashedPassword });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Server error while changing password' });
    }
});

// Get categories
app.get('/categories', authenticateToken, async (req, res) => {
    try {
        // Assuming categories are global or user-specific based on RLS in Supabase
        // If user-specific and no RLS, add ?userId=eq.${req.user.id}
        const { data: categories } = await supabaseAPI.get(`${SUPABASE_URL_CATEGORIES}?select=*`);
        res.json(categories || []);
    } catch (error) {
        console.error('Get categories error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Add a new category
app.post('/categories', authenticateToken, async (req, res) => {
    try {
        const { name, typeId } = req.body; // typeId refers to transactionTypes.id
        if (!name || !typeId) {
            return res.status(400).json({ message: 'Category name and type are required' });
        }
        
        const newCategory = {
            id: uuidv4(), // Assuming Supabase 'id' for categories is client-settable UUID
            name,
            typeId
            // userId: req.user.id // Add this if categories are user-specific
        };
        
        const { data: createdCategories } = await supabaseAPI.post(SUPABASE_URL_CATEGORIES, newCategory);
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
app.delete('/categories/:id', authenticateToken, async (req, res) => {
    try {
        // Add &userId=eq.${req.user.id} if categories are user-specific and RLS isn't handling it
        await supabaseAPI.delete(`${SUPABASE_URL_CATEGORIES}?id=eq.${req.params.id}`);
        res.json({ message: 'Category deleted successfully' }); // Supabase delete returns 204 No Content or data if Prefer was set
    } catch (error) {
        console.error('Delete category error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// Get transaction types
app.get('/transaction-types', authenticateToken, async (req, res) => {
    try {
        const { data: transactionTypes } = await supabaseAPI.get(`${SUPABASE_URL_TRANSACTIONSTYPES}?select=*`);
        res.json(transactionTypes || []);
    } catch (error) {
        console.error('Get transaction types error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch transaction types' });
    }
});

// Add expense, income, or savings (generic transaction adder)
const addTransaction = async (req, res, typeId, successMessage) => {
    try {
        const { description, amount, category, date } = req.body; // date is "DD/MM/YY" from client
        const userId = req.user.id;
        
        if (!description || !amount || !category || !date) {
            return res.status(400).json({ message: 'Description, amount, category, and date are required' });
        }

        // Convert date from "DD/MM/YY" to "YYYY-MM-DD" for Supabase
        const [day, month, yearShort] = date.split('/');
        const formattedDate = `20${yearShort}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        const newTransaction = {
            id: uuidv4(), // Assuming Supabase 'id' for transactions is client-settable UUID
            userId,
            description,
            amount: parseFloat(amount),
            category, // This might be category name. If Supabase expects category_id, adjust accordingly.
            date: formattedDate, 
            typeId, // "1" for Expense, "2" for Income, "3" for Savings
            createdAt: new Date().toISOString() // Supabase might auto-set this if column type is timestamptz with default now()
        };
        
        const { data: createdTransactions } = await supabaseAPI.post(SUPABASE_URL_TRANSACTIONS, newTransaction);
        if (!createdTransactions || createdTransactions.length === 0) {
             throw new Error(`${successMessage.replace(" added!", "")} creation failed in Supabase`);
        }
        res.status(201).json({ success: true, message: successMessage, transaction: createdTransactions[0] });
    } catch (error) {
        console.error(`Add transaction (type ${typeId}) error:`, error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: `Failed to add ${successMessage.toLowerCase().split(' ')[0]}.` });
    }
};

app.post('/add-expense', authenticateToken, (req, res) => addTransaction(req, res, "1", "Expense added!"));
app.post('/add-income', authenticateToken, (req, res) => {
    // Income uses category as description in the old system if description not provided explicitly
    if (!req.body.description && req.body.category) req.body.description = req.body.category;
    addTransaction(req, res, "2", "Income added!");
});
app.post('/add-savings', authenticateToken, (req, res) => addTransaction(req, res, "3", "Savings transaction added!"));

// Get transactions
app.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // Order by date or createdAt, Supabase format: `order=column.asc` or `order=column.desc`
        const { data: transactions } = await supabaseAPI.get(`${SUPABASE_URL_TRANSACTIONS}?userId=eq.${userId}&select=*&order=date.desc,createdAt.desc`);
        res.json(transactions || []);
    } catch (error) {
        console.error('Get transactions error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Get transactions by month (e.g., /transactions/month/05/2025)
app.get('/transactions/month/:monthStr', authenticateToken, async (req, res) => {
    // :monthStr is MM/YY from client, like "05/25"
    try {
        const userId = req.user.id;
        const [month, yearShort] = req.params.monthStr.split('/');
        const year = `20${yearShort}`;

        if (!month || !year || month.length !== 2 || year.length !== 4) {
            return res.status(400).json({ error: 'Invalid month format. Use MM/YY' });
        }
        
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const tempDate = new Date(parseInt(year), parseInt(month), 0); // Last day of target month
        const endDate = `${year}-${month.padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;

        const { data: transactions } = await supabaseAPI.get(
            `${SUPABASE_URL_TRANSACTIONS}?userId=eq.${userId}&date=gte.${startDate}&date=lte.${endDate}&select=*&order=date.asc`
        );
        res.json(transactions || []);
    } catch (error) {
        console.error('Get transactions by month error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch transactions for the month' });
    }
});

// Get transactions by category
app.get('/transactions/category/:category', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const category = req.params.category; // This is category name
        // If Supabase uses category_id, frontend needs to send ID or backend needs to lookup ID first.
        const { data: transactions } = await supabaseAPI.get(
            `${SUPABASE_URL_TRANSACTIONS}?userId=eq.${userId}&category=eq.${category}&select=*&order=date.desc`
        );
        res.json(transactions || []);
    } catch (error) {
        console.error('Get transactions by category error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch transactions for the category' });
    }
});

// Delete a transaction
app.delete('/transactions/:id', authenticateToken, async (req, res) => {
    try {
        const transactionId = req.params.id;
        const userId = req.user.id;
        
        // Ensure the transaction belongs to the user by adding userId to the query filter
        await supabaseAPI.delete(`${SUPABASE_URL_TRANSACTIONS}?id=eq.${transactionId}&userId=eq.${userId}`);
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Delete transaction error:', error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 404) { // Or 406 if Prefer: resolution=merge-duplicates is not handled
             return res.status(404).json({ message: 'Transaction not found or not authorized to delete' });
        }
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

// Calculate monthly balance (e.g. /balance/month/05/2025)
app.get('/balance/:monthStr', authenticateToken, async (req, res) => {
    // :monthStr is MM/YY from client
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

        const { data: userTransactions } = await supabaseAPI.get(
            `${SUPABASE_URL_TRANSACTIONS}?userId=eq.${userId}&date=gte.${startDate}&date=lte.${endDate}&select=amount,typeId,category`
        );

        if (!userTransactions) {
             return res.json({ month: req.params.monthStr, totalExpenses: 0, totalIncome: 0, totalSavings: 0, balance: 0 });
        }
        
        let totalExpenses = 0;
        let totalIncome = 0;
        let totalSavings = 0; // Note: savings logic might need review based on Supabase schema
        
        userTransactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount);
            if (transaction.typeId === "1") totalExpenses += amount;
            else if (transaction.typeId === "2") totalIncome += amount;
            else if (transaction.typeId === "3") { // Savings type
                // This logic for "Make Investments" vs "Withdraw Investments" was specific.
                // Ensure 'category' field exists and is correctly used.
                if (transaction.category === "Make Investments") totalSavings -= amount; // Money out
                else if (transaction.category === "Withdraw Investments") totalSavings += amount; // Money in
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
app.get('/months', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data: userTransactions } = await supabaseAPI.get(
            `${SUPABASE_URL_TRANSACTIONS}?userId=eq.${userId}&select=date&order=date.asc`
        );
        
        if (!userTransactions) {
            return res.json([]);
        }
        
        const months = new Set();
        userTransactions.forEach(transaction => {
            // Assuming date is "YYYY-MM-DD" from Supabase
            const parts = transaction.date.split('-'); // YYYY-MM-DD
            if (parts.length >= 3) {
                const monthYear = `${parts[1]}/${parts[0].substring(2)}`; // MM/YY
                months.add(monthYear);
            }
        });
        
        res.json(Array.from(months).sort((a, b) => { // Sort MM/YY
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
            const { data: users } = await supabaseAPI.get(`${SUPABASE_URL_USUARIOS}?select=id&order=createdAt.asc&limit=1`);
            if (users && users.length > 0) {
                defaultUserId = users[0].id;
            } else {
                console.log('No users in Supabase to assign legacy data to. Skipping import.');
                return;
            }
        }
        
        const { data: existingTransactions } = await supabaseAPI.get(
            `${SUPABASE_URL_TRANSACTIONS}?userId=eq.${defaultUserId}&select=id&limit=1`
        );

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
            const { data, error } = await supabaseAPI.post(SUPABASE_URL_TRANSACTIONS, transactionsToImport);
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

// SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server is running at http://localhost:${PORT}/`);
    if (!SUPABASE_ANON_KEY) {
        console.warn("⚠️ SUPABASE_ANON_KEY is not set. API requests to Supabase will likely fail.");
    }
    // Import existing data (now to Supabase) on first run if DB is empty for default user
    importExistingData();
});

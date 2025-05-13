const express = require('express')
const app = express()
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

app.use(cors())
app.use(express.json())

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// JSON Server URL
const JSON_SERVER_URL = 'http://localhost:3001';

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
        req.user = user;
        next();
    });
};

// Login route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Get user from DB
        const usersResponse = await axios.get(`${JSON_SERVER_URL}/usuarios`);
        const users = usersResponse.data;
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Compare passwords
        let passwordMatch;
        if (user.senha.startsWith('$2b$') || user.senha.startsWith('$2a$')) {
            // Password is hashed
            passwordMatch = await bcrypt.compare(password, user.senha);
        } else {
            // Password is plain text (for legacy accounts)
            passwordMatch = password === user.senha;
        }

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate token
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

        // Return user info and token (excluding password)
        const { senha, ...userWithoutPassword } = user;
        res.json({
            user: userWithoutPassword,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Signup route
app.post('/signup', async (req, res) => {
    try {
        const { nome, email, password } = req.body;

        // Validate input
        if (!nome || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        // Check if user already exists
        const usersResponse = await axios.get(`${JSON_SERVER_URL}/usuarios`);
        const users = usersResponse.data;
        const existingUser = users.find(u => u.email === email);

        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: uuidv4(),
            nome,
            email,
            senha: hashedPassword
        };

        await axios.post(`${JSON_SERVER_URL}/usuarios`, newUser);

        // Generate token
        const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });

        // Return user info and token (excluding password)
        const { senha, ...userWithoutPassword } = newUser;
        res.status(201).json({
            user: userWithoutPassword,
            token
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

// Change password route
app.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        // Get user from DB
        const userResponse = await axios.get(`${JSON_SERVER_URL}/usuarios/${userId}`);
        const user = userResponse.data;

        // Verify current password
        const passwordMatch = await bcrypt.compare(currentPassword, user.senha);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        const updatedUser = { ...user, senha: hashedPassword };
        await axios.put(`${JSON_SERVER_URL}/usuarios/${userId}`, updatedUser);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error while changing password' });
    }
});

// Get categories
app.get('/categories', authenticateToken, async (req, res) => {
    try {
        const response = await axios.get(`${JSON_SERVER_URL}/categories`);
        res.json(response.data);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Add a new category
app.post('/categories', authenticateToken, async (req, res) => {
    try {
        const { name, typeId } = req.body;
        
        // Validate input
        if (!name || !typeId) {
            return res.status(400).json({ message: 'Category name and type are required' });
        }
        
        // Create new category
        const newCategory = {
            id: uuidv4(),
            name,
            typeId
        };
        
        const response = await axios.post(`${JSON_SERVER_URL}/categories`, newCategory);
        res.status(201).json(response.data);
    } catch (error) {
        console.error('Add category error:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// Delete a category
app.delete('/categories/:id', authenticateToken, async (req, res) => {
    try {
        const response = await axios.delete(`${JSON_SERVER_URL}/categories/${req.params.id}`);
        res.json(response.data);
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// Get transaction types
app.get('/transaction-types', authenticateToken, async (req, res) => {
    try {
        const response = await axios.get(`${JSON_SERVER_URL}/transactionTypes`);
        res.json(response.data);
    } catch (error) {
        console.error('Get transaction types error:', error);
        res.status(500).json({ error: 'Failed to fetch transaction types' });
    }
});

// Add expense
app.post('/add-expense', authenticateToken, async (req, res) => {
    try {
        const { description, amount, category, date } = req.body;
        const userId = req.user.id;
        
        // Validate input
        if (!description || !amount || !category || !date) {
            return res.status(400).json({ message: 'Description, amount, category, and date are required' });
        }
        
        // Create new transaction
        const newTransaction = {
            id: uuidv4(),
            userId,
            description,
            amount: parseFloat(amount),
            category,
            date,
            typeId: "1", // Expense type
            createdAt: new Date().toISOString()
        };
        
        // Add to JSON Server
        await axios.post(`${JSON_SERVER_URL}/transactions`, newTransaction);
        
        res.status(201).json({ success: true, message: "Expense added!", transaction: newTransaction });
    } catch (error) {
        console.error('Add expense error:', error);
        res.status(500).json({ success: false, message: "Failed to add expense." });
    }
});

// Add income
app.post('/add-income', authenticateToken, async (req, res) => {
    try {
        const { category, amount, date } = req.body;
        const userId = req.user.id;
        
        // Validate input
        if (!category || !amount || !date) {
            return res.status(400).json({ message: 'Category, amount, and date are required' });
        }
        
        // Create new transaction
        const newTransaction = {
            id: uuidv4(),
            userId,
            description: category, // Using category as description for income
            amount: parseFloat(amount),
            category,
            date,
            typeId: "2", // Income type
            createdAt: new Date().toISOString()
        };
        
        // Add to JSON Server
        await axios.post(`${JSON_SERVER_URL}/transactions`, newTransaction);
        
        res.status(201).json({ success: true, message: "Income added!", transaction: newTransaction });
    } catch (error) {
        console.error('Add income error:', error);
        res.status(500).json({ success: false, message: "Failed to add income." });
    }
});

// Add savings transaction
app.post('/add-savings', authenticateToken, async (req, res) => {
    try {
        const { description, amount, category, date } = req.body;
        const userId = req.user.id;
        
        // Validate input
        if (!description || !amount || !category || !date) {
            return res.status(400).json({ message: 'Description, amount, category, and date are required' });
        }
        
        // Create new transaction
        const newTransaction = {
            id: uuidv4(),
            userId,
            description,
            amount: parseFloat(amount),
            category,
            date,
            typeId: "3", // Savings type
            createdAt: new Date().toISOString()
        };
        
        // Add to JSON Server
        await axios.post(`${JSON_SERVER_URL}/transactions`, newTransaction);
        
        res.status(201).json({ success: true, message: "Savings transaction added!", transaction: newTransaction });
    } catch (error) {
        console.error('Add savings error:', error);
        res.status(500).json({ success: false, message: "Failed to add savings transaction." });
    }
});

// Get transactions
app.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get all transactions from JSON Server
        const response = await axios.get(`${JSON_SERVER_URL}/transactions`);
        
        // Filter for user's transactions only
        const userTransactions = response.data.filter(t => t.userId === userId);
        
        res.json(userTransactions);
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Get transactions by month
app.get('/transactions/month/:month', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const month = req.params.month; // Format: MM/YY
        
        // Get all transactions from JSON Server
        const response = await axios.get(`${JSON_SERVER_URL}/transactions`);
        
        // Filter for user's transactions by month
        const userTransactions = response.data.filter(t => 
            t.userId === userId && t.date.includes(month)
        );
        
        res.json(userTransactions);
    } catch (error) {
        console.error('Get transactions by month error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Get transactions by category
app.get('/transactions/category/:category', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const category = req.params.category;
        
        // Get all transactions from JSON Server
        const response = await axios.get(`${JSON_SERVER_URL}/transactions`);
        
        // Filter for user's transactions by category
        const userTransactions = response.data.filter(t => 
            t.userId === userId && t.category === category
        );
        
        res.json(userTransactions);
    } catch (error) {
        console.error('Get transactions by category error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Delete a transaction
app.delete('/transactions/:id', authenticateToken, async (req, res) => {
    try {
        const transactionId = req.params.id;
        const userId = req.user.id;
        
        // Get the transaction
        const transactionResponse = await axios.get(`${JSON_SERVER_URL}/transactions/${transactionId}`);
        const transaction = transactionResponse.data;
        
        // Check if the transaction belongs to the user
        if (transaction.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this transaction' });
        }
        
        // Delete the transaction
        await axios.delete(`${JSON_SERVER_URL}/transactions/${transactionId}`);
        
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

// Calculate monthly balance
app.get('/balance/:month', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const month = req.params.month; // Format: MM/YY
        
        // Get all transactions from JSON Server
        const response = await axios.get(`${JSON_SERVER_URL}/transactions`);
        
        // Filter for user's transactions by month
        const userTransactions = response.data.filter(t => 
            t.userId === userId && t.date.includes(month)
        );
        
        // Calculate totals by type
        let totalExpenses = 0;
        let totalIncome = 0;
        let totalSavings = 0;
        
        userTransactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount);
            
            if (transaction.typeId === "1") { // Expense
                totalExpenses += amount;
            } else if (transaction.typeId === "2") { // Income
                totalIncome += amount;
            } else if (transaction.typeId === "3") { // Savings
                if (transaction.category === "Make Investments") {
                    totalSavings -= amount; // Money going out
                } else if (transaction.category === "Withdraw Investments") {
                    totalSavings += amount; // Money coming in
                }
            }
        });
        
        const balance = totalIncome - totalExpenses + totalSavings;
        
        res.json({
            month,
            totalExpenses,
            totalIncome,
            totalSavings,
            balance
        });
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({ error: 'Failed to calculate balance' });
    }
});

// Calculate monthly balance with separated month/year params
app.get('/balance/:month/:year', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const month = req.params.month;
        const year = req.params.year;
        const monthYearFormat = `${month}/${year}`; // Format: MM/YY
        
        // Get all transactions from JSON Server
        const response = await axios.get(`${JSON_SERVER_URL}/transactions`);
        
        // Filter for user's transactions by month
        const userTransactions = response.data.filter(t => 
            t.userId === userId && t.date.includes(monthYearFormat)
        );
        
        // Calculate totals by type
        let totalExpenses = 0;
        let totalIncome = 0;
        let totalSavings = 0;
        
        userTransactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount);
            
            if (transaction.typeId === "1") { // Expense
                totalExpenses += amount;
            } else if (transaction.typeId === "2") { // Income
                totalIncome += amount;
            } else if (transaction.typeId === "3") { // Savings
                if (transaction.category === "Make Investments") {
                    totalSavings -= amount; // Money going out
                } else if (transaction.category === "Withdraw Investments") {
                    totalSavings += amount; // Money coming in
                }
            }
        });
        
        const balance = totalIncome - totalExpenses + totalSavings;
        
        res.json({
            month: monthYearFormat,
            totalExpenses,
            totalIncome,
            totalSavings,
            balance
        });
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({ error: 'Failed to calculate balance' });
    }
});

// Get all months with transactions
app.get('/months', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get all transactions from JSON Server
        const response = await axios.get(`${JSON_SERVER_URL}/transactions`);
        
        // Filter for user's transactions
        const userTransactions = response.data.filter(t => t.userId === userId);
        
        // Extract unique months
        const months = new Set();
        userTransactions.forEach(transaction => {
            // Extract month and year from date (format: DD/MM/YY)
            const parts = transaction.date.split('/');
            if (parts.length >= 3) {
                const month = `${parts[1]}/${parts[2]}`; // MM/YY
                months.add(month);
            }
        });
        
        res.json(Array.from(months).sort());
    } catch (error) {
        console.error('Get months error:', error);
        res.status(500).json({ error: 'Failed to fetch months' });
    }
});

// Import initial data if needed
const importExistingData = async () => {
    try {
        console.log('Checking if data needs to be imported...');
        
        // Check if transactions already exist
        const transactionsResponse = await axios.get(`${JSON_SERVER_URL}/transactions`);
        if (transactionsResponse.data && transactionsResponse.data.length > 0) {
            console.log('Transactions already exist, skipping import.');
            return;
        }
        
        console.log('Importing existing data from expenses.txt and incomes.txt...');
        
        // Get the default user (admin)
        const usersResponse = await axios.get(`${JSON_SERVER_URL}/usuarios`);
        const defaultUserId = usersResponse.data[0].id;
        
        // Import expenses
        if (fs.existsSync(path.join(__dirname, 'expenses.txt'))) {
            const expensesData = fs.readFileSync(path.join(__dirname, 'expenses.txt'), 'utf8');
            const expenseLines = expensesData.split('\n').filter(line => line.trim());
            
            for (const line of expenseLines) {
                const parts = line.split(',');
                if (parts.length >= 4) {
                    const [description, amount, category, date] = parts;
                    
                    await axios.post(`${JSON_SERVER_URL}/transactions`, {
                        id: uuidv4(),
                        userId: defaultUserId,
                        description,
                        amount: parseFloat(amount),
                        category,
                        date,
                        typeId: "1", // Expense
                        createdAt: new Date().toISOString()
                    });
                }
            }
        }
        
        // Import incomes
        if (fs.existsSync(path.join(__dirname, 'incomes.txt'))) {
            const incomesData = fs.readFileSync(path.join(__dirname, 'incomes.txt'), 'utf8');
            const incomeLines = incomesData.split('\n').filter(line => line.trim());
            
            for (const line of incomeLines) {
                const parts = line.split(',');
                if (parts.length >= 3) {
                    const [category, amount, date] = parts;
                    
                    // Check if it's a savings transaction
                    let typeId = "2"; // Default to Income
                    if (category === "Make Investments" || category === "Withdraw Investments") {
                        typeId = "3"; // Savings
                    }
                    
                    await axios.post(`${JSON_SERVER_URL}/transactions`, {
                        id: uuidv4(),
                        userId: defaultUserId,
                        description: category, // Use category as description for incomes
                        amount: parseFloat(amount),
                        category,
                        date,
                        typeId,
                        createdAt: new Date().toISOString()
                    });
                }
            }
        }
        
        console.log('✅ Data import complete');
    } catch (error) {
        console.error('Error importing data:', error);
    }
};

// SERVER
app.listen(3000, () => {
    console.log('✅ Server is running at http://localhost:3000/');
    
    // Import existing data from the C backend on first run
    importExistingData();
});

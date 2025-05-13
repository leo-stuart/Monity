const express = require('express')
const app = express()
const { spawn } = require('child_process')
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');

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
        const passwordMatch = await bcrypt.compare(password, user.senha);
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
            nome,
            email,
            senha: hashedPassword
        };

        const response = await axios.post(`${JSON_SERVER_URL}/usuarios`, newUser);
        const createdUser = response.data;

        // Generate token
        const token = jwt.sign({ id: createdUser.id, email: createdUser.email }, JWT_SECRET, { expiresIn: '24h' });

        // Return user info and token (excluding password)
        const { senha, ...userWithoutPassword } = createdUser;
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

// Protected routes below this line
// Proxy requests to JSON Server for categories
app.get('/categories', authenticateToken, async (req, res) => {
    try {
        const response = await axios.get(`${JSON_SERVER_URL}/categories`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

app.post('/categories', authenticateToken, async (req, res) => {
    try {
        const response = await axios.post(`${JSON_SERVER_URL}/categories`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create category' });
    }
});

app.delete('/categories/:id', authenticateToken, async (req, res) => {
    try {
        const response = await axios.delete(`${JSON_SERVER_URL}/categories/${req.params.id}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

//SERVER
app.listen(3000, () => {
    console.log('✅ Server is running at http://localhost:3000/');
})

// ADD EXPENSE route
app.post('/add-expense', authenticateToken, (req, res) => {
    var desc = req.body.description || ""
    var amou = req.body.amount ? req.body.amount.toString() : "0"
    var cat = req.body.category || ""
    var data = req.body.date || ""
    
    console.log('Adding expense with values:', { desc, amou, cat, data })
    
    const monityPath = path.join(__dirname, 'monity');
    console.log('Using monity at path:', monityPath);
    
    const child = spawn(monityPath, ['add-expense', desc, amou, cat, data])

    child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`)
    })
    child.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`)
    })

    child.on('close', (code) => {
        console.log(`Child process exited with code ${code}`)
        if (code === 0) {
            res.json({ success: true, message: "Expense added!" })
        } else {
            res.status(500).json({ success: false, message: "Failed to add expense." })
        }
    })
})

// ADD INCOME ROUTE
app.post('/add-income', authenticateToken, (req, res) => {
    var cat = req.body.category || ""
    var amou = req.body.amount ? req.body.amount.toString() : "0"
    var data = req.body.date || ""

    console.log('Adding income with values:', { cat, amou, data })
    
    const child = spawn('./monity', ['add-income', cat, amou, data], { cwd: __dirname })

    child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`)
    })

    child.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`)
    })

    child.on('close', (code) => {
        console.log(`Child process exited with code ${code}`)
        if (code === 0) {
            res.json({ success: true, message: "Income added!" })
        } else {
            res.status(500).json({ success: false, message: "Failed to add income." })
        }
    })
})

app.post('/total-expenses', authenticateToken, (req, res) => {
    var month = req.body.monthReq

    const path = require('path');
    const monityPath = path.join(__dirname, 'monity');
    
    const child = spawn(monityPath, ['total-expenses', month])
    let output = ""
    child.stdout.on('data', (data) => {
        output += data
    })

    child.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`)
    })

    child.on('close', (code) => {
        if (code === 0) {
            res.json({ success: true, message: output.trim() })
        } else {
            res.status(500).json({ success: false, message: "Failed to show total expenses." })
        }
    })
})

app.post('/balance', authenticateToken, (req, res) => {
    const month = req.body.monthReq

    const path = require('path');
    const monityPath = path.join(__dirname, 'monity');
    
    const child = spawn(monityPath, ['balance', month])
    let output = ""

    child.stdout.on('data', (data) => {
        output += data
    })

    child.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`)
    })

    child.on('close', (code) => {
        if (code === 0) {
            res.json({ success: true, balance: output.trim() })
        } else {
            res.status(500).json({ success: false, message: "Failed to show balance." })
        }
    })
})

app.get('/list-expenses', authenticateToken, (req, res) => {
    const path = require('path');
    const monityPath = path.join(__dirname, 'monity');
    
    const child = spawn(monityPath, ['list-expenses'])
    let output = ""

    child.stdout.on('data', (data) => {
        output += data
    })


    child.on('close', (code) => {
        if (code === 0) {
            const lines = output.split('\n')
            const expenses = lines
                .filter(line => line.trim() !== "")
                .map(line => {
                    const [description, amount, category, date] = line.split(',')
                    return { description, amount, category, date }
                })

            res.json({ success: true, data: expenses })
        } else {
            res.status(500).json({ message: "Failed to list expenses." })
        }
    })
})

app.get('/list-incomes', authenticateToken, (req, res) => {
    const path = require('path');
    const monityPath = path.join(__dirname, 'monity');
    
    const child = spawn(monityPath, ['list-incomes'])
    let output = ""

    child.stdout.on('data', (data) => {
        output += data
    })

    child.on('close', (code) => {
        if (code === 0) {
            const lines = output.split('\n')
            const incomes = lines
                .filter(line => line.trim() !== "")
                .map(line => {
                    const [category, amount, date] = line.split(',')
                    return { category, amount, date }
                })

            res.json({ success: true, data: incomes })
        } else {
            res.status(500).json({ message: "Failed to list incomes." })
        }
    })
})

app.get('/monthly-history', authenticateToken, (req, res) => {
    const path = require('path');
    const monityPath = path.join(__dirname, 'monity');
    
    const child = spawn(monityPath, ['monthly-history'])
    let output = ""

    child.stdout.on('data', (data) => {
        output += data
    })

    child.on('close', (code) => {
        if (code === 0) {
            const lines = output.split('\n')
            const history = lines
                .filter(line => line.trim() !== "")
                .map(line => {
                    const [month, totalIncome, totalExpense, balance] = line.split(',')
                    return { month, totalIncome, totalExpense, balance }
                })
            res.json({ success: true, data: history })
        } else {
            res.status(500).json({ message: "Failed to list monthly history." })
        }
    })
})

app.delete('/delete-expense', authenticateToken, (req, res) => {
    const index = req.body.index

    const path = require('path');
    const monityPath = path.join(__dirname, 'monity');
    
    const child = spawn(monityPath, ['delete-expense', index])

    child.stderr.on('data', (data) => {
        console.error(`delete-expense stderr: ${data}`)
    })

    child.on('close', (code) => {
        if (code === 0) {
            res.json({ success: true })
        } else {
            res.status(500).json({ success: false })
        }
    })
})

app.delete('/delete-income', authenticateToken, (req, res) => {
    const index = req.body.index

    const path = require('path');
    const monityPath = path.join(__dirname, 'monity');
    
    const child = spawn(monityPath, ['delete-income', index])

    child.stderr.on('data', (data) => {
        console.error(`delete-income stderr: ${data}`)
    })

    child.on('close', (code) => {
        if (code === 0) {
            res.json({ success: true })
        } else {
            res.status(500).json({ success: false })
        }
    })
})

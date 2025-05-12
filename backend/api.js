const express = require('express')
const app = express()
const { spawn } = require('child_process')
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');

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


// Proxy requests to JSON Server for categories
app.get('/categories', async (req, res) => {
    try {
        const response = await axios.get(`${JSON_SERVER_URL}/categories`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

app.post('/categories', async (req, res) => {
    try {
        const response = await axios.post(`${JSON_SERVER_URL}/categories`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create category' });
    }
});

app.delete('/categories/:id', async (req, res) => {
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
app.post('/add-expense', (req, res) => {
    var desc = req.body.description
    var amou = req.body.amount
    var cat = req.body.category
    var data = req.body.date
    const child = spawn('./monity', ['add-expense', desc, amou, cat, data])

    child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`)
    })
    child.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`)
    })

    child.on('close', (code) => {
        if (code === 0) {
            res.json({ success: true, message: "Expense added!" })
        } else {
            res.status(500).json({ success: false, message: "Failed to add expense." })
        }
    })
})

// ADD INCOME ROUTE
app.post('/add-income', (req, res) => {
    var cat = req.body.category
    var amou = req.body.amount
    var data = req.body.date

    const child = spawn('./monity', ['add-income', cat, amou, data])

    child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`)
    })

    child.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`)
    })

    child.on('close', (code) => {
        if (code === 0) {
            res.json({ success: true, message: "Income added!" })
        } else {
            res.status(500).json({ success: false, message: "Failed to add income." })
        }
    })
})

app.post('/total-expenses', (req, res) => {
    var month = req.body.monthReq

    const child = spawn('./monity', ['total-expenses', month])
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

app.post('/balance', (req, res) => {
    const month = req.body.monthReq

    const child = spawn('./monity', ['balance', month])
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

app.get('/list-expenses', (req, res) => {
    const child = spawn('./monity', ['list-expenses'])
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
            res.status(500).json({ message: "Failed to list incomes." })
        }
    })
})

app.get('/list-incomes', (req, res) => {
    const child = spawn('./monity', ['list-incomes'])
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

app.get('/monthly-history', (req, res) => {
    const child = spawn('./monity', ['monthly-history'])
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
            res.sendStatus(500).json({ message: "Failed to list monthly history." })
        }
    })
})

app.delete('/delete-expense', (req, res) => {
    const index = req.body.index

    const child = spawn('./monity', ['delete-expense', index])

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

app.delete('/delete-income', (req, res) => {
    const index = req.body.index

    const child = spawn('./monity', ['delete-income', index])

    child.stderr.on('data', (data) => {
        console.error(`delete-income stderr: ${data}`)
    })

    child.on('close', (code) => {
        if (code === 0) {
            res.json({ success: true })
        } else {
            res.sendStatus(500).json({ success: false })
        }
    })
})

const express = require('express')
const app = express()
const { spawn } = require('child_process')
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.use(cors())
app.use(express.json())

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
    const { email, password } = req.body;
    
    try {
        const child = spawn('./monity', ['login', email, password]);
        let output = '';

        child.stdout.on('data', (data) => {
            output += data;
        });

        child.on('close', (code) => {
            if (code === 0) {
                const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });
                res.json({ success: true, token });
            } else {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Signup route
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    
    try {
        const child = spawn('./monity', ['signup', name, email, password]);
        let output = '';

        child.stdout.on('data', (data) => {
            output += data;
        });

        child.on('close', (code) => {
            if (code === 0) {
                res.json({ success: true, message: 'Account created successfully' });
            } else {
                res.status(400).json({ success: false, message: 'Failed to create account' });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Signup failed' });
    }
});

// Add category route
app.post('/add-category', authenticateToken, (req, res) => {
    const { name, type } = req.body;
    
    try {
        const child = spawn('./monity', ['add-category', name, type]);
        let output = '';

        child.stdout.on('data', (data) => {
            output += data;
        });

        child.on('close', (code) => {
            if (code === 0) {
                res.json({ success: true, message: 'Category added successfully' });
            } else {
                res.status(400).json({ success: false, message: 'Failed to add category' });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add category' });
    }
});

// Change password route
app.post('/change-password', authenticateToken, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    try {
        const child = spawn('./monity', ['change-password', currentPassword, newPassword]);
        let output = '';

        child.stdout.on('data', (data) => {
            output += data;
        });

        child.on('close', (code) => {
            if (code === 0) {
                res.json({ success: true, message: 'Password changed successfully' });
            } else {
                res.status(400).json({ success: false, message: 'Failed to change password' });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to change password' });
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

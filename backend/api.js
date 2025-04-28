const express = require('express')
const app = express()
const { spawn } = require('child_process')
const cors = require('cors');

app.use(cors())
app.use(express.json())

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

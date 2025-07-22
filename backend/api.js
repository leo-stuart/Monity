const express = require('express')
const app = express()
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const Papa = require('papaparse');
const savingsGoals = require('./savings-goals');
const expenseSplitting = require('./expense-splitting');
const SmartCategorizationEngine = require('./smart-categorization');
const AIScheduler = require('./ai-scheduler');

// Load environment variables
require('dotenv').config();

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
// Use the ANONYMOUS key for all normal user operations
const supabaseKey = process.env.SUPABASE_ANON_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors())
app.use(express.json())

// Initialize Smart Categorization Engine and AI Scheduler
const smartCategorization = new SmartCategorizationEngine(supabase)
const aiScheduler = new AIScheduler(supabase)

// Initialize AI system on startup
smartCategorization.initialize().catch(console.error)

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

const premiumAuthMiddleware = async (req, res, next) => {
    try {
        const { data: profile, error } = await req.supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', req.user.id)
            .single();

        if (error || !profile) {
            console.error('Error fetching profile or profile not found:', error?.message);
            return res.status(404).json({ error: 'User profile not found.' });
        }

        if (profile.subscription_tier !== 'premium') {
            return res.status(403).json({ error: 'Forbidden: Premium subscription required.' });
        }

        next();
    } catch (err) {
        console.error('Error in premiumAuthMiddleware:', err.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

// Group and Expense Splitting Routes
app.post('/groups', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        const group = await expenseSplitting.createGroup(req.supabase, req.user.id, name);
        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
console.log('Route registered: POST /groups');

app.get('/groups', authMiddleware, async (req, res) => {
    try {
        const groups = await expenseSplitting.getGroups(req.supabase, req.user.id);
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
console.log('Route registered: GET /groups');

app.get('/groups/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const group = await expenseSplitting.getGroupById(req.supabase, id);
        res.json(group);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
console.log('Route registered: GET /groups/:id');

app.put('/groups/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const group = await expenseSplitting.updateGroup(req.supabase, id, name);
        res.json(group);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
console.log('Route registered: PUT /groups/:id');

app.delete('/groups/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await expenseSplitting.deleteGroup(req.supabase, id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search users endpoint
app.get('/users/search', authMiddleware, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json([]);
        }
        const users = await expenseSplitting.searchUsers(req.supabase, q);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send group invitation
app.post('/groups/:id/invite', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body;
        const result = await expenseSplitting.sendGroupInvitation(req.supabase, id, req.user.id, email);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get pending invitations for current user
app.get('/invitations/pending', authMiddleware, async (req, res) => {
    try {
        const invitations = await expenseSplitting.getPendingInvitations(req.supabase, req.user.id);
        res.json(invitations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
console.log('Route registered: GET /invitations/pending');

// Respond to invitation
app.post('/invitations/:id/respond', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { response } = req.body;
        const result = await expenseSplitting.respondToInvitation(req.supabase, id, response);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
console.log('Route registered: POST /invitations/:id/respond');

app.post('/groups/:id/members', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const member = await expenseSplitting.addGroupMember(req.supabase, id, name);
        res.status(201).json(member);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/groups/:id/members/:userId', authMiddleware, async (req, res) => {
    try {
        const { id, userId } = req.params;
        await expenseSplitting.removeGroupMember(req.supabase, id, userId);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/groups/:id/expenses', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { description, amount, shares } = req.body;
        const expense = await expenseSplitting.addGroupExpense(req.supabase, id, description, amount, req.user.id, shares);
        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/expenses/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { description, amount, shares } = req.body;
        const expense = await expenseSplitting.updateGroupExpense(req.supabase, id, description, amount, shares);
        res.json(expense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/expenses/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await expenseSplitting.deleteGroupExpense(req.supabase, id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/shares/:id/settle', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const share = await expenseSplitting.settleExpenseShare(req.supabase, id);
        res.json(share);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Savings Goals Routes
app.get('/savings-goals', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const goals = await savingsGoals.getGoals(req.supabase, userId);
        res.json(goals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/savings-goals', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { goal_name, target_amount, target_date, current_amount } = req.body;
        const result = await savingsGoals.addGoal(req.supabase, userId, goal_name, target_amount, target_date, current_amount);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/savings-goals/:id/allocate', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;
        const userId = req.user.id;
        const result = await savingsGoals.allocateToGoal(req.supabase, id, amount, userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/savings-goals/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const result = await savingsGoals.deleteGoal(req.supabase, id, userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


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
        const { name, typeId, color, icon } = req.body; // typeId refers to transactionTypes.id
        if (!name || !typeId) {
            return res.status(400).json({ message: 'Category name and type are required' });
        }
        
        const userId = req.user.id; 
        
        const newCategory = {
            name,
            typeId,
            userId: userId,
            color: color || '#01C38D', // Default color if not provided
            icon: icon || '📦' // Default icon if not provided
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

// Duplicate budget endpoints removed - using the enhanced version below


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
        const { description, amount, category, date, wasAISuggested, aiConfidence, suggestedCategory } = body || req.body;
        const userId = req.user.id;
        
        if (!description || !amount || !category || !date) {
            return res.status(400).json({ message: 'Description, amount, category, and date are required' });
        }

        // Auto-create category if it doesn't exist and was AI-suggested
        if (wasAISuggested && suggestedCategory === category) {
            try {
                await ensureCategoryExists(req.supabase, userId, category, typeId);
            } catch (categoryError) {
                console.error('[SmartCategorization] Error auto-creating category:', categoryError);
                // Continue with transaction creation even if category creation fails
            }
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

        // Record AI feedback if this was an AI-suggested categorization
        if (wasAISuggested && suggestedCategory) {
            try {
                await smartCategorization.recordFeedback(
                    userId,
                    description,
                    suggestedCategory,
                    category,
                    suggestedCategory === category,
                    aiConfidence || 0.5,
                    parseFloat(amount)
                );
            } catch (feedbackError) {
                console.error('[SmartCategorization] Error recording feedback for new transaction:', feedbackError);
                // Don't fail the transaction creation for feedback errors
            }
        }
        
        res.status(201).json({ success: true, message: successMessage, transaction: createdTransactions[0] });
    } catch (error) {
        console.error(`Add transaction (type ${typeId}) error:`, error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: `Failed to add ${successMessage.toLowerCase().split(' ')[0]}.` });
    }
};

// Helper function to ensure category exists, create if it doesn't
const ensureCategoryExists = async (supabase, userId, categoryName, typeId) => {
    try {
        // Check if category already exists for this user
        const { data: existingCategories, error: checkError } = await supabase
            .from('categories')
            .select('id, name')
            .eq('userId', userId)
            .eq('name', categoryName)
            .eq('typeId', typeId);

        if (checkError) {
            console.error('[ensureCategoryExists] Error checking existing categories:', checkError);
            return;
        }

        // If category doesn't exist, create it
        if (!existingCategories || existingCategories.length === 0) {
            const newCategory = {
                name: categoryName,
                typeId: typeId,
                userId: userId,
                color: '#01C38D', // Default color for auto-created categories
                icon: '📦' // Default icon for auto-created categories
            };

            const { data: createdCategory, error: createError } = await supabase
                .from('categories')
                .insert([newCategory])
                .select();

            if (createError) {
                console.error('[ensureCategoryExists] Error creating category:', createError);
                return;
            }

            console.log(`[SmartCategorization] Auto-created category: "${categoryName}" for user ${userId}`);
            return createdCategory[0];
        } else {
            console.log(`[SmartCategorization] Category "${categoryName}" already exists for user ${userId}`);
            return existingCategories[0];
        }

    } catch (error) {
        console.error('[ensureCategoryExists] Unexpected error:', error);
        throw error;
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

app.get('/subscription-tier', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data, error } = await req.supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', userId)
            .single();

        if (error) {
            throw error;
        }

        res.json({ subscription_tier: data.subscription_tier });
    } catch (error) {
        console.error('Error fetching subscription tier:', error.message);
        res.status(500).json({ error: 'Failed to fetch subscription tier.' });
    }
});

// Get user count (admin only)
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

// Smart Categorization Endpoints

// Get category suggestions for a transaction
app.post('/ai/suggest-category', authMiddleware, async (req, res) => {
    try {
        const { description, amount, transactionType } = req.body;
        const userId = req.user.id;

        if (!description) {
            return res.status(400).json({ error: 'Transaction description is required' });
        }

        console.log(`[SmartCategorization] Getting suggestions for: "${description}"`);

        const suggestions = await smartCategorization.suggestCategory(
            description, 
            amount || 0, 
            transactionType || 1, 
            userId
        );

        res.json({
            success: true,
            suggestions: suggestions,
            description: description
        });

    } catch (error) {
        console.error('[SmartCategorization] Error in suggest-category:', error);
        res.status(500).json({ 
            error: 'Failed to get category suggestions',
            suggestions: [{
                category: 'Uncategorized',
                confidence: 0.3,
                source: 'fallback'
            }]
        });
    }
});

// Record user feedback on category suggestions
app.post('/ai/feedback', authMiddleware, async (req, res) => {
    try {
        const { 
            transactionDescription, 
            suggestedCategory, 
            actualCategory, 
            wasAccepted, 
            confidence, 
            amount 
        } = req.body;
        const userId = req.user.id;

        if (!transactionDescription || !actualCategory) {
            return res.status(400).json({ error: 'Transaction description and actual category are required' });
        }

        await smartCategorization.recordFeedback(
            userId,
            transactionDescription,
            suggestedCategory || 'None',
            actualCategory,
            wasAccepted || false,
            confidence || 0.5,
            amount
        );

        res.json({
            success: true,
            message: 'Feedback recorded successfully'
        });

    } catch (error) {
        console.error('[SmartCategorization] Error recording feedback:', error);
        res.status(500).json({ error: 'Failed to record feedback' });
    }
});

// Get AI categorization statistics (admin only)
app.get('/ai/stats', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        // Get feedback statistics
        const { data: feedbackStats, error: feedbackError } = await req.supabase
            .from('categorization_feedback')
            .select('was_suggestion_accepted, confidence_score');

        if (feedbackError) throw feedbackError;

        // Calculate accuracy
        const totalFeedback = feedbackStats.length;
        const acceptedSuggestions = feedbackStats.filter(f => f.was_suggestion_accepted).length;
        const accuracy = totalFeedback > 0 ? (acceptedSuggestions / totalFeedback) * 100 : 0;

        // Get model metrics
        const { data: modelMetrics, error: metricsError } = await req.supabase
            .from('ml_model_metrics')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // Get merchant patterns count
        const { data: merchantCount, error: merchantError } = await req.supabase
            .from('merchant_patterns')
            .select('id', { count: 'exact' });

        res.json({
            success: true,
            stats: {
                totalFeedback,
                acceptedSuggestions,
                accuracy: accuracy.toFixed(2),
                modelMetrics: modelMetrics || null,
                merchantPatternsCount: merchantCount?.length || 0,
                avgConfidence: totalFeedback > 0 ? 
                    (feedbackStats.reduce((sum, f) => sum + (f.confidence_score || 0), 0) / totalFeedback).toFixed(3) : 0
            }
        });

    } catch (error) {
        console.error('[SmartCategorization] Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get AI statistics' });
    }
});

// Retrain the AI model (admin only)
app.post('/ai/retrain', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        await smartCategorization.retrainModel();
        res.json({
            success: true,
            message: 'Model retraining completed successfully'
        });

    } catch (error) {
        console.error('[SmartCategorization] Error retraining model:', error);
        res.status(500).json({ error: 'Failed to retrain model' });
    }
});

// Get merchant patterns (for debugging/admin purposes)
app.get('/ai/patterns', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        const { data: patterns, error } = await req.supabase
            .from('merchant_patterns')
            .select('*')
            .order('usage_count', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            patterns: patterns
        });

    } catch (error) {
        console.error('[SmartCategorization] Error getting patterns:', error);
        res.status(500).json({ error: 'Failed to get merchant patterns' });
    }
});

// Budget endpoints
app.get('/budgets', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await req.supabase
            .from('budgets')
            .select(`
                *,
                categories (
                    name
                )
            `)
            .eq('userId', req.user.id)
            .order('createdAt', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching budgets:', error);
        res.status(500).json({ error: 'Failed to fetch budgets' });
    }
});

app.post('/budgets', authMiddleware, async (req, res) => {
    try {
        const { name, amount, categoryId, period, startDate } = req.body;
        
        // Validate required fields
        if (!name || !amount || !categoryId) {
            return res.status(400).json({ message: 'Name, amount, and category are required' });
        }

        // Validate amount is a positive number
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: 'Amount must be a positive number' });
        }
        
        const budgetStartDate = startDate || new Date().toISOString().split('T')[0];
        // Extract month from startDate for the required month column
        const monthValue = new Date(budgetStartDate).toISOString().slice(0, 7) + '-01'; // YYYY-MM-01 format

        const { data, error } = await req.supabase
            .from('budgets')
            .insert({
                userId: req.user.id,
                name,
                amount: parsedAmount,
                categoryId: categoryId,
                period: period || 'monthly',
                startDate: budgetStartDate,
                month: monthValue, // Required by the original schema
                spent: 0
            })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error creating budget:', error);
        res.status(500).json({ error: 'Failed to create budget' });
    }
});

app.put('/budgets/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, amount, period } = req.body;
        
        const { data, error } = await req.supabase
            .from('budgets')
            .update({
                name,
                amount: parseFloat(amount),
                period,
                updatedAt: new Date().toISOString()
            })
            .eq('id', id)
            .eq('userId', req.user.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ data });
    } catch (error) {
        console.error('Error updating budget:', error);
        res.status(500).json({ error: 'Failed to update budget' });
    }
});

app.delete('/budgets/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const { error } = await req.supabase
            .from('budgets')
            .delete()
            .eq('id', id)
            .eq('userId', req.user.id);

        if (error) throw error;
        res.json({ message: 'Budget deleted successfully' });
    } catch (error) {
        console.error('Error deleting budget:', error);
        res.status(500).json({ error: 'Failed to delete budget' });
    }
});

// Categories endpoints (for enhanced categories component)
app.delete('/categories/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const { error } = await req.supabase
            .from('categories')
            .delete()
            .eq('id', id)
            .eq('userId', req.user.id);

        if (error) throw error;
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// Initialize AI Scheduler after server setup
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Initialize AI background tasks
    try {
        await aiScheduler.initialize();
        console.log('AI Scheduler initialized successfully');
    } catch (error) {
        console.error('Failed to initialize AI Scheduler:', error);
    }
});

module.exports = server;

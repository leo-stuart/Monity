import { useState, useEffect, useCallback } from 'react';
import { 
    getBudgets, 
    upsertBudget, 
    deleteBudget, 
    getCategories, 
    getRecurringTransactions, 
    addRecurringTransaction, 
    updateRecurringTransaction, 
    deleteRecurringTransaction, 
    processRecurringTransactions, 
    getTransactionTypes 
} from '../utils/api';
import { useAuth } from '../context/AuthContext';

function CardWrapper({ children, title, accent }) {
    return (
        <div className="flex-1 min-w-[250px] p-6 rounded-2xl shadow-lg border border-[#31344d] bg-gradient-to-br from-[#23263a] via-[#23263a]/80 to-[#31344d] flex flex-col items-center justify-center">
            <h2 className={`text-2xl font-bold mb-4 ${accent}`}>{title}</h2>
            <div className="w-full flex justify-center items-center">
                {children}
            </div>
        </div>
    );
}

function Budget() {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // Default to current month
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBudgetsAndCategories = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        try {
            const [budgetsData, categoriesData] = await Promise.all([
                getBudgets(),
                getCategories()
            ]);
            setBudgets(budgetsData);
            // Filter for expense categories, assuming typeId for Expense is 1
            setCategories(categoriesData.filter(c => c.typeId === 1)); 
        } catch (err) {
            setError('Failed to fetch data.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchBudgetsAndCategories();
    }, [fetchBudgetsAndCategories]);

    const handleSetBudget = async (e) => {
        e.preventDefault();
        if (!selectedCategory || !amount || !month) {
            setError('Please fill all fields.');
            return;
        }
        setIsLoading(true);
        try {
            // Format month to be just YYYY-MM-01 for consistency
            const budgetDate = new Date(month + '-01').toISOString().split('T')[0];
            await upsertBudget({ categoryId: selectedCategory, amount: parseFloat(amount), month: budgetDate });
            setAmount('');
            setSelectedCategory('');
            fetchBudgetsAndCategories(); // Refresh list
        } catch (err) {
            setError('Failed to set budget.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBudget = async (budgetId) => {
        setIsLoading(true);
        try {
            await deleteBudget(budgetId);
            fetchBudgetsAndCategories(); // Refresh list
        } catch (err) {
            setError('Failed to delete budget.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return <p>Please log in to manage budgets.</p>;
    }

    return (
        <div className="w-full">
            <h3 className="text-xl font-bold mb-4 text-[#01C38D]">Set a New Budget</h3>
            {error && <p className="text-red-500">{error}</p>}
            <form onSubmit={handleSetBudget} className="flex flex-col md:flex-row gap-4 mb-6">
                <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="p-2 rounded bg-[#31344d] text-white flex-1"
                    required
                >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    placeholder="Amount"
                    className="p-2 rounded bg-[#31344d] text-white"
                    required
                />
                <input 
                    type="month" 
                    value={month} 
                    onChange={(e) => setMonth(e.target.value)}
                    className="p-2 rounded bg-[#31344d] text-white"
                    required
                />
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="p-2 rounded bg-[#01C38D] text-white font-bold hover:bg-[#01A071] transition-colors"
                >
                    {isLoading ? 'Saving...' : 'Set Budget'}
                </button>
            </form>

            <h3 className="text-xl font-bold mb-4 text-[#01C38D]">Your Budgets</h3>
            {isLoading && budgets.length === 0 ? (
                 <div className="w-full h-40 flex justify-center items-center">
                    <div className="w-12 h-12 rounded-full border-4 border-[#31344d] border-t-[#01C38D] animate-spin"></div>
                </div>
            ) : (
                <ul className="space-y-2">
                    {budgets.map(budget => (
                        <li key={budget.id} className="flex justify-between items-center p-3 bg-[#23263a] rounded-lg">
                            <div>
                                <span className="font-bold">{budget.categories.name}</span>
                                <span className="text-sm text-gray-400 block">{new Date(budget.month).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-4">
                               <span className="font-bold text-[#01C38D]">${parseFloat(budget.amount).toFixed(2)}</span>
                                <button onClick={() => handleDeleteBudget(budget.id)} className="text-red-500 hover:text-red-700">
                                    X
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function RecurringTransactions() {
    const { user } = useAuth();
    const [recurring, setRecurring] = useState([]);
    const [categories, setCategories] = useState([]);
    const [types, setTypes] = useState([]);
    const [form, setForm] = useState({
        description: '',
        amount: '',
        typeId: '',
        categoryId: '',
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
    });
    const [isEditing, setIsEditing] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [recData, catData, typeData] = await Promise.all([
                getRecurringTransactions(),
                getCategories(),
                getTransactionTypes()
            ]);
            setRecurring(recData);
            setCategories(catData);
            setTypes(typeData);
        } catch (err) {
            setError('Failed to fetch data.');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleProcess = async () => {
        setIsLoading(true);
        try {
            await processRecurringTransactions();
            alert('Processing complete!');
            fetchData(); // Refresh data
        } catch (err) {
            setError('Failed to process transactions.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isEditing) {
                await updateRecurringTransaction(isEditing, form);
            } else {
                await addRecurringTransaction(form);
            }
            resetForm();
            fetchData();
        } catch (err) {
            setError('Failed to save recurring transaction.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleEdit = (item) => {
        setIsEditing(item.id);
        setForm({
            ...item,
            startDate: new Date(item.startDate).toISOString().split('T')[0],
            endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : ''
        });
    };
    
    const handleDelete = async (id) => {
        setIsLoading(true);
        try {
            await deleteRecurringTransaction(id);
            fetchData();
        } catch (err) {
            setError('Failed to delete transaction.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setIsEditing(null);
        setForm({
            description: '',
            amount: '',
            typeId: '',
            categoryId: '',
            frequency: 'monthly',
            startDate: new Date().toISOString().split('T')[0],
            endDate: ''
        });
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#01C38D]">Manage Recurring Transactions</h3>
                <button 
                    onClick={handleProcess}
                    disabled={isLoading}
                    className="p-2 rounded bg-[#01C38D] text-white font-bold hover:bg-[#01A071] transition-colors"
                >
                    Process Now
                </button>
            </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <input type="text" placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="p-2 rounded bg-[#31344d] text-white" required />
                <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="p-2 rounded bg-[#31344d] text-white" required />
                <select value={form.typeId} onChange={e => setForm({...form, typeId: e.target.value, categoryId: ''})} className="p-2 rounded bg-[#31344d] text-white" required>
                    <option value="">Select Type</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} className="p-2 rounded bg-[#31344d] text-white" required>
                    <option value="">Select Category</option>
                    {categories.filter(c => c.typeId == form.typeId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} className="p-2 rounded bg-[#31344d] text-white" required>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                </select>
                <input type="date" placeholder="Start Date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="p-2 rounded bg-[#31344d] text-white" required />
                <input type="date" placeholder="End Date (Optional)" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="p-2 rounded bg-[#31344d] text-white" />
                <div className="md:col-span-3 flex justify-end gap-2">
                    <button type="submit" className="p-2 rounded bg-[#01C38D] text-white font-bold">{isEditing ? 'Update' : 'Add'}</button>
                    {isEditing && <button type="button" onClick={resetForm} className="p-2 rounded bg-gray-500 text-white">Cancel</button>}
                </div>
            </form>

            {/* List */}
            <ul className="space-y-2">
                {recurring.map(item => (
                    <li key={item.id} className="flex justify-between items-center p-3 bg-[#23263a] rounded-lg">
                        <div>
                            <p className="font-bold">{item.description} - ${parseFloat(item.amount).toFixed(2)} ({item.frequency})</p>
                            <p className="text-sm text-gray-400">{item.categories.name} ({item.transaction_types.name})</p>
                        </div>
                        <div>
                            <button onClick={() => handleEdit(item)} className="text-yellow-500 mr-2">Edit</button>
                            <button onClick={() => handleDelete(item.id)} className="text-red-500">Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function BudgetsAndRecurring() {
    return (
        <div className="w-full flex flex-col gap-8 mt-2">
            <div>
                <CardWrapper title="Manage Budgets" accent="text-[#01C38D]">
                    <Budget />
                </CardWrapper>
            </div>
            <div>
                <CardWrapper title="Recurring Transactions" accent="text-[#01C38D]">
                    <RecurringTransactions />
                </CardWrapper>
            </div>
        </div>
    );
}

export default BudgetsAndRecurring; 
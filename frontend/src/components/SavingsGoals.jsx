import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

// A simple modal component
const Modal = ({ children, onClose }) => {
    const { t } = useTranslation();
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center px-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl relative w-full max-w-md">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold">&times;</button>
                {children}
            </div>
        </div>
    );
};


const SavingsGoals = () => {
    const { t } = useTranslation();
    const { user, subscriptionTier } = useAuth();
    const [goals, setGoals] = useState([]);
    const [newGoal, setNewGoal] = useState({
        goal_name: '',
        target_amount: '',
        target_date: '',
        current_amount: ''
    });
    const [addingMoney, setAddingMoney] = useState({});
    const [balance, setBalance] = useState(0);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isLimited = subscriptionTier === 'free' && goals.length >= 2;

    const fetchGoalsAndBalance = async () => {
        try {
            const [goalsResponse, balanceResponse] = await Promise.all([
                api.get('/savings-goals'),
                api.get('/balance/all')
            ]);
            setGoals(goalsResponse.data);
            setBalance(balanceResponse.data.balance || 0);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchGoalsAndBalance();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewGoal(prevState => ({ ...prevState, [name]: value }));
    };

    const handleAddGoal = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/savings-goals', newGoal);
            setGoals(prevGoals => [...prevGoals, response.data]);
            setNewGoal({
                goal_name: '',
                target_amount: '',
                target_date: '',
                current_amount: ''
            });
            setIsModalOpen(false);
            fetchGoalsAndBalance(); // Refetch data
        } catch (error) {
            console.error('Error adding savings goal:', error);
        }
    };

    const handleDeleteGoal = async (goalId) => {
        try {
            await api.delete(`/savings-goals/${goalId}`);
            fetchGoalsAndBalance(); // Refetch data
        } catch (error) {
            console.error('Error deleting savings goal:', error);
        }
    };

    const handleAllocateMoney = async (goalId, amount) => {
        try {
            await api.post(`/savings-goals/${goalId}/allocate`, { amount });
            fetchGoalsAndBalance(); // Refetch data
            setAddingMoney(prev => ({ ...prev, [goalId]: { isAdding: false, amount: '' } }));
        } catch (error) {
            console.error('Error allocating money:', error);
        }
    };

    const handleAddMoneyClick = (goalId) => {
        setAddingMoney(prev => ({
            ...prev,
            [goalId]: { isAdding: !prev[goalId]?.isAdding, amount: '' }
        }));
    };

    const handleAmountChange = (e, goalId) => {
        const { value } = e.target;
        setAddingMoney(prev => ({
            ...prev,
            [goalId]: { ...prev[goalId], amount: value }
        }));
    };

    return (
        <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t('savings_goals.title')}</h2>
                <div className="flex items-center gap-4">
                    {isLimited && (
                        <Link
                            to="/subscription"
                            className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
                        >
                            {t('savings_goals.upgrade_to_add')}
                        </Link>
                    )}
                    <button 
                        onClick={() => setIsModalOpen(true)} 
                        className={`bg-[#01C38D] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#01a87a] transition-colors ${isLimited ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isLimited}
                    >
                        {t('savings_goals.add_new_goal')}
                    </button>
                </div>
            </div>

            {isModalOpen && !isLimited && (
                <Modal onClose={() => setIsModalOpen(false)}>
                    <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">{t('savings_goals.add_new_goal_modal_title')}</h3>
                    <form onSubmit={handleAddGoal}>
                        <div className="mb-4">
                            <label htmlFor="goal_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('savings_goals.goal_name')}</label>
                            <input type="text" id="goal_name" name="goal_name" value={newGoal.goal_name} onChange={handleInputChange} placeholder={t('savings_goals.goal_name_placeholder')} className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="target_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('savings_goals.target_amount')}</label>
                            <input type="number" id="target_amount" name="target_amount" value={newGoal.target_amount} onChange={handleInputChange} placeholder={t('savings_goals.target_amount_placeholder')} className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="target_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('savings_goals.target_date')}</label>
                            <input type="date" id="target_date" name="target_date" value={newGoal.target_date} onChange={handleInputChange} className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="current_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('savings_goals.initial_saved_amount')}</label>
                            <input type="number" id="current_amount" name="current_amount" value={newGoal.current_amount} onChange={handleInputChange} placeholder={t('savings_goals.initial_saved_amount_placeholder')} className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div className="flex justify-end gap-4 mt-6">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="py-2 px-4 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold">{t('common.cancel')}</button>
                            <button type="submit" className="py-2 px-4 rounded-lg bg-[#01C38D] hover:bg-[#01a87a] text-white font-bold">{t('savings_goals.create_goal')}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {goals.length === 0 ? (
                <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">{t('savings_goals.no_goals_yet')}</p>
                    <p className="text-gray-500 dark:text-gray-400">{t('savings_goals.no_goals_yet_description')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map(goal => {
                        const progress = (goal.current_amount / goal.target_amount) * 100;
                        return (
                            <div key={goal.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">{goal.goal_name}</h4>
                                    <button onClick={() => handleDeleteGoal(goal.id)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('savings_goals.target_date_label')} {goal.target_date ? new Date(goal.target_date).toLocaleDateString() : t('common.not_set')}</p>
                                
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-2">
                                    <div className="bg-[#01C38D] h-4 rounded-full" style={{ width: `${progress > 100 ? 100 : progress}%` }}></div>
                                </div>
                                <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-300">
                                    <span>${parseFloat(goal.current_amount).toLocaleString()}</span>
                                    <span>${parseFloat(goal.target_amount).toLocaleString()}</span>
                                </div>
                                <div className="mt-4">
                                    <button onClick={() => handleAddMoneyClick(goal.id)} className="text-[#01C38D] hover:underline font-semibold">
                                        {addingMoney[goal.id]?.isAdding ? t('common.cancel') : t('savings_goals.allocate_funds')}
                                    </button>
                                </div>
                                {addingMoney[goal.id]?.isAdding && (
                                    <div className="mt-4 flex items-center">
                                        <input
                                            type="number"
                                            value={addingMoney[goal.id].amount}
                                            onChange={(e) => handleAmountChange(e, goal.id)}
                                            placeholder={t('savings_goals.amount_placeholder')}
                                            className="p-2 border rounded w-full"
                                        />
                                        <button
                                            onClick={() => {
                                                const amountToAdd = parseFloat(addingMoney[goal.id].amount);
                                                if (amountToAdd > balance) {
                                                    setError(t('savings_goals.insufficient_balance_error'));
                                                    return;
                                                }
                                                setError(null);
                                                handleAllocateMoney(goal.id, amountToAdd);
                                            }}
                                            className="bg-blue-500 text-white p-2 rounded ml-2"
                                            disabled={parseFloat(addingMoney[goal.id]?.amount || 0) > balance || !addingMoney[goal.id]?.amount}
                                        >
                                            {t('common.save')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default SavingsGoals; 
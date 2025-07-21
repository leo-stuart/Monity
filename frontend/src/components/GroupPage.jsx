
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getGroupById, addGroupExpense, searchUsers, sendGroupInvitation, settleExpenseShare } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase';

const GroupPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [expenseDescription, setExpenseDescription] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [shares, setShares] = useState([]);
    const [showUserSearch, setShowUserSearch] = useState(false);
    const { user } = useAuth();

    const fetchGroup = async () => {
        try {
            setLoading(true);
            const fetchedGroup = await getGroupById(id);
            setGroup(fetchedGroup);
            // Initialize shares when group data is fetched
            if (fetchedGroup && fetchedGroup.group_members) {
                const initialShares = fetchedGroup.group_members.map(member => ({
                    user_id: member.profiles.id,
                    username: member.profiles.name,
                    amount_owed: ''
                }));
                setShares(initialShares);
            }
        } catch (err) {
            setError(t('groups.fetch_fail'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroup();

        // Set up real-time subscriptions for this group
        if (user) {
            const groupSubscription = supabase
                .channel(`group-${id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'group_members',
                        filter: `group_id=eq.${id}`
                    },
                    () => {
                        fetchGroup(); // Refresh when members change
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'group_expenses',
                        filter: `group_id=eq.${id}`
                    },
                    () => {
                        fetchGroup(); // Refresh when expenses change
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(groupSubscription);
            };
        }
    }, [id, user]);

    const handleSearchUsers = async (query) => {
        if (query.length < 2) {
            setUserSearchResults([]);
            return;
        }

        setSearchLoading(true);
        try {
            const results = await searchUsers(query);
            // Filter out users who are already members
            const memberIds = group?.group_members?.map(member => member.profiles.id) || [];
            const filteredResults = results.filter(user => !memberIds.includes(user.id));
            setUserSearchResults(filteredResults);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSendInvitation = async (email) => {
        setInviteLoading(true);
        try {
            await sendGroupInvitation(id, email);
            setNewMemberEmail('');
            setUserSearchResults([]);
            setShowUserSearch(false);
            // Show success message
            alert(t('groups.invitation_sent'));
        } catch (error) {
            alert(error.response?.data?.error || t('groups.invitation_failed'));
        } finally {
            setInviteLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        // Validate that shares add up to the total expense amount
        const totalShares = shares.reduce((acc, share) => acc + parseFloat(share.amount_owed || 0), 0);
        if (Math.abs(totalShares - parseFloat(expenseAmount)) > 0.01) {
            alert(t('groups.share_amount_error'));
            return;
        }

        try {
            await addGroupExpense(id, {
                description: expenseDescription,
                amount: parseFloat(expenseAmount),
                shares: shares.filter(share => parseFloat(share.amount_owed) > 0)
            });
            setExpenseDescription('');
            setExpenseAmount('');
            setShares(shares.map(s => ({ ...s, amount_owed: '' }))); // Clear amounts
            fetchGroup(); // Refresh group details
        } catch (err) {
            console.error('Failed to add expense:', err);
        }
    };

    const handleShareChange = (userId, value) => {
        setShares(shares.map(share =>
            share.user_id === userId ? { ...share, amount_owed: value } : share
        ));
    };

    const autoSplitExpense = () => {
        const numMembers = shares.length;
        if (numMembers > 0 && expenseAmount) {
            const amountPerMember = (parseFloat(expenseAmount) / numMembers).toFixed(2);
            setShares(shares.map(share => ({ ...share, amount_owed: amountPerMember })));
        }
    };

    const handleSettleShare = async (shareId) => {
        try {
            await settleExpenseShare(shareId);
            fetchGroup(); // Refresh group details to show updated settlement status
        } catch (error) {
            console.error('Failed to settle share:', error);
            alert('Failed to settle share. Please try again.');
        }
    };

    if (loading) return (
        <div className="flex-1 p-6">
            <div className="text-center text-gray-400 mt-8">{t('groups.loading_details')}</div>
        </div>
    );
    
    if (error) return (
        <div className="flex-1 p-6">
            <div className="text-center text-red-400 mt-8">{error}</div>
        </div>
    );
    
    if (!group) return (
        <div className="flex-1 p-6">
            <div className="text-center text-gray-400 mt-8">{t('groups.not_found')}</div>
        </div>
    );

    return (
        <div className="flex-1 p-6">
            <div className="mb-6">
                <Link to="/groups" className="text-[#01C38D] hover:text-[#00b37e] font-medium flex items-center gap-2 mb-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {t('groups.back')}
                </Link>
                <h1 className="text-3xl font-bold text-white">{group.name}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Members Section */}
                <div className="bg-[#24293A] rounded-lg border border-[#31344d] p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">{t('groups.members')}</h2>
                    
                    <div className="space-y-3 mb-6">
                        {group.group_members.map(member => (
                            <div key={member.profiles.id} className="flex items-center justify-between p-3 bg-[#191E29] rounded-lg">
                                <span className="text-white">{member.profiles.name}</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="border-t border-[#31344d] pt-4">
                        <h3 className="text-lg font-medium text-white mb-3">{t('groups.invite_member')}</h3>
                        
                        <div className="space-y-3">
                            <input
                                type="email"
                                value={newMemberEmail}
                                onChange={(e) => {
                                    setNewMemberEmail(e.target.value);
                                    handleSearchUsers(e.target.value);
                                    setShowUserSearch(e.target.value.length >= 2);
                                }}
                                placeholder={t('groups.enter_email')}
                                className="w-full px-4 py-2 bg-[#191E29] border border-[#31344d] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#01C38D] focus:border-transparent"
                            />
                            
                            {showUserSearch && (
                                <div className="bg-[#191E29] border border-[#31344d] rounded-lg max-h-40 overflow-y-auto">
                                    {searchLoading ? (
                                        <div className="p-3 text-gray-400 text-center">{t('groups.searching')}</div>
                                    ) : userSearchResults.length > 0 ? (
                                        userSearchResults.map(user => (
                                            <button
                                                key={user.id}
                                                onClick={() => handleSendInvitation(user.email)}
                                                disabled={inviteLoading}
                                                className="w-full text-left p-3 hover:bg-[#24293A] transition-colors border-b border-[#31344d] last:border-b-0"
                                            >
                                                <div className="text-white">{user.name}</div>
                                                <div className="text-gray-400 text-sm">{user.email}</div>
                                            </button>
                                        ))
                                    ) : newMemberEmail.length >= 2 ? (
                                        <div className="p-3">
                                            <div className="text-gray-400 text-sm mb-2">{t('groups.no_users_found')}</div>
                                            <button
                                                onClick={() => handleSendInvitation(newMemberEmail)}
                                                disabled={inviteLoading}
                                                className="text-[#01C38D] hover:text-[#00b37e] text-sm"
                                            >
                                                {t('groups.send_invitation_to')} {newMemberEmail}
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Expenses Section - Same as before */}
                <div className="bg-[#24293A] rounded-lg border border-[#31344d] p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">{t('groups.expenses')}</h2>
                    
                    <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                        {group.group_expenses.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">{t('groups.no_expenses')}</p>
                        ) : (
                            group.group_expenses.map(expense => (
                                <div key={expense.id} className="p-4 bg-[#191E29] rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-white font-medium">{expense.description}</span>
                                        <span className="text-[#01C38D] font-bold">${expense.amount.toFixed(2)}</span>
                                    </div>
                                    <div className="text-sm text-gray-400 mb-3">{t('groups.paid_by')} {expense.profiles.name}</div>
                                    <div className="space-y-1">
                                        {expense.expense_shares.map(share => (
                                            <div key={share.id} className="flex justify-between items-center text-sm">
                                                <span className="text-gray-300">{share.profiles.name} {t('groups.owes')} ${share.amount_owed.toFixed(2)}</span>
                                                {share.is_settled ? (
                                                    <span className="text-green-400 text-xs">{t('groups.settled')}</span>
                                                ) : share.user_id === user.id ? (
                                                    <button 
                                                        onClick={() => handleSettleShare(share.id)}
                                                        className="text-[#01C38D] hover:text-[#00b37e] text-xs"
                                                    >
                                                        {t('groups.settle')}
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">{t('groups.pending')}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <form onSubmit={handleAddExpense} className="border-t border-[#31344d] pt-4 space-y-4">
                        <h3 className="text-lg font-medium text-white">{t('groups.add_expense')}</h3>
                        
                        <div>
                            <label htmlFor="description" className="block text-white font-medium mb-2">{t('groups.description')}</label>
                            <input
                                type="text"
                                id="description"
                                value={expenseDescription}
                                onChange={(e) => setExpenseDescription(e.target.value)}
                                className="w-full px-4 py-2 bg-[#191E29] border border-[#31344d] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#01C38D] focus:border-transparent"
                                required
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="amount" className="block text-white font-medium mb-2">{t('groups.amount')}</label>
                            <input
                                type="number"
                                step="0.01"
                                id="amount"
                                value={expenseAmount}
                                onChange={(e) => setExpenseAmount(e.target.value)}
                                className="w-full px-4 py-2 bg-[#191E29] border border-[#31344d] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#01C38D] focus:border-transparent"
                                required
                            />
                        </div>
                        
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-white font-medium">{t('groups.split')}</h4>
                                <button
                                    type="button"
                                    onClick={autoSplitExpense}
                                    className="text-[#01C38D] hover:text-[#00b37e] text-sm"
                                >
                                    {t('groups.split_equally')}
                                </button>
                            </div>
                            <div className="space-y-2">
                                {shares.map(share => (
                                    <div key={share.user_id} className="flex items-center justify-between">
                                        <label className="text-gray-300 text-sm">{share.username}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={share.amount_owed}
                                            onChange={(e) => handleShareChange(share.user_id, e.target.value)}
                                            className="w-24 px-2 py-1 bg-[#191E29] border border-[#31344d] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#01C38D]"
                                            placeholder="0.00"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            className="w-full bg-[#01C38D] text-[#191E29] font-bold py-3 rounded-lg hover:bg-[#00b37e] transition-colors"
                        >
                            {t('groups.add_expense_button')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GroupPage; 
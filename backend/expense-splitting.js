
const createGroup = async (supabase, userId, name) => {
    const { data, error } = await supabase
        .from('groups')
        .insert([{ name, created_by: userId }])
        .select();
    if (error) throw error;
    return data[0];
};

const getGroups = async (supabase, userId) => {
    const { data, error } = await supabase
        .from('groups')
        .select(`
            *,
            group_members!inner(user_id)
        `)
        .eq('group_members.user_id', userId);
    if (error) throw error;
    return data;
};

const getGroupById = async (supabase, groupId) => {
    try {
        // First, get the basic group info
        const { data: group, error: groupError } = await supabase
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .single();

        if (groupError) {
            console.error('Error fetching group:', groupError);
            throw groupError;
        }

        // Get group members (just the user IDs)
        const { data: memberRecords, error: membersError } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', groupId);

        if (membersError) {
            console.error('Error fetching group members:', membersError);
            throw membersError;
        }

        // Get profile information for each member
        const members = [];
        for (const memberRecord of memberRecords) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, name')
                .eq('id', memberRecord.user_id)
                .single();

            if (profileError) {
                console.error('Error fetching profile for user:', memberRecord.user_id, profileError);
                // Continue with other members even if one fails
                continue;
            }

            members.push({
                user_id: memberRecord.user_id,
                profiles: profile
            });
        }

        // Get group expenses
        const { data: expenses, error: expensesError } = await supabase
            .from('group_expenses')
            .select('*')
            .eq('group_id', groupId);

        if (expensesError) {
            console.error('Error fetching group expenses:', expensesError);
            throw expensesError;
        }

        // For each expense, get the shares and payer info
        const expensesWithDetails = [];
        for (const expense of expenses) {
            // Get expense shares (just the basic data)
            const { data: shareRecords, error: sharesError } = await supabase
                .from('expense_shares')
                .select('*')
                .eq('expense_id', expense.id);

            if (sharesError) {
                console.error('Error fetching expense shares:', sharesError);
                continue;
            }

            // Get profile info for each share
            const shares = [];
            for (const shareRecord of shareRecords) {
                const { data: shareProfile, error: shareProfileError } = await supabase
                    .from('profiles')
                    .select('id, name')
                    .eq('id', shareRecord.user_id)
                    .single();

                if (shareProfileError) {
                    console.error('Error fetching profile for share user:', shareRecord.user_id, shareProfileError);
                    continue;
                }

                shares.push({
                    ...shareRecord,
                    profiles: shareProfile
                });
            }

            // Get payer info
            const { data: payer, error: payerError } = await supabase
                .from('profiles')
                .select('id, name')
                .eq('id', expense.paid_by)
                .single();

            if (payerError) {
                console.error('Error fetching payer info:', payerError);
                continue;
            }

            expensesWithDetails.push({
                ...expense,
                expense_shares: shares,
                profiles: payer
            });
        }

        // Combine everything
        const result = {
            ...group,
            group_members: members,
            group_expenses: expensesWithDetails
        };

        return result;
    } catch (error) {
        console.error('Error in getGroupById:', error);
        throw error;
    }
};

const updateGroup = async (supabase, groupId, name) => {
    const { data, error } = await supabase
        .from('groups')
        .update({ name })
        .eq('id', groupId)
        .select();
    if (error) throw error;
    return data[0];
};

const deleteGroup = async (supabase, groupId) => {
    const { data, error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);
    if (error) throw error;
    return data;
};

const searchUsers = async (supabase, query) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .ilike('email', `%${query}%`)
        .limit(10);
    if (error) throw error;
    return data;
};

const sendGroupInvitation = async (supabase, groupId, invitedByUserId, userEmail) => {
    // First, find the user by email
    const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('email', userEmail)
        .single();
    
    if (userError || !user) {
        throw new Error('User not found with that email address');
    }

    // Check if user is already a member
    const { data: existingMember, error: memberError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

    if (existingMember) {
        throw new Error('User is already a member of this group');
    }

    // Check if invitation already exists
    const { data: existingInvitation, error: invitationError } = await supabase
        .from('group_invitations')
        .select('status')
        .eq('group_id', groupId)
        .eq('invited_user', user.id)
        .single();

    if (existingInvitation) {
        if (existingInvitation.status === 'pending') {
            throw new Error('Invitation already sent to this user');
        } else if (existingInvitation.status === 'declined') {
            throw new Error('User has declined the invitation to this group');
        }
    }

    // Send invitation
    const { data, error } = await supabase
        .from('group_invitations')
        .insert([{
            group_id: groupId,
            invited_by: invitedByUserId,
            invited_user: user.id
        }])
        .select(`
            *,
            groups (name)
        `);

    if (error) throw error;
    
    // Get the inviter profile separately
    const { data: inviterProfile, error: profileError } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', invitedByUserId)
        .single();

    if (profileError) throw profileError;

    return { 
        invitation: {
            ...data[0],
            profiles: inviterProfile
        }, 
        invitedUser: user 
    };
};

const getPendingInvitations = async (supabase, userId) => {
    // First get the invitations (without join)
    const { data: invitations, error: invitationsError } = await supabase
        .from('group_invitations')
        .select('*')
        .eq('invited_user', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (invitationsError) throw invitationsError;

    if (!invitations || invitations.length === 0) {
        return [];
    }

    // Get group information separately
    const groupIds = invitations.map(inv => inv.group_id);
    const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('id, name')
        .in('id', groupIds);

    if (groupsError) {
        console.error('Error fetching groups for invitations:', groupsError);
        // Continue without group data rather than failing completely
    }

    // Get the profiles for the invited_by users
    const inviterIds = invitations.map(inv => inv.invited_by);
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', inviterIds);

    if (profilesError) {
        console.error('Error fetching profiles for invitations:', profilesError);
        // Continue without profile data rather than failing completely
    }

    // Create maps for easy lookup
    const groupsMap = (groups || []).reduce((acc, group) => {
        acc[group.id] = group;
        return acc;
    }, {});

    const profilesMap = (profiles || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
    }, {});

    // Combine the data
    return invitations.map(invitation => ({
        ...invitation,
        groups: groupsMap[invitation.group_id] || null,
        profiles: profilesMap[invitation.invited_by] || null
    }));
};

const respondToInvitation = async (supabase, invitationId, response) => {
    if (!['accepted', 'declined'].includes(response)) {
        throw new Error('Invalid response. Must be "accepted" or "declined"');
    }

    const { data, error } = await supabase
        .from('group_invitations')
        .update({ status: response })
        .eq('id', invitationId)
        .select(`
            *,
            groups (id, name)
        `);

    if (error) throw error;
    return data[0];
};

const addGroupMember = async (supabase, groupId, userName) => {
    // First, find the user by name to get their ID
    const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('name', userName)
        .single();
    if (userError || !user) throw new Error('User not found');

    const { data, error } = await supabase
        .from('group_members')
        .insert([{ group_id: groupId, user_id: user.id }]);
    if (error) throw error;
    return data;
};

const removeGroupMember = async (supabase, groupId, userId) => {
    const { data, error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);
    if (error) throw error;
    return data;
};

const addGroupExpense = async (supabase, groupId, description, amount, paidById, shares) => {
    // Insert the expense
    const { data: expense, error: expenseError } = await supabase
        .from('group_expenses')
        .insert([{ group_id: groupId, description, amount, paid_by: paidById }])
        .select()
        .single();
    if (expenseError) throw expenseError;

    // Insert the shares (exclude the payer since they've already paid their share)
    const shareData = shares
        .filter(share => share.user_id !== paidById)
        .map(share => ({
            expense_id: expense.id,
            user_id: share.user_id,
            amount_owed: share.amount_owed
        }));

    const { data: insertedShares, error: sharesError } = await supabase
        .from('expense_shares')
        .insert(shareData)
        .select();
    if (sharesError) {
        // If shares fail, roll back the expense insertion
        await supabase.from('group_expenses').delete().eq('id', expense.id);
        throw sharesError;
    }

    // Create a transaction for the payer (deduct the full expense amount from their balance)
    try {
        const { error: transactionError } = await supabase
            .from('transactions')
            .insert([{
                userId: paidById,
                description: `Group expense: ${description}`,
                amount: amount,
                category: 'Group Expenses',
                date: new Date().toISOString().split('T')[0],
                typeId: 1, // Expense type
                createdAt: new Date().toISOString()
            }]);
        
        if (transactionError) {
            console.error('Failed to create transaction for payer:', transactionError);
            // Don't fail the entire operation, just log the error
        }
    } catch (error) {
        console.error('Error creating payer transaction:', error);
    }

    return { ...expense, shares: insertedShares };
};

const updateGroupExpense = async (supabase, expenseId, description, amount, shares) => {
    // Update the expense
    const { data: expense, error: expenseError } = await supabase
        .from('group_expenses')
        .update({ description, amount })
        .eq('id', expenseId)
        .select()
        .single();
    if (expenseError) throw expenseError;

    // Delete old shares
    await supabase.from('expense_shares').delete().eq('expense_id', expenseId);

    // Insert new shares
    const shareData = shares.map(share => ({
        expense_id: expense.id,
        user_id: share.user_id,
        amount_owed: share.amount_owed
    }));
    const { data: insertedShares, error: sharesError } = await supabase
        .from('expense_shares')
        .insert(shareData)
        .select();
    if (sharesError) throw sharesError;

    return { ...expense, shares: insertedShares };
};

const deleteGroupExpense = async (supabase, expenseId) => {
    const { data, error } = await supabase
        .from('group_expenses')
        .delete()
        .eq('id', expenseId);
    if (error) throw error;
    return data;
};

const settleExpenseShare = async (supabase, shareId) => {
    // First get the share details with expense information
    const { data: shareWithExpense, error: fetchError } = await supabase
        .from('expense_shares')
        .select(`
            *,
            group_expenses (
                id,
                description,
                paid_by
            )
        `)
        .eq('id', shareId)
        .single();
    
    if (fetchError) throw fetchError;

    // Mark the share as settled
    const { data, error } = await supabase
        .from('expense_shares')
        .update({ is_settled: true })
        .eq('id', shareId)
        .select()
        .single();
    if (error) throw error;

    // Create transactions for the settlement
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Create an expense transaction for the person settling (they're paying their share)
        const { error: settlerTransactionError } = await supabase
            .from('transactions')
            .insert([{
                userId: shareWithExpense.user_id,
                description: `Group settlement: ${shareWithExpense.group_expenses.description}`,
                amount: shareWithExpense.amount_owed,
                category: 'Group Settlements',
                date: today,
                typeId: 1, // Expense type
                createdAt: new Date().toISOString()
            }]);
        
        if (settlerTransactionError) {
            console.error('Failed to create settler transaction:', settlerTransactionError);
        }

        // Create an income transaction for the person who originally paid (they're receiving money back)
        const { error: payerTransactionError } = await supabase
            .from('transactions')
            .insert([{
                userId: shareWithExpense.group_expenses.paid_by,
                description: `Group reimbursement: ${shareWithExpense.group_expenses.description}`,
                amount: shareWithExpense.amount_owed,
                category: 'Group Reimbursements',
                date: today,
                typeId: 2, // Income type
                createdAt: new Date().toISOString()
            }]);
        
        if (payerTransactionError) {
            console.error('Failed to create payer reimbursement transaction:', payerTransactionError);
        }
    } catch (error) {
        console.error('Error creating settlement transactions:', error);
        // Don't fail the settlement, just log the error
    }

    return data;
};

module.exports = {
    createGroup,
    getGroups,
    getGroupById,
    updateGroup,
    deleteGroup,
    searchUsers,
    sendGroupInvitation,
    getPendingInvitations,
    respondToInvitation,
    addGroupMember,
    removeGroupMember,
    addGroupExpense,
    updateGroupExpense,
    deleteGroupExpense,
    settleExpenseShare,
}; 
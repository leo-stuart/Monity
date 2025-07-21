
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGroups } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase';
import GroupInvitations from './GroupInvitations';

const Groups = () => {
    const { t } = useTranslation();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchGroups = async () => {
        try {
            if (user) {
                const fetchedGroups = await getGroups();
                setGroups(fetchedGroups || []);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();

        // Set up real-time subscriptions
        if (user) {
            // Subscribe to group changes for groups the user is a member of
            const groupsSubscription = supabase
                .channel('groups-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'groups'
                    },
                    () => {
                        fetchGroups(); // Refresh groups when any group changes
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'group_members'
                    },
                    () => {
                        fetchGroups(); // Refresh when memberships change
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(groupsSubscription);
            };
        }
    }, [user]);

    return (
        <div className="flex-1 p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">{t('groups.title')}</h1>
                <Link
                    to="/groups/create"
                    className="bg-[#01C38D] text-[#191E29] font-bold px-6 py-3 rounded-lg hover:bg-[#00b37e] transition-colors"
                >
                    {t('groups.create')}
                </Link>
            </div>

            {/* Group Invitations */}
            <GroupInvitations />

            <div className="bg-[#24293A] rounded-lg border border-[#31344d] overflow-hidden">
                {loading ? (
                    <div className="text-center text-gray-400 py-8">{t('groups.loading')}</div>
                ) : groups.length === 0 ? (
                    <div className="text-center text-gray-400 py-12">
                        <p className="text-lg mb-4">{t('groups.no_groups')}</p>
                        <Link
                            to="/groups/create"
                            className="inline-block bg-[#01C38D] text-[#191E29] font-bold px-6 py-3 rounded-lg hover:bg-[#00b37e] transition-colors"
                        >
                            {t('groups.create')}
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-[#31344d]">
                        {groups.map(group => (
                            <Link 
                                key={group.id} 
                                to={`/groups/${group.id}`} 
                                className="block p-6 hover:bg-[#31344d] transition-colors duration-200"
                            >
                                <h2 className="text-xl font-semibold text-white">{group.name}</h2>
                                <p className="text-gray-400 text-sm mt-1">Click to view details</p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Groups; 
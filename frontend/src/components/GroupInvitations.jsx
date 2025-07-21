import React, { useState, useEffect } from 'react';
import { getPendingInvitations, respondToInvitation } from '../utils/api';
import { useTranslation } from 'react-i18next';

const GroupInvitations = () => {
    const { t } = useTranslation();
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState({});

    const fetchInvitations = async () => {
        try {
            const data = await getPendingInvitations();
            setInvitations(data);
        } catch (error) {
            console.error('Error fetching invitations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    const handleResponse = async (invitationId, response) => {
        setResponding(prev => ({ ...prev, [invitationId]: true }));
        try {
            await respondToInvitation(invitationId, response);
            // Remove the invitation from the list
            setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        } catch (error) {
            console.error('Error responding to invitation:', error);
        } finally {
            setResponding(prev => ({ ...prev, [invitationId]: false }));
        }
    };

    if (loading) {
        return (
            <div className="bg-[#24293A] rounded-lg border border-[#31344d] p-6">
                <div className="text-center text-gray-400">{t('groups.loading')}</div>
            </div>
        );
    }

    if (invitations.length === 0) {
        return null; // Don't show anything if no invitations
    }

    return (
        <div className="bg-[#24293A] rounded-lg border border-[#31344d] p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
                {t('groups.pending_invitations')} ({invitations.length})
            </h2>
            <div className="space-y-4">
                {invitations.map(invitation => (
                    <div key={invitation.id} className="bg-[#191E29] rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-medium">
                                {invitation.groups?.name || t('groups.unknown_group')}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                {t('groups.invited_by')} {invitation.profiles?.name || t('groups.unknown_user')}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleResponse(invitation.id, 'accepted')}
                                disabled={responding[invitation.id]}
                                className="bg-[#01C38D] text-[#191E29] font-medium px-4 py-2 rounded-lg hover:bg-[#00b37e] transition-colors disabled:opacity-50"
                            >
                                {responding[invitation.id] ? t('groups.accepting') : t('groups.accept')}
                            </button>
                            <button
                                onClick={() => handleResponse(invitation.id, 'declined')}
                                disabled={responding[invitation.id]}
                                className="bg-red-500 text-white font-medium px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {responding[invitation.id] ? t('groups.declining') : t('groups.decline')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GroupInvitations; 
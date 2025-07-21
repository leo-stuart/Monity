
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGroup } from '../utils/api';
import { useTranslation } from 'react-i18next';

const CreateGroup = () => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await createGroup({ name });
            navigate('/groups');
        } catch (err) {
            setError(t('groups.create_fail'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 p-6">
            <div className="max-w-md mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8 text-center">{t('groups.create_title')}</h1>
                
                <div className="bg-[#24293A] rounded-lg border border-[#31344d] p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-white font-medium mb-2">
                                {t('groups.group_name')}
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-[#191E29] border border-[#31344d] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#01C38D] focus:border-transparent"
                                placeholder={t('groups.group_name')}
                                required
                            />
                        </div>
                        
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}
                        
                        <button
                            type="submit"
                            className="w-full bg-[#01C38D] text-[#191E29] font-bold px-4 py-3 rounded-lg hover:bg-[#00b37e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? t('groups.creating') : t('groups.create')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateGroup; 
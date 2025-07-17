import { useState } from 'react';
import apiClient from '../utils/api';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

function Settings() {
    const { t } = useTranslation();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        
        if (newPassword !== confirmNewPassword) {
            setError(t('settings.passwords_do_not_match'));
            setLoading(false);
            return;
        }

        try {
            const response = await apiClient.post('/change-password', {
                currentPassword,
                newPassword,
            });

            const data = response.data;
            
            if (response.status !== 200) {
                throw new Error(data.message || t('settings.failed_to_change_password'));
            }

            setSuccess(t('settings.password_changed_successfully'));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (err) {
            setError(err.message || t('settings.failed_to_change_password'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#23263a] p-4 md:p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-[#01C38D] mb-6">{t('settings.title')}</h2>
            {/* Language Toggle */}
            <div className="flex flex-col items-center mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">{t('settings.language_selection', 'Change Language')}</h3>
                <LanguageSwitcher />
            </div>
            {/* Password Change Section */}
            <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">{t('settings.change_password')}</h3>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && <p className="text-green-500 mb-4">{success}</p>}
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label htmlFor="currentPassword" className="block text-white mb-2">{t('settings.current_password')}</label>
                        <input
                            type="password"
                            id="currentPassword"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-3 focus:ring-[#01C38D] focus:border-[#01C38D]"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="newPassword" className="block text-white mb-2">{t('settings.new_password')}</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-3 focus:ring-[#01C38D] focus:border-[#01C38D]"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmNewPassword" className="block text-white mb-2">{t('settings.confirm_new_password')}</label>
                        <input
                            type="password"
                            id="confirmNewPassword"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-3 focus:ring-[#01C38D] focus:border-[#01C38D]"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#01C38D] to-[#01C38D]/80 text-white py-3 rounded-lg hover:from-[#01C38D]/90 hover:to-[#01C38D]/70 transition-all disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? t('settings.changing_password') : t('settings.change_password_button')}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Settings; 
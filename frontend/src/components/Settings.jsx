import { useState } from 'react';

function Settings() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            setError('New passwords do not match');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to change password');
            }

            setSuccess('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setError('');
        } catch (err) {
            setError('Failed to change password');
            setSuccess('');
        }
    };

    return (
        <div className="bg-[#23263a] p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-[#01C38D] mb-6">Settings</h2>
            
            {/* Password Change Section */}
            <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Change Password</h3>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && <p className="text-green-500 mb-4">{success}</p>}
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label htmlFor="currentPassword" className="block text-white mb-2">Current Password</label>
                        <input
                            type="password"
                            id="currentPassword"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-2.5 focus:ring-[#01C38D] focus:border-[#01C38D]"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="newPassword" className="block text-white mb-2">New Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-2.5 focus:ring-[#01C38D] focus:border-[#01C38D]"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmNewPassword" className="block text-white mb-2">Confirm New Password</label>
                        <input
                            type="password"
                            id="confirmNewPassword"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-2.5 focus:ring-[#01C38D] focus:border-[#01C38D]"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#01C38D] to-[#01C38D]/80 text-white py-2.5 rounded-lg hover:from-[#01C38D]/90 hover:to-[#01C38D]/70 transition-all"
                    >
                        Change Password
                    </button>
                </form>
            </div>

            {/* Account Settings Section */}
            <div>
                <h3 className="text-xl font-semibold text-white mb-4">Account Settings</h3>
                <div className="space-y-4">
                    <button
                        onClick={() => {/* Handle account deletion */}}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2.5 rounded-lg hover:from-red-600 hover:to-red-700 transition-all"
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Settings; 
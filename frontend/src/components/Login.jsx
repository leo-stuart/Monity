import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { useAuth } from '../context/AuthContext';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#191E29] p-4">
            {/* Monity Logo */}
            <div className="mb-8 text-center">
                <h1 className="text-5xl md:text-6xl font-bold text-[#01C38D]">Monity</h1>
                <p className="text-gray-400 mt-2 text-lg">Track your finances with ease</p>
            </div>

            {/* Login Card */}
            <div className="bg-[#23263a] p-6 md:p-8 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-3xl font-bold text-[#01C38D] mb-6 text-center">Welcome Back</h2>
                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-white mb-2">Email</label>
                        <input
                            type="email"
                            id="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-2.5 focus:ring-[#01C38D] focus:border-[#01C38D]"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-white mb-2">Password</label>
                        <input
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-2.5 focus:ring-[#01C38D] focus:border-[#01C38D]"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#01C38D] to-[#01C38D]/80 text-white py-2.5 rounded-lg hover:from-[#01C38D]/90 hover:to-[#01C38D]/70 transition-all disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="mt-4 text-center text-white">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-[#01C38D] hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Login; 
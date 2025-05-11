import { useState } from 'react';
import { Link } from 'react-router-dom';

function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            if (!response.ok) {
                throw new Error('Signup failed');
            }

            const data = await response.json();
            // Handle successful signup (e.g., redirect to login)
        } catch (err) {
            setError('Failed to create account');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#191E29]">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-[#01C38D]">Monity</h1>
                <p className="text-center text-gray-400 mt-2">Track your finances with ease</p>
            </div>
            <div className="bg-[#23263a] p-8 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-[#01C38D] mb-6 text-center">Create Account</h2>
                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-white mb-2">Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-2.5 focus:ring-[#01C38D] focus:border-[#01C38D]"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-white mb-2">Email</label>
                        <input
                            type="email"
                            id="email"
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
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-2.5 focus:ring-[#01C38D] focus:border-[#01C38D]"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-white mb-2">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-2.5 focus:ring-[#01C38D] focus:border-[#01C38D]"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#01C38D] to-[#01C38D]/80 text-white py-2.5 rounded-lg hover:from-[#01C38D]/90 hover:to-[#01C38D]/70 transition-all"
                    >
                        Sign Up
                    </button>
                </form>
                <p className="mt-4 text-center text-white">
                    Already have an account?{' '}
                    <Link to="/login" className="text-[#01C38D] hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Signup; 
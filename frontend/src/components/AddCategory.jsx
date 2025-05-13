import { useState } from 'react';
import { getToken } from '../utils/api';

function AddCategory() {
    const [categoryName, setCategoryName] = useState('');
    const [categoryType, setCategoryType] = useState('expense');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    

    const handleSubmit = async (e) => {
        e.preventDefault();
        let categoryId;
        if(categoryType === 'expense'){
            categoryId = 1
        } else if(categoryType === 'income'){
            categoryId = 2
        }
        try {
            const token = getToken();
            if (!token) {
                throw new Error('You must be logged in to add a category');
            }
            const response = await fetch('http://localhost:3001/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: categoryName, typeId: categoryId }),
            });

            if (!response.ok) {
                throw new Error('Failed to add category');
            }

            setSuccess('Category added successfully!');
            setCategoryName('');
            setError('');
            setCategoryType('expense');
        } catch (err) {
            setError('Failed to add category');
            setSuccess('');
        }
    };

    return (
        <div className="bg-[#23263a] p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-[#01C38D] mb-6">Add New Category</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {success && <p className="text-green-500 mb-4">{success}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="categoryName" className="block text-white mb-2">Category Name</label>
                    <input
                        type="text"
                        id="categoryName"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-2.5 focus:ring-[#01C38D] focus:border-[#01C38D]"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="categoryType" className="block text-white mb-2">Category Type</label>
                    <select
                        id="categoryType"
                        value={categoryType}
                        onChange={(e) => setCategoryType(e.target.value)}
                        className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-2.5 focus:ring-[#01C38D] focus:border-[#01C38D]"
                    >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                    </select>
                </div>
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#01C38D] to-[#01C38D]/80 text-white py-2.5 rounded-lg hover:from-[#01C38D]/90 hover:to-[#01C38D]/70 transition-all"
                >
                    Add Category
                </button>
            </form>
        </div>
    );
}

export default AddCategory; 
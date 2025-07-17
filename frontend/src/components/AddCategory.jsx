import { useState, useEffect } from 'react';
import { post, get, remove } from '../utils/api';
import { FaArrowTrendUp, FaArrowTrendDown } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';

function AddCategory() {
    const { t } = useTranslation();
    const [categoryName, setCategoryName] = useState('');
    const [categoryType, setCategoryType] = useState('expense');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await get('/categories');
                setCategories(data);
            } catch (err) {
                setError(t('addCategory.fetchError'));
            }
        };
        fetchCategories();
    }, [t]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        let categoryId;
        if(categoryType === 'expense'){
            categoryId = 1
        } else if(categoryType === 'income'){
            categoryId = 2
        }
        try {
            await post('/categories', { name: categoryName, typeId: categoryId });
            setSuccess(t('addCategory.addSuccess'));
            setCategoryName('');
            setError('');
            setCategoryType('expense');
            // Refresh categories list
            const { data } = await get('/categories');
            setCategories(data);
        } catch (err) {
            setError(t('addCategory.addError'));
            setSuccess('');
        }
    };

    const handleDelete = async (id) => {
        try {
            await remove(`/categories/${id}`);
            setSuccess(t('addCategory.deleteSuccess'));
            // Refresh categories list
            const { data } = await get('/categories');
            setCategories(data);
        } catch (err) {
            setError(t('addCategory.deleteError'));
            setSuccess('');
        }
    };

    return (
        <div className="flex flex-col gap-8 mt-2">
            <div className="bg-[#23263a] p-4 md:p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-[#01C38D] mb-6">{t('addCategory.title')}</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && <p className="text-green-500 mb-4">{success}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="categoryName" className="block text-white mb-2">{t('addCategory.categoryNameLabel')}</label>
                        <input
                            type="text"
                            id="categoryName"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-3 focus:ring-[#01C38D] focus:border-[#01C38D]"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="categoryType" className="block text-white mb-2">{t('addCategory.categoryTypeLabel')}</label>
                        <select
                            id="categoryType"
                            value={categoryType}
                            onChange={(e) => setCategoryType(e.target.value)}
                            className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-3 focus:ring-[#01C38D] focus:border-[#01C38D]"
                        >
                            <option value="expense">{t('addCategory.expenseOption')}</option>
                            <option value="income">{t('addCategory.incomeOption')}</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#01C38D] to-[#01C38D]/80 text-white py-3 rounded-lg hover:from-[#01C38D]/90 hover:to-[#01C38D]/70 transition-all"
                    >
                        {t('addCategory.addButton')}
                    </button>
                </form>
            </div>
            <div className="bg-[#23263a] p-4 md:p-6 rounded-xl shadow-lg mt-8">
                <h3 className="text-xl font-bold text-white mb-4">{t('addCategory.yourCategories')}</h3>
                <ul className="space-y-3">
                    {categories.map(category => (
                        <li key={category.id} className="flex justify-between items-center bg-[#191E29] p-3 rounded-lg">
                            <div className="flex items-center gap-3">
                                {category.typeId === 1 ? (
                                    <FaArrowTrendDown className="text-red-500 text-lg" />
                                ) : (
                                    <FaArrowTrendUp className="text-green-500 text-lg" />
                                )}
                                <span className="text-white">{category.name}</span>
                            </div>
                            <button
                                onClick={() => handleDelete(category.id)}
                                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors text-sm"
                            >
                                {t('addCategory.deleteButton')}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default AddCategory; 
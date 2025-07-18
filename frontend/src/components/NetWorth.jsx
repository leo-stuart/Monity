import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../utils/api';

const NetWorth = () => {
    const { t } = useTranslation();
    const [netWorth, setNetWorth] = useState(null);
    const [assets, setAssets] = useState([]);
    const [liabilities, setLiabilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [showAssetForm, setShowAssetForm] = useState(false);
    const [showLiabilityForm, setShowLiabilityForm] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [editingLiability, setEditingLiability] = useState(null);

    const fetchNetWorthData = async () => {
        setLoading(true);
        try {
            const [netWorthRes, assetsRes, liabilitiesRes] = await Promise.all([
                apiClient.get('/net-worth'),
                apiClient.get('/net-worth/assets'), // Assuming this endpoint exists
                apiClient.get('/net-worth/liabilities') // Assuming this endpoint exists
            ]);
            setNetWorth(netWorthRes.data);
            setAssets(assetsRes.data);
            setLiabilities(liabilitiesRes.data);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNetWorthData();
    }, []);

    const handleAddAsset = async (e) => {
        e.preventDefault();
        const { name, type, value } = e.target.elements;
        try {
            await apiClient.post('/net-worth/assets', { name: name.value, type: type.value, value: parseFloat(value.value) });
            fetchNetWorthData();
            setShowAssetForm(false);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
        }
    };
    
    // Add Liability Form
    const handleAddLiability = async (e) => {
        e.preventDefault();
        const { name, type, amount } = e.target.elements;
        try {
            await apiClient.post('/net-worth/liabilities', { name: name.value, type: type.value, amount: parseFloat(amount.value) });
            fetchNetWorthData();
            setShowLiabilityForm(false);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
        }
    };

    const handleUpdateAsset = async (e) => {
        e.preventDefault();
        const { name, type, value } = e.target.elements;
        try {
            await apiClient.put(`/net-worth/assets/${editingAsset.id}`, { name: name.value, type: type.value, value: parseFloat(value.value) });
            fetchNetWorthData();
            setEditingAsset(null);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
        }
    };

    const handleDeleteAsset = async (assetId) => {
        try {
            await apiClient.delete(`/net-worth/assets/${assetId}`);
            fetchNetWorthData();
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
        }
    };

    const handleUpdateLiability = async (e) => {
        e.preventDefault();
        const { name, type, amount } = e.target.elements;
        try {
            await apiClient.put(`/net-worth/liabilities/${editingLiability.id}`, { name: name.value, type: type.value, amount: parseFloat(amount.value) });
            fetchNetWorthData();
            setEditingLiability(null);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
        }
    };

    const handleDeleteLiability = async (liabilityId) => {
        try {
            await apiClient.delete(`/net-worth/liabilities/${liabilityId}`);
            fetchNetWorthData();
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="p-4 md:p-6 bg-[#23263a] rounded-xl shadow-lg text-white">
            <h2 className="text-xl md:text-2xl font-bold mb-4">{t('premium.net_worth_title')}</h2>
            {netWorth && (
                <div className="mb-4">
                    <p className="text-lg">Total Assets: <span className="text-green-400">${netWorth.totalAssets.toFixed(2)}</span></p>
                    <p className="text-lg">Total Liabilities: <span className="text-red-400">${netWorth.totalLiabilities.toFixed(2)}</span></p>
                    <p className="text-2xl font-bold">Net Worth: <span className="text-blue-400">${netWorth.netWorth.toFixed(2)}</span></p>
                </div>
            )}
            
            {/* Add Asset Form */}
            <button onClick={() => setShowAssetForm(!showAssetForm)} className="btn btn-primary mb-4">
                {showAssetForm ? 'Cancel' : 'Add Asset'}
            </button>
            {showAssetForm && (
                <form onSubmit={handleAddAsset} className="mb-4 p-4 bg-gray-800 rounded">
                    <input name="name" type="text" placeholder="Asset Name" required className="input input-bordered w-full mb-2" />
                    <input name="type" type="text" placeholder="Asset Type" required className="input input-bordered w-full mb-2" />
                    <input name="value" type="number" step="0.01" placeholder="Value" required className="input input-bordered w-full mb-2" />
                    <button type="submit" className="btn btn-secondary">Save Asset</button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {/* Assets Section */}
                <div>
                    <h3 className="text-xl font-bold mb-4">Assets</h3>
                    {/* ... add asset form ... */}
                    {editingAsset && (
                        <form onSubmit={handleUpdateAsset} className="mb-4 p-4 bg-gray-800 rounded">
                            <input name="name" type="text" defaultValue={editingAsset.name} required className="input input-bordered w-full mb-2" />
                            <input name="type" type="text" defaultValue={editingAsset.type} required className="input input-bordered w-full mb-2" />
                            <input name="value" type="number" step="0.01" defaultValue={editingAsset.value} required className="input input-bordered w-full mb-2" />
                            <button type="submit" className="btn btn-secondary mr-2">Update Asset</button>
                            <button onClick={() => setEditingAsset(null)} className="btn">Cancel</button>
                        </form>
                    )}
                    <ul>
                        {assets.map(asset => (
                            <li key={asset.id} className="mb-2 p-2 bg-gray-700 rounded flex justify-between items-center">
                                <span>{asset.name} ({asset.type}): ${asset.value.toFixed(2)}</span>
                                <div>
                                    <button onClick={() => setEditingAsset(asset)} className="btn btn-sm btn-info mr-2">Edit</button>
                                    <button onClick={() => handleDeleteAsset(asset.id)} className="btn btn-sm btn-danger">Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Liabilities Section */}
                <div>
                    <h3 className="text-xl font-bold mb-4">Liabilities</h3>
                    <button onClick={() => setShowLiabilityForm(!showLiabilityForm)} className="btn btn-primary mb-4">
                        {showLiabilityForm ? 'Cancel' : 'Add Liability'}
                    </button>
                    {showLiabilityForm && (
                        <form onSubmit={handleAddLiability} className="mb-4 p-4 bg-gray-800 rounded">
                            <input name="name" type="text" placeholder="Liability Name" required className="input input-bordered w-full mb-2" />
                            <input name="type" type="text" placeholder="Liability Type" required className="input input-bordered w-full mb-2" />
                            <input name="amount" type="number" step="0.01" placeholder="Amount" required className="input input-bordered w-full mb-2" />
                            <button type="submit" className="btn btn-secondary">Save Liability</button>
                        </form>
                    )}
                    {editingLiability && (
                        <form onSubmit={handleUpdateLiability} className="mb-4 p-4 bg-gray-800 rounded">
                            <input name="name" type="text" defaultValue={editingLiability.name} required className="input input-bordered w-full mb-2" />
                            <input name="type" type="text" defaultValue={editingLiability.type} required className="input input-bordered w-full mb-2" />
                            <input name="amount" type="number" step="0.01" defaultValue={editingLiability.amount} required className="input input-bordered w-full mb-2" />
                            <button type="submit" className="btn btn-secondary mr-2">Update Liability</button>
                            <button onClick={() => setEditingLiability(null)} className="btn">Cancel</button>
                        </form>
                    )}
                    <ul>
                        {liabilities.map(liability => (
                            <li key={liability.id} className="mb-2 p-2 bg-gray-700 rounded flex justify-between items-center">
                                <span>{liability.name} ({liability.type}): ${liability.amount.toFixed(2)}</span>
                                <div>
                                    <button onClick={() => setEditingLiability(liability)} className="btn btn-sm btn-info mr-2">Edit</button>
                                    <button onClick={() => handleDeleteLiability(liability.id)} className="btn btn-sm btn-danger">Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default NetWorth; 
import Spinner from "./Spinner"
import { useState, useEffect } from 'react';

function ExpensivePurchase(){
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('http://localhost:3000/list-expenses')
        .then(response => {
            if(!response.ok){
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
    
        .then(data => {
            setExpenses(data.data);
            setLoading(false);
        })
        .catch(error => {
            setError(error.message);
            setLoading(false);
        })
    }, []);

    
    if(loading){
        return <Spinner message="Loading the most expensive purchases ..." />
    }
    if(error){
        return <p>Error: {error}</p>
    }
    
    const topExpenses = expenses
    .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
    .slice(0,5)
    
    if(topExpenses.length === 0){
        return <p>No expenses found.</p>;
    }

    return (
        <>
            <table className="w-full text-left bg-[#23263a] text-white rounded-lg overflow-hidden">
                <thead>
                    <tr className="bg-[#191E29] text-[#FF6384]">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Actions</th>
                    </tr>
                </thead>
                <tbody>
                {topExpenses.map((expense, index) => (
                        <tr key={index} className="border-t border-[#31344d] hover:bg-[#2a2d44] transition-colors">
                            <td className="py-2 px-4">{expense.date}</td>
                            <td className="py-2 px-4">{expense.category}</td>
                            <td className="py-2 px-4">{expense.description}</td>
                            <td className="text-red-400 py-2 px-4">${expense.amount}</td>
                            <td className="py-2 px-4">
                                <button className="text-red-400 hover:text-red-300 font-semibold transition-colors" onClick={() => handleDelete(index)}>🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    )
}

export default ExpensivePurchase

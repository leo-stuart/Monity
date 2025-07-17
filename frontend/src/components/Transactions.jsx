import ListExpenses from "./ExpenseList";
import ListIncomes from "./IncomeList";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function Transactions() {
    const { t } = useTranslation();
    const [choice, setChoice] = useState(true);
    const handleChoice = () => {
        setChoice(!choice);
    }
    return (
        <div className="p-4 md:p-6 rounded-xl mt-4 md:mt-8 mx-auto max-w-5xl">
            <div className="flex justify-center items-center mb-6">
            <span className={`text-white mr-3 font-semibold ${choice ? 'text-[#01C38D]' : 'text-gray-400'}`}>{t('transactions.expenses')}</span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input onChange={handleChoice} type="checkbox" className="sr-only peer" />
                <div
                    className="group peer rounded-full duration-300 w-14 h-8 bg-[#23263a] ring-2 ring-[#31344d] after:duration-300 after:bg-red-500 peer-checked:after:bg-green-500 after:rounded-full after:absolute after:h-6 after:w-6 after:top-1 after:left-1 after:flex after:justify-center after:items-center peer-checked:after:translate-x-6 peer-hover:after:scale-95"
                ></div>
            </label>
            <span className={`text-white ml-3 font-semibold ${!choice ? 'text-[#01C38D]' : 'text-gray-400'}`}>{t('transactions.incomes')}</span>
            </div>
            <div className="p-0 md:p-6">
                {choice ? <ListExpenses /> : <ListIncomes />}
            </div>
        </div>
    )
}

export default Transactions
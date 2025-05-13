import ListExpenses from "./ExpenseList";
import ListIncomes from "./IncomeList";
import { useState } from "react";

function Transactions() {
    const [choice, setChoice] = useState(true);
    const handleChoice = () => {
        setChoice(!choice);
    }
    return (
        <div className="p-6 rounded-xl mt-8 mx-auto max-w-5xl">
            <div className="flex justify-center items-center">
            <span className="text-white mr-4">Expenses</span>
            <label class="relative inline-flex items-center cursor-pointer">
                <input onChange={handleChoice} type="checkbox" class="sr-only peer" />
                <div
                    class="group peer rounded-full duration-300 w-16 h-8 ring-2 ring-red-500 after:duration-300 after:bg-red-500 peer-checked:after:bg-green-500 peer-checked:ring-green-500 after:rounded-full after:absolute after:h-6 after:w-6 after:top-1 after:left-1 after:flex after:justify-center after:items-center peer-checked:after:translate-x-8 peer-hover:after:scale-95"
                ></div>
            </label>
            <span className="text-white ml-4">Incomes</span>
            </div>
            <div className="p-6">
                {choice ? <ListExpenses /> : <ListIncomes />}
            </div>
        </div>
    )
}

export default Transactions
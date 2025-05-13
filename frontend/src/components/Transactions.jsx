import ListExpenses from "./ExpenseList";
import ListIncomes from "./IncomeList";


function Transactions() {
    return (
        <div className="p-6 bg-[#23263a] rounded-xl shadow-lg mt-8 mx-auto max-w-5xl">
            <div className="p-6">
                <ListExpenses />
            </div>
            <div className="p-6 mt-6">
                <ListIncomes />
            </div>
        </div>
    )
}

export default Transactions
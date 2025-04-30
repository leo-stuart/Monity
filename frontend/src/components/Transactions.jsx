import ListExpenses from "./ExpenseList";
import ListIncomes from "./IncomeList";

function Transactions() {
    return (
        <div className="p-6">
            <div className="p-6">
                <ListExpenses />
            </div>
            <div className="p-6">
                <ListIncomes />
            </div>
        </div>
    )
}

export default Transactions
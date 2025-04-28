import { Link } from 'react-router-dom'

function NavBar() {
    return (
        <nav>
            <ul>
                <li><Link to="/">Dashboard</Link></li>
                <li><Link to="/list-incomes">List Incomes</Link></li>
                <li><Link to="/list-expenses">List Expenses</Link></li>
                <li><Link to="/add-expense">Add Expense</Link></li>
                <li><Link to="/add-income">Add Income</Link></li>
                <li><Link to="/balance">See Balance</Link></li>
                <li><Link to="/total-expenses">Total Expenses</Link></li>
            </ul>
        </nav>
    )
}

export default NavBar
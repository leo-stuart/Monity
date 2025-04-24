const [expenses, setExpenses] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

function ListExpenses(){
    
    useEffect(() => {
        fetch('http://localhost:3000/list-expenses')
        .then(response => response.json())
        .then(data => {
            setExpenses(data.data);
        })
        .catch(error => {
            console.error("Error fetching expenses:", error);
        })
    }, []);
    return (
        <ul>
            {expenses.map((expense, index) => (
                <li key={index}>
                    {expense.description} - ${expense.amount} ({expense.category}) on {expense.date}
                </li>
            ))}
        </ul>
    )
}
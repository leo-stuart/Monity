function Spinner({message}){
    return (
        <div style={{ textAlign: 'center', padding: '20px'}}>
            <div className="spinner"></div>
            <p>{message}</p>
        </div>
    )
}

export default Spinner
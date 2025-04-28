import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import ListExpenses from './components/ExpenseList'
import AddExpense from './components/AddExpense'
import AddIncome from './components/AddIncome'
import TotalExpenses from './components/TotalExpenses'
import ListIncomes from './components/IncomeList'
import Balance from './components/Balance'
import NavBar from './components/NavBar'
import Dashboard from './components/Dashboard'

function App() {
  return (
    <>
      <NavBar />
      <h1>Monity Tracker</h1>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/list-expenses" element={<ListExpenses />} />
        <Route path="/list-incomes" element={<ListIncomes />} />
        <Route path="/add-expense" element={<AddExpense />} />
        <Route path="/add-income" element={<AddIncome />} />
        <Route path="/balance" element={<Balance />} />
        <Route path="/total-expenses" element={<TotalExpenses />} />
      </Routes>
    </>
  )
}

export default App

import { useExpenses } from '../hooks/useExpenses';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';

function Dashboard() {
  const { 
    expenses, 
    addExpense, 
    removeExpense, 
    getTotal, 
    getAllCategories 
  } = useExpenses();

  const activeCategories = getAllCategories();

  return (
    <div className="container">
      <h1>💰 Mi Panel Fynz</h1>
      
      <ExpenseForm onAdd={addExpense} />

      {expenses.length === 0 ? (
        <p className="empty-message">No hay movimientos registrados</p>
      ) : (
        <div className="dashboard-content">
          <ExpenseList 
            categories={activeCategories} 
            expenses={expenses} 
            onRemove={removeExpense} 
          />
          
          <div className="total-container">
            <p className="total-label">Balance Total</p>
            <p className="total-amount">${getTotal().toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
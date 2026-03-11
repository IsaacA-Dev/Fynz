import React from 'react';

function ExpenseList({ expenses, onRemove, categories }) {
    return (
        <div className="expense-list">
            {expenses.map((expense) => (
                <div key={expense.id} className="expense-item">
                    <div className="expense-details">
                        <h3>{expense.name}</h3>
                        <span className="expense-category">{expense.category}</span>
                    </div>
                    <div className="expense-actions">
                        <span className="expense-amount">
                            ${parseFloat(expense.amount).toFixed(2)}
                        </span>
                        <button
                            onClick={() => onRemove(expense.id)}
                            className="remove-btn"
                        >
                            x
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default ExpenseList;

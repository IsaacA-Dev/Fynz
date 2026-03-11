import { useState, useEffect } from 'react';

export const useExpenses = () => {
    const [expenses, setExpenses] = useState(() => {
        const saved = localStorage.getItem('expenses');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }, [expenses]);

    const addExpense = (name, amountStr, category) => {
        const amount = parseFloat(amountStr);
        if (!name || isNaN(amount) || amount <= 0) return false;

        const newExpense = {
            id: Date.now().toString(),
            name,
            amount,
            category,
            date: new Date().toISOString()
        };

        setExpenses(prev => [newExpense, ...prev]);
        return true;
    };

    const removeExpense = (id) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
    };

    const getTotal = () => {
        return expenses.reduce((total, exp) => total + exp.amount, 0);
    };

    const getAllCategories = () => {
        const categories = new Set(expenses.map(e => e.category));
        return Array.from(categories);
    };

    return {
        expenses,
        addExpense,
        removeExpense,
        getTotal,
        getAllCategories
    };
};

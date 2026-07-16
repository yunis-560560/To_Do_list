import { useState, useEffect } from 'react';

export const useBudget = (userEmail) => {
  const profileKey = userEmail ? `budgetProfile_${userEmail}` : 'budgetProfile';
  const expensesKey = userEmail ? `expenses_${userEmail}` : 'expenses';

  const [budgetProfile, setBudgetProfile] = useState(() => {
    const saved = localStorage.getItem(profileKey);
    return saved ? JSON.parse(saved) : null;
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem(expensesKey);
    return saved ? JSON.parse(saved) : [];
  });

  // Load data when user changes
  useEffect(() => {
    const savedProfile = localStorage.getItem(profileKey);
    setBudgetProfile(savedProfile ? JSON.parse(savedProfile) : null);
    
    const savedExpenses = localStorage.getItem(expensesKey);
    setExpenses(savedExpenses ? JSON.parse(savedExpenses) : []);
  }, [profileKey, expensesKey]);

  const saveBudgetProfile = (profileData) => {
    const dataToSave = { ...profileData, setAt: new Date().toISOString() };
    setBudgetProfile(dataToSave);
    localStorage.setItem(profileKey, JSON.stringify(dataToSave));
  };

  const addExpense = (expenseData) => {
    const newExpense = {
      ...expenseData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    const newExpenses = [newExpense, ...expenses];
    setExpenses(newExpenses);
    localStorage.setItem(expensesKey, JSON.stringify(newExpenses));
    return true;
  };

  const updateExpense = (id, updatedData) => {
    const newExpenses = expenses.map(e => e.id === id ? { ...e, ...updatedData } : e);
    setExpenses(newExpenses);
    localStorage.setItem(expensesKey, JSON.stringify(newExpenses));
  };

  const deleteExpense = (id) => {
    const newExpenses = expenses.filter(e => e.id !== id);
    setExpenses(newExpenses);
    localStorage.setItem(expensesKey, JSON.stringify(newExpenses));
  };

  return {
    budgetProfile,
    saveBudgetProfile,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense
  };
};

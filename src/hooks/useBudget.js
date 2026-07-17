import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export const useBudget = (userId) => {
  const [budgetProfile, setBudgetProfile] = useState(null);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    if (!userId) {
      setBudgetProfile(null);
      setExpenses([]);
      return;
    }

    const fetchData = async () => {
      // Fetch budget profile
      const { data: profileData, error: profileError } = await supabase
        .from('budget_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (!profileError && profileData) {
        setBudgetProfile({
          userType: profileData.user_type,
          monthlyIncome: profileData.monthly_income,
          monthlyBudgetGoal: profileData.monthly_budget_goal,
        });
      }

      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!expensesError && expensesData) {
        // Map from DB schema back to camelCase for React components
        const mappedExpenses = expensesData.map(e => ({
          id: e.id,
          title: e.title,
          amount: e.amount,
          category: e.category,
          date: e.expense_date,
          createdAt: e.created_at
        }));
        setExpenses(mappedExpenses);
      }
    };

    fetchData();
  }, [userId]);

  const saveBudgetProfile = async (profileData) => {
    setBudgetProfile(profileData);
    
    // Upsert to Supabase
    await supabase.from('budget_profiles').upsert({
      user_id: userId,
      user_type: profileData.userType,
      monthly_income: profileData.monthlyIncome,
      monthly_budget_goal: profileData.monthlyBudgetGoal,
      updated_at: new Date().toISOString()
    });
  };

  const addExpense = async (expenseData) => {
    // Generate a temporary ID for optimistic UI
    const tempId = Math.random().toString(36).substr(2, 9);
    const newExpense = {
      ...expenseData,
      id: tempId,
      createdAt: new Date().toISOString()
    };
    
    setExpenses(prev => [newExpense, ...prev]);

    // Insert to Supabase
    const { data, error } = await supabase.from('expenses').insert({
      user_id: userId,
      title: expenseData.title,
      amount: expenseData.amount,
      category: expenseData.category,
      expense_date: expenseData.date
    }).select().single();

    if (!error && data) {
      // Swap temp ID with real ID
      setExpenses(current => current.map(e => e.id === tempId ? {
        ...e,
        id: data.id,
        createdAt: data.created_at
      } : e));
    }
    
    return true;
  };

  const updateExpense = async (id, updatedData) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updatedData } : e));
    
    const updatePayload = {};
    if (updatedData.title !== undefined) updatePayload.title = updatedData.title;
    if (updatedData.amount !== undefined) updatePayload.amount = updatedData.amount;
    if (updatedData.category !== undefined) updatePayload.category = updatedData.category;
    if (updatedData.date !== undefined) updatePayload.expense_date = updatedData.date;

    await supabase.from('expenses').update(updatePayload).eq('id', id);
  };

  const deleteExpense = async (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    await supabase.from('expenses').delete().eq('id', id);
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

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export const useBudget = (userId) => {
  const [budgetProfile, setBudgetProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setBudgetProfile(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      // Fetch budget profile
      const { data: profileData, error: profileError } = await supabase
        .from('budget_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (!profileError && profileData) {
        setBudgetProfile({
          userType: profileData.user_type,
          monthlyIncome: parseFloat(profileData.monthly_income) || 0,
          monthlyBudgetGoal: parseFloat(profileData.monthly_budget_goal) || 0,
        });
      }

      // Fetch all transactions (income and expense)
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false });

      if (!transError && transData) {
        // Map from DB schema back to camelCase for React components
        const mappedTrans = transData.map(t => ({
          id: t.id,
          type: t.type, // 'income' or 'expense'
          title: t.title,
          amount: parseFloat(t.amount) || 0,
          category: t.category,
          date: t.transaction_date,
          createdAt: t.created_at
        }));
        setTransactions(mappedTrans);
      }
      
      setLoading(false);
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

  const addTransaction = async (transData) => {
    // Generate a temporary ID for optimistic UI
    const tempId = Math.random().toString(36).substr(2, 9);
    const newTrans = {
      ...transData,
      id: tempId,
      createdAt: new Date().toISOString()
    };
    
    setTransactions(prev => [newTrans, ...prev]);

    // Insert to Supabase
    const { data, error } = await supabase.from('transactions').insert({
      user_id: userId,
      type: transData.type,
      title: transData.title || '',
      amount: transData.amount,
      category: transData.category || '',
      transaction_date: transData.date
    }).select().single();

    if (!error && data) {
      // Swap temp ID with real ID
      setTransactions(current => current.map(t => t.id === tempId ? {
        ...t,
        id: data.id,
        createdAt: data.created_at
      } : t));
    } else {
      console.error("Failed to add transaction:", error);
      // Revert optimistic insert on failure
      setTransactions(current => current.filter(t => t.id !== tempId));
      return false;
    }
    
    return true;
  };

  const updateTransaction = async (id, updatedData) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
    
    const updatePayload = {};
    if (updatedData.title !== undefined) updatePayload.title = updatedData.title;
    if (updatedData.amount !== undefined) updatePayload.amount = updatedData.amount;
    if (updatedData.category !== undefined) updatePayload.category = updatedData.category;
    if (updatedData.date !== undefined) updatePayload.transaction_date = updatedData.date;
    if (updatedData.type !== undefined) updatePayload.type = updatedData.type;

    await supabase.from('transactions').update(updatePayload).eq('id', id).eq('user_id', userId);
  };

  const deleteTransaction = async (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId);
  };

  return {
    loading,
    budgetProfile,
    saveBudgetProfile,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction
  };
};

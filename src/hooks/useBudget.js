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

      // ─── Fetch budget settings ───────────────────────────────────────────────
      // Table: budget_settings | Columns: user_id, category, monthly_goal, updated_at
      const { data: settingsData, error: settingsError } = await supabase
        .from('budget_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // safe: returns null (not error) when no row exists

      if (!settingsError && settingsData) {
        setBudgetProfile({
          userType:         settingsData.category,
          monthlyIncome:    parseFloat(settingsData.monthly_income) || 0,  // kept for UI compatibility
          monthlyBudgetGoal: parseFloat(settingsData.monthly_goal) || 0,
        });
      } else {
        if (settingsError) console.warn('[useBudget] settings fetch error:', settingsError.message);
        setBudgetProfile(null);
      }

      // ─── Fetch all transactions ───────────────────────────────────────────────
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false });

      if (!transError && transData) {
        const mappedTrans = transData.map(t => ({
          id:        t.id,
          type:      t.type,
          note:      t.note,
          amount:    parseFloat(t.amount) || 0,
          category:  t.category,
          date:      t.transaction_date,
          createdAt: t.created_at,
        }));
        setTransactions(mappedTrans);
      }

      setLoading(false);
    };

    fetchData();
  }, [userId]);

  // ─── Save / Update budget profile ──────────────────────────────────────────
  // Maps JS camelCase → actual DB column names in budget_settings
  const saveBudgetProfile = async (profileData) => {
    // Optimistic update — UI reflects change immediately
    setBudgetProfile(profileData);

    const { error } = await supabase
      .from('budget_settings')
      .upsert(
        {
          user_id:     userId,
          category:    profileData.userType,
          monthly_goal: profileData.monthlyBudgetGoal,
          updated_at:  new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('[useBudget] saveBudgetProfile error:', error.message);
      throw error; // let useAutoSave handle retries
    }
  };

  // ─── Add transaction ────────────────────────────────────────────────────────
  const addTransaction = async (transData) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    const newTrans = { ...transData, id: tempId, createdAt: new Date().toISOString() };

    setTransactions(prev => [newTrans, ...prev]);

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id:          userId,
        type:             transData.type,
        note:             transData.note || '',
        amount:           transData.amount,
        category:         transData.category || '',
        transaction_date: transData.date,
      })
      .select()
      .single();

    if (!error && data) {
      setTransactions(current =>
        current.map(t => t.id === tempId ? { ...t, id: data.id, createdAt: data.created_at } : t)
      );
      return { success: true };
    } else {
      console.error('[useBudget] addTransaction error:', error);
      setTransactions(current => current.filter(t => t.id !== tempId));
      return { success: false, error };
    }
  };

  // ─── Update transaction ─────────────────────────────────────────────────────
  const updateTransaction = async (id, updatedData) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));

    const updatePayload = {};
    if (updatedData.note     !== undefined) updatePayload.note             = updatedData.note;
    if (updatedData.amount   !== undefined) updatePayload.amount           = updatedData.amount;
    if (updatedData.category !== undefined) updatePayload.category         = updatedData.category;
    if (updatedData.date     !== undefined) updatePayload.transaction_date = updatedData.date;
    if (updatedData.type     !== undefined) updatePayload.type             = updatedData.type;

    await supabase.from('transactions').update(updatePayload).eq('id', id).eq('user_id', userId);
  };

  // ─── Delete transaction ─────────────────────────────────────────────────────
  const deleteTransaction = async (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId);
  };

  // ─── Clear ALL budget data ──────────────────────────────────────────────────
  const clearAllBudgetData = async () => {
    await supabase.from('transactions').delete().eq('user_id', userId);
    await supabase.from('budget_settings').delete().eq('user_id', userId);
    setTransactions([]);
    setBudgetProfile(null);
  };

  // ─── Clear only current month's data ───────────────────────────────────────
  const clearCurrentMonthData = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString().split('T')[0];

    await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId)
      .gte('transaction_date', startOfMonth)
      .lte('transaction_date', endOfMonth);

    // Also remove the settings row so user re-selects their category
    await supabase.from('budget_settings').delete().eq('user_id', userId);

    setTransactions(prev =>
      prev.filter(t => t.date < startOfMonth || t.date > endOfMonth)
    );
    setBudgetProfile(null);
  };

  return {
    loading,
    budgetProfile,
    saveBudgetProfile,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearAllBudgetData,
    clearCurrentMonthData,
  };
};

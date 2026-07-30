import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, setDoc, orderBy } from 'firebase/firestore';

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
      try {
        // Fetch budget settings
        const settingsRef = doc(db, 'budget_settings', userId);
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
          const settingsData = settingsSnap.data();
          setBudgetProfile({
            userType:         settingsData.category,
            monthlyIncome:    parseFloat(settingsData.monthly_income) || 0,
            monthlyBudgetGoal: parseFloat(settingsData.monthly_goal) || 0,
          });
        } else {
          setBudgetProfile(null);
        }

        // Fetch transactions
        const transQuery = query(
          collection(db, 'transactions'), 
          where('user_id', '==', userId),
          // Note: Firestore requires an index for ordering with a where clause.
          // For simplicity without requiring complex indexing on initial setup, we sort in memory:
        );
        
        const transSnap = await getDocs(transQuery);
        let mappedTrans = transSnap.docs.map(doc => {
          const t = doc.data();
          return {
            id:        doc.id,
            type:      t.type,
            note:      t.note,
            amount:    parseFloat(t.amount) || 0,
            category:  t.category,
            date:      t.transaction_date,
            createdAt: t.created_at,
          };
        });

        // Sort by date descending
        mappedTrans.sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(mappedTrans);

      } catch (error) {
        console.error('[useBudget] fetch error:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const saveBudgetProfile = async (profileData) => {
    setBudgetProfile(profileData);

    try {
      await setDoc(doc(db, 'budget_settings', userId), {
        user_id:     userId,
        category:    profileData.userType,
        monthly_goal: profileData.monthlyBudgetGoal,
        updated_at:  new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('[useBudget] saveBudgetProfile error:', error.message);
      throw error; 
    }
  };

  const addTransaction = async (transData) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    const newTrans = { ...transData, id: tempId, createdAt: new Date().toISOString() };

    setTransactions(prev => [newTrans, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));

    try {
      const docRef = await addDoc(collection(db, 'transactions'), {
        user_id:          userId,
        type:             transData.type,
        note:             transData.note || '',
        amount:           transData.amount,
        category:         transData.category || '',
        transaction_date: transData.date,
        created_at:       new Date().toISOString()
      });

      setTransactions(current =>
        current.map(t => t.id === tempId ? { ...t, id: docRef.id } : t)
      );
      return { success: true };
    } catch (error) {
      console.error('[useBudget] addTransaction error:', error);
      setTransactions(current => current.filter(t => t.id !== tempId));
      return { success: false, error };
    }
  };

  const updateTransaction = async (id, updatedData) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));

    const updatePayload = {};
    if (updatedData.note     !== undefined) updatePayload.note             = updatedData.note;
    if (updatedData.amount   !== undefined) updatePayload.amount           = updatedData.amount;
    if (updatedData.category !== undefined) updatePayload.category         = updatedData.category;
    if (updatedData.date     !== undefined) updatePayload.transaction_date = updatedData.date;
    if (updatedData.type     !== undefined) updatePayload.type             = updatedData.type;

    try {
      await updateDoc(doc(db, 'transactions', id), updatePayload);
    } catch (error) {
      console.error('[useBudget] updateTransaction error:', error);
    }
  };

  const deleteTransaction = async (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      console.error('[useBudget] deleteTransaction error:', error);
    }
  };

  const clearAllBudgetData = async () => {
    setTransactions([]);
    setBudgetProfile(null);
    
    try {
      await deleteDoc(doc(db, 'budget_settings', userId));
      
      const transQuery = query(collection(db, 'transactions'), where('user_id', '==', userId));
      const transSnap = await getDocs(transQuery);
      
      const deletePromises = transSnap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('[useBudget] clearAllBudgetData error:', error);
    }
  };

  const clearCurrentMonthData = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    setTransactions(prev => prev.filter(t => t.date < startOfMonth || t.date > endOfMonth));
    setBudgetProfile(null);

    try {
      await deleteDoc(doc(db, 'budget_settings', userId));
      
      const transQuery = query(
        collection(db, 'transactions'), 
        where('user_id', '==', userId),
        where('transaction_date', '>=', startOfMonth),
        where('transaction_date', '<=', endOfMonth)
      );
      const transSnap = await getDocs(transQuery);
      
      const deletePromises = transSnap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('[useBudget] clearCurrentMonthData error:', error);
    }
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

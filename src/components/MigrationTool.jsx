import React, { useState } from 'react';
import { supabaseTemp } from '../supabaseTemp';
import { db } from '../firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { useUser } from '../hooks/useUser';

const MigrationTool = () => {
  const { user } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMigrate = async (e) => {
    e.preventDefault();
    if (!user) {
      setStatus("Error: You must be logged into Firebase (the main app) first!");
      return;
    }

    setLoading(true);
    setStatus("Logging into Supabase...");

    try {
      // 1. Log into Supabase
      const { data: authData, error: authError } = await supabaseTemp.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw new Error("Supabase Login Failed: " + authError.message);
      
      const supabaseUserId = authData.user.id;
      setStatus("Authenticated with Supabase! Fetching data...");

      // 2. Fetch Data from Supabase
      const { data: habits, error: habitsErr } = await supabaseTemp.from('habits').select('*').eq('user_id', supabaseUserId);
      if (habitsErr) throw new Error("Failed to fetch habits: " + habitsErr.message);

      const { data: logs, error: logsErr } = await supabaseTemp.from('habit_logs').select('*').eq('user_id', supabaseUserId);
      if (logsErr) throw new Error("Failed to fetch habit logs: " + logsErr.message);

      const { data: budget, error: budgetErr } = await supabaseTemp.from('budget_settings').select('*').eq('user_id', supabaseUserId).maybeSingle();
      if (budgetErr) throw new Error("Failed to fetch budget: " + budgetErr.message);

      const { data: transactions, error: transErr } = await supabaseTemp.from('transactions').select('*').eq('user_id', supabaseUserId);
      if (transErr) throw new Error("Failed to fetch transactions: " + transErr.message);

      setStatus(`Fetched ${habits?.length || 0} habits, ${logs?.length || 0} logs, ${transactions?.length || 0} transactions. Migrating to Firebase...`);

      // 3. Write Data to Firebase using the CURRENT FIREBASE USER ID (user.id)
      const firebaseUserId = user.id;

      // Map of old habit IDs to new Firebase habit IDs
      const habitIdMap = {};

      for (const h of (habits || [])) {
        const docRef = await addDoc(collection(db, 'habits'), {
          user_id: firebaseUserId,
          name: h.name,
          emoji: h.emoji
        });
        habitIdMap[h.id] = docRef.id;
      }

      // Migrate logs
      for (const l of (logs || [])) {
        const newHabitId = habitIdMap[l.habit_id];
        if (!newHabitId) continue;

        const logDocId = `${firebaseUserId}_${newHabitId}_${l.log_date}`;
        await setDoc(doc(db, 'habit_logs', logDocId), {
          habit_id: newHabitId,
          user_id: firebaseUserId,
          log_date: l.log_date
        });
      }

      // Migrate Budget Settings
      if (budget) {
        await setDoc(doc(db, 'budget_settings', firebaseUserId), {
          user_id: firebaseUserId,
          category: budget.category,
          monthly_goal: budget.monthly_goal,
          updated_at: new Date().toISOString()
        }, { merge: true });
      }

      // Migrate Transactions
      for (const t of (transactions || [])) {
        await addDoc(collection(db, 'transactions'), {
          user_id: firebaseUserId,
          type: t.type,
          note: t.note || '',
          amount: t.amount,
          category: t.category || '',
          transaction_date: t.transaction_date,
          created_at: t.created_at || new Date().toISOString()
        });
      }

      setStatus("Migration Complete! 🎉 You can now refresh the app and view your data.");
    } catch (error) {
      console.error(error);
      setStatus("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-zinc-900 border border-zinc-700 rounded-xl mt-10">
      <h2 className="text-2xl font-bold text-white mb-4">Data Migration Tool</h2>
      <p className="text-zinc-400 mb-6 text-sm">
        Enter your old Supabase email and password to securely download your data and transfer it to your new Firebase account.
      </p>

      <form onSubmit={handleMigrate} className="flex flex-col gap-4">
        <input 
          type="email" 
          placeholder="Supabase Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
          required
        />
        <input 
          type="password" 
          placeholder="Supabase Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg mt-2 disabled:opacity-50"
        >
          {loading ? 'Migrating...' : 'Migrate to Firebase'}
        </button>
      </form>

      {status && (
        <div className="mt-6 p-4 bg-black border border-zinc-700 rounded-lg text-sm text-zinc-300">
          {status}
        </div>
      )}
    </div>
  );
};

export default MigrationTool;

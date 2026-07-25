import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GraduationCap, Briefcase, Building2, Plus, ArrowRight, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useBudget } from '../hooks/useBudget';
import { useAutoSave } from '../hooks/useAutoSave';
import BudgetDashboard from './BudgetDashboard';
import AppLoader from './AppLoader';

/* ─────────────────────────────────────────────────────────────
   USER TYPE DEFINITIONS
───────────────────────────────────────────────────────────── */
const USER_TYPES = [
  { id: 'student',  label: 'Student',        icon: GraduationCap, prompt: 'Monthly allowance/pocket money amount' },
  { id: 'employee', label: 'Employee',        icon: Briefcase,     prompt: 'Monthly salary/income' },
  { id: 'business', label: 'Business Owner',  icon: Building2,     prompt: 'Average monthly business income' },
  { id: 'other',    label: 'Other',           icon: Plus,          prompt: 'Monthly income amount' },
];

/* ─────────────────────────────────────────────────────────────
   SAVE STATUS BADGE
   Shows a small indicator in the top-right corner of the card
───────────────────────────────────────────────────────────── */
const SaveStatusBadge = ({ status }) => {
  const configs = {
    idle:    null, // hidden
    pending: {
      icon: <Clock size={13} className="text-zinc-400" />,
      label: 'Unsaved changes',
      cls: 'bg-zinc-800 border-zinc-700 text-zinc-400',
    },
    saving: {
      icon: <Loader2 size={13} className="text-orange-400 animate-spin" />,
      label: 'Saving…',
      cls: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    },
    saved: {
      icon: <CheckCircle2 size={13} className="text-emerald-400" />,
      label: 'Saved',
      cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    },
    error: {
      icon: <AlertCircle size={13} className="text-red-400" />,
      label: 'Save failed — Retrying…',
      cls: 'bg-red-500/10 border-red-500/30 text-red-400',
    },
  };

  const cfg = configs[status];
  if (!cfg) return null;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold
        transition-all duration-300 select-none
        ${cfg.cls}
      `}
      style={{ animation: 'badgeFadeIn 0.2s ease' }}
    >
      {cfg.icon}
      {cfg.label}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   UNSAVED CHANGES DIALOG  (in-app navigation guard)
───────────────────────────────────────────────────────────── */
const UnsavedChangesDialog = ({ onSave, onDiscard, onCancel, isSaving }) => (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    style={{ animation: 'fadeIn 0.15s ease' }}
  >
    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onCancel} />
    <div
      className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm p-7"
      style={{ animation: 'scaleIn 0.18s ease' }}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/30 mx-auto mb-4">
        <Clock size={22} className="text-orange-400" />
      </div>
      <h3 className="text-lg font-bold text-white text-center mb-2">Unsaved Changes</h3>
      <p className="text-zinc-400 text-sm text-center mb-6">
        You have unsaved changes.<br />
        Do you want to save before leaving?
      </p>
      <div className="flex flex-col gap-2">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.3)] disabled:opacity-60"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
          {isSaving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onDiscard}
          disabled={isSaving}
          className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-bold transition-colors disabled:opacity-50"
        >
          Discard
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="w-full py-2.5 rounded-xl text-zinc-500 hover:text-zinc-300 font-medium transition-colors text-sm disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   BUDGET MODULE — main component
───────────────────────────────────────────────────────────── */
const BudgetModule = ({ userId, onRegisterSaveNow, onPendingChange }) => {
  const {
    loading,
    budgetProfile,
    saveBudgetProfile,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearAllBudgetData,
    clearCurrentMonthData,
  } = useBudget(userId);

  /* ── Setup form state ── */
  const [isEditingSetup, setIsEditingSetup] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [income, setIncome] = useState('');
  const [goal, setGoal] = useState('');

  /* ── Unsaved changes guard ── */
  const [unsavedDialog, setUnsavedDialog] = useState(null); // null | { onConfirm, onDiscard }
  const [isDialogSaving, setIsDialogSaving] = useState(false);

  /* ── Build the save function that persists the current form state ── */
  // We keep a ref to the latest form values so the auto-save callback
  // always reads fresh data without needing to be recreated.
  const formRef = useRef({ selectedType: null, income: '', goal: '' });
  useEffect(() => {
    formRef.current = { selectedType, income, goal };
  }, [selectedType, income, goal]);

  const saveCurrentProfile = useCallback(async () => {
    const { selectedType: st, income: inc, goal: g } = formRef.current;
    // Require at minimum a category and goal — income is UI-only, not stored in budget_settings
    if (!st || !g) return;
    await saveBudgetProfile({
      userType: st.id,
      monthlyIncome: parseFloat(inc) || 0, // kept in local state for UI, not stored in DB
      monthlyBudgetGoal: parseFloat(g),
    });
  }, [saveBudgetProfile]);

  /* ── Auto-save hook ── */
  const { saveStatus, hasPendingChanges, markDirty, saveNow, resetStatus } =
    useAutoSave(saveCurrentProfile);

  // Register saveNow and hasPendingChanges with parent (App.jsx) for the guard
  useEffect(() => {
    if (onRegisterSaveNow) onRegisterSaveNow(saveNow);
  }, [saveNow, onRegisterSaveNow]);

  useEffect(() => {
    if (onPendingChange) onPendingChange(hasPendingChanges);
  }, [hasPendingChanges, onPendingChange]);

  /* ── Pre-fill form when existing profile loads ── */
  useEffect(() => {
    if (budgetProfile) {
      const match = USER_TYPES.find(t => t.id === budgetProfile.userType);
      setSelectedType(match || null);
      // income is not stored in DB — keep whatever the user typed, or leave blank
      // goal comes from budget_settings.monthly_goal
      setGoal(budgetProfile.monthlyBudgetGoal > 0 ? String(budgetProfile.monthlyBudgetGoal) : '');
      setIsEditingSetup(false);
    }
  }, [budgetProfile]);

  /* ── beforeunload: native browser guard when there are pending changes ── */
  useEffect(() => {
    const handler = (e) => {
      if (hasPendingChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasPendingChanges]);

  /* ── Form field change handlers — each calls markDirty ── */
  const handleTypeSelect = (type) => {
    setSelectedType(type);
    markDirty();
  };
  const handleIncomeChange = (val) => {
    setIncome(val);
    markDirty();
  };
  const handleGoalChange = (val) => {
    setGoal(val);
    markDirty();
  };

  /* ── Setup form submit (manual) ── */
  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    if (!selectedType || !goal) return; // income is optional (not stored)
    await saveNow();
    setIsEditingSetup(false);
  };

  /* ── Dashboard callbacks ── */
  const handleGoToSetup = () => setIsEditingSetup(true);

  const handleClearAll = async () => {
    await clearAllBudgetData();
    resetStatus();
  };
  const handleClearMonth = async () => {
    await clearCurrentMonthData();
    resetStatus();
  };

  /* ── View logic ── */
  const showSetup     = !loading && (!budgetProfile || isEditingSetup);
  const showDashboard = !loading && budgetProfile && !isEditingSetup;

  return (
    <>
      <AppLoader isLoading={loading} text="Loading budget data…" />

      {/* ── BUDGET SETUP ── */}
      {showSetup && (
        <div
          className="bg-zinc-900 rounded-xl shadow-xl border border-zinc-800 p-8 max-w-3xl mx-auto mt-6"
          style={{ animation: 'fadeSlideIn 0.25s ease' }}
        >
          {/* Header row with save badge */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-wider text-white">
              BUDGET <span className="text-orange-500">SETUP</span>
            </h2>
            <SaveStatusBadge status={saveStatus} />
          </div>
          <p className="text-zinc-400 -mt-5 mb-8 text-center">Let's personalize your financial dashboard.</p>

          <form onSubmit={handleSetupSubmit} className="space-y-8">
            {/* Category grid */}
            <div>
              <label className="block text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4 text-center">
                Which category best describes you?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {USER_TYPES.map(type => {
                  const Icon = type.icon;
                  const isSelected = selectedType?.id === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleTypeSelect(type)}
                      className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'bg-orange-500/10 border-orange-500 text-orange-500 scale-105 shadow-[0_0_20px_rgba(249,115,22,0.15)]'
                          : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                      }`}
                    >
                      <Icon size={32} className="mb-3" />
                      <span className="font-bold text-sm">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Income + Goal fields */}
            {selectedType && (
              <div className="bg-black p-6 rounded-xl border border-zinc-800 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    {selectedType.prompt}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-zinc-500 font-bold pointer-events-none">₹</span>
                    <input
                      type="number"
                      required
                      value={income}
                      onChange={e => handleIncomeChange(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-lg pl-10 pr-4 py-3 text-white outline-none transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Set your Monthly Budget Goal
                  </label>
                  <p className="text-xs text-zinc-500 mb-2">How much do you intend to spend this month? (This becomes your limit)</p>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-zinc-500 font-bold pointer-events-none">₹</span>
                    <input
                      type="number"
                      required
                      value={goal}
                      onChange={e => handleGoalChange(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-lg pl-10 pr-4 py-3 text-white outline-none transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between gap-4">
                  {budgetProfile && (
                    <button
                      type="button"
                      onClick={() => setIsEditingSetup(false)}
                      className="text-sm text-zinc-400 hover:text-white transition-colors underline underline-offset-2"
                    >
                      Cancel — keep current settings
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!income || !goal || saveStatus === 'saving'}
                    className="ml-auto flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] hover:scale-[1.03] active:scale-[0.98]"
                  >
                    {saveStatus === 'saving'
                      ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                      : <>{budgetProfile ? 'SAVE CHANGES' : 'COMPLETE SETUP'} <ArrowRight size={18} /></>
                    }
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ── BUDGET DASHBOARD ── */}
      {showDashboard && (
        <BudgetDashboard
          budgetProfile={budgetProfile}
          transactions={transactions}
          addTransaction={addTransaction}
          updateTransaction={updateTransaction}
          deleteTransaction={deleteTransaction}
          onGoToSetup={handleGoToSetup}
          onClearAllData={handleClearAll}
          onClearMonthData={handleClearMonth}
          onSaveNow={saveNow}
          saveStatus={saveStatus}
        />
      )}

      {/* ── UNSAVED CHANGES DIALOG ── */}
      {unsavedDialog && (
        <UnsavedChangesDialog
          isSaving={isDialogSaving}
          onSave={async () => {
            setIsDialogSaving(true);
            try {
              await saveNow();
              unsavedDialog.onConfirm();
            } finally {
              setIsDialogSaving(false);
              setUnsavedDialog(null);
            }
          }}
          onDiscard={() => {
            resetStatus();
            unsavedDialog.onConfirm();
            setUnsavedDialog(null);
          }}
          onCancel={() => setUnsavedDialog(null)}
        />
      )}

      {/* ── GLOBAL ANIMATIONS ── */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes badgeFadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </>
  );
};

export default BudgetModule;

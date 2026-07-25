/**
 * useAutoSave
 * ──────────────────────────────────────────────────────────────
 * A reusable hook that wraps any async save function with:
 *  - 2-second debounce auto-save
 *  - saveStatus: 'idle' | 'pending' | 'saving' | 'saved' | 'error'
 *  - markDirty()  — call whenever tracked data changes
 *  - saveNow()    — immediate manual save, cancels pending debounce
 *  - hasPendingChanges — true when there is unsaved data
 *  - retryCount   — how many consecutive retries have failed
 */

import { useState, useRef, useCallback, useEffect } from 'react';

const DEBOUNCE_MS = 2000;
const MAX_RETRIES = 3;
const SAVED_RESET_MS = 3000; // how long "Saved" badge stays visible

export const useAutoSave = (saveFn) => {
  // 'idle' | 'pending' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState('idle');
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  const debounceTimer = useRef(null);
  const resetTimer = useRef(null);
  const retryCount = useRef(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      clearTimeout(debounceTimer.current);
      clearTimeout(resetTimer.current);
    };
  }, []);

  // Internal perform-save with retry
  const performSave = useCallback(async (attempt = 0) => {
    if (!isMounted.current) return;
    setSaveStatus('saving');

    try {
      await saveFn();
      if (!isMounted.current) return;
      retryCount.current = 0;
      setSaveStatus('saved');
      setHasPendingChanges(false);

      // Auto-reset to 'idle' after SAVED_RESET_MS
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        if (isMounted.current) setSaveStatus('idle');
      }, SAVED_RESET_MS);
    } catch (err) {
      if (!isMounted.current) return;
      const nextAttempt = attempt + 1;
      if (nextAttempt < MAX_RETRIES) {
        // Retry with exponential backoff
        retryCount.current = nextAttempt;
        setSaveStatus('error');
        setTimeout(() => performSave(nextAttempt), 2000 * nextAttempt);
      } else {
        retryCount.current = 0;
        setSaveStatus('error');
        console.error('[useAutoSave] Save failed after retries:', err);
      }
    }
  }, [saveFn]);

  /**
   * markDirty — call whenever the user changes data.
   * Schedules a debounced auto-save.
   */
  const markDirty = useCallback(() => {
    setHasPendingChanges(true);
    setSaveStatus('pending');

    // Clear any existing timer and start fresh
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      performSave(0);
    }, DEBOUNCE_MS);
  }, [performSave]);

  /**
   * saveNow — immediately save, cancelling any pending debounce.
   */
  const saveNow = useCallback(async () => {
    clearTimeout(debounceTimer.current);
    await performSave(0);
  }, [performSave]);

  /**
   * resetStatus — e.g. after clearing budget data
   */
  const resetStatus = useCallback(() => {
    clearTimeout(debounceTimer.current);
    clearTimeout(resetTimer.current);
    setSaveStatus('idle');
    setHasPendingChanges(false);
    retryCount.current = 0;
  }, []);

  return {
    saveStatus,       // 'idle' | 'pending' | 'saving' | 'saved' | 'error'
    hasPendingChanges,
    markDirty,
    saveNow,
    resetStatus,
  };
};

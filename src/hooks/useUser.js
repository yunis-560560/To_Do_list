import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export const useUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const signup = async (userData) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
        }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const updateProfile = async (updatedData) => {
    const updatePayload = {};
    if (updatedData.name) {
      updatePayload.data = { name: updatedData.name };
    }
    if (updatedData.password) {
      updatePayload.password = updatedData.password;
    }
    
    const { error } = await supabase.auth.updateUser(updatePayload);
    
    if (error) {
      console.error("Update error:", error);
      return false;
    }
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const requestPasswordReset = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    
    if (error) {
      console.error("Password reset error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  // With Supabase, the user is redirected back to the site with a hash containing the access token.
  // The session is automatically established by onAuthStateChange.
  // For the custom UI you had (validateResetToken, confirmPasswordReset), 
  // Supabase handles the token validation implicitly when they return via the link.
  // So we just mock validateResetToken as always true if they are logged in or if there is a hash, 
  // but for simplicity, let's just use the standard Supabase flow:
  // When they come back with the recovery link, they are logged in, and can just call updateProfile with new password.
  
  const validateResetToken = (token) => {
    // In Supabase, tokens are processed by the client library automatically via the URL hash.
    // If they have a session, we can let them reset.
    return true;
  };

  const confirmPasswordReset = async (token, newPassword) => {
    // With Supabase, after clicking the reset link, they are signed in and can update their password.
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error(error);
      return false;
    }
    return true;
  };

  return {
    user: user ? { 
      email: user.email, 
      name: user.user_metadata?.name || 'User',
      id: user.id 
    } : null,
    loading,
    login,
    signup,
    updateProfile,
    logout,
    requestPasswordReset,
    validateResetToken,
    confirmPasswordReset
  };
};

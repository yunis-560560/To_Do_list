import { useState } from 'react';
import emailjs from '@emailjs/browser';

export const useUser = () => {
  const [user, setUser] = useState(() => {
    const sessionEmail = localStorage.getItem('futuremind_session');
    if (sessionEmail) {
      const savedAccounts = JSON.parse(localStorage.getItem('futuremind_accounts') || '[]');
      const activeUser = savedAccounts.find(u => u.email === sessionEmail);
      return activeUser || null;
    }
    return null;
  });

  const login = (email, password) => {
    // Check lockout status
    const lockoutData = JSON.parse(localStorage.getItem('futuremind_lockout') || '{}');
    const now = Date.now();
    const attempts = lockoutData[email] || { count: 0, firstAttempt: now };

    if (attempts.count >= 5) {
      if (now - attempts.firstAttempt < 10 * 60 * 1000) { // 10 minutes
        return { success: false, error: "Too many attempts. Try again in a few minutes." };
      } else {
        // Reset after 10 mins
        attempts.count = 0;
        attempts.firstAttempt = now;
      }
    }

    const savedAccounts = JSON.parse(localStorage.getItem('futuremind_accounts') || '[]');
    const existingUser = savedAccounts.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!existingUser) {
      return { success: false, error: "No account found with this email. Try signing up." };
    }

    if (existingUser.passwordHash === btoa(password)) {
      // Success, clear attempts
      delete lockoutData[email];
      localStorage.setItem('futuremind_lockout', JSON.stringify(lockoutData));
      
      localStorage.setItem('futuremind_session', existingUser.email);
      setUser(existingUser);
      return { success: true };
    } else {
      // Failed password
      if (attempts.count === 0) attempts.firstAttempt = now;
      attempts.count += 1;
      lockoutData[email] = attempts;
      localStorage.setItem('futuremind_lockout', JSON.stringify(lockoutData));
      
      return { success: false, error: "Incorrect password. Try again." };
    }
  };

  const signup = (userData) => {
    const savedAccounts = JSON.parse(localStorage.getItem('futuremind_accounts') || '[]');
    
    // Check if email already exists
    if (savedAccounts.some(u => u.email.toLowerCase() === userData.email.trim().toLowerCase())) {
      return { success: false, error: "An account with this email already exists." };
    }

    const newUser = {
      ...userData,
      email: userData.email.trim().toLowerCase(), // normalize email
      name: userData.name.trim(),
      passwordHash: btoa(userData.password), // Mock hash
      createdAt: new Date().toISOString()
    };
    delete newUser.password;
    delete newUser.confirmPassword;

    savedAccounts.push(newUser);
    localStorage.setItem('futuremind_accounts', JSON.stringify(savedAccounts));
    localStorage.setItem('futuremind_session', newUser.email);
    setUser(newUser);
    return { success: true };
  };

  const updateProfile = (updatedData) => {
    if (!user) return false;
    
    let savedAccounts = JSON.parse(localStorage.getItem('futuremind_accounts') || '[]');
    const userIndex = savedAccounts.findIndex(u => u.email === user.email);
    
    if (userIndex !== -1) {
      const newUser = { ...savedAccounts[userIndex], ...updatedData };
      if (updatedData.password) {
        newUser.passwordHash = btoa(updatedData.password);
        delete newUser.password;
      }
      
      savedAccounts[userIndex] = newUser;
      localStorage.setItem('futuremind_accounts', JSON.stringify(savedAccounts));
      
      // If email was changed, update session
      if (updatedData.email && updatedData.email !== user.email) {
        localStorage.setItem('futuremind_session', updatedData.email);
      }
      
      setUser(newUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('futuremind_session');
    setUser(null);
  };

  const requestPasswordReset = async (email) => {
    let savedAccounts = JSON.parse(localStorage.getItem('futuremind_accounts') || '[]');
    const userIndex = savedAccounts.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    
    // Always return success to prevent email enumeration attacks
    if (userIndex === -1) return { success: true };

    // Generate token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expires = Date.now() + 30 * 60 * 1000; // 30 mins

    savedAccounts[userIndex].resetToken = token;
    savedAccounts[userIndex].resetExpires = expires;
    localStorage.setItem('futuremind_accounts', JSON.stringify(savedAccounts));

    const resetLink = `${window.location.origin}/?resetToken=${token}`;

    try {
      const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (SERVICE_ID) {
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
          to_email: email,
          reset_link: resetLink,
        }, PUBLIC_KEY);
      } else {
        // Fallback for local testing if keys aren't set
        console.log("===============================================");
        console.log("Mock Email Sent to: " + email);
        console.log("Reset Link: " + resetLink);
        console.log("===============================================");
      }
      return { success: true };
    } catch (error) {
      console.error("Failed to send email:", error);
      return { success: false, error: "Couldn't send reset email, please try again." };
    }
  };

  const validateResetToken = (token) => {
    if (!token) return false;
    const savedAccounts = JSON.parse(localStorage.getItem('futuremind_accounts') || '[]');
    const user = savedAccounts.find(u => u.resetToken === token);
    
    if (!user) return false;
    if (Date.now() > user.resetExpires) return false;
    
    return true;
  };

  const confirmPasswordReset = (token, newPassword) => {
    let savedAccounts = JSON.parse(localStorage.getItem('futuremind_accounts') || '[]');
    const userIndex = savedAccounts.findIndex(u => u.resetToken === token);
    
    if (userIndex === -1) return false;
    if (Date.now() > savedAccounts[userIndex].resetExpires) return false;

    savedAccounts[userIndex].passwordHash = btoa(newPassword);
    delete savedAccounts[userIndex].resetToken;
    delete savedAccounts[userIndex].resetExpires;
    
    localStorage.setItem('futuremind_accounts', JSON.stringify(savedAccounts));
    return true;
  };

  return {
    user,
    login,
    signup,
    updateProfile,
    logout,
    requestPasswordReset,
    validateResetToken,
    confirmPasswordReset
  };
};

import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export const useUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch custom profile data from Firestore
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: userData.name || 'User',
              gender: userData.gender || 'Male',
              age: userData.age || '',
              weight: userData.weight || '',
              weightUnit: userData.weightUnit || 'kg',
              height: userData.height || '',
              heightUnit: userData.heightUnit || 'cm',
              profile_image: userData.profile_image || null,
            });
          } else {
            // Fallback if no profile doc exists
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: 'User'
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser({ id: firebaseUser.uid, email: firebaseUser.email, name: 'User' });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const firebaseUser = userCredential.user;

      // Save custom fields to Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        name: userData.name,
        gender: userData.gender || 'Male',
        age: userData.age || null,
        weight: userData.weight || null,
        weightUnit: userData.weightUnit || 'kg',
        height: userData.height || null,
        heightUnit: userData.heightUnit || 'cm',
        profile_image: userData.profile_image || null
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async (updatedData) => {
    if (!auth.currentUser) return { success: false, error: "Not logged in" };
    
    try {
      const updatePayload = {};
      const fieldsToUpdate = ['name', 'gender', 'age', 'weight', 'weightUnit', 'height', 'heightUnit', 'profile_image'];

      fieldsToUpdate.forEach(field => {
        if (updatedData[field] !== undefined) {
          updatePayload[field] = updatedData[field];
        }
      });

      if (Object.keys(updatePayload).length > 0) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), updatePayload);
        
        // Update local state
        setUser(prev => ({ ...prev, ...updatePayload }));
      }

      if (updatedData.password) {
        await updatePassword(auth.currentUser, updatedData.password);
      }

      return { success: true };
    } catch (error) {
      console.error("Update error:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const requestPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error("Password reset error:", error);
      return { success: false, error: error.message };
    }
  };

  const validateResetToken = async (token) => {
    try {
      if (token) {
        await verifyPasswordResetCode(auth, token);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const confirmPasswordReset = async (token, newPassword) => {
    try {
      if (token) {
        await firebaseConfirmPasswordReset(auth, token, newPassword);
      } else if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      } else {
        return false;
      }
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  return {
    user,
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

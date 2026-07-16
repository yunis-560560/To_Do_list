import React, { useState, useEffect } from 'react';
import { Gamepad2, Eye, EyeOff, Loader2 } from 'lucide-react';

const Auth = ({ user, onSignup, onLogin, onUpdate, onCancelEdit, onRequestPasswordReset, onValidateResetToken, onConfirmPasswordReset }) => {
  const isEditing = !!user;
  const [isLogin, setIsLogin] = useState(false);
  
  // Password Reset Flow States
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [isResetTokenValid, setIsResetTokenValid] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    age: user?.age || '',
    weight: user?.weight || '',
    weightUnit: user?.weightUnit || 'kg',
    height: user?.height || '',
    heightUnit: user?.heightUnit || 'cm',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Check for reset token in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resetToken');
    if (token) {
      setResetToken(token);
      const isValid = onValidateResetToken(token);
      setIsResetTokenValid(isValid);
      if (!isValid) {
        setErrors({ form: "This reset link has expired. Request a new one." });
      }
    }
  }, [onValidateResetToken]);

  const handleTabSwitch = (toLogin) => {
    setIsLogin(toLogin);
    setIsRequestingReset(false);
    setResetSent(false);
    setErrors({});
    setTouched({});
    if (!isEditing) {
      setFormData({
        name: '', email: '', age: '', weight: '', weightUnit: 'kg',
        height: '', heightUnit: 'cm', password: '', confirmPassword: ''
      });
    }
  };

  const validateField = (name, value, currentFormData = formData) => {
    let error = null;

    switch (name) {
      case 'name':
        if (!isLogin || isEditing) {
          if (!value.trim()) error = "Please enter your full name.";
          else if (value.trim().length < 2) error = "Name must be at least 2 characters.";
          else if (!/^[a-zA-Z\s-]+$/.test(value)) error = "Name can only contain letters, spaces, and hyphens.";
        }
        break;
      case 'email':
        if (!value.trim()) error = "Enter a valid email address.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Enter a valid email address.";
        break;
      case 'age':
        if (!isLogin && !isRequestingReset && !resetToken) {
          if (!value) error = "Age must be between 5 and 120.";
          else {
            const ageNum = parseInt(value, 10);
            if (isNaN(ageNum) || ageNum < 5 || ageNum > 120) error = "Age must be between 5 and 120.";
          }
        }
        break;
      case 'weight':
        if (!isLogin && !isRequestingReset && !resetToken) {
          if (!value) error = "Enter a valid weight.";
          else {
            const wNum = parseFloat(value);
            if (isNaN(wNum) || wNum <= 0 || wNum > 1000) error = "Enter a valid weight.";
          }
        }
        break;
      case 'height':
        if (!isLogin && !isRequestingReset && !resetToken) {
          if (!value) error = "Enter a valid height.";
          else {
            const hNum = parseFloat(value);
            if (isNaN(hNum) || hNum <= 0 || hNum > 400) error = "Enter a valid height.";
          }
        }
        break;
      case 'password':
        if (resetToken || (!isEditing && !isLogin) || (isEditing && value)) {
          if (value.length < 8 || !/\d/.test(value)) {
            error = "Password must be at least 8 characters and include a number.";
          }
        } else if (isLogin && !isRequestingReset && !resetToken && !value) {
          error = "Enter your password.";
        }
        break;
      case 'confirmPassword':
        if (resetToken || (!isLogin && !isEditing) || (isEditing && currentFormData.password)) {
          if (value !== currentFormData.password) error = "Passwords do not match.";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    
    if (errors[name]) {
      const error = validateField(name, value, newFormData);
      setErrors(prev => ({ ...prev, [name]: error }));
    }

    if (name === 'password' && (resetToken || !isLogin || isEditing) && touched.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: validateField('confirmPassword', newFormData.confirmPassword, newFormData) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value, formData);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateAll = () => {
    const newErrors = {};
    const fieldsToValidate = [];
    
    if (resetToken) {
      fieldsToValidate.push('password', 'confirmPassword');
    } else if (isRequestingReset) {
      fieldsToValidate.push('email');
    } else if (isLogin) {
      fieldsToValidate.push('email', 'password');
    } else {
      fieldsToValidate.push('name', 'email', 'age', 'weight', 'height', 'password', 'confirmPassword');
    }

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    
    const newTouched = {};
    fieldsToValidate.forEach(f => newTouched[f] = true);
    setTouched(prev => ({ ...prev, ...newTouched }));

    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { text: '', color: 'bg-transparent' };
    if (pwd.length < 8 || !/\d/.test(pwd)) return { text: 'Weak', color: 'bg-red-500' };
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd) && /[A-Z]/.test(pwd)) return { text: 'Strong', color: 'bg-green-500' };
    return { text: 'Medium', color: 'bg-yellow-500' };
  };
  const pwdStrength = getPasswordStrength(formData.password);

  const isFormValid = () => {
    const fields = [];
    if (resetToken) fields.push('password', 'confirmPassword');
    else if (isRequestingReset) fields.push('email');
    else if (isLogin) fields.push('email', 'password');
    else fields.push('name', 'email', 'age', 'weight', 'height', 'password', 'confirmPassword');
    
    return fields.every(field => {
      if (!formData[field] && (field !== 'password' || !isEditing)) return false;
      return !validateField(field, formData[field], formData);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll() || isSubmitting) return;

    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 600));

    try {
      if (resetToken) {
        if (!isResetTokenValid) return; // Prevent submit if invalid token
        const success = onConfirmPasswordReset(resetToken, formData.password);
        if (success) {
          window.history.replaceState({}, document.title, "/"); // Clear URL
          setResetToken(null);
          setIsLogin(true);
          setFormData({ ...formData, password: '', confirmPassword: '' });
          setTouched({});
          alert("Password updated, please log in.");
        } else {
          setErrors({ form: "Failed to reset password. Link may have expired." });
        }
      } else if (isRequestingReset) {
        const result = await onRequestPasswordReset(formData.email);
        if (result.success) {
          setResetSent(true);
        } else {
          setErrors({ form: result.error || "An error occurred." });
        }
      } else if (isEditing) {
        onUpdate(formData);
        onCancelEdit();
      } else if (isLogin) {
        const result = onLogin(formData.email, formData.password);
        if (!result.success) {
          setErrors({ form: result.error });
        }
      } else {
        const result = onSignup(formData);
        if (!result.success) {
          setErrors({ form: result.error || "An error occurred during signup." });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${isEditing ? 'w-full py-8' : 'min-h-screen p-6'} bg-black flex flex-col items-center justify-center text-zinc-100 font-sans`}>
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 p-8">
        
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-orange-500/20 rounded-xl text-orange-500 mb-4">
            <Gamepad2 size={40} />
          </div>
          <h1 className="text-3xl font-bold tracking-wider text-white">
            FUTURE<span className="text-orange-500">MIND</span>
          </h1>
          <p className="text-zinc-500 mt-2 text-sm text-center">
            {resetToken ? 'Set New Password' 
              : isRequestingReset ? 'Password Recovery' 
              : isEditing ? 'Update your profile' 
              : isLogin ? 'Welcome back to the game' 
              : 'Create your character profile'}
          </p>
        </div>

        {!isEditing && !isRequestingReset && !resetToken && (
          <div className="flex w-full mb-6 bg-zinc-800 rounded-lg overflow-hidden">
            <button 
              type="button"
              className={`flex-1 py-3 text-sm font-bold transition-colors ${isLogin ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:bg-zinc-700'}`}
              onClick={() => handleTabSwitch(true)}
            >
              LOG IN
            </button>
            <button 
              type="button"
              className={`flex-1 py-3 text-sm font-bold transition-colors ${!isLogin ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:bg-zinc-700'}`}
              onClick={() => handleTabSwitch(false)}
            >
              SIGN UP
            </button>
          </div>
        )}

        {errors.form && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg mb-6 text-sm text-center font-bold">
            {errors.form}
            {resetToken && !isResetTokenValid && (
              <button 
                onClick={() => {
                  window.history.replaceState({}, document.title, "/");
                  setResetToken(null);
                  setIsRequestingReset(true);
                  setErrors({});
                }}
                className="block mx-auto mt-2 text-orange-500 underline"
              >
                Back to Password Reset
              </button>
            )}
          </div>
        )}
        
        {resetSent && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-3 rounded-lg mb-6 text-sm text-center font-bold">
            If this email is registered, a reset link has been sent. Check your inbox (or console if testing locally).
          </div>
        )}

        {(!resetToken || isResetTokenValid) && !resetSent && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            {(!isLogin || isEditing) && !isRequestingReset && !resetToken && (
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full bg-black border rounded-lg px-4 py-2 text-white outline-none transition-colors ${errors.name && touched.name ? 'border-red-500' : 'border-zinc-800 focus:border-orange-500'}`}
                  placeholder="e.g. John Doe"
                />
                {errors.name && touched.name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.name}</p>}
              </div>
            )}

            {/* Email */}
            {!resetToken && (
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Email</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full bg-black border rounded-lg px-4 py-2 text-white outline-none transition-colors ${errors.email && touched.email ? 'border-red-500' : 'border-zinc-800 focus:border-orange-500'}`}
                  placeholder="e.g. you@example.com"
                />
                {errors.email && touched.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email}</p>}
              </div>
            )}

            {!isLogin && !isRequestingReset && !resetToken && (
              <>
                {/* Age */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Age</label>
                  <input 
                    type="number" 
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full bg-black border rounded-lg px-4 py-2 text-white outline-none transition-colors ${errors.age && touched.age ? 'border-red-500' : 'border-zinc-800 focus:border-orange-500'}`}
                    placeholder="e.g. 25"
                  />
                  {errors.age && touched.age && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.age}</p>}
                </div>

                {/* Weight & Height Row */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Weight</label>
                    <div className="flex">
                      <input 
                        type="number" 
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full bg-black border border-r-0 rounded-l-lg px-3 py-2 text-white outline-none transition-colors ${errors.weight && touched.weight ? 'border-red-500' : 'border-zinc-800 focus:border-orange-500'}`}
                      />
                      <select 
                        name="weightUnit" 
                        value={formData.weightUnit} 
                        onChange={handleChange}
                        className={`bg-zinc-800 border-y border-r rounded-r-lg px-2 text-sm text-zinc-300 outline-none transition-colors ${errors.weight && touched.weight ? 'border-red-500' : 'border-zinc-800 focus:border-orange-500'}`}
                      >
                        <option value="kg">kg</option>
                        <option value="lb">lb</option>
                      </select>
                    </div>
                    {errors.weight && touched.weight && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.weight}</p>}
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Height</label>
                    <div className="flex">
                      <input 
                        type="number" 
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full bg-black border border-r-0 rounded-l-lg px-3 py-2 text-white outline-none transition-colors ${errors.height && touched.height ? 'border-red-500' : 'border-zinc-800 focus:border-orange-500'}`}
                      />
                      <select 
                        name="heightUnit" 
                        value={formData.heightUnit} 
                        onChange={handleChange}
                        className={`bg-zinc-800 border-y border-r rounded-r-lg px-2 text-sm text-zinc-300 outline-none transition-colors ${errors.height && touched.height ? 'border-red-500' : 'border-zinc-800 focus:border-orange-500'}`}
                      >
                        <option value="cm">cm</option>
                        <option value="ft">ft-in</option>
                      </select>
                    </div>
                    {errors.height && touched.height && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.height}</p>}
                  </div>
                </div>
              </>
            )}

            {/* Password */}
            {!isRequestingReset && (
              <div>
                <div className="flex justify-between mb-1">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">{resetToken ? 'New Password' : 'Password'}</label>
                  {isLogin && !isEditing && !resetToken && (
                    <button 
                      type="button" 
                      onClick={() => { setIsRequestingReset(true); setErrors({}); setTouched({}); }}
                      className="text-xs text-orange-500 hover:text-orange-400 transition-colors font-bold"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full bg-black border rounded-lg pl-4 pr-10 py-2 text-white outline-none transition-colors ${errors.password && touched.password ? 'border-red-500' : 'border-zinc-800 focus:border-orange-500'}`}
                    placeholder={(!isLogin || resetToken) ? "Min. 8 characters" : "Enter password"}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && touched.password && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.password}</p>}
                
                {/* Password Strength Indicator */}
                {(!isLogin || resetToken || isEditing) && formData.password.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${pwdStrength.color}`} style={{ width: pwdStrength.text === 'Weak' ? '33%' : pwdStrength.text === 'Medium' ? '66%' : '100%' }}></div>
                    </div>
                    <span className={`text-xs font-bold ${pwdStrength.text === 'Weak' ? 'text-red-500' : pwdStrength.text === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                      {pwdStrength.text}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Confirm Password */}
            {(!isLogin || resetToken || (isEditing && formData.password)) && !isRequestingReset && (
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Confirm Password</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full bg-black border rounded-lg px-4 py-2 text-white outline-none transition-colors ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : 'border-zinc-800 focus:border-orange-500'}`}
                />
                {errors.confirmPassword && touched.confirmPassword && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.confirmPassword}</p>}
              </div>
            )}

            <div className="flex gap-4 mt-6">
              {(isEditing || isRequestingReset) && (
                <button 
                  type="button" 
                  onClick={() => {
                    if (isRequestingReset) setIsRequestingReset(false);
                    else onCancelEdit();
                    setErrors({});
                    setTouched({});
                  }}
                  className="w-1/3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  CANCEL
                </button>
              )}
              <button 
                type="submit" 
                disabled={isSubmitting || !isFormValid()}
                className={`flex items-center justify-center font-bold py-3 px-4 rounded-lg transition-all 
                  ${(isEditing || isRequestingReset) ? 'w-2/3' : 'w-full'}
                  ${isSubmitting || !isFormValid() 
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]'
                  }`}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  resetToken ? 'RESET PASSWORD' : (isRequestingReset ? 'SEND RESET LINK' : (isEditing ? 'SAVE CHANGES' : (isLogin ? 'LOG IN' : 'CREATE ACCOUNT')))
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;

import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Loader2, Camera, Upload, X, Check, User } from 'lucide-react';
import AvatarEditor from 'react-avatar-editor';
import logo from '../assets/logo.png';

const defaultMaleAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f97316' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";
const defaultFemaleAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f97316' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3Cpath d='M15 7c0 2.5-3 5-3 5s-3-2.5-3-5'/%3E%3C/svg%3E";
const defaultNeutralAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";

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
    gender: user?.gender || 'Male',
    age: user?.age || '',
    weight: user?.weight || '',
    weightUnit: user?.weightUnit || 'kg',
    height: user?.height || '',
    heightUnit: user?.heightUnit || 'cm',
    password: '',
    confirmPassword: '',
    profile_image: user?.profile_image || null
  });

  useEffect(() => {
    if (user && isEditing) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        gender: user.gender || 'Male',
        age: user.age || '',
        weight: user.weight || '',
        weightUnit: user.weightUnit || 'kg',
        height: user.height || '',
        heightUnit: user.heightUnit || 'cm',
        profile_image: user.profile_image || null
      }));
    }
  }, [user, isEditing]);

  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [touched, setTouched] = useState({});

  // Image Upload States
  const [uploadFile, setUploadFile] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropScale, setCropScale] = useState(1.2);
  const editorRef = useRef(null);

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
        name: '', email: '', gender: 'Male', age: '', weight: '', weightUnit: 'kg',
        height: '', heightUnit: 'cm', password: '', confirmPassword: '', profile_image: null
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
            if (isNaN(wNum) || wNum <= 0 || wNum > 500) error = "Enter a valid weight.";
          }
        }
        break;
      case 'height':
        if (!isLogin && !isRequestingReset && !resetToken) {
          if (!value) error = "Enter a valid height.";
          else {
            const hNum = parseFloat(value);
            if (currentFormData.heightUnit === 'ft') {
              if (isNaN(hNum) || hNum <= 2 || hNum > 10) error = "Height must be between 2 and 10 ft.";
            } else {
              if (isNaN(hNum) || hNum <= 30 || hNum > 300) error = "Height must be between 30 and 300 cm.";
            }
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
    
    if (name === 'heightUnit' && touched.height) {
      setErrors(prev => ({ ...prev, height: validateField('height', newFormData.height, newFormData) }));
    }
    if (name === 'weightUnit' && touched.weight) {
      setErrors(prev => ({ ...prev, weight: validateField('weight', newFormData.weight, newFormData) }));
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
    } else if (isEditing) {
      fieldsToValidate.push('name', 'email', 'age', 'weight', 'height', 'password', 'confirmPassword');
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
    else if (isEditing) fields.push('name', 'email', 'age', 'weight', 'height', 'password', 'confirmPassword');
    else if (isLogin) fields.push('email', 'password');
    else fields.push('name', 'email', 'age', 'weight', 'height', 'password', 'confirmPassword');
    
    return fields.every(field => {
      if (!formData[field] && !(isEditing && (field === 'password' || field === 'confirmPassword'))) return false;
      return !validateField(field, formData[field], formData);
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      setUploadFile(file);
      setIsCropping(true);
    }
  };

  const handleSaveCrop = () => {
    if (editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas();
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      setFormData(prev => ({ ...prev, profile_image: base64Image }));
      setIsCropping(false);
      setUploadFile(null);
    }
  };

  const getAvatar = () => {
    if (formData.profile_image) return formData.profile_image;
    if (formData.gender === 'Male') return defaultMaleAvatar;
    if (formData.gender === 'Female') return defaultFemaleAvatar;
    return defaultNeutralAvatar;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll() || isSubmitting) return;

    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 600));

    try {
      if (resetToken) {
        if (!isResetTokenValid) return;
        const success = onConfirmPasswordReset(resetToken, formData.password);
        if (success) {
          window.history.replaceState({}, document.title, "/"); 
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
        const result = await onUpdate(formData);
        if (result.success) {
          setSuccessMsg("Profile updated successfully.");
          setErrors({});
          setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        } else {
          setErrors({ form: result.error || "Unable to update profile. Please try again." });
          setSuccessMsg("");
        }
      } else if (isLogin) {
        const result = await onLogin(formData.email, formData.password);
        if (!result.success) {
          setErrors({ form: result.error });
        }
      } else {
        const result = await onSignup(formData);
        if (!result.success) {
          setErrors({ form: result.error || "An error occurred during signup." });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // PROFILE DASHBOARD LAYOUT (when isEditing is true)
  if (isEditing) {
    return (
      <div className="w-full py-4 text-zinc-100 font-sans max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* LEFT SIDE: Profile Photo */}
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 shadow-xl w-full flex flex-col items-center text-center relative">
              <h2 className="text-xl font-bold mb-6 text-white w-full text-left">Profile Photo</h2>
              
              <div className="relative group w-[150px] h-[150px] mb-6">
                <img 
                  src={getAvatar()} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full border-4 border-zinc-800 shadow-lg transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer" onClick={() => document.getElementById('image-upload').click()}>
                  <Camera className="text-white mb-1" size={24} />
                  <span className="text-xs font-bold text-white">Upload</span>
                </div>
              </div>

              <input 
                type="file" 
                id="image-upload" 
                accept="image/jpeg, image/png, image/webp" 
                className="hidden" 
                onChange={handleImageChange}
              />
              
              <div className="flex flex-col gap-3 w-full">
                <button 
                  type="button"
                  onClick={() => document.getElementById('image-upload').click()}
                  className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={16} /> Change Photo
                </button>
                {formData.profile_image && (
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, profile_image: null }))}
                    className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-bold transition-colors"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: User Information & Security */}
          <div className="w-full md:w-2/3 flex flex-col gap-6">
            
            {errors.form && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl text-sm text-center font-bold shadow-lg">
                {errors.form}
              </div>
            )}
            
            {successMsg && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-3 rounded-xl text-sm text-center font-bold shadow-lg">
                {successMsg}
              </div>
            )}

            <form id="profile-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* User Information Card */}
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h2 className="text-xl font-bold mb-6 text-white">User Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.1)] transition-all"
                    />
                    {errors.name && touched.name && <p className="text-red-500 text-xs font-semibold">{errors.name}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email (Read Only)</label>
                    <input 
                      type="email" value={formData.email} disabled
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-zinc-500 outline-none cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Gender</label>
                    <div className="flex bg-black border border-zinc-800 rounded-xl overflow-hidden p-1">
                      <button type="button" onClick={() => setFormData({...formData, gender: 'Male'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${formData.gender === 'Male' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Male</button>
                      <button type="button" onClick={() => setFormData({...formData, gender: 'Female'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${formData.gender === 'Female' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Female</button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Age</label>
                    <input 
                      type="number" name="age" value={formData.age} onChange={handleChange} onBlur={handleBlur}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.1)] transition-all"
                    />
                    {errors.age && touched.age && <p className="text-red-500 text-xs font-semibold">{errors.age}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Weight</label>
                    <div className="flex">
                      <input 
                        type="number" name="weight" value={formData.weight} onChange={handleChange} onBlur={handleBlur}
                        className="w-full bg-black border border-zinc-800 border-r-0 rounded-l-xl px-4 py-3 text-white outline-none focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.1)] transition-all"
                      />
                      <select 
                        name="weightUnit" value={formData.weightUnit} onChange={handleChange}
                        className="bg-zinc-800 border-y border-r border-zinc-800 rounded-r-xl px-3 text-sm font-bold text-zinc-300 outline-none"
                      >
                        <option value="kg">kg</option>
                        <option value="lb">lb</option>
                      </select>
                    </div>
                    {errors.weight && touched.weight && <p className="text-red-500 text-xs font-semibold">{errors.weight}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Height</label>
                    <div className="flex">
                      <input 
                        type="number" name="height" value={formData.height} onChange={handleChange} onBlur={handleBlur}
                        className="w-full bg-black border border-zinc-800 border-r-0 rounded-l-xl px-4 py-3 text-white outline-none focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.1)] transition-all"
                      />
                      <select 
                        name="heightUnit" value={formData.heightUnit} onChange={handleChange}
                        className="bg-zinc-800 border-y border-r border-zinc-800 rounded-r-xl px-3 text-sm font-bold text-zinc-300 outline-none"
                      >
                        <option value="cm">cm</option>
                        <option value="ft">ft-in</option>
                      </select>
                    </div>
                    {errors.height && touched.height && <p className="text-red-500 text-xs font-semibold">{errors.height}</p>}
                  </div>

                </div>
              </div>

              {/* Security Card */}
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h2 className="text-xl font-bold mb-6 text-white">Security</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">New Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} onBlur={handleBlur}
                        className="w-full bg-black border border-zinc-800 rounded-xl pl-4 pr-10 py-3 text-white outline-none focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.1)] transition-all"
                        placeholder="Leave blank to keep current"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && touched.password && <p className="text-red-500 text-xs font-semibold">{errors.password}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Confirm Password</label>
                    <input 
                      type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 focus:shadow-[0_0_10px_rgba(249,115,22,0.1)] transition-all"
                    />
                    {errors.confirmPassword && touched.confirmPassword && <p className="text-red-500 text-xs font-semibold">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-900 border-t border-zinc-800 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 z-40 md:relative md:p-0 md:bg-transparent md:border-none md:mt-2 md:flex-row">
                <button 
                  type="button" 
                  onClick={() => {
                    setErrors({});
                    setSuccessMsg("");
                    setFormData({
                      name: user?.name || '',
                      email: user?.email || '',
                      gender: user?.gender || 'Male',
                      age: user?.age || '',
                      weight: user?.weight || '',
                      weightUnit: user?.weightUnit || 'kg',
                      height: user?.height || '',
                      heightUnit: user?.heightUnit || 'cm',
                      password: '',
                      confirmPassword: '',
                      profile_image: user?.profile_image || null
                    });
                  }} 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 min-h-[48px] bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" form="profile-form" id="save-btn" disabled={isSubmitting || !isFormValid()}
                  className="w-full sm:w-auto px-8 py-3 min-h-[48px] bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] flex items-center justify-center disabled:opacity-50 disabled:shadow-none"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Cropping Modal */}
        {isCropping && uploadFile && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-2xl flex flex-col items-center max-w-md w-full">
              <h3 className="text-lg font-bold text-white mb-4">Crop Profile Picture</h3>
              <div className="bg-black p-2 rounded-xl border border-zinc-800 mb-4 overflow-hidden flex justify-center w-full">
                 <AvatarEditor
                  ref={editorRef}
                  image={uploadFile}
                  width={250}
                  height={250}
                  border={30}
                  borderRadius={125}
                  color={[0, 0, 0, 0.6]} 
                  scale={cropScale}
                  rotate={0}
                />
              </div>
              <input 
                type="range" min="1" max="3" step="0.01" value={cropScale} 
                onChange={(e) => setCropScale(parseFloat(e.target.value))} 
                className="w-full mb-6 accent-orange-500"
              />
              <div className="flex gap-4 w-full">
                <button type="button" onClick={() => { setIsCropping(false); setUploadFile(null); }} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold text-white transition-colors">Cancel</button>
                <button type="button" onClick={handleSaveCrop} className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl font-bold text-white shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-colors">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // LOGIN / SIGNUP PAGE (when isEditing is false)
  return (
    <div className="min-h-screen p-6 bg-black flex flex-col items-center justify-center text-zinc-100 font-sans">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 p-8">
        
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center rounded-xl overflow-hidden w-20 h-20 mb-4 shadow-md">
            <img src={logo} alt="FutureMind Logo" className="w-full h-full object-cover scale-125" />
          </div>
          <h1 className="text-3xl font-bold tracking-wider text-white">
            FUTURE<span className="text-orange-500">MIND</span>
          </h1>
          <p className="text-zinc-500 mt-2 text-sm text-center">
            {resetToken ? 'Set New Password' 
              : isRequestingReset ? 'Password Recovery' 
              : isLogin ? 'Welcome back to the game' 
              : 'Create your character profile'}
          </p>
        </div>

        {!isRequestingReset && !resetToken && (
          <div className="flex w-full mb-6 bg-zinc-800 rounded-lg overflow-hidden">
            <button 
              type="button"
              className={`flex-1 py-3 min-h-[48px] text-sm font-bold transition-colors ${isLogin ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:bg-zinc-700'}`}
              onClick={() => handleTabSwitch(true)}
            >
              LOG IN
            </button>
            <button 
              type="button"
              className={`flex-1 py-3 min-h-[48px] text-sm font-bold transition-colors ${!isLogin ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:bg-zinc-700'}`}
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
            {!isLogin && !isRequestingReset && !resetToken && (
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Full Name</label>
                <input 
                  type="text" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur}
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
                  type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur}
                  className={`w-full bg-black border rounded-lg px-4 py-2 text-white outline-none transition-colors ${errors.email && touched.email ? 'border-red-500' : 'border-zinc-800 focus:border-orange-500'}`}
                  placeholder="e.g. you@example.com"
                />
                {errors.email && touched.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email}</p>}
              </div>
            )}

            {!isLogin && !isRequestingReset && !resetToken && (
              <>
                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Gender</label>
                  <div className="flex bg-black border border-zinc-800 rounded-lg overflow-hidden p-1">
                    <button type="button" onClick={() => setFormData({...formData, gender: 'Male'})} className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors ${formData.gender === 'Male' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Male</button>
                    <button type="button" onClick={() => setFormData({...formData, gender: 'Female'})} className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors ${formData.gender === 'Female' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Female</button>
                  </div>
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Age</label>
                  <input 
                    type="number" name="age" value={formData.age} onChange={handleChange} onBlur={handleBlur}
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
                        type="number" name="weight" value={formData.weight} onChange={handleChange} onBlur={handleBlur}
                        className={`w-full bg-black border border-r-0 rounded-l-lg px-3 py-2 text-white outline-none transition-colors ${errors.weight && touched.weight ? 'border-red-500' : 'border-zinc-800 focus:border-orange-500'}`}
                      />
                      <select 
                        name="weightUnit" value={formData.weightUnit} onChange={handleChange}
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
                        type="number" name="height" value={formData.height} onChange={handleChange} onBlur={handleBlur}
                        className={`w-full bg-black border border-r-0 rounded-l-lg px-3 py-2 text-white outline-none transition-colors ${errors.height && touched.height ? 'border-red-500' : 'border-zinc-800 focus:border-orange-500'}`}
                      />
                      <select 
                        name="heightUnit" value={formData.heightUnit} onChange={handleChange}
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
                  {isLogin && !resetToken && (
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
                    type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} onBlur={handleBlur}
                    className={`w-full bg-black border rounded-lg pl-4 pr-10 py-2 text-white outline-none transition-colors ${errors.password && touched.password ? 'border-red-500' : 'border-zinc-800 focus:border-orange-500'}`}
                    placeholder={(!isLogin || resetToken) ? "Min. 8 characters" : "Enter password"}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors" tabIndex="-1">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && touched.password && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.password}</p>}
                
                {/* Password Strength Indicator */}
                {(!isLogin || resetToken) && formData.password.length > 0 && (
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
            {(!isLogin || resetToken) && !isRequestingReset && (
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Confirm Password</label>
                <input 
                  type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur}
                  className={`w-full bg-black border rounded-lg px-4 py-2 text-white outline-none transition-colors ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : 'border-zinc-800 focus:border-orange-500'}`}
                />
                {errors.confirmPassword && touched.confirmPassword && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.confirmPassword}</p>}
              </div>
            )}

            <div className="flex gap-4 mt-6">
              {isRequestingReset && (
                <button 
                  type="button" onClick={() => { setIsRequestingReset(false); setErrors({}); setTouched({}); }}
                  className="w-1/3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-4 rounded-lg transition-colors" disabled={isSubmitting}
                >
                  CANCEL
                </button>
              )}
              <button 
                type="submit" disabled={isSubmitting || !isFormValid()}
                className={`flex items-center justify-center font-bold py-3 px-4 min-h-[48px] rounded-lg transition-all 
                  ${isRequestingReset ? 'w-2/3' : 'w-full'}
                  ${isSubmitting || !isFormValid() 
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]'
                  }`}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                  resetToken ? 'RESET PASSWORD' : (isRequestingReset ? 'SEND RESET LINK' : (isLogin ? 'LOG IN' : 'CREATE ACCOUNT'))
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

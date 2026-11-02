import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, UserPlus, Loader2 } from 'lucide-react';

/**
 * SignupForm — Branded registration form.
 * Includes full name, email, password with confirmation, and terms acceptance.
 * 
 * TODO: Connect to backend registration API
 * TODO: Add email verification flow
 */
export function SignupForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // --- Password strength indicator ---
  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-400' };
    if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-amber-400' };
    if (score <= 3) return { level: 3, label: 'Good', color: 'bg-primary-400' };
    return { level: 4, label: 'Strong', color: 'bg-primary-600' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // --- Form validation ---
  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Form submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    // TODO: Replace with actual API call
    // Example: const response = await api.auth.register(formData);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 1500);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // --- Reusable input renderer ---
  const renderInput = ({ id, label, type, value, placeholder, icon: Icon, error, autoComplete, showToggle, isVisible, onToggle }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-400" />
        <input
          id={id}
          type={showToggle ? (isVisible ? 'text' : 'password') : type}
          value={value}
          onChange={(e) => handleChange(id, e.target.value)}
          placeholder={placeholder}
          className={`
            w-full pl-10 ${showToggle ? 'pr-12' : 'pr-4'} py-3 rounded-xl border bg-white text-ink-900
            placeholder:text-ink-400 text-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
            transition-all duration-200
            ${error ? 'border-red-400 ring-1 ring-red-200' : 'border-sand-200 hover:border-sand-300'}
          `}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 transition-colors"
            aria-label={isVisible ? 'Hide password' : 'Show password'}
          >
            {isVisible ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        )}
      </div>
      {error && (
        <motion.p
          id={`${id}-error`}
          className="text-red-500 text-xs mt-1.5"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Full Name */}
      {renderInput({
        id: 'fullName',
        label: 'Full Name',
        type: 'text',
        value: formData.fullName,
        placeholder: 'Enter your full name',
        icon: User,
        error: errors.fullName,
        autoComplete: 'name',
      })}

      {/* Email */}
      {renderInput({
        id: 'email',
        label: 'Email Address',
        type: 'email',
        value: formData.email,
        placeholder: 'you@example.com',
        icon: Mail,
        error: errors.email,
        autoComplete: 'email',
      })}

      {/* Password */}
      {renderInput({
        id: 'password',
        label: 'Password',
        type: 'password',
        value: formData.password,
        placeholder: 'Create a strong password',
        icon: Lock,
        error: errors.password,
        autoComplete: 'new-password',
        showToggle: true,
        isVisible: showPassword,
        onToggle: () => setShowPassword(!showPassword),
      })}

      {/* Password strength indicator */}
      {formData.password && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-1.5"
        >
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i <= passwordStrength.level ? passwordStrength.color : 'bg-sand-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-ink-500">
            Password strength: <span className="font-medium">{passwordStrength.label}</span>
          </p>
        </motion.div>
      )}

      {/* Confirm Password */}
      {renderInput({
        id: 'confirmPassword',
        label: 'Confirm Password',
        type: 'password',
        value: formData.confirmPassword,
        placeholder: 'Re-enter your password',
        icon: Lock,
        error: errors.confirmPassword,
        autoComplete: 'new-password',
        showToggle: true,
        isVisible: showConfirm,
        onToggle: () => setShowConfirm(!showConfirm),
      })}

      {/* Terms & Conditions */}
      <div>
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.acceptTerms}
            onChange={(e) => handleChange('acceptTerms', e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-sand-300 text-primary-600 
                       focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
          />
          <span className="text-sm text-ink-600 leading-tight">
            I agree to the{' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-800 font-medium underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-800 font-medium underline">
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.acceptTerms && (
          <motion.p
            className="text-red-500 text-xs mt-1.5 ml-6"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {errors.acceptTerms}
          </motion.p>
        )}
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isLoading}
        className={`
          w-full py-3 px-6 rounded-xl font-semibold text-sm
          flex items-center justify-center gap-2
          transition-all duration-300 mt-2
          ${isLoading
            ? 'bg-primary-700 cursor-not-allowed'
            : 'bg-primary-900 hover:bg-primary-800 active:bg-primary-950 hover:shadow-elevated'
          }
          text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2
        `}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating account...
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Create Account
          </>
        )}
      </motion.button>

      {/* Login link */}
      <p className="text-center text-sm text-ink-500 mt-6">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-primary-600 hover:text-primary-800 font-semibold transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

export default SignupForm;

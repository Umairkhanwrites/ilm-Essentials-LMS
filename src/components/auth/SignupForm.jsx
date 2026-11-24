import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Calendar, MapPin, 
  BookOpen, FileText, CheckCircle2, Loader2, ArrowRight 
} from 'lucide-react';
import { useSupabaseBatches, submitApplicationSupabase } from '../../hooks/useSupabaseData';

/**
 * SignupForm — Public Admissions & Student Registration Form
 *
 * Directly persists candidate applications into Supabase PostgreSQL (public.admissions_applications)
 * with dynamic batch/intake selection from public.batches.
 */
export function SignupForm() {
  const { batches, isLoading: isBatchesLoading } = useSupabaseBatches();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cohort_id: '',
    format: 'online',
    prior_islamic_education: '',
    statement_of_intent: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  // Filter batches to active/enrolling ones only
  const activeBatches = (batches || []).filter(
    (b) => b.status === 'enrolling' || b.status === 'active'
  );

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone / WhatsApp number is required';
    } else if (formData.phone.trim().length < 7) {
      newErrors.phone = 'Please provide a valid contact number';
    }

    const selectedBatch = formData.cohort_id || (activeBatches[0]?.id || 'foundations_sem1');
    if (!selectedBatch) {
      newErrors.cohort_id = 'Please select an intake batch';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    const chosenCohortId = formData.cohort_id || activeBatches[0]?.id || 'foundations_sem1';
    const chosenBatch = activeBatches.find((b) => b.id === chosenCohortId);
    const chosenPathway = chosenBatch?.pathway_id || 'foundations';

    try {
      const res = await submitApplicationSupabase({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        pathway_id: chosenPathway,
        cohort_id: chosenCohortId,
        format: formData.format,
        prior_islamic_education: formData.prior_islamic_education.trim() || 'No formal prior study',
        statement_of_intent: formData.statement_of_intent.trim() || 'Desire to seek sacred knowledge',
      });

      if (!res.success && res.error) {
        setErrors({ form: res.error });
        setIsLoading(false);
        return;
      }

      setSubmittedData({
        ...formData,
        batchName: chosenBatch?.name || 'Selected Intake Batch',
      });
      setIsSubmitted(true);
    } catch (err) {
      setErrors({ form: err.message || 'Failed to submit application. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 sm:p-8 text-center space-y-5 border border-sand-200 shadow-sm"
      >
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h3 className="font-heading text-2xl font-bold text-ink-900">
            Application Submitted!
          </h3>
          <p className="text-sm text-ink-600 max-w-md mx-auto">
            JazakAllahu Khayran, <strong className="text-ink-900">{submittedData?.name}</strong>. Your registration for{' '}
            <strong className="text-primary-900">{submittedData?.batchName}</strong> has been received into our admissions review queue.
          </p>
        </div>

        <div className="bg-sand-50 rounded-xl p-4 text-xs text-ink-600 text-left space-y-1.5 border border-sand-200/80">
          <div className="flex justify-between">
            <span className="text-ink-400">Application Status:</span>
            <span className="font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">UNDER REVIEW</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-400">Email:</span>
            <span className="font-medium text-ink-800">{submittedData?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-400">Preferred Mode:</span>
            <span className="font-medium text-ink-800 capitalize">{submittedData?.format}</span>
          </div>
        </div>

        <p className="text-xs text-ink-500">
          Our admissions committee will contact you with interview details and onboarding instructions within 1–2 business days.
        </p>

        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-sm font-semibold transition-colors"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs text-ink-700" noValidate>
      {errors.form && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
          {errors.form}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label className="block text-xs font-semibold text-ink-700 mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Zaid Haris"
            className={`w-full pl-9 pr-3 py-2.5 rounded-xl border bg-white text-ink-900 placeholder:text-ink-400 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${
              errors.name ? 'border-red-400' : 'border-sand-200 hover:border-sand-300'
            }`}
          />
        </div>
        {errors.name && <p className="text-red-500 text-[11px] mt-1">{errors.name}</p>}
      </div>

      {/* Contact Grid: Email & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="candidate@example.com"
              className={`w-full pl-9 pr-3 py-2.5 rounded-xl border bg-white text-ink-900 placeholder:text-ink-400 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${
                errors.email ? 'border-red-400' : 'border-sand-200 hover:border-sand-300'
              }`}
            />
          </div>
          {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-1">
            WhatsApp / Phone <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+92 300 1234567"
              className={`w-full pl-9 pr-3 py-2.5 rounded-xl border bg-white text-ink-900 placeholder:text-ink-400 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${
                errors.phone ? 'border-red-400' : 'border-sand-200 hover:border-sand-300'
              }`}
            />
          </div>
          {errors.phone && <p className="text-red-500 text-[11px] mt-1">{errors.phone}</p>}
        </div>
      </div>

      {/* Program Batch & Intake Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-1">
            Academic Batch / Intake <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <select
              value={formData.cohort_id || (activeBatches[0]?.id || '')}
              onChange={(e) => handleChange('cohort_id', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-sand-200 bg-white text-ink-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 font-medium"
            >
              {isBatchesLoading && <option>Loading available batches...</option>}
              {activeBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
              {!isBatchesLoading && activeBatches.length === 0 && (
                <option value="foundations_sem1">Ilm Foundations — Fall 2026</option>
              )}
            </select>
          </div>
          {errors.cohort_id && <p className="text-red-500 text-[11px] mt-1">{errors.cohort_id}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-1">
            Preferred Learning Format
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <select
              value={formData.format}
              onChange={(e) => handleChange('format', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-sand-200 bg-white text-ink-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 font-medium"
            >
              <option value="online">Live Online (Google Meet)</option>
              <option value="onsite">Onsite Campus (Lahore DHA)</option>
              <option value="hybrid">Hybrid (Both)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Prior Islamic Education */}
      <div>
        <label className="block text-xs font-semibold text-ink-700 mb-1">
          Prior Islamic Studies Background
        </label>
        <div className="relative">
          <BookOpen className="absolute left-3 top-3 w-4 h-4 text-ink-400" />
          <textarea
            rows={2}
            value={formData.prior_islamic_education}
            onChange={(e) => handleChange('prior_islamic_education', e.target.value)}
            placeholder="Briefly describe any prior Quranic, Arabic, or Madrasah studies (optional)..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-sand-200 bg-white text-ink-900 placeholder:text-ink-400 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>
      </div>

      {/* Statement of Intent */}
      <div>
        <label className="block text-xs font-semibold text-ink-700 mb-1">
          Statement of Intent / Goals
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-4 h-4 text-ink-400" />
          <textarea
            rows={2}
            value={formData.statement_of_intent}
            onChange={(e) => handleChange('statement_of_intent', e.target.value)}
            placeholder="What is your primary intention or goal for joining this program?"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-sand-200 bg-white text-ink-900 placeholder:text-ink-400 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isLoading}
        className={`w-full py-3 px-6 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-300 mt-2 ${
          isLoading
            ? 'bg-primary-700 cursor-not-allowed text-white'
            : 'bg-primary-900 hover:bg-primary-800 active:bg-primary-950 text-white shadow-xs cursor-pointer'
        }`}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Submitting Application...</span>
          </>
        ) : (
          <span>Submit Admissions Application &rarr;</span>
        )}
      </motion.button>

      {/* Sign In link */}
      <p className="text-center text-xs text-ink-500 pt-2">
        Already an enrolled student?{' '}
        <Link to="/login" className="text-primary-800 hover:underline font-bold">
          Sign In
        </Link>
      </p>
    </form>
  );
}

export default SignupForm;

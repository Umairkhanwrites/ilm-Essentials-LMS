import AuthLayout from '../components/auth/AuthLayout';
import SignupForm from '../components/auth/SignupForm';

/**
 * Signup Page — Branded registration page with split layout.
 * Left: Brand showcase. Right: Signup form.
 */
export function Signup() {
  return (
    <AuthLayout
      title="Admissions & Registration"
      subtitle="Apply for upcoming intakes in Ilm Foundations & Intensives"
    >
      <SignupForm />
    </AuthLayout>
  );
}

export default Signup;

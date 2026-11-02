import AuthLayout from '../components/auth/AuthLayout';
import SignupForm from '../components/auth/SignupForm';

/**
 * Signup Page — Branded registration page with split layout.
 * Left: Brand showcase. Right: Signup form.
 */
export function Signup() {
  return (
    <AuthLayout
      title="Begin Your Journey"
      subtitle="Create an account to start learning with Ilm Essentials"
    >
      <SignupForm />
    </AuthLayout>
  );
}

export default Signup;

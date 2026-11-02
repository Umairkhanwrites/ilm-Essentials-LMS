/**
 * Login — Dedicated Student Login Page
 */

import React from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';

export default function Login() {
  return (
    <AuthLayout
      title="Student Sign In"
      subtitle="Access your enrolled classical Islamic sciences courses, lectures & e-Library"
    >
      <LoginForm />
    </AuthLayout>
  );
}

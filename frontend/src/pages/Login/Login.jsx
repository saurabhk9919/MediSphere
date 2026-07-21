import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout/AuthLayout.jsx';
import Input from '../../components/Input/Input.jsx';
import Button from '../../components/Button/Button.jsx';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error on edit
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    // Simulate auth API call
    setTimeout(() => {
      setLoading(false);
      navigate('/');
    }, 1200);
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Enter your email and password to access your dashboard"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="name@example.com"
          error={errors.email}
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          error={errors.password}
          required
        />

        <div className="flex items-center justify-between text-sm mt-1 mb-2">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 font-medium">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 rounded-md transition duration-150"
            />
            Remember me
          </label>

          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
          >
            Forgot password?
          </a>
        </div>

        <Button type="submit" fullWidth loading={loading}>
          Login
        </Button>

        <div className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
          Don't have an account?{' '}
          <RouterLink
            to="/signup"
            className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline ml-1"
          >
            Create Account
          </RouterLink>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Login;
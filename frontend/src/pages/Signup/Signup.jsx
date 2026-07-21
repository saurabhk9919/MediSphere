import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout/AuthLayout.jsx';
import Input from '../../components/Input/Input.jsx';
import Button from '../../components/Button/Button.jsx';

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'patient',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    // Simulate signup call
    setTimeout(() => {
      setLoading(false);
      navigate('/login');
    }, 1200);
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join MediSphere to manage appointments and healthcare"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Dr. John Doe / Sarah Smith"
          error={errors.fullName}
          required
        />

        <Input
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="name@example.com"
          error={errors.email}
          required
        />

        {/* Role Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            I am joining as <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, role: 'patient' }))}
              className={`py-2.5 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                formData.role === 'patient'
                  ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 shadow-xs'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <span>👤</span> Patient
            </button>
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, role: 'doctor' }))}
              className={`py-2.5 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                formData.role === 'doctor'
                  ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 shadow-xs'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <span>🩺</span> Doctor
            </button>
          </div>
        </div>

        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="At least 6 characters"
          error={errors.password}
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Repeat password"
          error={errors.confirmPassword}
          required
        />

        <Button type="submit" fullWidth loading={loading} className="mt-2">
          Create Account
        </Button>

        <div className="text-center mt-4 text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <RouterLink
            to="/login"
            className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline ml-1"
          >
            Log In
          </RouterLink>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Signup;

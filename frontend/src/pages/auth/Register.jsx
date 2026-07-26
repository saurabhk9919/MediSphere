import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import { Mail, Lock, User, Stethoscope, FileText } from 'lucide-react';

const Register = () => {
  const { register: signupUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      role: 'patient',
      specialization: 'General Medicine',
      licenseNo: '',
      password: '',
      confirmPassword: '',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        password: data.password,
      };

      if (data.role === 'doctor') {
        payload.specialization = data.specialization || 'General Medicine';
        payload.licenseNo = data.licenseNo || 'TEMP_LICENSE';
      }

      const res = await signupUser(payload);
      if (res && res.success) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join MediSphere to manage appointments and healthcare"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="Saurabh Kashyap"
          icon={<User size={18} />}
          error={errors.fullName?.message}
          required
          {...register('fullName', {
            required: 'Full name is required',
          })}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          icon={<Mail size={18} />}
          error={errors.email?.message}
          required
          {...register('email', {
            required: 'Email address is required',
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: 'Please enter a valid email address',
            },
          })}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            I am joining as <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('role', 'patient')}
              className={`py-2.5 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedRole === 'patient'
                  ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 shadow-xs'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <span>👤</span> Patient
            </button>
            <button
              type="button"
              onClick={() => setValue('role', 'doctor')}
              className={`py-2.5 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedRole === 'doctor'
                  ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 shadow-xs'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <span>🩺</span> Doctor
            </button>
          </div>
        </div>

        {selectedRole === 'doctor' && (
          <>
            <Input
              label="Specialization"
              type="text"
              placeholder="Cardiology / Pediatrics"
              icon={<Stethoscope size={18} />}
              error={errors.specialization?.message}
              required
              {...register('specialization', {
                required: 'Specialization is required for doctors',
              })}
            />

            <Input
              label="License Number"
              type="text"
              placeholder="LIC12345"
              icon={<FileText size={18} />}
              error={errors.licenseNo?.message}
              required
              {...register('licenseNo', {
                required: 'License number is required for doctors',
              })}
            />
          </>
        )}

        <Input
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          icon={<Lock size={18} />}
          error={errors.password?.message}
          required
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters long',
            },
          })}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Repeat password"
          icon={<Lock size={18} />}
          error={errors.confirmPassword?.message}
          required
          {...register('confirmPassword', {
            required: 'Confirm password is required',
            validate: (value) =>
              value === watch('password') || 'Passwords do not match',
          })}
        />

        <Button
          type="submit"
          fullWidth
          loading={loading}
          className="mt-2"
        >
          Create Account
        </Button>

        <div className="text-center mt-4 text-sm text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline ml-1"
          >
            Log In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Register;

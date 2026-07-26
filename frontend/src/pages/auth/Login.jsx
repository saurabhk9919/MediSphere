import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { Mail, Lock } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      toast.error('Your session has expired. Please sign in again.', { id: 'session-expired' });
    }
  }, [searchParams]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const user = await login(data.email, data.password);
      if (user) {
        if (user.role === 'doctor') {
          navigate('/doctor/dashboard');
        } else {
          navigate('/patient/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Access your health record and appointments"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
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

        <Button
          type="submit"
          fullWidth
          loading={loading}
          className="mt-2"
        >
          Sign In
        </Button>

        <div className="text-center mt-6 text-sm text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline ml-1"
          >
            Create Account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;

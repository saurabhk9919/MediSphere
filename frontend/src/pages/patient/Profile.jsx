import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, Calendar, MapPin, Heart, ShieldAlert, Award } from 'lucide-react';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { getUserProfile, updateUserProfile } from '../../services/user.api';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      gender: '',
      date_of_birth: '',
      address: '',
      blood_group: '',
      emergency_contact: '',
    },
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await getUserProfile();
      if (res && res.success) {
        setProfile(res.data);
        
        const extKey = `medisphere_profile_ext_${res.data.id}`;
        const savedExt = JSON.parse(localStorage.getItem(extKey) || '{}');
        
        reset({
          full_name: res.data.full_name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          gender: res.data.gender || '',
          date_of_birth: savedExt.date_of_birth || '',
          address: res.data.address || '',
          blood_group: res.data.blood_group || '',
          emergency_contact: savedExt.emergency_contact || '',
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getExtData = () => {
    if (!profile) return { date_of_birth: '', emergency_contact: '' };
    const extKey = `medisphere_profile_ext_${profile.id}`;
    return JSON.parse(localStorage.getItem(extKey) || '{}');
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      
      const dobDate = new Date(data.date_of_birth);
      const age = isNaN(dobDate.getTime())
        ? undefined
        : new Date().getFullYear() - dobDate.getFullYear();

      const putBody = {
        full_name: data.full_name,
        gender: data.gender,
        blood_group: data.blood_group,
        phone: data.phone,
        address: data.address,
        age: age,
      };

      const res = await updateUserProfile(putBody);
      if (res && res.success) {
        const extKey = `medisphere_profile_ext_${profile.id}`;
        localStorage.setItem(
          extKey,
          JSON.stringify({
            date_of_birth: data.date_of_birth,
            emergency_contact: data.emergency_contact,
          })
        );

        setProfile(res.data);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save profile modifications.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      const extKey = `medisphere_profile_ext_${profile.id}`;
      const savedExt = JSON.parse(localStorage.getItem(extKey) || '{}');
      reset({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
        date_of_birth: savedExt.date_of_birth || '',
        address: profile.address || '',
        blood_group: profile.blood_group || '',
        emergency_contact: savedExt.emergency_contact || '',
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader size="medium" />
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        title="Profile Unavailable"
        description="Could not load your user profile."
        icon="👤"
        actionButton={
          <Button onClick={loadProfile}>Retry</Button>
        }
      />
    );
  }

  const extData = getExtData();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Patient Portal / Profile
        </div>
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex flex-col items-center text-center h-fit">
          <div className="h-24 w-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl border border-blue-200 shadow-inner mb-4 select-none">
            {getInitials(profile.full_name)}
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">{profile.full_name}</h2>
          <p className="text-sm text-slate-500 mb-2">{profile.email}</p>
          <span className="text-xs font-medium text-blue-600 capitalize px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-6">
            {profile.role}
          </span>

          {!isEditing ? (
            <Button
              variant="primary"
              fullWidth
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <div className="w-full space-y-2">
              <Button
                variant="primary"
                fullWidth
                loading={submitting}
                onClick={handleSubmit(onSubmit)}
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                fullWidth
                disabled={submitting}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-2 bg-slate-50/50">
            <Award size={18} className="text-blue-600" />
            <h3 className="text-md font-bold text-slate-800">Personal Information</h3>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            {!isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name</label>
                  <p className="text-sm font-semibold text-slate-700">{profile.full_name || 'Not Provided'}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email</label>
                  <p className="text-sm font-semibold text-slate-700">{profile.email || 'Not Provided'}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Phone Number</label>
                  <p className="text-sm font-semibold text-slate-700">{profile.phone || 'Not Provided'}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Gender</label>
                  <p className="text-sm font-semibold text-slate-700 capitalize">{profile.gender || 'Not Provided'}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Date of Birth</label>
                  <p className="text-sm font-semibold text-slate-700">
                    {extData.date_of_birth ? formatDate(extData.date_of_birth) : 'Not Provided'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Blood Group</label>
                  <p className="text-sm font-semibold text-slate-700">{profile.blood_group || 'Not Provided'}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Emergency Contact</label>
                  <p className="text-sm font-semibold text-slate-700">{extData.emergency_contact || 'Not Provided'}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Address</label>
                  <p className="text-sm font-semibold text-slate-700 whitespace-pre-wrap">{profile.address || 'Not Provided'}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    type="text"
                    error={errors.full_name?.message}
                    required
                    {...register('full_name', { required: 'Full name is required' })}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    disabled
                    error={errors.email?.message}
                    {...register('email')}
                  />
                  <Input
                    label="Phone Number"
                    type="text"
                    error={errors.phone?.message}
                    required
                    {...register('phone', {
                      required: 'Phone number is required',
                      pattern: {
                        value: /^\+?[0-9\s-]{7,15}$/,
                        message: 'Please enter a valid phone number format',
                      },
                    })}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className={`w-full px-4 py-2.5 text-slate-900 bg-white border text-sm rounded-xl transition-all duration-200 outline-none h-[42px] ${
                        errors.gender
                          ? 'border-rose-500 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/20'
                          : 'border-slate-300 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20'
                      }`}
                      {...register('gender', { required: 'Gender selection is required' })}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && (
                      <p className="text-xs text-rose-600 font-medium mt-0.5 flex items-center gap-1">
                        <span>⚠</span> {errors.gender.message}
                      </p>
                    )}
                  </div>
                  <Input
                    label="Date of Birth"
                    type="date"
                    error={errors.date_of_birth?.message}
                    required
                    {...register('date_of_birth', { required: 'Date of birth is required' })}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Blood Group <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className={`w-full px-4 py-2.5 text-slate-900 bg-white border text-sm rounded-xl transition-all duration-200 outline-none h-[42px] ${
                        errors.blood_group
                          ? 'border-rose-500 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/20'
                          : 'border-slate-300 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20'
                      }`}
                      {...register('blood_group', { required: 'Blood group selection is required' })}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                    {errors.blood_group && (
                      <p className="text-xs text-rose-600 font-medium mt-0.5 flex items-center gap-1">
                        <span>⚠</span> {errors.blood_group.message}
                      </p>
                    )}
                  </div>
                  <Input
                    label="Emergency Contact"
                    type="text"
                    error={errors.emergency_contact?.message}
                    required
                    {...register('emergency_contact', {
                      required: 'Emergency contact is required',
                      pattern: {
                        value: /^\+?[0-9\s-]{7,15}$/,
                        message: 'Please enter a valid phone number format',
                      },
                    })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows="3"
                    className={`w-full px-4 py-2.5 text-slate-900 bg-white border text-sm rounded-xl transition-all duration-200 outline-none resize-none ${
                      errors.address
                        ? 'border-rose-500 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/20'
                        : 'border-slate-300 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20'
                    }`}
                    {...register('address', { required: 'Address details are required' })}
                  />
                  {errors.address && (
                    <p className="text-xs text-rose-600 font-medium mt-0.5 flex items-center gap-1">
                      <span>⚠</span> {errors.address.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

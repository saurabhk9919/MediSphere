import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Calendar, Stethoscope, Clock, DollarSign, Award, ArrowLeft, ArrowRight } from 'lucide-react';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { getDoctors } from '../../services/doctor.api';
import { bookAppointment } from '../../services/appointment.api';
import toast from 'react-hot-toast';

const BookingForm = ({ doctor, onClose, onBookingSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      appointmentDate: '',
      appointmentTime: '',
      reason: '',
    },
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const res = await bookAppointment({
        doctorId: doctor.id,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        reason: data.reason,
      });

      if (res && res.success) {
        toast.success(res.message || 'Appointment booked successfully!');
        reset();
        onBookingSuccess();
      }
    } catch (err) {
      console.error(err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to book appointment.';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div className="text-xs font-semibold text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2">
        Booking consultation with <span className="font-bold text-slate-700">Dr. {doctor.full_name}</span> ({doctor.specialization})
      </div>

      <Input
        label="Appointment Date"
        type="date"
        min={getMinDate()}
        error={errors.appointmentDate?.message}
        required
        {...register('appointmentDate', {
          required: 'Appointment date is required',
          validate: (val) => {
            const selected = new Date(val);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selected.setHours(0, 0, 0, 0);
            return selected >= today || 'Date cannot be in the past';
          },
        })}
      />

      <Input
        label="Appointment Time"
        type="time"
        error={errors.appointmentTime?.message}
        required
        {...register('appointmentTime', {
          required: 'Appointment time is required',
        })}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-slate-700">Reason for Visit *</label>
        <textarea
          rows="3"
          placeholder="Please describe your symptoms..."
          className={`w-full px-4 py-2.5 text-slate-900 bg-white border text-sm rounded-xl transition-all duration-200 outline-none resize-none ${
            errors.reason
              ? 'border-rose-500 focus:border-rose-400'
              : 'border-slate-300 hover:border-slate-400 focus:border-indigo-500'
          }`}
          {...register('reason', { required: 'Reason for visit is required' })}
        />
        {errors.reason && (
          <p className="text-xs text-rose-600 font-medium mt-0.5">
            ⚠ {errors.reason.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="outline" disabled={submitting} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          Confirm Booking
        </Button>
      </div>
    </form>
  );
};

const BookAppointment = () => {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  });

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchSpecs = async () => {
    try {
      const res = await getDoctors({ limit: 100 });
      if (res && res.success) {
        const specs = res.data.map((d) => d.specialization);
        const uniqueSpecs = [...new Set(specs)].filter(Boolean).sort();
        setSpecializations(uniqueSpecs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDoctorsList = async () => {
    try {
      setLoading(true);
      const res = await getDoctors({
        search,
        specialization,
        page,
        limit: 6,
      });
      if (res && res.success) {
        setDoctors(res.data || []);
        setPagination(res.pagination || {
          page: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load doctor directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecs();
  }, []);

  useEffect(() => {
    fetchDoctorsList();
  }, [search, specialization, page]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSpecChange = (e) => {
    setSpecialization(e.target.value);
    setPage(1);
  };

  const handleReset = () => {
    setSearch('');
    setSpecialization('');
    setPage(1);
  };

  const handleBookClick = (doctor) => {
    setSelectedDoctor(doctor);
    setModalOpen(true);
  };

  const handleBookingSuccess = () => {
    setModalOpen(false);
    setSelectedDoctor(null);
    fetchDoctorsList();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Patient Portal / Booking
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Book Appointment</h1>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-100 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search doctors by name..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={specialization}
            onChange={handleSpecChange}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all h-[42px]"
          >
            <option value="">All Specializations</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>

        <Button variant="outline" className="w-full sm:w-auto" onClick={handleReset}>
          Reset Filters
        </Button>
      </div>

      {loading ? (
        <div className="flex h-[40vh] w-full items-center justify-center">
          <Loader size="medium" />
        </div>
      ) : doctors.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-md font-bold text-slate-800">
                        Dr. {doctor.full_name}
                      </h3>
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                        {doctor.specialization}
                      </span>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
                      🩺
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <Award size={15} className="text-slate-400" />
                      <span>
                        Experience:{' '}
                        <span className="font-semibold text-slate-700">
                          {doctor.experience ? `${doctor.experience} Years` : 'Not Specified'}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign size={15} className="text-slate-400" />
                      <span>
                        Consultation Fee:{' '}
                        <span className="font-semibold text-slate-700">
                          {doctor.consultation_fee
                            ? `$${doctor.consultation_fee}`
                            : 'Not Specified'}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-slate-400" />
                      <span>
                        Availability:{' '}
                        <span className="font-semibold text-slate-700">Mon - Fri</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button variant="primary" fullWidth onClick={() => handleBookClick(doctor)}>
                    Book Appointment
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
              <Button
                variant="outline"
                disabled={!pagination.hasPrevious}
                onClick={() => setPage((p) => p - 1)}
                icon={<ArrowLeft size={16} />}
              >
                Previous
              </Button>
              <span className="text-sm font-semibold text-slate-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={!pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
                icon={<ArrowRight size={16} />}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="No Doctors Found"
          description="Try adjusting your search query or selecting a different specialization filter."
          icon="🩺"
        />
      )}

      {selectedDoctor && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Schedule Appointment"
        >
          <BookingForm
            doctor={selectedDoctor}
            onClose={() => setModalOpen(false)}
            onBookingSuccess={handleBookingSuccess}
          />
        </Modal>
      )}
    </div>
  );
};

export default BookAppointment;

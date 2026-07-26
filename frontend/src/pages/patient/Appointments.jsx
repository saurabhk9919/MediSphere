import React, { useEffect, useState } from 'react';
import { Search, Calendar, Clock, Stethoscope, AlertTriangle, ArrowUpDown } from 'lucide-react';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { getPatientAppointments, cancelAppointment } from '../../services/appointment.api';
import { formatDate, formatTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const Appointments = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  const [selectedApptToCancel, setSelectedApptToCancel] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchAppointmentsList = async () => {
    try {
      setLoading(true);
      const res = await getPatientAppointments();
      if (res && res.success) {
        setAppointments(res.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve appointments list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentsList();
  }, []);

  const handleCancelClick = (appt) => {
    setSelectedApptToCancel(appt);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedApptToCancel) return;
    try {
      setCancelling(true);
      const res = await cancelAppointment(selectedApptToCancel.appointmentId);
      if (res && res.success) {
        toast.success(res.message || 'Appointment cancelled successfully.');
        setCancelModalOpen(false);
        setSelectedApptToCancel(null);
        fetchAppointmentsList();
      }
    } catch (err) {
      console.error(err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to cancel appointment.';
      toast.error(errorMsg);
    } finally {
      setCancelling(false);
    }
  };

  const filteredAppointments = appointments
    .filter((appt) => {
      const docName = appt.doctor?.fullName || '';
      const docSpec = appt.doctor?.specialization || '';
      const matchesSearch =
        docName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        docSpec.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' || appt.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const timeA = new Date(`${a.appointmentDate} ${a.appointmentTime}`).getTime();
      const timeB = new Date(`${b.appointmentDate} ${b.appointmentTime}`).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Patient Portal / Appointments
        </div>
        <h1 className="text-2xl font-bold text-slate-800">My Appointments</h1>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by doctor or specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all h-[42px]"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
          <div className="w-full sm:w-44 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase shrink-0">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all h-[42px]"
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="w-full sm:w-44 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase shrink-0">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all h-[42px]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[40vh] w-full items-center justify-center">
          <Loader size="medium" />
        </div>
      ) : filteredAppointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAppointments.map((appt) => (
            <div
              key={appt.appointmentId}
              className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-md font-bold text-slate-800">
                      Dr. {appt.doctor?.fullName}
                    </h3>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      {appt.doctor?.specialization}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${getStatusStyles(
                      appt.status
                    )}`}
                  >
                    {appt.status}
                  </span>
                </div>

                <div className="text-xs text-slate-500 space-y-2 pt-3 border-t border-slate-50">
                  <div className="flex items-center gap-2.5">
                    <Calendar size={16} className="text-slate-400" />
                    <span>{formatDate(appt.appointmentDate)}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock size={16} className="text-slate-400" />
                    <span>{formatTime(appt.appointmentTime)}</span>
                  </div>
                  {appt.reason && (
                    <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600 italic">
                      "{appt.reason}"
                    </div>
                  )}
                </div>
              </div>

              {appt.status === 'Scheduled' && (
                <div className="pt-6">
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={() => handleCancelClick(appt)}
                  >
                    Cancel Appointment
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Appointments Found"
          description="We couldn't find any appointments matching your filters."
          icon="📅"
        />
      )}

      {selectedApptToCancel && (
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title="Cancel Appointment"
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-sm">
              <AlertTriangle size={24} className="shrink-0" />
              <div>
                <span className="font-bold">Warning:</span> This action will cancel your slot with{' '}
                <span className="font-bold">Dr. {selectedApptToCancel.doctor?.fullName}</span>.
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to cancel the appointment scheduled on{' '}
              <span className="font-semibold text-slate-800">
                {formatDate(selectedApptToCancel.appointmentDate)}
              </span>{' '}
              at{' '}
              <span className="font-semibold text-slate-800">
                {formatTime(selectedApptToCancel.appointmentTime)}
              </span>
              ?
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                disabled={cancelling}
                onClick={() => setCancelModalOpen(false)}
              >
                Keep Appointment
              </Button>
              <Button
                variant="danger"
                loading={cancelling}
                onClick={handleConfirmCancel}
              >
                Cancel Slot
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Appointments;

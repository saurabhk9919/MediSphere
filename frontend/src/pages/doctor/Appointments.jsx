import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Clock, User, AlertTriangle, Eye, X } from 'lucide-react';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { getDoctorAppointments, updateAppointmentStatus, updateConsultationVitals, hideAppointmentFromDoctor } from '../../services/appointment.api';
import { formatDate, formatTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const Appointments = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  const [filterPatientId, setFilterPatientId] = useState(() => {
    return new URLSearchParams(window.location.search).get('patientId') || null;
  });

  const [statusUpdateInfo, setStatusUpdateInfo] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [timeTicker, setTimeTicker] = useState(Date.now());

  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [isRecordingManually, setIsRecordingManually] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({ heartRate: '', spo2: '', temperature: '' });
  const [savingVitals, setSavingVitals] = useState(false);

  const handleOpenConsultationModal = (appt) => {
    setSelectedConsultation(appt);
    setIsRecordingManually(false);
    if (appt.consultationVitals) {
      setVitalsForm({
        heartRate: appt.consultationVitals.heartRate.toString(),
        spo2: appt.consultationVitals.spo2.toString(),
        temperature: appt.consultationVitals.temperature.toString(),
      });
    } else {
      setVitalsForm({ heartRate: '', spo2: '', temperature: '' });
    }
  };

  const handleUseLatestTelemetry = () => {
    if (!selectedConsultation || !selectedConsultation.latestVital) {
      toast.error('No live telemetry available to copy.');
      return;
    }
    const { heartRate, spo2, temperature } = selectedConsultation.latestVital;
    setVitalsForm({
      heartRate: heartRate ? heartRate.toString() : '',
      spo2: spo2 ? spo2.toString() : '',
      temperature: temperature ? temperature.toString() : '',
    });
    setIsRecordingManually(true);
    toast.success('Latest telemetry copied. Please review and save.');
  };

  const handleUsePreConsultationVitals = () => {
    if (!selectedConsultation || !selectedConsultation.preConsultationVitals) {
      toast.error('No pre-consultation vitals available to copy.');
      return;
    }
    const { heartRate, spo2, temperature } = selectedConsultation.preConsultationVitals;
    setVitalsForm({
      heartRate: heartRate ? heartRate.toString() : '',
      spo2: spo2 ? spo2.toString() : '',
      temperature: temperature ? temperature.toString() : '',
    });
    setIsRecordingManually(true);
    toast.success('Pre-consultation vitals copied. Please review and save.');
  };

  const handleSaveConsultationVitals = async (e) => {
    e.preventDefault();
    if (!selectedConsultation) return;

    const { heartRate, spo2, temperature } = vitalsForm;
    if (!heartRate.trim() || !spo2.trim() || !temperature.trim()) {
      toast.error('All vital sign fields are required.');
      return;
    }

    try {
      setSavingVitals(true);
      const res = await updateConsultationVitals(selectedConsultation.appointmentId, {
        heartRate: parseInt(heartRate, 10),
        spo2: parseInt(spo2, 10),
        temperature: parseFloat(temperature)
      });

      if (res && res.success) {
        toast.success('Consultation vitals saved successfully!');
        setSelectedConsultation(null);
        fetchAppointmentsList();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save consultation vitals.');
    } finally {
      setSavingVitals(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTicker(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const getRelativeTime = (recordedAt) => {
    if (!recordedAt) return '';
    const diffMs = timeTicker - new Date(recordedAt).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec} seconds ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs} ${diffHrs === 1 ? 'hour' : 'hours'} ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  };

  const getHeartRateBadge = (hr) => {
    if (hr < 60) return { label: 'Low', styles: 'bg-amber-50 text-amber-600 border-amber-100' };
    if (hr <= 100) return { label: 'Normal', styles: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
    return { label: 'High', styles: 'bg-rose-50 text-rose-600 border-rose-100' };
  };

  const getSpO2Badge = (spo2) => {
    if (spo2 >= 95) return { label: 'Excellent', styles: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
    if (spo2 >= 90) return { label: 'Low', styles: 'bg-amber-50 text-amber-600 border-amber-100' };
    return { label: 'Critical', styles: 'bg-rose-50 text-rose-600 border-rose-100 font-bold animate-pulse' };
  };

  const getTemperatureBadge = (temp) => {
    if (temp < 36) return { label: 'Low', styles: 'bg-amber-50 text-amber-600 border-amber-100' };
    if (temp <= 37.5) return { label: 'Normal', styles: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
    return { label: 'High', styles: 'bg-rose-50 text-rose-600 border-rose-100' };
  };

  const fetchAppointmentsList = async () => {
    try {
      setLoading(true);
      const res = await getDoctorAppointments();
      if (res && res.success) {
        setAppointments(res.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve doctor appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentsList();
  }, []);

  const handleStatusChangeClick = (appt, newStatus) => {
    setStatusUpdateInfo({ appointment: appt, newStatus });
  };

  const handleConfirmStatusChange = async () => {
    if (!statusUpdateInfo) return;
    const { appointment, newStatus } = statusUpdateInfo;
    try {
      setUpdating(true);
      const res = await updateAppointmentStatus(appointment.appointmentId, newStatus);
      if (res && res.success) {
        toast.success(res.message || `Appointment marked as ${newStatus} successfully.`);
        setStatusUpdateInfo(null);
        fetchAppointmentsList();
      }
    } catch (err) {
      console.error(err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to update appointment status.';
      toast.error(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  const handleHideAppointment = async (appointmentId) => {
    try {
      const res = await hideAppointmentFromDoctor(appointmentId);
      if (res && res.success) {
        toast.success('Appointment removed from appointments view.');
        fetchAppointmentsList();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to hide appointment.');
    }
  };

  const filteredAppointments = appointments
    .filter((appt) => {
      if (appt.hiddenFromDoctor) return false;

      const patName = appt.patient?.fullName || '';
      const matchesSearch = patName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || appt.status === statusFilter;

      const matchesPatientId = !filterPatientId || String(appt.patient?.id) === String(filterPatientId);

      return matchesSearch && matchesStatus && matchesPatientId;
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

  const activeFilteredPatient = filterPatientId
    ? appointments.find(appt => String(appt.patient?.id) === String(filterPatientId))?.patient
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Doctor Portal / Appointments
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Manage Appointments</h1>
        {filterPatientId && (
          <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-xs font-semibold mt-2">
            <span>
              Filtering appointments for patient: <strong className="text-indigo-900">{activeFilteredPatient ? activeFilteredPatient.fullName : `Patient #${filterPatientId}`}</strong>
            </span>
            <button
              onClick={() => {
                setFilterPatientId(null);
                const newUrl = window.location.pathname;
                window.history.pushState({}, '', newUrl);
              }}
              className="text-[10px] bg-white border border-indigo-200 px-2 py-1 rounded-lg hover:bg-indigo-100 text-indigo-700 transition font-bold"
            >
              Clear Filter
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by patient name..."
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
                      {appt.patient?.fullName}
                    </h3>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">
                      Patient ID: #{appt.patient?.id}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${getStatusStyles(
                        appt.status
                      )}`}
                    >
                      {appt.status}
                    </span>
                    {appt.status === 'Completed' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleHideAppointment(appt.appointmentId);
                        }}
                        className="p-1 hover:bg-slate-150 rounded-full text-slate-400 hover:text-rose-600 transition shrink-0"
                        title="Remove from view"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
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

                {/* Latest Vitals Snapshot Section */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
                    Latest Vitals
                  </h4>

                  {!appt.latestVital ? (
                    <p className="text-xs text-slate-400 font-medium italic">No vitals recorded yet.</p>
                  ) : (
                    <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-xs">
                      {/* Heart Rate */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <span>❤️</span> Heart Rate
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700">{appt.latestVital.heartRate} bpm</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase border ${getHeartRateBadge(appt.latestVital.heartRate).styles}`}>
                            {getHeartRateBadge(appt.latestVital.heartRate).label}
                          </span>
                        </div>
                      </div>

                      {/* SpO2 */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <span>🩸</span> SpO₂
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700">{appt.latestVital.spo2}%</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase border ${getSpO2Badge(appt.latestVital.spo2).styles}`}>
                            {getSpO2Badge(appt.latestVital.spo2).label}
                          </span>
                        </div>
                      </div>

                      {/* Temperature */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <span>🌡</span> Temperature
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700">{appt.latestVital.temperature}°C</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase border ${getTemperatureBadge(appt.latestVital.temperature).styles}`}>
                            {getTemperatureBadge(appt.latestVital.temperature).label}
                          </span>
                        </div>
                      </div>

                      {/* Relative duration */}
                      <div className="text-[10px] text-slate-400 font-semibold pt-1 text-right select-none">
                        Recorded {getRelativeTime(appt.latestVital.recordedAt)}
                      </div>
                    </div>
                  )}

                  {appt.latestVital && (
                    <Link
                      to={`/doctor/consultation/${appt.appointmentId}`}
                      className="inline-block text-xs font-bold text-blue-600 hover:text-blue-750 transition"
                    >
                      Open Consultation &rarr;
                    </Link>
                  )}
                </div>
              </div>

              <div className="pt-6 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Link to={`/doctor/patients/${appt.patient?.id}`} className="w-full">
                    <Button
                      variant="outline"
                      fullWidth
                      icon={<Eye size={16} />}
                    >
                      View Patient
                    </Button>
                  </Link>
                  <Link to={`/doctor/consultation/${appt.appointmentId}`} className="w-full">
                    <Button
                      variant="primary"
                      fullWidth
                    >
                      Open Consultation
                    </Button>
                  </Link>
                </div>

                {appt.status === 'Scheduled' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="primary"
                      onClick={() => handleStatusChangeClick(appt, 'Completed')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 font-bold"
                    >
                      Complete
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleStatusChangeClick(appt, 'Cancelled')}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Appointments Found"
          description="There are no consultations matching your search criteria."
          icon="📅"
        />
      )}

      {statusUpdateInfo && (
        <Modal
          isOpen={!!statusUpdateInfo}
          onClose={() => setStatusUpdateInfo(null)}
          title="Update Appointment Status"
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 text-sm">
              <AlertTriangle size={24} className="shrink-0" />
              <div>
                Updating status of appointment for{' '}
                <span className="font-bold">{statusUpdateInfo.appointment.patient?.fullName}</span> to{' '}
                <span className="font-bold">{statusUpdateInfo.newStatus}</span>.
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Confirm if you would like to mark the slot on{' '}
              <span className="font-semibold text-slate-800">
                {formatDate(statusUpdateInfo.appointment.appointmentDate)}
              </span>{' '}
              at{' '}
              <span className="font-semibold text-slate-800">
                {formatTime(statusUpdateInfo.appointment.appointmentTime)}
              </span>{' '}
              as <span className="font-semibold text-slate-800">{statusUpdateInfo.newStatus}</span>?
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                disabled={updating}
                onClick={() => setStatusUpdateInfo(null)}
              >
                Go Back
              </Button>
              <Button
                variant={statusUpdateInfo.newStatus === 'Completed' ? 'primary' : 'danger'}
                loading={updating}
                onClick={handleConfirmStatusChange}
              >
                Confirm Update
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {selectedConsultation && (
        <Modal
          isOpen={!!selectedConsultation}
          onClose={() => setSelectedConsultation(null)}
          title={`Consultation Vitals - ${selectedConsultation.patient?.fullName}`}
        >
          <div className="space-y-6 pt-2 text-sm text-slate-600">
            {/* SECTION 1: Pre-Consultation Vitals */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                  SECTION 1: Pre-Consultation Vitals
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border bg-blue-50 text-blue-700 border-blue-100">
                  Recorded by Patient
                </span>
              </div>

              {!selectedConsultation.preConsultationVitals ? (
                <p className="text-xs text-slate-400 italic">No pre-consultation vitals recorded by the patient.</p>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Heart Rate</div>
                      <div className="text-md font-extrabold text-slate-850 mt-1">
                        ❤️ {selectedConsultation.preConsultationVitals.heartRate} bpm
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">SpO₂</div>
                      <div className="text-md font-extrabold text-slate-850 mt-1">
                        🩸 {selectedConsultation.preConsultationVitals.spo2}%
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Temp</div>
                      <div className="text-md font-extrabold text-slate-850 mt-1">
                        🌡️ {selectedConsultation.preConsultationVitals.temperature}°C
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold pt-1">
                    <span>Source: {selectedConsultation.preConsultationVitals.source}</span>
                    <span>Recorded: {getRelativeTime(selectedConsultation.preConsultationVitals.recordedAt)}</span>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 text-xs px-3"
                      onClick={handleUsePreConsultationVitals}
                    >
                      Copy to Consultation Vitals
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: Live Telemetry */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                  SECTION 2: Live Telemetry
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${selectedConsultation.patient?.deviceSource === 'VIRTUAL'
                    ? 'bg-purple-50 text-purple-700 border-purple-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}>
                  {selectedConsultation.patient?.deviceSource === 'VIRTUAL'
                    ? 'Virtual Medical Device'
                    : 'Live Device'}
                </span>
              </div>

              {!selectedConsultation.latestVital ? (
                <p className="text-xs text-slate-400 italic">No live telemetry available.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Heart Rate</div>
                    <div className="text-md font-extrabold text-slate-800 mt-1">
                      ❤️ {selectedConsultation.latestVital.heartRate} bpm
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">SpO₂</div>
                    <div className="text-md font-extrabold text-slate-800 mt-1">
                      🩸 {selectedConsultation.latestVital.spo2}%
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Temp</div>
                    <div className="text-md font-extrabold text-slate-800 mt-1">
                      🌡️ {selectedConsultation.latestVital.temperature}°C
                    </div>
                  </div>
                  <div className="col-span-3 text-[10px] text-slate-400 text-right font-medium">
                    Recorded {getRelativeTime(selectedConsultation.latestVital.recordedAt)}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: Consultation Vitals */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                SECTION 3: Consultation Vitals
              </h3>

              {/* Show saved consultation vitals summary if they exist and we are not editing/recording */}
              {selectedConsultation.consultationVitals && !isRecordingManually ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Heart Rate</div>
                      <div className="text-sm font-bold text-slate-800 mt-1">
                        ❤️ {selectedConsultation.consultationVitals.heartRate} bpm
                      </div>
                      <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase border ${getHeartRateBadge(selectedConsultation.consultationVitals.heartRate).styles}`}>
                        {getHeartRateBadge(selectedConsultation.consultationVitals.heartRate).label}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">SpO₂</div>
                      <div className="text-sm font-bold text-slate-800 mt-1">
                        🩸 {selectedConsultation.consultationVitals.spo2}%
                      </div>
                      <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase border ${getSpO2Badge(selectedConsultation.consultationVitals.spo2).styles}`}>
                        {getSpO2Badge(selectedConsultation.consultationVitals.spo2).label}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Temp</div>
                      <div className="text-sm font-bold text-slate-800 mt-1">
                        🌡️ {selectedConsultation.consultationVitals.temperature}°C
                      </div>
                      <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase border ${getTemperatureBadge(selectedConsultation.consultationVitals.temperature).styles}`}>
                        {getTemperatureBadge(selectedConsultation.consultationVitals.temperature).label}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      ✓ Consultation Vitals Saved
                    </span>
                    <Button
                      variant="outline"
                      className="h-8 text-xs px-3"
                      onClick={() => {
                        setVitalsForm({
                          heartRate: selectedConsultation.consultationVitals.heartRate.toString(),
                          spo2: selectedConsultation.consultationVitals.spo2.toString(),
                          temperature: selectedConsultation.consultationVitals.temperature.toString(),
                        });
                        setIsRecordingManually(true);
                      }}
                    >
                      Edit Vitals
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* If not recording manually yet and no vitals exist */}
                  {!selectedConsultation.consultationVitals && !isRecordingManually ? (
                    <p className="text-xs text-slate-400 italic">No consultation vitals recorded.</p>
                  ) : null}

                  {/* Buttons 1, 2, & 3 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUseLatestTelemetry}
                      disabled={!selectedConsultation.latestVital}
                      className="text-xs h-9 font-semibold"
                    >
                      Use Live Telemetry
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUsePreConsultationVitals}
                      disabled={!selectedConsultation.preConsultationVitals}
                      className="text-xs h-9 font-semibold"
                    >
                      Use Pre-Consultation
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setVitalsForm({ heartRate: '', spo2: '', temperature: '' });
                        setIsRecordingManually(true);
                      }}
                      className="text-xs h-9 font-semibold"
                    >
                      Record Manually
                    </Button>
                  </div>

                  {/* Form to enter or edit values */}
                  {isRecordingManually && (
                    <form onSubmit={handleSaveConsultationVitals} className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Heart Rate (bpm)
                          </label>
                          <input
                            type="number"
                            required
                            min="30"
                            max="220"
                            value={vitalsForm.heartRate}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: e.target.value })}
                            className="w-full px-3 py-1.5 text-slate-800 bg-white border border-slate-200 text-xs rounded-lg outline-none focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            SpO₂ (%)
                          </label>
                          <input
                            type="number"
                            required
                            min="50"
                            max="100"
                            value={vitalsForm.spo2}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
                            className="w-full px-3 py-1.5 text-slate-800 bg-white border border-slate-200 text-xs rounded-lg outline-none focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Temp (°C)
                          </label>
                          <input
                            type="number"
                            required
                            step="0.1"
                            min="30"
                            max="45"
                            value={vitalsForm.temperature}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                            className="w-full px-3 py-1.5 text-slate-800 bg-white border border-slate-200 text-xs rounded-lg outline-none focus:border-indigo-500 transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        {selectedConsultation.consultationVitals && (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => setIsRecordingManually(false)}
                          >
                            Cancel Edit
                          </Button>
                        )}
                        <Button
                          type="submit"
                          variant="primary"
                          loading={savingVitals}
                          className="h-8 text-xs font-bold"
                        >
                          Save Consultation Vitals
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setSelectedConsultation(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Appointments;

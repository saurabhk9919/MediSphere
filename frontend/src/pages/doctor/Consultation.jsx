import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart, Activity, Thermometer, Calendar, Clock, CheckCircle2,
  Search, ArrowDownToLine, TrendingUp, ChevronLeft, FileText, ClipboardList,
  User, ShieldAlert, Zap, Cpu
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import PrescriptionForm from '../../components/doctor/PrescriptionForm';
import { getDoctorAppointments, updateAppointmentStatus, updateConsultationVitals } from '../../services/appointment.api';
import { getPatientVitalsForDoctor, startDeviceSimulation, stopDeviceSimulation, updatePatientDeviceSource } from '../../services/vital.api';
import { getDoctorPrescriptions } from '../../services/prescription.api';
import { formatDate, formatTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const Consultation = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [vitals, setVitals] = useState([]);

  // Historical trend / log filters
  const [searchQuery, setSearchQuery] = useState('');
  const [limitFilter, setLimitFilter] = useState('7');
  const [sortOrder, setSortOrder] = useState('newest');

  // Telemetry simulation source
  const [deviceMode, setDeviceMode] = useState('live'); // 'live' or 'virtual'

  // Vitals form
  const [isRecordingManually, setIsRecordingManually] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({ heartRate: '', spo2: '', temperature: '' });
  const [savingVitals, setSavingVitals] = useState(false);
  const [vitalsSaved, setVitalsSaved] = useState(false);

  // Prescription status
  const [prescriptionIssued, setPrescriptionIssued] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [timeTicker, setTimeTicker] = useState(Date.now());

  const fetchConsultationData = async () => {
    try {
      setLoading(true);
      const [apptRes, prescRes] = await Promise.all([
        getDoctorAppointments(),
        getDoctorPrescriptions()
      ]);

      if (apptRes && apptRes.success) {
        const foundAppt = apptRes.data.find(
          (a) => String(a.appointmentId) === String(appointmentId)
        );

        if (foundAppt) {
          setAppointment(foundAppt);

          // Check if consultation vitals already exist
          if (foundAppt.consultationVitals) {
            setVitalsForm({
              heartRate: foundAppt.consultationVitals.heartRate.toString(),
              spo2: foundAppt.consultationVitals.spo2.toString(),
              temperature: foundAppt.consultationVitals.temperature.toString(),
            });
            setVitalsSaved(true);
          }

          // Check if prescription was already issued
          if (prescRes && prescRes.success) {
            const hasPrescription = prescRes.data.some(
              (p) => String(p.appointment?.appointmentId) === String(appointmentId)
            );
            setPrescriptionIssued(hasPrescription);
          }

          // Fetch patient historical vitals
          const patientId = foundAppt.patient?.id;
          if (patientId) {
            const vitalsRes = await getPatientVitalsForDoctor(patientId);
            if (vitalsRes && vitalsRes.success) {
              setVitals(vitalsRes.vitals || []);
            }

            // Restore device mode from patient configuration
            if (foundAppt.patient?.deviceSource === 'VIRTUAL') {
              setDeviceMode('virtual');
            } else {
              setDeviceMode('live');
            }
          }
        } else {
          toast.error('Appointment not found.');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load consultation workspace.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVitalsSilent = async () => {
    if (!appointment?.patient?.id) return;
    try {
      const vitalsRes = await getPatientVitalsForDoctor(appointment.patient.id);
      if (vitalsRes && vitalsRes.success) {
        setVitals(vitalsRes.vitals || []);
      }
    } catch (err) {
      console.error('Silent refresh failed:', err);
    }
  };

  useEffect(() => {
    if (appointmentId) {
      fetchConsultationData();
    }
  }, [appointmentId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTicker(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle telemetry refresh polling (both Virtual Device and Live Device telemetry)
  useEffect(() => {
    if (!appointment?.patient?.id) return;

    const intervalId = setInterval(() => {
      fetchVitalsSilent();
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [appointment]);

  const handleDeviceModeChange = async (newMode) => {
    if (newMode === deviceMode || !appointment?.patient?.id) return;
    const patientId = appointment.patient.id;
    const dbSource = newMode === 'virtual' ? 'VIRTUAL' : 'LIVE';
    try {
      await updatePatientDeviceSource(patientId, dbSource);
      if (newMode === 'virtual') {
        await startDeviceSimulation(patientId);
        toast.success('Switched to Virtual Device telemetry');
      } else {
        await stopDeviceSimulation();
        toast.success('Switched to Live Device telemetry');
      }
      setDeviceMode(newMode);
    } catch (err) {
      console.error('Failed to change device source mode:', err);
      toast.error('Failed to update telemetry source');
    }
  };

  const handleUseLatestTelemetry = () => {
    const latestVital = vitals[0];
    if (!latestVital) {
      toast.error('No live telemetry available to copy.');
      return;
    }
    setVitalsForm({
      heartRate: latestVital.heartRate ? latestVital.heartRate.toString() : '',
      spo2: latestVital.spo2 ? latestVital.spo2.toString() : '',
      temperature: latestVital.temperature ? latestVital.temperature.toString() : '',
    });
    setIsRecordingManually(true);
    toast.success('Latest telemetry copied. Please review and save.');
  };

  const handleUsePreConsultationVitals = () => {
    if (!appointment?.preConsultationVitals) {
      toast.error('No pre-consultation vitals available to copy.');
      return;
    }
    const { heartRate, spo2, temperature } = appointment.preConsultationVitals;
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
    if (!appointment) return;

    const { heartRate, spo2, temperature } = vitalsForm;
    if (!heartRate.trim() || !spo2.trim() || !temperature.trim()) {
      toast.error('All vital sign fields are required.');
      return;
    }

    try {
      setSavingVitals(true);
      const res = await updateConsultationVitals(appointment.appointmentId, {
        heartRate: parseInt(heartRate, 10),
        spo2: parseInt(spo2, 10),
        temperature: parseFloat(temperature)
      });

      if (res && res.success) {
        toast.success('Consultation vitals saved successfully!');
        setVitalsSaved(true);
        // Refresh appointment state locally
        setAppointment(prev => ({
          ...prev,
          consultationVitals: {
            heartRate: parseInt(heartRate, 10),
            spo2: parseInt(spo2, 10),
            temperature: parseFloat(temperature)
          }
        }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save consultation vitals.');
    } finally {
      setSavingVitals(false);
    }
  };

  const handleFinishConsultation = async () => {
    if (!vitalsSaved) {
      toast.error('Please save consultation vitals before finishing.');
      return;
    }
    if (!prescriptionIssued) {
      toast.error('Please issue the prescription before finishing.');
      return;
    }

    try {
      setCompleting(true);
      const res = await updateAppointmentStatus(appointment.appointmentId, 'Completed');
      if (res && res.success) {
        toast.success('Consultation finished successfully!');
        navigate('/doctor/appointments');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to finalize appointment status.');
    } finally {
      setCompleting(false);
    }
  };

  // Vitals filter & sort logic
  const searchedVitals = vitals.filter((item) => {
    const dateStr = formatDate(item.recordedAt) || '';
    const query = searchQuery.toLowerCase();
    return dateStr.toLowerCase().includes(query);
  });

  const limitedVitals =
    limitFilter === 'all'
      ? searchedVitals
      : searchedVitals.slice(0, parseInt(limitFilter, 10));

  const finalVitals = [...limitedVitals].sort((a, b) => {
    const timeA = new Date(a.recordedAt).getTime();
    const timeB = new Date(b.recordedAt).getTime();
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  const chartData = [...limitedVitals]
    .map((item) => ({
      date: formatDate(item.recordedAt),
      heartRate: item.heartRate,
      spo2: item.spo2,
      temperature: item.temperature,
    }))
    .reverse();

  const handleExportCSV = () => {
    if (finalVitals.length === 0) {
      toast.error('No vitals data available to export.');
      return;
    }
    const headers = [
      'Recorded Date',
      'Heart Rate (bpm)',
      'SpO2 (%)',
      'Temperature (°C)',
      'Recorded By',
    ];
    const rows = finalVitals.map((item) => [
      `${formatDate(item.recordedAt)} ${formatTime(item.recordedAt)}`,
      item.heartRate,
      item.spo2,
      item.temperature,
      `Dr. ${item.doctor?.fullName || ''}`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...rows.map((r) => r.map((val) => `"${val}"`).join(',')),
      ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `patient_${appointment?.patient?.id}_vitals_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully!');
  };

  const latestVital = vitals[0];

  const isTelemetryFresh = () => {
    if (!latestVital) return false;
    const ageMs = timeTicker - new Date(latestVital.recordedAt).getTime();
    return ageMs < 15000; // Fresh if received in the last 15 seconds
  };

  const getRelativeTelemetryTime = () => {
    if (!latestVital) return '';
    const diffSec = Math.floor((timeTicker - new Date(latestVital.recordedAt).getTime()) / 1000);
    if (diffSec < 5) return 'just now';
    return `${diffSec} seconds ago`;
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader size="medium" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <EmptyState
        title="Workspace Unavailable"
        description="Could not load the consultation file for this appointment."
        icon="🏥"
        actionButton={
          <Button onClick={() => navigate('/doctor/appointments')}>
            Back to Appointments
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            to="/doctor/appointments"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition shrink-0"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Consultation Room
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              Active Workspace
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 select-none">
          <span className="text-xs text-slate-400 font-bold uppercase">Status:</span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border ${appointment.status === 'Completed'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse'
            }`}>
            {appointment.status === 'Completed' ? 'Completed' : 'In Consultation'}
          </span>
        </div>
      </div>

      {/* Main EHR Workspace Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Clinical Files & Vitals Telemetry (7 Cols) */}
        <div className="xl:col-span-7 space-y-6">

          {/* Section 1: Patient Information */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 select-none">
              1. Patient Demographics & Info
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="block text-slate-400 font-bold uppercase mb-0.5 select-none">Full Name</span>
                <span className="font-bold text-slate-800 text-sm">{appointment.patient?.fullName}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase mb-0.5 select-none">Age / Gender</span>
                <span className="font-bold text-slate-800 text-sm">
                  {appointment.patient?.age} yrs / {appointment.patient?.gender}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase mb-0.5 select-none">Blood Group</span>
                <span className="font-bold text-slate-800 text-sm">{appointment.patient?.bloodGroup || 'Not Specified'}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase mb-0.5 select-none">Contact</span>
                <span className="font-bold text-slate-800 text-sm">{appointment.patient?.phone || 'Not Provided'}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs mt-2 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5 select-none">Appointment Date & Time</span>
                  <span className="font-semibold text-slate-700">
                    {formatDate(appointment.appointmentDate)} @ {formatTime(appointment.appointmentTime)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5 select-none">Visit Reason</span>
                  <span className="font-semibold text-slate-700 italic">"{appointment.reason || 'None specified.'}"</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Pre-Consultation Vitals */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 select-none">
              2. Pre-Consultation Vitals (Patient Snapshot)
            </h2>
            {!appointment.preConsultationVitals ? (
              <p className="text-xs text-slate-400 italic py-2">No pre-consultation vitals submitted by the patient.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
                <div className="p-3 bg-rose-50/20 rounded-xl border border-rose-100/30 text-center">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1 select-none">Heart Rate</span>
                  <span className="text-md font-extrabold text-rose-600">❤️ {appointment.preConsultationVitals.heartRate} bpm</span>
                </div>
                <div className="p-3 bg-blue-50/20 rounded-xl border border-blue-100/30 text-center">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1 select-none">SpO₂</span>
                  <span className="text-md font-extrabold text-blue-600">🩸 {appointment.preConsultationVitals.spo2}%</span>
                </div>
                <div className="p-3 bg-amber-50/20 rounded-xl border border-amber-100/30 text-center">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1 select-none">Temperature</span>
                  <span className="text-md font-extrabold text-amber-600">🌡️ {appointment.preConsultationVitals.temperature}°C</span>
                </div>
                <div className="md:col-span-3 flex justify-between text-[10px] text-slate-400 font-bold mt-1 px-1 select-none">
                  <span>Device: {appointment.preConsultationVitals.source}</span>
                  <span>Recorded: {formatDate(appointment.preConsultationVitals.recordedAt)} {formatTime(appointment.preConsultationVitals.recordedAt)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Live Telemetry */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 select-none">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                3. Live Telemetry Monitor
              </h2>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${deviceMode === 'virtual'
                  ? 'bg-purple-50 text-purple-700 border-purple-100'
                  : 'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                {deviceMode === 'virtual' ? 'Virtual Simulation Mode' : 'Live Physical Mode'}
              </span>
            </div>

            {/* Toggle controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div
                onClick={() => handleDeviceModeChange('live')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${deviceMode === 'live'
                    ? 'border-blue-500 bg-blue-50/10'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={deviceMode === 'live'}
                    onChange={() => { }}
                    className="w-3.5 h-3.5 accent-blue-600 cursor-pointer font-semibold"
                  />
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Cpu size={14} className="text-blue-500" />
                    <span>Live Device Mode</span>
                  </div>
                </div>
              </div>

              <div
                onClick={() => handleDeviceModeChange('virtual')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${deviceMode === 'virtual'
                    ? 'border-purple-500 bg-purple-50/10'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={deviceMode === 'virtual'}
                    onChange={() => { }}
                    className="w-3.5 h-3.5 accent-purple-600 cursor-pointer font-semibold"
                  />
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Zap size={14} className="text-purple-500" />
                    <span>Virtual Simulation Mode</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live readout */}
            {!latestVital ? (
              <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 text-xs italic text-slate-400">
                Waiting for telemetry...
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 text-xs pt-1">
                <div className="p-4 bg-rose-50/30 rounded-xl border border-rose-100/50 text-center shadow-xs">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-bold uppercase mb-1 select-none">
                    <Heart size={12} className="text-rose-500" />
                    <span>Live Heart Rate</span>
                  </div>
                  <span className="text-xl font-extrabold text-slate-800">{latestVital.heartRate} bpm</span>
                </div>
                <div className="p-4 bg-blue-50/30 rounded-xl border border-blue-100/50 text-center shadow-xs">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-bold uppercase mb-1 select-none">
                    <Activity size={12} className="text-blue-500" />
                    <span>Live SpO₂</span>
                  </div>
                  <span className="text-xl font-extrabold text-slate-800">{latestVital.spo2}%</span>
                </div>
                <div className="p-4 bg-amber-50/30 rounded-xl border border-amber-100/50 text-center shadow-xs">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-bold uppercase mb-1 select-none">
                    <Thermometer size={12} className="text-amber-500" />
                    <span>Live Temperature</span>
                  </div>
                  <span className="text-xl font-extrabold text-slate-800">{latestVital.temperature}°C</span>
                </div>
                <div className="col-span-3 flex justify-between text-[10px] text-slate-400 font-semibold px-1 mt-1 select-none">
                  {deviceMode === 'virtual' ? (
                    <>
                      <span>Simulation Telemetry active</span>
                      <span>Last updated: {formatTime(latestVital.recordedAt)}</span>
                    </>
                  ) : isTelemetryFresh() ? (
                    <>
                      <span className="text-emerald-600 font-bold">🟢 Live Telemetry active (received {getRelativeTelemetryTime()})</span>
                      <span>Last updated: {formatTime(latestVital.recordedAt)}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-blue-600 font-bold">🔵 Waiting for Device (no recent readings)</span>
                      <span>Stale since: {formatTime(latestVital.recordedAt)}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Historical Vitals (Charts & Log logs table) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 select-none">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                4. Patient Vitals History
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Limit:</span>
                <select
                  value={limitFilter}
                  onChange={(e) => setLimitFilter(e.target.value)}
                  className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg outline-none"
                >
                  <option value="7">7 Entries</option>
                  <option value="30">30 Entries</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>

            {vitals.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">No historical records available on file.</p>
            ) : (
              <div className="space-y-6">
                {/* Trend Charts */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
                  <div className="flex justify-between items-center mb-4 select-none">
                    <h3 className="text-xs font-bold text-slate-650 flex items-center gap-1">
                      <TrendingUp size={14} className="text-blue-500" />
                      Visual Vitals Trends
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-center">
                      <h4 className="text-[9px] font-bold text-slate-400 uppercase mb-2">Heart Rate (bpm)</h4>
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" hide />
                            <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fontSize: 9 }} stroke="#94a3b8" />
                            <Tooltip />
                            <Line type="monotone" dataKey="heartRate" name="HR" stroke="#f43f5e" strokeWidth={1.5} dot={{ r: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-center">
                      <h4 className="text-[9px] font-bold text-slate-400 uppercase mb-2">SpO₂ (%)</h4>
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" hide />
                            <YAxis domain={[85, 100]} tick={{ fontSize: 9 }} stroke="#94a3b8" />
                            <Tooltip />
                            <Line type="monotone" dataKey="spo2" name="SpO2" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-center">
                      <h4 className="text-[9px] font-bold text-slate-400 uppercase mb-2">Temp (°C)</h4>
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" hide />
                            <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 9 }} stroke="#94a3b8" />
                            <Tooltip />
                            <Line type="monotone" dataKey="temperature" name="Temp" stroke="#d97706" strokeWidth={1.5} dot={{ r: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                {/* History Log Table */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
                  <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:flex-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="text"
                        placeholder="Search logs by date..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-200 text-slate-800 text-[11px] rounded-lg outline-none focus:border-blue-500 bg-white transition-all h-[32px]"
                      />
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto items-center">
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-200 text-slate-700 text-[11px] rounded-lg outline-none bg-white h-[32px]"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                      </select>
                      <Button
                        variant="outline"
                        onClick={handleExportCSV}
                        className="h-[32px] text-[10px] font-bold px-2.5 shrink-0"
                      >
                        Export CSV
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full border-collapse text-left text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                          <th className="p-3">Recorded Time</th>
                          <th className="p-3">Heart Rate</th>
                          <th className="p-3">SpO₂</th>
                          <th className="p-3">Temp</th>
                          <th className="p-3">Recorded By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-600">
                        {finalVitals.map((item) => (
                          <tr key={item.vitalId} className="hover:bg-slate-50/50 transition">
                            <td className="p-3 font-semibold text-slate-800">
                              {formatDate(item.recordedAt)} {formatTime(item.recordedAt)}
                            </td>
                            <td className="p-3 font-bold text-rose-500">{item.heartRate} bpm</td>
                            <td className="p-3 font-bold text-blue-500">{item.spo2} %</td>
                            <td className="p-3 font-bold text-amber-500">{item.temperature} °C</td>
                            <td className="p-3 font-bold text-slate-700">
                              Dr. {item.doctor?.fullName || 'Office Staff'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Clinical Actions - Forms, Rx, & Finalize (5 Cols) */}
        <div className="xl:col-span-5 space-y-6">

          {/* Section 5: Consultation Vitals Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 select-none">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                5. Record Office Vitals
              </h2>
              {vitalsSaved && (
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-full font-bold uppercase">
                  ✓ Saved
                </span>
              )}
            </div>

            {/* Autofill commands */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleUseLatestTelemetry}
                disabled={vitals.length === 0}
                className="text-xs h-9 font-bold leading-none"
              >
                Use Telemetry
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleUsePreConsultationVitals}
                disabled={!appointment.preConsultationVitals}
                className="text-xs h-9 font-bold leading-none"
              >
                Use Pre-Consultation
              </Button>
            </div>

            {/* Inputs Form */}
            <form onSubmit={handleSaveConsultationVitals} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 select-none">
                    Heart Rate
                  </label>
                  <input
                    type="number"
                    required
                    min="30"
                    max="220"
                    value={vitalsForm.heartRate}
                    onChange={(e) => {
                      setVitalsForm({ ...vitalsForm, heartRate: e.target.value });
                      setVitalsSaved(false);
                    }}
                    className="w-full px-3 py-2 text-slate-800 bg-white border border-slate-200 text-xs rounded-xl outline-none focus:border-indigo-500 transition-all h-[36px]"
                    placeholder="bpm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 select-none">
                    SpO₂
                  </label>
                  <input
                    type="number"
                    required
                    min="50"
                    max="100"
                    value={vitalsForm.spo2}
                    onChange={(e) => {
                      setVitalsForm({ ...vitalsForm, spo2: e.target.value });
                      setVitalsSaved(false);
                    }}
                    className="w-full px-3 py-2 text-slate-800 bg-white border border-slate-200 text-xs rounded-xl outline-none focus:border-indigo-500 transition-all h-[36px]"
                    placeholder="%"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 select-none">
                    Temperature
                  </label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="30"
                    max="45"
                    value={vitalsForm.temperature}
                    onChange={(e) => {
                      setVitalsForm({ ...vitalsForm, temperature: e.target.value });
                      setVitalsSaved(false);
                    }}
                    className="w-full px-3 py-2 text-slate-800 bg-white border border-slate-200 text-xs rounded-xl outline-none focus:border-indigo-500 transition-all h-[36px]"
                    placeholder="°C"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  variant={vitalsSaved ? "outline" : "primary"}
                  loading={savingVitals}
                  className="h-8 text-xs font-bold px-4"
                >
                  {vitalsSaved ? 'Save Again' : 'Save Vitals'}
                </Button>
              </div>
            </form>
          </div>

          {/* Section 6: Prescription Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 select-none">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                6. Prescription Pad
              </h2>
              {prescriptionIssued && (
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-full font-bold uppercase">
                  ✓ Issued
                </span>
              )}
            </div>

            <PrescriptionForm
              appointment={appointment}
              showCancelButton={false}
              onSubmitSuccess={() => setPrescriptionIssued(true)}
            />
          </div>

          {/* Section 7: Summary & Finish */}
          <div className="bg-white p-6 rounded-2xl border border-slate-250 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-150 pb-2 select-none">
              7. Closeout Summary
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                <span className="font-semibold text-slate-500 select-none">Patient Demographics</span>
                <span className="font-bold text-slate-800">Ready</span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                <span className="font-semibold text-slate-500 select-none">Consultation Vitals Status</span>
                {vitalsSaved ? (
                  <span className="font-bold text-emerald-600 flex items-center gap-1">✓ Saved</span>
                ) : (
                  <span className="font-bold text-rose-500 flex items-center gap-1">⚠️ Required</span>
                )}
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                <span className="font-semibold text-slate-500 select-none">Prescription Issued Status</span>
                {prescriptionIssued ? (
                  <span className="font-bold text-emerald-600 flex items-center gap-1">✓ Issued</span>
                ) : (
                  <span className="font-bold text-rose-500 flex items-center gap-1">⚠️ Required</span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 gap-2">
              <Button
                variant="primary"
                onClick={handleFinishConsultation}
                disabled={!vitalsSaved || !prescriptionIssued || completing}
                loading={completing}
                fullWidth
                className="h-10 text-sm font-bold"
              >
                Finish Consultation
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/doctor/appointments')}
                fullWidth
                className="h-10 text-xs font-bold"
              >
                Return to Appointments
              </Button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Consultation;

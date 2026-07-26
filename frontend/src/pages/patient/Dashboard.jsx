import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileText, Activity, Heart, ShieldAlert } from 'lucide-react';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { getPatientAppointments } from '../../services/appointment.api';
import { getPatientPrescriptions } from '../../services/prescription.api';
import { getPatientVitals } from '../../services/vital.api';
import { formatDate, formatTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [vitals, setVitals] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [apptRes, prescRes, vitalsRes] = await Promise.all([
          getPatientAppointments(),
          getPatientPrescriptions(),
          getPatientVitals()
        ]);

        if (apptRes && apptRes.success) {
          setAppointments(apptRes.data || []);
        }
        if (prescRes && prescRes.success) {
          setPrescriptions(prescRes.data || []);
        }
        if (vitalsRes && vitalsRes.success) {
          setVitals(vitalsRes.data || []);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader size="medium" />
      </div>
    );
  }

  const upcomingAppointmentsCount = appointments.filter(
    (a) => a.status === 'Scheduled'
  ).length;

  const totalPrescriptionsCount = prescriptions.length;
  const latestVital = vitals[0];
  const latestHeartRate = latestVital ? `${latestVital.heartRate} bpm` : '--';
  const latestSpO2 = latestVital ? `${latestVital.spo2} %` : '--';

  const latestAppt = appointments[0];
  const latestPresc = prescriptions[0];

  const renderMedications = (meds) => {
    if (!meds) return 'No medications prescribed';
    if (Array.isArray(meds)) {
      return meds.map((med, idx) => (
        <span
          key={idx}
          className="inline-block bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-100"
        >
          {typeof med === 'object' ? `${med.name} (${med.dosage})` : med}
        </span>
      ));
    }
    if (typeof meds === 'string') {
      if (meds.includes(',')) {
        return meds.split(',').map((med, idx) => (
          <span
            key={idx}
            className="inline-block bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-100 mr-2 mb-2"
          >
            {med.trim()}
          </span>
        ));
      }
      if (meds.includes('\n')) {
        return meds.split('\n').map((med, idx) => (
          <span
            key={idx}
            className="inline-block bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-100 mr-2 mb-2"
          >
            {med.trim()}
          </span>
        ));
      }
      return (
        <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-100">
          {meds}
        </span>
      );
    }
    return String(meds);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Patient Portal / Dashboard
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Upcoming Slots</div>
            <div className="text-xl font-bold text-slate-800">{upcomingAppointmentsCount}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Active Prescriptions</div>
            <div className="text-xl font-bold text-slate-800">{totalPrescriptionsCount}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Heart size={24} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Heart Rate</div>
            <div className="text-xl font-bold text-slate-800">{latestHeartRate}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">SpO2</div>
            <div className="text-xl font-bold text-slate-800">{latestSpO2}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>📅</span> Next Scheduled Appointment
            </h3>
            {latestAppt ? (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-xs transition duration-150">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-md font-bold text-slate-800">
                      Dr. {latestAppt.doctor.fullName}
                    </h4>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      {latestAppt.doctor.specialization}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                      latestAppt.status === 'Scheduled'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : latestAppt.status === 'Cancelled'
                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {latestAppt.status}
                  </span>
                </div>
                <div className="text-sm text-slate-500 space-y-1">
                  <div>
                    <span className="font-semibold text-slate-700">Date:</span>{' '}
                    {formatDate(latestAppt.appointmentDate)}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Time:</span>{' '}
                    {formatTime(latestAppt.appointmentTime)}
                  </div>
                  {latestAppt.reason && (
                    <div className="mt-3 text-xs italic bg-white p-2.5 rounded-xl text-slate-600 border border-slate-100">
                      "{latestAppt.reason}"
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                title="No Appointments"
                description="You don't have any appointments booked."
                icon="📅"
              />
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>💊</span> Latest Prescription
            </h3>
            {latestPresc ? (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-xs transition duration-150 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-md font-bold text-slate-800">
                      Dr. {latestPresc.doctor.fullName}
                    </h4>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      {latestPresc.doctor.specialization}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold bg-white px-2.5 py-1 rounded-full border border-slate-100">
                    {formatDate(latestPresc.appointment.appointmentDate)}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Diagnosis
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {latestPresc.diagnosis}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Medicines
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {renderMedications(latestPresc.medications)}
                  </div>
                </div>
                {latestPresc.notes && (
                  <div className="text-xs bg-white p-3 rounded-xl border border-slate-100 text-slate-600 leading-relaxed">
                    <div className="font-semibold text-slate-700 mb-0.5">
                      Advice:
                    </div>
                    {latestPresc.notes}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                title="No Prescriptions"
                description="You don't have any prescribed medications."
                icon="💊"
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>❤️</span> Latest Vital Logs
            </h3>
            {latestVital ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 text-center rounded-xl border border-slate-100 hover:shadow-xs transition duration-150">
                    <div className="text-xs text-slate-400 font-semibold mb-1">Pulse</div>
                    <div className="text-md font-bold text-blue-600">
                      {latestVital.heartRate}{' '}
                      <span className="text-[10px] font-medium text-slate-500">bpm</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 text-center rounded-xl border border-slate-100 hover:shadow-xs transition duration-150">
                    <div className="text-xs text-slate-400 font-semibold mb-1">Oxygen</div>
                    <div className="text-md font-bold text-blue-600">
                      {latestVital.spo2}{' '}
                      <span className="text-[10px] font-medium text-slate-500">%</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 text-center rounded-xl border border-slate-100 hover:shadow-xs transition duration-150">
                    <div className="text-xs text-slate-400 font-semibold mb-1">Temp</div>
                    <div className="text-md font-bold text-blue-600">
                      {latestVital.temperature}{' '}
                      <span className="text-[10px] font-medium text-slate-500">°C</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-100">
                  <div>
                    Recorded By:{' '}
                    <span className="font-semibold text-slate-600">
                      Dr. {latestVital.doctor.fullName}
                    </span>
                  </div>
                  <div>{formatDate(latestVital.recordedAt)}</div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No Vitals"
                description="No vital parameters registered."
                icon="❤️"
              />
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/patient/book-appointment"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-blue-100 bg-blue-50/30 text-blue-700 hover:bg-blue-50 transition-all duration-200 cursor-pointer text-center group"
              >
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                  📅
                </span>
                <span className="text-xs font-bold">Book Slot</span>
              </Link>
              <Link
                to="/patient/appointments"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 hover:bg-slate-100 transition-all duration-200 cursor-pointer text-center group"
              >
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                  📋
                </span>
                <span className="text-xs font-bold">Appointments</span>
              </Link>
              <Link
                to="/patient/prescriptions"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 hover:bg-slate-100 transition-all duration-200 cursor-pointer text-center group"
              >
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                  💊
                </span>
                <span className="text-xs font-bold">Prescriptions</span>
              </Link>
              <Link
                to="/patient/vitals"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 hover:bg-slate-100 transition-all duration-200 cursor-pointer text-center group"
              >
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                  ❤️
                </span>
                <span className="text-xs font-bold">My Vitals</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

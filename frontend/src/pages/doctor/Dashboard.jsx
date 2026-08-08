import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle, FileText, Clock, Users, ShieldAlert, Activity, ClipboardList } from 'lucide-react';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { getDoctorAppointments } from '../../services/appointment.api';
import { getDoctorPrescriptions } from '../../services/prescription.api';
import { formatDate, formatTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [apptRes, prescRes] = await Promise.all([
          getDoctorAppointments(),
          getDoctorPrescriptions(),
        ]);

        if (apptRes && apptRes.success) {
          setAppointments(apptRes.data || []);
        }
        if (prescRes && prescRes.success) {
          setPrescriptions(prescRes.data || []);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load doctor statistics.');
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

  const todayStr = new Date().toISOString().split('T')[0];

  const todaysAppointments = appointments.filter(
    (a) => a.appointmentDate === todayStr
  );

  const todaysAppointmentsCount = todaysAppointments.length;

  const scheduledAppointmentsCount = appointments.filter(
    (a) => a.status === 'Scheduled'
  ).length;

  const completedAppointmentsCount = appointments.filter(
    (a) => a.status === 'Completed'
  ).length;

  const totalPrescriptionsCount = prescriptions.length;

  const sortedTodaysAppointments = [...todaysAppointments].sort((a, b) =>
    a.appointmentTime.localeCompare(b.appointmentTime)
  );

  const recentPrescriptions = prescriptions.slice(0, 5);

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
          Doctor Portal / Dashboard
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Today's Visits</div>
            <div className="text-xl font-bold text-slate-800">{todaysAppointmentsCount}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Scheduled Slots</div>
            <div className="text-xl font-bold text-slate-800">{scheduledAppointmentsCount}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Completed Visits</div>
            <div className="text-xl font-bold text-slate-800">{completedAppointmentsCount}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Rx Written</div>
            <div className="text-xl font-bold text-slate-800">{totalPrescriptionsCount}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>📅</span> Today's Appointments
            </h3>
            {sortedTodaysAppointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="p-3">Patient Name</th>
                      <th className="p-3">Time</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600">
                    {sortedTodaysAppointments.map((appt) => (
                      <tr key={appt.appointmentId} className="hover:bg-slate-50/30 transition">
                        <td className="p-3 font-semibold text-slate-800">
                          {appt.patient?.fullName}
                        </td>
                        <td className="p-3 font-medium text-slate-500">
                          {formatTime(appt.appointmentTime)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getStatusStyles(
                              appt.status
                            )}`}
                          >
                            {appt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No Appointments Today"
                description="There are no consultations scheduled for today."
                icon="📅"
              />
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>💊</span> Recent Prescriptions
            </h3>
            {recentPrescriptions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="p-3">Patient Name</th>
                      <th className="p-3">Diagnosis</th>
                      <th className="p-3">Date Issued</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600">
                    {recentPrescriptions.map((presc) => (
                      <tr key={presc.prescriptionId} className="hover:bg-slate-50/30 transition">
                        <td className="p-3 font-semibold text-slate-800">
                          {presc.patient?.fullName}
                        </td>
                        <td className="p-3 font-medium text-slate-600 truncate max-w-[200px]">
                          {presc.diagnosis}
                        </td>
                        <td className="p-3 text-slate-400">
                          {formatDate(presc.appointment?.appointmentDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No Recent Prescriptions"
                description="You haven't generated any patient prescriptions yet."
                icon="💊"
              />
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 h-fit">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            <Link
              to="/doctor/appointments"
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 transition-all duration-200 group"
            >
              <span className="text-xl p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-105 transition-transform">
                📅
              </span>
              <div>
                <div className="text-xs font-bold text-slate-800">Manage Appointments</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Update schedules and slot statuses
                </div>
              </div>
            </Link>

            <Link
              to="/doctor/patients"
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 transition-all duration-200 group"
            >
              <span className="text-xl p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-105 transition-transform">
                👥
              </span>
              <div>
                <div className="text-xs font-bold text-slate-800">Patient Directory</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Access patient charts and profiles
                </div>
              </div>
            </Link>

            <Link
              to="/doctor/prescriptions"
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 transition-all duration-200 group"
            >
              <span className="text-xl p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-105 transition-transform">
                ✍️
              </span>
              <div>
                <div className="text-xs font-bold text-slate-800">Create Prescription</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Draft patient diagnoses and advice
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

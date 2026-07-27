import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, Activity, Thermometer, Calendar, Search, ArrowDownToLine, TrendingUp, ChevronLeft, FileText, ClipboardList } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { getPatientVitalsForDoctor } from '../../services/vital.api';
import { getUserProfileById } from '../../services/user.api';
import { formatDate, formatTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const PatientVitals = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [patientProfile, setPatientProfile] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [limitFilter, setLimitFilter] = useState('7');
  const [sortOrder, setSortOrder] = useState('newest');

  const fetchVitalsData = async () => {
    try {
      setLoading(true);
      const [profileRes, vitalsRes] = await Promise.all([
        getUserProfileById(patientId),
        getPatientVitalsForDoctor(patientId),
      ]);

      if (profileRes && profileRes.success) {
        setPatientProfile(profileRes.data);
      }
      if (vitalsRes && vitalsRes.success) {
        setVitals(vitalsRes.vitals || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load patient vitals data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchVitalsData();
    }
  }, [patientId]);

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
      `patient_${patientId}_vitals_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully!');
  };

  const latestVital = vitals[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <Link
          to={`/doctor/patients/${patientId}`}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition shrink-0"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="flex flex-col gap-0.5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Patient Portal / Registry / Telemetry
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {patientProfile ? `${patientProfile.full_name}'s Vitals` : 'Patient Vitals'}
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[40vh] w-full items-center justify-center">
          <Loader size="medium" />
        </div>
      ) : vitals.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl">
                <Heart size={24} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Latest Heart Rate
                </div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">
                  {latestVital ? `${latestVital.heartRate} bpm` : '--'}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
                <Activity size={24} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Latest SpO2
                </div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">
                  {latestVital ? `${latestVital.spo2} %` : '--'}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
                <Thermometer size={24} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Latest Temperature
                </div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">
                  {latestVital ? `${latestVital.temperature} °C` : '--'}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Calendar size={24} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Last Recorded Date
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-1 truncate">
                  {latestVital
                    ? `${formatDate(latestVital.recordedAt)} ${formatTime(
                        latestVital.recordedAt
                      )}`
                    : '--'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" />
                Vitals Trends
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">View:</span>
                <select
                  value={limitFilter}
                  onChange={(e) => setLimitFilter(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg outline-none"
                >
                  <option value="7">Last 7 Entries</option>
                  <option value="30">Last 30 Entries</option>
                  <option value="all">All Entries</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 text-center">
                  Heart Rate Trend (bpm)
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="heartRate"
                        name="Heart Rate"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 text-center">
                  SpO2 Trend (%)
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis domain={[80, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="spo2"
                        name="Oxygen"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 text-center">
                  Temperature Trend (°C)
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="temperature"
                        name="Temp"
                        stroke="#d97706"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search log history by date (e.g. Jul 26, 2026)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 text-slate-800 text-xs rounded-xl outline-none focus:border-blue-500 bg-white transition-all h-[36px]"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
                <div className="w-full sm:w-40 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Sort:</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 text-slate-700 text-xs rounded-xl outline-none bg-white transition-all h-[36px]"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>

                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  icon={<ArrowDownToLine size={15} />}
                  className="h-[36px] text-xs font-bold w-full sm:w-auto shrink-0"
                >
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Heart Rate</th>
                    <th className="p-4">SpO₂</th>
                    <th className="p-4">Temperature</th>
                    <th className="p-4">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {finalVitals.map((item) => (
                    <tr key={item.vitalId} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-medium text-slate-800">
                        {formatDate(item.recordedAt)} {formatTime(item.recordedAt)}
                      </td>
                      <td className="p-4 font-bold text-rose-500">{item.heartRate} bpm</td>
                      <td className="p-4 font-bold text-blue-500">{item.spo2} %</td>
                      <td className="p-4 font-bold text-amber-500">{item.temperature} °C</td>
                      <td className="p-4 font-semibold text-slate-700">
                        Dr. {item.doctor?.fullName || 'Not Specified'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                to={`/doctor/patients/${patientId}`}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition text-center group cursor-pointer"
              >
                <span className="text-xl mb-1 group-hover:scale-105 transition-transform">
                  👤
                </span>
                <span className="text-xs font-bold text-slate-700">Back to Patient Profile</span>
              </Link>

              <Link
                to="/doctor/prescriptions"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition text-center group cursor-pointer"
              >
                <span className="text-xl mb-1 group-hover:scale-105 transition-transform">
                  💊
                </span>
                <span className="text-xs font-bold text-slate-700">Create Prescription</span>
              </Link>

              <Link
                to="/doctor/appointments"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition text-center group cursor-pointer"
              >
                <span className="text-xl mb-1 group-hover:scale-105 transition-transform">
                  📅
                </span>
                <span className="text-xs font-bold text-slate-700">Doctor Appointments</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs">
            <EmptyState
              title="No Vitals Recorded"
              description="This patient has no recorded health parameters on file."
              icon="❤️"
            />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                to={`/doctor/patients/${patientId}`}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition text-center group cursor-pointer"
              >
                <span className="text-xl mb-1 group-hover:scale-105 transition-transform">
                  👤
                </span>
                <span className="text-xs font-bold text-slate-700">Back to Patient Profile</span>
              </Link>

              <Link
                to="/doctor/prescriptions"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition text-center group cursor-pointer"
              >
                <span className="text-xl mb-1 group-hover:scale-105 transition-transform">
                  💊
                </span>
                <span className="text-xs font-bold text-slate-700">Create Prescription</span>
              </Link>

              <Link
                to="/doctor/appointments"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition text-center group cursor-pointer"
              >
                <span className="text-xl mb-1 group-hover:scale-105 transition-transform">
                  📅
                </span>
                <span className="text-xs font-bold text-slate-700">Doctor Appointments</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientVitals;

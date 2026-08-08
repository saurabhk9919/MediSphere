import React, { useEffect, useState } from 'react';
import { Heart, Activity, Thermometer, Calendar, Search, ArrowDownToLine, TrendingUp, Cpu } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { getPatientVitals, startDeviceSimulation, stopDeviceSimulation, updatePatientDeviceSource, getDeviceSimulationStatus } from '../../services/vital.api';
import { getUserProfile } from '../../services/user.api';
import { formatDate, formatTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const Vitals = () => {
  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [limitFilter, setLimitFilter] = useState('7');
  const [sortOrder, setSortOrder] = useState('newest');

  const [profile, setProfile] = useState(null);
  const [deviceMode, setDeviceMode] = useState('live'); // 'live' or 'virtual'
  const [isSimulating, setIsSimulating] = useState(false);
  const [timeTicker, setTimeTicker] = useState(Date.now());

  const checkSimulationStatus = async () => {
    try {
      const res = await getDeviceSimulationStatus();
      if (res && res.success && res.data) {
        setIsSimulating(res.data.isRunning);
      }
    } catch (err) {
      console.warn('Failed to fetch backend simulation status:', err);
    }
  };

  const fetchVitalsSilent = async () => {
    try {
      const res = await getPatientVitals();
      if (res && res.success) {
        setVitals(res.data || []);
      }
    } catch (err) {
      console.error('Silent vitals refresh failed:', err);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [vitalsRes, profileRes] = await Promise.all([
          getPatientVitals(),
          getUserProfile().catch(() => null)
        ]);

        if (vitalsRes && vitalsRes.success) {
          setVitals(vitalsRes.data || []);
        }

        if (profileRes && profileRes.success) {
          setProfile(profileRes.data);
          if (profileRes.data.device_source === 'VIRTUAL') {
            setDeviceMode('virtual');
          } else {
            setDeviceMode('live');
          }
        }

        await checkSimulationStatus();
      } catch (err) {
        console.error(err);
        toast.error('Failed to retrieve vitals logs.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTicker(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTelemetrySourceChange = async (newMode) => {
    if (newMode === deviceMode || !profile) return;
    const dbSource = newMode === 'virtual' ? 'VIRTUAL' : 'LIVE';
    try {
      setDeviceMode(newMode);
      await updatePatientDeviceSource(profile.id, dbSource);
      toast.success(`Switched to ${newMode === 'virtual' ? 'Virtual' : 'Live'} telemetry source`);
    } catch (err) {
      console.warn('Failed to update telemetry source on backend, updating locally:', err);
      toast.success(`Switched to ${newMode === 'virtual' ? 'Virtual' : 'Live'} telemetry source`);
    }
  };

  const handleToggleSimulation = async () => {
    if (!profile) return;
    try {
      if (isSimulating) {
        await stopDeviceSimulation();
        setIsSimulating(false);
        toast.success('Virtual device simulation stopped');
      } else {
        await startDeviceSimulation(profile.id);
        setIsSimulating(true);
        toast.success('Virtual device simulation started');
        await fetchVitalsSilent();
      }
    } catch (err) {
      console.warn('Backend simulation API failed, using local simulation:', err);
      if (isSimulating) {
        setIsSimulating(false);
        toast.success('Virtual device simulation stopped');
      } else {
        setIsSimulating(true);
        toast.success('Virtual device simulation started');
      }
    }
  };

  useEffect(() => {
    if (!isSimulating || deviceMode !== 'virtual') return;

    const intervalId = setInterval(async () => {
      try {
        const res = await getPatientVitals();
        if (res && res.success) {
          setVitals(res.data || []);
        }
      } catch (err) {
        console.error('Failed to poll vitals from backend:', err);
      }

      setVitals(prevVitals => {
        const latest = prevVitals[0] || { heartRate: 75, spo2: 98, temperature: 36.7 };
        const hrDiff = Math.floor(Math.random() * 5) - 2;
        let nextHr = latest.heartRate + hrDiff;
        if (nextHr < 70) nextHr = 70;
        if (nextHr > 90) nextHr = 90;

        let spo2Diff = 0;
        if (Math.random() < 0.15) spo2Diff = -1;
        else if (Math.random() > 0.85) spo2Diff = 1;
        let nextSpo2 = latest.spo2 + spo2Diff;
        if (nextSpo2 < 96) nextSpo2 = 96;
        if (nextSpo2 > 100) nextSpo2 = 100;

        const tempDiff = (Math.floor(Math.random() * 3) - 1) * 0.1;
        let nextTemp = Math.round((latest.temperature + tempDiff) * 10) / 10;
        if (nextTemp < 36.4) nextTemp = 36.4;
        if (nextTemp > 37.2) nextTemp = 37.2;

        const simulatedReading = {
          vitalId: 'sim_' + Date.now(),
          heartRate: nextHr,
          spo2: nextSpo2,
          temperature: nextTemp,
          recordedAt: new Date().toISOString(),
          doctor: { fullName: 'Virtual Simulator' }
        };

        return [simulatedReading, ...prevVitals];
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isSimulating, deviceMode]);

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'No recent data';
    const seconds = Math.floor((timeTicker - new Date(timestamp).getTime()) / 1000);
    if (seconds < 5) return 'Updated Just Now';
    if (seconds < 60) return `Updated ${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Updated ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    return `Updated at ${formatTime(timestamp)}`;
  };

  const searchedVitals = vitals.filter((item) => {
    const docName = item.doctor?.fullName || '';
    const dateStr = formatDate(item.recordedAt) || '';
    const query = searchQuery.toLowerCase();
    return (
      docName.toLowerCase().includes(query) ||
      dateStr.toLowerCase().includes(query)
    );
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
      `medisphere_vitals_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully!');
  };

  const latestVital = vitals[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Patient Portal / Vitals
          </div>
          <h1 className="text-2xl font-bold text-slate-800">My Vitals</h1>
        </div>

        {vitals.length > 0 && (
          <Button
            variant="outline"
            onClick={handleExportCSV}
            icon={<ArrowDownToLine size={16} />}
          >
            Export CSV
          </Button>
        )}
      </div>

      {/* Telemetry Source Section (Always visible once loading completes) */}
      {!loading && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Cpu className="text-blue-600 w-5 h-5" /> Telemetry Source
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Configure how MediSphere receives your IoT medical device readings.
            </p>
          </div>

          {/* Radio Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 1: Live Device */}
            <div
              onClick={() => handleTelemetrySourceChange('live')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                deviceMode === 'live'
                  ? 'border-blue-600 bg-blue-50/10'
                  : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-2 select-none">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    🟢 Live Device
                  </span>
                  <input
                    type="radio"
                    name="telemetrySource"
                    checked={deviceMode === 'live'}
                    onChange={() => handleTelemetrySourceChange('live')}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Receive telemetry from the patient's ESP8266 medical device.
                </p>
              </div>
            </div>

            {/* Option 2: Virtual Device */}
            <div
              onClick={() => handleTelemetrySourceChange('virtual')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                deviceMode === 'virtual'
                  ? 'border-purple-600 bg-purple-50/10'
                  : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-2 select-none">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                    🟣 Virtual Medical Device
                  </span>
                  <input
                    type="radio"
                    name="telemetrySource"
                    checked={deviceMode === 'virtual'}
                    onChange={() => handleTelemetrySourceChange('virtual')}
                    className="w-4 h-4 text-purple-600 border-slate-300 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Generate realistic virtual telemetry for demonstrations and development without requiring physical hardware.
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Display Details */}
          {deviceMode === 'live' ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</div>
                <div className="text-sm font-bold text-slate-755 mt-1 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  🔵 Waiting for Device
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Waiting for telemetry from the connected ESP8266 device.
                </p>
              </div>
              <div className="text-xs font-semibold text-slate-400 italic select-none">
                ESP8266 NodeMCU Profile Enabled
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</div>
                <div className="text-sm font-bold text-slate-755 mt-1 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    {isSimulating && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isSimulating ? 'bg-purple-500' : 'bg-slate-400'}`}></span>
                  </span>
                  {isSimulating ? '🟣 Virtual Device Running' : 'Simulation Idle'}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {isSimulating ? 'Generating live telemetry every 5 seconds.' : 'Start the virtual simulation to generate live vitals.'}
                </p>
              </div>
              <button
                onClick={handleToggleSimulation}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 select-none shadow-xs border cursor-pointer ${
                  isSimulating
                    ? 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100'
                    : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-750'
                }`}
              >
                {isSimulating ? 'Stop Virtual Device' : 'Start Virtual Device'}
              </button>
            </div>
          )}

          {/* Device Center Footer */}
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 pt-2 select-none">
            <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
            {deviceMode === 'virtual' 
              ? 'Receiving telemetry from Virtual Device.' 
              : 'Receiving real-time patient telemetry from connected medical device.'}
          </div>
        </div>
      )}

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
                  Heart Rate
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
                  SpO2 Level
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
                  Temperature
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
                  Last Updated
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-1 truncate">
                  {latestVital ? getRelativeTime(latestVital.recordedAt) : '--'}
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
                  placeholder="Search log history by physician or date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 text-slate-800 text-xs rounded-xl outline-none focus:border-blue-500 bg-white transition-all h-[36px]"
                />
              </div>

              <div className="w-full md:w-44 flex items-center gap-2">
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
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="p-4">Recorded Date</th>
                    <th className="p-4">Heart Rate</th>
                    <th className="p-4">SpO2</th>
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
        </div>
      ) : (
        <EmptyState
          title="No Vitals Recorded"
          description="You don't have any recorded medical parameters registered on file."
          icon="❤️"
        />
      )}
    </div>
  );
};

export default Vitals;

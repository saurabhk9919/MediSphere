import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Search, User, Calendar, Award, ChevronLeft, Heart, Activity, Thermometer, FileText, ClipboardList, Phone, Mail, MapPin, AlertCircle } from 'lucide-react';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { getDoctorAppointments } from '../../services/appointment.api';
import { getDoctorPrescriptions } from '../../services/prescription.api';
import api from '../../services/api';
import { getUserProfileById } from '../../services/user.api';
import { formatDate, formatTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const Patients = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const [patientProfile, setPatientProfile] = useState(null);
  const [vitalsList, setVitalsList] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchBaseData = async () => {
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
      toast.error('Failed to load patient registry data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDetails = async () => {
    if (!patientId) return;
    try {
      setLoadingDetails(true);
      const [profileRes, vitalsRes] = await Promise.all([
        getUserProfileById(patientId),
        api.get(`/vitals/patient/${patientId}`).then(r => r.data),
      ]);

      if (profileRes && profileRes.success) {
        setPatientProfile(profileRes.data);
      }
      if (vitalsRes && vitalsRes.success) {
        setVitalsList(vitalsRes.vitals || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load patient clinical file.');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
    }
  }, [patientId]);

  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const uniquePatientsMap = {};
  appointments.forEach((appt) => {
    if (appt.patient && !uniquePatientsMap[appt.patient.id]) {
      uniquePatientsMap[appt.patient.id] = {
        ...appt.patient,
        appointmentsCount: 0,
        lastAppointment: null,
      };
    }
    if (appt.patient) {
      const p = uniquePatientsMap[appt.patient.id];
      p.appointmentsCount += 1;
      const apptTime = new Date(`${appt.appointmentDate} ${appt.appointmentTime}`);
      if (
        !p.lastAppointment ||
        apptTime >
          new Date(
            `${p.lastAppointment.appointmentDate} ${p.lastAppointment.appointmentTime}`
          )
      ) {
        p.lastAppointment = appt;
      }
    }
  });

  const uniquePatients = Object.values(uniquePatientsMap);

  const searchedPatients = uniquePatients.filter((p) => {
    const name = p.fullName || '';
    const email = p.email || '';
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
  });

  const sortedPatients = [...searchedPatients].sort((a, b) => {
    if (sortOrder === 'alphabetical') {
      return a.fullName.localeCompare(b.fullName);
    }
    const timeA = a.lastAppointment
      ? new Date(`${a.lastAppointment.appointmentDate} ${a.lastAppointment.appointmentTime}`).getTime()
      : 0;
    const timeB = b.lastAppointment
      ? new Date(`${b.lastAppointment.appointmentDate} ${b.lastAppointment.appointmentTime}`).getTime()
      : 0;

    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader size="medium" />
      </div>
    );
  }

  if (patientId) {
    if (loadingDetails) {
      return (
        <div className="flex h-[60vh] w-full items-center justify-center">
          <Loader size="medium" />
        </div>
      );
    }

    if (!patientProfile) {
      return (
        <EmptyState
          title="Profile Unavailable"
          description="Could not load details for this patient profile."
          icon="👤"
          actionButton={
            <Button onClick={() => navigate('/doctor/patients')}>
              Back to Registry
            </Button>
          }
        />
      );
    }

    const patientAppointments = appointments.filter(
      (appt) => String(appt.patient?.id) === String(patientId)
    );

    const patientPrescriptions = prescriptions.filter(
      (pr) => String(pr.patient?.id) === String(patientId)
    );

    const latestVital = vitalsList[0];

    const extKey = `medisphere_profile_ext_${patientId}`;
    const extData = JSON.parse(localStorage.getItem(extKey) || '{}');
    const dob = extData.date_of_birth || '';
    const emergencyContact = extData.emergency_contact || '';

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Link
            to="/doctor/patients"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="flex flex-col gap-0.5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Directory / Patient Profile
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              {patientProfile.full_name}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex flex-col items-center text-center h-fit">
            <div className="h-20 w-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl border border-blue-200 shadow-inner mb-4 select-none">
              {getInitials(patientProfile.full_name)}
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">
              {patientProfile.full_name}
            </h2>
            <p className="text-xs text-slate-500 mb-4">{patientProfile.email}</p>
            <div className="w-full text-xs text-slate-500 space-y-2 pt-4 border-t border-slate-100 text-left">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400 shrink-0" />
                <span>Phone: {patientProfile.phone || 'Not Provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-400 shrink-0" />
                <span>Email: {patientProfile.email || 'Not Provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-400 shrink-0" />
                <span className="truncate">
                  Address: {patientProfile.address || 'Not Provided'}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-2 bg-slate-50/50">
                <User size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Personal Information</h3>
              </div>
              <div className="p-6 grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span className="block text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                    Gender
                  </span>
                  <p className="text-sm font-semibold text-slate-700 capitalize">
                    {patientProfile.gender || 'Not Provided'}
                  </p>
                </div>
                <div>
                  <span className="block text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                    Date of Birth
                  </span>
                  <p className="text-sm font-semibold text-slate-700">
                    {dob ? formatDate(dob) : 'Not Provided'}
                  </p>
                </div>
                <div>
                  <span className="block text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                    Blood Group
                  </span>
                  <p className="text-sm font-semibold text-slate-700">
                    {patientProfile.blood_group || 'Not Provided'}
                  </p>
                </div>
                <div>
                  <span className="block text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                    Emergency Contact
                  </span>
                  <p className="text-sm font-semibold text-slate-700">
                    {emergencyContact || 'Not Provided'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-2 bg-slate-50/50">
                <ClipboardList size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Medical Summary</h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
                  <div className="font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Total Visits
                  </div>
                  <div className="text-xl font-bold text-slate-800">
                    {patientAppointments.length}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
                  <div className="font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Prescriptions
                  </div>
                  <div className="text-xl font-bold text-slate-800">
                    {patientPrescriptions.length}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
                    Latest Vitals
                  </div>
                  {latestVital ? (
                    <div className="grid grid-cols-3 gap-1 text-center font-semibold text-slate-700">
                      <div>
                        <div className="text-[9px] text-slate-400 font-medium">HR</div>
                        <div className="text-xs text-rose-500 font-bold">{latestVital.heartRate}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400 font-medium">SpO2</div>
                        <div className="text-xs text-blue-500 font-bold">{latestVital.spo2}%</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400 font-medium">Temp</div>
                        <div className="text-xs text-amber-600 font-bold">{latestVital.temperature}°C</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 italic">None logged</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  to="/doctor/appointments"
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition text-center group cursor-pointer"
                >
                  <span className="text-xl mb-1 group-hover:scale-105 transition-transform">
                    📅
                  </span>
                  <span className="text-xs font-bold text-slate-700">Go to Appointments</span>
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
                  to="/doctor/patient-vitals"
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition text-center group cursor-pointer"
                >
                  <span className="text-xl mb-1 group-hover:scale-105 transition-transform">
                    ❤️
                  </span>
                  <span className="text-xs font-bold text-slate-700">Log Patient Vitals</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Doctor Portal / Registry
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Patient Directory</h1>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search patients by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all h-[42px]"
          />
        </div>

        <div className="w-full md:w-56 flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase shrink-0">Sort:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all h-[42px]"
          >
            <option value="newest">Newest Patient</option>
            <option value="oldest">Oldest Patient</option>
            <option value="alphabetical">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {sortedPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPatients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-md font-bold text-slate-800">
                      {patient.fullName}
                    </h3>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                      Patient ID: #{patient.id}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
                    👤
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-2 pt-3 border-t border-slate-50">
                  <div className="grid grid-cols-2 gap-2 font-medium">
                    <div>
                      Age:{' '}
                      <span className="font-semibold text-slate-700">
                        {patient.age ? `${patient.age} Years` : 'Not Specified'}
                      </span>
                    </div>
                    <div>
                      Gender:{' '}
                      <span className="font-semibold text-slate-700 capitalize">
                        {patient.gender || 'Not Specified'}
                      </span>
                    </div>
                  </div>
                  <div>
                    Blood Group:{' '}
                    <span className="font-semibold text-slate-700">
                      {patient.bloodGroup || 'Not Specified'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Phone:</span>
                    <span className="font-semibold text-slate-700">
                      {patient.phone || 'Not Specified'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Email:</span>
                    <span className="font-semibold text-slate-700 truncate max-w-[180px]">
                      {patient.email || 'Not Specified'}
                    </span>
                  </div>
                  {patient.lastAppointment && (
                    <div className="mt-3 text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="font-semibold uppercase text-slate-500 mb-0.5">
                        Latest Appointment:
                      </div>
                      {formatDate(patient.lastAppointment.appointmentDate)} at{' '}
                      {formatTime(patient.lastAppointment.appointmentTime)}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6">
                <Link to={`/doctor/patients/${patient.id}`}>
                  <Button variant="primary" fullWidth>
                    View Patient
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Patients Registered"
          description="We couldn't find any patient charts matching your search query."
          icon="👥"
        />
      )}
    </div>
  );
};

export default Patients;

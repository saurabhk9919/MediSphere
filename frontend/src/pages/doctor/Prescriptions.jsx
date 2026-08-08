import React, { useEffect, useState } from 'react';
import { Search, Plus, Trash2, FileText, Clipboard, User, Calendar, Clock, Heart } from 'lucide-react';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import PrescriptionForm from '../../components/doctor/PrescriptionForm';
import { getDoctorAppointments } from '../../services/appointment.api';
import { getDoctorPrescriptions } from '../../services/prescription.api';
import { formatDate, formatTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const Prescriptions = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedAppt, setSelectedAppt] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchPrescriptionData = async () => {
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
      toast.error('Failed to retrieve prescriptions listing data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptionData();
  }, []);

  const handleCreateClick = (appt) => {
    setSelectedAppt(appt);
    setModalOpen(true);
  };

  const handlePrescriptionSubmitSuccess = () => {
    setModalOpen(false);
    setSelectedAppt(null);
    fetchPrescriptionData();
  };

  const prescribedApptIds = new Set(
    prescriptions.map((pr) => pr.appointment?.appointmentId)
  );

  const pendingAppointments = appointments.filter(
    (appt) => appt.status === 'Completed' && !prescribedApptIds.has(appt.appointmentId)
  );

  const filteredAppointments = pendingAppointments.filter((appt) => {
    const name = appt.patient?.fullName || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Doctor Portal / Prescriptions
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Prescriptions</h1>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search pending consultations by patient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 text-slate-800 text-xs rounded-xl outline-none focus:border-blue-500 bg-white transition-all h-[38px]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-[40vh] w-full items-center justify-center">
          <Loader size="medium" />
        </div>
      ) : filteredAppointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
          {filteredAppointments.map((appt) => (
            <div
              key={appt.appointmentId}
              className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-slate-250 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 font-extrabold text-sm border border-slate-100 uppercase select-none">
                    {appt.patient?.fullName ? appt.patient.fullName.charAt(0) : 'P'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {appt.patient?.fullName}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">
                      Patient
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-50 pt-3 text-xs text-slate-650">
                  <div className="flex items-center gap-2 select-none">
                    <Calendar size={13} className="text-slate-400" />
                    <span>{formatDate(appt.appointmentDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 select-none">
                    <Clock size={13} className="text-slate-400" />
                    <span>{formatTime(appt.appointmentTime)}</span>
                  </div>
                  {appt.reason && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1.5 leading-relaxed">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5 select-none">Reason</p>
                      <p className="italic text-slate-600">"{appt.reason}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => handleCreateClick(appt)}
                >
                  Create Prescription
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Pending Prescriptions"
          description="Every completed consultation already has an issued prescription."
          icon="💊"
        />
      )}

      {selectedAppt && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="New Prescription Form"
        >
          <PrescriptionForm
            appointment={selectedAppt}
            onClose={() => setModalOpen(false)}
            onSubmitSuccess={handlePrescriptionSubmitSuccess}
          />
        </Modal>
      )}
    </div>
  );
};

export default Prescriptions;

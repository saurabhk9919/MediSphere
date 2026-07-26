import React, { useEffect, useState } from 'react';
import { Search, Plus, Trash2, FileText, Clipboard, User, Calendar, Clock, Heart } from 'lucide-react';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { getDoctorAppointments } from '../../services/appointment.api';
import { getDoctorPrescriptions, createPrescription } from '../../services/prescription.api';
import { formatDate, formatTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const PrescriptionModal = ({ appointment, onClose, onSubmitSuccess }) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
  const [submitting, setSubmitting] = useState(false);

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const removeMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSubmitPrescription = async (e) => {
    e.preventDefault();

    if (!diagnosis.trim()) {
      toast.error('Diagnosis description is required.');
      return;
    }

    if (medicines.length === 0) {
      toast.error('At least one medicine is required.');
      return;
    }

    for (let i = 0; i < medicines.length; i++) {
      const med = medicines[i];
      if (!med.name.trim()) {
        toast.error(`Medicine name is required for line #${i + 1}.`);
        return;
      }
      if (!med.dosage.trim()) {
        toast.error(`Dosage is required for line #${i + 1}.`);
        return;
      }
      if (!med.frequency.trim()) {
        toast.error(`Frequency is required for line #${i + 1}.`);
        return;
      }
      if (!med.duration.trim()) {
        toast.error(`Duration is required for line #${i + 1}.`);
        return;
      }
    }

    if (!advice.trim()) {
      toast.error('Clinical advice and instructions are required.');
      return;
    }

    try {
      setSubmitting(true);
      const medsString = medicines
        .map((m) => `${m.name} (${m.dosage} - ${m.frequency} for ${m.duration})`)
        .join(', ');

      const res = await createPrescription({
        appointmentId: appointment.appointmentId,
        diagnosis: diagnosis.trim(),
        medications: medsString,
        notes: advice.trim(),
      });

      if (res && res.success) {
        toast.success(res.message || 'Prescription created successfully!');
        onSubmitSuccess();
      }
    } catch (err) {
      console.error(err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to issue prescription.';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitPrescription} className="space-y-4 pt-2">
      <div className="text-xs font-semibold text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2">
        Prescription for <span className="font-bold text-slate-700">{appointment.patient?.fullName}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-slate-700">Diagnosis *</label>
        <textarea
          rows="2"
          placeholder="Enter patient diagnosis..."
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          className="w-full px-4 py-2.5 text-slate-900 bg-white border border-slate-300 hover:border-slate-400 focus:border-indigo-500 text-sm rounded-xl transition-all duration-200 outline-none resize-none"
        />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <label className="text-sm font-bold text-slate-700">Medicines ({medicines.length}) *</label>
          <Button
            type="button"
            variant="outline"
            onClick={addMedicine}
            icon={<Plus size={14} />}
            className="h-8 text-xs font-bold"
          >
            Add Medicine
          </Button>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {medicines.map((med, index) => (
            <div
              key={index}
              className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3 relative"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">Medicine #{index + 1}</span>
                {medicines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedicine(index)}
                    className="text-rose-500 hover:text-rose-700 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Medicine Name"
                  type="text"
                  placeholder="e.g. Paracetamol"
                  value={med.name}
                  onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                  required
                />
                <Input
                  label="Dosage"
                  type="text"
                  placeholder="e.g. 500mg"
                  value={med.dosage}
                  onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                  required
                />
                <Input
                  label="Frequency"
                  type="text"
                  placeholder="e.g. Twice daily"
                  value={med.frequency}
                  onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                  required
                />
                <Input
                  label="Duration"
                  type="text"
                  placeholder="e.g. 5 days"
                  value={med.duration}
                  onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                  required
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-slate-700">Advice & Instructions *</label>
        <textarea
          rows="3"
          placeholder="e.g. Take after meals, plenty of rest..."
          value={advice}
          onChange={(e) => setAdvice(e.target.value)}
          className="w-full px-4 py-2.5 text-slate-900 bg-white border border-slate-300 hover:border-slate-400 focus:border-indigo-500 text-sm rounded-xl transition-all duration-200 outline-none resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="outline" disabled={submitting} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          Issue Prescription
        </Button>
      </div>
    </form>
  );
};

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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by patient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
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
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
                    👥
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
          <PrescriptionModal
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

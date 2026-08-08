import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import { createPrescription } from '../../services/prescription.api';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const PrescriptionForm = ({ appointment, onClose, onSubmitSuccess, showCancelButton = true }) => {
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
        if (onSubmitSuccess) onSubmitSuccess();
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

      {/* Vitals snapshot display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pre-Consultation Vitals display */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pre-Consultation Vitals
            </h4>
            <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full font-bold uppercase">
              Patient
            </span>
          </div>
          {!appointment.preConsultationVitals ? (
            <p className="text-xs text-slate-400 italic">No pre-consultation vitals recorded.</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5 font-semibold">HR</span>
                  <span className="font-bold text-slate-700">❤️ {appointment.preConsultationVitals.heartRate}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5 font-semibold">SpO₂</span>
                  <span className="font-bold text-slate-700">🩸 {appointment.preConsultationVitals.spo2}%</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5 font-semibold">Temp</span>
                  <span className="font-bold text-slate-700">🌡️ {appointment.preConsultationVitals.temperature}°C</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold px-0.5 select-none">
                <span>Source: {appointment.preConsultationVitals.source}</span>
                <span>Recorded: {formatDate(appointment.preConsultationVitals.recordedAt)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Consultation Vitals display */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Consultation Vitals
            </h4>
            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-bold uppercase">
              Doctor
            </span>
          </div>
          {!appointment.consultationVitals ? (
            <p className="text-xs text-slate-400 italic">No consultation vitals recorded.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                <span className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5 font-semibold">HR</span>
                <span className="font-bold text-slate-700">❤️ {appointment.consultationVitals.heartRate}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                <span className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5 font-semibold">SpO₂</span>
                <span className="font-bold text-slate-700">🩸 {appointment.consultationVitals.spo2}%</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                <span className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5 font-semibold">Temp</span>
                <span className="font-bold text-slate-700">🌡️ {appointment.consultationVitals.temperature}°C</span>
              </div>
            </div>
          )}
        </div>
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
            className="h-8 text-xs font-bold px-3"
          >
            + Add Medicine
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
        {showCancelButton && onClose && (
          <Button variant="outline" type="button" disabled={submitting} onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={submitting}>
          Issue Prescription
        </Button>
      </div>
    </form>
  );
};

export default PrescriptionForm;

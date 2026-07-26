import React, { useEffect, useState } from 'react';
import { Search, FileText, User, Stethoscope, Calendar, Eye } from 'lucide-react';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { getPatientPrescriptions } from '../../services/prescription.api';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const Prescriptions = () => {
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const [selectedPresc, setSelectedPresc] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const fetchPrescriptionsList = async () => {
    try {
      setLoading(true);
      const res = await getPatientPrescriptions();
      if (res && res.success) {
        setPrescriptions(res.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve prescriptions list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptionsList();
  }, []);

  const handleViewDetails = (presc) => {
    setSelectedPresc(presc);
    setDetailsModalOpen(true);
  };

  const filteredPrescriptions = prescriptions
    .filter((presc) => {
      const docName = presc.doctor?.fullName || '';
      const diagnosis = presc.diagnosis || '';
      return (
        docName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      const timeA = new Date(a.appointment?.appointmentDate || 0).getTime();
      const timeB = new Date(b.appointment?.appointmentDate || 0).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

  const renderMedications = (meds) => {
    if (!meds) return 'No medications prescribed';
    if (Array.isArray(meds)) {
      return meds.map((med, idx) => (
        <span
          key={idx}
          className="inline-block bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-100 mr-2 mb-2"
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
        <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-100 mr-2 mb-2">
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
          Patient Portal / Prescriptions
        </div>
        <h1 className="text-2xl font-bold text-slate-800">My Prescriptions</h1>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by doctor name or diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all h-[42px]"
          />
        </div>

        <div className="w-full sm:w-56 flex items-center gap-2">
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

      {loading ? (
        <div className="flex h-[40vh] w-full items-center justify-center">
          <Loader size="medium" />
        </div>
      ) : filteredPrescriptions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrescriptions.map((presc) => (
            <div
              key={presc.prescriptionId}
              className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-md font-bold text-slate-800">
                      Dr. {presc.doctor?.fullName}
                    </h3>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      {presc.doctor?.specialization}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                    {formatDate(presc.appointment?.appointmentDate)}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-50 space-y-3">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      Diagnosis
                    </div>
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {presc.diagnosis}
                    </p>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Medicines
                    </div>
                    <div className="flex flex-wrap max-h-16 overflow-hidden">
                      {renderMedications(presc.medications)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => handleViewDetails(presc)}
                  icon={<Eye size={16} />}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Prescriptions Found"
          description="We couldn't find any prescriptions matching your search query."
          icon="💊"
        />
      )}

      {selectedPresc && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title="Prescription Details"
        >
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-start">
              <div>
                <h4 className="text-md font-bold text-slate-800 flex items-center gap-1.5">
                  <User size={16} className="text-blue-500" />
                  Dr. {selectedPresc.doctor?.fullName}
                </h4>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mt-0.5 flex items-center gap-1.5 pl-5">
                  <Stethoscope size={13} />
                  {selectedPresc.doctor?.specialization}
                </p>
              </div>
              <div className="text-right text-xs text-slate-400 font-medium">
                <div>Prescribed On:</div>
                <div className="font-semibold text-slate-700 mt-0.5">
                  {formatDate(selectedPresc.appointment?.appointmentDate)}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Diagnosis
              </div>
              <p className="text-sm font-semibold text-slate-800 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                {selectedPresc.diagnosis}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Prescribed Medicines
              </div>
              <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-wrap">
                {renderMedications(selectedPresc.medications)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Advice & Notes
              </div>
              <div className="text-sm text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                {selectedPresc.notes || 'No specific advice recorded.'}
              </div>
            </div>

            {selectedPresc.appointment && (
              <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                <Calendar size={14} />
                <span>
                  Consultation Appointment ID: #{selectedPresc.appointment.appointmentId} on{' '}
                  {formatDate(selectedPresc.appointment.appointmentDate)} at{' '}
                  {selectedPresc.appointment.appointmentTime}
                </span>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Prescriptions;

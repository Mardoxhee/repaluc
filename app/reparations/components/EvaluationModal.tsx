import React from 'react';
import { Modal } from 'flowbite-react';
import { X } from 'lucide-react';
import Evaluation from './evaluation';

interface EvaluationModalProps {
  victim: any;
  onClose: () => void;
}

const EvaluationModal: React.FC<EvaluationModalProps> = ({ victim, onClose }) => {
  return (
    <Modal show={true} onClose={onClose} size="7xl">
      <div className='p-4 relative !bg-white !text-gray-900'>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 !text-gray-400 hover:!text-pink-500 transition-colors z-10"
          title="Fermer"
          aria-label="Fermer"
          type="button"
        >
          <X size={28} />
        </button>
        
        <div className="mt-6">
          <Evaluation victim={victim} />
        </div>
      </div>
    </Modal>
  );
};

export default EvaluationModal;
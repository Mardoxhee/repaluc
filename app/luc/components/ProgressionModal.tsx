import React from "react";

const baseSteps = [
  { label: "Identifiés" },
  { label: "EPI" },
  { label: "Authentification ministère" },
  { label: "Authentification tribunaux" },
  { label: "Liste finale" },
  { label: "Réparations ou accès à la justice" }
];

interface ProgressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editable?: boolean;
}

const stateColors = {
  done: "bg-blue-600 border-blue-600 text-white",
  active: "bg-gray-200 border-blue-400 text-blue-600 animate-pulse",
  upcoming: "bg-gray-100 border-gray-300 text-gray-400"
};

const ProgressionModal: React.FC<ProgressionModalProps> = ({ isOpen, onClose, editable = false }) => {
  const [activeStep, setActiveStep] = React.useState(1); // 1-based
  const [comments, setComments] = React.useState<{text: string, date: string}[]>([]);
  const [commentInput, setCommentInput] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) setActiveStep(1);
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyPosition = document.body.style.position;
      const originalHtmlPosition = document.documentElement.style.position;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.position = 'fixed';
      window.scrollTo(0, 0);
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.position = originalBodyPosition;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.documentElement.style.position = originalHtmlPosition;
      };
    }
  }, [isOpen]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    const now = new Date();
    const date = now.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    setComments([...comments, { text: commentInput.trim(), date }]);
    setCommentInput("");
  };

  if (!isOpen) return null;

  // Génère l'état de chaque étape selon activeStep
  const steps = baseSteps.map((step, idx) => {
    if (idx + 1 < activeStep) return { ...step, state: "done" };
    if (idx + 1 === activeStep) return { ...step, state: "active" };
    return { ...step, state: "upcoming" };
  });

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-start justify-center bg-black/30 backdrop-blur-sm pt-30">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl min-h-[80vh] flex flex-col items-center p-4 md:p-12 relative border border-gray-100 animate-fade-in">
        <button
          className="absolute top-6 right-8 text-gray-400 hover:text-gray-700 text-3xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Fermer"
        >
          ×
        </button>
        <h2 className="text-3xl font-extrabold text-center mb-12 text-fona-pink tracking-tight text-dark">Progression</h2>
        <div className="w-full flex flex-col items-center overflow-x-auto px-2 flex-1 justify-center">
          <div className="flex flex-row items-center justify-center w-full gap-2 md:gap-6 max-w-full overflow-x-auto">
            {steps.map((step, idx) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center min-w-[80px]">
                  <div
                    className={`w-12 h-12 flex items-center justify-center rounded-full border-4 text-lg font-bold shadow transition-all duration-300 ${stateColors[step.state as keyof typeof stateColors]} ${step.state === 'active' ? 'animate-blink' : ''}`}
                    style={{ boxShadow: step.state === 'active' ? '0 0 0 6px #dbeafe' : undefined }}
                  >
                    {idx + 1}
                  </div>
                  <span className={`mt-2 text-xs md:text-sm font-medium text-center ${step.state === 'done' ? 'text-blue-600' : step.state === 'active' ? 'text-blue-500' : 'text-gray-400'}`}>{step.label}</span>
                  {editable && step.state === 'active' && (
                    <button
                      className="mt-2 px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold shadow hover:bg-blue-700 transition"
                      onClick={() => setActiveStep(Math.min(steps.length, idx + 2))}
                    >
                      Valider cette étape
                    </button>
                  )}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-1 md:mx-2 rounded transition-all duration-300 ${
                    steps[idx].state === 'done' && steps[idx + 1].state !== 'done'
                      ? 'bg-gradient-to-r from-blue-600 to-gray-200'
                      : steps[idx + 1].state === 'active'
                        ? 'bg-gradient-to-r from-blue-400 to-gray-200 animate-pulse'
                        : 'bg-gray-200'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        {/* Zone commentaires */}
        <div className="w-full max-w-2xl mt-12 flex flex-col gap-4">
          <h3 className="text-lg font-bold text-gray-700 mb-2 text-center">Commentaires</h3>
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-4 border border-gray-100">
            {comments.length === 0 ? (
              <span className="text-gray-400 text-sm text-center">Aucun commentaire pour l’instant.</span>
            ) : comments.map((c, i) => (
              <div key={i} className="flex flex-col py-1">
                <span className="text-xs text-gray-500">Vous &bull; {c.date}</span>
                <span className="text-gray-700 text-sm">{c.text}</span>
              </div>
            ))}
          </div>
          <form className="flex gap-2 mt-2" onSubmit={handleCommentSubmit}>
            <textarea
              className="flex-1 rounded-lg border border-gray-200 p-2 text-sm focus:ring-2 focus:ring-fona-pink focus:outline-none resize-none min-h-[36px] max-h-24"
              placeholder="Ajouter un commentaire..."
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              rows={1}
              maxLength={300}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-fona-pink text-pink-700  font-bold shadow-lg hover:bg-pink-700 transition disabled:bg-pink-300 disabled:text-white disabled:shadow-none"
              style={{ minWidth: 90, fontWeight: 700, fontSize: '1rem', letterSpacing: '0.02em' }}
              disabled={!commentInput.trim()}
            >
              Envoyer
            </button>
          </form>
        </div>
        <style>{`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .animate-blink {
            animation: blink 1s infinite;
          }
        `}</style>
      </div>
    </div>
  );
};

export default ProgressionModal;

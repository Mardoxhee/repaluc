import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Save, FileText } from 'lucide-react';
import Swal from 'sweetalert2';

interface Assertion {
  id: number;
  text: string;
}

interface Question {
  id: number;
  question: string;
  categorie: string;
  branchement: any[];
  type: 'text' | 'number' | 'radio' | 'checkbox' | 'textarea';
  numero: string;
  visible: boolean;
  ordre: number;
  assertions: Assertion[];
}

interface QuestionsByCategory {
  [category: string]: Question[];
}

interface FormData {
  [questionId: number]: any;
}

interface Victim {
  id: number;
  [key: string]: any;
}

interface FormProps {
  victim?: Victim;
  userId?: number;
}

const Formulaireplandevie: React.FC<FormProps> = ({ victim, userId }) => {
  const [questions, setQuestions] = useState<QuestionsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [saving, setSaving] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string>('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://10.140.0.104:8007/question/type/plandevie');
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des questions');
      }

      const data: QuestionsByCategory = await response.json();
      setQuestions(data);
      
      // Set first category as current
      const categories = Object.keys(data);
      if (categories.length > 0) {
        setCurrentCategory(categories[0]);
      }
      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les questions du formulaire'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (questionId: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleCheckboxChange = (questionId: number, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentValues = prev[questionId] || [];
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentValues, value]
        };
      } else {
        return {
          ...prev,
          [questionId]: currentValues.filter((v: string) => v !== value)
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation : vérifier qu'on a bien une victime
    if (!victim || !victim.id) {
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Aucune victime sélectionnée'
      });
      return;
    }

    setSaving(true);

    try {
      // Construire le payload selon le format requis
      const questionResponse = Object.entries(formData).map(([questionId, reponse]) => {
        // Convertir les tableaux (checkbox) en string
        const reponseFormatted = Array.isArray(reponse) ? reponse.join(', ') : String(reponse);
        
        return {
          questionId: parseInt(questionId),
          reponse: reponseFormatted
        };
      }).filter(item => item.reponse && item.reponse.trim() !== ''); // Filtrer les réponses vides

      // Vérifier qu'il y a au moins une réponse
      if (questionResponse.length === 0) {
        await Swal.fire({
          icon: 'warning',
          title: 'Formulaire vide',
          text: 'Veuillez répondre à au moins une question avant de soumettre'
        });
        setSaving(false);
        return;
      }

      const payload = {
        userId: userId || 1, // Utiliser l'userId passé en props ou 1 par défaut
        victimeId: victim.id,
        status: "Draft",
        isSign: false,
        questionResponse
      };

      console.log('Payload à envoyer:', payload);

      // Envoyer au serveur
      const response = await fetch('http://10.140.0.104:8007/plan-vie-enquette', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement');
      }

      const result = await response.json();
      
      await Swal.fire({
        icon: 'success',
        title: 'Formulaire enregistré',
        text: 'Le plan de vie a été enregistré avec succès',
        timer: 2000,
        showConfirmButton: false
      });
      
      console.log('Réponse du serveur:', result);
    } catch (err: any) {
      console.error('Erreur:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.message || 'Erreur lors de l\'enregistrement du formulaire'
      });
    } finally {
      setSaving(false);
    }
  };

  // Fonction pour vérifier si une question doit être visible
  const shouldShowQuestion = (question: Question, allQuestions: Question[]): boolean => {
    // Trouver la question précédente (ordre - 1)
    const previousQuestion = allQuestions.find(q => q.ordre === question.ordre - 1);
    
    // Si pas de question précédente, afficher
    if (!previousQuestion) return true;
    
    // Si la question précédente n'a pas d'assertions, afficher
    if (!previousQuestion.assertions || previousQuestion.assertions.length === 0) return true;
    
    // Vérifier si la question précédente a une option "Autre" (insensible à la casse)
    const hasAutreOption = previousQuestion.assertions.some(
      assertion => assertion.text.toLowerCase().includes('autre')
    );
    
    // Si pas d'option "Autre", afficher la question
    if (!hasAutreOption) return true;
    
    // Vérifier si "Autre" a été sélectionné dans la question précédente
    const previousAnswer = formData[previousQuestion.id];
    
    if (previousQuestion.type === 'radio') {
      // Pour radio, vérifier si la réponse contient "autre"
      return previousAnswer && previousAnswer.toLowerCase().includes('autre');
    } else if (previousQuestion.type === 'checkbox') {
      // Pour checkbox, vérifier si au moins une réponse contient "autre"
      return Array.isArray(previousAnswer) && previousAnswer.some(
        (answer: string) => answer.toLowerCase().includes('autre')
      );
    }
    
    return true;
  };

  const renderInput = (question: Question) => {
    const baseInputClass = "w-full px-3 py-2.5 border-2 border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:border-blue-600 transition-all shadow-sm";
    
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            className={baseInputClass}
            value={formData[question.id] || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder="Votre réponse"
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            className={baseInputClass}
            value={formData[question.id] || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder="Entrez un nombre"
          />
        );
      
      case 'textarea':
        return (
          <textarea
            className={`${baseInputClass} min-h-[100px] resize-y`}
            value={formData[question.id] || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder="Votre réponse détaillée"
            rows={4}
          />
        );
      
      case 'radio':
        // Si pas d'assertions, utiliser Oui/Non par défaut
        const radioOptions = question.assertions && question.assertions.length > 0 
          ? [...question.assertions].reverse()
          : [{ id: 1, text: 'Oui' }, { id: 2, text: 'Non' }];
        
        return (
          <div className="space-y-2">
            {radioOptions.map((assertion) => (
              <label key={assertion.id} className="flex items-center gap-3 p-3 bg-white border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-400 cursor-pointer transition-all">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={assertion.text}
                  checked={formData[question.id] === assertion.text}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-600"
                />
                <span className="text-gray-800 text-sm font-medium">{assertion.text}</span>
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        // Si pas d'assertions, utiliser des options par défaut
        const checkboxOptions = question.assertions && question.assertions.length > 0 
          ? [...question.assertions].reverse()
          : [
              { id: 1, text: 'Soins médicaux généraux' },
              { id: 2, text: 'Soins psychologiques' },
              { id: 3, text: 'Chirurgie' },
              { id: 4, text: 'Médicaments' },
              { id: 5, text: 'Rééducation' }
            ];
        
        return (
          <div className="space-y-2">
            {checkboxOptions.map((assertion) => (
              <label key={assertion.id} className="flex items-center gap-3 p-3 bg-white border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-400 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={(formData[question.id] || []).includes(assertion.text)}
                  onChange={(e) => handleCheckboxChange(question.id, assertion.text, e.target.checked)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-600"
                />
                <span className="text-gray-800 text-sm font-medium">{assertion.text}</span>
              </label>
            ))}
          </div>
        );
      
      default:
        return (
          <input
            type="text"
            className={baseInputClass}
            value={formData[question.id] || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder="Votre réponse"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="animate-spin text-pink-600 mb-4" size={48} />
        <p className="text-gray-600">Chargement du formulaire...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <p className="text-red-600 font-medium mb-2">Erreur de chargement</p>
        <p className="text-gray-600 text-sm">{error}</p>
        <button
          onClick={fetchQuestions}
          className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const categories = Object.keys(questions);

  return (
    <div className="bg-white text-gray-900 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b-2 pb-4 mb-6" style={{ borderColor: '#901c67' }}>
        <h1 className="text-2xl font-bold text-center tracking-wide uppercase" style={{ color: '#901c67' }}>
          Formulaire de Plan de Vie
        </h1>
        <p className="text-center text-gray-600 text-sm mt-1">
          Complétez ce formulaire pour établir votre plan de vie personnalisé
        </p>
      </div>

      {/* Category Navigation */}
      <div className="mb-6 border border-gray-300 p-4 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="text-blue-600" size={16} />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Sections du formulaire</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category, idx) => (
            <button
              key={category}
              onClick={() => setCurrentCategory(category)}
              className={`px-3 py-2 text-sm font-medium transition-all border ${
                currentCategory === category
                  ? 'text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
              style={currentCategory === category ? { backgroundColor: '#901c67', borderColor: '#901c67' } : {}}
            >
              {idx + 1}. {category}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {categories.map((category, categoryIdx) => (
          <div
            key={category}
            className={`transition-all duration-300 ${
              currentCategory === category ? 'block' : 'hidden'
            }`}
          >
            {/* Category Section */}
            <div className="mb-6">
              <div className="text-white px-4 py-3 border-b" style={{ backgroundColor: '#901c67' }}>
                <h2 className="font-bold text-sm uppercase tracking-wide">
                  {categoryIdx + 1}. {category}
                </h2>
              </div>
              <div className="border border-gray-300 border-t-0 bg-gray-50">
                <div className="p-6 space-y-5">
                  {questions[category]
                    .sort((a, b) => a.ordre - b.ordre)
                    .filter((question) => shouldShowQuestion(question, questions[category]))
                    .map((question) => (
                      <div
                        key={question.id}
                        className="bg-gray-50 p-4 border-l-4 border-blue-600 shadow-sm"
                      >
                        {/* Question Label */}
                        <label className="block">
                          <div className="flex items-start gap-3 mb-4">
                            <span className="inline-flex items-center justify-center px-3 py-2 text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#901c67' }}>
                              {question.numero}
                            </span>
                            <span className="text-gray-800 font-semibold text-sm uppercase pt-1.5">
                              {question.question}
                            </span>
                          </div>
                          
                          {/* Input */}
                          <div className="mt-3">
                            {renderInput(question)}
                          </div>
                        </label>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation and Submit Buttons */}
        <div className="border border-gray-300 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              {categories.indexOf(currentCategory) > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = categories.indexOf(currentCategory);
                    setCurrentCategory(categories[currentIndex - 1]);
                  }}
                  className="px-4 py-2 bg-white text-gray-700 text-sm font-semibold border-2 border-gray-300 hover:bg-gray-100 transition-colors uppercase"
                >
                  ← Précédent
                </button>
              )}
              {categories.indexOf(currentCategory) < categories.length - 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = categories.indexOf(currentCategory);
                    setCurrentCategory(categories[currentIndex + 1]);
                  }}
                  className="px-4 py-2 text-white text-sm font-semibold border-2 hover:opacity-90 transition-all uppercase"
                  style={{ backgroundColor: '#901c67', borderColor: '#901c67' }}
                >
                  Suivant →
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold border-2 border-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Progress Indicator */}
      <div className="mt-6 border border-gray-300 p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-600 uppercase">
            Progression: Section {categories.indexOf(currentCategory) + 1} sur {categories.length}
          </span>
          <span className="text-xs text-gray-600 font-mono">
            {Math.round(((categories.indexOf(currentCategory) + 1) / categories.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 border border-gray-300 h-3">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${((categories.indexOf(currentCategory) + 1) / categories.length) * 100}%`,
              backgroundColor: '#901c67'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Formulaireplandevie;
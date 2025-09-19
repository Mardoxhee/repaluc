import React from 'react'
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaFileExcel, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const Reglages = () => {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const excelFile = acceptedFiles.find(f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
        if (excelFile) {
            setFile(excelFile);
            setError(null);
            setSuccess(false);
        } else {
            setError('Merci de charger un fichier Excel (.xlsx ou .xls)');
            setFile(null);
            setSuccess(false);
        }
    }, []);

    const [progress, setProgress] = useState<number>(0);

    const [count, setCount] = useState<number|null>(null);

    const uploadFile = async () => {
        if (!file || loading) return;
        setLoading(true);
        setError(null);
        setSuccess(false);
        setProgress(0);
        setCount(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${process.env.NEXT_PUBLIC_API_BASE_URL}/analysis-mapping/upload`);
                xhr.responseType = 'json';
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        setProgress(Math.round((event.loaded / event.total) * 70)); // upload = 0-70%
                    }
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        // Commencer progression traitement backend
                        let fakeProgress = 70;
                        setProgress(fakeProgress);
                        const interval = setInterval(() => {
                            fakeProgress += Math.random() * 5; // Avance lentement
                            if (fakeProgress >= 99) fakeProgress = 99;
                            setProgress(fakeProgress);
                        }, 400);
                        // Attendre la vraie réponse (xhr.responseText peut contenir la réponse)
                        setTimeout(() => {
                            clearInterval(interval);
                            setProgress(100);
                            setSuccess(true);
                            let responseData;
                            try {
                                responseData = xhr.responseType === 'json' ? xhr.response : JSON.parse(xhr.responseText);
                            } catch {
                                responseData = null;
                            }
                            if (responseData && typeof responseData.count === 'number') {
                                setCount(responseData.count);
                            }
                            resolve();
                        }, 2500); // Simule un traitement de 2.5s (à remplacer par polling si API dispo)
                    } else {
                        reject(new Error('Erreur lors de l\'upload'));
                    }
                };
                xhr.onerror = () => {
                    reject(new Error('Erreur réseau lors de l\'upload'));
                };
                xhr.send(formData);
            });
        } catch (e: any) {
            setError(e.message || 'Erreur inconnue');
        } finally {
            setLoading(false);
            setProgress(0);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        disabled: loading,
    });

    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 bg-white rounded-xl shadow-lg max-w-xl mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Charger la liste des victimes</h2>
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 w-full flex flex-col items-center transition-colors duration-300 cursor-pointer ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-100 hover:border-blue-400'}`}
            >
                <input {...getInputProps()} />
                <FaFileExcel className="text-5xl text-green-600 mb-2" />
                <p className="text-gray-700 mb-2">
                    {isDragActive ? 'Déposez le fichier ici...' : 'Glissez-déposez un fichier Excel ou cliquez pour sélectionner'}
                </p>
                <span className="text-xs text-gray-500">Formats acceptés : .xlsx, .xls</span>
            </div>
            {file && (
                <div className="flex items-center gap-2 mt-4 bg-green-50 px-4 py-2 rounded">
                    <FaCheckCircle className="text-green-600" />
                    <span className="text-green-800 font-medium">{file.name}</span>
                </div>
            )}
            {/* BOUTON ENVOYER ET LOADER */}
            <div className="w-full flex justify-center mt-6">
                {loading ? (
                    <div className="flex flex-col items-center w-full">
                        <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden shadow-inner">
                            <div
                                className="bg-blue-600 h-4 transition-all duration-200"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-blue-600 font-medium animate-pulse">Envoi en cours... {progress}%</span>
                    </div>
                ) : (
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={uploadFile}
                        disabled={!file || loading}
                    >
                        Envoyer
                    </button>
                )}
            </div>
            {error && (
                <div className="flex items-center gap-2 mt-4 bg-red-50 px-4 py-2 rounded">
                    <FaTimesCircle className="text-red-600" />
                    <span className="text-red-800 font-medium">{error}</span>
                </div>
            )}
            {success && !error && count !== null && (
                <div className="mt-4 text-green-700 font-bold">{count} données traitées avec succès !</div>
            )}
            {success && !error && count === null && (
                <div className="mt-4 text-green-700">Fichier chargé avec succès !</div>
            )}
            <style jsx>{`
        .loader {
          border: 4px solid #e5e7eb;
          border-top: 4px solid #2563eb;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}



export default Reglages
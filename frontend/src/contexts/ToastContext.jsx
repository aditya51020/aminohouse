import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto remove after 3s
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
              flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[300px] animate-in slide-in-from-right-2
              ${toast.type === 'success' ? 'bg-white border-green-200 text-green-800' :
                                toast.type === 'error' ? 'bg-white border-red-200 text-red-800' :
                                    'bg-white border-blue-200 text-blue-800'}
            `}
                    >
                        {toast.type === 'success' && <CheckCircle size={20} className="text-green-500" />}
                        {toast.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
                        {toast.type === 'info' && <Info size={20} className="text-blue-500" />}

                        <p className="text-sm font-medium flex-1">{toast.message}</p>

                        <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

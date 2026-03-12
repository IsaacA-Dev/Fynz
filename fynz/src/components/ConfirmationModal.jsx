import { useEffect } from 'react';

export default function ConfirmationModal({ 
    isOpen, 
    title, 
    message, 
    onConfirm, 
    onCancel, 
    onClose,
    confirmText = 'Confirmar', 
    cancelText = 'Cancelar', 
    type = 'info' 
}) {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onCancel?.();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const themes = {
        danger: 'bg-red-500 hover:bg-red-600 shadow-red-200',
        warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
        info: 'gradient-primary hover:opacity-90 shadow-fynz-200'
    };

    const icons = {
        danger: '⚠️',
        warning: '🔔',
        info: 'ℹ️'
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in"
                onClick={onCancel}
            />
            
            {/* Modal Content */}
            <div className={`
                relative bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl 
                animate-scale-in flex flex-col items-center text-center
                z-50
            `}>
                <div className={`
                    w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mb-4
                    ${type === 'danger' ? 'bg-red-50' : type === 'warning' ? 'bg-amber-50' : 'bg-fynz-50'}
                `}>
                    {icons[type]}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                    {message}
                </p>

                <div className="flex flex-col w-full gap-3">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onConfirm();
                        }}
                        className={`
                            w-full py-3.5 rounded-2xl text-white font-bold text-sm
                            transition-all active:scale-95 shadow-lg
                            ${themes[type]}
                        `}
                    >
                        {confirmText}
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCancel();
                        }}
                        className="w-full py-3.5 rounded-2xl text-gray-400 font-semibold text-sm hover:text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
}

import React from 'react';

export default function ConfirmationModal({ 
    isOpen, 
    title, 
    message, 
    onConfirm, 
    onCancel, 
    confirmText = 'Confirmar', 
    cancelText = 'Cancelar', 
    type = 'danger' // danger, warning, info
}) {
    if (!isOpen) return null;

    const typeConfig = {
        danger: {
            icon: '⚠️',
            buttonClass: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200',
            bgIcon: 'bg-red-50 text-red-600'
        },
        warning: {
            icon: '⚡',
            buttonClass: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
            bgIcon: 'bg-amber-50 text-amber-600'
        },
        info: {
            icon: 'ℹ️',
            buttonClass: 'bg-fynz-600 hover:bg-fynz-700 text-white shadow-fynz-200',
            bgIcon: 'bg-fynz-50 text-fynz-600'
        }
    };

    const config = typeConfig[type] || typeConfig.info;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in"
                onClick={onCancel}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl shadow-gray-900/20 animate-scale-in border border-gray-100">
                <div className="p-6 text-center">
                    <div className={`mx-auto w-14 h-14 rounded-2xl ${config.bgIcon} flex items-center justify-center text-2xl mb-4`}>
                        {config.icon}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {title}
                    </h3>
                    
                    <p className="text-gray-500 text-sm leading-relaxed mb-6">
                        {message}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 rounded-2xl text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-3 rounded-2xl text-sm font-semibold ${config.buttonClass} shadow-lg transition-all transform active:scale-95 cursor-pointer`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

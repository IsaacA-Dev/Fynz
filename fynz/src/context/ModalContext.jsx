import React, { createContext, useContext, useState, useRef } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

const ModalContext = createContext();

export function useModal() {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
}

export function ModalProvider({ children }) {
    const [modalConfig, setModalConfig] = useState(null);
    const resolver = useRef();

    const confirm = (options) => {
        return new Promise((resolve) => {
            setModalConfig({
                isOpen: true,
                title: options.title || '¿Confirmar acción?',
                message: options.message || '¿Deseas continuar con esta acción? No se puede deshacer.',
                confirmText: options.confirmText || 'Confirmar',
                cancelText: options.cancelText || 'Cancelar',
                type: options.type || 'danger',
            });
            resolver.current = resolve;
        });
    };

    const handleConfirm = () => {
        setModalConfig(null);
        resolver.current(true);
    };

    const handleCancel = () => {
        setModalConfig(null);
        resolver.current(false);
    };

    return (
        <ModalContext.Provider value={{ confirm }}>
            {children}
            {modalConfig && (
                <ConfirmationModal 
                    {...modalConfig}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </ModalContext.Provider>
    );
}

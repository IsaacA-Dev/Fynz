import { createContext, useContext, useState, useCallback } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

const ModalContext = createContext();

export function ModalProvider({ children }) {
    const [modalConfig, setModalConfig] = useState(null);

    const confirm = useCallback((config) => {
        return new Promise((resolve) => {
            setModalConfig({
                ...config,
                onConfirm: () => {
                    setModalConfig(null);
                    resolve(true);
                },
                onCancel: () => {
                    setModalConfig(null);
                    resolve(false); // User cancelled or closed
                }
            });
        });
    }, []);

    const closeExistingModal = () => setModalConfig(null);

    return (
        <ModalContext.Provider value={{ confirm }}>
            {children}
            {modalConfig && (
                <ConfirmationModal
                    isOpen={!!modalConfig}
                    {...modalConfig}
                    onClose={closeExistingModal}
                />
            )}
        </ModalContext.Provider>
    );
}

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        // Critical: If this throws, navigation/rendering will stop.
        // It must be used inside ModalProvider.
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

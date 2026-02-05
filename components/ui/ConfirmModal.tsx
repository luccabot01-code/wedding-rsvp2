import React, { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    isLoading = false
}) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShow(true);
        } else {
            const timer = setTimeout(() => setShow(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!show && !isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center px-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div
                className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            <div className={`
                relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 transform transition-all duration-300
                ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
            `}>
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-stone-400 hover:text-stone-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
                        <AlertTriangle size={32} />
                    </div>

                    <h3 className="font-serif text-2xl text-stone-800 mb-3">{title}</h3>
                    <p className="font-sans text-stone-500 text-sm leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex flex-col w-full gap-3">
                        <Button
                            onClick={onConfirm}
                            variant="outline"
                            isLoading={isLoading}
                            className="w-full py-4 text-sm uppercase tracking-wider border-none text-red-500 hover:bg-red-50"
                        >
                            {confirmText}
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="w-full py-4 text-sm uppercase tracking-wider border-none hover:bg-stone-50"
                        >
                            {cancelText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

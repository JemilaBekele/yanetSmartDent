// DeleteConfirmationDialog.tsx
import React from 'react';

interface DeleteConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Confirm Deletion</h2>
                <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this item? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2">
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 hover:text-gray-700 transition duration-200">
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition duration-200">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationDialog;

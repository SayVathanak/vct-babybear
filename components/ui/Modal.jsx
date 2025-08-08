import React from 'react';

/**
 * A reusable, responsive modal component.
 * @param {boolean} isOpen - Controls if the modal is visible.
 * @param {function} onClose - Function to call when the overlay is clicked.
 * @param {React.ReactNode} children - The content to display inside the modal.
 * @param {string} maxWidth - Tailwind CSS class for max-width (e.g., 'max-w-md', 'max-w-4xl').
 */
const Modal = ({ isOpen, onClose, children, maxWidth = 'max-w-lg' }) => {
    // If the modal isn't open, render nothing.
    if (!isOpen) {
        return null;
    }

    return (
        // The main container that covers the entire screen
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 text-center">
                
                {/* The overlay. Clicking this will call the onClose function. */}
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
                    onClick={onClose}
                    aria-hidden="true"
                ></div>

                {/* This container centers the modal panel vertically and horizontally. */}
                <div className={`relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full ${maxWidth}`}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
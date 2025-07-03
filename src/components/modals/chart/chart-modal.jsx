import React from 'react';
import Modal from 'react-modal';
import './chart-modal.scss';

//ReactModal.setAppElement('#root'); // Set the root element for accessibility

const ChartModal = ({ isOpen, onRequestClose, children }) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            className="modal"
            overlayClassName="modal-overlay"
        >
            <button className="close-btn" onClick={onRequestClose}>
                Close
            </button>
            <div className="modal-content">{children}</div>
        </Modal>
    );
};

export default ChartModal;

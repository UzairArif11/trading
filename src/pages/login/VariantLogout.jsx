// Modal.jsx
import React from 'react';
import './Modal.css'; // We'll define styles next

const VariantModal = ({ show , onConfirm, onCancel , title , message}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>{ title }</h3>
        <p>{message}</p>
        {onConfirm &&
        <div className="modal-buttons">
          <button className="modal-ok" onClick={onConfirm}>OK</button>
          <button className="modal-cancel" onClick={onCancel}>Cancel</button>
        </div>
    }
      </div>
    </div>
  );
};

export default VariantModal;

import React from "react";
import Modal from "react-modal";
import "./deleteModal.css";

const DeleteActionModal = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="modal-container_delete"
      overlayClassName="modal-overlay"
    >
      <h2 className="modal-title">Your sure want delete this action?</h2>
      <div style={{ display: "flex", justifyContent: "space-evenly" }}>
        <button
          className="confrim-btn"
          onClick={() => {
            onClose("yes");
          }}
        >
          yes
        </button>
        <button
          className="confrim-btn"
          onClick={() => {
            onClose("no");
          }}
        >
          No
        </button>
      </div>
    </Modal>
  );
};

export default DeleteActionModal;

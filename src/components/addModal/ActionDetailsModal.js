import React, { useState } from "react";
import Modal from "react-modal";
import "./actionDetailsModal.css";
import { db } from "../../utils/firebase";
import { addDoc, collection } from "firebase/firestore";

const ActionDetailsModal = ({ isOpen, onClose, userId }) => {
  const [actionName, setActionName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [showError, setShowError] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [actionsDone, setActionsDone] = useState("");
  const [totalActions, setTotalActions] = useState("");

  const handleSubmit = async () => {
    try {
      if (
        actionName &&
        startDate &&
        deadlineDate &&
        actionsDone &&
        totalActions
      ) {
        await addDoc(collection(db, "users", userId, "actions"), {
          actionName,
          startDate,
          deadlineDate,
          actionsDone: parseInt(actionsDone),
          totalActions: parseInt(totalActions),
          createdAt: new Date(),
        });
        onClose();
      } else {
        setShowError(true);
      }
    } catch (error) {
      console.error("Error adding action: ", error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="modal-container"
      overlayClassName="modal-overlay"
    >
      <i onClick={onClose} className="fa fa-times" aria-hidden="true"></i>
      <h2 className="modal-title">Add Action Details</h2>
      <form className="form-container">
        <div className="form-group">
          <label className="form-label">Action Name</label>
          <input
            type="text"
            value={actionName}
            onChange={(e) => setActionName(e.target.value)}
            className="input-field"
            placeholder="Enter action name"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Progress Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Progress Deadline Date</label>
          <input
            type="date"
            value={deadlineDate}
            onChange={(e) => setDeadlineDate(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Actions Done Till Now</label>
          <input
            type="number"
            value={actionsDone}
            onChange={(e) => setActionsDone(e.target.value)}
            className="input-field"
            placeholder="Enter actions done"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Total Actions</label>
          <input
            type="number"
            value={totalActions}
            onChange={(e) => setTotalActions(e.target.value)}
            className="input-field"
            placeholder="Enter total actions"
          />
        </div>
        {showError ? (
          <div className="error"> Please fill all the details</div>
        ) : (
          ""
        )}
        <button type="button" onClick={handleSubmit} className="submit-button">
          Submit
        </button>
      </form>
    </Modal>
  );
};

export default ActionDetailsModal;

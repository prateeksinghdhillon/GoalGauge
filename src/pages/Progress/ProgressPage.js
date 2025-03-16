import React, { useRef, useState } from "react";
import ProgressBar from "../../components/ProgressBar";
import ActionDetailsModal from "../../components/addModal/ActionDetailsModal";
import addBtn from "../../asstes/add-button.png";
import "./ProgressPage.css";

const ProgressPage = ({ userId }) => {
  const childRef = useRef();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTriggerChildFunction = () => {
    if (childRef.current) {
      childRef.current.triggerFunction();
    }
  };

  return (
    <>
      <h1 className="page-title">Track Your Progress</h1>
      <div className="progress-container">
        <ProgressBar ref={childRef} userId={userId} />
        
        <div className="add-progress-card">
          <img
            className="add-button"
            onClick={() => setIsModalOpen(true)}
            src={addBtn}
            alt="Add new action"
          />
        </div>
        
        <ActionDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            handleTriggerChildFunction();
          }}
          userId={userId}
        />
      </div>
    </>
  );
};

export default ProgressPage;
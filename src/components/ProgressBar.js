import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import arrowUp from "../asstes/up-arrow.png";
import trash from "../asstes/trash.png";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import "./progress.css";
import { db } from "../utils/firebase";
import DeleteActionModal from "./deleteModal/deleteModal";

const ProgressBar = forwardRef(({ userId }, ref) => {
  const [showOne, setShowOne] = useState([]);
  const [actions, setActions] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchActions = useCallback(
    async (userId) => {
      try {
        const querySnapshot = await getDocs(
          collection(db, "users", userId, "actions")
        );
        const act = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setActions(act);
        return act; // Return the fetched actions instead of state
      } catch (error) {
        console.error("Error fetching actions: ", error);
      }
    },
    [] // Dependencies for useCallback
  );

  const updateAction = async (userId, actionId, updatedActionsDone) => {
    try {
      const actionDocRef = doc(db, "users", userId, "actions", actionId);
      await updateDoc(actionDocRef, {
        actionsDone: updatedActionsDone,
      });
    } catch (error) {
      console.error("Error updating action: ", error);
    }
  };
  useImperativeHandle(ref, () => ({
    triggerFunction() {
      fetchActions(userId);
    },
  }));
  /**
   * Deletes an action for a user in Firestore.
   *
   * @param {string} userId - The ID of the user.
   * @param {string} actionId - The ID of the action to be deleted.
   * @returns {void}
   */
  const deleteAction = async (userId, actionId) => {
    try {
      // Reference to the specific action document
      const actionDocRef = doc(db, "users", userId, "actions", actionId);

      // Delete the document
      await deleteDoc(actionDocRef);
    } catch (error) {
      console.error("Error deleting action: ", error);
    }
  };
  const handleDeleteAction = async (actionId) => {
    deleteAction(userId, actionId);
    fetchActions(userId);
  };

  useEffect(() => {
    fetchActions(userId);
  }, [fetchActions,userId]);

  const calculateDaysLeft = (targetDate) => {
    const currentDate = new Date();
    const target = new Date(targetDate);
    const difference = Math.ceil(
      (target - currentDate) / (1000 * 60 * 60 * 24)
    );
    return difference >= 0 ? difference : 0;
  };

  const handleUpdate = async (actionId, updatedActionsDone) => {
    await updateAction(userId, actionId, updatedActionsDone);
    const updatedActions = actions.map((action) =>
      action.id === actionId
        ? { ...action, actionsDone: updatedActionsDone }
        : action
    );
    setShowOne([actionId]);
    setTimeout(() => setShowOne([]), 400);
    setActions(updatedActions);
  };

  const getWidth = (lecturesDone, totalLectures) => {
    const progressPercentage = Math.min(
      Math.max((lecturesDone / totalLectures) * 100, 0),
      100
    );
    return progressPercentage;
  };

  return (
    <>
      { actions.map((act) => {
        return (
          <div style={styles.container}>
            <h2 style={styles.heading}>
              {toTitleCase(act.actionName)} Tracker
            </h2>
            <div style={styles.progressContainer}>
              <div
                style={{
                  ...styles.progressBar,
                  width: `${getWidth(act.actionsDone, act.totalActions)}%`,
                }}
              ></div>
            </div>
            <p style={styles.percentage}>
              {getWidth(act.actionsDone, act.totalActions).toFixed(1)}%
              Completed
            </p>
            <div style={styles.countdown}>
              <label style={styles.label}>Days Left: </label>
              <span style={styles.days}>
                {calculateDaysLeft(act.deadlineDate)}
              </span>
            </div>
            <div style={styles.countdown}>
              <label style={styles.label}>{act.actionName}: </label>
              <span style={styles.days}>
                {act.actionsDone} / {act.totalActions}
              </span>
            </div>
            <div style={{ position: "absolute", right: "10px", top: "10px" }}>
              {showOne.some((e) => e === act.id) && (
                <div
                  className="pop-up"
                  style={{
                    position: "absolute",
                    color: "white",
                    fontSize: "30px",
                  }}
                >
                  +1
                </div>
              )}
              <img
                onClick={() => handleUpdate(act.id, act.actionsDone + 1)}
                src={arrowUp}
                style={{ height: "26px", cursor: "pointer" }}
                alt=""
              ></img>
              <div
                style={{
                  backgroundColor: "grey",
                  textAlign: "center",
                  borderRadius: "14px",
                }}
              >
                +1
              </div>
            </div>

            <div
              style={{ position: "absolute", right: "10px", bottom: "10px" }}
            >
              <img
                onClick={() => {
                  setIsDeleteModalOpen(true);
                }}
                alt=""
                src={trash}
                style={{ height: "26px", cursor: "pointer" }}
              ></img>
              <DeleteActionModal
                isOpen={isDeleteModalOpen}
                onClose={(con) => {
                  if (con === "yes") {
                    handleDeleteAction(act.id);
                  }
                  setIsDeleteModalOpen(false);
                }}
              />
            </div>
          </div>
        );
      })}
    </>
  );
});

const styles = {
  container: {
    position: "relative",
    backgroundColor: "#1e1e2f",
    color: "#ffffff",
    padding: "20px",
    borderRadius: "10px",
    width: "300px",
    fontFamily: "'Arial', sans-serif",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.5)",
  },
  heading: {
    textAlign: "center",
    marginBottom: "20px",
    fontSize: "18px",
    fontWeight: "bold",
  },
  progressContainer: {
    backgroundColor: "#33334d",
    borderRadius: "10px",
    overflow: "hidden",
    height: "20px",
    marginBottom: "10px",
  },
  progressBar: {
    backgroundColor: "#4caf50",
    height: "100%",
    transition: "width 0.5s ease-in-out",
  },
  percentage: {
    textAlign: "center",
    margin: "10px 0",
    fontSize: "16px",
  },
  countdown: {
    textAlign: "center",
    marginTop: "15px",
  },
  label: {
    fontSize: "16px",
  },
  days: {
    fontSize: "18px",
    fontWeight: "bold",
  },
};

export default ProgressBar;

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

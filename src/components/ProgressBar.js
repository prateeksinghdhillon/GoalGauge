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
  getDoc,
  setDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import "./progress.css";
import { db } from "../utils/firebase";
import DeleteActionModal from "./deleteModal/deleteModal";

const ProgressBar = forwardRef(({ userId }, ref) => {
  const [showOne, setShowOne] = useState([]);
  const [actions, setActions] = useState([]);
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    actionId: null,
  });

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
        return act;
      } catch (error) {
        console.error("Error fetching actions: ", error);
      }
    },
    []
  );

  const updateAction = async (userId, actionId, updatedActionsDone) => {
    try {
      const actionDocRef = doc(db, "users", userId, "actions", actionId);
      await updateDoc(actionDocRef, {
        actionsDone: updatedActionsDone,
      });
      
      // Update daily progress
      await updateDailyProgress(userId);
    } catch (error) {
      console.error("Error updating action: ", error);
    }
  };

  const updateDailyProgress = async (userId) => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Reference to the daily progress document
      const dailyProgressRef = doc(db, "users", userId, "progress", "daily");
      
      // Get the existing document
      const dailyProgressDoc = await getDoc(dailyProgressRef);
      
      if (dailyProgressDoc.exists()) {
        // Update the existing document
        await updateDoc(dailyProgressRef, {
          [today]: increment(1),
          lastUpdated: serverTimestamp(),
        });
      } else {
        // Create a new document with today's entry
        await setDoc(dailyProgressRef, {
          [today]: 1,
          lastUpdated: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error updating daily progress: ", error);
    }
  };

  useImperativeHandle(ref, () => ({
    triggerFunction() {
      fetchActions(userId);
    },
  }));

  const deleteAction = async (userId, actionId) => {
    try {
      const actionDocRef = doc(db, "users", userId, "actions", actionId);
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
  }, [fetchActions, userId]);

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
      {actions.map((act) => {
        return (
          <div style={styles.container} key={act.id}>
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
                  setDeleteModalState({ isOpen: true, actionId: act.id });
                }}
                alt=""
                src={trash}
                style={{ height: "26px", cursor: "pointer" }}
              />
              <DeleteActionModal
                isOpen={deleteModalState.isOpen}
                onClose={(con) => {
                  if (con === "yes" && deleteModalState.actionId) {
                    handleDeleteAction(deleteModalState.actionId);
                  }
                  setDeleteModalState({ isOpen: false, actionId: null });
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
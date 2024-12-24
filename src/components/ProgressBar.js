import React, { useState, useEffect } from "react";

const ProgressBar = ({ totalLectures, lecturesDone, targetDate }) => {
    const [daysLeft, setDaysLeft] = useState(0);

    useEffect(() => {
        const calculateDaysLeft = () => {
            const currentDate = new Date();
            const target = new Date(targetDate);
            const difference = Math.ceil((target - currentDate) / (1000 * 60 * 60 * 24));
            setDaysLeft(difference >= 0 ? difference : 0);
        };

        calculateDaysLeft();
        const interval = setInterval(calculateDaysLeft, 1000 * 60 * 60); // Recalculate every hour
        return () => clearInterval(interval);
    }, [targetDate]);

    const progressPercentage = Math.min(
        Math.max((lecturesDone / totalLectures) * 100, 0),
        100
    );

    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>Progress Tracker</h2>
            <div style={styles.progressContainer}>
                <div style={{ ...styles.progressBar, width: `${progressPercentage}%` }}></div>
            </div>
            <p style={styles.percentage}>{progressPercentage.toFixed(1)}% Completed</p>
            <div style={styles.countdown}>
                <label style={styles.label}>Days Left: </label>
                <span style={styles.days}>{daysLeft}</span>
            </div>
            <div style={styles.countdown}>
                <label style={styles.label}>Lectures: </label>
                <span style={styles.days}>{lecturesDone} / {totalLectures}</span>
            </div>
        </div>
    );
};

const styles = {
    container: {
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

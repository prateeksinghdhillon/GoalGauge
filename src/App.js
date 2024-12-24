import React, { useState } from "react";
import ReactDOM from "react-dom";
import ProgressBar from "./components/ProgressBar";
import arrowUp from "./asstes/up-arrow.png";
import "./App.css";
import mario from "./asstes/mario.gif";

const App = () => {
  const [lecturesDone, setLecturesDone] = useState(
    parseInt(localStorage.getItem("lecturesDone")) ?? 0
  );
  const addLecture = () => {
    setLecturesDone((prev) => prev + 1);
    localStorage.setItem("lecturesDone", lecturesDone + 1);
  };
  return (
    <div
      style={{
        backgroundColor: "#121212",
        minHeight: "100vh",
        padding: "20px",
        display: "flex",
        gap: "10px",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ProgressBar
        totalLectures={2800}
        lecturesDone={lecturesDone}
        targetDate="2025-09-30"
      />
      <div style={{ position: "relative" }}>
        <div
          className="pop-up"
          style={{ position: "absolute", color: "white", fontSize: "30px" }}
        >+1</div>
        <div
          style={{
            position: "absolute",
            color: "white",
            fontSize: "30px",
            top: -135,
            left: -37,
          }}
        >
          {" "}
          <img src={mario} />
        </div>
        <img
          onClick={addLecture}
          src={arrowUp}
          style={{ height: "40px", cursor: "pointer" }}
        ></img>
        <div
          style={{
            backgroundColor: "grey",
            width: "39px",
            textAlign: "center",
            borderRadius: "14px",
            height: "27px",
          }}
        >
          +1
        </div>
      </div>
    </div>
  );
};

// ReactDOM.render(<App />, document.getElementById("root"));

export default App;

import LoginWithGoogle from "../components/login/login";
import React, { useRef, useState } from "react";
import { useAuth } from "../utils/context/AuthContext";
import ActionDetailsModal from "../components/addModal/ActionDetailsModal";
import ProgressBar from "../components/ProgressBar";

import "./home.css";
import addBtn from "../asstes/add-button.png";

const Home = () => {
  const childRef = useRef();
  const handleTriggerChildFunction = () => {
    if (childRef.current) {
      childRef.current.triggerFunction();
    }
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdown, setIsDropdown] = useState(false);
  const { user, isLoggedIn, logout } = useAuth();

  return (
    <>
      {!isLoggedIn ? (
        <div
          style={{
            backgroundColor: "#000",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LoginWithGoogle />
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#121212",
            minHeight: "100vh",
            padding: "20px",
            paddingTop:"50px",
            display: "flex",
            gap: "10px",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <img
              onClick={() => {
                setIsDropdown((pre) => !pre);
              }}
              className="profile"
              src={user.photoURL}
              alt=""
            ></img>
          </div>
          {isDropdown ? (
            <div
              onClick={() => {
                logout();
                setIsDropdown((pre) => !pre);
              }}
              className="dropdown"
            >
              logout
            </div>
          ) : (
            ""
          )}
          <ProgressBar ref={childRef} userId={user.uid} />

          <div
            style={{
              position: "relative",
              backgroundColor: "#1e1e2f",
              color: "#ffffff",
              padding: "20px",
              borderRadius: "10px",
              width: "300px",
              fontFamily: "'Arial', sans-serif",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              height: "176px",
              alignItems: "center",
            }}
          >
            <img
              height={100}
              style={{ height: "176px" }}
              onClick={() => setIsModalOpen(true)}
              src={addBtn}
              alt=""
            />
          </div>
          <ActionDetailsModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              handleTriggerChildFunction();
            }}
            userId={user.uid}
          />
        </div>
      )}
    </>
  );
};

export default Home;

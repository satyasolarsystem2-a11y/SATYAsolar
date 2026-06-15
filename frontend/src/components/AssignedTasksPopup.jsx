import React, { useState, useEffect } from "react";
import { edgeFetch, EDGE } from "../lib/supabaseClient";
import { ClipboardCheck, X, ArrowRight, Check } from "lucide-react";

const AssignedTasksPopup = () => {
  const [tasks, setTasks] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const userName = localStorage.getItem("name");
        if (!userName) return;

        const data = await edgeFetch(EDGE.workflow, { action: "get_all" });
        const allMyTasks = data.filter(c => c.assigned_to === userName || c.assignedTo === userName);

        // Filter out tasks that have already been accepted
        const acceptedTasksStr = localStorage.getItem("acceptedTasks") || "[]";
        let acceptedTasks = [];
        try {
          acceptedTasks = JSON.parse(acceptedTasksStr);
        } catch (e) {
          acceptedTasks = [];
        }

        const newTasks = allMyTasks.filter(c => !acceptedTasks.includes(c.id));

        if (newTasks.length > 0) {
          setTasks(newTasks);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Failed to fetch assigned tasks for popup", err);
      }
    };

    const timer = setTimeout(() => {
      fetchTasks();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleAcceptTasks = () => {
    // Save these task IDs as accepted
    const acceptedTasksStr = localStorage.getItem("acceptedTasks") || "[]";
    let acceptedTasks = [];
    try {
      acceptedTasks = JSON.parse(acceptedTasksStr);
    } catch (e) {
      acceptedTasks = [];
    }

    const newTaskIds = tasks.map(t => t.id);
    const updatedAccepted = [...new Set([...acceptedTasks, ...newTaskIds])];
    localStorage.setItem("acceptedTasks", JSON.stringify(updatedAccepted));

    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          width: "90%",
          maxWidth: "400px",
          padding: "24px",
          position: "relative",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <button
          onClick={() => setIsOpen(false)}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
            padding: "4px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f1f5f9";
            e.currentTarget.style.color = "#0f172a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.color = "#64748b";
          }}
        >
          <X style={{ width: "20px", height: "20px" }} />
        </button>

        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "#e0e7ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
            color: "#4f46e5"
          }}
        >
          <ClipboardCheck style={{ width: "24px", height: "24px" }} />
        </div>

        <h3
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: "8px",
            margin: 0,
          }}
        >
          You have pending tasks!
        </h3>
        
        <p
          style={{
            fontSize: "14px",
            color: "#475569",
            lineHeight: 1.5,
            marginBottom: "24px",
          }}
        >
          Admin has assigned <strong>{tasks.length}</strong> new task{tasks.length > 1 ? "s" : ""} to you. Please accept them to continue your work.
        </p>

        <button
          onClick={handleAcceptTasks}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "12px",
            borderRadius: "10px",
            background: "#4f46e5",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#4338ca";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#4f46e5";
            e.currentTarget.style.transform = "none";
          }}
        >
          <Check style={{ width: "16px", height: "16px" }} /> Accept Task{tasks.length > 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
};

export default AssignedTasksPopup;

import React, { useState } from "react";

function App() {
  // ---------- STATES ----------
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const [jobs, setJobs] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // ---------- HELPERS ----------
  const showMsg = (text) => {
    setMsg(text);
    setError("");
  };

  const showError = (text) => {
    setError(text);
    setMsg("");
  };

  // ---------- TALK ----------
  const talkToBackend = async () => {
    const res = await fetch("http://127.0.0.1:5000/");
    const text = await res.text();
    showMsg(text);
  };

  // ---------- REGISTER ----------
  const register = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      showMsg(data.message || "Registered!");
    } catch {
      showError("Register failed");
    }
  };

  // ---------- LOGIN ----------
  const login = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.access_token) {
        showError("Login failed");
        return;
      }

      localStorage.setItem("token", data.access_token);
      showMsg("Logged in!");
    } catch {
      showError("Login error");
    }
  };

  // ---------- LOGOUT ----------
  const logout = () => {
    localStorage.removeItem("token");
    showMsg("Logged out!");
  };

  // ---------- ADD JOB ----------
  const addJob = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Please login first");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
        body: JSON.stringify({
          company,
          role,
          status: "Applied",
        }),
      });

      const data = await res.json();
      showMsg(data.message || "Job added!");
    } catch {
      showError("Add job failed");
    }
  };

  // ---------- GET JOBS ----------
  const getJobs = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Please login first");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/jobs", {
        headers: { "Authorization": "Bearer " + token },
      });

      const data = await res.json();
      setJobs(data.jobs || []);
    } catch {
      showError("Cannot load jobs");
    }
  };

  // ---------- UPDATE JOB ----------
  const updateJob = async (id) => {
    const token = localStorage.getItem("token");

    await fetch(`http://127.0.0.1:5000/jobs/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
      body: JSON.stringify({ status: "Interview" }),
    });

    getJobs();
  };

  // ---------- DELETE JOB ----------
  const deleteJob = async (id) => {
    const token = localStorage.getItem("token");

    await fetch(`http://127.0.0.1:5000/jobs/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token,
      },
    });

    getJobs();
  };

  // ---------- UI ----------
  return (
    <div style={styles.container}>
      <h1>My Job Tracker App</h1>

      {/* USER */}
      <div style={styles.card}>
        <h3>User</h3>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div>
          <button onClick={register}>Register</button>
          <button onClick={login}>Login</button>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {/* JOB */}
      <div style={styles.card}>
        <h3>Job</h3>
        <input
          placeholder="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <input
          placeholder="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />

        <div>
          <button onClick={addJob}>Add Job</button>
          <button onClick={getJobs}>Show Jobs</button>
        </div>
      </div>

      {/* MESSAGES */}
      {msg && <p style={styles.success}>{msg}</p>}
      {error && <p style={styles.error}>{error}</p>}

      {/* JOB LIST */}
      <ul>
        {jobs.map((job) => (
          <li key={job.id} style={styles.jobItem}>
            {job.company} — {job.role} — {job.status}

            <button onClick={() => updateJob(job.id)}>
              Interview
            </button>

            <button onClick={() => deleteJob(job.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>

      <button onClick={talkToBackend}>Talk to Backend</button>
    </div>
  );
}

/* ---------- BASIC STYLES ---------- */
const styles = {
  container: {
    padding: "30px",
    fontFamily: "Arial",
    background: "#f5f7fb",
    minHeight: "100vh",
  },
  card: {
    background: "white",
    border: "1px solid #ddd",
    padding: "15px",
    marginBottom: "15px",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },
  success: {
    color: "green",
    fontWeight: "bold",
  },
  error: {
    color: "red",
    fontWeight: "bold",
  },
  jobItem: {
    marginBottom: "8px",
    padding: "6px",
    background: "#eef2ff",
    borderRadius: "6px",
  },
};


export default App;

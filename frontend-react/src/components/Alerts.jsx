
import { useEffect, useState } from "react";
import "./Alerts.css";

const STORAGE_KEY = "smartHireJobAlerts";

function loadSavedAlerts() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Unable to load saved job alerts:", error);
        return [];
    }
}

function Alerts() {
    const [jobRole, setJobRole] = useState("");
    const [location, setLocation] = useState("");
    const [frequency, setFrequency] = useState("Daily");
    const [alerts, setAlerts] = useState(loadSavedAlerts);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

    useEffect(() => {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(alerts)
            );
        } catch (error) {
            console.error("Unable to save job alerts:", error);
            setMessageType("error");
            setMessage(
                "Unable to save your alert in this browser. Check your browser storage settings."
            );
        }
    }, [alerts]);

    const handleSubmit = (event) => {
        event.preventDefault();

        const trimmedRole = jobRole.trim();
        const trimmedLocation = location.trim();

        if (!trimmedRole) {
            setMessageType("error");
            setMessage("Please enter a job role.");
            return;
        }

        const duplicate = alerts.some(
            (alert) =>
                alert.jobRole.toLowerCase() ===
                    trimmedRole.toLowerCase() &&
                alert.location.toLowerCase() ===
                    trimmedLocation.toLowerCase() &&
                alert.frequency === frequency
        );

        if (duplicate) {
            setMessageType("error");
            setMessage(
                "You already have an alert with these preferences."
            );
            return;
        }

        const newAlert = {
            id: `${Date.now()}-${trimmedRole}`,
            jobRole: trimmedRole,
            location: trimmedLocation,
            frequency,
            createdAt: new Date().toISOString(),
        };

        setAlerts((previousAlerts) => [
            newAlert,
            ...previousAlerts,
        ]);

        setJobRole("");
        setLocation("");
        setFrequency("Daily");

        setMessageType("success");
        setMessage(
            "Your job alert preferences have been saved successfully."
        );
    };

    const handleRemoveAlert = (alertId) => {
        setAlerts((previousAlerts) =>
            previousAlerts.filter(
                (alert) => alert.id !== alertId
            )
        );

        setMessageType("success");
        setMessage("Job alert removed.");
    };

    return (
        <section id="alerts" className="alerts-section">
            <div className="alert-panel">
                <div className="alert-content">
                    <span className="section-label">
                        Stay Updated
                    </span>

                    <h2 className="section-title">
                        Create a Job Alert
                    </h2>

                    <p>
                        Save your job preferences and keep them ready
                        for future matching opportunities.
                    </p>
                </div>

                <form
                    className="job-alert-form"
                    onSubmit={handleSubmit}
                >
                    <div className="alert-form-field">
                        <label htmlFor="alertJobRole">
                            Job Role *
                        </label>

                        <input
                            id="alertJobRole"
                            className="form-input"
                            type="text"
                            placeholder="e.g. Python Developer"
                            value={jobRole}
                            onChange={(event) =>
                                setJobRole(event.target.value)
                            }
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="alert-form-field">
                        <label htmlFor="alertLocation">
                            Location
                        </label>

                        <input
                            id="alertLocation"
                            className="form-input"
                            type="text"
                            placeholder="e.g. Hyderabad or Remote"
                            value={location}
                            onChange={(event) =>
                                setLocation(event.target.value)
                            }
                            maxLength={100}
                        />
                    </div>

                    <div className="alert-form-field">
                        <label htmlFor="alertFrequency">
                            Frequency
                        </label>

                        <select
                            id="alertFrequency"
                            className="form-input"
                            value={frequency}
                            onChange={(event) =>
                                setFrequency(event.target.value)
                            }
                        >
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                        </select>
                    </div>

                    <button
                        className="primary-button"
                        type="submit"
                    >
                        Create Alert
                    </button>
                </form>

                {message && (
                    <p
                        className={`alert-message ${
                            messageType === "error"
                                ? "alert-message-error"
                                : "alert-message-success"
                        }`}
                        role={messageType === "error" ? "alert" : "status"}
                        aria-live="polite"
                    >
                        {message}
                    </p>
                )}

                <div className="saved-alerts">
                    <div className="saved-alerts-heading">
                        <h3>Your Saved Alerts</h3>
                        <span>{alerts.length}</span>
                    </div>

                    {alerts.length === 0 ? (
                        <p className="no-saved-alerts">
                            You haven't created any job alerts yet.
                        </p>
                    ) : (
                        <div className="saved-alert-list">
                            {alerts.map((alert) => (
                                <article
                                    className="saved-alert-card"
                                    key={alert.id}
                                >
                                    <div className="saved-alert-details">
                                        <h4>{alert.jobRole}</h4>

                                        <p>
                                            📍 {alert.location || "Any location"}
                                        </p>

                                        <span className="saved-alert-frequency">
                                            {alert.frequency}
                                        </span>
                                    </div>

                                    <button
                                        className="remove-alert-button"
                                        type="button"
                                        onClick={() =>
                                            handleRemoveAlert(alert.id)
                                        }
                                        aria-label={`Remove ${alert.jobRole} alert`}
                                    >
                                        Remove
                                    </button>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default Alerts;

import React, { useState } from "react";
import "./UserDashboard.css";

function UserDashboard({
    user,
    jobs = [],
    applications = [],
    savedJobs = [],
    onApplyJob,
    onSaveJob,
    onRemoveSavedJob
}) {
    const [activeSection, setActiveSection] = useState("dashboard");

    const [pendingJob, setPendingJob] = useState(null);
    const [selectedResume, setSelectedResume] = useState(null);
    const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);

    const approvedJobs = jobs.filter(
        (job) => job.approvalStatus === "Approved"
    );

    // User Profile
    const profileStorageKey = `smartHireProfile_${user?.email?.toLowerCase() || "user"}`;

    const [showUserProfile, setShowUserProfile] = useState(false);

    const [userProfile, setUserProfile] = useState(() => {
        const savedProfile = localStorage.getItem(
            `smartHireProfile_${user?.email?.toLowerCase() || "user"}`
        );

        if (savedProfile) {
            try {
                return JSON.parse(savedProfile);
            } catch (error) {
                console.error("Error loading saved profile:", error);
            }
        }

        return {
            fullName: "",
            email: user?.email || "",
            phone: "",
            location: "",
            skills: "",
            education: "",
            experience: "",
            bio: ""
        };
    });

    const [profileMessage, setProfileMessage] = useState("");

    const openUserProfile = () => {
        setActiveSection("profile");
        setShowUserProfile(true);
        setProfileMessage("");
    };

    const closeUserProfile = () => {
        setShowUserProfile(false);
        setActiveSection("dashboard");
        setProfileMessage("");
    };

    const handleSaveUserProfile = (event) => {
        event.preventDefault();

        localStorage.setItem(
            profileStorageKey,
            JSON.stringify(userProfile)
        );

        setProfileMessage("Profile updated successfully!");

        setTimeout(() => {
            setProfileMessage("");
        }, 3000);
    };

    const handleProfileChange = (event) => {
        const { name, value } = event.target;

        setUserProfile((previousProfile) => ({
            ...previousProfile,
            [name]: value
        }));
    };

    // Apply for Job
    const handleApply = (job) => {
        if (job.approvalStatus !== "Approved") {
            alert("This job has not been approved by the admin yet.");
            return;
        }

        if (hasApplied(job.id)) {
            return;
        }

        setPendingJob(job);
        setSelectedResume(null);
    };

    const hasApplied = (jobId) => {
        return applications.some(
            (application) => application.jobId === jobId
        );
    };

    const handleSubmitApplication = async (event) => {
        event.preventDefault();

        if (!pendingJob || !selectedResume) {
            alert("Please select your resume before applying.");
            return;
        }

        if (!/\.(pdf|doc|docx)$/i.test(selectedResume.name)) {
            alert("Please select a PDF, DOC, or DOCX resume.");
            return;
        }

        if (
            selectedResume.size === 0 ||
            selectedResume.size > 10 * 1024 * 1024
        ) {
            alert("Your resume must be smaller than 10 MB and cannot be empty.");
            return;
        }

        setIsSubmittingApplication(true);

        try {
            const result = await onApplyJob(pendingJob, selectedResume);

            if (result === true) {
                setPendingJob(null);
                setSelectedResume(null);
            }
        } catch (error) {
            console.error("Application submission failed:", error);
            alert(error.message || "Unable to submit your application.");
        } finally {
            setIsSubmittingApplication(false);
        }
    };

    // Save Job
    const handleSave = (job) => {
        if (onSaveJob) {
            onSaveJob(job);
        }
    };

    // Remove Saved Job
    const handleRemoveSavedJob = (savedJobId) => {
        if (onRemoveSavedJob) {
            onRemoveSavedJob(savedJobId);
        }
    };

    return (
        <section className="user-dashboard">

            {/* Dashboard Header */}
            <div className="dashboard-header">
                <div>
                    <h1>
                        Welcome,{" "}
                        {userProfile.fullName || "Job Seeker"} 👋
                    </h1>

                    <p>
                        Find your dream job and manage your applications.
                    </p>
                </div>

                <div className="dashboard-user-info">
                    <div className="user-avatar">
                        👤
                    </div>

                    <div>
                        <strong>
                            {userProfile.fullName || "Job Seeker Account"}
                        </strong>

                        <span>
                            {userProfile.email || user?.email}
                        </span>
                    </div>
                </div>
            </div>

            {/* Dashboard Navigation */}
            <div className="dashboard-navigation">

                <button
                    className={activeSection === "dashboard" ? "active" : ""}
                    onClick={() => setActiveSection("dashboard")}
                >
                    🏠 Dashboard
                </button>

                <button
                    className={activeSection === "jobs" ? "active" : ""}
                    onClick={() => setActiveSection("jobs")}
                >
                    💼 Find Jobs
                </button>

                <button
                    className={activeSection === "applications" ? "active" : ""}
                    onClick={() => setActiveSection("applications")}
                >
                    📄 My Applications
                </button>

                <button
                    className={activeSection === "saved" ? "active" : ""}
                    onClick={() => setActiveSection("saved")}
                >
                    ⭐ Saved Jobs
                </button>

                <button
                    className={activeSection === "profile" ? "active" : ""}
                    onClick={openUserProfile}
                >
                    👤 My Profile
                </button>

            </div>

            {/* Dashboard Section */}
            {activeSection === "dashboard" && (
                <div className="dashboard-content">

                    {/* Statistics */}
                    <div className="dashboard-stats">

                        <div className="stat-card">
                            <div className="stat-icon">
                                💼
                            </div>

                            <div>
                                <h3>{jobs.length}</h3>
                                <p>Available Jobs</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">
                                📄
                            </div>

                            <div>
                                <h3>{applications.length}</h3>
                                <p>Applications</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">
                                ⭐
                            </div>

                            <div>
                                <h3>{savedJobs.length}</h3>
                                <p>Saved Jobs</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">
                                🎯
                            </div>

                            <div>
                                <h3>
                                    {
                                        applications.filter(
                                            (application) =>
                                                application.status === "Selected"
                                        ).length
                                    }
                                </h3>

                                <p>Selected</p>
                            </div>
                        </div>

                    </div>

                    {/* Quick Actions */}
                    <div className="dashboard-section">

                        <div className="section-header">
                            <div>
                                <h2>Quick Actions</h2>
                                <p>
                                    Manage your job search from here.
                                </p>
                            </div>
                        </div>

                        <div className="quick-actions">

                            <button
                                className="action-card"
                                onClick={() => setActiveSection("jobs")}
                            >
                                <span className="action-icon">
                                    🔎
                                </span>

                                <strong>
                                    Find Jobs
                                </strong>

                                <span>
                                    Browse available jobs
                                </span>
                            </button>

                            <button
                                className="action-card"
                                onClick={() =>
                                    setActiveSection("applications")
                                }
                            >
                                <span className="action-icon">
                                    📄
                                </span>

                                <strong>
                                    My Applications
                                </strong>

                                <span>
                                    Track your applications
                                </span>
                            </button>

                            <button
                                className="action-card"
                                onClick={() =>
                                    setActiveSection("saved")
                                }
                            >
                                <span className="action-icon">
                                    ⭐
                                </span>

                                <strong>
                                    Saved Jobs
                                </strong>

                                <span>
                                    View jobs you saved
                                </span>
                            </button>

                            <button
                                className="action-card"
                                onClick={openUserProfile}
                            >
                                <span className="action-icon">
                                    👤
                                </span>

                                <strong>
                                    Edit Profile
                                </strong>

                                <span>
                                    Update your profile
                                </span>
                            </button>

                        </div>
                    </div>

                    {/* Recent Jobs */}
                    <div className="dashboard-section">

                        <div className="section-header">

                            <div>
                                <h2>Latest Job Opportunities</h2>

                                <p>
                                    Explore the latest jobs posted by recruiters.
                                </p>
                            </div>

                            <button
                                className="view-all-button"
                                onClick={() => setActiveSection("jobs")}
                            >
                                View All
                            </button>

                        </div>

                        <div className="dashboard-job-grid">

                            {approvedJobs.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">
                                        💼
                                    </div>

                                    <h3>
                                        No jobs available
                                    </h3>

                                    <p>
                                        New jobs will appear here when recruiters
                                        post them.
                                    </p>
                                </div>
                            ) : (
                                jobs.slice(0, 6).map((job) => (
                                    <div
                                        className="dashboard-job-card"
                                        key={job.id}
                                    >

                                        <div className="job-card-header">

                                            <div>
                                                <h3>
                                                    {job.title}
                                                </h3>

                                                <p>
                                                    {job.company}
                                                </p>
                                            </div>

                                            <button
                                                className="save-job-button"
                                                onClick={() => handleSave(job)}
                                                title="Save Job"
                                            >
                                                ⭐
                                            </button>

                                        </div>

                                        <div className="job-card-details">

                                            <span>
                                                📍 {job.location}
                                            </span>

                                            <span>
                                                💼 {job.jobType}
                                            </span>

                                            <span>
                                                💰 {job.salary}
                                            </span>

                                        </div>

                                        <p className="job-description">
                                            {job.description}
                                        </p>

                                        <button
                                            className={`apply-job-button ${hasApplied(job.id) ? "already-applied" : ""
                                                }`}
                                            onClick={() => handleApply(job)}
                                            disabled={hasApplied(job.id)}
                                        >
                                            {hasApplied(job.id) ? "✓ Already Applied" : "Apply Now"}
                                        </button>

                                    </div>
                                ))
                            )}

                        </div>
                    </div>

                </div>
            )}

            {/* Find Jobs Section */}
            {activeSection === "jobs" && (
                <div className="dashboard-section">

                    <div className="section-header">

                        <div>
                            <h2>Find Jobs</h2>

                            <p>
                                Browse all available job opportunities.
                            </p>
                        </div>

                    </div>

                    <div className="dashboard-job-grid">

                        {jobs.length === 0 ? (
                            <div className="empty-state">

                                <div className="empty-icon">
                                    🔎
                                </div>

                                <h3>
                                    No jobs available
                                </h3>

                                <p>
                                    Please check again later.
                                </p>

                            </div>
                        ) : (
                            approvedJobs.map((job) => (
                                <div
                                    className="dashboard-job-card"
                                    key={job.id}
                                >

                                    <div className="job-card-header">

                                        <div>
                                            <h3>
                                                {job.title}
                                            </h3>

                                            <p>
                                                {job.company}
                                            </p>
                                        </div>

                                        <button
                                            className="save-job-button"
                                            onClick={() => handleSave(job)}
                                            title="Save Job"
                                        >
                                            ⭐
                                        </button>

                                    </div>

                                    <div className="job-card-details">

                                        <span>
                                            📍 {job.location}
                                        </span>

                                        <span>
                                            💼 {job.jobType}
                                        </span>

                                        <span>
                                            💰 {job.salary}
                                        </span>

                                        {job.experience && (
                                            <span>
                                                🎓 {job.experience}
                                            </span>
                                        )}

                                    </div>

                                    <p className="job-description">
                                        {job.description}
                                    </p>

                                    <button
                                        className={`apply-job-button ${hasApplied(job.id) ? "already-applied" : ""
                                            }`}
                                        onClick={() => handleApply(job)}
                                        disabled={hasApplied(job.id)}
                                    >
                                        {hasApplied(job.id) ? "✓ Already Applied" : "Apply Now"}
                                    </button>

                                </div>
                            ))
                        )}

                    </div>
                </div>
            )}

            {/* Applications Section */}
            {activeSection === "applications" && (
                <div className="dashboard-section">

                    <div className="section-header">

                        <div>
                            <h2>My Applications</h2>

                            <p>
                                Track the status of jobs you have applied for.
                            </p>
                        </div>

                    </div>

                    {applications.length === 0 ? (
                        <div className="empty-state">

                            <div className="empty-icon">
                                📄
                            </div>

                            <h3>
                                No applications yet
                            </h3>

                            <p>
                                Apply for a job to see your applications here.
                            </p>

                            <button
                                className="apply-job-button"
                                onClick={() => setActiveSection("jobs")}
                            >
                                Find Jobs
                            </button>

                        </div>
                    ) : (
                        <div className="applications-list">

                            {applications.map((application) => (
                                <div
                                    className="application-card"
                                    key={application.id}
                                >

                                    <div className="application-main">

                                        <div>
                                            <h3>
                                                {application.jobTitle}
                                            </h3>

                                            <p>
                                                {application.company}
                                            </p>

                                            <div className="application-details">

                                                <span>
                                                    📍 {application.location}
                                                </span>

                                                <span>
                                                    💼 {application.jobType}
                                                </span>

                                                <span>
                                                    💰 {application.salary}
                                                </span>

                                            </div>
                                        </div>

                                        <div className="application-status">

                                            <span
                                                className={`status-badge ${String(
                                                    application.status || "Applied"
                                                )
                                                    .toLowerCase()
                                                    .replace(/\s+/g, "-")}`}
                                            >
                                                {application.status || "Applied"}
                                            </span>

                                        </div>

                                    </div>

                                    <div className="application-footer">

                                        <span>
                                            Applied on:{" "}
                                            {application.applied_at &&
                                                !Number.isNaN(new Date(application.applied_at).getTime())
                                                ? new Date(application.applied_at).toLocaleDateString()
                                                : application.appliedAt &&
                                                    !Number.isNaN(new Date(application.appliedAt).getTime())
                                                    ? new Date(application.appliedAt).toLocaleDateString()
                                                    : "Recently"}
                                        </span>

                                        <span>
                                            Application Status:{" "}
                                            <strong>
                                                {application.status || "Applied"}
                                            </strong>
                                        </span>

                                    </div>

                                </div>
                            ))}

                        </div>
                    )}

                </div>
            )}

            {/* Saved Jobs Section */}
            {activeSection === "saved" && (
                <div className="dashboard-section">

                    <div className="section-header">

                        <div>
                            <h2>Saved Jobs</h2>

                            <p>
                                Jobs you saved for later.
                            </p>
                        </div>

                    </div>

                    {savedJobs.length === 0 ? (
                        <div className="empty-state">

                            <div className="empty-icon">
                                ⭐
                            </div>

                            <h3>
                                No saved jobs
                            </h3>

                            <p>
                                Save interesting jobs and come back to them later.
                            </p>

                            <button
                                className="apply-job-button"
                                onClick={() => setActiveSection("jobs")}
                            >
                                Find Jobs
                            </button>

                        </div>
                    ) : (
                        <div className="dashboard-job-grid">

                            {savedJobs.map((job) => (
                                <div
                                    className="dashboard-job-card"
                                    key={job.id}
                                >

                                    <div className="job-card-header">

                                        <div>
                                            <h3>
                                                {job.jobTitle}
                                            </h3>

                                            <p>
                                                {job.company}
                                            </p>
                                        </div>

                                        <button
                                            className="save-job-button saved"
                                            onClick={() =>
                                                handleRemoveSavedJob(job.id)
                                            }
                                            title="Remove Saved Job"
                                        >
                                            ⭐
                                        </button>

                                    </div>

                                    <div className="job-card-details">

                                        <span>
                                            📍 {job.location}
                                        </span>

                                        <span>
                                            💼 {job.jobType}
                                        </span>

                                        <span>
                                            💰 {job.salary}
                                        </span>

                                        {job.experience && (
                                            <span>
                                                🎓 {job.experience}
                                            </span>
                                        )}

                                    </div>

                                    <p className="job-description">
                                        {job.description}
                                    </p>

                                    <div className="saved-job-actions">

                                        <button
                                            className={`apply-job-button ${hasApplied(job.jobId) ? "already-applied" : ""
                                                }`}
                                            onClick={() =>
                                                handleApply({
                                                    id: job.jobId,
                                                    approvalStatus: job.approvalStatus,
                                                    title: job.jobTitle,
                                                    company: job.company,
                                                    location: job.location,
                                                    jobType: job.jobType,
                                                    salary: job.salary,
                                                    experience: job.experience,
                                                    description: job.description
                                                })
                                            }
                                            disabled={hasApplied(job.jobId)}
                                        >
                                            {hasApplied(job.jobId)
                                                ? "✓ Already Applied"
                                                : "Apply Now"}
                                        </button>

                                        <button
                                            className="remove-saved-button"
                                            onClick={() =>
                                                handleRemoveSavedJob(job.id)
                                            }
                                        >
                                            Remove
                                        </button>

                                    </div>

                                </div>
                            ))}

                        </div>
                    )}

                </div>
            )}

            {/* User Profile */}
            {activeSection === "profile" && showUserProfile && (
                <div className="user-profile-section">

                    <div className="user-profile-header">

                        <div>
                            <h2>
                                👤 User Profile
                            </h2>

                            <p>
                                Update your personal and professional information.
                            </p>
                        </div>

                        <button
                            className="profile-close-button"
                            onClick={closeUserProfile}
                        >
                            ✕
                        </button>

                    </div>

                    <form
                        className="user-profile-form"
                        onSubmit={handleSaveUserProfile}
                    >

                        <div className="profile-form-row">

                            <div className="profile-form-group">

                                <label>
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    name="fullName"
                                    value={userProfile.fullName}
                                    onChange={handleProfileChange}
                                    placeholder="Enter your full name"
                                    required
                                />

                            </div>

                            <div className="profile-form-group">

                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={userProfile.email}
                                    onChange={handleProfileChange}
                                    placeholder="Enter your email"
                                    required
                                />

                            </div>

                        </div>

                        <div className="profile-form-row">

                            <div className="profile-form-group">

                                <label>
                                    Phone
                                </label>

                                <input
                                    type="tel"
                                    name="phone"
                                    value={userProfile.phone}
                                    onChange={handleProfileChange}
                                    placeholder="Enter your phone number"
                                />

                            </div>

                            <div className="profile-form-group">

                                <label>
                                    Location
                                </label>

                                <input
                                    type="text"
                                    name="location"
                                    value={userProfile.location}
                                    onChange={handleProfileChange}
                                    placeholder="Enter your location"
                                />

                            </div>

                        </div>

                        <div className="profile-form-row">

                            <div className="profile-form-group">

                                <label>
                                    Skills
                                </label>

                                <input
                                    type="text"
                                    name="skills"
                                    value={userProfile.skills}
                                    onChange={handleProfileChange}
                                    placeholder="e.g. React, Python, SQL"
                                />

                            </div>

                            <div className="profile-form-group">

                                <label>
                                    Education
                                </label>

                                <input
                                    type="text"
                                    name="education"
                                    value={userProfile.education}
                                    onChange={handleProfileChange}
                                    placeholder="Enter your education"
                                />

                            </div>

                        </div>

                        <div className="profile-form-group">

                            <label>
                                Experience
                            </label>

                            <input
                                type="text"
                                name="experience"
                                value={userProfile.experience}
                                onChange={handleProfileChange}
                                placeholder="e.g. Fresher / 2 Years"
                            />

                        </div>

                        <div className="profile-form-group">

                            <label>
                                About Me
                            </label>

                            <textarea
                                name="bio"
                                value={userProfile.bio}
                                onChange={handleProfileChange}
                                placeholder="Tell recruiters about yourself..."
                                rows="5"
                            />

                        </div>

                        <div className="profile-form-actions">

                            <button
                                type="submit"
                                className="save-profile-button"
                            >
                                Save Profile
                            </button>

                            <button
                                type="button"
                                className="cancel-profile-button"
                                onClick={closeUserProfile}
                            >
                                Cancel
                            </button>

                        </div>

                        {profileMessage && (
                            <p className="profile-success-message">
                                ✅ {profileMessage}
                            </p>
                        )}

                    </form>

                </div>
            )}


            {pendingJob && (
                <div
                    className="modal-overlay"
                    onClick={() => {
                        if (!isSubmittingApplication) {
                            setPendingJob(null);
                            setSelectedResume(null);
                        }
                    }}
                >
                    <div
                        className="modal-container"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="resume-application-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h2 id="resume-application-title">
                            Apply for {pendingJob.title}
                        </h2>

                        <p>{pendingJob.company}</p>

                        <form onSubmit={handleSubmitApplication}>
                            <div className="profile-form-group">
                                <label htmlFor="applicationResume">
                                    Upload your resume (PDF, DOC, or DOCX; max 10 MB)
                                </label>

                                <input
                                    id="applicationResume"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    required
                                    disabled={isSubmittingApplication}
                                    onChange={(event) =>
                                        setSelectedResume(
                                            event.target.files?.[0] || null
                                        )
                                    }
                                />
                            </div>

                            <div className="profile-form-actions">
                                <button
                                    type="submit"
                                    className="apply-job-button"
                                    disabled={
                                        isSubmittingApplication || !selectedResume
                                    }
                                >
                                    {isSubmittingApplication
                                        ? "Submitting..."
                                        : "Submit Application"}
                                </button>

                                <button
                                    type="button"
                                    className="cancel-profile-button"
                                    disabled={isSubmittingApplication}
                                    onClick={() => {
                                        setPendingJob(null);
                                        setSelectedResume(null);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


        </section>
    );
}

export default UserDashboard;
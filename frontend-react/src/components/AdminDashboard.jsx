
import React, { useState, useEffect, useCallback } from "react";
import { adminAPI } from "../api";
import "./AdminDashboard.css";

function AdminDashboard({
    user,
    onLogout,
    jobs = [],
    setJobs,
    applications = [],
    users = [],
    setUsers
}) {
    const [activeSection, setActiveSection] = useState("dashboard");

    // Backend user management.
    const [adminUsers, setAdminUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [userError, setUserError] = useState("");
    const [userMessage, setUserMessage] = useState("");
    const [busyUserId, setBusyUserId] = useState(null);

    // Backend recruiter management.
    const [recruiters, setRecruiters] = useState([]);
    const [loadingRecruiters, setLoadingRecruiters] = useState(true);
    const [recruiterError, setRecruiterError] = useState("");
    const [recruiterMessage, setRecruiterMessage] = useState("");
    const [busyRecruiterId, setBusyRecruiterId] = useState(null);

    // Backend job management.
    const [adminJobs, setAdminJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [jobError, setJobError] = useState("");
    const [jobMessage, setJobMessage] = useState("");
    const [busyJobId, setBusyJobId] = useState(null);

    // Shared confirmation dialog.
    const [pendingConfirmation, setPendingConfirmation] = useState(null);

    // Load job seekers from FastAPI.
    const loadUsers = useCallback(async () => {
        setLoadingUsers(true);
        setUserError("");

        try {
            const data = await adminAPI.getUsers();
            setAdminUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            setUserError(error.message || "Unable to load users.");
        } finally {
            setLoadingUsers(false);
        }
    }, []);

    // Load recruiters from FastAPI.
    const loadRecruiters = useCallback(async () => {
        setLoadingRecruiters(true);
        setRecruiterError("");

        try {
            const data = await adminAPI.getRecruiters();
            setRecruiters(Array.isArray(data) ? data : []);
        } catch (error) {
            setRecruiterError(error.message || "Unable to load recruiters.");
        } finally {
            setLoadingRecruiters(false);
        }
    }, []);

    // Load jobs from FastAPI.
    const loadJobs = useCallback(async () => {
        setLoadingJobs(true);
        setJobError("");

        try {
            const data = await adminAPI.getJobs();
            setAdminJobs(Array.isArray(data) ? data : []);
        } catch (error) {
            setJobError(error.message || "Unable to load jobs.");
        } finally {
            setLoadingJobs(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
        loadRecruiters();
        loadJobs();
    }, [loadUsers, loadRecruiters, loadJobs]);

    // Dashboard statistics.
    const totalUsers = adminUsers.filter(
        (item) => item.role === "user"
    ).length;

    const totalRecruiters = recruiters.length;
    const totalJobs = adminJobs.length;
    const totalApplications = applications.length;

    const pendingApprovals = adminJobs.filter(
        (job) =>
            (job.approval_status || "Pending").toLowerCase() === "pending"
    ).length;

    // User status confirmation.
    const handleUserStatusChange = (userId, action) => {
        const selectedUser = adminUsers.find(
            (item) => item.id === userId
        );

        if (!selectedUser || busyUserId !== null) return;

        setPendingConfirmation({
            type: "user-status",
            userId,
            action,
            title: action === "activate" ? "Activate User?" : "Deactivate User?",
            message: `Are you sure you want to ${
                action === "activate" ? "activate" : "deactivate"
            } ${selectedUser.name || selectedUser.email}?`,
            confirmLabel: action === "activate" ? "Activate User" : "Deactivate User",
            danger: action === "deactivate"
        });
    };

    // User deletion confirmation.
    const handleDeleteUser = (userId) => {
        const selectedUser = adminUsers.find(
            (item) => item.id === userId
        );

        if (!selectedUser || busyUserId !== null) return;

        setPendingConfirmation({
            type: "delete-user",
            userId,
            title: "Delete User?",
            message: `Are you sure you want to permanently delete ${
                selectedUser.name || selectedUser.email
            }? This action cannot be undone.`,
            confirmLabel: "Delete User",
            danger: true
        });
    };

    // Recruiter approval/rejection confirmation.
    const handleRecruiterDecision = (recruiterId, decision) => {
        const recruiter = recruiters.find(
            (item) => item.id === recruiterId
        );

        if (!recruiter || busyRecruiterId !== null) return;

        setPendingConfirmation({
            type: "recruiter-decision",
            recruiterId,
            decision,
            title: decision === "approve" ? "Approve Recruiter?" : "Reject Recruiter?",
            message: `Are you sure you want to ${
                decision === "approve" ? "approve" : "reject"
            } ${recruiter.name || recruiter.email}?`,
            confirmLabel: decision === "approve" ? "Approve" : "Reject",
            danger: decision === "reject"
        });
    };

    // NEW: Recruiter account activation/deactivation confirmation.
    const handleRecruiterStatusChange = (recruiterId, action) => {
        const recruiter = recruiters.find(
            (item) => item.id === recruiterId
        );

        if (!recruiter || busyRecruiterId !== null) return;

        setPendingConfirmation({
            type: "recruiter-status",
            recruiterId,
            action,
            title: action === "activate"
                ? "Activate Recruiter?"
                : "Deactivate Recruiter?",
            message: `Are you sure you want to ${
                action === "activate" ? "activate" : "deactivate"
            } the account for ${recruiter.name || recruiter.email}?`,
            confirmLabel: action === "activate"
                ? "Activate Recruiter"
                : "Deactivate Recruiter",
            danger: action === "deactivate"
        });
    };

    // Recruiter deletion confirmation.
    const handleDeleteRecruiter = (recruiterId) => {
        const recruiter = recruiters.find(
            (item) => item.id === recruiterId
        );

        if (!recruiter || busyRecruiterId !== null) return;

        setPendingConfirmation({
            type: "delete-recruiter",
            recruiterId,
            title: "Delete Recruiter?",
            message: `Are you sure you want to permanently delete ${
                recruiter.name || recruiter.email
            } and their recruiter account?`,
            confirmLabel: "Delete Recruiter",
            danger: true
        });
    };

    // Job approval/rejection confirmation.
    const handleJobDecision = (jobId, decision) => {
        const job = adminJobs.find((item) => item.id === jobId);

        if (!job || busyJobId !== null) return;

        setPendingConfirmation({
            type: "job-decision",
            jobId,
            decision,
            title: decision === "approve" ? "Approve Job?" : "Reject Job?",
            message: `Are you sure you want to ${
                decision === "approve" ? "approve" : "reject"
            } "${job.title}" at ${job.company || "this company"}?`,
            confirmLabel: decision === "approve" ? "Approve Job" : "Reject Job",
            danger: decision === "reject"
        });
    };

    // Job activation/deactivation confirmation.
    const handleJobStatusChange = (jobId, action) => {
        const job = adminJobs.find((item) => item.id === jobId);

        if (!job || busyJobId !== null) return;

        setPendingConfirmation({
            type: "job-status",
            jobId,
            action,
            title: action === "activate" ? "Activate Job?" : "Deactivate Job?",
            message: `Are you sure you want to ${
                action === "activate" ? "activate" : "deactivate"
            } "${job.title}"?`,
            confirmLabel: action === "activate" ? "Activate Job" : "Deactivate Job",
            danger: action === "deactivate"
        });
    };

    // Job deletion confirmation.
    const handleDeleteJob = (jobId) => {
        const job = adminJobs.find((item) => item.id === jobId);

        if (!job || busyJobId !== null) return;

        setPendingConfirmation({
            type: "delete-job",
            jobId,
            title: "Delete Job?",
            message: `Are you sure you want to permanently delete "${job.title}"?`,
            confirmLabel: "Delete Job",
            danger: true
        });
    };

    // Execute the action selected in the confirmation dialog.
    const confirmPendingAction = async () => {
        if (!pendingConfirmation) return;

        const confirmation = pendingConfirmation;

        setUserError("");
        setUserMessage("");
        setRecruiterError("");
        setRecruiterMessage("");
        setJobError("");
        setJobMessage("");

        // User actions.
        if (
            confirmation.type === "user-status" ||
            confirmation.type === "delete-user"
        ) {
            const userId = confirmation.userId;
            setBusyUserId(userId);

            try {
                let result;

                if (confirmation.type === "user-status") {
                    result = confirmation.action === "activate"
                        ? await adminAPI.activateUser(userId)
                        : await adminAPI.deactivateUser(userId);

                    setUserMessage(
                        result?.message ||
                        `User ${confirmation.action === "activate" ? "activated" : "deactivated"} successfully.`
                    );
                } else {
                    result = await adminAPI.deleteUser(userId);
                    setUserMessage(result?.message || "User deleted successfully.");
                }

                setPendingConfirmation(null);
                await loadUsers();
            } catch (error) {
                setUserError(error.message || "Unable to complete the user action.");
            } finally {
                setBusyUserId(null);
            }

            return;
        }

        // Recruiter actions: approval, account status, or deletion.
        if (
            confirmation.type === "recruiter-decision" ||
            confirmation.type === "recruiter-status" ||
            confirmation.type === "delete-recruiter"
        ) {
            const recruiterId = confirmation.recruiterId;
            setBusyRecruiterId(recruiterId);

            try {
                let result;

                if (confirmation.type === "recruiter-decision") {
                    result = confirmation.decision === "approve"
                        ? await adminAPI.approveRecruiter(recruiterId)
                        : await adminAPI.rejectRecruiter(recruiterId);

                    setRecruiterMessage(
                        result?.message ||
                        `Recruiter ${confirmation.decision === "approve" ? "approved" : "rejected"} successfully.`
                    );
                } else if (confirmation.type === "recruiter-status") {
                    result = confirmation.action === "activate"
                        ? await adminAPI.activateRecruiter(recruiterId)
                        : await adminAPI.deactivateRecruiter(recruiterId);

                    setRecruiterMessage(
                        result?.message ||
                        `Recruiter ${confirmation.action === "activate" ? "activated" : "deactivated"} successfully.`
                    );
                } else {
                    result = await adminAPI.deleteRecruiter(recruiterId);
                    setRecruiterMessage(
                        result?.message || "Recruiter deleted successfully."
                    );
                }

                setPendingConfirmation(null);
                await loadRecruiters();
            } catch (error) {
                setRecruiterError(
                    error.message || "Unable to complete the recruiter action."
                );
            } finally {
                setBusyRecruiterId(null);
            }

            return;
        }

        // Job actions.
        const jobId = confirmation.jobId;
        setBusyJobId(jobId);

        try {
            let result;

            if (confirmation.type === "job-decision") {
                result = confirmation.decision === "approve"
                    ? await adminAPI.approveJob(jobId)
                    : await adminAPI.rejectJob(jobId);

                setJobMessage(
                    result?.message ||
                    `Job ${confirmation.decision === "approve" ? "approved" : "rejected"} successfully.`
                );
            } else if (confirmation.type === "job-status") {
                result = confirmation.action === "activate"
                    ? await adminAPI.activateJob(jobId)
                    : await adminAPI.deactivateJob(jobId);

                setJobMessage(
                    result?.message ||
                    `Job ${confirmation.action === "activate" ? "activated" : "deactivated"} successfully.`
                );
            } else if (confirmation.type === "delete-job") {
                result = await adminAPI.deleteJob(jobId);
                setJobMessage(result?.message || "Job deleted successfully.");
            }

            setPendingConfirmation(null);
            await loadJobs();
        } catch (error) {
            setJobError(error.message || "Unable to complete the job action.");
        } finally {
            setBusyJobId(null);
        }
    };

    const renderUserMessages = () => (
        <>
            {userError && (
                <p className="admin-error-message" role="alert">
                    Error: {userError}
                </p>
            )}
            {userMessage && (
                <p className="admin-success-message" role="status">
                    {userMessage}
                </p>
            )}
        </>
    );

    const renderRecruiterMessages = () => (
        <>
            {recruiterError && (
                <p className="admin-error-message" role="alert">
                    Error: {recruiterError}
                </p>
            )}
            {recruiterMessage && (
                <p className="admin-success-message" role="status">
                    {recruiterMessage}
                </p>
            )}
        </>
    );

    const renderJobMessages = () => (
        <>
            {jobError && (
                <p className="admin-error-message" role="alert">
                    Error: {jobError}
                </p>
            )}
            {jobMessage && (
                <p className="admin-success-message" role="status">
                    {jobMessage}
                </p>
            )}
        </>
    );

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div>
                    <h1>SmartHire Admin</h1>
                    <p>Manage your recruitment platform</p>
                </div>

                <div className="admin-header-actions">
                    <span>Welcome, {user?.email || "Admin"}</span>
                    <button
                        type="button"
                        className="admin-logout-button"
                        onClick={onLogout}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="admin-content">
                <section className="admin-welcome">
                    <h2>Admin Dashboard</h2>
                    <p>
                        Monitor users, recruiters, jobs,
                        and applications from one place.
                    </p>
                </section>

                <section className="admin-stats">
                    <div className="admin-stat-card">
                        <span className="admin-stat-icon">👤</span>
                        <p>Total Users</p>
                        <h3>{totalUsers}</h3>
                    </div>

                    <div className="admin-stat-card">
                        <span className="admin-stat-icon">🏢</span>
                        <p>Total Recruiters</p>
                        <h3>{totalRecruiters}</h3>
                    </div>

                    <div className="admin-stat-card">
                        <span className="admin-stat-icon">💼</span>
                        <p>Total Jobs</p>
                        <h3>{totalJobs}</h3>
                    </div>

                    <div className="admin-stat-card">
                        <span className="admin-stat-icon">📄</span>
                        <p>Total Applications</p>
                        <h3>{totalApplications}</h3>
                    </div>
                </section>

                <section className="admin-management-section">
                    <h2>Platform Management</h2>

                    <div className="admin-management-grid">
                        {[
                            {
                                section: "users",
                                icon: "👥",
                                title: "Manage Users",
                                description: "View and manage job seeker accounts."
                            },
                            {
                                section: "recruiters",
                                icon: "🏢",
                                title: "Manage Recruiters",
                                description: "Review recruiter accounts."
                            },
                            {
                                section: "jobs",
                                icon: "💼",
                                title: "Manage Jobs",
                                description: "Review and manage database jobs."
                            },
                            {
                                section: "approvals",
                                icon: "✅",
                                title: "Approvals",
                                description: "Review pending jobs for approval."
                            }
                        ].map((item) => (
                            <div
                                className="admin-management-card"
                                key={item.section}
                                role="button"
                                tabIndex={0}
                                onClick={() => setActiveSection(item.section)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        setActiveSection(item.section);
                                    }
                                }}
                            >
                                <span>{item.icon}</span>
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                                {item.section === "approvals" && (
                                    <p className="pending-approval-count">
                                        Pending Approvals: {pendingApprovals}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* MANAGE USERS */}
                {activeSection === "users" && (
                    <section className="admin-management-section">
                        <h2>Manage Users</h2>

                        <button
                            type="button"
                            className="admin-back-button"
                            onClick={() => setActiveSection("dashboard")}
                        >
                            ← Back to Dashboard
                        </button>

                        <button
                            type="button"
                            className="admin-back-button"
                            onClick={loadUsers}
                            disabled={loadingUsers}
                        >
                            {loadingUsers ? "Refreshing..." : "Refresh Users"}
                        </button>

                        {renderUserMessages()}

                        {loadingUsers ? (
                            <p>Loading users from the database...</p>
                        ) : userError ? null : adminUsers.filter(
                            (item) => item.role === "user"
                        ).length === 0 ? (
                            <p>No registered users found.</p>
                        ) : (
                            <div className="admin-management-grid">
                                {adminUsers
                                    .filter((item) => item.role === "user")
                                    .map((item) => {
                                        const isActive =
                                            (item.status || "").toLowerCase() === "active";
                                        const isBusy = busyUserId === item.id;

                                        return (
                                            <div
                                                className="admin-management-card"
                                                key={item.id}
                                            >
                                                <h3>{item.name || "Unnamed User"}</h3>
                                                <p><strong>ID:</strong> {item.id}</p>
                                                <p><strong>Email:</strong> {item.email}</p>
                                                <p><strong>Role:</strong> Job Seeker</p>
                                                <p>
                                                    <strong>Account Status:</strong>{" "}
                                                    <span
                                                        className={`status-badge ${
                                                            isActive ? "selected" : "rejected"
                                                        }`}
                                                    >
                                                        {item.status || "Unknown"}
                                                    </span>
                                                </p>

                                                <button
                                                    type="button"
                                                    className={
                                                        isActive
                                                            ? "admin-reject-button"
                                                            : "admin-approve-button"
                                                    }
                                                    disabled={isBusy}
                                                    onClick={() =>
                                                        handleUserStatusChange(
                                                            item.id,
                                                            isActive ? "deactivate" : "activate"
                                                        )
                                                    }
                                                >
                                                    {isBusy
                                                        ? "Processing..."
                                                        : isActive
                                                            ? "Deactivate User"
                                                            : "Activate User"}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="admin-delete-button"
                                                    disabled={isBusy}
                                                    onClick={() => handleDeleteUser(item.id)}
                                                >
                                                    Delete User
                                                </button>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </section>
                )}

                {/* MANAGE RECRUITERS */}
                {activeSection === "recruiters" && (
                    <section className="admin-management-section">
                        <h2>Manage Recruiters</h2>

                        <button
                            type="button"
                            className="admin-back-button"
                            onClick={() => setActiveSection("dashboard")}
                        >
                            ← Back to Dashboard
                        </button>

                        <button
                            type="button"
                            className="admin-back-button"
                            onClick={loadRecruiters}
                            disabled={loadingRecruiters}
                        >
                            {loadingRecruiters ? "Refreshing..." : "Refresh Recruiters"}
                        </button>

                        {renderRecruiterMessages()}

                        {loadingRecruiters ? (
                            <p>Loading recruiters...</p>
                        ) : recruiterError ? null : recruiters.length === 0 ? (
                            <p>No registered recruiters found.</p>
                        ) : (
                            <div className="admin-management-grid">
                                {recruiters.map((recruiter) => {
                                    const approvalStatus =
                                        recruiter.approval_status || "Pending";
                                    const isActive =
                                        (recruiter.status || "").toLowerCase() === "active";
                                    const isBusy =
                                        busyRecruiterId === recruiter.id;

                                    return (
                                        <div
                                            className="admin-management-card"
                                            key={recruiter.id}
                                        >
                                            <h3>{recruiter.name || "Unnamed Recruiter"}</h3>
                                            <p>
                                                <strong>Email:</strong> {recruiter.email}
                                            </p>
                                            <p>
                                                <strong>Company:</strong>{" "}
                                                {recruiter.company || "Not provided"}
                                            </p>
                                            <p>
                                                <strong>Account Status:</strong>{" "}
                                                <span
                                                    className={`status-badge ${
                                                        isActive ? "selected" : "rejected"
                                                    }`}
                                                >
                                                    {recruiter.status || "Unknown"}
                                                </span>
                                            </p>
                                            <p>
                                                <strong>Approval Status:</strong>{" "}
                                                <span
                                                    className={`status-badge ${
                                                        approvalStatus === "Approved"
                                                            ? "selected"
                                                            : approvalStatus === "Rejected"
                                                                ? "rejected"
                                                                : "applied"
                                                    }`}
                                                >
                                                    {approvalStatus}
                                                </span>
                                            </p>

                                            <button
                                                type="button"
                                                className={
                                                    isActive
                                                        ? "admin-reject-button"
                                                        : "admin-approve-button"
                                                }
                                                disabled={isBusy}
                                                onClick={() =>
                                                    handleRecruiterStatusChange(
                                                        recruiter.id,
                                                        isActive ? "deactivate" : "activate"
                                                    )
                                                }
                                            >
                                                {isBusy
                                                    ? "Processing..."
                                                    : isActive
                                                        ? "Deactivate Recruiter"
                                                        : "Activate Recruiter"}
                                            </button>

                                            {approvalStatus !== "Approved" && (
                                                <button
                                                    type="button"
                                                    className="admin-approve-button"
                                                    disabled={isBusy}
                                                    onClick={() =>
                                                        handleRecruiterDecision(
                                                            recruiter.id,
                                                            "approve"
                                                        )
                                                    }
                                                >
                                                    {isBusy ? "Processing..." : "Approve Recruiter"}
                                                </button>
                                            )}

                                            {approvalStatus !== "Rejected" && (
                                                <button
                                                    type="button"
                                                    className="admin-reject-button"
                                                    disabled={isBusy}
                                                    onClick={() =>
                                                        handleRecruiterDecision(
                                                            recruiter.id,
                                                            "reject"
                                                        )
                                                    }
                                                >
                                                    {isBusy ? "Processing..." : "Reject Recruiter"}
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                className="admin-delete-button"
                                                disabled={isBusy}
                                                onClick={() =>
                                                    handleDeleteRecruiter(recruiter.id)
                                                }
                                            >
                                                Delete Recruiter
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* MANAGE JOBS */}
                {activeSection === "jobs" && (
                    <section className="admin-management-section">
                        <h2>Manage Jobs</h2>

                        <button
                            type="button"
                            className="admin-back-button"
                            onClick={() => setActiveSection("dashboard")}
                        >
                            ← Back to Dashboard
                        </button>

                        <button
                            type="button"
                            className="admin-back-button"
                            onClick={loadJobs}
                            disabled={loadingJobs}
                        >
                            {loadingJobs ? "Refreshing..." : "Refresh Jobs"}
                        </button>

                        {renderJobMessages()}

                        {loadingJobs ? (
                            <p>Loading jobs from the database...</p>
                        ) : jobError ? null : adminJobs.length === 0 ? (
                            <p>No jobs have been posted yet.</p>
                        ) : (
                            <div className="admin-management-grid">
                                {adminJobs.map((job) => {
                                    const approvalStatus =
                                        job.approval_status || "Pending";
                                    const jobStatus = job.status || "Unknown";
                                    const isBusy = busyJobId === job.id;
                                    const isApproved =
                                        approvalStatus.toLowerCase() === "approved";
                                    const isRejected =
                                        approvalStatus.toLowerCase() === "rejected";
                                    const isActive =
                                        jobStatus.toLowerCase() === "active";

                                    return (
                                        <div
                                            className="admin-management-card"
                                            key={job.id}
                                        >
                                            <h3>{job.title}</h3>
                                            <p><strong>Company:</strong> {job.company || "Not provided"}</p>
                                            <p><strong>Location:</strong> {job.location || "Not provided"}</p>
                                            <p><strong>Job Type:</strong> {job.job_type || "Not specified"}</p>
                                            <p><strong>Salary:</strong> {job.salary || "Not specified"}</p>
                                            <p><strong>Recruiter ID:</strong> {job.recruiter_id ?? "Not available"}</p>
                                            <p>
                                                <strong>Approval Status:</strong>{" "}
                                                <span
                                                    className={`status-badge ${
                                                        isApproved
                                                            ? "selected"
                                                            : isRejected
                                                                ? "rejected"
                                                                : "applied"
                                                    }`}
                                                >
                                                    {approvalStatus}
                                                </span>
                                            </p>
                                            <p><strong>Job Status:</strong> {jobStatus}</p>
                                            <p>
                                                <strong>Description:</strong>{" "}
                                                {job.description || "No description provided."}
                                            </p>
                                            <p><strong>Skills:</strong> {job.skills || "Not specified"}</p>

                                            {!isApproved && (
                                                <button
                                                    type="button"
                                                    className="admin-approve-button"
                                                    disabled={isBusy}
                                                    onClick={() => handleJobDecision(job.id, "approve")}
                                                >
                                                    {isBusy ? "Processing..." : "Approve Job"}
                                                </button>
                                            )}

                                            {!isRejected && (
                                                <button
                                                    type="button"
                                                    className="admin-reject-button"
                                                    disabled={isBusy}
                                                    onClick={() => handleJobDecision(job.id, "reject")}
                                                >
                                                    {isBusy ? "Processing..." : "Reject Job"}
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                className={
                                                    isActive
                                                        ? "admin-reject-button"
                                                        : "admin-approve-button"
                                                }
                                                disabled={isBusy}
                                                onClick={() =>
                                                    handleJobStatusChange(
                                                        job.id,
                                                        isActive ? "deactivate" : "activate"
                                                    )
                                                }
                                            >
                                                {isBusy
                                                    ? "Processing..."
                                                    : isActive
                                                        ? "Deactivate Job"
                                                        : "Activate Job"}
                                            </button>

                                            <button
                                                type="button"
                                                className="admin-delete-button"
                                                disabled={isBusy}
                                                onClick={() => handleDeleteJob(job.id)}
                                            >
                                                Delete Job
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* JOB APPROVALS */}
                {activeSection === "approvals" && (
                    <section className="admin-management-section">
                        <h2>Pending Job Approvals</h2>

                        <button
                            type="button"
                            className="admin-back-button"
                            onClick={() => setActiveSection("dashboard")}
                        >
                            ← Back to Dashboard
                        </button>

                        <button
                            type="button"
                            className="admin-back-button"
                            onClick={loadJobs}
                            disabled={loadingJobs}
                        >
                            {loadingJobs ? "Refreshing..." : "Refresh Jobs"}
                        </button>

                        {renderJobMessages()}

                        {loadingJobs ? (
                            <p>Loading pending approvals...</p>
                        ) : jobError ? null : adminJobs.filter(
                            (job) =>
                                (job.approval_status || "Pending").toLowerCase() === "pending"
                        ).length === 0 ? (
                            <p>No jobs are currently waiting for approval.</p>
                        ) : (
                            <div className="admin-management-grid">
                                {adminJobs
                                    .filter(
                                        (job) =>
                                            (job.approval_status || "Pending").toLowerCase() ===
                                            "pending"
                                    )
                                    .map((job) => (
                                        <div
                                            className="admin-management-card"
                                            key={job.id}
                                        >
                                            <h3>{job.title}</h3>
                                            <p><strong>Company:</strong> {job.company || "Not provided"}</p>
                                            <p><strong>Location:</strong> {job.location || "Not provided"}</p>
                                            <p><strong>Job Type:</strong> {job.job_type || "Not specified"}</p>
                                            <p>Approval Status: Pending</p>

                                            <div className="admin-approval-actions">
                                                <button
                                                    type="button"
                                                    className="admin-approve-button"
                                                    disabled={busyJobId === job.id}
                                                    onClick={() => handleJobDecision(job.id, "approve")}
                                                >
                                                    Approve
                                                </button>

                                                <button
                                                    type="button"
                                                    className="admin-reject-button"
                                                    disabled={busyJobId === job.id}
                                                    onClick={() => handleJobDecision(job.id, "reject")}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </section>
                )}
            </main>

            {/* SHARED CONFIRMATION DIALOG */}
            {pendingConfirmation && (
                <div
                    className="admin-confirm-overlay"
                    onClick={() => {
                        if (
                            busyUserId === null &&
                            busyRecruiterId === null &&
                            busyJobId === null
                        ) {
                            setPendingConfirmation(null);
                        }
                    }}
                >
                    <section
                        className="admin-confirm-dialog"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="admin-confirm-title"
                        aria-describedby="admin-confirm-message"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="admin-confirm-icon">
                            {pendingConfirmation.danger ? "!" : "✓"}
                        </div>

                        <h2 id="admin-confirm-title">
                            {pendingConfirmation.title}
                        </h2>

                        <p id="admin-confirm-message">
                            {pendingConfirmation.message}
                        </p>

                        <div className="admin-confirm-actions">
                            <button
                                type="button"
                                className="admin-confirm-cancel"
                                disabled={
                                    busyUserId !== null ||
                                    busyRecruiterId !== null ||
                                    busyJobId !== null
                                }
                                onClick={() => setPendingConfirmation(null)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className={
                                    pendingConfirmation.danger
                                        ? "admin-confirm-danger"
                                        : "admin-confirm-primary"
                                }
                                disabled={
                                    busyUserId !== null ||
                                    busyRecruiterId !== null ||
                                    busyJobId !== null
                                }
                                onClick={confirmPendingAction}
                            >
                                {busyUserId !== null ||
                                busyRecruiterId !== null ||
                                busyJobId !== null
                                    ? "Processing..."
                                    : pendingConfirmation.confirmLabel}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;


import React, { useEffect, useState } from "react";
import "./App.css";

import {
    authAPI,
    jobsAPI,
    applicationsAPI,
    getAccessToken,
    saveAccessToken,
    clearAccessToken,
} from "./api";

import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Jobs from "./components/Jobs";
import Categories from "./components/Categories";
import Companies from "./components/Companies";
import Applications from "./components/Applications";
import Alerts from "./components/Alerts";
import CareerTools from "./components/CareerTools";
import SmartMatching from "./components/SmartMatching";
import Notifications from "./components/Notifications";
import WhySmartHire from "./components/WhySmartHire";
import Footer from "./components/Footer";
import UserDashboard from "./components/UserDashboard";
import RecruiterDashboard from "./components/RecruiterDashboard";
import AdminDashboard from "./components/AdminDashboard";

function App() {
    // =========================
    // MODAL STATES
    // =========================

    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [showRecruiterSignup, setShowRecruiterSignup] = useState(false);

    // =========================
    // LOGGED-IN USER STATE
    // =========================

    const [loggedInUser, setLoggedInUser] = useState(() => {
        const token = getAccessToken();
        const savedUser = localStorage.getItem("smartHireLoggedInUser");

        if (!token || !savedUser) {
            return null;
        }

        try {
            return JSON.parse(savedUser);
        } catch (error) {
            console.error("Error loading logged-in user:", error);
            return null;
        }
    });

    // =========================
    // REGISTERED USERS STATE
    // Retained for existing AdminDashboard compatibility.
    // =========================

    const [users, setUsers] = useState(() => {
        const savedUsers = localStorage.getItem("smartHireUsers");

        if (savedUsers) {
            try {
                return JSON.parse(savedUsers);
            } catch (error) {
                console.error("Error loading registered users:", error);
            }
        }

        return [];
    });

    // =========================
    // JOB STATE
    // Initially restore cached jobs, then refresh from FastAPI.
    // =========================

    const [jobs, setJobs] = useState(() => {
        const savedJobs = localStorage.getItem("smartHireJobs");

        if (savedJobs) {
            try {
                return JSON.parse(savedJobs);
            } catch (error) {
                console.error("Error loading jobs:", error);
            }
        }

        return [];
    });

    // =========================
    // PUBLIC JOB SEARCH FILTERS
    // =========================

    const [jobSearchFilters, setJobSearchFilters] = useState({
        query: "",
        location: "",
        experience: "",
    });

    const handlePublicJobSearch = (filters) => {
        setJobSearchFilters(filters);
    };

    // =========================
    // APPLICATION STATE
    // =========================

    const [applications, setApplications] = useState(() => {
        const savedApplications = localStorage.getItem(
            "smartHireApplications"
        );

        if (savedApplications) {
            try {
                return JSON.parse(savedApplications);
            } catch (error) {
                console.error("Error loading applications:", error);
            }
        }

        return [];
    });

    // =========================
    // SAVED JOBS STATE
    // =========================

    const [savedJobs, setSavedJobs] = useState(() => {
        const savedJobsData = localStorage.getItem(
            "smartHireSavedJobs"
        );

        if (savedJobsData) {
            try {
                return JSON.parse(savedJobsData);
            } catch (error) {
                console.error("Error loading saved jobs:", error);
            }
        }

        return [];
    });

    // =========================
    // FORM MESSAGE STATES
    // =========================

    const [loginMessage, setLoginMessage] = useState("");
    const [signupMessage, setSignupMessage] = useState("");
    const [recruiterMessage, setRecruiterMessage] = useState("");
    const [applicationMessage, setApplicationMessage] = useState("");

    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [isRecruiterSigningUp, setIsRecruiterSigningUp] = useState(false);

    // =========================
    // RESTORE BACKEND SESSION
    // Verify the saved JWT using FastAPI.
    // =========================

    useEffect(() => {
        let isMounted = true;

        const restoreSession = async () => {
            const token = getAccessToken();

            if (!token) {
                localStorage.removeItem("smartHireLoggedInUser");

                if (isMounted) {
                    setLoggedInUser(null);
                }

                return;
            }

            try {
                const currentUser = await authAPI.me();

                if (!isMounted) {
                    return;
                }

                const userData = {
                    ...currentUser,
                    fullName: currentUser.name,
                };

                setLoggedInUser(userData);

                localStorage.setItem(
                    "smartHireLoggedInUser",
                    JSON.stringify(userData)
                );
            } catch (error) {
                console.error("Unable to restore session:", error);

                clearAccessToken();
                localStorage.removeItem("smartHireLoggedInUser");

                if (isMounted) {
                    setLoggedInUser(null);
                }
            }
        };

        restoreSession();

        return () => {
            isMounted = false;
        };
    }, []);

    // =========================
    // LOAD JOBS FROM FASTAPI
    // The backend is the source of truth for available jobs.
    // Existing applicant information is retained when IDs match.
    // =========================

    useEffect(() => {
        let isMounted = true;

        const loadJobsFromBackend = async () => {
            try {
                const response = await jobsAPI.getAll();

                if (!Array.isArray(response)) {
                    throw new Error(
                        "The jobs API did not return a list of jobs."
                    );
                }

                if (!isMounted) {
                    return;
                }

                setJobs((previousJobs) => {
                    const existingJobsById = new Map(
                        previousJobs.map((job) => [
                            String(job.id),
                            job,
                        ])
                    );

                    return response.map((job) => {
                        const existingJob = existingJobsById.get(
                            String(job.id)
                        );

                        const jobType =
                            job.job_type ??
                            job.jobType ??
                            "Not specified";

                        const approvalStatus =
                            job.approval_status ??
                            job.approvalStatus ??
                            "Pending";

                        return {
                            ...existingJob,
                            ...job,

                            // Keep IDs consistent with the backend.
                            id: job.id,

                            title: job.title || "Untitled Job",
                            company:
                                job.company || "Company not specified",
                            location:
                                job.location || "Location not specified",
                            salary:
                                job.salary || "Salary not specified",
                            description: job.description || "",

                            // Support both backend and React field names.
                            jobType,
                            job_type: jobType,
                            workMode:
                                job.workMode || jobType,

                            approvalStatus,
                            approval_status: approvalStatus,

                            recruiterId:
                                job.recruiter_id ??
                                job.recruiterId ??
                                existingJob?.recruiterId,

                            // Preserve existing UI applicant information.
                            applicants:
                                existingJob?.applicants || [],
                        };
                    });
                });

                console.log(
                    `SmartHire loaded ${response.length} jobs from FastAPI.`
                );
            } catch (error) {
                console.error(
                    "Unable to load jobs from FastAPI:",
                    error
                );

                // Do not clear cached jobs if the request fails.
                // The existing jobs state remains available as a fallback.
            }
        };

        loadJobsFromBackend();

        return () => {
            isMounted = false;
        };
    }, []);

    // =========================
    // SAVE APPLICATIONS
    // =========================

    useEffect(() => {
        localStorage.setItem(
            "smartHireApplications",
            JSON.stringify(applications)
        );
    }, [applications]);

    // =========================
    // SAVE REGISTERED USERS
    // =========================

    useEffect(() => {
        localStorage.setItem(
            "smartHireUsers",
            JSON.stringify(users)
        );
    }, [users]);

    // =========================
    // SAVE SAVED JOBS
    // =========================

    useEffect(() => {
        localStorage.setItem(
            "smartHireSavedJobs",
            JSON.stringify(savedJobs)
        );
    }, [savedJobs]);

    // =========================
    // SAVE JOBS
    // =========================

    useEffect(() => {
        localStorage.setItem(
            "smartHireJobs",
            JSON.stringify(jobs)
        );
    }, [jobs]);

    // =========================
    // OPEN LOGIN
    // =========================

    const openLogin = () => {
        setShowSignup(false);
        setShowRecruiterSignup(false);

        setSignupMessage("");
        setRecruiterMessage("");
        setLoginMessage("");

        setShowLogin(true);
    };

    // =========================
    // OPEN USER SIGNUP
    // =========================

    const openSignup = () => {
        setShowLogin(false);
        setShowRecruiterSignup(false);

        setLoginMessage("");
        setRecruiterMessage("");
        setSignupMessage("");

        setShowSignup(true);
    };

    // =========================
    // OPEN RECRUITER SIGNUP
    // =========================

    const openRecruiterSignup = () => {
        setShowLogin(false);
        setShowSignup(false);

        setLoginMessage("");
        setSignupMessage("");
        setRecruiterMessage("");

        setShowRecruiterSignup(true);
    };

    // =========================
    // CLOSE ALL MODALS
    // =========================

    const closeModals = () => {
        setShowLogin(false);
        setShowSignup(false);
        setShowRecruiterSignup(false);

        setLoginMessage("");
        setSignupMessage("");
        setRecruiterMessage("");
    };

    // =========================
    // LOGIN SUBMIT
    // FastAPI: POST /auth/login
    // =========================

    const handleLogin = async (event) => {
        event.preventDefault();

        setLoginMessage("");

        const formData = new FormData(event.currentTarget);

        const email = formData.get("email")?.trim();
        const password = formData.get("password");
        const selectedRole = formData.get("role");

        if (!email || !password || !selectedRole) {
            setLoginMessage(
                "Please enter your email, password and account type."
            );
            return;
        }

        setIsLoggingIn(true);

        try {
            const loginResponse = await authAPI.login({
                email,
                password,
            });

            if (!loginResponse?.access_token) {
                throw new Error(
                    "The backend did not return an access token."
                );
            }

            saveAccessToken(loginResponse.access_token);

            let currentUser;

            try {
                currentUser = await authAPI.me();
            } catch (error) {
                clearAccessToken();
                throw error;
            }

            if (currentUser.role !== selectedRole) {
                clearAccessToken();

                localStorage.removeItem("smartHireLoggedInUser");

                setLoginMessage(
                    "The selected account type does not match your registered account."
                );

                return;
            }

            const userData = {
                ...currentUser,
                fullName: currentUser.name,
            };

            setLoggedInUser(userData);

            localStorage.setItem(
                "smartHireLoggedInUser",
                JSON.stringify(userData)
            );

            console.log("Login successful:", {
                email: userData.email,
                role: userData.role,
            });

            closeModals();
        } catch (error) {
            console.error("Login failed:", error);

            setLoginMessage(
                error.message ||
                "Login failed. Please check your credentials and try again."
            );
        } finally {
            setIsLoggingIn(false);
        }
    };

    // =========================
    // USER SIGNUP SUBMIT
    // FastAPI: POST /auth/signup
    // =========================

    const handleSignup = async (event) => {
        event.preventDefault();

        setSignupMessage("");

        const formData = new FormData(event.currentTarget);

        const fullName = formData.get("fullName")?.trim();
        const email = formData.get("email")?.trim();
        const password = formData.get("password");
        const confirmPassword = formData.get("confirmPassword");

        if (!fullName || !email || !password || !confirmPassword) {
            setSignupMessage("Please fill in all fields.");
            return;
        }

        if (fullName.length < 2) {
            setSignupMessage(
                "Full name must contain at least 2 characters."
            );
            return;
        }

        if (password.length < 6) {
            setSignupMessage(
                "Password must contain at least 6 characters."
            );
            return;
        }

        if (password !== confirmPassword) {
            setSignupMessage("Passwords do not match.");
            return;
        }

        setIsSigningUp(true);

        try {
            const createdUser = await authAPI.signup({
                name: fullName,
                email,
                password,
            });

            console.log("User signup successful:", {
                id: createdUser.id,
                name: createdUser.name,
                email: createdUser.email,
                role: createdUser.role,
            });

            setSignupMessage(
                "User account created successfully! Please log in."
            );
        } catch (error) {
            console.error("User signup failed:", error);

            setSignupMessage(
                error.message ||
                "Unable to create your account. Please try again."
            );
        } finally {
            setIsSigningUp(false);
        }
    };

    // =========================
    // RECRUITER SIGNUP SUBMIT
    // FastAPI: POST /auth/recruiter-signup
    // =========================

    const handleRecruiterSignup = async (event) => {
        event.preventDefault();

        setRecruiterMessage("");

        const formData = new FormData(event.currentTarget);

        const fullName = formData.get("fullName")?.trim();
        const email = formData.get("email")?.trim();
        const company = formData.get("company")?.trim();
        const password = formData.get("password");
        const confirmPassword = formData.get("confirmPassword");

        if (
            !fullName ||
            !email ||
            !company ||
            !password ||
            !confirmPassword
        ) {
            setRecruiterMessage("Please fill in all fields.");
            return;
        }

        if (fullName.length < 2) {
            setRecruiterMessage(
                "Full name must contain at least 2 characters."
            );
            return;
        }

        if (company.length < 2) {
            setRecruiterMessage(
                "Company name must contain at least 2 characters."
            );
            return;
        }

        if (password.length < 6) {
            setRecruiterMessage(
                "Password must contain at least 6 characters."
            );
            return;
        }

        if (password !== confirmPassword) {
            setRecruiterMessage("Passwords do not match.");
            return;
        }

        setIsRecruiterSigningUp(true);

        try {
            const createdRecruiter = await authAPI.recruiterSignup({
                name: fullName,
                email,
                company,
                password,
            });

            console.log("Recruiter signup successful:", {
                id: createdRecruiter.id,
                name: createdRecruiter.name,
                email: createdRecruiter.email,
                role: createdRecruiter.role,
            });

            setRecruiterMessage(
                "Recruiter account created successfully! Please log in. Your recruiter profile will need admin approval before you can post jobs."
            );
        } catch (error) {
            console.error("Recruiter signup failed:", error);

            setRecruiterMessage(
                error.message ||
                "Unable to create your recruiter account. Please try again."
            );
        } finally {
            setIsRecruiterSigningUp(false);
        }
    };

    // =========================
    // LOGOUT
    // =========================

    const handleLogout = () => {
        console.log("User logged out.");

        setLoggedInUser(null);

        clearAccessToken();

        localStorage.removeItem("smartHireLoggedInUser");

        closeModals();
    };

    // =========================
    // APPLY FOR JOB
    // FastAPI: POST /applications/
    // =========================

    const handleApplyJob = async (job, resumeFile) => {
        if (!loggedInUser) {
            alert("Please login to apply for a job.");
            return false;
        }

        if (!Number.isInteger(Number(job.id)) || Number(job.id) <= 0) {
            alert("This job has an invalid ID. Please refresh the jobs list.");
            return false;
        }

        if (!resumeFile) {
            setApplicationMessage("Please select your resume before applying.");
            return false;
        }

        try {
            const myApplications =
                await applicationsAPI.getMyApplications();

            const alreadyApplied = myApplications.some(
                (application) =>
                    Number(application.job_id ?? application.jobId) ===
                    Number(job.id)
            );

            if (alreadyApplied) {
                alert("You have already applied to this job.");
                return false;
            }

            // Upload the actual resume to the FastAPI backend
            const response = await applicationsAPI.uploadResume(
                Number(job.id),
                resumeFile
            );

            const applicationId = response?.id ?? Date.now();

            const appliedAt = response?.applied_at
                ? new Date(response.applied_at).toLocaleDateString()
                : new Date().toLocaleDateString();

            const newApplication = {
                ...response,
                id: applicationId,
                jobId: Number(response?.job_id ?? job.id),
                jobTitle: job.title,
                company: job.company,
                location: job.location,
                jobType: job.jobType ?? job.job_type,
                salary: job.salary,
                userEmail: loggedInUser.email,
                userName:
                    loggedInUser.fullName ||
                    loggedInUser.name ||
                    loggedInUser.email,
                status: response?.status || "Applied",
                appliedAt,
            };

            setApplications((previousApplications) => [
                ...previousApplications.filter(
                    (application) =>
                        !(
                            Number(application.jobId ?? application.job_id) ===
                            Number(job.id) &&
                            application.userEmail === loggedInUser.email
                        )
                ),
                newApplication,
            ]);

            setJobs((previousJobs) =>
                previousJobs.map((currentJob) => {
                    if (Number(currentJob.id) !== Number(job.id)) {
                        return currentJob;
                    }

                    const applicant = {
                        applicationId,
                        userEmail: loggedInUser.email,
                        userName:
                            loggedInUser.fullName ||
                            loggedInUser.name ||
                            loggedInUser.email,
                        status: newApplication.status,
                        appliedAt,
                    };

                    const existingApplicants = currentJob.applicants || [];

                    return {
                        ...currentJob,
                        applicants: [
                            ...existingApplicants.filter(
                                (item) =>
                                    item.userEmail !== loggedInUser.email
                            ),
                            applicant,
                        ],
                    };
                })
            );

            setApplicationMessage(
                `Your application for ${job.title} was submitted successfully!`
            );

            return true;
        } catch (error) {
            console.error("Application submission failed:", error);

            setApplicationMessage(
                error.message ||
                "Unable to submit your application. Please try again."
            );

            return false;
        }
    };

    // =========================
    // SAVE JOB
    // =========================

    const handleSaveJob = (job) => {
        if (!loggedInUser) {
            alert("Please login to save a job.");
            return;
        }

        const alreadySaved = savedJobs.some(
            (savedJob) =>
                savedJob.jobId === job.id &&
                savedJob.userEmail === loggedInUser.email
        );

        if (alreadySaved) {
            alert("You have already saved this job.");
            return;
        }

        const savedJob = {
            id: Date.now(),
            jobId: job.id,
            jobTitle: job.title,
            company: job.company,
            location: job.location,
            jobType: job.jobType,
            salary: job.salary,
            experience: job.experience || "",
            description: job.description || "",
            userEmail: loggedInUser.email,
        };

        setSavedJobs((previousSavedJobs) => [
            ...previousSavedJobs,
            savedJob,
        ]);

        alert(`"${job.title}" has been saved successfully!`);
    };

    // =========================
    // REMOVE SAVED JOB
    // =========================

    const handleRemoveSavedJob = (savedJobId) => {
        setSavedJobs((previousSavedJobs) =>
            previousSavedJobs.filter(
                (savedJob) => savedJob.id !== savedJobId
            )
        );
    };

    // =========================
    // UPDATE APPLICATION STATUS
    // Existing local-state behavior retained.
    // =========================

    const handleUpdateApplicationStatus = (
        applicationId,
        newStatus
    ) => {
        setApplications((previousApplications) =>
            previousApplications.map((application) =>
                application.id === applicationId
                    ? {
                        ...application,
                        status: newStatus,
                    }
                    : application
            )
        );

        setJobs((previousJobs) =>
            previousJobs.map((job) => {
                const hasApplicant = job.applicants?.some(
                    (applicant) =>
                        applicant.applicationId === applicationId
                );

                if (!hasApplicant) {
                    return job;
                }

                return {
                    ...job,
                    applicants: job.applicants.map((applicant) =>
                        applicant.applicationId === applicationId
                            ? {
                                ...applicant,
                                status: newStatus,
                            }
                            : applicant
                    ),
                };
            })
        );
    };

    // =========================
    // RETURN
    // =========================

    return (
        <>
            <Navbar
                onLoginClick={openLogin}
                onSignupClick={openSignup}
                loggedInUser={loggedInUser}
                onLogout={handleLogout}
            />

            {/* LOGGED-IN USER DASHBOARD */}

            {loggedInUser?.role === "user" && (
                <>
                    {applicationMessage && (
                        <div
                            role="status"
                            aria-live="polite"
                            style={{
                                maxWidth: "900px",
                                margin: "16px auto",
                                padding: "14px 18px",
                                borderRadius: "8px",
                                backgroundColor: applicationMessage.startsWith(
                                    "Unable to submit"
                                )
                                    ? "#fdecec"
                                    : "#e8f7ed",
                                color: applicationMessage.startsWith(
                                    "Unable to submit"
                                )
                                    ? "#b42318"
                                    : "#187443",
                                border: `1px solid ${applicationMessage.startsWith(
                                    "Unable to submit"
                                )
                                        ? "#f5b7b1"
                                        : "#a8dfb8"
                                    }`,
                            }}
                        >
                            {applicationMessage}

                            <button
                                type="button"
                                onClick={() => setApplicationMessage("")}
                                aria-label="Dismiss application message"
                                style={{
                                    float: "right",
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    fontSize: "18px",
                                    color: "inherit",
                                }}
                            >
                                ×
                            </button>
                        </div>
                    )}

                    <UserDashboard
                        user={loggedInUser}
                        jobs={jobs}
                        applications={applications.filter(
                            (application) =>
                                application.userEmail === loggedInUser?.email
                        )}
                        savedJobs={savedJobs.filter(
                            (savedJob) =>
                                savedJob.userEmail === loggedInUser?.email
                        )}
                        onApplyJob={handleApplyJob}
                        onSaveJob={handleSaveJob}
                        onRemoveSavedJob={handleRemoveSavedJob}
                    />
                </>
            )}

            {/* LOGGED-IN RECRUITER DASHBOARD */}

            {loggedInUser?.role === "recruiter" && (
                <RecruiterDashboard
                    user={loggedInUser}
                    onLogout={handleLogout}
                    jobs={jobs}
                    setJobs={setJobs}
                    onUpdateApplicationStatus={
                        handleUpdateApplicationStatus
                    }
                />
            )}

            {/* LOGGED-IN ADMIN DASHBOARD */}

            {loggedInUser?.role === "admin" && (
                <AdminDashboard
                    user={loggedInUser}
                    onLogout={handleLogout}
                    jobs={jobs}
                    setJobs={setJobs}
                    applications={applications}
                    users={users}
                    setUsers={setUsers}
                />
            )}

            {/* PUBLIC SMART HIRE WEBSITE */}

            {!loggedInUser && (
                <>
                    <Home onSearch={handlePublicJobSearch} />
                    <Jobs
                        searchFilters={jobSearchFilters}
                        onLoginClick={openLogin}
                        loggedInUser={loggedInUser}
                        onApplyJob={handleApplyJob}
                        onSaveJob={handleSaveJob}
                        savedJobs={savedJobs}
                    />
                    <Categories />
                    <Companies />
                    <Applications />
                    <Alerts />
                    <CareerTools />
                    <SmartMatching />
                    <Notifications />
                    <WhySmartHire />
                    <Footer />
                </>
            )}

            {/* LOGIN MODAL */}

            {showLogin && (
                <div
                    className="modal-overlay"
                    onClick={closeModals}
                >
                    <div
                        className="modal-container"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            className="modal-close-button"
                            type="button"
                            onClick={closeModals}
                            aria-label="Close login modal"
                        >
                            ✕
                        </button>

                        <h2>Welcome Back</h2>
                        <p>Login to your SmartHire account</p>

                        <form onSubmit={handleLogin}>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder="Email"
                                required
                            />

                            <input
                                type="password"
                                name="password"
                                className="form-input"
                                placeholder="Password"
                                required
                            />

                            <select
                                name="role"
                                className="form-input"
                                defaultValue=""
                                required
                            >
                                <option value="" disabled>
                                    Select Account Type
                                </option>
                                <option value="user">
                                    User / Job Seeker
                                </option>
                                <option value="recruiter">
                                    Recruiter
                                </option>
                                <option value="admin">
                                    Admin
                                </option>
                            </select>

                            <button
                                type="submit"
                                className="primary-button"
                                disabled={isLoggingIn}
                            >
                                {isLoggingIn ? "Logging in..." : "Login"}
                            </button>
                        </form>

                        {loginMessage && (
                            <p className="form-message" role="alert">
                                {loginMessage}
                            </p>
                        )}

                        <button
                            type="button"
                            className="modal-switch-button"
                            onClick={openSignup}
                        >
                            Don't have an account? Sign Up
                        </button>
                    </div>
                </div>
            )}

            {/* USER SIGNUP MODAL */}

            {showSignup && (
                <div
                    className="modal-overlay"
                    onClick={closeModals}
                >
                    <div
                        className="modal-container"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            className="modal-close-button"
                            type="button"
                            onClick={closeModals}
                            aria-label="Close signup modal"
                        >
                            ✕
                        </button>

                        <h2>Create Your Account</h2>
                        <p>Join SmartHire today</p>

                        <form onSubmit={handleSignup}>
                            <input
                                type="text"
                                name="fullName"
                                className="form-input"
                                placeholder="Full Name"
                                minLength={2}
                                maxLength={100}
                                required
                            />

                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder="Email"
                                required
                            />

                            <input
                                type="password"
                                name="password"
                                className="form-input"
                                placeholder="Password"
                                minLength={6}
                                maxLength={100}
                                required
                            />

                            <input
                                type="password"
                                name="confirmPassword"
                                className="form-input"
                                placeholder="Confirm Password"
                                minLength={6}
                                maxLength={100}
                                required
                            />

                            <button
                                type="submit"
                                className="primary-button"
                                disabled={isSigningUp}
                            >
                                {isSigningUp ? "Creating account..." : "Sign Up"}
                            </button>
                        </form>

                        {signupMessage && (
                            <p className="form-message" role="alert">
                                {signupMessage}
                            </p>
                        )}

                        <button
                            type="button"
                            className="modal-switch-button"
                            onClick={openLogin}
                        >
                            Already have an account? Login
                        </button>

                        <button
                            type="button"
                            className="modal-switch-button"
                            onClick={openRecruiterSignup}
                        >
                            Are you a recruiter? Create a recruiter account
                        </button>
                    </div>
                </div>
            )}

            {/* RECRUITER SIGNUP MODAL */}

            {showRecruiterSignup && (
                <div
                    className="modal-overlay"
                    onClick={closeModals}
                >
                    <div
                        className="modal-container"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            className="modal-close-button"
                            type="button"
                            onClick={closeModals}
                            aria-label="Close recruiter signup modal"
                        >
                            ✕
                        </button>

                        <h2>Recruiter Account</h2>
                        <p>Create your recruiter account</p>

                        <form onSubmit={handleRecruiterSignup}>
                            <input
                                type="text"
                                name="fullName"
                                className="form-input"
                                placeholder="Full Name"
                                minLength={2}
                                maxLength={100}
                                required
                            />

                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder="Email"
                                required
                            />

                            <input
                                type="text"
                                name="company"
                                className="form-input"
                                placeholder="Company Name"
                                minLength={2}
                                maxLength={150}
                                required
                            />

                            <input
                                type="password"
                                name="password"
                                className="form-input"
                                placeholder="Password"
                                minLength={6}
                                maxLength={100}
                                required
                            />

                            <input
                                type="password"
                                name="confirmPassword"
                                className="form-input"
                                placeholder="Confirm Password"
                                minLength={6}
                                maxLength={100}
                                required
                            />

                            <button
                                type="submit"
                                className="primary-button"
                                disabled={isRecruiterSigningUp}
                            >
                                {isRecruiterSigningUp
                                    ? "Creating account..."
                                    : "Create Recruiter Account"}
                            </button>
                        </form>

                        {recruiterMessage && (
                            <p className="form-message" role="alert">
                                {recruiterMessage}
                            </p>
                        )}

                        <button
                            type="button"
                            className="modal-switch-button"
                            onClick={openLogin}
                        >
                            Already have an account? Login
                        </button>

                        <button
                            type="button"
                            className="modal-switch-button"
                            onClick={openSignup}
                        >
                            Back to User Sign Up
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default App;

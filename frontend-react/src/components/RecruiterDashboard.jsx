
import { useEffect, useState } from "react";
import { jobsAPI, applicationsAPI } from "../api";
import "./RecruiterDashboard.css";

function getApplicantDisplayName(applicant) {
    const candidates = [
        applicant?.userName,
        applicant?.user_name,
        applicant?.full_name,
        applicant?.fullName,
        applicant?.applicant_name,
        applicant?.userName,
        applicant?.applicant?.name,
        applicant?.user?.name,
        applicant?.user?.full_name
    ];

    const validName = candidates.find(
        (name) =>
            typeof name === "string" &&
            name.trim() !== "" &&
            ![
                "unknown applicant",
                "unknown applicant name"
            ].includes(name.trim().toLowerCase())
    );

    return validName ? validName.trim() : "Unknown Applicant";
}

function RecruiterDashboard({
    user,
    onLogout,
    jobs,
    setJobs,
    onUpdateApplicationStatus
}) {
    const [showPostJob, setShowPostJob] = useState(false);
    const [jobMessage, setJobMessage] = useState("");
    const [profileMessage, setProfileMessage] = useState("");
    const [editingJob, setEditingJob] = useState(null);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [showRecruiterProfile, setShowRecruiterProfile] = useState(false);
    const [isPostingJob, setIsPostingJob] = useState(false);
    const [isSavingJob, setIsSavingJob] = useState(false);
    const [isDeletingJobId, setIsDeletingJobId] = useState(null);
    const [jobToDelete, setJobToDelete] = useState(null);

    const recruiterProfileStorageKey =
        `smartHireRecruiterProfile_${user?.email?.toLowerCase() || "recruiter"}`;

    const [recruiterProfile, setRecruiterProfile] = useState(() => {
        const savedProfile = localStorage.getItem(
            `smartHireRecruiterProfile_${user?.email?.toLowerCase() || "recruiter"}`
        );

        if (savedProfile) {
            try {
                return JSON.parse(savedProfile);
            } catch (error) {
                console.error("Error loading recruiter profile:", error);
            }
        }

        return {
            fullName: "",
            email: user?.email || "",
            company: "",
            phone: "",
            location: "",
            bio: ""
        };
    });

    // NORMALIZE APPLICATION DATA
    const normalizeApplication = (application) => {
        const app = application?.application || application || {};
        const applicant = app.applicant || {};
        const userDetails = app.user || app.user_details || {};

        const nameCandidates = [
            app.user_name,
            app.full_name,
            app.fullName,
            app.applicant_name,
            app.userName,
            applicant.full_name,
            applicant.fullName,
            applicant.name,
            userDetails.full_name,
            userDetails.fullName,
            userDetails.name,
            app.name
        ];

        const applicantName = nameCandidates.find(
            (name) =>
                typeof name === "string" &&
                name.trim() !== "" &&
                name.trim().toLowerCase() !== "unknown applicant" &&
                name.trim().toLowerCase() !== "unknown applicant name"
        );

        return {
            ...app,
            applicationId: app.id ?? app.application_id,
            userName: applicantName
                ? applicantName.trim()
                : "Unknown Applicant",
            userEmail:
                app.user_email ||
                app.userEmail ||
                app.email ||
                applicant.email ||
                userDetails.email ||
                "",
            appliedAt: app.applied_at || app.appliedAt || "",
            status: app.status || "Applied",
            resume: app.resume || "Not provided",
            phone:
                app.phone ||
                applicant.phone ||
                userDetails.phone ||
                "",
            location:
                app.location ||
                applicant.location ||
                userDetails.location ||
                "",
            education: app.education || userDetails.education || "",
            experience: app.experience || userDetails.experience || "",
            skills: app.skills || userDetails.skills || "",
            bio: app.bio || userDetails.bio || ""
        };
    };

    // LOAD THIS RECRUITER'S JOBS AND THEIR APPLICATIONS
    useEffect(() => {
        let isMounted = true;

        async function loadRecruiterJobs() {
            if (!user?.email) {
                console.error("Recruiter email is missing.");
                return;
            }

            const currentEmail = user.email.trim().toLowerCase();

            try {
                const response = await jobsAPI.getMyJobs();

                console.log("Recruiter jobs response:", response);

                const recruiterJobsFromAPI = Array.isArray(response)
                    ? response
                    : Array.isArray(response?.jobs)
                        ? response.jobs
                        : Array.isArray(response?.data)
                            ? response.data
                            : Array.isArray(response?.items)
                                ? response.items
                                : [];

                console.log(
                    "Recruiter jobs to process:",
                    recruiterJobsFromAPI.length
                );

                const normalizedJobs = await Promise.all(
                    recruiterJobsFromAPI.map(async (job) => {
                        let applicants = [];

                        try {
                            console.log(
                                `Fetching applications for job ${job.id}`
                            );

                            const applicationResponse =
    await applicationsAPI.getJobDetails(job.id);

                            console.log(
                                `Applications response for job ${job.id}:`,
                                applicationResponse
                            );

                            const applicationList = Array.isArray(
                                applicationResponse
                            )
                                ? applicationResponse
                                : Array.isArray(
                                    applicationResponse?.applications
                                )
                                    ? applicationResponse.applications
                                    : Array.isArray(applicationResponse?.data)
                                        ? applicationResponse.data
                                        : Array.isArray(applicationResponse?.items)
                                            ? applicationResponse.items
                                            : [];

                            applicants = applicationList.map(
                                normalizeApplication
                            );
                        } catch (error) {
                            console.error(
                                `Failed to load applications for job ${job.id}:`,
                                error
                            );
                        }

                        const skills = Array.isArray(job.skills)
                            ? job.skills
                            : typeof job.skills === "string"
                                ? job.skills
                                    .split(/[,|]/)
                                    .map((skill) => skill.trim())
                                    .filter(Boolean)
                                : [];

                        return {
                            ...job,
                            id: job.id,
                            jobType: job.job_type ?? job.jobType ?? "",
                            salary: job.salary || "",
                            skills,
                            recruiterEmail: currentEmail,
                            approvalStatus:
                                job.approval_status ?? job.approvalStatus,
                            recruiterId:
                                job.recruiter_id ?? job.recruiterId,
                            experience:
                                job.experience || "Not specified",
                            applicants
                        };
                    })
                );

                if (!isMounted) return;

                setJobs((previousJobs) => {
                    const existingJobs = Array.isArray(previousJobs)
                        ? previousJobs
                        : [];

                    const otherJobs = existingJobs.filter(
                        (job) =>
                            (job.recruiterEmail || "")
                                .trim()
                                .toLowerCase() !== currentEmail
                    );

                    return [...otherJobs, ...normalizedJobs];
                });
            } catch (error) {
                console.error("Unable to load recruiter jobs:", error);

                if (isMounted) {
                    setJobMessage(
                        error.message || "Unable to load your jobs."
                    );
                }
            }
        }

        loadRecruiterJobs();

        return () => {
            isMounted = false;
        };
    }, [user?.email, setJobs]);

    // JOBS VISIBLE TO THIS RECRUITER ONLY
    const recruiterJobs = (Array.isArray(jobs) ? jobs : []).filter(
        (job) =>
            (job.recruiterEmail || "").trim().toLowerCase() ===
            (user?.email || "").trim().toLowerCase()
    );

    const selectedJob = recruiterJobs.find(
        (job) => String(job.id) === String(selectedJobId)
    );

    // POST JOB
    const handlePostJob = async (event) => {
        event.preventDefault();
        setJobMessage("");

        const form = event.currentTarget;
        const formData = new FormData(form);

        const jobData = {
            title: formData.get("title"),
            company: formData.get("company"),
            location: formData.get("location"),
            job_type: formData.get("jobType"),
            salary: formData.get("salary") || null,
            experience: formData.get("experience") || null,
            description: formData.get("description"),
            skills: null
        };

        try {
            setIsPostingJob(true);

            const createdJob = await jobsAPI.create(jobData);

            const normalizedJob = {
                ...createdJob,
                id: createdJob.id,
                jobType: createdJob.job_type ?? createdJob.jobType ?? "",
                salary: createdJob.salary || "",
                recruiterEmail: user?.email || "",
                approvalStatus: createdJob.approval_status,
                recruiterId: createdJob.recruiter_id,
                experience: createdJob.experience || "Not specified",
                skills: [],
                applicants: []
            };

            setJobs((previousJobs) => [
                ...(Array.isArray(previousJobs) ? previousJobs : []).filter(
                    (job) => String(job.id) !== String(normalizedJob.id)
                ),
                normalizedJob
            ]);

            setJobMessage(
                "Job submitted successfully. It will appear publicly after admin approval."
            );

            form.reset();
        } catch (error) {
            setJobMessage(error.message || "Unable to post the job.");
        } finally {
            setIsPostingJob(false);
        }
    };

    // EDIT JOB
    const handleEditJob = async (event) => {
        event.preventDefault();
        setJobMessage("");

        if (
            !editingJob ||
            (editingJob.recruiterEmail || "").trim().toLowerCase() !==
            (user?.email || "").trim().toLowerCase()
        ) {
            setJobMessage("You are not authorized to edit this job.");
            return;
        }

        const formData = new FormData(event.currentTarget);

        const jobData = {
            title: formData.get("title")?.toString().trim(),
            company: formData.get("company")?.toString().trim(),
            location: formData.get("location")?.toString().trim(),
            job_type: formData.get("jobType"),
            salary: formData.get("salary")?.toString().trim() || null,
            experience:
                formData.get("experience")?.toString().trim() || null,
            description: formData.get("description")?.toString().trim(),
            skills: Array.isArray(editingJob.skills)
                ? editingJob.skills.join(", ")
                : editingJob.skills || null
        };

        try {
            setIsSavingJob(true);

            const updatedResponse = await jobsAPI.update(
                editingJob.id,
                jobData
            );

            const updatedSkills = Array.isArray(updatedResponse.skills)
                ? updatedResponse.skills
                : typeof updatedResponse.skills === "string"
                    ? updatedResponse.skills
                        .split(/[,|]/)
                        .map((skill) => skill.trim())
                        .filter(Boolean)
                    : [];

            const updatedJob = {
                ...editingJob,
                ...updatedResponse,
                id: updatedResponse.id ?? editingJob.id,
                jobType:
                    updatedResponse.job_type ??
                    updatedResponse.jobType ??
                    editingJob.jobType,
                salary: updatedResponse.salary || "",
                description:
                    updatedResponse.description ?? editingJob.description,
                skills: updatedSkills,
                recruiterEmail: user.email,
                recruiterId:
                    updatedResponse.recruiter_id ?? editingJob.recruiterId,
                approvalStatus:
                    updatedResponse.approval_status ??
                    updatedResponse.approvalStatus,
                applicants: editingJob.applicants || []
            };

            setJobs((previousJobs) =>
                previousJobs.map((job) =>
                    String(job.id) === String(updatedJob.id)
                        ? updatedJob
                        : job
                )
            );

            setEditingJob(null);

            setJobMessage(
                "Job updated successfully. It is now pending admin approval."
            );

            setTimeout(() => {
                document
                    .getElementById("manageJobs")
                    ?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        } catch (error) {
            setJobMessage(
                error.message || "Unable to update the job. Please try again."
            );
        } finally {
            setIsSavingJob(false);
        }
    };

    // DELETE JOB
    const handleDeleteJob = async (jobId) => {
        const jobToRemove = recruiterJobs.find(
            (job) => String(job.id) === String(jobId)
        );

        if (
            !jobToRemove ||
            (jobToRemove.recruiterEmail || "").trim().toLowerCase() !==
            (user?.email || "").trim().toLowerCase()
        ) {
            setJobMessage("You are not authorized to delete this job.");
            return;
        }

        setJobMessage("");

        try {
            setIsDeletingJobId(jobId);

            await jobsAPI.delete(jobId);

            setJobs((previousJobs) =>
                previousJobs.filter(
                    (job) => String(job.id) !== String(jobId)
                )
            );

            if (String(selectedJobId) === String(jobId)) {
                setSelectedJobId(null);
            }

            if (editingJob && String(editingJob.id) === String(jobId)) {
                setEditingJob(null);
            }

            setJobMessage("Job deleted successfully.");
            setJobToDelete(null);
        } catch (error) {
            setJobMessage(
                error.message || "Unable to delete the job. Please try again."
            );
        } finally {
            setIsDeletingJobId(null);
        }
    };

    // DASHBOARD STATISTICS
    const totalApplicants = recruiterJobs.reduce(
        (total, job) => total + (job.applicants?.length || 0),
        0
    );

    const totalHired = recruiterJobs.reduce(
        (total, job) =>
            total +
            (job.applicants || []).filter(
                (applicant) => applicant.status === "Hired"
            ).length,
        0
    );

    // OPEN POST JOB
    const openPostJob = () => {
        setShowPostJob(true);
        setEditingJob(null);
        setShowRecruiterProfile(false);
        setJobMessage("");

        setTimeout(() => {
            document
                .getElementById("postJobSection")
                ?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    // CLOSE POST JOB
    const closePostJob = () => {
        setShowPostJob(false);
        setJobMessage("");
    };

    // OPEN EDIT JOB
    const openEditJob = (job) => {
        setEditingJob(job);
        setShowPostJob(false);
        setShowRecruiterProfile(false);
        setJobMessage("");

        setTimeout(() => {
            document
                .getElementById("editJobSection")
                ?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    // VIEW APPLICANTS
    const openApplicants = (jobId) => {
        const job = recruiterJobs.find(
            (currentJob) => String(currentJob.id) === String(jobId)
        );

        if (!job) {
            setJobMessage(
                "You are not authorized to view these applicants."
            );
            return;
        }

        setSelectedJobId(job.id);
        setShowRecruiterProfile(false);

        setTimeout(() => {
            document
                .getElementById("applicantsSection")
                ?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    // VIEW ALL APPLICANTS
    const viewAllApplicants = () => {
        if (recruiterJobs.length === 0) {
            alert("You have not posted any jobs yet.");
            return;
        }

        setShowRecruiterProfile(false);
        setSelectedJobId(recruiterJobs[0].id);

        setTimeout(() => {
            document
                .getElementById("applicantsSection")
                ?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    // OPEN RECRUITER PROFILE
    const openRecruiterProfile = () => {
        setShowRecruiterProfile(true);
        setShowPostJob(false);
        setEditingJob(null);
        setProfileMessage("");

        setTimeout(() => {
            document
                .getElementById("recruiterProfileSection")
                ?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    // CLOSE RECRUITER PROFILE
    const closeRecruiterProfile = () => {
        setShowRecruiterProfile(false);
        setProfileMessage("");
    };

    // SAVE RECRUITER PROFILE
    const handleSaveRecruiterProfile = (event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        const updatedProfile = {
            fullName: formData.get("fullName"),
            email: formData.get("email"),
            company: formData.get("company"),
            phone: formData.get("phone"),
            location: formData.get("location"),
            bio: formData.get("bio")
        };

        setRecruiterProfile(updatedProfile);

        localStorage.setItem(
            recruiterProfileStorageKey,
            JSON.stringify(updatedProfile)
        );

        setProfileMessage("Recruiter profile updated successfully!");
    };

    return (
        <section
            className="recruiter-dashboard"
            id="recruiterDashboard"
        >
            <div className="recruiter-dashboard-container">
                {/* DASHBOARD HEADER */}
                <div className="recruiter-dashboard-header">
                    <div>
                        <p className="recruiter-dashboard-label">
                            RECRUITER DASHBOARD
                        </p>

                        <h1>Welcome, Recruiter 👋</h1>

                        <p className="recruiter-dashboard-subtitle">
                            Manage your jobs, applicants, and
                            recruitment activities from one place.
                        </p>
                    </div>

                    <button
                        className="recruiter-logout-button"
                        type="button"
                        onClick={onLogout}
                    >
                        Logout
                    </button>
                </div>

                {/* RECRUITER PROFILE CARD */}
                <div className="recruiter-profile-card">
                    <div className="recruiter-avatar">🏢</div>

                    <div className="recruiter-profile-info">
                        <h2>
                            {recruiterProfile.fullName || "Recruiter Account"}
                        </h2>

                        <p>
                            {recruiterProfile.email || user?.email || "Recruiter"}
                        </p>

                        {recruiterProfile.company && (
                            <p>🏢 {recruiterProfile.company}</p>
                        )}

                        <span className="recruiter-role-badge">
                            Recruiter
                        </span>
                    </div>
                </div>

                {/* STATISTICS */}
                <div className="recruiter-statistics">
                    <div className="recruiter-stat-card">
                        <span className="recruiter-stat-icon">💼</span>
                        <div>
                            <h3>{recruiterJobs.length}</h3>
                            <p>Active Jobs</p>
                        </div>
                    </div>

                    <div className="recruiter-stat-card">
                        <span className="recruiter-stat-icon">👥</span>
                        <div>
                            <h3>{totalApplicants}</h3>
                            <p>Total Applicants</p>
                        </div>
                    </div>

                    <div className="recruiter-stat-card">
                        <span className="recruiter-stat-icon">📋</span>
                        <div>
                            <h3>{totalApplicants}</h3>
                            <p>Applications</p>
                        </div>
                    </div>

                    <div className="recruiter-stat-card">
                        <span className="recruiter-stat-icon">✅</span>
                        <div>
                            <h3>{totalHired}</h3>
                            <p>Hired</p>
                        </div>
                    </div>
                </div>

                {/* RECRUITER ACTIONS */}
                <div className="recruiter-section">
                    <div className="recruiter-section-header">
                        <div>
                            <h2>Recruiter Actions</h2>
                            <p>Manage your recruitment activities.</p>
                        </div>
                    </div>

                    <div className="recruiter-action-grid">
                        <button
                            className="recruiter-action-card"
                            type="button"
                            onClick={openPostJob}
                        >
                            <span>📢</span>
                            <div>
                                <h3>Post a Job</h3>
                                <p>Create and publish a new job opportunity.</p>
                            </div>
                        </button>

                        <button
                            className="recruiter-action-card"
                            type="button"
                            onClick={() => {
                                setShowRecruiterProfile(false);
                                document
                                    .getElementById("manageJobs")
                                    ?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            <span>💼</span>
                            <div>
                                <h3>Manage Jobs</h3>
                                <p>View, edit, and delete your posted jobs.</p>
                            </div>
                        </button>

                        <button
                            className="recruiter-action-card"
                            type="button"
                            onClick={viewAllApplicants}
                        >
                            <span>👥</span>
                            <div>
                                <h3>View Applicants</h3>
                                <p>Review applicants for your job postings.</p>
                            </div>
                        </button>

                        <button
                            className="recruiter-action-card"
                            type="button"
                            onClick={openRecruiterProfile}
                        >
                            <span>👤</span>
                            <div>
                                <h3>Recruiter Profile</h3>
                                <p>Update your recruiter information.</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* POST JOB FORM */}
                {showPostJob && (
                    <div className="post-job-section" id="postJobSection">
                        <div className="post-job-header">
                            <div>
                                <h2>Post a New Job</h2>
                                <p>Enter the details of the job opportunity.</p>
                            </div>

                            <button
                                className="close-post-job"
                                type="button"
                                onClick={closePostJob}
                            >
                                ✕
                            </button>
                        </div>

                        <form className="post-job-form" onSubmit={handlePostJob}>
                            <div className="job-form-row">
                                <input
                                    type="text"
                                    name="title"
                                    className="job-form-input"
                                    placeholder="Job Title"
                                    required
                                />

                                <input
                                    type="text"
                                    name="company"
                                    className="job-form-input"
                                    placeholder="Company Name"
                                    required
                                />
                            </div>

                            <div className="job-form-row">
                                <input
                                    type="text"
                                    name="location"
                                    className="job-form-input"
                                    placeholder="Location"
                                    required
                                />

                                <select
                                    name="jobType"
                                    className="job-form-input"
                                    defaultValue=""
                                    required
                                >
                                    <option value="" disabled>
                                        Select Job Type
                                    </option>
                                    <option value="Full Time">Full Time</option>
                                    <option value="Part Time">Part Time</option>
                                    <option value="Internship">Internship</option>
                                    <option value="Contract">Contract</option>
                                </select>
                            </div>

                            <div className="job-form-row">
                                <input
                                    type="text"
                                    name="salary"
                                    className="job-form-input"
                                    placeholder="Salary"
                                    required
                                />

                                <input
                                    type="text"
                                    name="experience"
                                    className="job-form-input"
                                    placeholder="Experience (e.g. 0-2 years)"
                                    required
                                />
                            </div>

                            <textarea
                                name="description"
                                className="job-form-textarea"
                                placeholder="Job Description"
                                rows="5"
                                required
                            />

                            <button
                                type="submit"
                                className="post-job-button"
                                disabled={isPostingJob}
                            >
                                {isPostingJob ? "Submitting..." : "📢 Post Job"}
                            </button>
                        </form>

                        {jobMessage && (
                            <p className="job-success-message" role="status">
                                {jobMessage}
                            </p>
                        )}
                    </div>
                )}

                {/* EDIT JOB FORM */}
                {editingJob && (
                    <div
                        className="post-job-section edit-job-section"
                        id="editJobSection"
                    >
                        <div className="post-job-header">
                            <div>
                                <h2>Edit Job</h2>
                                <p>Update the details of your job posting.</p>
                            </div>

                            <button
                                className="close-post-job"
                                type="button"
                                onClick={() => {
                                    setEditingJob(null);
                                    setJobMessage("");
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <form className="post-job-form" onSubmit={handleEditJob}>
                            <div className="job-form-row">
                                <input
                                    type="text"
                                    name="title"
                                    className="job-form-input"
                                    defaultValue={editingJob.title}
                                    placeholder="Job Title"
                                    required
                                />

                                <input
                                    type="text"
                                    name="company"
                                    className="job-form-input"
                                    defaultValue={editingJob.company}
                                    placeholder="Company Name"
                                    required
                                />
                            </div>

                            <div className="job-form-row">
                                <input
                                    type="text"
                                    name="location"
                                    className="job-form-input"
                                    defaultValue={editingJob.location}
                                    placeholder="Location"
                                    required
                                />

                                <select
                                    name="jobType"
                                    className="job-form-input"
                                    defaultValue={editingJob.jobType}
                                    required
                                >
                                    <option value="Full Time">Full Time</option>
                                    <option value="Part Time">Part Time</option>
                                    <option value="Internship">Internship</option>
                                    <option value="Contract">Contract</option>
                                </select>
                            </div>

                            <div className="job-form-row">
                                <input
                                    type="text"
                                    name="salary"
                                    className="job-form-input"
                                    defaultValue={editingJob.salary}
                                    placeholder="Salary"
                                    required
                                />

                                <input
                                    type="text"
                                    name="experience"
                                    className="job-form-input"
                                    defaultValue={editingJob.experience}
                                    placeholder="Experience"
                                    required
                                />
                            </div>

                            <textarea
                                name="description"
                                className="job-form-textarea"
                                defaultValue={editingJob.description}
                                placeholder="Job Description"
                                rows="5"
                                required
                            />

                            <div className="edit-form-actions">
                                <button
                                    type="submit"
                                    className="post-job-button"
                                    disabled={isSavingJob}
                                >
                                    {isSavingJob ? "Saving..." : "💾 Save Changes"}
                                </button>

                                <button
                                    type="button"
                                    className="cancel-edit-button"
                                    onClick={() => {
                                        setEditingJob(null);
                                        setJobMessage("");
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* RECRUITER PROFILE */}
                {showRecruiterProfile && (
                    <div
                        className="recruiter-profile-section"
                        id="recruiterProfileSection"
                    >
                        <div className="recruiter-profile-section-header">
                            <div>
                                <h2>Recruiter Profile</h2>
                                <p>Update your recruiter account information.</p>
                            </div>

                            <button
                                type="button"
                                className="close-profile-button"
                                onClick={closeRecruiterProfile}
                            >
                                ✕
                            </button>
                        </div>

                        <form
                            className="recruiter-profile-form"
                            onSubmit={handleSaveRecruiterProfile}
                        >
                            <div className="profile-form-row">
                                <div className="profile-form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        defaultValue={recruiterProfile.fullName}
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>

                                <div className="profile-form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        defaultValue={recruiterProfile.email}
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="profile-form-row">
                                <div className="profile-form-group">
                                    <label>Company</label>
                                    <input
                                        type="text"
                                        name="company"
                                        defaultValue={recruiterProfile.company}
                                        placeholder="Enter company name"
                                        required
                                    />
                                </div>

                                <div className="profile-form-group">
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        defaultValue={recruiterProfile.phone}
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            </div>

                            <div className="profile-form-group">
                                <label>Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    defaultValue={recruiterProfile.location}
                                    placeholder="Enter company location"
                                />
                            </div>

                            <div className="profile-form-group">
                                <label>Bio</label>
                                <textarea
                                    name="bio"
                                    defaultValue={recruiterProfile.bio}
                                    placeholder="Tell candidates about yourself and your company"
                                    rows="5"
                                />
                            </div>

                            <div className="profile-form-actions">
                                <button
                                    type="submit"
                                    className="save-profile-button"
                                >
                                    💾 Save Profile
                                </button>

                                <button
                                    type="button"
                                    className="cancel-profile-button"
                                    onClick={closeRecruiterProfile}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>

                        {profileMessage && (
                            <p className="profile-success-message" role="status">
                                {profileMessage}
                            </p>
                        )}
                    </div>
                )}

                {/* MANAGE JOBS */}
                <div className="manage-jobs-section" id="manageJobs">
                    <div className="manage-jobs-header">
                        <div>
                            <h2>Manage Jobs</h2>
                            <p>Jobs posted by your recruiter account.</p>
                        </div>

                        <button
                            className="manage-post-button"
                            type="button"
                            onClick={openPostJob}
                        >
                            + Post New Job
                        </button>
                    </div>

                    {recruiterJobs.length === 0 ? (
                        <div className="no-jobs">
                            <div className="no-jobs-icon">💼</div>
                            <h3>No jobs posted yet</h3>
                            <p>
                                Click "Post New Job" to create your first job.
                            </p>
                        </div>
                    ) : (
                        <div className="posted-jobs-list">
                            {recruiterJobs.map((job) => (
                                <div className="posted-job-card" key={job.id}>
                                    <div className="posted-job-content">
                                        <div className="posted-job-title-row">
                                            <div>
                                                <h3>{job.title}</h3>
                                                <p className="posted-job-company">
                                                    🏢 {job.company}
                                                </p>
                                            </div>

                                            <span className="job-type-badge">
                                                {job.jobType}
                                            </span>
                                        </div>

                                        <div className="posted-job-details">
                                            <span>📍 {job.location}</span>
                                            <span>💰 {job.salary}</span>
                                            <span>
                                                🧑‍💻 {job.experience || "Not specified"}
                                            </span>
                                            <span>
                                                👥 {job.applicants?.length || 0}{" "}
                                                Applicants
                                            </span>
                                        </div>

                                        <p className="posted-job-description">
                                            {job.description}
                                        </p>
                                    </div>

                                    <div className="posted-job-actions">
                                        <button
                                            type="button"
                                            className="view-applicants-button"
                                            onClick={() => openApplicants(job.id)}
                                        >
                                            👥 View Applicants
                                        </button>

                                        <button
                                            type="button"
                                            className="edit-job-button"
                                            onClick={() => openEditJob(job)}
                                        >
                                            ✏️ Edit
                                        </button>

                                        <button
                                            type="button"
                                            className="delete-job-button"
                                            onClick={() => setJobToDelete(job)}
                                            disabled={isDeletingJobId !== null}
                                        >
                                            {String(isDeletingJobId) === String(job.id)
                                                ? "Deleting..."
                                                : "🗑️ Delete"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {jobMessage && !showPostJob && !editingJob && (
                    <p className="job-success-message" role="status">
                        {jobMessage}
                    </p>
                )}

                {/* APPLICANTS */}
                {selectedJob && (
                    <div
                        className="applicants-section"
                        id="applicantsSection"
                    >
                        <div className="applicants-header">
                            <div>
                                <h2>Applicants</h2>
                                <p>
                                    Applicants for{" "}
                                    <strong>{selectedJob.title}</strong>
                                </p>
                            </div>

                            <button
                                type="button"
                                className="close-applicants-button"
                                onClick={() => setSelectedJobId(null)}
                            >
                                ✕ Close
                            </button>
                        </div>

                        {(selectedJob.applicants?.length || 0) === 0 ? (
                            <div className="no-applicants">
                                <div className="no-applicants-icon">👥</div>
                                <h3>No Applicants Yet</h3>
                                <p>
                                    Applicants for this job will appear here
                                    after they apply.
                                </p>
                            </div>
                        ) : (
                            <div className="applicants-list">
                                {selectedJob.applicants.map((applicant) => (
                                    <div
                                        className="applicant-card"
                                        key={
                                            applicant.applicationId ??
                                            applicant.id
                                        }
                                    >
                                        <div className="applicant-info">
                                            <div className="applicant-avatar">
                                                👤
                                            </div>

                                            <div>
                                                <h3>{getApplicantDisplayName(applicant)}</h3>
                                                <p>{applicant.userEmail}</p>
                                                <span>
                                                    📅 Applied:{" "}
                                                    {applicant.appliedAt || "Not available"}
                                                </span>

                                                {applicant.resume &&
                                                    applicant.resume !== "Not provided" && (
                                                        <p>
                                                            Resume: {applicant.resume}
                                                        </p>
                                                    )}
                                            </div>
                                        </div>

                                        <div className="applicant-actions">
                                            <span
                                                className={`applicant-status ${(applicant.status || "Applied").toLowerCase()}`}
                                            >
                                                {applicant.status}
                                            </span>

                                            <select
                                                className="applicant-status-select"
                                                value={applicant.status}
                                                onChange={(event) =>
                                                    onUpdateApplicationStatus(
                                                        applicant.applicationId,
                                                        event.target.value
                                                    )
                                                }
                                            >
                                                <option value="Applied">
                                                    Applied
                                                </option>
                                                <option value="Shortlisted">
                                                    Shortlisted
                                                </option>
                                                <option value="Rejected">
                                                    Rejected
                                                </option>
                                                <option value="Hired">
                                                    Hired
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* RECENT APPLICATIONS */}
                <div className="recent-applications">
                    <div className="recent-applications-header">
                        <h2>Recent Applications</h2>
                        <p>
                            Applications received for your job postings.
                        </p>
                    </div>

                    {recruiterJobs.some(
                        (job) => (job.applicants?.length || 0) > 0
                    ) ? (
                        <div className="recent-applications-list">
                            {recruiterJobs
                                .flatMap((job) =>
                                    (job.applicants || []).map((applicant) => ({
                                        ...applicant,
                                        jobTitle: job.title,
                                        company: job.company
                                    }))
                                )
                                .sort(
                                    (a, b) =>
                                        new Date(b.appliedAt || 0).getTime() -
                                        new Date(a.appliedAt || 0).getTime()
                                )
                                .slice(0, 5)
                                .map((application) => (
                                    <div
                                        className="recent-application-card"
                                        key={
                                            application.applicationId ??
                                            application.id
                                        }
                                    >
                                        <div className="recent-application-info">
                                            <div className="recent-application-avatar">
                                                👤
                                            </div>

                                            <div>
                                                <h3>{getApplicantDisplayName(application)}</h3>
                                                <p>{application.userEmail}</p>
                                                <span>
                                                    💼 {application.jobTitle}
                                                </span>
                                                <span>
                                                    📅 Applied:{" "}
                                                    {application.appliedAt || "Not available"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="recent-application-status">
                                            <span
                                                className={`applicant-status ${(application.status || "Applied").toLowerCase()}`}
                                            >
                                                {application.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="empty-applications">
                            <div className="empty-icon">📭</div>
                            <h3>No applications yet</h3>
                            <p>
                                Applications from candidates will appear here.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* DELETE CONFIRMATION */}
            {jobToDelete && (
                <div
                    className="delete-confirm-overlay"
                    onClick={() => setJobToDelete(null)}
                >
                    <div
                        className="delete-confirm-box"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-confirm-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="delete-confirm-icon">🗑️</div>

                        <h2 id="delete-confirm-title">
                            Confirm Deletion
                        </h2>

                        <p>
                            Are you sure you want to delete{" "}
                            <strong>{jobToDelete.title}</strong>?
                        </p>

                        <p className="delete-confirm-warning">
                            This action cannot be undone.
                        </p>

                        <div className="delete-confirm-actions">
                            <button
                                type="button"
                                className="confirm-delete-button"
                                disabled={isDeletingJobId !== null}
                                onClick={() => handleDeleteJob(jobToDelete.id)}
                            >
                                {String(isDeletingJobId) === String(jobToDelete.id)
                                    ? "Deleting..."
                                    : "Yes, Delete"}
                            </button>

                            <button
                                type="button"
                                className="cancel-delete-button"
                                disabled={isDeletingJobId !== null}
                                onClick={() => setJobToDelete(null)}
                            >
                                No, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default RecruiterDashboard;

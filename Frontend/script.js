"use strict";

const API_BASE_URL = "http://127.0.0.1:8000";

const STORAGE_KEYS = {
    accessToken: "smartHireAccessToken",
    user: "smartHireUser",
    recruiter: "smartHireRecruiter",
    role: "smartHireRole",
    loggedIn: "smartHireLoggedIn",
    adminLoggedIn: "smartHireAdminLoggedIn",
    theme: "smartHireTheme",
    jobAlert: "smartHireJobAlert",
    applications: "smartHireApplications",
    savedJobs: "smartHireSavedJobs"
};

const nameRegex = /^[A-Za-z]+([ '-][A-Za-z]+)*$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

let jobs = [];
let recruiterJobs = [];
let recruiterApplicants = [];
let adminUsers = [];
let adminRecruiters = [];
let adminJobs = [];

let selectedJobId = null;
let editingJobId = null;
let selectedApplicantJobId = null;
let adminSelectedRecruiterId = null;
let adminSelectedJobId = null;
let adminDeleteType = null;
let adminDeleteId = null;

let currentUserProfile = null;

const companyData = {
    Accenture: {
        industry: "Information Technology",
        jobs: "700+",
        rating: "4.1",
        locations: "Hyderabad, Bangalore, Pune",
        description:
            "Technology and professional services organization with roles across software, data and cloud."
    },
    Capgemini: {
        industry: "Information Technology",
        jobs: "650+",
        rating: "4.0",
        locations: "Hyderabad, Bangalore, Chennai",
        description:
            "Technology services company with opportunities across engineering, data and cloud."
    },
    Microsoft: {
        industry: "Technology",
        jobs: "100+",
        rating: "4.4",
        locations: "Hyderabad, Bangalore",
        description:
            "Technology company with engineering and cloud opportunities."
    },
    Google: {
        industry: "Technology",
        jobs: "150+",
        rating: "4.4",
        locations: "Bangalore, Hyderabad",
        description:
            "Technology company with software, data and product engineering opportunities."
    }
};

const $ = (id) => document.getElementById(id);

const els = {};

function cacheElements() {
    const ids = [
        "jobResultsContainer",
        "jobResultsMessage",
        "jobSearchForm",
        "jobSearchInput",
        "locationSearchInput",
        "experienceFilter",

        "modalOverlay",
        "loginModal",
        "signupModal",
        "jobDetailsModal",
        "applyModal",
        "profileModal",

        "loginButton",
        "signupButton",
        "notificationButton",
        "themeToggleButton",
        "mobileMenuButton",
        "mainNavigation",

        "signupForm",
        "loginForm",
        "logoutButton",

        "applyForm",

        "jobAlertForm",

        "recruiterSignupButton",
        "recruiterSignupModal",
        "closeRecruiterSignupModal",
        "recruiterSignupForm",

        "postNewJobButton",
        "postJobModal",
        "postJobForm",

        "editJobModal",
        "editJobForm",

        "recruiterProfileButton",
        "recruiterProfileModal",
        "recruiterProfileForm",

        "recruiterDashboard",

        "jobApplicantsModal",

        "adminLoginButton",
        "adminLoginModal",
        "adminLoginForm",
        "adminLoginMessage",
        "adminLogoutButton",
        "adminDashboard",

        "adminRecruiterReviewModal",
        "adminJobReviewModal",
        "adminDeleteConfirmModal",

        "adminApproveRecruiterButton",
        "adminRejectRecruiterButton",
        "adminApproveJobButton",
        "adminRejectJobButton",
        "adminConfirmDeleteButton",

        "closeNotificationPanel",
        "savedJobsContainer",
        "jobDetailsContent"
    ];

    ids.forEach((id) => {
        els[id] = $(id);
    });
}

function getStoredArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    } catch (_) {
        return [];
    }
}

function setStoredArray(key, value) {
    localStorage.setItem(
        key,
        JSON.stringify(Array.isArray(value) ? value : [])
    );
}

function getCurrentUser() {
    try {
        const user = JSON.parse(
            localStorage.getItem(STORAGE_KEYS.user)
        );

        return user &&
            typeof user === "object"
            ? user
            : null;
    } catch (_) {
        return null;
    }
}

function getCurrentRecruiter() {
    try {
        const recruiter = JSON.parse(
            localStorage.getItem(STORAGE_KEYS.recruiter)
        );

        return recruiter &&
            typeof recruiter === "object"
            ? recruiter
            : null;
    } catch (_) {
        return null;
    }
}

function getRole() {
    return localStorage.getItem(
        STORAGE_KEYS.role
    ) || "";
}

function getAccessToken() {
    return localStorage.getItem(
        STORAGE_KEYS.accessToken
    );
}

function isLoggedIn() {
    return (
        localStorage.getItem(
            STORAGE_KEYS.loggedIn
        ) === "true" &&
        !!getAccessToken()
    );
}

function isAdminLoggedIn() {
    return (
        getRole() === "admin" &&
        localStorage.getItem(
            STORAGE_KEYS.adminLoggedIn
        ) === "true" &&
        !!getAccessToken()
    );
}

function saveCurrentUser(user) {
    if (!user) {
        return;
    }

    localStorage.setItem(
        STORAGE_KEYS.user,
        JSON.stringify(user)
    );
}

function saveCurrentRecruiter(recruiter) {
    if (!recruiter) {
        return;
    }

    localStorage.setItem(
        STORAGE_KEYS.recruiter,
        JSON.stringify(recruiter)
    );
}

function saveAccessToken(token) {
    if (!token) {
        return;
    }

    localStorage.setItem(
        STORAGE_KEYS.accessToken,
        token
    );
}

function clearAuthentication() {
    localStorage.removeItem(
        STORAGE_KEYS.accessToken
    );

    localStorage.removeItem(
        STORAGE_KEYS.user
    );

    localStorage.removeItem(
        STORAGE_KEYS.recruiter
    );

    localStorage.removeItem(
        STORAGE_KEYS.role
    );

    localStorage.removeItem(
        STORAGE_KEYS.loggedIn
    );

    localStorage.removeItem(
        STORAGE_KEYS.adminLoggedIn
    );
}

async function parseResponse(response) {
    const text = await response.text();

    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch (_) {
        return text;
    }
}

async function apiRequest(endpoint, options = {}) {
    const headers = {
        ...(options.headers || {})
    };

    const token = getAccessToken();

    if (
        !(options.body instanceof FormData) &&
        !(options.body instanceof URLSearchParams)
    ) {
        headers["Content-Type"] =
            "application/json";
    }

    if (token) {
        headers.Authorization =
            `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );
    } catch (error) {
        throw new Error(
            "Unable to connect to SmartHire API. Make sure FastAPI is running on http://127.0.0.1:8000."
        );
    }

    const data =
        await parseResponse(response);

    if (response.status === 401) {
        clearAuthentication();
        updateHeader();
        updateProfileModal();
    }

    if (!response.ok) {
        const detail =
            data &&
            typeof data === "object"
                ? data.detail
                : null;

        throw new Error(
            detail ||
            (
                typeof data === "string"
                    ? data
                    : `Request failed with status ${response.status}`
            )
        );
    }

    return data;
}

async function loginWithAPI(
    email,
    password
) {
    const formData =
        new URLSearchParams();

    formData.append(
        "grant_type",
        "password"
    );

    formData.append(
        "username",
        email
    );

    formData.append(
        "password",
        password
    );

    formData.append(
        "scope",
        ""
    );

    formData.append(
        "client_id",
        ""
    );

    formData.append(
        "client_secret",
        ""
    );

    let response;

    try {
        response = await fetch(
            `${API_BASE_URL}/auth/token`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },
                body:
                    formData.toString()
            }
        );
    } catch (_) {
        throw new Error(
            "Unable to connect to SmartHire API."
        );
    }

    const data =
        await parseResponse(response);

    if (!response.ok) {
        throw new Error(
            data?.detail ||
            "Invalid email or password."
        );
    }

    return data;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

function getInitials(name) {
    if (!name) {
        return "S";
    }

    return name
        .split(/\s+/)
        .filter(Boolean)
        .map(
            (part) =>
                part.charAt(0)
        )
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function normalizeJobSkills(job) {
    if (!job) {
        return [];
    }

    if (Array.isArray(job.skills)) {
        return job.skills
            .map(
                (skill) =>
                    String(skill).trim()
            )
            .filter(Boolean);
    }

    if (typeof job.skills === "string") {
        return job.skills
            .split(",")
            .map(
                (skill) =>
                    skill.trim()
            )
            .filter(Boolean);
    }

    return [];
}

function normalizeJob(job) {
    if (!job) {
        return null;
    }

    return {
        ...job,

        id: Number(job.id),

        recruiterId:
            job.recruiter_id ??
            job.recruiterId ??
            null,

        title:
            job.title ||
            "Untitled Job",

        company:
            job.company ||
            "Company not specified",

        location:
            job.location ||
            "Location not specified",

        salary:
            job.salary ||
            "Salary not specified",

        experience:
            job.experience ||
            job.experience_level ||
            "Not specified",

        workMode:
            job.workMode ||
            job.work_mode ||
            job.job_type ||
            "Not specified",

        type:
            job.type ||
            job.job_type ||
            "Not specified",

        category:
            job.category ||
            job.job_type ||
            "Other",

        skills:
            normalizeJobSkills(job),

        description:
            job.description ||
            "No job description provided.",

        source:
            job.source ||
            (
                job.recruiter_id
                    ? "recruiter"
                    : "system"
            ),

        status:
            job.status ||
            "Active",

        approvalStatus:
            job.approval_status ||
            job.approvalStatus ||
            "Approved"
    };
}

function normalizeApplication(
    application,
    job = null
) {
    return {
        ...application,

        id:
            application.id != null
                ? Number(application.id)
                : Date.now(),

        userId:
            application.user_id ??
            application.userId ??
            null,

        jobId:
            Number(
                application.job_id ??
                application.jobId
            ),

        title:
            application.title ||
            application.job_title ||
            application.jobTitle ||
            job?.title ||
            "Job",

        company:
            application.company ||
            application.company_name ||
            job?.company ||
            "Company",

        status:
            application.status ||
            "Applied",

        resume:
            application.resume ||
            application.resume_url ||
            null,

        date:
            application.applied_at
                ? new Date(
                    application.applied_at
                ).toLocaleDateString()
                : (
                    application.date ||
                    new Date().toLocaleDateString()
                ),

        appliedAt:
            application.applied_at ||
            application.appliedAt ||
            null,

        userEmail:
            application.user_email ||
            application.userEmail ||
            null,

        userName:
            application.user_name ||
            application.userName ||
            null,

        phone: application.phone || null,
        location: application.location || null,
        education: application.education || null,
        experience: application.experience || null,
        skills: application.skills || null,
        bio: application.bio || null
    };
}

function normalizeAdminUser(user) {
    return {
        ...user,

        id:
            Number(user.id),

        name:
            user.name ||
            "User",

        email:
            user.email ||
            "",

        role:
            user.role ||
            "user",

        status:
            user.status ||
            "Active"
    };
}

function normalizeAdminRecruiter(
    recruiter
) {
    return {
        ...recruiter,

        id:
            Number(recruiter.id),

        userId:
            recruiter.user_id ??
            recruiter.userId ??
            null,

        name:
            recruiter.name ||
            "Recruiter",

        email:
            recruiter.email ||
            "",

        company:
            recruiter.company ||
            "",

        role:
            recruiter.role ||
            "recruiter",

        status:
            recruiter.status ||
            "Active",

        approvalStatus:
            recruiter.approval_status ||
            recruiter.approvalStatus ||
            "Pending"
    };
}

function openModal(modal) {
    if (
        !modal ||
        !els.modalOverlay
    ) {
        return;
    }

    els.modalOverlay.classList.remove(
        "hidden"
    );

    modal.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";
}

function closeModal(modal) {
    if (!modal) {
        return;
    }

    modal.classList.add(
        "hidden"
    );

    const openModals =
        document.querySelectorAll(
            ".modal:not(.hidden)"
        );

    if (
        openModals.length === 0 &&
        els.modalOverlay
    ) {
        els.modalOverlay.classList.add(
            "hidden"
        );

        document.body.style.overflow =
            "";
    }
}

function closeAllModals() {
    document
        .querySelectorAll(".modal")
        .forEach(
            (modal) => {
                modal.classList.add(
                    "hidden"
                );
            }
        );

    els.modalOverlay?.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";
}

function getSavedJobsStorageKey() {
    const user =
        getCurrentUser();

    if (
        getRole() === "user" &&
        user
    ) {
        const identity =
            user.id ||
            user.email ||
            "anonymous";

        return (
            `${STORAGE_KEYS.savedJobs}_` +
            String(identity).replace(
                /[^A-Za-z0-9_-]/g,
                "_"
            )
        );
    }

    return (
        `${STORAGE_KEYS.savedJobs}_guest`
    );
}

function migrateLegacySavedJobs() {
    const user =
        getCurrentUser();

    if (
        getRole() !== "user" ||
        !user
    ) {
        return;
    }

    const newKey =
        getSavedJobsStorageKey();

    const alreadyMigrated =
        localStorage.getItem(
            newKey
        );

    const legacy =
        getStoredArray(
            STORAGE_KEYS.savedJobs
        ).map(Number);

    if (
        alreadyMigrated === null &&
        legacy.length > 0
    ) {
        setStoredArray(
            newKey,
            [
                ...new Set(legacy)
            ]
        );
    }

    localStorage.removeItem(
        STORAGE_KEYS.savedJobs
    );
}

function getSavedJobs() {
    migrateLegacySavedJobs();

    return getStoredArray(
        getSavedJobsStorageKey()
    ).map(Number);
}

function saveSavedJobs(jobIds) {
    const uniqueIds = [
        ...new Set(
            jobIds.map(Number)
        )
    ];

    setStoredArray(
        getSavedJobsStorageKey(),
        uniqueIds
    );
}

function isPublicJob(job) {
    if (!job) {
        return false;
    }

    return (
        (!job.status ||
            job.status === "Active") &&
        (!job.approvalStatus ||
            job.approvalStatus ===
                "Approved")
    );
}

function getPublicJobs() {
    return jobs.filter(
        isPublicJob
    );
}

function getAllJobs() {
    const map =
        new Map();

    [
        ...jobs,
        ...recruiterJobs
    ].forEach(
        (job) => {
            const normalized =
                normalizeJob(job);

            if (normalized) {
                map.set(
                    normalized.id,
                    normalized
                );
            }
        }
    );

    return [
        ...map.values()
    ];
}

function findJobById(jobId) {
    const id =
        Number(jobId);

    return getAllJobs().find(
        (job) =>
            Number(job.id) === id
    ) || null;
}

function findPublicJobById(jobId) {
    const id =
        Number(jobId);

    return getPublicJobs().find(
        (job) =>
            Number(job.id) === id
    ) || null;
}

function setJobResultsMessage(
    message
) {
    if (
        !els.jobResultsMessage
    ) {
        return;
    }

    els.jobResultsMessage.textContent =
        message;

    els.jobResultsMessage.classList.remove(
        "hidden"
    );
}

function renderJobs(jobList) {
    if (
        !els.jobResultsContainer
    ) {
        return;
    }

    els.jobResultsContainer.innerHTML =
        "";

    const visibleJobs =
        (jobList || []).filter(
            isPublicJob
        );

    if (
        visibleJobs.length === 0
    ) {
        setJobResultsMessage(
            "No jobs matched your search."
        );

        return;
    }

    els.jobResultsMessage?.classList.add(
        "hidden"
    );

    const savedJobs =
        getSavedJobs();

    visibleJobs.forEach(
        (job) => {
            const skills =
                normalizeJobSkills(
                    job
                );

            const saved =
                savedJobs.includes(
                    Number(job.id)
                );

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "job-card";

            card.innerHTML = `
                <div class="job-card-top">
                    <div class="job-company-logo">
                        ${escapeHtml(
                            job.company
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </div>

                    <button
                        class="save-job-button ${saved ? "saved" : ""}"
                        type="button"
                        data-save-job="${Number(job.id)}"
                        aria-label="Save ${escapeHtml(job.title)}"
                    >
                        ${saved ? "♥" : "♡"}
                    </button>
                </div>

                <div>
                    <h3>
                        ${escapeHtml(job.title)}
                    </h3>

                    <p class="job-company">
                        ${escapeHtml(job.company)}
                    </p>

                    <p class="job-location">
                        📍 ${escapeHtml(job.location)}
                    </p>
                </div>

                <div class="job-tags">
                    ${
                        skills.map(
                            (skill) => `
                                <span class="job-tag">
                                    ${escapeHtml(skill)}
                                </span>
                            `
                        ).join("")
                    }
                </div>

                <p class="job-meta">
                    ${escapeHtml(
                        job.salary ||
                        "Salary not specified"
                    )}
                    ·
                    ${escapeHtml(
                        job.experience ||
                        "Experience not specified"
                    )}
                    ·
                    ${escapeHtml(
                        job.workMode ||
                        "Work mode not specified"
                    )}
                </p>

                ${
                    job.match != null
                        ? `
                            <div class="job-match">
                                <span class="match-dot"></span>
                                ${Number(job.match)}%
                                skill and preference match
                            </div>
                        `
                        : ""
                }

                <div class="job-actions">
                    <button
                        class="outline-button view-details-button"
                        type="button"
                        data-job-id="${Number(job.id)}"
                    >
                        View Details
                    </button>

                    <button
                        class="primary-button apply-job-button"
                        type="button"
                        data-apply-job="${Number(job.id)}"
                    >
                        Apply
                    </button>
                </div>
            `;

            els.jobResultsContainer.appendChild(
                card
            );
        }
    );
}

function getCurrentlyDisplayedJobs() {
    const keyword =
        (
            els.jobSearchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();

    const location =
        (
            els.locationSearchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();

    const experience =
        els.experienceFilter?.value ||
        "";

    return getPublicJobs().filter(
        (job) => {
            const skills =
                normalizeJobSkills(
                    job
                );

            const searchableText = [
                job.title,
                job.company,
                job.location,
                job.category,
                job.type,
                job.workMode,
                job.job_type,
                ...skills
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const keywordMatch =
                !keyword ||
                searchableText.includes(
                    keyword
                );

            const locationMatch =
                !location ||
                (
                    job.location ||
                    ""
                )
                    .toLowerCase()
                    .includes(
                        location
                    ) ||
                (
                    job.workMode ||
                    ""
                )
                    .toLowerCase()
                    .includes(
                        location
                    );

            const experienceMatch =
                !experience ||
                job.experience ===
                    "Not specified" ||
                job.experience ===
                    experience;

            return (
                keywordMatch &&
                locationMatch &&
                experienceMatch
            );
        }
    );
}

function searchJobs() {
    renderJobs(
        getCurrentlyDisplayedJobs()
    );
}

async function loadJobsFromAPI() {
    try {
        const data =
            await apiRequest(
                "/jobs/"
            );

        jobs =
            Array.isArray(data)
                ? data
                    .map(
                        normalizeJob
                    )
                    .filter(Boolean)
                : [];

        renderJobs(
            getCurrentlyDisplayedJobs()
        );

        renderSavedJobs();

        updateDashboard();
    } catch (error) {
        console.error(
            "Failed to load jobs:",
            error
        );

        if (
            els.jobResultsContainer
        ) {
            els.jobResultsContainer.innerHTML =
                "";
        }

        setJobResultsMessage(
            error.message
        );
    }
}

function showJobDetails(jobId) {
    const job =
        findJobById(jobId);

    if (
        !job ||
        !els.jobDetailsContent
    ) {
        return;
    }

    selectedJobId =
        Number(job.id);

    const skills =
        normalizeJobSkills(
            job
        );

    els.jobDetailsContent.innerHTML = `
        <div class="job-details-header">
            <div class="job-company-logo">
                ${escapeHtml(
                    job.company
                        .charAt(0)
                        .toUpperCase()
                )}
            </div>

            <div>
                <h2 id="jobDetailsTitle">
                    ${escapeHtml(job.title)}
                </h2>

                <p>
                    ${escapeHtml(job.company)}
                </p>

                <p>
                    📍 ${escapeHtml(job.location)}
                </p>
            </div>
        </div>

        <div class="job-details-meta">
            <span>
                💰 ${escapeHtml(
                    job.salary ||
                    "Not specified"
                )}
            </span>

            <span>
                🧑‍💻 ${escapeHtml(
                    job.experience ||
                    "Not specified"
                )}
            </span>

            <span>
                🏢 ${escapeHtml(
                    job.workMode ||
                    "Not specified"
                )}
            </span>

            ${
                job.match != null
                    ? `
                        <span>
                            🎯 ${Number(job.match)}% match
                        </span>
                    `
                    : ""
            }
        </div>

        <div class="job-details-section">
            <h3>
                Job Description
            </h3>

            <p>
                ${escapeHtml(
                    job.description ||
                    "No job description provided."
                )}
            </p>
        </div>

        <div class="job-details-section">
            <h3>
                Skills
            </h3>

            <p>
                ${
                    skills.length
                        ? skills
                            .map(
                                escapeHtml
                            )
                            .join(" · ")
                        : "No skills specified."
                }
            </p>
        </div>

        <div class="job-details-actions">
            <button
                class="outline-button"
                type="button"
                data-save-job="${Number(job.id)}"
            >
                ${
                    getSavedJobs().includes(
                        Number(job.id)
                    )
                        ? "Unsave Job"
                        : "Save Job"
                }
            </button>

            <button
                class="primary-button"
                type="button"
                id="detailsApplyButton"
            >
                Apply Now
            </button>
        </div>
    `;

    openModal(
        els.jobDetailsModal
    );
}

function toggleSavedJob(jobId) {
    const id =
        Number(jobId);

    const job =
        findPublicJobById(id);

    if (!job) {
        return;
    }

    let savedJobs =
        getSavedJobs();

    if (
        savedJobs.includes(id)
    ) {
        savedJobs =
            savedJobs.filter(
                (savedId) =>
                    savedId !== id
            );
    } else {
        savedJobs.push(id);
    }

    saveSavedJobs(
        savedJobs
    );

    renderJobs(
        getCurrentlyDisplayedJobs()
    );

    renderSavedJobs();

    updateDashboard();
}

function renderSavedJobs() {
    const container =
        $("savedJobsContainer");

    if (!container) {
        return;
    }

    const savedIds =
        getSavedJobs();

    const savedJobs =
        getPublicJobs().filter(
            (job) =>
                savedIds.includes(
                    Number(job.id)
                )
        );

    saveSavedJobs(
        savedJobs.map(
            (job) =>
                Number(job.id)
        )
    );

    if (!savedJobs.length) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">
                    ❤️
                </span>

                <h3>
                    No saved jobs
                </h3>

                <p>
                    Use Save Job on any listing to keep it here.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        savedJobs.map(
            (job) => `
                <article class="saved-job-item">
                    <div>
                        <h4>
                            ${escapeHtml(job.title)}
                        </h4>

                        <p>
                            ${escapeHtml(job.company)}
                            ·
                            ${escapeHtml(job.location)}
                            ·
                            ${escapeHtml(job.salary)}
                        </p>
                    </div>

                    <div class="job-actions">
                        <button
                            class="outline-button view-details-button"
                            type="button"
                            data-job-id="${Number(job.id)}"
                        >
                            View
                        </button>

                        <button
                            class="primary-button apply-job-button"
                            type="button"
                            data-apply-job="${Number(job.id)}"
                        >
                            Apply
                        </button>
                    </div>
                </article>
            `
        ).join("");
}

function openApplyModal(jobId) {
    const job =
        findPublicJobById(
            jobId
        );

    if (!job) {
        return;
    }

    if (
        getRole() === "recruiter" ||
        getRole() === "admin"
    ) {
        return;
    }

    selectedJobId =
        Number(job.id);

    if ($("applyModalTitle")) {
        $("applyModalTitle").textContent =
            `Apply for ${job.title}`;
    }

    if ($("applyJobId")) {
        $("applyJobId").value =
            Number(job.id);
    }

    if ($("applyMessage")) {
        $("applyMessage").textContent =
            "";
    }

    openModal(
        els.applyModal
    );
}

async function loadApplicationsFromAPI() {
    if (
        getRole() !== "user" ||
        !getAccessToken()
    ) {
        renderApplications();
        return;
    }

    try {
        const data =
            await apiRequest(
                "/applications/my-applications"
            );

        const normalized =
            (
                Array.isArray(data)
                    ? data
                    : []
            ).map(
                (application) => {
                    const job =
                        jobs.find(
                            (item) =>
                                Number(
                                    item.id
                                ) ===
                                Number(
                                    application.job_id ??
                                    application.jobId
                                )
                        );

                    return normalizeApplication(
                        application,
                        job
                    );
                }
            );

        setStoredArray(
            STORAGE_KEYS.applications,
            normalized
        );

        renderApplications();

        updateDashboard();
    } catch (error) {
        console.error(
            "Failed to load applications:",
            error
        );

        const container =
            $("applicationList");

        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-state-icon">
                        ⚠️
                    </span>

                    <h3>
                        Unable to load applications
                    </h3>

                    <p>
                        ${escapeHtml(
                            error.message
                        )}
                    </p>
                </div>
            `;
        }
    }
}

function renderApplications() {
    const container =
        $("applicationList");

    if (!container) {
        return;
    }

    if (
        getRole() !== "user" ||
        !isLoggedIn()
    ) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">
                    📋
                </span>

                <h3>
                    Please login
                </h3>

                <p>
                    Login as a job seeker to view your applications.
                </p>
            </div>
        `;

        return;
    }

    const applications =
        getStoredArray(
            STORAGE_KEYS.applications
        );

    if (!applications.length) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">
                    📋
                </span>

                <h3>
                    No applications yet
                </h3>

                <p>
                    Apply to a job and your application will appear here.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        applications.map(
            (application) => `
                <article class="application-item">
                    <div>
                        <h4>
                            ${escapeHtml(
                                application.title
                            )}
                        </h4>

                        <p>
                            ${escapeHtml(
                                application.company
                            )}
                            · Applied
                            ${escapeHtml(
                                application.date
                            )}
                        </p>
                    </div>

                    <span class="status-badge">
                        ${escapeHtml(
                            application.status
                        )}
                    </span>
                </article>
            `
        ).join("");
}

function updateDashboard() {
    const user =
        getCurrentUser();

    const applications =
        getStoredArray(
            STORAGE_KEYS.applications
        );

    const ownApplications =
        (
            user &&
            getRole() === "user"
        )
            ? applications.filter(
                (application) =>
                    (
                        application.userId != null &&
                        user.id != null &&
                        Number(
                            application.userId
                        ) ===
                        Number(
                            user.id
                        )
                    ) ||
                    (
                        application.userEmail &&
                        application.userEmail.toLowerCase() ===
                        String(user.email || "").toLowerCase()
                    )
            )
            : [];

    const savedJobs =
        getSavedJobs();

    const publicSaved =
        getPublicJobs().filter(
            (job) =>
                savedJobs.includes(
                    Number(job.id)
                )
        );

    if ($("appliedCount")) {
        $("appliedCount").textContent =
            ownApplications.length;
    }

    if ($("reviewCount")) {
        $("reviewCount").textContent =
            ownApplications.filter(
                (application) =>
                    [
                        "Reviewing",
                        "Shortlisted"
                    ].includes(
                        application.status
                    )
            ).length;
    }

    if ($("interviewCount")) {
        $("interviewCount").textContent =
            ownApplications.filter(
                (application) =>
                    application.status ===
                    "Interview"
            ).length;
    }

    if ($("savedCount")) {
        $("savedCount").textContent =
            publicSaved.length;
    }

    renderApplications();
}

function updateHeader() {
    const role =
        getRole();

    if (
        !els.loginButton ||
        !els.signupButton
    ) {
        return;
    }

    if (
        isLoggedIn() &&
        role === "admin"
    ) {
        els.loginButton.textContent =
            "Admin";

        els.signupButton.textContent =
            "Dashboard";

        delete els.signupButton.dataset.profile;

        return;
    }

    if (
        isLoggedIn() &&
        role === "recruiter"
    ) {
        const recruiter =
            getCurrentRecruiter();

        els.loginButton.textContent =
            recruiter?.name ||
            "Recruiter";

        els.signupButton.textContent =
            "Profile";

        els.signupButton.dataset.profile =
            "true";

        return;
    }

    if (
        isLoggedIn() &&
        role === "user"
    ) {
        const user =
            getCurrentUser();

        els.loginButton.textContent =
            user?.name ||
            "User";

        els.signupButton.textContent =
            "Profile";

        els.signupButton.dataset.profile =
            "true";

        return;
    }

    els.loginButton.textContent =
        "Login";

    els.signupButton.textContent =
        "Sign Up";

    delete els.signupButton.dataset.profile;
}

function updateProfileModal() {
    const user = getCurrentUser();
    const recruiter = getCurrentRecruiter();
    const displayUser = getRole() === "recruiter" ? recruiter : user;

    if ($("profileName")) {
        $("profileName").textContent =
            displayUser?.name || "Guest User";
    }

    if ($("profileEmail")) {
        $("profileEmail").textContent =
            displayUser?.email || "Not logged in";
    }

    if ($("profileAvatar")) {
        $("profileAvatar").textContent =
            getInitials(displayUser?.name || "SmartHire");
    }

    // Show real profile completion for normal users
    if (getRole() === "user" && user) {

        const profile = {
            name: currentUserProfile?.name || user.name || "",
            email: currentUserProfile?.email || user.email || "",
            phone: currentUserProfile?.phone || "",
            location: currentUserProfile?.location || "",
            education: currentUserProfile?.education || "",
            experience: currentUserProfile?.experience || "",
            skills: currentUserProfile?.skills || "",
            bio: currentUserProfile?.bio || ""
    };

        const percentage =
            calculateUserProfileCompletion(profile);

        if ($("profileModalCompletion")) {
            $("profileModalCompletion").textContent =
                `${percentage}%`;
        }

        if ($("profileModalCompletionBar")) {
            $("profileModalCompletionBar").style.width =
                `${percentage}%`;
        }
    }
}

function loadTheme() {
    const theme =
        localStorage.getItem(
            STORAGE_KEYS.theme
        );

    document.body.classList.toggle(
        "dark-theme",
        theme === "dark"
    );

    if (
        els.themeToggleButton
    ) {
        els.themeToggleButton.textContent =
            theme === "dark"
                ? "☀️"
                : "🌙";
    }
}

function toggleTheme() {
    const dark =
        document.body.classList.toggle(
            "dark-theme"
        );

    localStorage.setItem(
        STORAGE_KEYS.theme,
        dark
            ? "dark"
            : "light"
    );

    if (
        els.themeToggleButton
    ) {
        els.themeToggleButton.textContent =
            dark
                ? "☀️"
                : "🌙";
    }
}

function showCompanyDetails(
    companyName
) {
    const company =
        companyData[
            companyName
        ];

    if (
        !company ||
        !els.jobDetailsContent
    ) {
        return;
    }

    els.jobDetailsContent.innerHTML = `
        <div class="job-details-header">
            <div class="job-company-logo">
                ${escapeHtml(
                    companyName.charAt(0)
                )}
            </div>

            <div>
                <h2 id="jobDetailsTitle">
                    ${escapeHtml(
                        companyName
                    )}
                </h2>

                <p>
                    ${escapeHtml(
                        company.industry
                    )}
                </p>

                <p>
                    ⭐ ${escapeHtml(
                        company.rating
                    )}
                </p>
            </div>
        </div>

        <div class="job-details-meta">
            <span>
                💼 ${escapeHtml(
                    company.jobs
                )} open jobs
            </span>

            <span>
                📍 ${escapeHtml(
                    company.locations
                )}
            </span>

            <span>
                ⭐ ${escapeHtml(
                    company.rating
                )}
            </span>
        </div>

        <div class="job-details-section">
            <h3>
                About the Company
            </h3>

            <p>
                ${escapeHtml(
                    company.description
                )}
            </p>
        </div>

        <div class="job-details-actions">
            <button
                class="primary-button"
                type="button"
                id="companyJobsButton"
                data-company="${escapeHtml(
                    companyName
                )}"
            >
                View Company Jobs
            </button>
        </div>
    `;

    openModal(
        els.jobDetailsModal
    );
}

async function loadRecruiterProfile() {
    if (
        getRole() !== "recruiter" ||
        !getAccessToken()
    ) {
        return null;
    }

    const recruiter =
        await apiRequest(
            "/recruiters/me"
        );

    const normalized =
        normalizeAdminRecruiter(
            recruiter
        );

    saveCurrentRecruiter(
        normalized
    );

    const currentUser =
        getCurrentUser();

    saveCurrentUser({
        ...(currentUser || {}),
        id:
            normalized.userId ??
            currentUser?.id,
        name:
            normalized.name,
        email:
            normalized.email,
        role:
            "recruiter",
        status:
            normalized.status
    });

    return normalized;
}

async function loadRecruiterJobsFromAPI() {
    if (
        getRole() !== "recruiter" ||
        !getAccessToken()
    ) {
        recruiterJobs = [];
        return;
    }

    try {
        const data =
            await apiRequest(
                "/jobs/my-jobs"
            );

        recruiterJobs =
            (
                Array.isArray(data)
                    ? data
                    : []
            )
                .map(
                    normalizeJob
                )
                .filter(Boolean)
                .map(
                    (job) => ({
                        ...job,
                        source:
                            "recruiter"
                    })
                );

        renderRecruiterJobs();

        updateRecruiterDashboardStats();
    } catch (error) {
        console.error(
            "Failed to load recruiter jobs:",
            error
        );

        recruiterJobs = [];

        renderRecruiterJobs();

        updateRecruiterDashboardStats();
    }
}

async function loadRecruiterApplicantsFromAPI() {
    if (
        getRole() !== "recruiter" ||
        !getAccessToken()
    ) {
        recruiterApplicants = [];
        return;
    }

    try {
        const allApplicants = [];

        for (
            const job of recruiterJobs
        ) {
            try {
                const data =
                    await apiRequest(
                        `/applications/job/${Number(
                            job.id
                        )}/details`
                    );

                const list =
                    Array.isArray(data)
                        ? data
                        : [];

                list.forEach(
                    (application) => {
                        allApplicants.push(
                            normalizeApplication(
                                application,
                                job
                            )
                        );
                    }
                );
            } catch (error) {
                console.error(
                    `Failed to load applicants for job ${job.id}:`,
                    error
                );
            }
        }

        recruiterApplicants =
            allApplicants;

        renderRecentApplicants();

        updateRecruiterDashboardStats();
    } catch (error) {
        console.error(
            "Failed to load recruiter applicants:",
            error
        );
    }
}

function getOwnRecruiterJobs() {
    const recruiter =
        getCurrentRecruiter();

    if (!recruiter) {
        return [];
    }

    const recruiterId =
        recruiter.id != null
            ? Number(recruiter.id)
            : null;

    return recruiterJobs.filter(
        (job) => {
            if (
                recruiterId !== null &&
                job.recruiterId != null
            ) {
                return (
                    Number(
                        job.recruiterId
                    ) ===
                    recruiterId
                );
            }

            return false;
        }
    );
}

function getOwnRecruiterApplicants() {
    const ownJobIds =
        new Set(
            getOwnRecruiterJobs()
                .map(
                    (job) =>
                        Number(
                            job.id
                        )
                )
        );

    return recruiterApplicants.filter(
        (application) =>
            ownJobIds.has(
                Number(
                    application.jobId
                )
            )
    );
}

function updateRecruiterDashboardStats() {
    const ownJobs =
        getOwnRecruiterJobs();

    const applicants =
        getOwnRecruiterApplicants();

    if ($("recruiterTotalJobs")) {
        $("recruiterTotalJobs").textContent =
            ownJobs.length;
    }

    if ($("recruiterActiveJobs")) {
        $("recruiterActiveJobs").textContent =
            ownJobs.filter(
                (job) =>
                    job.status ===
                    "Active"
            ).length;
    }

    if (
        $("recruiterTotalApplicants")
    ) {
        $("recruiterTotalApplicants").textContent =
            applicants.length;
    }

    if (
        $("recruiterPendingApplications")
    ) {
        $("recruiterPendingApplications").textContent =
            applicants.filter(
                (application) =>
                    [
                        "Applied",
                        "Pending",
                        "Under Review"
                    ].includes(
                        application.status
                    )
            ).length;
    }
}

function showRecruiterDashboard() {
    if (
        getRole() !== "recruiter" ||
        !getAccessToken()
    ) {
        return;
    }

    els.adminDashboard?.classList.add(
        "hidden"
    );

    const dashboard =
        $("recruiterDashboard");

    if (!dashboard) {
        return;
    }

    dashboard.classList.remove(
        "hidden"
    );

    const recruiter =
        getCurrentRecruiter();

    if ($("recruiterDashboardName")) {
        $("recruiterDashboardName").textContent =
            recruiter?.name ||
            "Recruiter";
    }

    if (
        $("recruiterDashboardCompany")
    ) {
        $("recruiterDashboardCompany").textContent =
            recruiter?.company ||
            "Company";
    }

    if (
        $("recruiterDashboardEmail")
    ) {
        $("recruiterDashboardEmail").textContent =
            recruiter?.email ||
            "";
    }

    if (
        $("recruiterDashboardAvatar")
    ) {
        $("recruiterDashboardAvatar").textContent =
            getInitials(
                recruiter?.name ||
                "Recruiter"
            );
    }

    renderRecruiterJobs();
    renderRecentApplicants();
    updateRecruiterDashboardStats();

    dashboard.scrollIntoView({
        behavior: "smooth"
    });
}

function renderRecruiterJobs() {
    const container =
        $("recruiterJobsContainer");

    if (!container) {
        return;
    }

    const ownJobs =
        getOwnRecruiterJobs();

    container.innerHTML =
        "";

    if (!ownJobs.length) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">
                    💼
                </span>

                <h3>
                    No jobs posted
                </h3>

                <p>
                    Post a new job to start receiving applicants.
                </p>
            </div>
        `;

        return;
    }

    ownJobs.forEach(
        (job) => {
            const applicantCount =
                recruiterApplicants.filter(
                    (application) =>
                        Number(
                            application.jobId
                        ) ===
                        Number(
                            job.id
                        )
                ).length;

            const status =
                job.approvalStatus ===
                "Pending"
                    ? "Pending Approval"
                    : (
                        job.status ||
                        "Active"
                    );

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "job-card recruiter-job-card";

            card.innerHTML = `
                <span class="recruiter-job-status">
                    ${escapeHtml(status)}
                </span>

                <h3>
                    ${escapeHtml(job.title)}
                </h3>

                <p>
                    ${escapeHtml(job.company)}
                </p>

                <p>
                    📍 ${escapeHtml(job.location)}
                </p>

                <p>
                    💼 ${escapeHtml(
                        job.experience ||
                        "Not specified"
                    )}
                </p>

                <p>
                    🕐 ${escapeHtml(
                        job.type ||
                        job.workMode ||
                        "Not specified"
                    )}
                </p>

                <p>
                    💰 ${escapeHtml(
                        job.salary ||
                        "Not specified"
                    )}
                </p>

                <p>
                    👥 ${applicantCount} Applicants
                </p>

                <div class="recruiter-job-actions">
                    <button
                        class="outline-button edit-job-button"
                        type="button"
                        data-job-id="${Number(job.id)}"
                    >
                        Edit
                    </button>

                    <button
                        class="danger-button delete-job-button"
                        type="button"
                        data-job-id="${Number(job.id)}"
                    >
                        Delete
                    </button>

                    <button
                        class="text-button view-applicants-button"
                        type="button"
                        data-job-id="${Number(job.id)}"
                    >
                        Applicants
                    </button>
                </div>
            `;

            container.appendChild(
                card
            );
        }
    );
}

function renderRecentApplicants() {
    const container =
        $("recentApplicantsContainer");

    if (!container) {
        return;
    }

    const applicants =
        getOwnRecruiterApplicants();

    container.innerHTML =
        "";

    if (!applicants.length) {
        container.innerHTML = `
            <div class="no-applicants-message">
                <p>
                    No applicants have applied yet.
                </p>
            </div>
        `;

        return;
    }

    applicants.forEach(
        (application) => {
            const name =
                application.userName ||
                `User #${
                    application.userId ??
                    "Unknown"
                }`;

            const job =
                findJobById(
                    application.jobId
                );

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "applicant-card";

            card.innerHTML = `
                <div class="applicant-info">
                    <div class="applicant-avatar">
                        ${escapeHtml(
                            name
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </div>

                    <div>
                        <h4>
                            ${escapeHtml(name)}
                        </h4>

                        <p>
                            ${escapeHtml(
                                application.userEmail ||
                                `User ID: ${
                                    application.userId ??
                                    "Unknown"
                                }`
                            )}
                        </p>

                        <p>
                            Applied for:
                            ${escapeHtml(
                                job?.title ||
                                application.title ||
                                "Job"
                            )}
                        </p>

                        ${
                            application.resume
                                ? `
                                    <p>
                                        Resume:
                                        <button
                                            class="text-button view-resume-button"
                                            type="button"
                                            data-resume-id="${Number(
                                                application.id
                                            )}"
                                        >
                                            View Resume
                                        </button>
                                    </p>
                                `
                                : `
                                    <p>
                                        Resume: Not provided
                                    </p>
                                `
                        }
                    </div>
                </div>

                <span class="applicant-status">
                    ${escapeHtml(
                        application.status
                    )}
                </span>
            `;

            container.appendChild(
                card
            );
        }
    );
}

function renderJobApplicants(
    applicants
) {
    const container =
        $("jobApplicantsContainer");

    if (!container) {
        return;
    }

    container.innerHTML =
        "";

    if (!applicants.length) {
        container.innerHTML = `
            <div class="no-applicants-message">
                <p>
                    No applicants have applied for this job yet.
                </p>
            </div>
        `;

        return;
    }

    applicants.forEach(
        (application) => {
            const name =
                application.userName ||
                `User #${
                    application.userId ??
                    "Unknown"
                }`;

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "job-applicants-card";

            const statuses = [
                "Applied",
                "Reviewing",
                "Shortlisted",
                "Interview",
                "Selected",
                "Rejected"
            ];

            card.innerHTML = `
                <div class="job-applicants-info">

                    <div class="applicant-avatar">
                        ${escapeHtml(
                            name
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </div>

                    <div class="applicant-main-info">

                        <h4>
                            ${escapeHtml(name)}
                        </h4>

                        <p>
                            ${escapeHtml(
                                application.userEmail ||
                                `User ID: ${
                                    application.userId ??
                                    "Unknown"
                                }`
                            )}
                        </p>

                        <div class="applicant-profile-details">

                            <p>
                                <strong>Phone:</strong>
                                ${
                                    application.phone
                                        ? escapeHtml(
                                            application.phone
                                        )
                                        : "Not provided"
                                }
                            </p>

                            <p>
                                <strong>Location:</strong>
                                ${
                                    application.location
                                        ? escapeHtml(
                                            application.location
                                        )
                                        : "Not provided"
                                }
                            </p>

                            <p>
                                <strong>Education:</strong>
                                ${
                                    application.education
                                        ? escapeHtml(
                                            application.education
                                        )
                                        : "Not provided"
                                }
                            </p>

                            <p>
                                <strong>Experience:</strong>
                                ${
                                    application.experience
                                        ? escapeHtml(
                                            application.experience
                                        )
                                        : "Not provided"
                                }
                            </p>

                            <p>
                                <strong>Skills:</strong>
                                ${
                                    application.skills
                                        ? escapeHtml(
                                            application.skills
                                        )
                                        : "Not provided"
                                }
                            </p>

                            <p>
                                <strong>About Me:</strong>
                                ${
                                    application.bio
                                        ? escapeHtml(
                                            application.bio
                                        )
                                        : "Not provided"
                                }
                            </p>

                        </div>

                        <p>
                            ${
                                application.resume
                                    ? `
                                        Resume:
                                        <button
                                            class="text-button view-resume-button"
                                            type="button"
                                            data-resume-id="${Number(
                                                application.id
                                            )}"
                                        >
                                            View Resume
                                        </button>
                                    `
                                    : `
                                        Resume: Not provided
                                    `
                            }
                        </p>

                    </div>
                </div>

                <div class="applicant-action-area">

                    <label
                        for="status-${Number(
                            application.id
                        )}"
                    >
                        Status
                    </label>

                    <select
                        id="status-${Number(
                            application.id
                        )}"
                        class="applicant-status-select"
                        data-applicant-id="${Number(
                            application.id
                        )}"
                    >
                        ${
                            statuses
                                .map(
                                    (status) => `
                                        <option
                                            value="${escapeHtml(
                                                status
                                            )}"
                                            ${
                                                application.status ===
                                                status
                                                    ? "selected"
                                                    : ""
                                            }
                                        >
                                            ${escapeHtml(
                                                status
                                            )}
                                        </option>
                                    `
                                )
                                .join("")
                        }
                    </select>

                </div>
            `;

            container.appendChild(
                card
            );
        }
    );
}

async function updateRecruiterApplicationStatus(
    applicationId,
    newStatus
) {
    try {
        await apiRequest(
            `/applications/${Number(
                applicationId
            )}/status`,
            {
                method:
                    "PUT",

                body:
                    JSON.stringify({
                        status:
                            newStatus
                    })
            }
        );

        await loadRecruiterApplicantsFromAPI();

        await loadApplicationsFromAPI();
    } catch (error) {
        alert(
            error.message
        );
    }
}

async function createRecruiterJob() {
    const payload = {
        title:
            $("jobTitleInput")
                ?.value
                .trim() || "",

        location:
            $("jobLocationInput")
                ?.value
                .trim() || "",

        job_type:
            $("jobTypeInput")
                ?.value ||
            $("jobWorkModeInput")
                ?.value ||
            "Full-Time",

        salary:
            $("jobSalaryInput")
                ?.value
                .trim() || null,

        description:
            $("jobDescriptionInput")
                ?.value
                .trim() || "",

        skills:
            $("jobSkillsInput")
                ?.value
                .trim() || null
    };

    return apiRequest(
        "/jobs/",
        {
            method:
                "POST",

            body:
                JSON.stringify(
                    payload
                )
        }
    );
}

async function updateRecruiterJob(
    jobId
) {
    const payload = {
        title:
            $("editJobTitleInput")
                ?.value
                .trim() || "",

        location:
            $("editJobLocationInput")
                ?.value
                .trim() || "",

        job_type:
            $("editJobTypeInput")
                ?.value ||
            $("editJobWorkModeInput")
                ?.value ||
            "Full-Time",

        salary:
            $("editJobSalaryInput")
                ?.value
                .trim() || null,

        description:
            $("editJobDescriptionInput")
                ?.value
                .trim() || "",

        skills:
            $("editJobSkillsInput")
                ?.value
                .trim() || null
    };

    return apiRequest(
        `/jobs/${Number(jobId)}`,
        {
            method:
                "PUT",

            body:
                JSON.stringify(
                    payload
                )
        }
    );
}

function fillEditJobForm(
    job
) {
    if ($("editJobTitleInput")) {
        $("editJobTitleInput").value =
            job.title || "";
    }

    if ($("editJobCompanyInput")) {
        $("editJobCompanyInput").value =
            job.company || "";

        $("editJobCompanyInput").readOnly =
            true;
    }

    if ($("editJobLocationInput")) {
        $("editJobLocationInput").value =
            job.location || "";
    }

    if ($("editJobExperienceInput")) {
        $("editJobExperienceInput").value =
            job.experience || "";
    }

    if ($("editJobTypeInput")) {
        $("editJobTypeInput").value =
            job.type ||
            job.workMode ||
            "";
    }

    if ($("editJobWorkModeInput")) {
        $("editJobWorkModeInput").value =
            job.workMode ||
            job.type ||
            "";
    }

    if ($("editJobSalaryInput")) {
        $("editJobSalaryInput").value =
            (
                job.salary ===
                "Salary not specified"
            )
                ? ""
                : job.salary || "";
    }

    if ($("editJobSkillsInput")) {
        $("editJobSkillsInput").value =
            normalizeJobSkills(
                job
            ).join(", ");
    }

    if ($("editJobDescriptionInput")) {
        $("editJobDescriptionInput").value =
            job.description || "";
    }

    if ($("editJobMessage")) {
        $("editJobMessage").textContent =
            "";
    }
}

function prepareRecruiterProfile() {
    const recruiter =
        getCurrentRecruiter();

    if (!recruiter) {
        return;
    }

    if ($("recruiterProfileName")) {
        $("recruiterProfileName").value =
            recruiter.name || "";
    }

    if ($("recruiterProfileEmail")) {
        $("recruiterProfileEmail").value =
            recruiter.email || "";
    }

    if ($("recruiterProfileCompany")) {
        $("recruiterProfileCompany").value =
            recruiter.company || "";
    }

    if ($("recruiterProfileMessage")) {
        $("recruiterProfileMessage").textContent =
            "";
    }
}

async function submitRecruiterProfile(
    event
) {
    event.preventDefault();

    const message =
        $("recruiterProfileMessage");

    const name =
        $("recruiterProfileName")
            ?.value
            .trim() || "";

    const email =
        $("recruiterProfileEmail")
            ?.value
            .trim()
            .toLowerCase() || "";

    const company =
        $("recruiterProfileCompany")
            ?.value
            .trim() || "";

    if (!nameRegex.test(name)) {
        message.textContent =
            "Name can contain only letters, spaces, hyphens and apostrophes.";

        message.style.color =
            "var(--danger)";

        return;
    }

    if (!emailRegex.test(email)) {
        message.textContent =
            "Please enter a valid email address.";

        message.style.color =
            "var(--danger)";

        return;
    }

    if (company.length < 2) {
        message.textContent =
            "Please enter your company name.";

        message.style.color =
            "var(--danger)";

        return;
    }

    try {
        const updated =
            await apiRequest(
                "/recruiters/me",
                {
                    method:
                        "PUT",

                    body:
                        JSON.stringify({
                            name,
                            email,
                            company
                        })
                }
            );

        const recruiter =
            normalizeAdminRecruiter(
                updated
            );

        saveCurrentRecruiter(
            recruiter
        );

        const user =
            getCurrentUser();

        saveCurrentUser({
            ...(user || {}),

            id:
                recruiter.userId ??
                user?.id,

            name:
                recruiter.name,

            email:
                recruiter.email,

            role:
                "recruiter",

            status:
                recruiter.status
        });

        message.textContent =
            "Profile updated successfully.";

        message.style.color =
            "var(--success)";

        updateHeader();
        updateProfileModal();

        await loadRecruiterJobsFromAPI();

        await loadRecruiterApplicantsFromAPI();

        showRecruiterDashboard();

        setTimeout(
            () => {
                closeModal(
                    els.recruiterProfileModal
                );
            },
            700
        );
    } catch (error) {
        message.textContent =
            error.message;

        message.style.color =
            "var(--danger)";
    }
}

async function submitPostJob(
    event
) {
    event.preventDefault();

    const message =
        $("postJobMessage");

    const recruiter =
        getCurrentRecruiter();

    if (!recruiter) {
        message.textContent =
            "Recruiter profile not found.";

        message.style.color =
            "var(--danger)";

        return;
    }

    if (
        recruiter.approvalStatus !==
        "Approved"
    ) {
        message.textContent =
            "Your recruiter account must be approved before posting jobs.";

        message.style.color =
            "var(--danger)";

        return;
    }

    try {
        await createRecruiterJob();

        message.textContent =
            "Job posted successfully! Waiting for admin approval.";

        message.style.color =
            "var(--success)";

        els.postJobForm?.reset();

        await loadRecruiterJobsFromAPI();

        await loadJobsFromAPI();

        setTimeout(
            () => {
                closeModal(
                    els.postJobModal
                );

                message.textContent =
                    "";
            },
            800
        );
    } catch (error) {
        message.textContent =
            error.message;

        message.style.color =
            "var(--danger)";
    }
}

async function submitEditJob(
    event
) {
    event.preventDefault();

    const message =
        $("editJobMessage");

    if (
        editingJobId === null
    ) {
        return;
    }

    try {
        await updateRecruiterJob(
            editingJobId
        );

        message.textContent =
            "Job updated successfully.";

        message.style.color =
            "var(--success)";

        await loadRecruiterJobsFromAPI();

        await loadJobsFromAPI();

        setTimeout(
            () => {
                closeModal(
                    els.editJobModal ||
                    $("editJobModal")
                );

                editingJobId =
                    null;
            },
            700
        );
    } catch (error) {
        message.textContent =
            error.message;

        message.style.color =
            "var(--danger)";
    }
}

async function openRecruiterApplicants(
    jobId
) {
    const job =
        getOwnRecruiterJobs().find(
            (item) =>
                Number(item.id) ===
                Number(jobId)
        );

    if (!job) {
        return;
    }

    selectedApplicantJobId =
        Number(jobId);

    let applicants =
        recruiterApplicants.filter(
            (application) =>
                Number(
                    application.jobId
                ) ===
                Number(jobId)
        );

    try {
        const data =
            await apiRequest(
                `/applications/job/${Number(
                    jobId
                )}/details`
            );

        applicants =
            (
                Array.isArray(data)
                    ? data
                    : []
            ).map(
                (application) =>
                    normalizeApplication(
                        application,
                        job
                    )
            );
    } catch (error) {
        console.error(
            "Unable to load applicant details:",
            error
        );
    }

    if ($("jobApplicantsModalTitle")) {
        $("jobApplicantsModalTitle").textContent =
            `${job.title} - Applicants`;
    }

    if (
        $("jobApplicantsModalDescription")
    ) {
        $("jobApplicantsModalDescription").textContent =
            `${applicants.length} applicant(s) applied for this job.`;
    }

    renderJobApplicants(
        applicants
    );

    openModal(
        els.jobApplicantsModal
    );
}

async function viewApplicationResume(
    applicationId
) {
    const token =
        getAccessToken();

    if (!token) {
        alert(
            "Please login first."
        );

        return;
    }

    try {
        const response =
            await fetch(
                `${API_BASE_URL}/applications/resume/${Number(
                    applicationId
                )}`,
                {
                    method:
                        "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        if (!response.ok) {
            const data =
                await parseResponse(
                    response
                );

            throw new Error(
                data?.detail ||
                "Unable to open resume."
            );
        }

        const blob =
            await response.blob();

        const url =
            URL.createObjectURL(
                blob
            );

        window.open(
            url,
            "_blank"
        );

        setTimeout(
            () => {
                URL.revokeObjectURL(
                    url
                );
            },
            60000
        );
    } catch (error) {
        alert(
            error.message
        );
    }
}

async function submitApplication(
    event
) {
    event.preventDefault();

    const message =
        $("applyMessage");

    if (
        getRole() !== "user" ||
        !getAccessToken()
    ) {
        closeModal(
            els.applyModal
        );

        openModal(
            els.loginModal
        );

        if ($("loginMessage")) {
            $("loginMessage").textContent =
                "Please login as a job seeker before applying.";

            $("loginMessage").style.color =
                "var(--danger)";
        }

        return;
    }

    const jobId =
        Number(
            $("applyJobId")
                ?.value ||
            selectedJobId
        );

    const resumeInput =
        $("applyResume");

    if (
        !resumeInput ||
        !resumeInput.files ||
        resumeInput.files.length ===
            0
    ) {
        message.textContent =
            "Please select a resume.";

        message.style.color =
            "var(--danger)";

        return;
    }

    const resume =
        resumeInput.files[0];

    const extension =
        (
            "." +
            (
                resume.name
                    .split(".")
                    .pop() || ""
            ).toLowerCase()
        );

    const allowed =
        [
            ".pdf",
            ".doc",
            ".docx"
        ];

    if (
        !allowed.includes(
            extension
        )
    ) {
        message.textContent =
            "Resume must be PDF, DOC, or DOCX.";

        message.style.color =
            "var(--danger)";

        return;
    }

    if (
        resume.size >
        10 * 1024 * 1024
    ) {
        message.textContent =
            "Resume must not exceed 10 MB.";

        message.style.color =
            "var(--danger)";

        return;
    }

    try {
        const formData =
            new FormData();

        formData.append(
            "job_id",
            String(jobId)
        );

        formData.append(
            "resume",
            resume
        );

        const coverLetter =
            $("coverLetter")
                ?.value
                .trim() || "";

        if (coverLetter) {
            formData.append(
                "cover_letter",
                coverLetter
            );
        }

        await apiRequest(
            "/applications/upload",
            {
                method:
                    "POST",

                body:
                    formData
            }
        );

        message.textContent =
            "Application submitted successfully!";

        message.style.color =
            "var(--success)";

        els.applyForm?.reset();

        await loadApplicationsFromAPI();

        updateDashboard();

        setTimeout(
            () => {
                closeModal(
                    els.applyModal
                );
            },
            800
        );
    } catch (error) {
        message.textContent =
            error.message;

        message.style.color =
            "var(--danger)";
    }
}

async function submitNormalSignup(
    event
) {
    event.preventDefault();

    const name =
        $("signupName")
            ?.value
            .trim() || "";

    const email =
        $("signupEmail")
            ?.value
            .trim()
            .toLowerCase() || "";

    const password =
        $("signupPassword")
            ?.value || "";

    const confirmPassword =
        $("signupConfirmPassword")
            ?.value || "";

    const message =
        $("signupMessage");

    if (!nameRegex.test(name)) {
        message.textContent =
            "Name can contain only letters, spaces, hyphens and apostrophes.";

        message.style.color =
            "var(--danger)";

        return;
    }

    if (!emailRegex.test(email)) {
        message.textContent =
            "Please enter a valid email address.";

        message.style.color =
            "var(--danger)";

        return;
    }

    if (
        !passwordRegex.test(
            password
        )
    ) {
        message.textContent =
            "Password must contain at least 8 characters, including uppercase, lowercase, number and special character.";

        message.style.color =
            "var(--danger)";

        return;
    }

    if (
        password !==
        confirmPassword
    ) {
        message.textContent =
            "Passwords do not match.";

        message.style.color =
            "var(--danger)";

        return;
    }

    try {
        const user =
            await apiRequest(
                "/auth/signup",
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify({
                            name,
                            email,
                            password
                        })
                }
            );

        saveCurrentUser(
            user
        );

        message.textContent =
            "Account created successfully! Please login.";

        message.style.color =
            "var(--success)";

        els.signupForm?.reset();

        setTimeout(
            () => {
                closeModal(
                    els.signupModal
                );

                openModal(
                    els.loginModal
                );

                if ($("loginEmail")) {
                    $("loginEmail").value =
                        email;
                }
            },
            800
        );
    } catch (error) {
        message.textContent =
            error.message;

        message.style.color =
            "var(--danger)";
    }
}

async function submitRecruiterSignup(
    event
) {
    event.preventDefault();

    const name =
        $("recruiterName")
            ?.value
            .trim() || "";

    const email =
        $("recruiterEmail")
            ?.value
            .trim()
            .toLowerCase() || "";

    const company =
        $("recruiterCompany")
            ?.value
            .trim() || "";

    const password =
        $("recruiterPassword")
            ?.value || "";

    const confirmPassword =
        $("recruiterConfirmPassword")
            ?.value || "";

    const message =
        $("recruiterSignupMessage");

    if (!nameRegex.test(name)) {
        message.textContent =
            "Name can contain only letters, spaces, hyphens and apostrophes.";

        message.style.color =
            "var(--danger)";

        return;
    }

    if (!emailRegex.test(email)) {
        message.textContent =
            "Please enter a valid email address.";

        message.style.color =
            "var(--danger)";

        return;
    }

    if (company.length < 2) {
        message.textContent =
            "Please enter your company name.";

        message.style.color =
            "var(--danger)";

        return;
    }

    if (
        !passwordRegex.test(
            password
        )
    ) {
        message.textContent =
            "Password must contain at least 8 characters, including uppercase, lowercase, number and special character.";

        message.style.color =
            "var(--danger)";

        return;
    }

    if (
        password !==
        confirmPassword
    ) {
        message.textContent =
            "Passwords do not match.";

        message.style.color =
            "var(--danger)";

        return;
    }

    try {
        const response =
            await apiRequest(
                "/auth/recruiter-signup",
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify({
                            name,
                            email,
                            company,
                            password
                        })
                }
            );

        const recruiter =
            normalizeAdminRecruiter({
                ...response,

                name,
                email,
                company,

                role:
                    "recruiter",

                status:
                    response?.status ||
                    "Active",

                approval_status:
                    response
                        ?.approval_status ||
                    response
                        ?.approvalStatus ||
                    "Pending"
            });

        saveCurrentRecruiter(
            recruiter
        );

        message.textContent =
            "Recruiter account created successfully! Waiting for admin approval.";

        message.style.color =
            "var(--success)";

        els.recruiterSignupForm?.reset();

        setTimeout(
            () => {
                closeModal(
                    els.recruiterSignupModal
                );

                openModal(
                    els.loginModal
                );

                if ($("loginEmail")) {
                    $("loginEmail").value =
                        email;
                }
            },
            900
        );
    } catch (error) {
        message.textContent =
            error.message;

        message.style.color =
            "var(--danger)";
    }
}

async function loginAsNormalUserOrRecruiter(
    email,
    password,
    messageElement
) {
    const data =
        await loginWithAPI(
            email,
            password
        );

    saveAccessToken(
        data.access_token
    );

    localStorage.setItem(
        STORAGE_KEYS.role,
        data.role
    );

    localStorage.setItem(
        STORAGE_KEYS.loggedIn,
        "true"
    );

    localStorage.removeItem(
        STORAGE_KEYS.adminLoggedIn
    );

    const me =
        await apiRequest(
            "/auth/me"
        );

    if (data.role === "recruiter") {

        const recruiter =
            await loadRecruiterProfile();

        if (!recruiter) {
            throw new Error(
                "Recruiter profile could not be loaded."
            );
        }

        localStorage.removeItem(
            STORAGE_KEYS.adminLoggedIn
        );

    } else if (data.role === "admin") {

        saveCurrentUser(me);

        localStorage.setItem(
            STORAGE_KEYS.adminLoggedIn,
            "true"
        );

        localStorage.setItem(
            STORAGE_KEYS.loggedIn,
            "true"
        );

    } else {

        saveCurrentUser(me);

        localStorage.removeItem(
            STORAGE_KEYS.adminLoggedIn
        );
    }

    if (messageElement) {
        messageElement.textContent =
            "Login successful!";

        messageElement.style.color =
            "var(--success)";
    }

    updateHeader();
    updateProfileModal();

    await loadJobsFromAPI();

    if (
        data.role === "user"
    ) {
        await loadApplicationsFromAPI();
    }

    if (
        data.role === "recruiter"
    ) {
        await loadRecruiterJobsFromAPI();

        await loadRecruiterApplicantsFromAPI();

        showRecruiterDashboard();
    }
    if (
        data.role === "admin"
    ) {
        await loadAdminData();

        showAdminDashboard();
    }

    return data;
}

async function submitLogin(
    event
) {
    event.preventDefault();

    const email =
        $("loginEmail")
            ?.value
            .trim()
            .toLowerCase() ||
        "";

    const password =
        $("loginPassword")
            ?.value ||
        "";

    const message =
        $("loginMessage");

    try {
        await loginAsNormalUserOrRecruiter(
            email,
            password,
            message
        );

        els.loginForm?.reset();

        setTimeout(
            () => {
                closeModal(
                    els.loginModal
                );
            },
            700
        );
    } catch (error) {
        message.textContent =
            error.message;

        message.style.color =
            "var(--danger)";
    }
}

async function submitAdminLogin(
    event
) {
    event.preventDefault();

    const email =
        $("adminLoginEmail")
            ?.value
            .trim()
            .toLowerCase() ||
        "";

    const password =
        $("adminLoginPassword")
            ?.value ||
        "";

    const message =
        els.adminLoginMessage;

    try {
        const data =
            await loginWithAPI(
                email,
                password
            );

        if (
            data.role !==
            "admin"
        ) {
            throw new Error(
                "This account does not have admin access."
            );
        }

        saveAccessToken(
            data.access_token
        );

        localStorage.setItem(
            STORAGE_KEYS.role,
            "admin"
        );

        localStorage.setItem(
            STORAGE_KEYS.loggedIn,
            "true"
        );

        localStorage.setItem(
            STORAGE_KEYS.adminLoggedIn,
            "true"
        );

        localStorage.removeItem(
            STORAGE_KEYS.recruiter
        );

        const me =
            await apiRequest(
                "/auth/me"
            );

        saveCurrentUser(
            me
        );

        message.textContent =
            "Admin login successful!";

        message.style.color =
            "var(--success)";

        els.adminLoginForm?.reset();

        await loadAdminData();

        setTimeout(
            () => {
                closeModal(
                    els.adminLoginModal
                );

                updateHeader();

                showAdminDashboard();
            },
            500
        );
    } catch (error) {
        message.textContent =
            error.message;

        message.style.color =
            "var(--danger)";
    }
}

async function loadAdminData() {
    if (
        !isAdminLoggedIn()
    ) {
        return;
    }

    try {
        const [
            users,
            recruiters,
            apiJobs
        ] = await Promise.all([
            apiRequest(
                "/admin/users"
            ),

            apiRequest(
                "/admin/recruiters"
            ),

            apiRequest(
                "/admin/jobs"
            )
        ]);

        adminUsers =
            (
                Array.isArray(users)
                    ? users
                    : []
            ).map(
                normalizeAdminUser
            );

        adminRecruiters =
            (
                Array.isArray(
                    recruiters
                )
                    ? recruiters
                    : []
            ).map(
                normalizeAdminRecruiter
            );

        adminJobs =
            (
                Array.isArray(
                    apiJobs
                )
                    ? apiJobs
                    : []
            )
                .map(
                    normalizeJob
                )
                .filter(Boolean);

        renderAdminUsers();
        renderAdminRecruiters();
        renderAdminJobs();

        await loadAdminStatistics();
    } catch (error) {
        console.error(
            "Failed to load admin data:",
            error
        );

        alert(
            error.message
        );
    }
}

async function loadAdminStatistics() {
    try {
        const stats =
            await apiRequest(
                "/admin/stats"
            );

        if ($("adminTotalUsers")) {
            $("adminTotalUsers").textContent =
                stats.total_users ??
                adminUsers.length;
        }

        if (
            $("adminTotalRecruiters")
        ) {
            $("adminTotalRecruiters").textContent =
                stats.total_recruiters ??
                adminRecruiters.length;
        }

        if ($("adminTotalJobs")) {
            $("adminTotalJobs").textContent =
                stats.total_jobs ??
                adminJobs.length;
        }

        if (
            $("adminPendingApprovals")
        ) {
            $("adminPendingApprovals").textContent =
                stats.pending_approvals ??
                0;
        }
    } catch (error) {
        console.error(
            "Failed to load admin statistics:",
            error
        );

        updateAdminStatisticsFromLocalData();
    }
}

function updateAdminStatisticsFromLocalData() {
    if ($("adminTotalUsers")) {
        $("adminTotalUsers").textContent =
            adminUsers.length;
    }

    if (
        $("adminTotalRecruiters")
    ) {
        $("adminTotalRecruiters").textContent =
            adminRecruiters.length;
    }

    if ($("adminTotalJobs")) {
        $("adminTotalJobs").textContent =
            adminJobs.length;
    }

    if (
        $("adminPendingApprovals")
    ) {
        const pendingRecruiters =
            adminRecruiters.filter(
                (recruiter) =>
                    recruiter.approvalStatus ===
                    "Pending"
            ).length;

        const pendingJobs =
            adminJobs.filter(
                (job) =>
                    job.source ===
                        "recruiter" &&
                    job.approvalStatus ===
                        "Pending"
            ).length;

        $("adminPendingApprovals").textContent =
            pendingRecruiters +
            pendingJobs;
    }
}

function renderAdminUsers() {
    const container =
        $("adminUsersContainer");

    if (!container) {
        return;
    }

    const search =
        (
            $("adminUserSearchInput")
                ?.value ||
            ""
        )
            .trim()
            .toLowerCase();

    const users =
        adminUsers.filter(
            (user) =>
                !search ||
                user.name
                    .toLowerCase()
                    .includes(search) ||
                user.email
                    .toLowerCase()
                    .includes(search)
        );

    container.innerHTML =
        "";

    if (!users.length) {
        container.innerHTML = `
            <div class="admin-empty-state">
                <h3>
                    No users found
                </h3>

                <p>
                    No job seekers match your search.
                </p>
            </div>
        `;

        return;
    }

    users.forEach(
        (user) => {
            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "admin-user-card";

            const active =
                user.status ===
                "Active";

            card.innerHTML = `
                <div class="admin-user-info">
                    <div class="admin-user-avatar">
                        ${escapeHtml(
                            getInitials(
                                user.name
                            )
                        )}
                    </div>

                    <div class="admin-user-details">
                        <h4>
                            ${escapeHtml(
                                user.name
                            )}
                        </h4>

                        <p>
                            ${escapeHtml(
                                user.email
                            )}
                        </p>

                        <p>
                            Role: Job Seeker
                        </p>
                    </div>
                </div>

                <div class="admin-card-actions">
                    <span class="admin-status-badge">
                        ${escapeHtml(
                            user.status
                        )}
                    </span>

                    <button
                        type="button"
                        class="outline-button"
                        data-admin-user-toggle="${Number(
                            user.id
                        )}"
                        data-current-status="${escapeHtml(
                            user.status
                        )}"
                    >
                        ${
                            active
                                ? "Deactivate"
                                : "Activate"
                        }
                    </button>

                    <button
                        type="button"
                        class="danger-button"
                        data-admin-delete-user="${Number(
                            user.id
                        )}"
                    >
                        Delete
                    </button>
                </div>
            `;

            container.appendChild(
                card
            );
        }
    );
}

function renderAdminRecruiters() {
    const container =
        $("adminRecruitersContainer");

    if (!container) {
        return;
    }

    const search =
        (
            $("adminRecruiterSearchInput")
                ?.value ||
            ""
        )
            .trim()
            .toLowerCase();

    const recruiters =
        adminRecruiters.filter(
            (recruiter) =>
                !search ||
                recruiter.name
                    .toLowerCase()
                    .includes(search) ||
                recruiter.email
                    .toLowerCase()
                    .includes(search) ||
                recruiter.company
                    .toLowerCase()
                    .includes(search)
        );

    container.innerHTML =
        "";

    if (!recruiters.length) {
        container.innerHTML = `
            <div class="admin-empty-state">
                <h3>
                    No recruiters found
                </h3>

                <p>
                    No recruiter accounts match your search.
                </p>
            </div>
        `;

        return;
    }

    recruiters.forEach(
        (recruiter) => {
            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "admin-recruiter-card";

            card.innerHTML = `
                <div class="admin-recruiter-info">
                    <div class="admin-recruiter-avatar">
                        ${escapeHtml(
                            recruiter.name
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </div>

                    <div class="admin-recruiter-details">
                        <h4>
                            ${escapeHtml(
                                recruiter.name
                            )}
                        </h4>

                        <p>
                            ${escapeHtml(
                                recruiter.email
                            )}
                        </p>

                        <p>
                            Company:
                            ${escapeHtml(
                                recruiter.company
                            )}
                        </p>
                    </div>
                </div>

                <div class="admin-card-actions">
                    <span class="admin-status-badge">
                        ${escapeHtml(
                            recruiter.approvalStatus
                        )}
                    </span>

                    <button
                        type="button"
                        class="outline-button"
                        data-admin-review-recruiter="${Number(
                            recruiter.id
                        )}"
                    >
                        Review
                    </button>

                    <button
                        type="button"
                        class="outline-button"
                        data-admin-toggle-recruiter="${Number(
                            recruiter.id
                        )}"
                    >
                        ${
                            recruiter.status ===
                            "Deactivated"
                                ? "Activate"
                                : "Deactivate"
                        }
                    </button>

                    <button
                        type="button"
                        class="danger-button"
                        data-admin-delete-recruiter="${Number(
                            recruiter.id
                        )}"
                    >
                        Delete
                    </button>
                </div>
            `;

            container.appendChild(
                card
            );
        }
    );
}

function getAdminJobStatus(
    job
) {
    if (
        job.source ===
        "recruiter"
    ) {
        return (
            job.approvalStatus ||
            "Pending"
        );
    }

    return job.status ===
        "Closed"
        ? "Closed"
        : "Approved";
}

function renderAdminJobs() {
    const container =
        $("adminJobsContainer");

    if (!container) {
        return;
    }

    const search =
        (
            $("adminJobSearchInput")
                ?.value ||
            ""
        )
            .trim()
            .toLowerCase();

    const filter =
        $("adminJobStatusFilter")
            ?.value ||
        "";

    const filtered =
        adminJobs.filter(
            (job) => {
                const searchable =
                    [
                        job.title,
                        job.company,
                        job.location,
                        job.category,
                        job.description
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                const status =
                    getAdminJobStatus(
                        job
                    );

                return (
                    (!search ||
                        searchable.includes(
                            search
                        )) &&
                    (!filter ||
                        status ===
                            filter)
                );
            }
        );

    container.innerHTML =
        "";

    if (!filtered.length) {
        container.innerHTML = `
            <div class="admin-empty-state">
                <h3>
                    No jobs found
                </h3>

                <p>
                    No jobs match the selected criteria.
                </p>
            </div>
        `;

        return;
    }

    filtered.forEach(
        (job) => {
            const status =
                getAdminJobStatus(
                    job
                );

            const source =
                job.source ===
                "recruiter"
                    ? "Recruiter Job"
                    : "System Job";

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "admin-job-card";

            card.innerHTML = `
                <div class="admin-job-info">
                    <div class="admin-job-icon">
                        💼
                    </div>

                    <div class="admin-job-details">
                        <h4>
                            ${escapeHtml(
                                job.title
                            )}
                        </h4>

                        <p>
                            ${escapeHtml(
                                job.company
                            )}
                            ·
                            ${escapeHtml(
                                job.location
                            )}
                        </p>

                        <p>
                            ${escapeHtml(
                                source
                            )}
                        </p>

                        <p>
                            ${escapeHtml(
                                job.workMode ||
                                "Not specified"
                            )}
                        </p>
                    </div>
                </div>

                <div class="admin-card-actions">
                    <span class="admin-status-badge">
                        ${escapeHtml(
                            status
                        )}
                    </span>

                    <button
                        type="button"
                        class="outline-button"
                        data-admin-review-job="${Number(
                            job.id
                        )}"
                    >
                        Review
                    </button>

                    ${
                        job.source ===
                            "recruiter" &&
                        status !==
                            "Approved"
                            ? `
                                <button
                                    type="button"
                                    class="primary-button"
                                    data-admin-approve-job="${Number(
                                        job.id
                                    )}"
                                >
                                    Approve
                                </button>
                            `
                            : ""
                    }

                    ${
                        job.source ===
                            "recruiter" &&
                        status !==
                            "Rejected"
                            ? `
                                <button
                                    type="button"
                                    class="outline-button"
                                    data-admin-reject-job="${Number(
                                        job.id
                                    )}"
                                >
                                    Reject
                                </button>
                            `
                            : ""
                    }

                    <button
                        type="button"
                        class="danger-button"
                        data-admin-delete-job="${Number(
                            job.id
                        )}"
                    >
                        Delete
                    </button>
                </div>
            `;

            container.appendChild(
                card
            );
        }
    );
}

function showAdminDashboard() {
    if (
        !isAdminLoggedIn()
    ) {
        return;
    }

    $("recruiterDashboard")
        ?.classList.add(
            "hidden"
        );

    els.adminDashboard
        ?.classList.remove(
            "hidden"
        );

    if ($("adminDashboardName")) {
        $("adminDashboardName").textContent =
            "Admin";
    }

    if ($("adminDashboardAvatar")) {
        $("adminDashboardAvatar").textContent =
            "A";
    }

    renderAdminUsers();
    renderAdminRecruiters();
    renderAdminJobs();

    updateAdminStatisticsFromLocalData();

    els.adminDashboard?.scrollIntoView({
        behavior: "smooth"
    });
}

function openAdminRecruiterReview(
    recruiterId
) {
    const recruiter =
        adminRecruiters.find(
            (item) =>
                Number(item.id) ===
                Number(recruiterId)
        );

    if (!recruiter) {
        return;
    }

    adminSelectedRecruiterId =
        Number(
            recruiter.id
        );

    if (
        $("adminRecruiterReviewTitle")
    ) {
        $("adminRecruiterReviewTitle").textContent =
            recruiter.name;
    }

    if (
        $("adminRecruiterReviewContent")
    ) {
        $("adminRecruiterReviewContent").innerHTML = `
            <div class="admin-review-row">
                <span class="admin-review-label">
                    Name
                </span>

                <span class="admin-review-value">
                    ${escapeHtml(
                        recruiter.name
                    )}
                </span>
            </div>

            <div class="admin-review-row">
                <span class="admin-review-label">
                    Email
                </span>

                <span class="admin-review-value">
                    ${escapeHtml(
                        recruiter.email
                    )}
                </span>
            </div>

            <div class="admin-review-row">
                <span class="admin-review-label">
                    Company
                </span>

                <span class="admin-review-value">
                    ${escapeHtml(
                        recruiter.company
                    )}
                </span>
            </div>

            <div class="admin-review-row">
                <span class="admin-review-label">
                    Account Status
                </span>

                <span class="admin-review-value">
                    ${escapeHtml(
                        recruiter.status
                    )}
                </span>
            </div>

            <div class="admin-review-row">
                <span class="admin-review-label">
                    Approval
                </span>

                <span class="admin-review-value">
                    ${escapeHtml(
                        recruiter.approvalStatus
                    )}
                </span>
            </div>
        `;
    }

    openModal(
        els.adminRecruiterReviewModal
    );
}

async function updateRecruiterApproval(
    recruiterId,
    status
) {
    try {
        const endpoint =
            status ===
            "Approved"
                ? `/admin/recruiters/${Number(
                    recruiterId
                )}/approve`
                : `/admin/recruiters/${Number(
                    recruiterId
                )}/reject`;

        await apiRequest(
            endpoint,
            {
                method:
                    "PUT"
            }
        );

        closeModal(
            els.adminRecruiterReviewModal
        );

        await loadAdminData();
    } catch (error) {
        alert(
            error.message
        );
    }
}

function openAdminJobReview(
    jobId
) {
    const job =
        adminJobs.find(
            (item) =>
                Number(item.id) ===
                Number(jobId)
        );

    if (!job) {
        return;
    }

    adminSelectedJobId =
        Number(job.id);

    const skills =
        normalizeJobSkills(
            job
        );

    if ($("adminJobReviewTitle")) {
        $("adminJobReviewTitle").textContent =
            job.title;
    }

    if (
        $("adminJobReviewContent")
    ) {
        $("adminJobReviewContent").innerHTML = `
            <div class="admin-review-row">
                <span class="admin-review-label">
                    Job Title
                </span>

                <span class="admin-review-value">
                    ${escapeHtml(
                        job.title
                    )}
                </span>
            </div>

            <div class="admin-review-row">
                <span class="admin-review-label">
                    Company
                </span>

                <span class="admin-review-value">
                    ${escapeHtml(
                        job.company
                    )}
                </span>
            </div>

            <div class="admin-review-row">
                <span class="admin-review-label">
                    Location
                </span>

                <span class="admin-review-value">
                    ${escapeHtml(
                        job.location
                    )}
                </span>
            </div>

            <div class="admin-review-row">
                <span class="admin-review-label">
                    Experience
                </span>

                <span class="admin-review-value">
                    ${escapeHtml(
                        job.experience ||
                        "Not specified"
                    )}
                </span>
            </div>

            <div class="admin-review-row">
                <span class="admin-review-label">
                    Work Mode
                </span>

                <span class="admin-review-value">
                    ${escapeHtml(
                        job.workMode ||
                        "Not specified"
                    )}
                </span>
            </div>

            <div class="admin-review-row">
                <span class="admin-review-label">
                    Salary
                </span>

                <span class="admin-review-value">
                    ${escapeHtml(
                        job.salary ||
                        "Not specified"
                    )}
                </span>
            </div>

            <div class="admin-review-row">
                <span class="admin-review-label">
                    Skills
                </span>

                <span class="admin-review-value">
                    ${
                        skills.length
                            ? skills
                                .map(
                                    escapeHtml
                                )
                                .join(
                                    ", "
                                )
                            : "Not specified"
                    }
                </span>
            </div>

            <div class="admin-review-row">
                <span class="admin-review-label">
                    Status
                </span>

                <span class="admin-review-value">
                    ${escapeHtml(
                        getAdminJobStatus(
                            job
                        )
                    )}
                </span>
            </div>

            <div class="admin-review-description">
                <h4>
                    Description
                </h4>

                <p>
                    ${escapeHtml(
                        job.description ||
                        "No description provided."
                    )}
                </p>
            </div>
        `;
    }

    openModal(
        els.adminJobReviewModal
    );
}

async function updateJobApproval(
    jobId,
    status
) {
    try {
        const endpoint =
            status ===
            "Approved"
                ? `/admin/jobs/${Number(
                    jobId
                )}/approve`
                : `/admin/jobs/${Number(
                    jobId
                )}/reject`;

        await apiRequest(
            endpoint,
            {
                method:
                    "PUT"
            }
        );

        closeModal(
            els.adminJobReviewModal
        );

        await Promise.all([
            loadJobsFromAPI(),
            loadAdminData()
        ]);
    } catch (error) {
        alert(
            error.message
        );
    }
}

function openAdminDeleteConfirmation(
    type,
    id
) {
    adminDeleteType =
        type;

    adminDeleteId =
        id;

    const titles = {
        user:
            "Delete User",

        recruiter:
            "Delete Recruiter",

        job:
            "Delete Job"
    };

    const messages = {
        user:
            "Are you sure you want to delete this user?",

        recruiter:
            "Are you sure you want to delete this recruiter and their jobs?",

        job:
            "Are you sure you want to delete this job?"
    };

    if (
        $("adminDeleteConfirmTitle")
    ) {
        $("adminDeleteConfirmTitle").textContent =
            titles[type] ||
            "Confirm Delete";
    }

    if (
        $("adminDeleteConfirmMessage")
    ) {
        $("adminDeleteConfirmMessage").textContent =
            messages[type] ||
            "Are you sure you want to delete this item?";
    }

    openModal(
        els.adminDeleteConfirmModal
    );
}

async function performAdminDelete() {
    if (
        !adminDeleteType ||
        adminDeleteId == null
    ) {
        return;
    }

    try {
        if (
            adminDeleteType ===
            "user"
        ) {
            await apiRequest(
                `/admin/users/${Number(
                    adminDeleteId
                )}`,
                {
                    method:
                        "DELETE"
                }
            );
        }

        if (
            adminDeleteType ===
            "recruiter"
        ) {
            await apiRequest(
                `/admin/recruiters/${Number(
                    adminDeleteId
                )}`,
                {
                    method:
                        "DELETE"
                }
            );
        }

        if (
            adminDeleteType ===
            "job"
        ) {
            await apiRequest(
                `/admin/jobs/${Number(
                    adminDeleteId
                )}`,
                {
                    method:
                        "DELETE"
                }
            );
        }

        adminDeleteType =
            null;

        adminDeleteId =
            null;

        closeModal(
            els.adminDeleteConfirmModal
        );

        await Promise.all([
            loadJobsFromAPI(),
            loadAdminData()
        ]);
    } catch (error) {
        alert(
            error.message
        );
    }
}

async function toggleAdminUser(userId, currentStatus) {
    const action =
        currentStatus === "Active"
            ? "deactivate"
            : "activate";

    await apiRequest(
        `/admin/users/${Number(userId)}/${action}`,
        { method: "PUT" }
    );
}

async function toggleAdminRecruiter(
    recruiterId,
    status
) {
    const action =
        status ===
        "Deactivated"
            ? "activate"
            : "deactivate";

    await apiRequest(
        `/admin/recruiters/${Number(
            recruiterId
        )}/${action}`,
        {
            method:
                "PUT"
        }
    );
}

function logout() {
    clearAuthentication();

    closeAllModals();

    jobs = [];
    recruiterJobs = [];
    recruiterApplicants = [];
    adminUsers = [];
    adminRecruiters = [];
    adminJobs = [];

    els.adminDashboard?.classList.add(
        "hidden"
    );

    $("recruiterDashboard")
        ?.classList.add(
            "hidden"
        );
    
    if ($("userProfilePage")) {
        $("userProfilePage").classList.add("hidden");
    }

    updateHeader();
    updateProfileModal();
    renderApplications();
    renderSavedJobs();
}

function calculateUserProfileCompletion(profile) {
    const fields = [
        profile.name,
        profile.email,
        profile.phone,
        profile.location,
        profile.education,
        profile.experience,
        profile.skills,
        profile.bio
    ];

    const completed = fields.filter(
        (value) =>
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
    ).length;

    return Math.round((completed / fields.length) * 100);
}

async function loadUserProfilePage() {
    const user = getCurrentUser();

    if (!user || getRole() !== "user" || !getAccessToken()) {
        return;
    }

    const messageElement = $("userProfileMessage");

    try {
        const profile = await apiRequest("/users/me/profile");

        currentUserProfile = profile;

        $("userProfileName").value = profile.name || "";
        $("userProfileEmail").value = profile.email || "";
        $("userProfilePhone").value = profile.phone || "";
        $("userProfileLocation").value = profile.location || "";
        $("userProfileEducation").value = profile.education || "";
        $("userProfileExperience").value = profile.experience || "";
        $("userProfileSkills").value = profile.skills || "";
        $("userProfileBio").value = profile.bio || "";

        $("userProfileDisplayName").textContent =
            profile.name || "User";

        $("userProfileDisplayEmail").textContent =
            profile.email || "";

        $("userProfileAvatar").textContent =
            getInitials(profile.name || "User");

        const percentage =
            calculateUserProfileCompletion(profile);

        $("profileCompletionPercentage").textContent =
            `${percentage}%`;

        $("profileCompletionBar").style.width =
            `${percentage}%`;

        if (percentage === 100) {
            $("profileCompletionMessage").textContent =
                "Your profile is complete!";
        } else {
            $("profileCompletionMessage").textContent =
                `Complete ${100 - percentage}% more of your profile.`;
        }

        updateProfileModal();

    } catch (error) {
        console.error("Failed to load user profile:", error);

        if (messageElement) {
            messageElement.textContent =
                `Unable to load profile: ${error.message}`;

            messageElement.style.color =
                "var(--danger)";
        }
    }
}

async function saveUserProfile() {
    const user = getCurrentUser();

    if (!user || getRole() !== "user" || !getAccessToken()) {
        return;
    }

    const messageElement = $("userProfileMessage");

    const profileData = {
        name: $("userProfileName").value.trim(),
        email: $("userProfileEmail").value.trim(),
        phone: $("userProfilePhone").value.trim() || null,
        location: $("userProfileLocation").value.trim() || null,
        education: $("userProfileEducation").value.trim() || null,
        experience: $("userProfileExperience").value.trim() || null,
        skills: $("userProfileSkills").value.trim() || null,
        bio: $("userProfileBio").value.trim() || null
    };

    try {
        const updatedProfile = await apiRequest(
            "/users/me/profile",
            {
                method: "PUT",
                body: JSON.stringify(profileData)
            }
        );

        currentUserProfile = updatedProfile;

        // Keep only the basic logged-in user information in localStorage.
        user.name = updatedProfile.name;
        user.email = updatedProfile.email;

        saveCurrentUser(user);

        updateHeader();
        updateProfileModal();

        await loadUserProfilePage();

        if (messageElement) {
            messageElement.textContent =
                "Profile saved successfully!";

            messageElement.style.color =
                "var(--success)";
        }

    } catch (error) {
        console.error("Failed to save user profile:", error);

        if (messageElement) {
            messageElement.textContent =
                `Unable to save profile: ${error.message}`;

            messageElement.style.color =
                "var(--danger)";
        }
    }
}

function setupEvents() {
    els.jobSearchForm?.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            searchJobs();

            $("jobs")?.scrollIntoView({
                behavior:
                    "smooth"
            });
        }
    );

    $("userProfileForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        await saveUserProfile();
    });

    $("userProfileLogoutButton")?.addEventListener("click", () => {
        logout();
    });

    $("backToSmartHireButton")?.addEventListener("click", () => {

        $("userProfilePage")?.classList.add("hidden");

        document.querySelectorAll(".content-section").forEach((section) => {
            section.classList.remove("hidden");
        });

        $("home")?.scrollIntoView({
            behavior: "smooth"
        });
    });

    document
        .querySelectorAll(
            ".quick-search-button"
        )
        .forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    () => {
                        if (
                            els.jobSearchInput
                        ) {
                            els.jobSearchInput.value =
                                button.dataset.search ||
                                "";
                        }

                        if (
                            els.locationSearchInput
                        ) {
                            els.locationSearchInput.value =
                                "";
                        }

                        if (
                            els.experienceFilter
                        ) {
                            els.experienceFilter.value =
                                "";
                        }

                        searchJobs();

                        $("jobs")?.scrollIntoView({
                            behavior:
                                "smooth"
                        });
                    }
                );
            }
        );

    $("categoryGrid")?.addEventListener(
        "click",
        (event) => {
            const button =
                event.target.closest(
                    "[data-category]"
                );

            if (!button) {
                return;
            }

            const category =
                button.dataset.category ||
                "";

            const map = {
                Data:
                    "Data",

                Frontend:
                    "Frontend",

                Backend:
                    "Backend",

                DevOps:
                    "Cloud"
            };

            if (
                els.jobSearchInput
            ) {
                els.jobSearchInput.value =
                    map[category] ||
                    category;
            }

            if (
                els.locationSearchInput
            ) {
                els.locationSearchInput.value =
                    "";
            }

            if (
                els.experienceFilter
            ) {
                els.experienceFilter.value =
                    "";
            }

            searchJobs();

            $("jobs")?.scrollIntoView({
                behavior:
                    "smooth"
            });
        }
    );

    els.jobResultsContainer?.addEventListener(
        "click",
        (event) => {
            const saveButton =
                event.target.closest(
                    "[data-save-job]"
                );

            if (saveButton) {
                toggleSavedJob(
                    Number(
                        saveButton.dataset
                            .saveJob
                    )
                );

                return;
            }

            const applyButton =
                event.target.closest(
                    "[data-apply-job]"
                );

            if (applyButton) {
                openApplyModal(
                    Number(
                        applyButton.dataset
                            .applyJob
                    )
                );

                return;
            }

            const detailsButton =
                event.target.closest(
                    "[data-job-id]"
                );

            if (detailsButton) {
                showJobDetails(
                    Number(
                        detailsButton.dataset
                            .jobId
                    )
                );
            }
        }
    );

    $("savedJobsContainer")?.addEventListener(
        "click",
        (event) => {
            const saveButton =
                event.target.closest(
                    "[data-save-job]"
                );

            if (saveButton) {
                toggleSavedJob(
                    Number(
                        saveButton.dataset
                            .saveJob
                    )
                );

                return;
            }

            const detailsButton =
                event.target.closest(
                    "[data-job-id]"
                );

            if (detailsButton) {
                showJobDetails(
                    Number(
                        detailsButton.dataset
                            .jobId
                    )
                );

                return;
            }

            const applyButton =
                event.target.closest(
                    "[data-apply-job]"
                );

            if (applyButton) {
                openApplyModal(
                    Number(
                        applyButton.dataset
                            .applyJob
                    )
                );
            }
        }
    );

    els.jobDetailsContent?.addEventListener(
        "click",
        (event) => {
            const saveButton =
                event.target.closest(
                    "[data-save-job]"
                );

            if (saveButton) {
                toggleSavedJob(
                    Number(
                        saveButton.dataset
                            .saveJob
                    )
                );

                return;
            }

            if (
                event.target.id ===
                "detailsApplyButton"
            ) {
                if (
                    selectedJobId !==
                    null
                ) {
                    closeModal(
                        els.jobDetailsModal
                    );

                    openApplyModal(
                        selectedJobId
                    );
                }

                return;
            }

            if (
                event.target.id ===
                "companyJobsButton"
            ) {
                closeAllModals();

                if (
                    els.jobSearchInput
                ) {
                    els.jobSearchInput.value =
                        event.target
                            .dataset
                            .company ||
                        "";
                }

                if (
                    els.locationSearchInput
                ) {
                    els.locationSearchInput.value =
                        "";
                }

                if (
                    els.experienceFilter
                ) {
                    els.experienceFilter.value =
                        "";
                }

                searchJobs();

                $("jobs")?.scrollIntoView({
                    behavior:
                        "smooth"
                });
            }
        }
    );

    $("companyGrid")?.addEventListener(
        "click",
        (event) => {
            const button =
                event.target.closest(
                    "[data-company]"
                );

            if (button) {
                showCompanyDetails(
                    button.dataset
                        .company
                );
            }
        }
    );

    $("viewAllJobsButton")?.addEventListener(
        "click",
        () => {
            if (
                els.jobSearchInput
            ) {
                els.jobSearchInput.value =
                    "";
            }

            if (
                els.locationSearchInput
            ) {
                els.locationSearchInput.value =
                    "";
            }

            if (
                els.experienceFilter
            ) {
                els.experienceFilter.value =
                    "";
            }

            renderJobs(
                getPublicJobs()
            );

            $("jobs")?.scrollIntoView({
                behavior:
                    "smooth"
            });
        }
    );

    $("viewAllCompaniesButton")?.addEventListener(
        "click",
        () => {
            $("companies")?.scrollIntoView({
                behavior:
                    "smooth"
            });
        }
    );

    els.loginButton?.addEventListener("click", () => {
        if (!isLoggedIn()) {
            openModal(els.loginModal);
            return;
        }

        if (getRole() === "admin") {
            showAdminDashboard();
        } else if (getRole() === "recruiter") {
            showRecruiterDashboard();
        } else {
            loadUserProfilePage();

            document.querySelectorAll(".content-section").forEach((section) => {
                section.classList.add("hidden");
            });

            $("userProfilePage")?.classList.remove("hidden");
            $("userProfilePage")?.scrollIntoView({
                behavior: "smooth"
            });
        }
    });

    els.signupButton?.addEventListener("click", () => {
        if (!isLoggedIn()) {
            openModal(els.signupModal);
            return;
        }

        if (getRole() === "admin") {
            showAdminDashboard();
        } else if (getRole() === "recruiter") {
            prepareRecruiterProfile();
            openModal(els.recruiterProfileModal);
        } else {
            loadUserProfilePage();

            document.querySelectorAll(".content-section").forEach((section) => {
                section.classList.add("hidden");
            });

            $("userProfilePage")?.classList.remove("hidden");
            $("userProfilePage")?.scrollIntoView({
                behavior: "smooth"
            });
        }
    });

    $("switchToSignupButton")?.addEventListener(
        "click",
        () => {
            closeModal(
                els.loginModal
            );

            openModal(
                els.signupModal
            );
        }
    );

    $("switchToLoginButton")?.addEventListener(
        "click",
        () => {
            closeModal(
                els.signupModal
            );

            openModal(
                els.loginModal
            );
        }
    );

    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    () => {
                        closeModal(
                            $(
                                button.dataset
                                    .closeModal
                            )
                        );
                    }
                );
            }
        );

    els.modalOverlay?.addEventListener(
        "click",
        closeAllModals
    );

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key ===
                "Escape"
            ) {
                closeAllModals();

                $(
                    "notificationPanel"
                )?.classList.add(
                    "hidden"
                );
            }
        }
    );

    els.signupForm?.addEventListener(
        "submit",
        submitNormalSignup
    );

    els.loginForm?.addEventListener(
        "submit",
        submitLogin
    );

    els.logoutButton?.addEventListener(
        "click",
        logout
    );

    els.applyForm?.addEventListener(
        "submit",
        submitApplication
    );

    document.addEventListener("click", (event) => {
        const recruiterLogoutButton =
            event.target.closest("#recruiterLogoutButton");

        if (recruiterLogoutButton) {
            logout();
        }
    });

    els.themeToggleButton?.addEventListener(
        "click",
        toggleTheme
    );

    els.notificationButton?.addEventListener(
        "click",
        () => {
            $(
                "notificationPanel"
            )?.classList.toggle(
                "hidden"
            );
        }
    );

    els.closeNotificationPanel?.addEventListener(
        "click",
        () => {
            $(
                "notificationPanel"
            )?.classList.add(
                "hidden"
            );
        }
    );

    els.mobileMenuButton?.addEventListener(
        "click",
        () => {
            els.mainNavigation?.classList.toggle(
                "open"
            );
        }
    );

    document
        .querySelectorAll(
            ".navigation-link"
        )
        .forEach(
            (link) => {
                link.addEventListener(
                    "click",
                    () => {
                        els.mainNavigation?.classList.remove(
                            "open"
                        );
                    }
                );
            }
        );

    els.jobAlertForm?.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            const role =
                $("alertRoleInput")
                    ?.value
                    .trim() || "";

            const location =
                $("alertLocationInput")
                    ?.value
                    .trim() || "";

            const frequency =
                $("alertFrequencySelect")
                    ?.value ||
                "Daily";

            const message =
                $("alertMessage");

            if (
                !role ||
                !location
            ) {
                message.textContent =
                    "Please enter a role and location.";

                message.style.color =
                    "var(--danger)";

                return;
            }

            localStorage.setItem(
                STORAGE_KEYS.jobAlert,
                JSON.stringify({
                    role,
                    location,
                    frequency
                })
            );

            message.textContent =
                `Job alert created for ${role} in ${location}.`;

            message.style.color =
                "var(--success)";

            els.jobAlertForm?.reset();
        }
    );

    els.recruiterSignupButton?.addEventListener(
        "click",
        () => {
            closeModal(
                els.signupModal
            );

            openModal(
                els.recruiterSignupModal
            );
        }
    );

    els.closeRecruiterSignupModal?.addEventListener(
        "click",
        () => {
            closeModal(
                els.recruiterSignupModal
            );
        }
    );

    els.recruiterSignupForm?.addEventListener(
        "submit",
        submitRecruiterSignup
    );

    els.postNewJobButton?.addEventListener(
        "click",
        () => {
            const recruiter =
                getCurrentRecruiter();

            if (
                getRole() !==
                    "recruiter" ||
                !recruiter
            ) {
                openModal(
                    els.loginModal
                );

                return;
            }

            if (
                recruiter.approvalStatus !==
                "Approved"
            ) {
                alert(
                    "Your recruiter account must be approved by the admin before posting jobs."
                );

                return;
            }

            els.postJobForm?.reset();

            if ($("postJobMessage")) {
                $("postJobMessage").textContent =
                    "";
            }

            openModal(
                els.postJobModal
            );
        }
    );

    els.postJobForm?.addEventListener(
        "submit",
        submitPostJob
    );

    els.editJobForm?.addEventListener(
        "submit",
        submitEditJob
    );

    els.recruiterProfileButton?.addEventListener(
        "click",
        () => {
            prepareRecruiterProfile();

            openModal(
                els.recruiterProfileModal
            );
        }
    );

    els.recruiterProfileForm?.addEventListener(
        "submit",
        submitRecruiterProfile
    );

    $("viewAllRecruiterJobsButton")?.addEventListener(
        "click",
        () => {
            $("recruiterJobsContainer")?.scrollIntoView({
                behavior:
                    "smooth"
            });
        }
    );

    $("viewAllApplicantsButton")?.addEventListener(
        "click",
        () => {
            $("recentApplicantsContainer")?.scrollIntoView({
                behavior:
                    "smooth"
            });
        }
    );

    els.adminLoginButton?.addEventListener(
        "click",
        () => {
            if (
                isAdminLoggedIn()
            ) {
                showAdminDashboard();
            } else {
                openModal(
                    els.adminLoginModal
                );
            }
        }
    );

    els.adminLoginForm?.addEventListener(
        "submit",
        submitAdminLogin
    );

    els.adminLogoutButton?.addEventListener(
        "click",
        logout
    );

    $("adminUserSearchInput")?.addEventListener(
        "input",
        renderAdminUsers
    );

    $("adminRecruiterSearchInput")?.addEventListener(
        "input",
        renderAdminRecruiters
    );

    $("adminJobSearchInput")?.addEventListener(
        "input",
        renderAdminJobs
    );

    $("adminJobStatusFilter")?.addEventListener(
        "change",
        renderAdminJobs
    );

    els.adminApproveRecruiterButton?.addEventListener(
        "click",
        async () => {
            if (
                adminSelectedRecruiterId !==
                null
            ) {
                await updateRecruiterApproval(
                    adminSelectedRecruiterId,
                    "Approved"
                );
            }
        }
    );

    els.adminRejectRecruiterButton?.addEventListener(
        "click",
        async () => {
            if (
                adminSelectedRecruiterId !==
                null
            ) {
                await updateRecruiterApproval(
                    adminSelectedRecruiterId,
                    "Rejected"
                );
            }
        }
    );

    els.adminApproveJobButton?.addEventListener(
        "click",
        async () => {
            if (
                adminSelectedJobId !==
                null
            ) {
                await updateJobApproval(
                    adminSelectedJobId,
                    "Approved"
                );
            }
        }
    );

    els.adminRejectJobButton?.addEventListener(
        "click",
        async () => {
            if (
                adminSelectedJobId !==
                null
            ) {
                await updateJobApproval(
                    adminSelectedJobId,
                    "Rejected"
                );
            }
        }
    );

    els.adminConfirmDeleteButton?.addEventListener(
        "click",
        performAdminDelete
    );

    document.addEventListener(
        "click",
        async (event) => {
            const resumeButton =
                event.target.closest(
                    ".view-resume-button"
                );

            if (resumeButton) {
                await viewApplicationResume(
                    Number(
                        resumeButton.dataset
                            .resumeId
                    )
                );

                return;
            }

            const deleteJobButton =
                event.target.closest(
                    ".delete-job-button"
                );

            if (deleteJobButton) {
                const jobId =
                    Number(
                        deleteJobButton.dataset
                            .jobId
                    );

                if (
                    !confirm(
                        "Are you sure you want to delete this job?"
                    )
                ) {
                    return;
                }

                try {
                    await apiRequest(
                        `/jobs/${Number(
                            jobId
                        )}`,
                        {
                            method:
                                "DELETE"
                        }
                    );

                    await loadRecruiterJobsFromAPI();

                    await loadJobsFromAPI();
                } catch (error) {
                    alert(
                        error.message
                    );
                }

                return;
            }

            const editButton =
                event.target.closest(
                    ".edit-job-button"
                );

            if (editButton) {
                const job =
                    recruiterJobs.find(
                        (item) =>
                            Number(
                                item.id
                            ) ===
                            Number(
                                editButton
                                    .dataset
                                    .jobId
                            )
                    );

                if (!job) {
                    return;
                }

                editingJobId =
                    Number(job.id);

                fillEditJobForm(
                    job
                );

                openModal(
                    els.editJobModal ||
                    $("editJobModal")
                );

                return;
            }

            const applicantsButton =
                event.target.closest(
                    ".view-applicants-button"
                );

            if (applicantsButton) {
                await openRecruiterApplicants(
                    Number(
                        applicantsButton.dataset
                            .jobId
                    )
                );

                return;
            }

            const reviewRecruiterButton =
                event.target.closest(
                    "[data-admin-review-recruiter]"
                );

            if (
                reviewRecruiterButton
            ) {
                openAdminRecruiterReview(
                    Number(
                        reviewRecruiterButton
                            .dataset
                            .adminReviewRecruiter
                    )
                );

                return;
            }

            const reviewJobButton =
                event.target.closest(
                    "[data-admin-review-job]"
                );

            if (reviewJobButton) {
                openAdminJobReview(
                    Number(
                        reviewJobButton
                            .dataset
                            .adminReviewJob
                    )
                );

                return;
            }

            const approveJobButton =
                event.target.closest(
                    "[data-admin-approve-job]"
                );

            if (approveJobButton) {
                await updateJobApproval(
                    Number(
                        approveJobButton.dataset
                            .adminApproveJob
                    ),
                    "Approved"
                );

                return;
            }

            const rejectJobButton =
                event.target.closest(
                    "[data-admin-reject-job]"
                );

            if (rejectJobButton) {
                await updateJobApproval(
                    Number(
                        rejectJobButton.dataset
                            .adminRejectJob
                    ),
                    "Rejected"
                );

                return;
            }

            const deleteUserButton =
                event.target.closest(
                    "[data-admin-delete-user]"
                );

            if (deleteUserButton) {
                openAdminDeleteConfirmation(
                    "user",
                    Number(
                        deleteUserButton.dataset
                            .adminDeleteUser
                    )
                );

                return;
            }

            const deleteRecruiterButton =
                event.target.closest(
                    "[data-admin-delete-recruiter]"
                );

            if (
                deleteRecruiterButton
            ) {
                openAdminDeleteConfirmation(
                    "recruiter",
                    Number(
                        deleteRecruiterButton.dataset
                            .adminDeleteRecruiter
                    )
                );

                return;
            }

            const deleteAdminJobButton =
                event.target.closest(
                    "[data-admin-delete-job]"
                );

            if (
                deleteAdminJobButton
            ) {
                openAdminDeleteConfirmation(
                    "job",
                    Number(
                        deleteAdminJobButton.dataset
                            .adminDeleteJob
                    )
                );

                return;
            }

            const toggleUserButton =
                event.target.closest(
                    "[data-admin-user-toggle]"
                );

            if (
                toggleUserButton
            ) {
                try {
                    await toggleAdminUser(
                        Number(
                            toggleUserButton
                                .dataset
                                .adminUserToggle
                        ),
                        toggleUserButton.dataset
                            .currentStatus ||
                            "Active"
                    );

                    await loadAdminData();
                } catch (error) {
                    alert(
                        error.message
                    );
                }

                return;
            }

            const toggleRecruiterButton =
                event.target.closest(
                    "[data-admin-toggle-recruiter]"
                );

            if (
                toggleRecruiterButton
            ) {
                const recruiterId =
                    Number(
                        toggleRecruiterButton
                            .dataset
                            .adminToggleRecruiter
                    );

                const recruiter =
                    adminRecruiters.find(
                        (item) =>
                            Number(
                                item.id
                            ) ===
                            recruiterId
                    );

                try {
                    await toggleAdminRecruiter(
                        recruiterId,
                        recruiter?.status ||
                            "Active"
                    );

                    await loadAdminData();
                } catch (error) {
                    alert(
                        error.message
                    );
                }
            }
        }
    );

    document.addEventListener(
        "change",
        async (event) => {
            const select =
                event.target.closest(
                    ".applicant-status-select"
                );

            if (!select) {
                return;
            }

            await updateRecruiterApplicationStatus(
                Number(
                    select.dataset
                        .applicantId
                ),
                select.value
            );

            if (
                selectedApplicantJobId !==
                null
            ) {
                const applicants =
                    recruiterApplicants.filter(
                        (application) =>
                            Number(
                                application.jobId
                            ) ===
                            Number(
                                selectedApplicantJobId
                            )
                    );

                renderJobApplicants(
                    applicants
                );
            }
        }
    );
}

async function initializeSession() {
    const token =
        getAccessToken();

    const role =
        getRole();

    if (
        !token ||
        !role
    ) {
        return;
    }

    try {
        const me =
            await apiRequest(
                "/auth/me"
            );

        if (
            role ===
            "recruiter"
        ) {
            await loadRecruiterProfile();
        } else {
            saveCurrentUser(
                me
            );
        }

        localStorage.setItem(
            STORAGE_KEYS.loggedIn,
            "true"
        );

        if (
            role ===
            "admin"
        ) {
            localStorage.setItem(
                STORAGE_KEYS.adminLoggedIn,
                "true"
            );
        } else {
            localStorage.removeItem(
                STORAGE_KEYS.adminLoggedIn
            );
        }
    } catch (error) {
        console.warn(
            "Stored session is invalid:",
            error.message
        );

        clearAuthentication();
    }
}

async function initializeApplication() {
    cacheElements();
    setupEvents();
    loadTheme();

    await initializeSession();

    if (!isLoggedIn() || getRole() !== "user") {
        $("userProfilePage")?.classList.add("hidden");
    }

    migrateLegacySavedJobs();
    updateHeader();
    updateProfileModal();

    try {
        await loadJobsFromAPI();
    } catch (_) {
        // loadJobsFromAPI already renders the error state.
    }

    if (getRole() === "user" && isLoggedIn()) {
        await loadApplicationsFromAPI();
    }

    if (getRole() === "recruiter" && isLoggedIn()) {
        await loadRecruiterJobsFromAPI();
        await loadRecruiterApplicantsFromAPI();
        showRecruiterDashboard();
    }

    if (getRole() === "admin" && isAdminLoggedIn()) {
        await loadAdminData();
        showAdminDashboard();
    }

    renderSavedJobs();
    updateDashboard();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApplication);
} else {
    initializeApplication();
}
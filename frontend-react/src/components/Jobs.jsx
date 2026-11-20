
import { useEffect, useState } from "react";
import { jobsAPI } from "../api";
import "./Jobs.css";

function normalizeJob(job) {
    const skills = Array.isArray(job.skills)
        ? job.skills
        : typeof job.skills === "string"
            ? job.skills
                .split(/[,|]/)
                .map((skill) => skill.trim())
                .filter(Boolean)
            : [];

    const jobType =
        job.job_type || job.jobType || "Not specified";

    return {
        ...job,
        id: job.id,
        title: job.title || "Untitled Job",
        company: job.company || "Company not specified",
        location: job.location || "Location not specified",
        salary: job.salary || "Salary not specified",
        experience: job.experience || "Not specified",
        description: job.description || "",
        jobType,
        workMode: job.workMode || job.work_mode || jobType,
        skills,
    };
}

function normalizeText(value) {
    return String(value ?? "")
        .toLowerCase()
        .replace(/[–—−]/g, "-")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeRange(value) {
    return normalizeText(value)
        .replace(/\s*-\s*/g, "-")
        .replace(/years?/g, "year");
}

function matchesExperience(jobExperience, selectedExperience) {
    if (!selectedExperience) {
        return true;
    }

    const actual = normalizeRange(jobExperience);
    const selected = normalizeRange(selectedExperience);

    if (
        selected === "fresher" ||
        selected === "0-2 year"
    ) {
        return (
            actual.includes("fresher") ||
            actual.includes("entry level") ||
            actual.includes("entry-level") ||
            actual.includes("0-2") ||
            actual.includes("0 year") ||
            actual.includes("no experience")
        );
    }

    return actual.includes(selected);
}

function Jobs({
    searchFilters = {},
    onLoginClick,
    loggedInUser,
    onApplyJob,
    onSaveJob,
    savedJobs = [],
}) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [pendingApplyJobId, setPendingApplyJobId] = useState(null);

    useEffect(() => {
        let isMounted = true;

        async function loadJobs() {
            try {
                setLoading(true);
                setErrorMessage("");

                const response = await jobsAPI.getAll();

                if (!Array.isArray(response)) {
                    throw new Error(
                        "The jobs API did not return a list of jobs."
                    );
                }

                if (isMounted) {
                    setJobs(response.map(normalizeJob));
                }
            } catch (error) {
                if (isMounted) {
                    setErrorMessage(
                        error.message ||
                            "Unable to load jobs right now."
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadJobs();

        return () => {
            isMounted = false;
        };
    }, []);

    const query = normalizeText(searchFilters.query);
    const locationQuery = normalizeText(searchFilters.location);
    const selectedExperience = searchFilters.experience || "";

    const filteredJobs = jobs.filter((job) => {
        const searchableText = [
            job.title,
            job.company,
            job.location,
            job.salary,
            job.experience,
            job.jobType,
            job.workMode,
            job.description,
            ...job.skills,
        ]
            .map(normalizeText)
            .join(" ");

        const matchesQuery =
            !query || searchableText.includes(query);

        const matchesLocation =
            !locationQuery ||
            normalizeText(job.location).includes(locationQuery);

        const matchesSelectedExperience = matchesExperience(
            job.experience,
            selectedExperience
        );

        return (
            matchesQuery &&
            matchesLocation &&
            matchesSelectedExperience
        );
    });

    const isJobSaved = (job) => {
        if (!loggedInUser) {
            return false;
        }

        return savedJobs.some(
            (savedJob) =>
                Number(savedJob.jobId) === Number(job.id) &&
                savedJob.userEmail === loggedInUser.email
        );
    };

    const handleSaveClick = (job) => {
        if (!loggedInUser) {
            onLoginClick?.();
            return;
        }

        if (loggedInUser.role !== "user") {
            window.alert(
                "Only job seekers can save jobs. Please log in with a job seeker account."
            );
            return;
        }

        if (isJobSaved(job)) {
            window.alert("You have already saved this job.");
            return;
        }

        onSaveJob?.(job);
    };

    const handleApplyClick = (job) => {
        if (!loggedInUser) {
            onLoginClick?.();
            return;
        }

        if (loggedInUser.role !== "user") {
            window.alert(
                "Only job seekers can apply for jobs. Please log in with a job seeker account."
            );
            return;
        }

        setPendingApplyJobId(job.id);

        document
            .getElementById(`resume-input-${job.id}`)
            ?.click();
    };

    const handleResumeSelected = async (job, event) => {
        const resumeFile = event.target.files?.[0];

        if (!resumeFile) {
            setPendingApplyJobId(null);
            return;
        }

        if (!/\.(pdf|doc|docx)$/i.test(resumeFile.name)) {
            window.alert("Please select a PDF, DOC, or DOCX resume.");
            event.target.value = "";
            setPendingApplyJobId(null);
            return;
        }

        try {
            await onApplyJob?.(job, resumeFile);
        } finally {
            event.target.value = "";
            setPendingApplyJobId(null);
        }
    };

    return (
        <section id="jobs" className="content-section">
            <div className="section-heading">
                <div>
                    <span className="section-label">
                        Opportunities
                    </span>

                    <h2 className="section-title">
                        Recommended Jobs
                    </h2>

                    <p className="section-description">
                        Explore jobs matched to your current search and preferences.
                    </p>

                    {!loading && !errorMessage && (
                        <p role="status">
                            Showing {filteredJobs.length} of {jobs.length} jobs
                        </p>
                    )}
                </div>

                <button
                    id="viewAllJobsButton"
                    className="outline-button"
                    type="button"
                    onClick={() =>
                        document.getElementById("jobs")?.scrollIntoView({
                            behavior: "smooth",
                        })
                    }
                >
                    View All Jobs
                </button>
            </div>

            {loading && (
                <p role="status">Loading jobs...</p>
            )}

            {!loading && errorMessage && (
                <p role="alert">{errorMessage}</p>
            )}

            {!loading && !errorMessage && jobs.length === 0 && (
                <p>No approved jobs are available at the moment.</p>
            )}

            {!loading &&
                !errorMessage &&
                jobs.length > 0 &&
                filteredJobs.length === 0 && (
                    <p>
                        No jobs match your search. Try another job title,
                        skill, company, location, or experience level.
                    </p>
                )}

            {!loading &&
                !errorMessage &&
                filteredJobs.length > 0 && (
                    <div className="job-grid">
                        {filteredJobs.map((job) => {
                            const saved = isJobSaved(job);

                            return (
                                <article
                                    className="job-card"
                                    key={job.id}
                                >
                                    <div className="job-card-top">
                                        <div className="job-company-logo">
                                            {job.company
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <button
                                            className="save-job-button"
                                            type="button"
                                            aria-label={
                                                saved
                                                    ? `Already saved ${job.title}`
                                                    : `Save ${job.title}`
                                            }
                                            aria-pressed={saved}
                                            onClick={() =>
                                                handleSaveClick(job)
                                            }
                                        >
                                            {saved ? "♥" : "♡"}
                                        </button>
                                    </div>

                                    <div>
                                        <h3>{job.title}</h3>

                                        <p className="job-company">
                                            {job.company}
                                        </p>

                                        <p className="job-location">
                                            📍 {job.location}
                                        </p>
                                    </div>

                                    <div className="job-tags">
                                        {job.skills.map((skill, index) => (
                                            <span
                                                className="job-tag"
                                                key={`${skill}-${index}`}
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>

                                    <p className="job-meta">
                                        {job.salary} · {job.experience} ·{" "}
                                        {job.workMode}
                                    </p>

                                    <div className="job-match">
                                        <span className="match-dot"></span>
                                        Job opportunity
                                    </div>

                                    <div className="job-actions">
                                        <button
                                            className="outline-button"
                                            type="button"
                                            onClick={() =>
                                                window.alert(
                                                    `${job.title}\n\n` +
                                                    `Company: ${job.company}\n` +
                                                    `Location: ${job.location}\n` +
                                                    `Job type: ${job.jobType}\n` +
                                                    `Work mode: ${job.workMode}\n` +
                                                    `Experience: ${job.experience}\n` +
                                                    `Salary: ${job.salary}\n\n` +
                                                    job.description
                                                )
                                            }
                                        >
                                            View Details
                                        </button>

                                        <button
                                            className="primary-button"
                                            type="button"
                                            disabled={
                                                pendingApplyJobId === job.id
                                            }
                                            onClick={() =>
                                                handleApplyClick(job)
                                            }
                                        >
                                            {pendingApplyJobId === job.id
                                                ? "Select Resume..."
                                                : "Apply"}
                                        </button>

                                        <input
                                            id={`resume-input-${job.id}`}
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            hidden
                                            onChange={(event) =>
                                                handleResumeSelected(
                                                    job,
                                                    event
                                                )
                                            }
                                        />
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
        </section>
    );
}

export default Jobs;

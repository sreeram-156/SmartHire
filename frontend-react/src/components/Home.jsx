
import { useState } from "react";
import "./Home.css";

function Home({ onSearch }) {
    const [query, setQuery] = useState("");
    const [location, setLocation] = useState("");
    const [experience, setExperience] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();

        onSearch?.({
            query: query.trim(),
            location: location.trim(),
            experience,
        });

        document.getElementById("jobs")?.scrollIntoView({
            behavior: "smooth",
        });
    };

    const handlePopularSearch = (value) => {
        setQuery(value);

        onSearch?.({
            query: value,
            location: "",
            experience: "",
        });

        document.getElementById("jobs")?.scrollIntoView({
            behavior: "smooth",
        });
    };

    return (
        <section id="home" className="hero-section">
            <div className="hero-overlay"></div>

            <div className="hero-content">
                <span className="hero-badge">
                    ✨ Smart Job Discovery
                </span>

                <h1 className="hero-title">
                    Find a Job That Fits You
                </h1>

                <p className="hero-description">
                    Discover opportunities based on your skills, experience,
                    career goals and preferences.
                </p>

                <form
                    className="job-search-form"
                    onSubmit={handleSubmit}
                >
                    <div className="search-field">
                        <label htmlFor="jobSearchInput">
                            Job, skill or company
                        </label>

                        <input
                            id="jobSearchInput"
                            className="search-input"
                            type="text"
                            placeholder="Python, Data Engineer, Google..."
                            value={query}
                            onChange={(event) =>
                                setQuery(event.target.value)
                            }
                        />
                    </div>

                    <div className="search-field">
                        <label htmlFor="locationSearchInput">
                            Location
                        </label>

                        <input
                            id="locationSearchInput"
                            className="search-input"
                            type="text"
                            placeholder="Hyderabad, Bangalore, Remote..."
                            value={location}
                            onChange={(event) =>
                                setLocation(event.target.value)
                            }
                        />
                    </div>

                    <div className="search-field search-experience-field">
                        <label htmlFor="experienceFilter">
                            Experience
                        </label>

                        <select
                            id="experienceFilter"
                            className="search-input"
                            value={experience}
                            onChange={(event) =>
                                setExperience(event.target.value)
                            }
                        >
                            <option value="">
                                Any experience
                            </option>

                            <option value="Fresher">
                                Fresher
                            </option>

                            <option value="0-2 Years">
                                0-2 Years
                            </option>

                            <option value="2-5 Years">
                                2-5 Years
                            </option>
                        </select>
                    </div>

                    <button
                        className="primary-button search-button"
                        type="submit"
                    >
                        🔍 Search Jobs
                    </button>
                </form>

                <div className="quick-search-container">
                    <span className="quick-search-label">
                        Popular:
                    </span>

                    {[
                        "Python",
                        "Data Engineer",
                        "Full Stack",
                        "Remote",
                    ].map((item) => (
                        <button
                            key={item}
                            className="quick-search-button"
                            type="button"
                            onClick={() => handlePopularSearch(item)}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Home;

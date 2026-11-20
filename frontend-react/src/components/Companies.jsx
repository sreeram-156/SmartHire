import "./Companies.css";

const companies = [
    {
        initial: "A",
        name: "Accenture",
        jobs: "700+ jobs"
    },
    {
        initial: "C",
        name: "Capgemini",
        jobs: "650+ jobs"
    },
    {
        initial: "M",
        name: "Microsoft",
        jobs: "100+ jobs"
    },
    {
        initial: "G",
        name: "Google",
        jobs: "150+ jobs"
    }
];

function Companies() {
    return (
        <section id="companies" className="companies-section">
            <div className="section-heading">
                <div>
                    <span className="section-label">
                        Discover
                    </span>

                    <h2 className="section-title">
                        Top Companies
                    </h2>

                    <p className="section-description">
                        Explore employers, open positions and company insights.
                    </p>
                </div>

                <button
                    id="viewAllCompaniesButton"
                    className="outline-button"
                    type="button"
                >
                    Explore Companies
                </button>
            </div>

            <div id="companyGrid" className="company-grid">
                {companies.map((company) => (
                    <article
                        className="company-card"
                        key={company.name}
                    >
                        <div className="company-logo-placeholder">
                            {company.initial}
                        </div>

                        <div>
                            <h3>{company.name}</h3>

                            <p>
                                Technology · {company.jobs}
                            </p>
                        </div>

                        <button
                            className="company-details-button"
                            type="button"
                        >
                            View Company
                        </button>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default Companies;
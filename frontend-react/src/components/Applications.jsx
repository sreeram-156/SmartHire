import "./Applications.css";

const stats = [
    {
        icon: "📨",
        value: 2,
        label: "Applied"
    },
    {
        icon: "🔎",
        value: 1,
        label: "Under Review"
    },
    {
        icon: "🎤",
        value: 0,
        label: "Interviews"
    },
    {
        icon: "❤️",
        value: 0,
        label: "Saved Jobs"
    }
];

function Applications() {
    return (
        <section
            id="applications"
            className="applications-section"
        >
            <div className="section-heading">
                <div>
                    <span className="section-label">
                        Track Progress
                    </span>

                    <h2 className="section-title">
                        Application Dashboard
                    </h2>

                    <p className="section-description">
                        Keep your job search organized from application to interview.
                    </p>
                </div>
            </div>

            <div className="dashboard-grid">
                {stats.map((stat) => (
                    <article
                        className="dashboard-stat"
                        key={stat.label}
                    >
                        <span className="dashboard-icon">
                            {stat.icon}
                        </span>

                        <strong>{stat.value}</strong>

                        <span>{stat.label}</span>
                    </article>
                ))}
            </div>

            <div className="application-list">
                <div className="empty-state">
                    <span className="empty-state-icon">
                        📋
                    </span>

                    <h3>
                        No applications yet
                    </h3>

                    <p>
                        Apply to a job and your application will appear here.
                    </p>
                </div>
            </div>
        </section>
    );
}

export default Applications;
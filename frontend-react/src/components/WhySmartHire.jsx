import "./WhySmartHire.css";

const features = [
    {
        icon: "🎯",
        title: "Smart Matching",
        description:
            "Understand how your skills and preferences match each opportunity."
    },
    {
        icon: "📌",
        title: "Application Tracking",
        description:
            "Keep applications, interviews and saved jobs organized."
    },
    {
        icon: "🛡️",
        title: "Job Verification",
        description:
            "Show verification information to help users evaluate listings."
    },
    {
        icon: "🚀",
        title: "Career Growth",
        description:
            "Use resume, skill and interview tools to prepare for your next role."
    }
];

function WhySmartHire() {
    return (
        <section id="whySmartHire" className="why-smart-hire-section">
            <div className="centered-heading">
                <span className="section-label">
                    Why SmartHire
                </span>

                <h2 className="section-title">
                    More Than a Job Listing Website
                </h2>

                <p className="section-description">
                    Search, understand, apply, track and improve your
                    career journey in one place.
                </p>
            </div>

            <div className="features-grid">
                {features.map((feature) => (
                    <article
                        className="feature-card"
                        key={feature.title}
                    >
                        <span className="feature-icon">
                            {feature.icon}
                        </span>

                        <h3>{feature.title}</h3>

                        <p>{feature.description}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default WhySmartHire;
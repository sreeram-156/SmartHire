import "./SmartMatching.css";

const matchingPoints = [
    "✓ Skills",
    "✓ Location",
    "✓ Experience",
    "✓ Salary preference",
    "✓ Work mode"
];

function SmartMatching() {
    return (
        <section
            id="smartMatching"
            className="smart-matching-section"
        >
            <div className="matching-layout">

                <div>
                    <span className="section-label">
                        SmartHire Intelligence
                    </span>

                    <h2 className="section-title">
                        Understand Why a Job Matches You
                    </h2>

                    <p className="section-description">
                        SmartHire can explain matching factors instead of showing
                        a score without context.
                    </p>

                    <div className="matching-points">
                        {matchingPoints.map((point) => (
                            <span key={point}>
                                {point}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="match-preview-card">

                    <div className="match-header">
                        <div>
                            <span className="match-label">
                                Example Match
                            </span>

                            <h3>
                                Python Developer
                            </h3>

                            <p>
                                Accenture · Hyderabad
                            </p>
                        </div>

                        <strong className="match-score">
                            92%
                        </strong>
                    </div>

                    <div className="match-progress">
                        <span></span>
                    </div>

                    <div className="skill-match-list">
                        <span className="match-skill matched">
                            Python ✓
                        </span>

                        <span className="match-skill matched">
                            SQL ✓
                        </span>

                        <span className="match-skill matched">
                            FastAPI ✓
                        </span>

                        <span className="match-skill missing">
                            AWS △
                        </span>
                    </div>

                </div>
            </div>
        </section>
    );
}

export default SmartMatching;
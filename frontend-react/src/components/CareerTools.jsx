import "./CareerTools.css";

const tools = [
    {
        icon: "📄",
        title: "Resume Builder",
        description: "Create a structured resume for your target role.",
        button: "Explore"
    },
    {
        icon: "🎯",
        title: "ATS Resume Checker",
        description: "Compare your resume against a job description.",
        button: "Check Resume"
    },
    {
        icon: "🧩",
        title: "Skill Gap Analyzer",
        description: "Find skills you may need for your target roles.",
        button: "Analyze Skills"
    },
    {
        icon: "🎤",
        title: "Interview Prep",
        description: "Practice technical and role-specific interview questions.",
        button: "Start Practice"
    }
];

function CareerTools() {
    return (
        <section id="careerTools" className="career-tools-section">
            <div className="section-heading">
                <div>
                    <span className="section-label">
                        Career Growth
                    </span>

                    <h2 className="section-title">
                        Career Tools
                    </h2>

                    <p className="section-description">
                        Tools to help you prepare, apply and improve.
                    </p>
                </div>
            </div>

            <div className="career-tools-grid">
                {tools.map((tool) => (
                    <article
                        className="career-tool-card"
                        key={tool.title}
                    >
                        <span className="tool-icon">
                            {tool.icon}
                        </span>

                        <h3>{tool.title}</h3>

                        <p>{tool.description}</p>

                        <button
                            className="outline-button career-tool-button"
                            type="button"
                        >
                            {tool.button}
                        </button>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default CareerTools;
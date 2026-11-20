import "./Categories.css";

const categories = [
    {
        icon: "💻",
        name: "Software Development",
        jobs: "1,200+ jobs"
    },
    {
        icon: "🎨",
        name: "Frontend Development",
        jobs: "1,000+ jobs"
    },
    {
        icon: "⚙️",
        name: "Backend Development",
        jobs: "950+ jobs"
    },
    {
        icon: "📊",
        name: "Data & Analytics",
        jobs: "800+ jobs"
    },
    {
        icon: "☁️",
        name: "Cloud & DevOps",
        jobs: "500+ jobs"
    },
    {
        icon: "🖌️",
        name: "UI / UX Design",
        jobs: "700+ jobs"
    }
];

function Categories() {
    return (
        <section
            id="categories"
            className="content-section alternate-section"
        >
            <div className="section-heading">
                <div>
                    <span className="section-label">
                        Explore
                    </span>

                    <h2 className="section-title">
                        Popular Job Categories
                    </h2>

                    <p className="section-description">
                        Start your search by choosing a career area.
                    </p>
                </div>
            </div>

            <div id="categoryGrid" className="category-grid">
                {categories.map((category) => (
                    <button
                        className="category-card"
                        type="button"
                        key={category.name}
                    >
                        <span className="category-icon">
                            {category.icon}
                        </span>

                        <strong>{category.name}</strong>

                        <span>{category.jobs}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}

export default Categories;
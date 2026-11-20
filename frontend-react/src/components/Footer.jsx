import "./Footer.css";

function Footer() {
    return (
        <footer id="siteFooter" className="site-footer">
            <div className="footer-container">

                <div>
                    <a href="#home" className="brand-logo footer-brand">
                        <span className="brand-icon">💼</span>
                        <span className="brand-name">SmartHire</span>
                    </a>

                    <p>
                        Smart job discovery and career management.
                    </p>
                </div>

                <div className="footer-links">
                    <a href="#jobs">Jobs</a>
                    <a href="#companies">Companies</a>
                    <a href="#careerTools">Career Tools</a>
                    <a href="#alerts">Job Alerts</a>
                </div>

            </div>

            <div className="footer-bottom">
                <p>
                    © 2026 SmartHire. All rights reserved.
                </p>
            </div>
        </footer>
    );
}

export default Footer;
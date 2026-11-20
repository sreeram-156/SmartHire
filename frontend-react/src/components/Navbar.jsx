import { useState } from "react";
import "./Navbar.css";

function Navbar({
    onLoginClick,
    onSignupClick,
    loggedInUser,
    onLogout
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleMobileMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleTheme = () => {
        const newTheme = !isDarkMode;

        setIsDarkMode(newTheme);
        document.body.classList.toggle("dark-theme", newTheme);
    };

    const closeMobileMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <header id="siteHeader" className="site-header">
            <div className="header-container">

                {/* =========================
                    LOGO
                ========================= */}

                <a
                    href="#home"
                    className="brand-logo"
                    onClick={closeMobileMenu}
                >
                    <span className="brand-icon">💼</span>
                    <span className="brand-name">SmartHire</span>
                </a>

                {/* =========================
                    NAVIGATION
                ========================= */}

                <nav
                    id="mainNavigation"
                    className={`main-navigation ${
                        isMenuOpen ? "mobile-menu-open" : ""
                    }`}
                    aria-label="Main navigation"
                >
                    <a
                        href="#home"
                        className="navigation-link"
                        onClick={closeMobileMenu}
                    >
                        Home
                    </a>

                    <a
                        href="#jobs"
                        className="navigation-link"
                        onClick={closeMobileMenu}
                    >
                        Jobs
                    </a>

                    <a
                        href="#companies"
                        className="navigation-link"
                        onClick={closeMobileMenu}
                    >
                        Companies
                    </a>

                    <a
                        href="#applications"
                        className="navigation-link"
                        onClick={closeMobileMenu}
                    >
                        Applications
                    </a>

                    <a
                        href="#careerTools"
                        className="navigation-link"
                        onClick={closeMobileMenu}
                    >
                        Career Tools
                    </a>
                </nav>

                {/* =========================
                    HEADER ACTIONS
                ========================= */}

                <div className="header-actions">

                    {/* Notifications */}

                    <button
                        id="notificationButton"
                        className="icon-button"
                        type="button"
                        aria-label="Notifications"
                    >
                        🔔
                    </button>

                    {/* Theme Toggle */}

                    <button
                        id="themeToggleButton"
                        className="icon-button"
                        type="button"
                        aria-label="Toggle theme"
                        onClick={toggleTheme}
                    >
                        {isDarkMode ? "☀️" : "🌙"}
                    </button>

                    {/* =========================
                        LOGIN / USER STATE
                    ========================= */}

                    {!loggedInUser ? (
                        <>
                            <button
                                id="loginButton"
                                className="secondary-button"
                                type="button"
                                onClick={onLoginClick}
                            >
                                Login
                            </button>

                            <button
                                id="signupButton"
                                className="primary-button"
                                type="button"
                                onClick={onSignupClick}
                            >
                                Sign Up
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="logged-in-user">
                                Welcome, {loggedInUser.role}
                            </span>

                            <button
                                id="logoutButton"
                                className="secondary-button"
                                type="button"
                                onClick={onLogout}
                            >
                                Logout
                            </button>
                        </>
                    )}

                    {/* Mobile Menu */}

                    <button
                        id="mobileMenuButton"
                        className="icon-button mobile-menu-button"
                        type="button"
                        aria-label={
                            isMenuOpen
                                ? "Close menu"
                                : "Open menu"
                        }
                        onClick={toggleMobileMenu}
                    >
                        {isMenuOpen ? "✕" : "☰"}
                    </button>

                </div>
            </div>
        </header>
    );
}

export default Navbar;
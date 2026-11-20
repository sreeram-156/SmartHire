import "./Notifications.css";

const notifications = [
    {
        title: "Welcome to SmartHire",
        message: "Complete your profile to improve job recommendations.",
        type: "New"
    },
    {
        title: "Job alerts are ready",
        message: "Create an alert to receive matching opportunities.",
        type: "Tip"
    }
];

function Notifications() {
    return (
        <section
            id="notifications"
            className="notifications-section"
        >
            <div className="section-heading">
                <div>
                    <span className="section-label">
                        Updates
                    </span>

                    <h2 className="section-title">
                        Notifications
                    </h2>

                    <p className="section-description">
                        Important updates from your job search.
                    </p>
                </div>
            </div>

            <div
                id="notificationList"
                className="notification-list"
            >
                {notifications.map((notification) => (
                    <article
                        className="notification-item"
                        key={notification.title}
                    >
                        <span className="notification-dot"></span>

                        <div>
                            <strong>
                                {notification.title}
                            </strong>

                            <p>
                                {notification.message}
                            </p>
                        </div>

                        <small>
                            {notification.type}
                        </small>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default Notifications;
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import './NotificationBar.css';

const ICONS = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
};

const NotificationBar = ({ message, type = 'info', duration = 5000, onDone }) => {
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        if (message) {
            setTimeout(() => {
                setVisible(true);
                setExiting(false);
            }, 0);

            const exitTimer = setTimeout(() => {
                setExiting(true);
            }, duration - 500); // Start exit animation 500ms before it disappears

            const visibilityTimer = setTimeout(() => {
                setVisible(false);
                setExiting(false);
                if (onDone) {
                    onDone();
                }
            }, duration);

            return () => {
                clearTimeout(exitTimer);
                clearTimeout(visibilityTimer);
            };
        }
    }, [message, duration, onDone]);

    if (!visible) return null;

    const barClass = twMerge(
        "notification-bar",
        `notification-bar--${type}`,
        exiting ? "slide-out" : "slide-in"
    );

    return (
        <div className={barClass}>
            <div className="notification-icon">
                {ICONS[type]}
            </div>
            <p className="notification-message">{message}</p>
            <div
                className="notification-progress"
                style={{ animationDuration: `${duration}ms` }}
            />
        </div>
    );
};

export default NotificationBar; // Added a comment to force re-evaluation

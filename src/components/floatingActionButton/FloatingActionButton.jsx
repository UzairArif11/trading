import React, { useEffect, useState } from 'react';
import './FloatingActionButton.css';
import ComplainModal from '../complainModal/ComplainModal';
const FloatingActionButton = () => {
    const [open, setOpen] = useState(false);
    const [mobileMode, setMobileMode] = useState(false);
    const toggleMenu = () => {
        setOpen(!open);
    };
    useEffect(() => {
        const checkMobileMode = () => {
            const isMobile = window.innerWidth <= 960;
            setMobileMode(isMobile);
        };

        // Initial check
        checkMobileMode();

        // Add event listener for window resize
        window.addEventListener('resize', checkMobileMode);

        // Clean up event listener on unmount
        return () => {
            window.removeEventListener('resize', checkMobileMode);
        };
    }, []);
    return (
        <div className="fab-container"  title='Add Feedback' style={{ display: mobileMode ? 'none' : 'block' }}>
            {open ? <ComplainModal setOpen={setOpen} /> : <></>}
            <button className="fab-main" onClick={toggleMenu}>
                {open ? '×' : '+'}
            </button>
        </div>
    );
};

export default FloatingActionButton;

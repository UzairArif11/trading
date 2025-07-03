import React, { useState, useEffect } from 'react';

const ServerTime = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const formatTime = (date) => {
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };

    return (
        <div
          className="second-row"
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr', // Same layout as first row
            gap: '4.5rem',
            alignItems: 'center', // Vertically center content
            height:'46.4px',
          }}
        >
        {/* First Column */}
        <div>
          <h2>Server Time</h2>
        </div>

        {/* Second Column */}
        <div className='row-2-col-2'>
          <span>{formatTime(currentTime)}</span>
        </div>
      </div>

    );
};

export default ServerTime;

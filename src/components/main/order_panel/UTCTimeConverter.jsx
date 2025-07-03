import React, { useEffect } from 'react';
import { useMetricsContext } from '../../../contexts/Metrics-Context';
import { useChartContext } from '../../../contexts/Chart-Context';
const UTCTimeConverter = ({ inSettings = true }) => {
  const {
    currentUTCDate,
    setCurrentUTCDate,
    utcOffset,
    setUTCOffset,
    formatTime,
    utcOffsetInitial,
  } = useMetricsContext();
  const { selectedStyle } = useChartContext();
  useEffect(() => {
    const interval = setInterval(() => {
      const adjustedDate = new Date();
      const [hoursStr, minutesStr] = utcOffset.split(':');
      const hoursOffset = parseInt(hoursStr, 10) || 0;
      const minutesOffset = parseInt(minutesStr, 10) || 0;

      adjustedDate.setUTCHours(
        adjustedDate.getUTCHours() + hoursOffset,
        adjustedDate.getUTCMinutes() + minutesOffset,
      );

      setCurrentUTCDate(adjustedDate);
    }, 1000);

    return () => clearInterval(interval);
  }, [utcOffset]);

  const handleChangeUTCOffset = (selectedOption) => {
    localStorage.setItem('utc_time', selectedOption.value);
    if (selectedOption) {
      setUTCOffset(selectedOption.value);
    }
  };
  
  return (
    <div
    className="first-row"
    style={{
      display: 'grid',
      gridTemplateColumns: '2fr 2fr', // Three columns: First two wider, third smaller
      gap: '4.5rem',
      alignItems: 'center', // Vertically center content
    }}
  >
    {/* First Column */}
    <div>
      {inSettings && <h2>Current Time</h2>}
    </div>

    {/* Second Column */}
    <div className='row-1-col-2'>
      <span
        style={{
          color: utcOffsetInitial !== utcOffset ? `${selectedStyle.sellColor}` : ``,
        }}
        title={
          utcOffsetInitial !== utcOffset
            ? `User time is different than computer's time`
            : ''
        }
      >
        {formatTime(currentUTCDate)}
      </span>
    </div>
  </div>


  );
};

export default UTCTimeConverter;
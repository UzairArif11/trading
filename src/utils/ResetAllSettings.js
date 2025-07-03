import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuthContext } from '../contexts/Auth-Context';
import { useAccountManagerContext } from '../contexts/Account-Manager-Context';
import { useChartContext } from '../contexts/Chart-Context';
import '../themes/dark.scss'; // Import the CSS file

const ResetAllSettings = () => {
    const { setAuthSelectedSymbol } = useAuthContext();
    const { setActiveTab } = useAccountManagerContext();
    const { setSelectedTimeFrame } = useChartContext();

    const [radioColor, setRadioColor] = useState('#3b3a3a');

    const handleButtonClick = () => {
        // Logic to reset all settings
        toast.success('Settings have been reset!', {
            onClose: () => setRadioColor('#3b3a3a') // Turn radio back to black when toast disappears
        });
        setRadioColor('rgb(33, 196, 109) !important'); // Turn radio to green on click

        localStorage.setItem('directions', 'buy');
        localStorage.setItem('symbol', 'UNISWAP');
        localStorage.setItem('storedFont', 'Large');
        localStorage.setItem('accountManager', 'open-positions-acc');
        localStorage.setItem('activeMode', 'order');
        localStorage.setItem('chartTooltips', 'show');
        localStorage.setItem('left-nav', 'show');
        localStorage.setItem('positionMarker', 'show');
        localStorage.setItem('right-nav', 'show');
        localStorage.setItem('symbol_id', '153');
        localStorage.setItem('timeFrame', '1m');
        localStorage.setItem('zoomRange', '0.9');
        localStorage.setItem('orderTab', 'market');
    };
    useEffect(()=>{
      if(localStorage.getItem('symbol')!=null){
        setAuthSelectedSymbol(localStorage.getItem('symbol'))
      }
      if(localStorage.getItem('accountManager')!=null){
        setActiveTab(localStorage.getItem('accountManager'))
      }
      if(localStorage.getItem('timeFrame')!=null){
        setSelectedTimeFrame(localStorage.getItem('timeFrame'))
      }
      
    },[localStorage.getItem('accountManager'),localStorage.getItem('symbol'),localStorage.getItem('timeFrame')])

    return (
        <button
            onClick={handleButtonClick}
            className="reset-button"
        >
            Reset all settings
            <div
                className="radio-indicator"
                style={{ backgroundColor: radioColor, borderColor: radioColor }}
            />
        </button>
    );
};

export default ResetAllSettings;

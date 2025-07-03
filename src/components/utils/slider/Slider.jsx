import React, { useRef, useState } from 'react';
import './Slider.css';
import { useChartContext } from '../../../contexts/Chart-Context.js';

const steps = [0, 25, 50, 75, 100];

export default function SliderQuantity({value, onSliderChange , onAmountSliderChange ,direction,stateUpdate }) {
  // const [value, setValue] = useState(0);
  const sliderRef = useRef(null);
   const { selectedStyle } = useChartContext(); 

  const handleMove = (e) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const offsetX = (e.clientX || e.touches[0].clientX) - rect.left; 
    const percent = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));

    // // Snap to nearest step
    // const closest = steps.reduce((prev, curr) =>
    //   Math.abs(curr - percent) < Math.abs(prev - percent) ? curr : prev
    // );
    
    // setValue(percent);
    if (onSliderChange) {
        onSliderChange(percent); // tell parent the updated slider value
        stateUpdate(false)
    }
    if (onAmountSliderChange) {
        onAmountSliderChange(percent);
        stateUpdate(false)
    }
  };

  // if (value > 100) {

  //   console.log("Value is greater than 100, setting to 100" , value); 
  // }else {
  //   console.log("Value is less than 0, setting to 0" , value);
  // }

  const handleMouseDown = (e) => {
    e.preventDefault(); 
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleMouseUp);
};

 const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleMouseUp);
};
  const handleTouchStart = (e) => {
    e.preventDefault(); 
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleTouchEnd);
};
const handleTouchEnd = () => {
  document.removeEventListener('touchmove', handleMove);
  document.removeEventListener('touchend', handleTouchEnd);
};

  const handleClick = (e) => {
    handleMove(e);
  };

  return (
    <div className={`slider-container ${direction === 'Sell' ? 'sell' : 'buy'} `} ref={sliderRef} onClick={handleClick} onTouchStart={handleTouchStart} >
      <div className="slider-track" onClick={handleClick}>
        <div className="slider-fill" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: value > 100 ? 'orange' : selectedStyle.buyColor, borderColor: value > 100 ? 'orange' : selectedStyle.buyColor }} />
        {steps.map((step, index) => (
          <div
            key={index}
            className={`slider-step ${value >= step ? 'active' : ''}`}
            style={{ left: `${step}%` , borderColor: value > 100 ? 'orange' : '', '--active-color': selectedStyle.buyColor}}
          />
        ))}
         <div
            className="slider-value"
            // style={{ left: `${value}%` }}
            style={{ left: `${Math.min(value, 100)}%` }}
            >
            {Number.isFinite(value) ? `${value.toFixed(2)}%` : '0.00%'}
            </div>
        <div
          className="slider-thumb"
          // style={{ left: `${value}%` }}
          style={{ left: `${Math.min(value, 100)}%` }}
          onMouseDown={handleMouseDown}
        />
         {/* <div className="slider-value">{Math.round(value)}</div> */}
      </div>
    </div>
  );
}

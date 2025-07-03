import React, { createContext, useContext, useState, useEffect } from 'react';

export const ChartContext = createContext();

export const useChartContext = () => {
  return useContext(ChartContext);
};

export const ChartProvider = ({ children }) => {
  let candle;
  if (localStorage.chartData !== undefined) {
    const chartData = JSON.parse(localStorage.chartData);
    const icon = chartData.icon;
    const type = chartData.type;
    candle = type;
    // setTimeout(() => {
    //     const seriesIcon = document.getElementsByClassName('am5stock-control-icon')[1];
    //     seriesIcon.innerHTML = icon;
    // }, 4000);
  } else {
    candle = 'candlestick';
  }
  let timeFrame;
  if (localStorage.timeFrame !== undefined) {
    timeFrame = localStorage.timeFrame;
  } else {
    timeFrame = '15m';
  }
  let storedZoomRange = 0.9;
  if (localStorage.zoomRange !== undefined) {
    storedZoomRange = localStorage.zoomRange;
  }
  const [zoomRange, setZoomRange] = useState(storedZoomRange);
  // const [riseFromOpenColor, setRiseFromOpenColor] = useState();
  // const [dropFromOpenColor, setDropFromOpenColor] = useState();
  const [selectedTimeFrame, setSelectedTimeFrame] = useState(timeFrame);
  const [selectedSeriesType, setSelectedSeriesType] = useState(candle);
  const [lineCandle, setLineCandle] = useState();
  const styleOptions = [
    { 
      name: "Traditional", 
      colors: ["#EA0070", "#74A700"],
      buyColor: "#EA0070",
      sellColor: "#74A700"
    },
    { 
      name: "Fresh", 
      colors: ["#21C46D", "#E13232"],
      buyColor: "#21C46D",
      sellColor: "#E13232"
    },
    { 
      name: "Color Vision", 
      colors: ["#EC8D42", "#1F8DF9"],
      buyColor: "#EC8D42",
      sellColor: "#1F8DF9"
    },
    { 
      name: "Signal", 
      colors: ["#578df2", "#ff554d"],
      buyColor: "#578df2",
      sellColor: "#ff554d"
    },
  ];
  const [selectedStyle, setSelectedStyle] = useState(() => {
    const saved = localStorage.getItem('selectedStyle');
    return saved ? JSON.parse(saved) : styleOptions[3];
  });

  useEffect(() => {
    localStorage.setItem('selectedStyle', JSON.stringify(selectedStyle));
  }, [selectedStyle]);

  // const isNotNull = setInterval(() => {
  // const rangebar = document.getElementById('zoomRanger');
  // if (rangebar !== null) {
  // clearInterval(isNotNull);
  // if (localStorage.zoomRange !== undefined) {
  //     rangebar.value = localStorage.zoomRange;
  // }
  // rangebar.addEventListener('change', (e) => {
  //     setZoomRange(e.target.value);
  //     localStorage.setItem('zoomRange', e.target.value);
  // })
  // if (document.getElementById("chartUpColor").value == "#000000") {
  //   let upPriceColor = getComputedStyle(document.getElementById("chartUpColor")).backgroundColor;
  //   let downPriceColor = getComputedStyle(document.getElementById("chartDownColor")).backgroundColor;
  //   console.log('up', upPriceColor);
  //   console.log('down', downPriceColor);
  //   setRiseFromOpenColor(upPriceColor);
  //   setDropFromOpenColor(downPriceColor);
  // }
  // document.getElementById("chartUpColor").addEventListener('change', (e)=>{
  //     setRiseFromOpenColor(e.currentTarget.value);
  // })
  // document.getElementById("chartDownColor").addEventListener('change', (e)=>{
  //     setDropFromOpenColor(e.currentTarget.value);
  // })
  // }
  // }, 1000);

  // useEffect(() => {
  //     setTimeout(() => {
  //         let upPriceColor = getComputedStyle(document.getElementById("chartUpColor")).backgroundColor;
  //         let downPriceColor = getComputedStyle(document.getElementById("chartDownColor")).backgroundColor;
  //         console.log('up', upPriceColor);
  //         console.log('down', downPriceColor);
  //         setRiseFromOpenColor(upPriceColor);
  //         setDropFromOpenColor(downPriceColor);
  //     }, 1000);
  // }, []);

  const updateChartTimeFrame = (tf) => {
    setSelectedTimeFrame(tf);
  };

  return (
    <ChartContext.Provider
      value={{
        selectedTimeFrame,
        setSelectedTimeFrame,
        updateChartTimeFrame,
        selectedSeriesType,
        setSelectedSeriesType,
        zoomRange,
        setZoomRange,
        lineCandle,
        setLineCandle,
        selectedStyle,
        setSelectedStyle,
        styleOptions,
        // riseFromOpenColor,
        // setRiseFromOpenColor,
        // dropFromOpenColor,
        // setDropFromOpenColor,
      }}
    >
      {children}
    </ChartContext.Provider>
  );
};

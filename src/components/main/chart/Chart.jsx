import React, { useEffect, useRef, useState } from 'react';
import Spinner from '../../utils/spinner/Spinner';
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5stock from "@amcharts/amcharts5/stock";
import am5themes_Dark from '@amcharts/amcharts5/themes/Material';
import am5themes_Responsive from '@amcharts/amcharts5/themes/Responsive';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

import { API_ENDPOINT_KLINES_MT } from '../../../data/Endpoints-API';
import { useSymbolContext } from '../../../contexts/Symbol-Context';
import { useAuthContext } from '../../../contexts/Auth-Context';
import { useChartContext } from '../../../contexts/Chart-Context';
// import '../../../themes/old-dark.scss'
// import '../../../themes/dark.scss'
// import './Chart.scss';
import './Chart-Toolbar.scss';
import './am5stockChart.scss'
import { useAccountManagerContext } from '../../../contexts/Account-Manager-Context';

const Chart = ({ mobileMode }) => {
  // Context
  const {
    clickedPosition,
    showTooltip,
    setShowTooltip,
    showBullets,
    loadingSymbolContext,
    symbolNames,
    updateSymbolName,
    symbolInfo,
    updateSymbolDetailsData,
    setSelectedCategoryId,
    symbolWithCategories,
    setSelectedSymbolSession,
  } = useSymbolContext();
  const {
    user,
    platFromData,
    selectedAuthSymbol,
    selectedAuthSymbolId,
    setAuthSelectedSymbol,
    setAuthTimeFrame,
    setAuthSelectedCategory,
    defaultSelectedCategory,
    isReconnected, 
    setIsReconnected
  } = useAuthContext();
  const {
    selectedTimeFrame,
    updateChartTimeFrame,
    // selectedSeriesType,
    zoomRange,
    setLineCandle,
    selectedStyle, 
    setSelectedStyle, 
    styleOptions,
  } = useChartContext();
  const { openPositions, closedPositions , closedPositionsAll} = useAccountManagerContext();
  

  const chartRef = useRef(null);
  const mainPanelRef = useRef(null);
  const valueSeriesRef = useRef(null);
  let timeFrameChartSetup = 'minute';

  timeFrameChartSetup = (selectedTimeFrame === '1m' || selectedTimeFrame === '5m' || selectedTimeFrame === '15m' || selectedTimeFrame === '30m') 
  ? 'minute'
  : (selectedTimeFrame === '1h' || selectedTimeFrame === '4h') 
      ? 'hour'
      : (selectedTimeFrame === '1d') 
          ? 'day' 
          : 'minute'

  const numberFormat = '#,#### ';

  // useEffect(() => {
  //   if (clickedPosition) {
  //     createChartBulletClosePosition(clickedPosition);
  //   }
  // }, [clickedPosition]);
  
  

  useEffect(() => {
    if (selectedAuthSymbol !== '') {
      updateSymbolDetailsData(selectedAuthSymbol);
    }
  }, [selectedAuthSymbol]);

  //local states
  let [stockChart2, setStockChart2] = useState(null);
  let [currentLabel2, setCurrentLabel2] = useState(null);
  let [currentLabelNew2, setCurrentLabelNew2] = useState(null);
  let [currentValueDataItem2, setCurrentValueDataItem2] = useState(null);
  let [currentValueDataItemNew, setCurrentValueDataItemNew] = useState(null);
  
  const [chartInitialized, setChartInitialized] = useState(false);


  let [dataReady, setDataReady] = useState(false);
  const allChartDataRef = useRef([]);
  const currentChartDataRef = useRef([]);

  let root = null;
  let currentLabel = null;
  let currentLabelNew = null;
  let currentValueDataItem = null;
  let candleLength = 450;

  // useEffect to handle component lifecycle
  useEffect(() => {
    //nothing will load in this component until SymbolContext fully loaded
    if (!loadingSymbolContext) {
        chartSetup();
      // return () => {
      //   console.log("INTO RETURN", root);
      //   root.dispose();
      //   console.log("after RETURN", root);
      // };
    }
  }, [loadingSymbolContext, selectedAuthSymbol, selectedTimeFrame, showTooltip, showBullets]);
  
  useEffect(() => {
    // Only run if colors changed and chart container exists
    if (document.getElementById('chartdiv')) {
      chartSetup();
    }
  }, [selectedStyle.buyColor, selectedStyle.sellColor]);
  
  useEffect(() => {
    
    console.log("triggered ppostions");
    if (openPositions.length > 0 || selectedAuthSymbol || selectedTimeFrame) {
      createChartBullets();
    }
  }, [openPositions.length, selectedAuthSymbol, selectedTimeFrame, showBullets , showTooltip]);


  useEffect(() => {
    // console.log("Symbol or Timeframe changed, clearing bullets");

    greenBullets.forEach((bullet) => bullet.dispose());
    greenBullets = []; // Reset the array
    
    greenBullets2.forEach((bullet) => bullet.dispose());
    greenBullets2 = [];
  
    persistentBullets.forEach((bullet) => bullet.dispose());
    persistentBullets = [];
  
    createChartBullets();
    createChartBullets2();
    createPersistentBullets();
  }, [selectedAuthSymbol, selectedTimeFrame]);
  
  

  // useEffect(() => {
  //   if (clickedPosition || selectedAuthSymbol || selectedTimeFrame) {
  //     createChartBulletClosePosition(clickedPosition); // Orange bullet
  //   }
  // }, [clickedPosition, selectedAuthSymbol, selectedTimeFrame, showBullets , showTooltip])
  

  useEffect(() => {
    if (closedPositionsAll.length > 0 || selectedAuthSymbol || selectedTimeFrame) {
      
      createChartBullets2(); // Orange bullet
    }
  }, [closedPositionsAll.length, selectedAuthSymbol, selectedTimeFrame, showBullets , showTooltip])


  useEffect(() => {
    if (closedPositionsAll.length > 0 || selectedAuthSymbol || selectedTimeFrame) {
      createPersistentBullets();
    }
  }, [closedPositionsAll.length, selectedAuthSymbol, selectedTimeFrame, showBullets]);
  


  // useEffect to handle component lifecycle after reconnection
  useEffect(() => {
    //nothing will load in this component until SymbolContext fully loaded
    if (isReconnected) {
        // console.log("Dependencies in if:", { isReconnected });
        chartSetup();
        if (openPositions.length > 0) {
          createChartBullets();
        }
      //   if (savedClickedPosition) {
      //     createChartBulletClosePosition(savedClickedPosition);
      // }

      // return () => {
      //   console.log("INTO RETURN", root);
      //   root.dispose();
      //   console.log("after RETURN", root);
      // };
    }
  }, [isReconnected]);

  // useEffect(() => {
  //   if (
  //     !loadingSymbolContext &&
  //     chartRef?.current &&
  //     valueSeriesRef?.current &&
  //     chartLoadedFirstTime
  //   ) {
  //     debugger;
  //     loadChartData(valueSeriesRef?.current);
  //   }
  // }, [selectedAuthSymbol, selectedTimeFrame]);

  useEffect(() => {
    //nothing will load in this component until SymbolContext fully loaded
    if (!loadingSymbolContext && dataReady) {
      updateLiveFeedData();
    }
  }, [platFromData[1]], dataReady);

  //dispose root if there is any because only root could exists
  const maybeDisposeRoot = (divId) => {
    am5.array.each(am5.registry.rootElements, function (root) {
      if (root.dom.id === divId) {
        root.dispose();
      }
    });
  };

  // Main chart setup function
  const chartSetup = () => {
    //dispose root if there is any because only root could exists
    maybeDisposeRoot('chartdiv');

    //#region CHART SETUP
    root = am5.Root.new('chartdiv');

    var indicator = root.container.children.push(am5.Container.new(root, {
      width: am5.p100,
      height: am5.p100,
      layer: 1000,
      background: am5.Rectangle.new(root, {
        fill: am5.color('#191919'),
        fillOpacity: 0.9
      })
    }));

    indicator.children.push(am5.Label.new(root, {
      text: "Loading...",
      fontSize: 25,
      x: am5.p50,
      y: am5.p50,
      centerX: am5.p50,
      centerY: am5.p50,
      fill: am5.color(0x808080)
    }));
    let hourglass = indicator.children.push(am5.Graphics.new(root, {
      width: 32,
      height: 32,
      fill: am5.color(0x808080),
      x: am5.p50,
      y: am5.p50,
      centerX: am5.p50,
      centerY: am5.p50,
      dy: -45,
      svgPath: "M12 5v10l9 9-9 9v10h24V33l-9-9 9-9V5H12zm20 29v5H16v-5l8-8 8 8zm-8-12-8-8V9h16v5l-8 8z"
    }));
    var hourglassanimation = hourglass.animate({
      key: "rotation",
      to: 180,
      loops: Infinity,
      duration: 2000,
      easing: am5.ease.inOut(am5.ease.cubic)
    });


    hourglassanimation.play();
    indicator.show();

    // The following line removes the AMCharts logo even in the free version. BUT THIS IS AGAINST THEIR LICENSE AGREEMENT.
    root._logo.dispose();

    //custom theme
    const myTheme = am5.Theme.new(root);

    myTheme.rule('Grid').setAll({
      stroke: am5.color(0x808080),
      strokeWidth: 1,
    });

    myTheme.rule('Label').setAll({
      fill: am5.color('#fff'),
    });

    // Set themes
    root.setThemes(
      mobileMode
        ? [am5themes_Responsive.new(root), am5themes_Dark.new(root), myTheme]
        : [am5themes_Animated.new(root), am5themes_Dark.new(root), myTheme],
    );

    root.container.set("background", am5.Rectangle.new(root, {
      fill: am5.color('#191919') // Set your desired color here
    }));

    //#region Create a stock chart
    let stockChart = root.container.children.push(
      am5stock.StockChart.new(root, {
        stockNegativeColor: am5.color(selectedStyle.sellColor),
        stockPositiveColor: am5.color(selectedStyle.buyColor),
      }),
    );

    setStockChart2(stockChart);

    // Set global number format
    root.numberFormatter.set('numberFormat', numberFormat);

    // Create a main stock panel (chart)
    let mainPanel = stockChart.panels.push(
      am5stock.StockPanel.new(root, {
        panX: true,
        panY: true,
        wheelX: 'panX',
        wheelY: 'zoomX',
        pinchZoomX: true,
      }),
    );

    // Create value/vertical axis
    let valueAxis = mainPanel.yAxes.push(
      am5xy.ValueAxis.new(root, {
        start: 0.9, //show 10% candles on load
        renderer: am5xy.AxisRendererY.new(root, {
          pan: 'zoom',
          crisp: true,
          stroke: am5.color('#2d2d2d'),
          strokeOpacity: 1,
          strokeWidth: 1,
        }),
        extraMin: 0.1, // adds some space for for main series
        extraMax: 0.4, // adds some space for for main series
        tooltip: am5.Tooltip.new(root, {}),
        numberFormat: numberFormat,
        // maxPrecision: 8,
        // extraTooltipPrecision: 4,
      }),
    );

    // Create date/horizontal axis
    let dateAxis = mainPanel.xAxes.push(
      am5xy.GaplessDateAxis.new(root, {
        start: zoomRange || 0.9, //show 10% candles on load
        minZoomCount: mobileMode ? 30 : 10,
        baseInterval: {
          timeUnit: timeFrameChartSetup,
          count: selectedTimeFrame === '15m' || selectedTimeFrame === '30m' ? 5 : 1,
        },
        renderer: am5xy.AxisRendererX.new(root, {
          pan: 'zoom',
          stroke: am5.color('#2d2d2d'),
          strokeOpacity: 1,
          strokeWidth: 1,
          minGridDistance: mobileMode ? 50 : 80,
          // minorGridEnabled: true,
        }),
        crisp: true,
        tooltip: am5.Tooltip.new(root, {}),
        end: 1.1, // increase the end value to add space on the right side
      }),
    );

      if (!mobileMode) {
        // dateAxis.set("dateFormats", {
        //     minute: "HH:mm", // Format for minutes
        //     hour: "HH:mm",
        //     day: "MMM dd",
        // });
        dateAxis.set("periodChangeDateFormats", {
            minute: "[bold]MMM dd",
            hour: "[bold]MMM dd",
            day: "[bold]MMM dd",
        });
    }


    // add range which will show current value
    currentValueDataItem = valueAxis.createAxisRange(
      valueAxis.makeDataItem({ value: 0 }),
    );

    currentValueDataItemNew = valueAxis.createAxisRange(
      valueAxis.makeDataItem({ value: 0 }),
    );
    setCurrentValueDataItemNew(currentValueDataItemNew);

    setCurrentValueDataItem2(currentValueDataItem);

    // currentValueDataItem.get('label').set('visible', false);
    // currentValueDataItemNew.get('label').set('visible', false);

    currentLabel = currentValueDataItem.get('label');
    currentLabelNew = currentValueDataItemNew.get('label');

    setCurrentLabelNew2(currentLabelNew);
    setCurrentLabel2(currentLabel);
  //   if (currentLabelNew) {
  //     currentLabelNew.setAll({
  //       fill: am5.color(0xffffff),
  //       background: am5.Rectangle.new(root, { fill: am5.color(0x000000) }),
  // fillOpacity: 0.5
  //     });
  //   }
  //   if (currentLabel) {
  //     currentLabel.setAll({
  //       fill: am5.color(0xffffff),
  //       background: am5.Rectangle.new(root, { fill: am5.color(0x000000) }),
  //     });
  //   }


  if (currentLabelNew) {
  currentLabelNew.setAll({
    fill: am5.color(0xffffff), // White text
    background: am5.Rectangle.new(root, {
      fill: am5.color(0x000000), // Black background
      fillOpacity: 0.7, // Semi-transparent for better readability
      minWidth: 60, // Limit width to prevent overflow
      // cornerRadius: 5, // Rounded corners
    }),
    dy: -13, // Adjust vertical position to stack above
  });
}

if (currentLabel) {
  currentLabel.setAll({
    fill: am5.color(0xffffff), // White text
    background: am5.Rectangle.new(root, {
      fill: am5.color(0x000000), // Black background
      fillOpacity: 0.7, // Semi-transparent
      minWidth: 60
      // cornerRadius: 15, // Rounded corners
    }),
    dy: 0, // Base position
  });
}

    let currentGridNew = currentValueDataItemNew.get('grid');
    let currentGrid = currentValueDataItem.get('grid');

    if (currentGridNew) {
      currentGridNew.setAll({
        stroke: am5.color(selectedStyle.buyColor),
        strokeOpacity: 0.5,
        // strokeDasharray: [2, 5]
      });
    }

    if (currentGrid) {
      currentGrid.setAll({
        stroke: am5.color(selectedStyle.sellColor),
        strokeOpacity: 1,
      });
    }

//     const chart = valueAxis.chart; // Get the chart instance
// const plotContainer = chart.plotContainer;

// Function to create a label at a specific price
// function createPriceLabel(price, text, color, dyOffset) {
//   const yPosition = valueAxis.valueToPosition(price); // Convert price to y-position
//   const label = am5.Label.new(root, {
//     text: text,
//     fill: am5.color(0xffffff), // White text
//     x: am5.percent(5), // Position the label slightly inside the chart (adjust as needed)
//     y: yPosition, // Y-position based on price
//     dy: dyOffset, // Offset to stack labels
//     centerY: yPosition, // Align vertically with the price level
//     background: am5.Rectangle.new(root, {
//       fill: am5.color(color), // Background color (e.g., green for bid, red for ask)
//       fillOpacity: 0.7,
//       cornerRadius: 5,
//     }),
//     paddingLeft: 5,
//     paddingRight: 5,
//     paddingTop: 2,
//     paddingBottom: 2,
//   });

//   plotContainer.children.push(label);
//   return label;
// }

// // Create labels for ask and bid prices
// const bidLabel = createPriceLabel(
//   4.854,
//   `Bid: 134`,
//   selectedStyle.sellColor, // Use your bid color
//   0 // No offset for bid
// );

// const askLabel = createPriceLabel(
//   4.855,
//   `Ask: 123`,
//   selectedStyle.buyColor, // Use your ask color
//   -20 // Offset ask label above bid
// );

// Optional: Update labels dynamically if prices change
// function updateLabels(newAskPrice, newBidPrice) {
//   const newAskY = valueAxis.valueToPosition(newAskPrice);
//   const newBidY = valueAxis.valueToPosition(newBidPrice);

//   askLabel.set('y', newAskY);
//   askLabel.set('centerY', newAskY);
//   askLabel.set('text', `Ask: ${newAskPrice}`);

//   bidLabel.set('y', newBidY);
//   bidLabel.set('centerY', newBidY);
//   bidLabel.set('text', `Bid: ${newBidPrice}`);
// }

    // Add series
    let valueSeries;
    let volumeSeries;
    var tooltip;
    const textColor = am5.color("#ffffff")

    if (showTooltip) {
    tooltip = am5.Tooltip.new(root, {
      pointerOrientation: "down",
      getFillFromSprite: false,
      getStrokeFromSprite: false,
      autoTextColor: false,
      getLabelFillFromSprite: true,
      labelHTML: `<p style="color:${textColor};" >Open: {openValueY} </br> Low: {lowValueY} </br> High: {highValueY} </br> Close: {valueY}</p><br /> <br />`,
    });
    tooltip.get("background").setAll({
      // fill: am5.color("#232323"),
      // fill: am5.color("#232323"),
      stroke: am5.color('#191919'),
    });
  }

  valueSeries = mainPanel.series.push(
    am5xy.CandlestickSeries.new(root, {
      name: selectedAuthSymbol,
      clustered: false,
      valueXField: 'Date',
      valueYField: 'Close',
      highValueYField: 'High',
      lowValueYField: 'Low',
      openValueYField: 'Open',
      calculateAggregates: true,
      xAxis: dateAxis,
      yAxis: valueAxis,
        tooltip: tooltip,
    }),
  );

    // Set main value series
    stockChart.set('stockSeries', valueSeries);
    stockChart.set('volumeSeries', volumeSeries);

    // For Bid Price (lower one)
// let bidBullet = valueSeries.bullets.push(function () {
//   return am5.Bullet.new(root, {
//     locationY: 1, // bottom
//     sprite: am5.Label.new(root, {
//       text: "Bid: 100.50",
//       fill: am5.color(0xffffff),
//       background: am5.Rectangle.new(root, {
//         fill: am5.color(0xff0000),
//       }),
//       centerX: am5.p100,
//       centerY: am5.p100,
//       x: am5.p100, // move to right edge
//       dy: -20 // adjust vertical position
//     })
//   });
// });

// // For Ask Price (above Bid)
// let askBullet = valueSeries.bullets.push(function () {
//   return am5.Bullet.new(root, {
//     locationY: 1,
//     sprite: am5.Label.new(root, {
//       text: "Ask: 100.70",
//       fill: am5.color(0xffffff),
//       background: am5.Rectangle.new(root, {
//         fill: am5.color(0x00ff00),
//       }),
//       centerX: am5.p100,
//       centerY: am5.p100,
//       x: am5.p100,
//       dy: -40 // positioned above Bid
//     })
//   });
// });

// let bidLabel = am5.Label.new(root, {
//   text: `Bid ${406.1}`, // set bidPrice dynamically
//   fontSize: 12,
//   background: am5.RoundedRectangle.new(root, {
//     fill: am5.color(0x00ff00), // green for bid
//     fillOpacity: 0.8,
//   }),
//   fill: am5.color(0x000000),
//   paddingTop: 3,
//   paddingBottom: 3,
//   paddingLeft: 6,
//   paddingRight: 6,
//   x: am5.percent(100),
//   centerX: am5.percent(100),
//   y: valueAxis.valueToPosition(406.1) * stockChart.plotContainer.height() - 20, // position a bit above
//   centerY: am5.p100
// });

// let askLabel = am5.Label.new(root, {
//   text: `Ask ${406.2}`, // set askPrice dynamically
//   fontSize: 12,
//   background: am5.RoundedRectangle.new(root, {
//     fill: am5.color(0xff0000), // red for ask
//     fillOpacity: 0.8,
//   }),
//   fill: am5.color(0x000000),
//   paddingTop: 3,
//   paddingBottom: 3,
//   paddingLeft: 6,
//   paddingRight: 6,
//   x: am5.percent(100),
//   centerX: am5.percent(100),
//   y: valueAxis.valueToPosition(406.2) * stockChart.plotContainer.height(),
//   centerY: am5.p100
// });

// Add to chart
// stockChart.plotContainer.children.push(bidLabel);
// stockChart.plotContainer.children.push(askLabel);


    // Add cursor(s)
    let cursor = mainPanel.set(
      'cursor',
      am5xy.XYCursor.new(root, {
        // behavior: "zoomXY",
        // behavior: "selectXY",
        yAxis: valueAxis,
        xAxis: dateAxis,
        //snapToSeries: [valueSeries],
        //snapToSeriesBy: "y!"
      }),
    );

    cursor.lineX.set("stroke", am5.color(0xa3a3a3));
    cursor.lineY.set("stroke", am5.color(0xa3a3a3));

    cursor.lineX.set("strokeOpacity", 1);
    cursor.lineY.set("strokeOpacity", 1);

    //#region Zoom Scrollbar Setup------------------------------------------------

    const bgColor = getComputedStyle(document.body).backgroundColor;

    var scrollbarX = am5xy.XYChartScrollbar.new(root, {
      orientation: 'horizontal',
      width: 100,
      x: am5.p100,
      centerX: am5.p100,
      dx: -65,
      y: 30,
      centerY: am5.p100,
      visible: !mobileMode,
    });

    scrollbarX.thumb.setAll({
      fill: am5.color(0x232323),
      fillOpacity: 0,
    });

    scrollbarX.startGrip.setAll({
      visible: true,
      scale: 0.6,
    });

    scrollbarX.endGrip.setAll({
      visible: true,
      scale: 0.6,
    });

    scrollbarX.get('background').setAll({
      fill: am5.color(0x2d2d2d),
      fillOpacity: 0,
      cornerRadiusTR: 100,
      cornerRadiusBR: 100,
      cornerRadiusTL: 100,
      cornerRadiusBL: 100,
    });

    // mainPanel.set('scrollbarX', scrollbarX);

    //#endregion

    //#region Create volume axis
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
    var volumeAxisRenderer = am5xy.AxisRendererY.new(root, {
      inside: true,
    });

    volumeAxisRenderer.labels.template.set('forceHidden', true);
    volumeAxisRenderer.grid.template.set('forceHidden', true);

    var volumeValueAxis = mainPanel.yAxes.push(
      am5xy.ValueAxis.new(root, {
        numberFormat: '#.#a',
        height: am5.percent(20),
        y: am5.percent(100),
        centerY: am5.percent(100),
        renderer: volumeAxisRenderer,
      }),
    );

    //#region Add series
    // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
    volumeSeries = mainPanel.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'Volume',
        clustered: false,
        valueXField: 'Date',
        valueYField: 'Volume',
        xAxis: dateAxis,
        yAxis: volumeValueAxis,
        legendValueText: "[bold]{valueY.formatNumber('#,###.0a')}[/]",
      }),
    );

    volumeSeries.columns.template.setAll({
      strokeOpacity: 0,
      fillOpacity: 0.2,
    });

    // color columns by stock rules
    volumeSeries.columns.template.adapters.add('fill', function (fill, target) {
      return am5.color(
        getComputedStyle(document.querySelector('.left-nav')).color,
      );
    });

    // Set up symbol searchable drop down list
    let symbolSearchList = am5stock.DropdownListControl.new(root, {
      stockChart: stockChart,
      name: selectedAuthSymbol,
      fixedLabel: true,
      searchable: true,
      // items: symbolNames,
      items: symbolNames.map((symbolName) => ({
        id: symbolName,
        label: symbolName,
        className: symbolName === selectedAuthSymbol ? "selected-symbol" : ""
      })),
    });

    symbolSearchList.events.on('selected', function (ev) {
      // An item selected
      const matchingSymbol = symbolWithCategories.find(
        (symbol) => symbol.name === ev.item.label,
      );
      if (matchingSymbol) {
        setSelectedCategoryId(matchingSymbol.symbol_category);
        setAuthSelectedCategory(matchingSymbol.symbol_category);
        setSelectedSymbolSession(matchingSymbol.is_session_active);

        localStorage.setItem('symbol_id', matchingSymbol.id);
        localStorage.setItem('category', matchingSymbol.symbol_category);
      }
      updateSymbolName(ev.item.label);
      setAuthSelectedSymbol(ev.item.label);
    });

    //#region Series type switcher
    let seriesSwitcher = am5stock.SeriesTypeControl.new(root, {
      stockChart: stockChart,
    });

    seriesSwitcher.events.on('selected', function (ev) {
      newSetSeriesType(ev.item.id);
      setLineCandle(ev.item.id);
    });

    function getNewSettings(series) {
      let newSettings = {};
      am5.array.each(
        [
          'name',
          'valueYField',
          'highValueYField',
          'lowValueYField',
          'openValueYField',
          'calculateAggregates',
          'valueXField',
          'xAxis',
          'yAxis',
          'legendValueText',
          'stroke',
          'fill',
        ],
        function (setting) {
          newSettings[setting] = series.get(setting);
        },
      );
      return newSettings;
    }

    let wheelTimeout;
    mainPanel.events.on('wheelended', function () {
      if (wheelTimeout) {
        wheelTimeout.dispose(); // Clear previous timeout
      }

      wheelTimeout = mainPanel.setTimeout(function () {
        loadChartData(valueSeries, hourglassanimation, indicator, dateAxis, true);
      }, 50);  // Delay slightly to prevent triggering multiple calls
    });

    mainPanel.events.on('panended', function () {
      loadChartData(valueSeries, hourglassanimation, indicator, dateAxis, true);
    });

    function newSetSeriesType(seriesType) {
      // Get current series and its settings
      let currentSeries = stockChart.get('stockSeries');
      let newSettings = getNewSettings(currentSeries);

      // Remove previous series
      let data = currentSeries.data.values;
      mainPanel.series.removeValue(currentSeries);

      // Create new series
      let series;
      switch (seriesType) {
        case 'line': {
          series = mainPanel.series.push(
            am5xy.LineSeries.new(root, newSettings),
          );
          break;
        }
        case 'candlestick': {
          newSettings.clustered = false;
          series = mainPanel.series.push(
            am5xy.CandlestickSeries.new(root, newSettings),
          );
          break;
        }
        case 'procandlestick': {
          newSettings.clustered = false;
          series = mainPanel.series.push(
            am5xy.CandlestickSeries.new(root, newSettings),
          );
          if (seriesType == 'procandlestick') {
            series.columns.template.get('themeTags').push('pro');
          }
          break;
        }
        case 'ohlc': {
          newSettings.clustered = false;
          series = mainPanel.series.push(
            am5xy.OHLCSeries.new(root, newSettings),
          );
          break;
        }
        default: {
          break;
        }
      }

      // Set new series as stockSeries
      if (series) {
        series.data.setAll(data);
        stockChart.set('stockSeries', series);
      }
    }

    //set intervals...
    let intervalSwitcher = am5stock.IntervalControl.new(root, {
      stockChart: stockChart,
      currentItem: selectedTimeFrame,
      items: [
        {
          id: '1m',
          label: '1m',
          className: `interval-selected-${selectedTimeFrame === '1m'}`,
          interval: { timeUnit: 'minute', count: 1 },
        },
        {
          id: '5m',
          label: '5m',
          className: `interval-selected-${selectedTimeFrame === '5m'}`,
          interval: { timeUnit: 'minute', count: 5 },
        },
        {
          id: '15m',
          label: '15m',
          className: `interval-selected-${selectedTimeFrame === '15m'}`,
          interval: { timeUnit: 'minute', count: 15 },
        },
        {
          id: '30m',
          label: '30m',
          className: `interval-selected-${selectedTimeFrame === '30m'}`,
          interval: { timeUnit: 'minute', count: 30 },
        },
        {
          id: '1h',
          label: '1h',
          className: `interval-selected-${selectedTimeFrame === '1h'}`,
          interval: { timeUnit: 'hour', count: 1 },
        },
        {
          id: '4h',
          label: '4h',
          className: `interval-selected-${selectedTimeFrame === '4h'}`,
          interval: { timeUnit: 'hour', count: 4 },
        },
        {
          id: '1d',
          label: '1d',
          className: `interval-selected-${selectedTimeFrame === '1d'}`,
          interval: { timeUnit: 'day', count: 1 },
        },
      ],
    });

    intervalSwitcher.events.on('selected', function (ev) {
      updateChartTimeFrame(ev.item.id);
      setAuthTimeFrame(ev.item.id);
      localStorage.setItem('timeFrame', ev.item.id);
    });

    // Stock toolbar
    am5stock.StockToolbar.new(root, {
      container: document.getElementById('chartcontrols'),
      stockChart: stockChart,
      controls: [
        symbolSearchList,
        seriesSwitcher,
        intervalSwitcher,
        am5stock.IndicatorControl.new(root, {
          stockChart: stockChart,
        }),
        am5stock.DrawingControl.new(root, {
          stockChart: stockChart,
        }), 
        am5stock.SettingsControl.new(root, {
          stockChart: stockChart,
          autoSave: true
        }),
        am5stock.ResetControl.new(root, {
          stockChart: stockChart,
        }),
      ],
    });

    //#region Load initial data
    try {
      loadChartData(valueSeries, hourglassanimation, indicator);
    } catch (error) {
      console.error('Error loading chart data:', error);
      console.log(error);
    }
  //   if (savedClickedPosition) {
  //     createChartBulletClosePosition(savedClickedPosition);
  // }

    chartRef.current = stockChart;
    valueSeriesRef.current = valueSeries;
    setChartInitialized(true);
  };

  const loadChartData = (series, hourglassanimation, indicator, dateAxis, isPanEnded = false) => {
    if (isPanEnded) {

      if (dateAxis._settings.start <= 0.01) {
        if (allChartDataRef.current.length > currentChartDataRef.current.length) {
          // Calculate how many more candles to load
          const remainingCandles = allChartDataRef.current.length - currentChartDataRef.current.length;
          const candlesToLoad = Math.min(remainingCandles, candleLength);

          const additionalCandles = allChartDataRef.current
            .slice(
              Math.max(0, allChartDataRef.current.length - currentChartDataRef.current.length - candlesToLoad),
              allChartDataRef.current.length - currentChartDataRef.current.length
            )
            // .filter(candle => candle.Date < currentChartData[0]?.Date); // Avoid duplicates
            ;

          let currChartData2 = additionalCandles.concat(currentChartDataRef.current);
          //Updating reference
          currentChartDataRef.current = currChartData2

          // Update the chart series
          series.data.setAll(currChartData2);

          createChartBullets(series);
        }
      }

    } else {
      // If we don't have more data, call the API
      am5.net
        .load(
          API_ENDPOINT_KLINES_MT(
            selectedAuthSymbol,
            selectedTimeFrame,
            user?.userId,
            localStorage.getItem('symbol_id')
              ? localStorage.getItem('symbol_id')
              : selectedAuthSymbolId,
            localStorage.getItem('category')
              ? localStorage.getItem('category')
              : defaultSelectedCategory,
          ),
          series,
        )
        .then(function (result) {
          const res = am5.JSONParser.parse(result.response);
          const chartData = res.data.map((item) => {
            return {
              Date: new Date(item.time).getTime(),
              RealDate: new Date(item.time),
              Open: parseFloat(item.open),
              High: parseFloat(item.high),
              Low: parseFloat(item.low),
              Close: parseFloat(item.close),
              Volume: parseFloat(item.volume),
            };
          });


          // allChartData = chartData;
          allChartDataRef.current = chartData

          let currChartData = chartData.slice(
            Math.max(0, chartData.length - candleLength),
            chartData.length
          );

          currentChartDataRef.current = currChartData

          // Set Series data
          result.target.data.setAll(currChartData);
          // series.data.setAll(currentChartData);
          hourglassanimation.pause();
          indicator.hide();
          // dataReady = true;
          setDataReady(true);
          setIsReconnected(false);

        });
    }
  };

  let greenBullets = [];
  let greenBullets2 = [];

  const createChartBullets = () => {
    const valueSeries = valueSeriesRef.current;
  
    if (!valueSeries) {
      console.error("valueSeriesRef is not initialized");
      return;
    }
  
    // Dispose of existing bullets
    greenBullets.forEach((bullet) => bullet.dispose());
    greenBullets = []; // Reset bullets array
  
    if (showBullets) {
        // console.log("Creating bullets for open positions");
  
      const timeFrameInMinutes = {
        '1m': 1,
        '5m': 5,
        '15m': 15,
        '30m': 30,
        '1h': 60,
        '4h': 240,
        '1d': 1440,
      };
  
      const timeframe = timeFrameInMinutes[selectedTimeFrame] || 1;
  
        // Map positions by normalized time
      const bulletMap = new Map();
  
      const allPositions = [...openPositions, ...closedPositionsAll];
  
      allPositions
        .filter((position) => position.symbol === selectedAuthSymbol)
        .forEach((position) => {
          const positionTime = new Date(position.position_opened_at || position.created_at).getTime();
  
          if (isNaN(positionTime)) {
            console.warn("Skipping position due to invalid time:", position);
            return;
          }
  
          const normalizedTime = Math.floor(positionTime / (timeframe * 60 * 1000)) * (timeframe * 60 * 1000);
  
                // Create separate entries for Buy and Sell positions at the same time
          const key = `${normalizedTime}-${position.direction}`;
          if (!bulletMap.has(key)) {
            bulletMap.set(key, []);
          }
  
          bulletMap.get(key).push(position);
        });
  
        // Create bullets for each group (Buy/Sell separately)
      bulletMap.forEach((positions, key) => {
        valueSeries.bullets.push(function (root, series, dataItem) {
          const candleStartTime = new Date(dataItem.dataContext.Date).getTime();
          const [timestamp, direction] = key.split('-');
  
          if (parseInt(timestamp) === candleStartTime) {
            const bulletsForTimestamp = [];
  
            const activePositions = positions.filter(
              (p) => !closedPositionsAll.find((c) => c.position_id === p.position_id)
            );
            const closedPositions = positions.filter((p) =>
              closedPositionsAll.find((c) => c.position_id === p.position_id)
            );
  
            positions.forEach((position, index) => {
              const isBuy = position.direction === "Buy";
              const svgPath = isBuy
                ? "M0,10 L5,0 L10,10 Z" // Upward arrow
                : "M0,0 L5,10 L10,0 Z"; // Downward arrow
  
              const dy = isBuy ? (index + 1) * 20 : -(index + 1) * 20;
  
              const tooltipHTML = `
                Open: ${
                  activePositions.length > 0
                    ? activePositions.map((p) => `<div>${p.position_id}</div>`).join("")
                    : "None"
                }
                Closed: ${
                  closedPositions.length > 0
                    ? closedPositions.map((p) => `<div>${p.position_id}</div>`).join("")
                    : "None"
                }</br>
                ${activePositions.length === 0 ? "<strong>All positions closed</strong>" : ""}
              `;
  
              const arrow = am5.Graphics.new(root, {
                svgPath,
                fill: isBuy ? am5.color(selectedStyle.buyColor) : am5.color(selectedStyle.sellColor),
                stroke: am5.color("#ffffff"),
                strokeWidth: 1,
                centerY: am5.p50,
                centerX: am5.p50,
                dy,
                tooltipHTML: tooltipHTML,
              });
  
              const bullet = am5.Bullet.new(root, {
                field: isBuy ? "high" : "low",
                sprite: arrow,
              });
  
              bulletsForTimestamp.push(bullet);
            });
  
            greenBullets.push(...bulletsForTimestamp);
            return bulletsForTimestamp[0];
          }
        });
      });
    } else {
      greenBullets.forEach((bullet) => bullet.dispose());
      greenBullets = [];
    }
  };
  

// Hook to watch for closed positions and remove bullets
useEffect(() => {
    closedPositionsAll.forEach((closedPosition) => {
        const bulletIndex = greenBullets.findIndex(
            (bullet) => bullet.positionId === closedPosition.position_id
        );

        if (bulletIndex !== -1) {
            // Dispose the bullet
            greenBullets[bulletIndex].dispose();
            // Remove from the array
            greenBullets.splice(bulletIndex, 1);
        }
    });
}, [closedPositionsAll]);



const createChartBullets2 = () => {
  const valueSeries = valueSeriesRef.current;

  if (!valueSeries) {
    console.error("valueSeriesRef is not initialized");
    return;
  }

  // Dispose existing bullets
  greenBullets2.forEach((bullet) => bullet.dispose());
  greenBullets2 = []; // Reset bullets array

  if (showBullets) {
    console.log("Creating bullets for closed positions");

    const timeFrameInMinutes = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '4h': 240,
      '1d': 1440,
    };

    const timeframe = timeFrameInMinutes[selectedTimeFrame] || 1;

      // Map positions by normalized time
    const bulletMap = new Map();

    closedPositionsAll.filter((position) => position.symbol === selectedAuthSymbol).forEach((position) => {
      const positionTime = new Date(position.position_opened_at || position.created_at).getTime();

      if (isNaN(positionTime)) {
        console.warn("Skipping position due to invalid time:", position);
        return;
      }

      const normalizedTime = Math.floor(positionTime / (timeframe * 60 * 1000)) * (timeframe * 60 * 1000);

      const key = `${normalizedTime}-${position.direction}`;
      if (!bulletMap.has(key)) {
        bulletMap.set(key, []);
      }

      bulletMap.get(key).push(position);
    });

    bulletMap.forEach((positions, key) => {
      valueSeries.bullets.push(function (root, series, dataItem) {
        const candleStartTime = new Date(dataItem.dataContext.Date).getTime();
        const [timestamp, direction] = key.split('-');

        if (parseInt(timestamp) === candleStartTime) {
          const bulletsForTimestamp = [];

          positions.forEach((position, index) => {
            const isBuy = position.direction === "Buy";
            const svgPath = isBuy
              ? "M0,10 L5,0 L10,10 Z" // Upward arrow
              : "M0,0 L5,10 L10,0 Z"; // Downward arrow

            const dy = isBuy ? (index + 1) * 20 : -(index + 1) * 20;

            const tooltipHTML = `
              Closed: ${
                positions.length > 0
                  ? positions.map((p) => `<div>${p.position_id}</div>`).join("")
                  : "None"
              }
              Total Closed: ${positions.length}
            `;

            const arrow = am5.Graphics.new(root, {
              svgPath,
              fill: isBuy ? am5.color(selectedStyle.buyColor) : am5.color(selectedStyle.sellColor),
              stroke: am5.color("#ffffff"),
              strokeWidth: 1,
              centerY: am5.p50,
              centerX: am5.p50,
              dy,
              tooltipHTML: tooltipHTML,
            });

            const bullet = am5.Bullet.new(root, {
              field: isBuy ? "high" : "low",
              sprite: arrow,
            });

            bulletsForTimestamp.push(bullet);
          });

          greenBullets2.push(...bulletsForTimestamp);
          return bulletsForTimestamp[0];
        }
      });
    });
  } else {
    greenBullets2.forEach((bullet) => bullet.dispose());
    greenBullets2 = [];
  }
};



let persistentBullets = [];

const createPersistentBullets = () => {
  const valueSeries = valueSeriesRef.current;

  if (!valueSeries) {
    console.error("valueSeriesRef is not initialized");
    return;
  }

  // Clear existing bullets
  persistentBullets.forEach((bullet) => bullet.dispose());
  persistentBullets = [];

  if (showBullets) {
    console.log("Creating persistent bullets for all positions");

    const timeFrameInMinutes = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '4h': 240,
      '1d': 1440,
    };

    const timeframe = timeFrameInMinutes[selectedTimeFrame] || 1;

    const bulletMap = new Map();

    // Combine open and closed positions
    const allPositions = [...openPositions, ...closedPositionsAll];

    allPositions
      .filter((position) => position.symbol === selectedAuthSymbol)
      .forEach((position) => {
        const positionTime = new Date(position.position_opened_at || position.created_at).getTime();

        if (isNaN(positionTime)) {
          console.warn("Skipping position due to invalid time:", position);
          return;
        }

        const normalizedTime = Math.floor(positionTime / (timeframe * 60 * 1000)) * (timeframe * 60 * 1000);

        const key = `${normalizedTime}-${position.direction}`;
        if (!bulletMap.has(key)) {
          bulletMap.set(key, []);
        }

        bulletMap.get(key).push(position);
      });

    console.log("Bullet Map for Persistent Bullets:", bulletMap);

    // Create bullets for each group
    bulletMap.forEach((positions, key) => {
      valueSeries.bullets.push(function (root, series, dataItem) {
        const candleStartTime = new Date(dataItem.dataContext.Date).getTime();
        const [timestamp, direction] = key.split('-');

        if (parseInt(timestamp) === candleStartTime) {
          const bulletsForTimestamp = [];

          // Filter open and closed positions at this timestamp
          const openPositionsAtTime = positions.filter(
            (p) => !closedPositionsAll.find((c) => c.position_id === p.position_id)
          );
          const closedPositionsAtTime = positions.filter((p) =>
            closedPositionsAll.find((c) => c.position_id === p.position_id)
          );

          positions.forEach((position, index) => {
            const isBuy = position.direction === "Buy";
            const svgPath = isBuy
              ? "M0,10 L5,0 L10,10 Z"
              : "M0,0 L5,10 L10,0 Z";

            const dy = isBuy ? (index + 1) * 20 : -(index + 1) * 20;

            const tooltipHTML = `
              Open:${
                openPositionsAtTime.length > 0
                  ? openPositionsAtTime
                      .map((p) => `<div>${p.position_id}</div>`)
                      .join("")
                  : "None"
              }
              Closed:${
                closedPositionsAtTime.length > 0
                  ? closedPositionsAtTime
                      .map((p) => `<div>${p.position_id}</div>`)
                      .join("")
                  : "None"
              }
              Total: ${
                positions.length
              } positions<br>${openPositionsAtTime.length === 0 ? "<strong>All positions closed</strong>" : ""}`;

            const arrow = am5.Graphics.new(root, {
              svgPath,
              fill: isBuy
                ? am5.color(selectedStyle.buyColor)
                : am5.color(selectedStyle.sellColor),
              stroke: am5.color("#ffffff"),
              strokeWidth: 1,
              centerY: am5.p50,
              centerX: am5.p50,
              dy,
              tooltipHTML: tooltipHTML,
            });

            const bullet = am5.Bullet.new(root, {
              field: isBuy ? "high" : "low",
              sprite: arrow,
            });

            bulletsForTimestamp.push(bullet);
          });

          persistentBullets.push(...bulletsForTimestamp); // Save bullets
          return bulletsForTimestamp[0];
        }
      });
    });
  } else {
    persistentBullets.forEach((bullet) => bullet.dispose());
    persistentBullets = [];
  }
};


// useEffect(() => {
//   if (clickedPosition) {
//     createChartBulletClosePosition(clickedPosition);
//   }
// }, [chartInitialized, clickedPosition]);



// useEffect(() => {
//   if (root && valueSeriesRef.current && clickedPosition) {
//     createChartBulletClosePosition(clickedPosition);
//   }
// }, [root, valueSeriesRef.current, clickedPosition]);



// let savedClickedPosition = null;
// let orangeBullets = []; 

// const createChartBulletClosePosition = (clickedPosition) => {
//   if (!clickedPosition) {
//     console.warn("No clicked position provided.");
//     return;
//   }

//   const valueSeries = valueSeriesRef.current;

//   if (!valueSeries) {
//     console.error("valueSeriesRef is not initialized.");
//     return;
//   }
//   orangeBullets.forEach((bullet) => bullet.dispose());
//   orangeBullets = []; 

//   if (showBullets) {
//     const { id, symbol, closedAt, direction } = clickedPosition;

//     let targetCandle = null;

//     valueSeries.bullets.push(function (root, series, dataItem) {
//       const candleStartTime = new Date(dataItem.dataContext.Date).getTime();
//       const closedTime = new Date(closedAt).getTime();
//       const candleDuration = {
//         '1m': 60 * 1000,
//         '5m': 5 * 60 * 1000,
//         '15m': 15 * 60 * 1000,
//         '30m': 30 * 60 * 1000,
//         '1h': 60 * 60 * 1000,
//         '4h': 4 * 60 * 60 * 1000,
//         '1d': 24 * 60 * 60 * 1000,
//       }[selectedTimeFrame];

//       const isWithinCandle =
//         closedTime >= candleStartTime &&
//         closedTime < candleStartTime + candleDuration;

//       if (symbol === selectedAuthSymbol && isWithinCandle) {
//         // Save the target candle for zooming
//         targetCandle = dataItem.dataContext;

//         const isBuy = direction === "Buy";

//         const svgPath = isBuy
//           ? "M0,0 L5,10 L10,0 Z"  
//           : "M0,10 L5,0 L10,10 Z";

//         const bullet = am5.Graphics.new(root, {
//           svgPath: svgPath,
//           fill: isBuy ? am5.color("rgb(17, 209, 97)") : am5.color("rgb(245, 36, 36)"),
//           stroke: am5.color("#ffffff"),
//           strokeWidth: 1,
//           centerX: am5.p50,
//           centerY: am5.p50,
//           dy: isBuy ? -20 : 20,
//           tooltipText: `Position ID: ${id}\nDirection: ${direction}\nSymbol: ${symbol}\nClosed At: ${new Date(closedAt).toLocaleString()}`,
//         });

//         const newBullet = am5.Bullet.new(root, {
//           field: isBuy ? "high" : "low",
//           sprite: bullet,
//         });

//         orangeBullets.push(newBullet);
//         return newBullet;
//       }
//     });

//     if (targetCandle) {
//       const xAxis = valueSeries.get("xAxis");
//       if (xAxis) {
        
//         const targetDate = targetCandle.Date; 
//         const zoomStartDate = new Date(targetDate - 2 * 60 * 1000);
//         const zoomEndDate = new Date(targetDate + 2 * 60 * 1000); 

//         xAxis.zoomToDates(zoomStartDate, zoomEndDate); 
//         console.log("Chart zoomed to candle:", targetCandle);
//       } else {
//         console.error("xAxis is not initialized.");
//       }
//     }

//     // Draw the position line
//     // drawPositionLine(clickedPosition);
//   } else {
//     console.log("Clearing orange bullets");
//     orangeBullets.forEach((bullet) => bullet.dispose());
//     orangeBullets = [];
//   }
// };


// let positionLines = [];

// const drawPositionLine = (clickedPosition) => {
//   if (!clickedPosition) {
//     console.warn("No clicked position provided.");
//     return;
//   }

//   const valueSeries = valueSeriesRef.current;
//   if (!valueSeries) {
//     console.error("Value series is not initialized.");
//     return;
//   }

//   // Clear existing lines
//   positionLines.forEach((line) => line.dispose());
//   positionLines = [];

//   const { openedAt, closedAt, direction } = clickedPosition;

//   const openingDate = new Date(openedAt).getTime();
//   const closingDate = new Date(closedAt).getTime();

//   const data = valueSeries.data.values;

//   // Helper function to find the closest candle
//   const findClosestCandle = (targetTime) => {
//     return data.reduce((closest, candle) => {
//       const candleTime = candle.Date;
//       if (
//         !closest ||
//         Math.abs(targetTime - candleTime) < Math.abs(targetTime - closest.Date)
//       ) {
//         return candle;
//       }
//       return closest;
//     }, null);
//   };

//   // Get the opening and closing candles
//   const openingCandle = findClosestCandle(openingDate);
//   const closingCandle = findClosestCandle(closingDate);

//   if (!openingCandle || !closingCandle) {
//     console.warn("Opening or closing candle not found.");
//     return;
//   }

//   const xAxis = valueSeries.get("xAxis");
//   const yAxis = valueSeries.get("yAxis");

//   if (!xAxis || !yAxis) {
//     console.error("Axes are not initialized.");
//     return;
//   }

//   const root = valueSeries._root;

//   // Calculate line coordinates
//   const startX = xAxis.valueToPosition(openingCandle.Date) * root.container.width();
//   const startY = yAxis.valueToPosition(openingCandle.Close) * root.container.height();
//   const endX = xAxis.valueToPosition(closingCandle.Date) * root.container.width();
//   const endY = yAxis.valueToPosition(closingCandle.Close) * root.container.height();

//   if (isNaN(startX) || isNaN(startY) || isNaN(endX) || isNaN(endY)) {
//     console.error("Invalid line coordinates.");
//     return;
//   }

//   console.log("Start X, Y:", startX, startY);
//   console.log("End X, Y:", endX, endY);

//   // Draw the line
//   const line = am5.Graphics.new(root, {
//     stroke: am5.color(direction === "Buy" ? "rgb(17, 209, 97)" : "rgb(245, 36, 36)"),
//     strokeWidth: 2,
//     strokeDasharray: [3, 3],
//     layer: 100,
//   });

//   line.set("draw", (display) => {
//     display.moveTo(startX, startY);
//     display.lineTo(endX, endY);
//   });

//   valueSeries.bulletsContainer.children.push(line);
//   positionLines.push(line);

//   console.log("Line drawn successfully!");
// };






  // useEffect(() => {
  //   return () => {
  //     chartRef.current && chartRef.current.dispose();
  //   };
  // }, []);
function formatNumber(num, max_limit = 8) {
    let numStr = num.toString();
    
    if (numStr.length <= max_limit) {
       return num;
    } 

    let [integerPart, decimalPart] = numStr.split(".");

    if (integerPart.length >= max_limit) {
        return parseFloat(integerPart);
    }

    let allowedDecimals = max_limit - integerPart.length - 1;
    let truncatedDecimal = decimalPart.substring(0, allowedDecimals);

    let formattedNum = `${integerPart}.${truncatedDecimal}`;
    
    return parseFloat(formattedNum);
}

  // update price chart with live feeds
  const updateLiveFeedData = () => {
    if (
      platFromData.length > 0 &&
      platFromData[1] &&
      platFromData[1] != undefined &&
      platFromData[1] != 'undefined' &&
      stockChart2 != null &&
      currentLabel2 != null &&
      currentValueDataItem2 != null &&
      platFromData[1].s == selectedAuthSymbol
    ) {
      // Create a new data point based on the live feed data
      const liveFeedData = {
        Date: new Date(platFromData[1].t).getTime(), // Assuming the timestamp is in milliseconds
        Open: parseFloat(platFromData[1].o),
        High: parseFloat(platFromData[1].h),
        Low: parseFloat(platFromData[1].l),
        Close: parseFloat(platFromData[1].c),
        Volume: parseFloat(platFromData[1].v),
        askPrice: parseFloat(platFromData[1].ask),
      };
      // console.log("Live feed",liveFeedData);
      
      // Get the series for candlestick chart
      // console.log('valueSeries', stockChart2);
      let valueSeries = stockChart2.get('stockSeries');
      // console.log("st", valueSeries, liveFeedData);

      // Get the current timestamp
      let date = liveFeedData.Date; //Date.now();
      // console.log("Live Data Timestamp:", date);

      // Variable to store the new value for the live feed
      let value;
      let volume;

      // Get the last data object in the series
      let lastDataObject = valueSeries.data.getIndex(
        valueSeries.data.length - 1,
      );
      if (lastDataObject) {
        // Get the previous date and closing value from the last data object
        let previousDate = lastDataObject.Date;
        let previousValue = lastDataObject.Close;

        // set live price value
        value = liveFeedData.Close;

        volume = liveFeedData.Volume;

        // Get the high, low, and open values from the last data object
        let high = lastDataObject.High;
        let low = lastDataObject.Low;
        let open = lastDataObject.Open;

        // Check if a minute has passed since the previous data point
        if (am5.time.checkChange(date, previousDate, timeFrameChartSetup)) {
          open = value;
          high = value;
          low = value;

          let dObj1 = {
            Date: date,
            Close: value,
            Open: value,
            Low: value,
            High: value,
            Volume: volume,
          };

          // Add the new data object to the series
          valueSeries.data.push(dObj1);

          previousDate = date;

          currentChartDataRef.current.push(dObj1)

        } else {
          if (value > high) {
            high = value;
          }
          if (value < low) {
            low = value;
          }

          // Update the existing data object for the current minute
          let dObj2 = {
            Date: date,
            Close: value,
            Open: open,
            Low: low,
            High: high,
            Volume: volume,
          };

          // Replace the last data object in the series with the updated data
          valueSeries.data.setIndex(valueSeries.data.length - 1, dObj2);
        }
        // Update the live data label and animation if available
        if (currentLabel2) {
          currentValueDataItem2.set('value', value);
          // currentValueDataItemNew.set('value', liveFeedData.askPrice)
          currentValueDataItemNew.set('value', liveFeedData.askPrice);
          currentLabel2.set(
            'text',
            // formatPriceUptoDecimals(value, symbolInfo.digit),
            parseFloat(value),
            // formatNumber(value , symbolInfo?.digit)
          );
          currentLabelNew2.set(
            'text',
            parseFloat(liveFeedData.askPrice),
            // formatPriceUptoDecimals(liveFeedData.askPrice, symbolInfo.digit),
          );
          let bg = currentLabel2.get('background');
          let bg2 = currentLabelNew2.get('background');
          if (bg) {
            bg.set('fill', am5.color(selectedStyle.sellColor));
          }
          if (bg2) {
            bg2.set('fill', am5.color(selectedStyle.buyColor));
          }
        }
      }
    }
  };

  //show spinner while loading data
  if (loadingSymbolContext) {
    return <Spinner />;
  }

  return (
    <div className="Chart global-platfrom">
      <div id="chartcontrols"></div>
      <div id="chartdiv"></div>
    </div>
  );
};

export default Chart;

import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import $ from "jquery";
import Spinner from "../../utils/spinner/Spinner";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5stock from "@amcharts/amcharts5/stock";
import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";
import am5themes_Default from "@amcharts/amcharts5/themes/Responsive";
import {  API_ENDPOINT_KLINES } from "../../../data/Endpoints-API";
import { WS_ENDPOINT_KLINE_LIVE_FEEDS } from "../../../data/Endpoints-WS";
import { ws_create } from "../../../data/websocket/Websocket-Middleware";
import { useSymbolContext } from "../../../contexts/Symbol-Context";
import { useAuthContext } from "../../../contexts/Auth-Context";
import { useChartContext } from "../../../contexts/Chart-Context";
import { useThemeContext } from "../../../contexts/Theme-Context";
import "./Chart.scss";
import "./Chart-Toolbar.scss";
import { useAccountManagerContext } from "../../../contexts/Account-Manager-Context.js";
import { formatPriceUptoDecimals } from "../../../utils/format";


const Chart = () => {
  const { openPositions, closedPositions } = useAccountManagerContext();
  let preY = 0;
  window.addEventListener("mousemove", (event) => {
    const nowY = event.clientY;
    if (nowY < preY) {
      // console.log('mouse up');
    } else if (nowY > preY) {
      // console.log('mouse down');
    }
    preY = nowY;
  });

  // Context
  const { theme } = useThemeContext();
  const {
    loadingSymbolContext,
    symbolNames,
    updateSymbolName,
    symbolInfo,
    updateSymbolDetailsData,
    selectedCategoryId,
    setSelectedCategoryId,
    symbolWithCategories,
    selectedSymbolSession,
    setSelectedSymbolSession
  } = useSymbolContext();
  const { user, platFromData, setAuthSelectedSymbol, setAuthTimeFrame, selectedAuthTimeFrame, setAuthSelectedCategory,authSelectedCategory ,selectedAuthSymbol} = useAuthContext();
  const { selectedTimeFrame, updateChartTimeFrame, selectedSeriesType, setSelectedSeriesType, zoomRange, lineCandle, setLineCandle, riseFromOpenColor, setRiseFromOpenColor, dropFromOpenColor, setDropFromOpenColor } = useChartContext();

  const makeChartTab = (selectedAuthSymbol) => {
    if (localStorage.chartTabs === undefined) {
      localStorage.setItem('chartTabs', selectedAuthSymbol);
    } else {
      let preGetValues = localStorage.chartTabs;
      const setNewValues = preGetValues + ',' + selectedAuthSymbol;
      if (preGetValues.split(',').includes(selectedAuthSymbol) === false) {
        if (preGetValues.split(',').length <= 4) {
          localStorage.setItem('chartTabs', setNewValues);
        } else {
          const valuesArray = preGetValues.split(',');
          valuesArray[valuesArray.length - 1] = selectedAuthSymbol;
          localStorage.setItem('chartTabs', valuesArray);
        }
      }
    }
    const tabs = document.querySelector('.chart-tabs');
    const setActive = (e, symbol) => {
      for (let i = 0; i < tabs.children.length; i++) {
        tabs.children[i].removeAttribute('active');
      }
      if (symbol === true) {
        document.getElementById(e).setAttribute('active', 'true');
      } else {
        e.setAttribute('active', 'true');
      }
    }
    if (tabs.querySelector(`#${selectedAuthSymbol}`) === null) {
      if (tabs.children[4] !== undefined) {
        tabs.children[4].remove();
      }
      const tab = document.createElement('div');
      const action = document.createElement('div');
      const close = document.createElement('span');
      close.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
      </svg>`;
      close.addEventListener('click', () => {
        if (tabs.children.length > 1) {
          document.getElementById('closeSound').play();
          document.getElementById(selectedAuthSymbol).remove();
          tabs.children[tabs.children.length - 1].children[0].click();
          const tabsArray = localStorage.chartTabs.split(',');
          const symbolIndex = tabsArray.indexOf(selectedAuthSymbol);
          let reValue = [];
          for (let i = 0; i < tabsArray.length; i++) {
            if (tabsArray[symbolIndex] !== tabsArray[i]) {
              reValue.push(tabsArray[i]);
            }
          }
          localStorage.setItem('chartTabs', reValue);
        }
      });
      tab.className = 'newTab';
      tab.id = selectedAuthSymbol;
      action.className = 'tabSymbol';
      action.innerHTML = selectedAuthSymbol;
      action.addEventListener('click', () => {
        setAuthSelectedSymbol(selectedAuthSymbol);
        setActive(selectedAuthSymbol, true);
      })
      tab.append(action);
      tab.append(close);
      setActive(tab, false);
      tabs.append(tab);
    } else {
      setActive(selectedAuthSymbol, true);
    }
  }
  useEffect(() => {
    if (localStorage.chartTabs !== undefined) {
      const chartTabs = localStorage.chartTabs.split(',');
      for (let i = 0; i < chartTabs.length; i++) {
        makeChartTab(chartTabs[i]);
      }
    }
  }, []);
  useEffect(() => {
    if (selectedAuthSymbol !== '') {
      makeChartTab(selectedAuthSymbol);
      updateSymbolDetailsData(selectedAuthSymbol);
      // setTimeout(() => {
      //   document.getElementsByClassName("am5stock")[4].click();
      //   document.getElementsByClassName("am5stock")[7].click();
      // }, 5000);
    }
  }, [selectedAuthSymbol])


  // Constants
  const WS_MESSAGE_EVENT_LISTENER = "ws_data_kline";


  //local states
  let [wsKline, setWsKline] = useState(null);
  let [stockChart, setStockChart] = useState(null);
  let [stockChart2, setStockChart2] = useState(null);
  let [numberFormat, setnumberFormat] = useState("#,###.00");
  let [timeFrameChartSetup, setTimeFrameChartSetup] = useState("minute");
  let [currentLabel, setCurrentLabel] = useState(null);
  let [currentLabel2, setCurrentLabel2] = useState(null);
  let [currentValueDataItem, setCurrentValueDataItem] = useState(null);
  let [currentValueDataItem2, setCurrentValueDataItem2] = useState(null);

  let root = null;

  function convertDateTimeToTimestamp(dateTimeString) {
    // Parse the date and time string
    var [datePart, timePart] = dateTimeString.split(" ");
    var [year, month, day] = datePart.split("-");
    var [hour, minute, second] = timePart.split(":");

    // Create a new Date object with the provided components
    var date = new Date(year, month - 1, day, hour, minute, second); // Month is zero-indexed, so subtract 1

    // Get the Unix timestamp by calling the getTime() method on the Date object
    var timestamp = date.getTime();

    // Return the Unix timestamp
    return timestamp;
  }


  // useEffect to handle component lifecycle
  useEffect(() => {
    //nothing will load in this component until SymbolContext fully loaded
    if (!loadingSymbolContext) {
      // Add the 'hidden-label' class to labels to hide on mount
      $(document).ready(() => {
        $(
          '.am5stock-control-label:contains("Candles"),' +
          '.am5stock-control-label:contains("Indicators"),' +
          '.am5stock-control-label:contains("Draw")'
        ).addClass("hidden");
      });
      chartSetup();
      setStockChart2(stockChart);
      setCurrentLabel2(currentLabel);
      setCurrentValueDataItem2(currentValueDataItem);
    }
  }, [loadingSymbolContext, selectedAuthSymbol, selectedTimeFrame, zoomRange, theme, riseFromOpenColor, dropFromOpenColor, selectedSeriesType, localStorage.positionMarker, localStorage.chartTooltips]);

  useEffect(() => {
    let upPriceColor = getComputedStyle(document.getElementById("chartUpColor")).backgroundColor;
    let downPriceColor = getComputedStyle(document.getElementById("chartDownColor")).backgroundColor;
    setRiseFromOpenColor(upPriceColor);
    setDropFromOpenColor(downPriceColor);
  }, [theme]);



  useEffect(() => {
    //nothing will load in this component until SymbolContext fully loaded
    if (!loadingSymbolContext ) {
      // setTimeout(() => {
      updateLiveFeedData(stockChart2, currentLabel2);


      // stockChart.set("volumeSeries", volumeSeries);

      // }, 10000); 
    }
  }, [platFromData[1]]);

  // Cleanup function for component unmounting
  const cleanup = async () => {
    // if (wsKline) {
    //   let eventListenerDynamicName =
    //     WS_MESSAGE_EVENT_LISTENER + "_" + selectedAuthSymbol;
    //   document.removeEventListener(
    //     eventListenerDynamicName,
    //     handleLiveFeedData
    //   );
    // }

    if (root) {
      //dispose root if there is any because only root could exists
      maybeDisposeRoot('chartdiv');
    }
  };

  //dispose root if there is any because only root could exists
  const maybeDisposeRoot = (divId) => {
    am5.array.each(am5.registry.rootElements, function (root) {
      if (root.dom.id == divId) {
        root.dispose();
      }
    });
  };

  // Main chart setup function
  const chartSetup = () => {

    //dispose root if there is any because only root could exists
    maybeDisposeRoot('chartdiv');

    //#region CHART CONFIGURATION----------------------------------------------------------------------------------------------------------------------
    root = am5.Root.new('chartdiv');

    //custom theme
    const myTheme = am5.Theme.new(root);

    myTheme.rule("Grid").setAll({
      stroke: am5.color(0x808080),
      strokeWidth: 1,
    });

    myTheme.rule("Label").setAll({
      fill: am5.color(0x808080),
    });

    // Set themes
    if (theme === 'light') {
      root.setThemes([
        am5themes_Default.new(root),
        myTheme,
      ]);
    } else {
      root.setThemes([
        am5themes_Dark.new(root),
        myTheme,
      ]);
    }

    // Create a stock chart
    stockChart = root.container.children.push(
      am5stock.StockChart.new(root, {})
    );

    // Set global number format
    root.numberFormatter.set("numberFormat", numberFormat);

    // Create a main stock panel (chart)
    let mainPanel = stockChart.panels.push(
      am5stock.StockPanel.new(root, {
        panX: true,
        panY: true,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true,
        pinchZoomY: true,
      })
    );

    // const horizontalLine = mainPanel.series.push(new am5xy.LineSeries());
    // horizontalLine.data = [{ date: data[0].date, price: 105 }, { date: data[data.length - 1].date, price: 105 }];
    // horizontalLine.stroke = am5.color("#000000");
    // horizontalLine.strokeDasharray = "3,3";

    // Create value/vertical axis
    let valueAxis = mainPanel.yAxes.push(
      am5xy.ValueAxis.new(root, {
        start: 0.9, //show 10% candles on load
        renderer: am5xy.AxisRendererY.new(root, {
          pan: "zoom",
        }),
        extraMin: 0.1, // adds some space for for main series
        extraMax: 0.4, // adds some space for for main series
        tooltip: am5.Tooltip.new(root, {}),
        numberFormat: numberFormat,
        extraTooltipPrecision: 2,
      })
    );


    // Create date/horizontal axis
    let dateAxis = mainPanel.xAxes.push(
      am5xy.GaplessDateAxis.new(root, {
        start: zoomRange, //show 10% candles on load
        baseInterval: {
          timeUnit: timeFrameChartSetup,
          count: 1,
        },
        renderer: am5xy.AxisRendererX.new(root, {
          pan: "zoom",
        }),
        tooltip: am5.Tooltip.new(root, {}),
        end: 1.1, // increase the end value to add space on the right side
      })
    );

    // add range which will show current value
    currentValueDataItem = valueAxis.createAxisRange(
      valueAxis.makeDataItem({ value: 0 })
    );
    currentLabel = currentValueDataItem.get("label");
    if (currentLabel) {
      currentLabel.setAll({
        fill: am5.color(0xffffff),
        background: am5.Rectangle.new(root, { fill: am5.color(0x000000) }),
      });
    }


    let currentGrid = currentValueDataItem.get("grid");
    if (currentGrid) {
      currentGrid.setAll({ strokeOpacity: 0.5, strokeDasharray: [2, 5] });
    }

    // Add series
    let valueSeries;
    var tooltip;
    const textColor = getComputedStyle(document.querySelector('#textBoldColor')).color;

    const chartTooltips = () => {
      tooltip = am5.Tooltip.new(root, {
        pointerOrientation: "up",
        getFillFromSprite: false,
        getStrokeFromSprite: false,
        autoTextColor: false,
        getLabelFillFromSprite: true,
        labelHTML: `<p style="color:${textColor};" >Open: {openValueY} </br> Low: {lowValueY} </br> High: {highValueY} </br> Close: {valueY}</p>`,
      });
      tooltip.get("background").setAll({
        fill: getComputedStyle(document.querySelector('.left-nav')).backgroundColor,
        stroke: false,
      });
    }

    if (localStorage.chartTooltips === 'show') {
      chartTooltips();
    }

    if (selectedSeriesType == 'line') {
      valueSeries = mainPanel.series.push(
        am5xy.LineSeries.new(root, {
          name: selectedAuthSymbol,
          clustered: false,
          valueXField: "Date",
          valueYField: "Close",
          highValueYField: "High",
          lowValueYField: "Low",
          openValueYField: "Open",
          calculateAggregates: true,
          xAxis: dateAxis,
          yAxis: valueAxis,
          tooltip: tooltip
        })
      );
    }
    else if (selectedSeriesType == 'ohlc') {
      valueSeries = mainPanel.series.push(
        am5xy.OHLCSeries.new(root, {
          name: selectedAuthSymbol,
          clustered: false,
          valueXField: "Date",
          valueYField: "Close",
          highValueYField: "High",
          lowValueYField: "Low",
          openValueYField: "Open",
          calculateAggregates: true,
          xAxis: dateAxis,
          yAxis: valueAxis,
          tooltip: tooltip
        })
      );
    }
    else {
      valueSeries = mainPanel.series.push(
        am5xy.CandlestickSeries.new(root, {
          name: selectedAuthSymbol,
          clustered: false,
          valueXField: "Date",
          valueYField: "Close",
          highValueYField: "High",
          lowValueYField: "Low",
          openValueYField: "Open",
          calculateAggregates: true,
          xAxis: dateAxis,
          yAxis: valueAxis,
          tooltip: tooltip
        })
      );
    }

    setTimeout(() => {
      console.log('riseFromOpenColor', riseFromOpenColor);
      // if (riseFromOpenColor !== undefined
      //   && selectedSeriesType !== 'line' && lineCandle !== 'line') {
        valueSeries.columns.template.states.create("riseFromOpen", {
          fill: am5.color(riseFromOpenColor),
          stroke: am5.color(riseFromOpenColor)
        });

        valueSeries.columns.template.states.create("dropFromOpen", {
          fill: am5.color(dropFromOpenColor),
          stroke: am5.color(dropFromOpenColor)
        });
      // }
    }, 1000);

    // Set main value series
    stockChart.set("stockSeries", valueSeries);
    stockChart.set("volumeSeries", volumeSeries);

    // Add a stock legend
    let valueLegend = mainPanel.plotContainer.children.push(
      am5stock.StockLegend.new(root, {
        stockChart: stockChart,
      })
    );

    // Set main series
    // valueLegend.data.setAll([valueSeries]);

    // Add cursor(s)
    mainPanel.set(
      "cursor",
      am5xy.XYCursor.new(root, {
        // behavior: "zoomXY",
        // behavior: "selectXY",
        yAxis: valueAxis,
        xAxis: dateAxis,
        //snapToSeries: [valueSeries],
        //snapToSeriesBy: "y!"
      })
    );
    const bgColor = getComputedStyle(document.body).backgroundColor;

    var scrollbarX = am5xy.XYChartScrollbar.new(root, {
      orientation: "horizontal",
      width: 100,
      x: am5.p100,
      centerX: am5.p100,
      dx: -65,
      y: 8,
      centerY: am5.p100,
    });

    scrollbarX.thumb.setAll({
      fill: bgColor,
      fillOpacity: 0
    });

    scrollbarX.startGrip.setAll({
      visible: true,
      scale: 0.6
    });

    scrollbarX.endGrip.setAll({
      visible: true,
      scale: 0.6
    });

    scrollbarX.get("background").setAll({
      fill: bgColor,
      fillOpacity: 0,
      cornerRadiusTR: 100,
      cornerRadiusBR: 100,
      cornerRadiusTL: 100,
      cornerRadiusBL: 100
    });

    mainPanel.set("scrollbarX", scrollbarX);

    // Create volume axis
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
    var volumeAxisRenderer = am5xy.AxisRendererY.new(root, {
      inside: true
    });

    volumeAxisRenderer.labels.template.set("forceHidden", true);
    volumeAxisRenderer.grid.template.set("forceHidden", true);

    var volumeValueAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
      numberFormat: "#.#a",
      height: am5.percent(20),
      y: am5.percent(100),
      centerY: am5.percent(100),
      renderer: volumeAxisRenderer
    }));

    // Add series
    // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
    var volumeSeries = mainPanel.series.push(am5xy.ColumnSeries.new(root, {
      name: "Volume",
      clustered: false,
      valueXField: "Date",
      valueYField: "Volume",
      xAxis: dateAxis,
      yAxis: volumeValueAxis,
      legendValueText: "[bold]{valueY.formatNumber('#,###.0a')}[/]"
    }));

    volumeSeries.columns.template.setAll({
      strokeOpacity: 0,
      fillOpacity: 0.2
    });

    // color columns by stock rules
    volumeSeries.columns.template.adapters.add("fill", function (fill, target) {
      return am5.color(getComputedStyle(document.querySelector('.left-nav')).color);
    })
    // volumeSeries.columns.template.adapters.add("fill", function(fill, target) {
    //   var dataItem = target.dataItem;
    //   if (dataItem) {
    //     return stockChart.getVolumeColor(dataItem);
    //   }
    //   return fill;
    // })



    // Set main series
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/charts/stock-chart/#Setting_main_series

    // mainPanel.plotContainer.children.push(am5.Picture.new(root, {
    //   src: "https://assets.codepen.io/t-160/amcharts_light.svg",
    //   width: 100,
    //   x: am5.p100,
    //   centerX: am5.p100,
    //   dx: -35,
    //   y: am5.p100,
    //   centerY: am5.p100
    // }));


    //----------------------------------------------------CHART CONFIGURATION (end)------------------------------------------------------------------
    //#endregion

    //#region CHART DATA-----------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------CHART DATA (start)-------------------------------------------------------------------------

    //create web-socket instance for the component
    // wsKline = ws_create();

    // let eventListener_dynamicName =
    //   WS_MESSAGE_EVENT_LISTENER + "_" + selectedAuthSymbol;
    //open web socket connection to the provided end point
    // wsKline.ws_connect(
    //   WS_ENDPOINT_KLINE_LIVE_FEEDS(
    //     user?.userId,
    //     selectedAuthSymbol,
    //     selectedTimeFrame
    //   ),
    //   eventListener_dynamicName
    // );

    //listen event emit(dispatched) from on-message event of web-socket-middleware
    // document.addEventListener(eventListener_dynamicName, handleLiveFeedData);



    // Load initial data for the first series
    try {
      // loadChartData([valueSeries,volumeSeries], dateAxis);
      loadChartData([valueSeries], dateAxis);
    } catch (error) {
      console.error("Error loading chart data:", error);
      console.log(error)
    }

    //----------------------------------------------------CHART DATA (end)-------------------------------------------------------------------------
    //#endregion

    //#region CHART TOOLBAR-----------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------CHART TOOLBAR (start)-------------------------------------------------------------------------

    // Set up symbol searchable drop down list
    let symbolSearchList = am5stock.DropdownListControl.new(root, {
      stockChart: stockChart,
      name: selectedAuthSymbol,
      fixedLabel: true,
      searchable: true,
      items: symbolNames,
    });

    symbolSearchList.events.on("selected", function (ev) {
      // An item selected
      symbolWithCategories.map((symbol) => {
        if (symbol.name === ev.item.label) {
          setSelectedCategoryId(symbol.symbol_category);
          setAuthSelectedCategory(symbol.symbol_category);
          setSelectedSymbolSession(symbol.is_session_active);
        }
      })
      updateSymbolName(ev.item.label);
      setAuthSelectedSymbol(ev.item.label)
      // updateSymbolDetailsData(ev.item.label);
    });

    // Set up series type switcher
    let seriesSwitcher = am5stock.SeriesTypeControl.new(root, {
      stockChart: stockChart,
    });

    seriesSwitcher.events.on("selected", function (ev) {
      setSeriesType(ev.item.id);
      setLineCandle(ev.item.id);
      const svg = new XMLSerializer().serializeToString(ev.item.icon);
      const chartData = { type: ev.item.id, icon: svg };
      const storeable = JSON.stringify(chartData);
      localStorage.setItem('chartData', storeable);
      setTimeout(() => {
        const seriesIcon = document.getElementsByClassName('am5stock-control-icon')[1];
        seriesIcon.innerHTML = JSON.parse(localStorage.chartData).icon;
      }, 1000);
    });

    function getNewSettings(series) {
      let newSettings = [];
      am5.array.each(
        [
          "name",
          "valueYField",
          "highValueYField",
          "lowValueYField",
          "openValueYField",
          "calculateAggregates",
          "valueXField",
          "xAxis",
          "yAxis",
          "legendValueText",
          "stroke",
          "fill",
        ],
        function (setting) {
          newSettings[setting] = series.get(setting);
        }
      );
      return newSettings;
    }

    function setSeriesType(seriesType) {
      // Get current series and its settings
      let currentSeries = stockChart.get("stockSeries");
      let newSettings = getNewSettings(currentSeries);

      // Remove previous series
      let data = currentSeries.data.values;
      mainPanel.series.removeValue(currentSeries);

      // Create new series
      let series;
      switch (seriesType) {
        case "line": {
          series = mainPanel.series.push(
            am5xy.LineSeries.new(root, newSettings)
          );
          setSelectedSeriesType('line');
          break;
        }
        case "candlestick": {
          newSettings.clustered = false;
          series = mainPanel.series.push(
            am5xy.CandlestickSeries.new(root, newSettings)
          );
          setSelectedSeriesType('candlestick');
          break;
        }
        case "procandlestick":
          {
            newSettings.clustered = false;
            series = mainPanel.series.push(
              am5xy.CandlestickSeries.new(root, newSettings)
            );
            if (seriesType == "procandlestick") {
              series.columns.template.get("themeTags").push("pro");
            }
            setSelectedSeriesType('procandlestick');
            break;
          }
        case "ohlc":
          {
            newSettings.clustered = false;
            series = mainPanel.series.push(
              am5xy.OHLCSeries.new(root, newSettings)
            );
            setSelectedSeriesType('ohlc');
            break;
          }
      }

      // Set new series as stockSeries
      if (series) {
        valueLegend.data.removeValue(currentSeries);
        series.data.setAll(data);
        stockChart.set("stockSeries", series);
        let cursor = mainPanel.get("cursor");
        if (cursor) {
          cursor.set("snapToSeries", [series]);
        }
        valueLegend.data.insertIndex(0, series);
      }
    }

    //set intervals...
    let intervalSwitcher = am5stock.IntervalControl.new(root, {
      stockChart: stockChart,
      currentItem: selectedTimeFrame,
      items: [
        { id: "1m", label: "1m", interval: { timeUnit: "minute", count: 1 } },
        { id: "5m", label: "5m", interval: { timeUnit: "minute", count: 5 } },
        {
          id: "15m",
          label: "15m",
          interval: { timeUnit: "minute", count: 15 },
        },
        {
          id: "30m",
          label: "30m",
          interval: { timeUnit: "minute", count: 30 },
        },
        { id: "1h", label: "1h", interval: { timeUnit: "hour", count: 1 } },
        { id: "4h", label: "4h", interval: { timeUnit: "hour", count: 4 } },
        { id: "1d", label: "1d", interval: { timeUnit: "day", count: 1 } },
        // { id: "1w", label: "1w", interval: { timeUnit: "week", count: 1 } },
        // { id: "1M", label: "1M", interval: { timeUnit: "month", count: 1 } },
        // { id: "1Y", label: "1Y", interval: { timeUnit: "year", count: 1 } }
      ],
    });

    const wiseWatcher = setInterval(() => {
      if (document.querySelector(".am5stock") != null) {
        clearInterval(wiseWatcher);
        let controlList = document.getElementsByClassName(
          "am5stock-control-list"
        )[2];
        for (let index = 0; index < controlList.children.length; index++) {
          if (
            controlList.children[index].getAttribute("title") ==
            selectedTimeFrame
          ) {
            controlList.children[index].setAttribute("role", "selected");
          }
        }
      }
    }, 500);

    intervalSwitcher.events.on("selected", function (ev) {
      updateChartTimeFrame(ev.item.id);
      setAuthTimeFrame(ev.item.id);
      localStorage.setItem('timeFrame', ev.item.id);
    });

    // Stock toolbar
    let toolbar = am5stock.StockToolbar.new(root, {
      container: document.getElementById("chartcontrols"),
      stockChart: stockChart,
      controls: [
        symbolSearchList,
        seriesSwitcher,
        // am5stock.SeriesTypeControl.new(root, {
        //     stockChart: stockChart
        // }),
        intervalSwitcher,
        am5stock.IndicatorControl.new(root, {
          stockChart: stockChart,
          legend: valueLegend,
        }),
        am5stock.DrawingControl.new(root, {
          stockChart: stockChart,
        }),
        am5stock.ResetControl.new(root, {
          stockChart: stockChart,
        }),
        am5stock.SettingsControl.new(root, {
          stockChart: stockChart,
        }),
      ],
    });

    //----------------------------------------------------CHART TOOLBAR (end)-------------------------------------------------------------------------
    //#endregion

    // Make stuff animate on load
    // stockChart.appear(2000);
    // mainPanel.appear(2000, 1000);

    //root = root;

    //#region CHART CUSTOMIZATION------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------CHART CUSTOMIZATION (start)-------------------------------------------------------------------------

    // const chartControlsButtons = document.querySelector(".am5stock-control-button");

    // // Create a tooltip element
    // const tooltip = document.createElement("div");
    // tooltip.className = "custom-tooltip";
    // tooltip.style.display = "none";

    // // Append the tooltip to the body element
    // document.body.appendChild(tooltip);

    // // Add event listeners to show and hide the tooltip
    // chartControlsButtons.addEventListener("mouseenter", (e) => {
    //     const rect = e.target.getBoundingClientRect();
    //     const tooltipWidth = tooltip.offsetWidth;

    //     // Get the dynamic tooltip text from a data attribute
    //     const tooltipText = e.target.getAttribute("data-tooltip");

    //     // Set the tooltip text
    //     tooltip.textContent = 'aaaa';//tooltipText;

    //     // Position the tooltip below the button element
    //     tooltip.style.top = rect.bottom + "px";
    //     tooltip.style.color = '#fff';
    //     tooltip.style.left = rect.left + rect.width / 2 - tooltipWidth / 2 + "px";

    //     // Show the tooltip
    //     tooltip.style.display = "block";
    // });

    // chartControlsButtons.addEventListener("mouseleave", () => {
    //     // Hide the tooltip
    //     tooltip.style.display = "none";
    // });

    //----------------------------------------------------CHART CUSTOMIZATION (end)-------------------------------------------------------------------------
    //#endregion

    //root = root;

    root.autoResize = true;
  };
 


  // Function that dynamically loads data
  const loadChartData = (series, dateAxis) => {
    // Load external data
    let data;
      // document
      //   .getElementsByClassName("chart-preloader")[0]
      //   .setAttribute("role", "show");
      am5.net
        .load(API_ENDPOINT_KLINES(selectedAuthSymbol, selectedTimeFrame,selectedCategoryId))
        // .load(API_ENDPOINT_FMP_KLINES(selectedAuthSymbol, "5min"))
        .then(function (result) {

          // Set data on all series of the chart
          const res = am5.JSONParser.parse(result.response);
          const data = res.data;
 
      
        
       console.log(data,"datadata")
          // Process data (convert dates and values)
          let processor = am5.DataProcessor.new(root, {
            dateFields: ["Date"],
            //dateFormat: "yyyy-MM-dd",
            numericFields: [
              "Open",
              "High",
              "Low",
              "Close",
              "Adj Close",
              "Volume",
            ],
          });
          processor.processMany(data);

          const chartData = data.map((item) => {
            // console.log(item);
            return {
              Date: new Date(item[0]).getTime(), // Assuming the timestamp is in milliseconds
              Open: parseFloat(item[1]),
              High: parseFloat(item[2]),
              Low: parseFloat(item[3]),
              Close: parseFloat(item[4]),
              Volume: parseFloat(item[5]),
            };
          });
      
          // Set data
          am5.array.each(series, function (item) {
            item.data.setAll(chartData);
            // let waitLoading;
            // clearTimeout(waitLoading);
            // waitLoading = setTimeout(() => {
            //   if (document.getElementsByClassName("chart-preloader")[0] != undefined) {
            //     document
            //       .getElementsByClassName("chart-preloader")[0]
            //       .setAttribute("role", "hide");
            //   }
            // }, 4000);
          });



          // function addBullet(date) {
          //   series.events.once("datavalidated", function() {

          //     // Find series data item
          //     var axisPosition = dateAxis.dateToPosition(date);
          //     var seriesDataItem = dateAxis.getSeriesItem(series, axisPosition, 0);

          //     // Crate bullet
          //     if (seriesDataItem) {
          //       var bullet = am5.Container.new(root, {
          //       });

          //       bullet.children.push(am5.Triangle.new(root, {
          //         width: 22,
          //         height: 18,
          //         fill: am5.color(0xff0000),
          //         stroke: am5.color(0xffffff),
          //         strokeWidth: 2,
          //         centerY: am5.p50,
          //         centerX: am5.p50,
          //         rotation: 180
          //       }));

          //       bullet.children.push(am5.Label.new(root, {
          //         text: 'hello',
          //         centerX: am5.p50,
          //         centerY: am5.p0,
          //         dy: 5
          //       }));

          //       series.addBullet(seriesDataItem, am5.Bullet.new(root, {
          //         sprite: bullet
          //       }));
          //     }
          //   });
          // }

          // addBullet(1708411020000);


        });
    
  };

  // update price chart with live feeds
  const updateLiveFeedData = (stockChart2, currentLabel2) => {
  
    if (platFromData.length > 0 && platFromData[1] && platFromData[1] != undefined && platFromData[1] != 'undefined' && stockChart2 != null && currentLabel2 != null && currentValueDataItem2 != null && platFromData[1].s== selectedAuthSymbol) {
      // Create a new data point based on the live feed data
      const liveFeedData = {
        Date: new Date(platFromData[1].t).getTime(), // Assuming the timestamp is in milliseconds
        Open: parseFloat(platFromData[1].o),
        High: parseFloat(platFromData[1].h),
        Low: parseFloat(platFromData[1].l),
        Close: parseFloat(platFromData[1].c),
        Volume: parseFloat(platFromData[1].v),
      };

      // Get the series for candlestick chart
      // console.log('valueSeries', stockChart2);
      let valueSeries = stockChart2.get("stockSeries");
      // console.log("st", valueSeries, liveFeedData);

      // Get the current timestamp
      let date = liveFeedData.Date; //Date.now();

      // Variable to store the new value for the live feed
      let value;
      let volume;

      // Get the last data object in the series
      let lastDataObject = valueSeries.data.getIndex(valueSeries.data.length - 1);
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
          currentValueDataItem2.set("value", value);
          // currentLabel2.set("text", formatPriceUptoDecimals(value, symbolInfo.digit));
          currentLabel2.set("text",  value );
          let bg = currentLabel2.get("background");
          if (bg) {
            if (value < open) {
              // bg.set("fill", root.interfaceColors.get("negative"));
              bg.set("fill", am5.color(dropFromOpenColor));
            } else {
              // bg.set("fill", root.interfaceColors.get("positive"));
              bg.set("fill", am5.color(riseFromOpenColor));
            }
          }
        }

        let bulletStroke = getComputedStyle(document.body).backgroundColor;

        if (localStorage.positionMarker === 'open' || localStorage.positionMarker === 'show') {
          const createdBullets = {}; // Keep track of created bullets

          openPositions.map((position) => {
            valueSeries.bullets.push(function (root, series, obj) {
              if (obj.dataContext.Date === position.formatted_date && position.symbol === selectedAuthSymbol) {
                const bulletKey = `${obj.dataContext.Date}_${position.symbol}`;

                // Check if bullet for this date and symbol combination has already been created
                if (!createdBullets[bulletKey]) {
                  // Create the bullet
                  createdBullets[bulletKey] = true; // Mark bullet as created
                  return am5.Bullet.new(root, {
                    field: "close",
                    sprite: am5.Circle.new(root, {
                      radius: 5,
                      stroke: am5.color(bulletStroke),
                      strokeWidth: 2,
                      fill: am5.color(riseFromOpenColor),
                      tooltipText:
                        `Marker: OPEN
Symbol: ${position.symbol}
Created: ${position.created_at?.toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
Direction: ${position.direction}
Quantity: ${position.quantity}
PNL: ${position.pnl}`
                    })
                  });
                }
              }
            });
          });
        }

        if (localStorage.positionMarker === 'close' || localStorage.positionMarker === 'show') {
          const createdClosedBullets = {}; // Keep track of created bullets for close positions
          
          closedPositions.map((position) => {
            valueSeries.bullets.push(function (root, series, obj) {
              // console.log(position)
              if (obj.dataContext.Date === position.formatted_date && position.symbol === selectedAuthSymbol) {
                const bulletKey = `${obj.dataContext.Date}_${position.symbol}_close`; // Add 'close' identifier

                // Check if bullet for this date, symbol, and 'close' has already been created
                if (!createdClosedBullets[bulletKey]) {
                  // Create the bullet
                  createdClosedBullets[bulletKey] = true; // Mark bullet as created
                  return am5.Bullet.new(root, {
                    field: "open",
                    sprite: am5.Circle.new(root, {
                      radius: 5,
                      stroke: am5.color(bulletStroke),
                      strokeWidth: 2,
                      fill: am5.color(dropFromOpenColor),
                      tooltipText:
                        `Marker: CLOSED
Symbol: ${position.symbol}
Created: ${position.created_at?.toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
Direction: ${position.direction}
Quantity: ${position.quantity}
PNL: ${position.pnl}`
                    })
                  });
                }
              }
            });
          });
        }

        if (localStorage.positionMarker === 'open' || localStorage.positionMarker === 'show') {
          const createdOpenBullets = {}; // Keep track of created bullets for open positions

          closedPositions.map((position) => {
            valueSeries.bullets.push(function (root, series, obj) {
              if (obj.dataContext.Date === position.formatted_date_open && position.symbol === selectedAuthSymbol) {
                const bulletKey = `${obj.dataContext.Date}_${position.symbol}_open`; // Add 'open' identifier

                // Check if bullet for this date, symbol, and 'open' has already been created
                if (!createdOpenBullets[bulletKey]) {
                  // Create the bullet
                  createdOpenBullets[bulletKey] = true; // Mark bullet as created
                  return am5.Bullet.new(root, {
                    field: "open",
                    sprite: am5.Circle.new(root, {
                      radius: 5,
                      stroke: am5.color(bulletStroke),
                      strokeWidth: 2,
                      fill: am5.color(riseFromOpenColor),
                      tooltipText:
                        `Marker: OPEN
Symbol: ${position.symbol}
Created: ${position.created_at?.toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
Direction: ${position.direction}
Quantity: ${position.quantity}
PNL: ${position.pnl}`
                    })
                  });
                }
              }
            });
          });
        }
      }
    }
  };
  //show spinner while loading data
  if (loadingSymbolContext) {
    return <Spinner />;
  }

  return (
    <div className="Chart">
      <div id="chartcontrols"></div>
      <div id="chartdiv"></div>
      {/* <div className="chart-preloader">
        <div class="candle-block">
          <div class="e-candle">
            <div class="candle-set">
              <div class="candle-line"></div>
              <div class="candle-line"></div>
              <div class="candle-roof"></div>
            </div>
          </div>
          <div class="e-candle">
            <div class="candle-set">
              <div class="candle-line"></div>
              <div class="candle-line"></div>
              <div class="candle-roof"></div>
            </div>
          </div>
          <div class="e-candle">
            <div class="candle-set">
              <div class="candle-line"></div>
              <div class="candle-line"></div>
              <div class="candle-roof"></div>
            </div>
          </div>
          <div class="e-candle">
            <div class="candle-set">
              <div class="candle-line"></div>
              <div class="candle-line"></div>
              <div class="candle-roof"></div>
            </div>
          </div>
        </div>
        <h2>Loading... {selectedAuthSymbol}</h2>
      </div>  */}
    </div>
  );
};

export default Chart;

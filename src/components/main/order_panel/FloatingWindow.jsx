import React, { useState, useRef, useCallback, useEffect } from 'react';
import './Order-Panel.scss';
import { useAuthContext } from "../../../contexts/Auth-Context.js";
import { useSymbolContext } from "../../../contexts/Symbol-Context.js";
import { useAccountManagerContext } from "../../../contexts/Account-Manager-Context.js";
import { useMetricsContext } from "../../../contexts/Metrics-Context.js";
import { useChartContext } from '../../../contexts/Chart-Context.js';
import { toast } from 'react-toastify';
import APIMiddleware from "../../../data/api/Api-Middleware.js";
import { API_ENDPOINT_OPEN_POSITION } from "../../../data/Endpoints-API.js";
import { formatPrice, formatPriceUptoDecimals, formatPositionToPipSize, formatDigitBasePrice,} from "../../../utils/format.js";


const FloatingWindow = ({ onClose }) => {
  const [position, setPosition] = useState({ x: 300, y: 70 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });
  const { selectedStyle } = useChartContext();

  // Start dragging
  const handleDragStart = (e) => {
    e.preventDefault();
    const isTouch = e.type === 'touchstart';
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    const rect = dragRef.current.getBoundingClientRect();
    offset.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
    setDragging(true);
    document.body.style.userSelect = 'none'; // Prevent text selection
  };

  // Dragging
  const handleDrag = useCallback((e) => {
    if (!dragging) return;

    const isTouch = e.type === 'touchmove';
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    if (!dragRef.current) return;
    const { offsetWidth: width, offsetHeight: height } = dragRef.current;

    // Clamp position inside viewport
    const clampedX = Math.min(
      Math.max(clientX - offset.current.x, 0),
      window.innerWidth - width
    );
    const clampedY = Math.min(
      Math.max(clientY - offset.current.y, 0),
      window.innerHeight - height
    );

    setPosition({
      x: clampedX,
      y: clampedY,
    });
  }, [dragging]);


  // End drag
  const handleDragEnd = useCallback(() => {
    setDragging(false);
    document.body.style.userSelect = ''; // Restore text selection
  }, []);

  // Attach/detach listeners
  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDrag, { passive: false });
      document.addEventListener('touchend', handleDragEnd);
    } else {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDrag);
      document.removeEventListener('touchend', handleDragEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDrag);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [dragging, handleDrag, handleDragEnd]);


  const {  user, selectedAuthSymbol, platFromData } = useAuthContext();
  const [isPositionOpening, setIsPositionOpening] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [direction, setDirection] = useState("");
  const { bidPrice, askPrice, symbolInfo, selectedSymbolExchangeRate, lotSize, setNewPositionOpen, selectedSymbolSession, setCurrentExposureLevel, setActiveLvg } = useSymbolContext();
  const { openPosition, updateUserData_Local, setActiveTab } = useAccountManagerContext();
  const [quantity, setQuantity] = useState(1000);
  const { metrics } = useMetricsContext();
  const [assetState, setAssetState] = useState({
    type: "",
    name: "",
  });
  const [takeProfit, setTakeProfit] = useState(0.0);
  const [stopLoss, setStopLoss] = useState(0.0);
  const [orderComment, setOrderComment] = useState("");
  const [slPips, setSlPips] = useState(0.0);
  const [tpPips, setTpPips] = useState(0.0);
  const [selectedLotStep, setSelectedLotStep] = useState(0);
  const [amount, setAmount] = useState(1000);
  const [enableSlider, setEnableSlider] = useState(false);

  const handleQtyChange = (e)=>{
    setQuantity(parseFloat(e.target.value));
  }

  useEffect(() => {
    setQuantity();
  }, [symbolInfo]);

  const getCurrentDateTime = () => {
    var currentDate = new Date();
    var year = currentDate.getFullYear();
    var month = ("0" + (currentDate.getMonth() + 1)).slice(-2); // Adding 1 because months are zero-indexed
    var day = ("0" + currentDate.getDate()).slice(-2);
    var hour = ("0" + currentDate.getHours()).slice(-2);
    var minute = ("0" + currentDate.getMinutes()).slice(-2);
    var currentDateTime = `${year}-${month}-${day} ${hour}:${minute}:00`;
    return currentDateTime;
  };

  const getMinimumLeverage = (userLeverage, groupLeverage, symbolLeverage) => {

    const parsedUserLeverage = parseFloat(userLeverage);
    const parsedGroupLeverage = parseFloat(groupLeverage);
    const parsedSymbolLeverage = parseFloat(symbolLeverage);
    // If groupLeverage is defined and not NaN
    if (groupLeverage !== undefined && groupLeverage !== null && groupLeverage !== 'null' && !isNaN(parsedGroupLeverage)) {
      return Math.min(parsedUserLeverage, parsedGroupLeverage);
    }

    // If symbolLeverage is defined and not NaN
    if (symbolLeverage !== undefined && symbolLeverage !== null && symbolLeverage !== 'null' && !isNaN(parsedSymbolLeverage)) {
      return Math.min(parsedUserLeverage, parsedSymbolLeverage);
    }

    // Default to userLeverage or 1 if userLeverage is NaN
    return isNaN(parsedUserLeverage) ? 1 : parsedUserLeverage;
  };

   const calculateRequiredMarginAccToBidPrice = () => {
    let reqMarginWithoutLeverage = quantity * bidPrice * selectedSymbolExchangeRate;
    setCurrentExposureLevel(reqMarginWithoutLeverage)
      
  if (
    platFromData[6] &&
    platFromData[6].availableLeverage &&
    Array.isArray(platFromData[6].availableLeverage) &&
    platFromData[6].availableLeverage.length > 0 &&
    platFromData[6].availableLeverage[0]?.available_leverage &&
    Array.isArray(platFromData[6].availableLeverage[0].available_leverage) &&
    platFromData[6].availableLeverage[0].available_leverage.length > 0 &&
    Array.isArray(platFromData[6].availableLeverage[0].available_leverage[0]?.group_level_leverage) &&
    platFromData[6].availableLeverage[0].available_leverage[0].group_level_leverage.length > 0
  ){

        let symbolLeverage = platFromData[6]?.availableLeverage[0]?.available_leverage[0].group_level_leverage.sort((a, b) => {
          // Handle missing or invalid `exposure_level` values using parseFloat
          const aLevel = a && a.exposure_level !== null && a.exposure_level !== undefined
            ? parseFloat(a.exposure_level)
            : Infinity;
          const bLevel = b && b.exposure_level !== null && b.exposure_level !== undefined
            ? parseFloat(b.exposure_level)
            : Infinity;
          return aLevel - bLevel;
        });

  let groupMinLeverage =symbolLeverage.filter(lev => {
      // Ensure `lev.exposure_level` exists and is a valid number before comparison
      const exposureLevel = lev && lev.exposure_level !== null && lev.exposure_level !== undefined
        ? parseFloat(lev.exposure_level)
        : NaN;
      return !isNaN(exposureLevel) && exposureLevel >= reqMarginWithoutLeverage;
    })




  let groupDefaultLeverage

  if(platFromData[6]?.availableLeverage[0]?.available_leverage[0].group_level_leverage.length > 0 && groupMinLeverage.length ==0){
  groupDefaultLeverage = symbolLeverage[symbolLeverage.length-1]
  }else{
  groupDefaultLeverage = groupMinLeverage[0];
  }
    
      let minimumLeverage = 1;
      if (platFromData[6]?.availableLeverage[0]?.available_leverage[0]) {
              minimumLeverage = getMinimumLeverage(
                platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage,
              groupDefaultLeverage.max_leverage,
              []
          );
      }
      const lvg = minimumLeverage || 1;
      setActiveLvg(lvg);
      const converted_entry_price = bidPrice * selectedSymbolExchangeRate;
      const requiredMargin = quantity * (converted_entry_price / lvg);
      return isNaN(requiredMargin)
      ? 0
      :requiredMargin<1?requiredMargin.toFixed(5)
      : Math.round(requiredMargin * 10) / 10
    } else if (
      platFromData[6] &&
      platFromData[6].availableLeverage &&
      Array.isArray(platFromData[6].availableLeverage) &&
      platFromData[6].availableLeverage.length > 0 &&
      platFromData[6].availableLeverage[0]?.available_leverage &&
      Array.isArray(platFromData[6].availableLeverage[0].available_leverage) &&
      platFromData[6].availableLeverage[0].available_leverage.length > 0 &&
      Array.isArray(platFromData[6].availableLeverage[0].available_leverage[0]?.symbol_default_leverage) &&
      platFromData[6].availableLeverage[0].available_leverage[0].symbol_default_leverage.length > 0
    ){
      let symbolLeverage = platFromData[6]?.availableLeverage[0]?.available_leverage[0].symbol_default_leverage.sort((a, b) => {
        // Handle missing or invalid `exposure_level` values using parseFloat
        const aLevel = a && a.exposure_level !== null && a.exposure_level !== undefined
          ? parseFloat(a.exposure_level)
          : Infinity;
        const bLevel = b && b.exposure_level !== null && b.exposure_level !== undefined
          ? parseFloat(b.exposure_level)
          : Infinity;
        return aLevel - bLevel;
      })
      
      let symbolMinLeverage= symbolLeverage.filter(lev => {
        // Ensure `lev.exposure_level` exists and is a valid number before comparison
        const exposureLevel = lev && lev.exposure_level !== null && lev.exposure_level !== undefined
          ? parseFloat(lev.exposure_level)
          : NaN;
        return !isNaN(exposureLevel) && exposureLevel >= reqMarginWithoutLeverage;
      })

    let symbolDefaultLeverage

    if(platFromData[6]?.availableLeverage[0]?.available_leverage[0].symbol_default_leverage.length > 0 && symbolMinLeverage.length ==0){
      symbolDefaultLeverage = symbolLeverage[symbolLeverage.length-1]
      }else{
      symbolDefaultLeverage = symbolMinLeverage[0];
      }
    
  let minimumLeverage = 1;
  if (platFromData[6]?.availableLeverage[0]?.available_leverage[0]) {
          minimumLeverage = getMinimumLeverage(
          platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage,
          [],
          symbolDefaultLeverage.max_leverage,
          
      );
  }
  const lvg = minimumLeverage || 1;
  setActiveLvg(lvg);
  const converted_entry_price = bidPrice * selectedSymbolExchangeRate;
  const requiredMargin = quantity * (converted_entry_price / lvg);
  return isNaN(requiredMargin)
  ? 0
  :requiredMargin<1?requiredMargin.toFixed(5)
  : Math.round(requiredMargin * 10) / 10
    }else if (platFromData[6] &&
      platFromData[6].availableLeverage &&
      Array.isArray(platFromData[6].availableLeverage) &&
      platFromData[6].availableLeverage.length > 0 &&
      platFromData[6].availableLeverage[0]?.available_leverage &&
      Array.isArray(platFromData[6].availableLeverage[0].available_leverage) &&
      platFromData[6].availableLeverage[0].available_leverage.length > 0 &&
      platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage){

      const lvg = platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage || 1;
      setActiveLvg(lvg);
      const converted_entry_price = bidPrice * selectedSymbolExchangeRate;
      const requiredMargin = quantity * (converted_entry_price / lvg);
      
      return isNaN(requiredMargin)
      ? 0
      :requiredMargin<1?requiredMargin.toFixed(5)
      : Math.round(requiredMargin * 10) / 10

    }
    }
const calculateRequiredMarginAccToAskPrice = () => {
    let reqMarginWithoutLeverage = quantity * askPrice * selectedSymbolExchangeRate;
    setCurrentExposureLevel(reqMarginWithoutLeverage);
    
  if (
    platFromData[6] &&
    platFromData[6].availableLeverage &&
    Array.isArray(platFromData[6].availableLeverage) &&
    platFromData[6].availableLeverage.length > 0 &&
    platFromData[6].availableLeverage[0]?.available_leverage &&
    Array.isArray(platFromData[6].availableLeverage[0].available_leverage) &&
    platFromData[6].availableLeverage[0].available_leverage.length > 0 &&
    Array.isArray(platFromData[6].availableLeverage[0].available_leverage[0]?.group_level_leverage) &&
    platFromData[6].availableLeverage[0].available_leverage[0].group_level_leverage.length > 0
  ){

        let symbolLeverage = platFromData[6]?.availableLeverage[0]?.available_leverage[0].group_level_leverage.sort((a, b) => {
          // Handle missing or invalid `exposure_level` values using parseFloat
          const aLevel = a && a.exposure_level !== null && a.exposure_level !== undefined
            ? parseFloat(a.exposure_level)
            : Infinity;
          const bLevel = b && b.exposure_level !== null && b.exposure_level !== undefined
            ? parseFloat(b.exposure_level)
            : Infinity;
          return aLevel - bLevel;
        });

  let groupMinLeverage =symbolLeverage.filter(lev => {
      // Ensure `lev.exposure_level` exists and is a valid number before comparison
      const exposureLevel = lev && lev.exposure_level !== null && lev.exposure_level !== undefined
        ? parseFloat(lev.exposure_level)
        : NaN;
      return !isNaN(exposureLevel) && exposureLevel >= reqMarginWithoutLeverage;
    })




  let groupDefaultLeverage

  if(platFromData[6]?.availableLeverage[0]?.available_leverage[0].group_level_leverage.length > 0 && groupMinLeverage.length ==0){
  groupDefaultLeverage = symbolLeverage[symbolLeverage.length-1]
  }else{
  groupDefaultLeverage = groupMinLeverage[0];
  }
    
      let minimumLeverage = 1;
      if (platFromData[6]?.availableLeverage[0]?.available_leverage[0]) {
              minimumLeverage = getMinimumLeverage(
                platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage,
              groupDefaultLeverage.max_leverage,
              []
          );
      }
      const lvg = minimumLeverage || 1;
      setActiveLvg(lvg);
      const converted_entry_price = askPrice * selectedSymbolExchangeRate;
      const requiredMargin = quantity * (converted_entry_price / lvg);
      return isNaN(requiredMargin)
      ? 0
      :requiredMargin<1?requiredMargin.toFixed(5)
      : Math.round(requiredMargin * 10) / 10
    } else if (
      platFromData[6] &&
      platFromData[6].availableLeverage &&
      Array.isArray(platFromData[6].availableLeverage) &&
      platFromData[6].availableLeverage.length > 0 &&
      platFromData[6].availableLeverage[0]?.available_leverage &&
      Array.isArray(platFromData[6].availableLeverage[0].available_leverage) &&
      platFromData[6].availableLeverage[0].available_leverage.length > 0 &&
      Array.isArray(platFromData[6].availableLeverage[0].available_leverage[0]?.symbol_default_leverage) &&
      platFromData[6].availableLeverage[0].available_leverage[0].symbol_default_leverage.length > 0
    ){
      let symbolLeverage = platFromData[6]?.availableLeverage[0]?.available_leverage[0].symbol_default_leverage.sort((a, b) => {
        // Handle missing or invalid `exposure_level` values using parseFloat
        const aLevel = a && a.exposure_level !== null && a.exposure_level !== undefined
          ? parseFloat(a.exposure_level)
          : Infinity;
        const bLevel = b && b.exposure_level !== null && b.exposure_level !== undefined
          ? parseFloat(b.exposure_level)
          : Infinity;
        return aLevel - bLevel;
      })
      
      let symbolMinLeverage= symbolLeverage.filter(lev => {
        // Ensure `lev.exposure_level` exists and is a valid number before comparison
        const exposureLevel = lev && lev.exposure_level !== null && lev.exposure_level !== undefined
          ? parseFloat(lev.exposure_level)
          : NaN;
        return !isNaN(exposureLevel) && exposureLevel >= reqMarginWithoutLeverage;
      })

    let symbolDefaultLeverage

    if(platFromData[6]?.availableLeverage[0]?.available_leverage[0].symbol_default_leverage.length > 0 && symbolMinLeverage.length ==0){
      symbolDefaultLeverage = symbolLeverage[symbolLeverage.length-1]
      }else{
      symbolDefaultLeverage = symbolMinLeverage[0];
      }
    
  let minimumLeverage = 1;
  if (platFromData[6]?.availableLeverage[0]?.available_leverage[0]) {
          minimumLeverage = getMinimumLeverage(
          platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage,
          [],
          symbolDefaultLeverage.max_leverage,
          
      );
  }
  const lvg = minimumLeverage || 1;
  setActiveLvg(lvg);
  const converted_entry_price = askPrice * selectedSymbolExchangeRate;
  const requiredMargin = quantity * (converted_entry_price / lvg)
  return isNaN(requiredMargin)
  ? 0
  :requiredMargin<1?requiredMargin.toFixed(5)
  : Math.round(requiredMargin * 10) / 10
    }else if (platFromData[6] &&
      platFromData[6].availableLeverage &&
      Array.isArray(platFromData[6].availableLeverage) &&
      platFromData[6].availableLeverage.length > 0 &&
      platFromData[6].availableLeverage[0]?.available_leverage &&
      Array.isArray(platFromData[6].availableLeverage[0].available_leverage) &&
      platFromData[6].availableLeverage[0].available_leverage.length > 0 &&
      platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage){

      const lvg = platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage || 1;
      setActiveLvg(lvg);
      const converted_entry_price = askPrice * selectedSymbolExchangeRate;
      const requiredMargin = quantity * (converted_entry_price / lvg);
      
      return isNaN(requiredMargin)
      ? 0
      :requiredMargin<1?requiredMargin.toFixed(5)
      : Math.round(requiredMargin * 10) / 10

    }
    }


  const openPosition_api = async (margin, dir) => {
    try {
      const currentDate = new Date();
      const currentDateTime = new Date(currentDate);

      const data = {
        id: -1,
        position_id: "PID" + Math.floor(100000 + Math.random() * 900000),
        symbol: selectedAuthSymbol,
        quantity: quantity,
        amount: amount,
        asset_type: assetState.type,
        direction: dir,
        entry_price: dir == "Buy" ? askPrice : bidPrice,
        converted_entry_price: (dir == "Buy" ? askPrice : bidPrice) * selectedSymbolExchangeRate,
        TP: takeProfit,
        SL: stopLoss,
        netEUR: 0, // Set appropriate values
        status: "",
        userId: user.userId,
        exit_price: 0,
        totalUnrealizedPnL: metrics.totalUnrealizedPnL,
        position_closed_at: null,
        comment: orderComment,
        stop_loss_pips: slPips,
        take_profit_pips: tpPips,
        current_exchange_rate: selectedSymbolExchangeRate,
        lot_step: selectedLotStep,
        trade_type: symbolInfo.trade_type,
        lot_size: lotSize
      };
      const response = await APIMiddleware.post(
        API_ENDPOINT_OPEN_POSITION(),
        data
      );
      const data_m = {
        ...response.data,
        created_at: new Date(response.data.created_at).toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      // Show a success notification
      toast.success("Position opened successfully!", { position: "top-right" });
      setIsPositionOpening(false);
      localStorage.accountManager = "open-positions-acc";
      document.getElementById("openSound").play();
      const getCurrentDateTime = () => {
        var currentDate = new Date();
        var year = currentDate.getFullYear();
        var month = ("0" + (currentDate.getMonth() + 1)).slice(-2); // Adding 1 because months are zero-indexed
        var day = ("0" + currentDate.getDate()).slice(-2);
        var hour = ("0" + currentDate.getHours()).slice(-2);
        var minute = ("0" + currentDate.getMinutes()).slice(-2);
        var currentDateTime = `${year}-${month}-${day} ${hour}:${minute}:00`;
        return currentDateTime;
      };
      if (localStorage.chartBullets === undefined) {
        localStorage.setItem("chartBullets", getCurrentDateTime());
      } else {
        let history = [];
        history.push(localStorage.chartBullets);
        history.push(getCurrentDateTime());
        localStorage.chartBullets = history;
      }
      setNewPositionOpen(Math.floor(Math.random() * 100))
    } catch (error) {
      
      toast.error(`${error.response.data.data.error}`, {
        position: "top-right",
      });

      // Handle API request error
      console.error(`API request error: ${API_ENDPOINT_OPEN_POSITION()}`, error);
      setIsPositionOpening(false);
    }
  };

  function calculateNetMarginInti(allOpenedPositions,requiredMargin) {
    let positions= [... allOpenedPositions.openedPositions ,{symbol:selectedAuthSymbol ,direction ,margin:requiredMargin}]

      const positionsBySymbol = positions.reduce((acc, position) => {
        if (!position || !position.symbol || !position.direction) {
          return acc;
        }


            const symbol = position.symbol;
            const direction = position.direction; // Assume direction is 'Buy' or 'sell'
            const margin = parseFloat(position.margin || 0);

            if (!acc[symbol]) {
                acc[symbol] = { Buy: 0, Sell: 0 };
            }

            if (direction === 'Buy') {
                acc[symbol].Buy += margin;
            } else if (direction === 'Sell') {
                acc[symbol].Sell += margin;
            }
            return acc;
        }, {});

        // Step 2: Calculate net margin
        let totalMargin = 0;

        for (const symbol in positionsBySymbol) {
            const { Buy, Sell } = positionsBySymbol[symbol];
            if (Buy > Sell) {
                totalMargin += (Buy - Sell);
            } else {
                totalMargin += (Sell - Buy);
            }
        }
        return totalMargin;
    }

  const placeMarketOrder = (dir) => {
    if (dir && quantity > 0) {
      // Calculate required margin based on trading logic
      let entryPrice = dir == "Buy" ? askPrice : bidPrice

      const requiredMargin = dir == "Buy" ? calculateRequiredMarginAccToAskPrice() : calculateRequiredMarginAccToBidPrice();
    
    
      let useMargin=calculateNetMarginInti(platFromData[3],requiredMargin) 
      let freeMargin;
      let openPositionCheck;
    
      
      if(platFromData[5].margin_calculation == "net"){
      freeMargin =platFromData[5].equity - useMargin
      openPositionCheck = freeMargin > 0
      }else{
      
      freeMargin = metrics.freeMargin;
      openPositionCheck = freeMargin >= requiredMargin
      }
      // Check if the user has enough balance
      if (openPositionCheck ) {
        // Continue with opening the position
        if(requiredMargin < 10){
          toast.error(`Margin Should be greater than 10 ${metrics?.userCurrencyName || 'EUR'}.`, {
            position: "top-right",
          });
          setIsPositionOpening(false);
          document.getElementById("closeSound").play();
          return;
        }
        openPosition_api(requiredMargin, dir);
      } else {
        // Show an alert for insufficient balance
        toast.error("Insufficient balance to open the position.", {
          position: "top-right",
        });
        setIsPositionOpening(false);
        document.getElementById("closeSound").play();
        document.querySelector(".deposit-cash")?.setAttribute("view", "true");
        const ig = document.getElementById("quantity-input-guide");
        ig?.setAttribute("shake", "true");
        setTimeout(() => {
          ig?.removeAttribute("shake");
        }, 2000);
      }
    } else {
      toast.error("Quantity should be greater than 0.", {
        position: "top-right",
      });
      document.getElementById("closeSound").play();
      setIsPositionOpening(false);
    }
  };

  const placeOrder = (dir) => {
    if (user && user.userId != undefined && user.userId > 0) {
      setActiveTab("open-positions-acc");
      setIsPositionOpening(true);
      placeMarketOrder(dir);
    }
  };


  return (
    <div
      ref={dragRef}
      className="floating-window"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
      }}
    >
      <div className="floating-window-panel">
        <div className="drag-handle" 
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={{
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          color: 'white',
        }}>≡</div>
        
        <div className="trade-controls">
          <div className="buy" style={{backgroundColor: selectedStyle.buyColor}}>
            <button
              disabled={platFromData[5]?.accessRight == 3|| localStorage.getItem('accountType') =="0"||platFromData[5]?.accessRight == 2||!bidPrice ||!askPrice || isPositionOpening || selectedSymbolSession === 0 || isButtonDisabled || direction == "Sell"}
              className={`buy`}
              title={
                (selectedSymbolSession === 0 ? "The market is closed. Only pending orders are accepted" : "") 
                || (direction == "Buy" ? "SL?TP is selected for Sell/Short" : "")
              }
              onClick={() => {
                placeOrder("Buy");
              }}
              style={{
                backgroundColor: selectedStyle.buyColor,
                position: 'relative',
                overflow: 'hidden',
                isolation: 'isolate',
                color: 'white',
              }}
            >
              <b style={{fontSize: '14px', fontWeight: 'bolder'}}>
                {!isPositionOpening ? "Buy/Long" : "Loading..."}
              </b>
              <br />
              <span>
                {/* {formatPriceUptoDecimals(askPrice, symbolInfo.digit)} */}
                { askPrice }
              </span>
            </button>
          </div>

          {symbolInfo?.trade_type === 'units' && assetState.type !== 'quote_asset' && (
            <div className="size">
              <div style={{color: 'white'}}>Size</div>
              <input
                type="number"
                placeholder="Enter Size"
                value={quantity ?? ""}
                onChange={handleQtyChange}
              />
            </div>
          )}

          <div className="sell" style={{backgroundColor: selectedStyle.sellColor}}>
            <button
              disabled={platFromData[5]?.accessRight == 3|| localStorage.getItem('accountType') =="0"||platFromData[5]?.accessRight == 2||!bidPrice ||!askPrice || isPositionOpening || selectedSymbolSession === 0 || isButtonDisabled || direction == "Buy"}
              className={`sell`}
              title={
                (selectedSymbolSession === 0 ? "The market is closed. Only pending orders are accepted" : "") 
                || (direction == "Buy" ? "SL?TP is selected for Buy/Long" : "")
              }
              onClick={() => {
                placeOrder("Sell");
              }}
              style={{
                backgroundColor: selectedStyle.sellColor,
                position: 'relative',
                overflow: 'hidden',
                isolation: 'isolate',
                color: 'white',
              }}
            >
              <b style={{fontSize: '14px', fontWeight: 'bolder'}}>
                {!isPositionOpening ? "Sell/Short" : "Loading..."}
              </b>
              <br />
              <span>
                { bidPrice }
              </span>
            </button>
          </div>
        </div>

        <button className="close-btn" onClick={onClose}>×</button> 
      </div>
    </div>
  )
}

export default FloatingWindow;
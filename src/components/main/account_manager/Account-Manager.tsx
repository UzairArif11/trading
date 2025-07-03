import React, { useState, useEffect, useRef } from "react";
import { FaRobot, FaTimes } from "react-icons/fa";
import Spinner from "../../utils/spinner/Spinner.jsx";
import { useAccountManagerContext } from "../../../contexts/Account-Manager-Context.js";
import { useAuthContext } from "../../../contexts/Auth-Context.js";
import { useSymbolContext } from "../../../contexts/Symbol-Context.js";
import { useMetricsContext } from "../../../contexts/Metrics-Context.js";
import { useChartContext } from "../../../contexts/Chart-Context.js";
import { Position } from "../../../interfaces/Position.js";
import { Order } from "../../../interfaces/Order.js";
import '../metrics_panel/Metrics-Panel.scss';
import { Ripple } from 'react-ripple-click';
import 'react-ripple-click/dist/index.css';
import Select from 'react-select';
import { MdExitToApp } from "react-icons/md";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import useLongPress from "../../../lib/hooks/useLongPress.js";

// import Positions from './Positions'
// import MarketOrder from "../market_order/Market-Order.tsx";
import {
  API_ENDPOINT_CLOSED_POSITIONS,
  API_ENDPOINT_OPENED_ORDERS,
  API_ENDPOINT_OPENED_POSITIONS,
  API_ENDPOINT_CLOSED_ORDERS,
  API_ENDPOINT_CLOSE_ALL_POSITIONS,
  API_ENDPOINT_GET_POSITION_DETAILS,
} from "../../../data/Endpoints-API.js";
import APIMiddleware from "../../../data/api/Api-Middleware.js";
import "./Account-Manager.scss";
import { adjustDateTime, formatDate, formatDigitBasePrice, formatPrice } from "../../../utils/format.js";
import { WS_ENDPOINT_ACCOUNT_DETAILS } from "../../../data/Endpoints-WS.js";
import { ws_create } from "../../../data/websocket/Websocket-Middleware.js";
import { log } from "console";
import { useOrderContext } from "../../../contexts/Order-Context.js";
import EditSltp from "../edit_sltp_modal/Edit-Sltp.tsx";
import { useMatches } from "react-router-dom";
import PositionHistory from "./PositionHistory.jsx";
import OrderHistory from "./OrderHistory.jsx";
import Orders from "./Orders.jsx";
import DataTable, {createTheme} from "react-data-table-component";
import MetricsPanel from "../metrics_panel/Metrics-Panel.jsx";
import { TbZip } from "react-icons/tb";
import BotPositionHistory from "./BotPositionHistory.jsx";
import { start } from "repl";
import PositionEvent from "./PositionEvent.jsx";

// function chunkArray(array: any[], size: number) {
//   const chunkedArray: any[][] = [];
//   for (let i = 0; i < array.length; i += size) {
//     chunkedArray.push(array.slice(i, i + size));
//   }
//   return chunkedArray;
// }
function chunkArray(array, size) {
  let size2 = size;
  if (!Array.isArray(array)) {
    console.log('Please provide a valid array (in chunkArray function positions)');
    return [];
  }
  if (typeof size2 !== 'number' || size2 <= 0) {
    // throw new TypeError('Size should be a positive number');
    size2 = 5;
  }

  const chunkedArray: any[][] = [];
  for (let i = 0; i < array.length; i += size2) {
    chunkedArray.push(array.slice(i, i + size2));
  }
  return chunkedArray;
}

interface AccountManagerProps {
  mobileMode: boolean;
}

const AccountManager: React.FC<AccountManagerProps> = ({mobileMode}) => {
  const { updateMetrics, metrics,utcOffset, setShowDealsModal, showDealsModal} = useMetricsContext();
  const { selectedStyle, setSelectedStyle, styleOptions } = useChartContext();
  const buttonRef = useRef<HTMLDivElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const ordersDivRef = useRef<HTMLDivElement>(null);
  const orderHistoryDivRef = useRef<HTMLDivElement>(null);

  const [isSymbolSelecting, setIsSymbolSelecting] = useState(false);
  const [currActiveTab, setCurrActiveTab] = useState(0);
  const [radioChecked, setRadioChecked] = useState(true);
  const [radioChecked2, setRadioChecked2] = useState(true);
  const [selectDisabled, setSelectDisabled] = useState(false);
  const [selectDisabled2, setSelectDisabled2] = useState(false);
  const [direction, setDirection] = useState("all");
  const [firstdirection, setFirstdirection] = useState("all");

  const [botFilter, setBotFilter] = useState("all");

  const [selectedPositionView, setSelectedPositionView] = useState(null);
  const [openOrdersCountM, setOpenOrdersCountM] = useState(0)
  const [openOrdersCountD, setOpenOrdersCountD] = useState(0)
  const today = new Date(); // Get today's date
  const [filterDate, setFilterDate] = useState<{ startDate: Date | null, endDate: Date | null }>({ startDate: null, endDate: null });
  const [orderDate, setOrderDate] = useState<{ startDate: Date | null, endDate: Date | null }>({ startDate: null, endDate: null });
  const [selPositionId, setSelPositionId] = useState([])
  const [selectedDateState, setSelectedDateState] = useState('all');
  const [selectedOrderDate, setselectedOrderDate] = useState('all');
  const [startingDate, setStartingDate] = useState<{ startDate: Date | null, endDate: Date | null }>({ startDate: null, endDate: null });
  const [positionDealsInfo, setPositionDealsInfo] = useState([]);
  const modalBottom = useRef(null);
  const [bulkOperationType, setBulkOperationType] = useState(null);
  const [expandView] = useState(true);
  const isValidNumber = (value) => typeof value === 'number' && !isNaN(value);
  const netPnl = `${isValidNumber(metrics?.totalUnrealizedPnL) ? metrics.totalUnrealizedPnL.toFixed(2) : 'N/A'}`;


  const handlePositionModal = async  () =>{
    const response = await APIMiddleware.get(API_ENDPOINT_GET_POSITION_DETAILS(user.userId, selectedPosition?.position_id));
    setPositionDealsInfo(response.resp);
    setShowDealsModal(true);
  }
  
  const handleDateChange = (event, key) => {
    const newDate = new Date(event.target.value);
    setStartingDate(prev => ({ ...prev, [key]: newDate }));
  };
  const [datePickar, setDatePickar] = useState<{ startDate: Date | null, endDate: Date | null }>({ startDate: null, endDate: null });
  const datePickarFunction = (event, key) => {
    const newDate = new Date(event.target.value);
    setDatePickar(prev => ({ ...prev, [key]: newDate }));
  };
  const handleFilter = (e) => {
    const value = e.target.value;
    setFilterText(value);
  };
  const handleSelectChange = (selectedOption) => {
    setDirection(selectedOption.value);
  };
  const options = [
    { value: "all", label: "All Directions (Default)" },
    { value: "Buy", label: "Buy" },
    { value: "Sell", label: "Sell" },
  ];
  const handleOpenOrdersMobile = (newData) => {
    setOpenOrdersCountM(newData);
  };


  const handleBotFilterChange = (selectedValue) => {
  setBotFilter(selectedValue);
};

  const customStyle = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '3px !important',
      width: '150px',
      borderColor: '#484848 !important',
      backgroundColor: '#232323 !important',
      boxShadow: state.isFocused
        ? '0 0 50px #484848 !important'
        : provided.boxShadow,
      cursor: 'pointer',
      '&:hover': {
        borderColor: `${selectedStyle.buyColor} !important`,
        cursor: 'pointer',
        boxShadow: '0 0 0 transparent !important',
      },
    }),
    singleValue: (provided, state) => ({
      ...provided,
      paddingLeft: '10px !important',
      borderColor: state.isFocused
        ? `${selectedStyle.buyColor} !important`
        : '#484848 !important',
      color: '#c5c5c5 !important',
    }),
    option: (provided, state, inSettings = true) => ({
      ...provided,
      padding: inSettings ? '0.3rem !important' : '0 !important',
      cursor: 'pointer',
      color: state.isSelected
        ? `${selectedStyle.buyColor} !important`
        : '#c5c5c5 !important',
      borderBottom: '1px solid #232323',
      backgroundColor: state.isSelected ? '#232323 !important' : 'transparent',
      '&:hover': {
        backgroundColor: `${selectedStyle.buyColor} !important`,
        color: '#2d2d2d !important',
      },
      '&:nth-last-child(1)': {
        borderBottom: 'none !important',
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#3b3a3a !important',
      // width: 'calc(100% - 1.6rem) !important',
      margin: '0.3rem 0.8rem 0 0.8rem !important',
      zIndex: 111,
      left: '-10px'
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '100px', // Reduced height
      minHeight: '3px',
      width: '150px', // Ensures the menu list width matches the menu container
      overflowY: 'auto',
    }),
  };
  const handleOpenOrdersDesktop = (newData) => {
    setOpenOrdersCountD(newData);
  };

  function changehanlde(e) {
    const value = e.target.value;
    setSelectedDateState(value);
    if (value === 'Today') {
      const today = new Date(); // Get today's date
      // First date starting from midnight
      const startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0); // Set time to midnight (0 hours, 0 minutes, 0 seconds, 0 milliseconds)
      // Second date ending at 23:59:59.999
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999); // Set time to 23:59:59.999 (23 hours, 59 minutes, 59 seconds, 999 milliseconds)

      const dateobj = {
        startDate: startDate,
        endDate: endDate
      };
      setFilterDate(dateobj);
      // console.log("Today", dateobj)
    }
    else if (value === 'Yesterday') {
      const today = new Date(); // Get today's date

      // Subtract one day from today to get yesterday's date
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      // First date starting from midnight
      const startDate = new Date(yesterday);
      startDate.setHours(0, 0, 0, 0); // Set time to midnight (0 hours, 0 minutes, 0 seconds, 0 milliseconds)

      // Second date ending at 23:59:59.999
      const endDate = new Date(yesterday);
      endDate.setHours(23, 59, 59, 999); // Set time to 23:59:59.999 (23 hours, 59 minutes, 59 seconds, 999 milliseconds)

      yesterday.setDate(today.getDate() - 1);
      const dateobj = {
        startDate: startDate,
        endDate: endDate
      };
      setFilterDate(dateobj);
      // console.log("Yesterday", dateobj)

    }

    else if (value === 'CurrentWeek') {
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay())); // Get the start of the current week (Sunday)
      const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6)); // Get the end of the current week (Saturday)

      const dateobj = {
        startDate: startOfWeek,
        endDate: endOfWeek
      };
      setFilterDate(dateobj);

      // console.log("current week:", dateobj);
    }

    else if (value === 'CurrentMonth') {
      const today = new Date(); // Get today's date
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // First day of the month
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of the month

      const dateobj = {
        startDate: firstDayOfMonth,
        endDate: lastDayOfMonth
      };

      setFilterDate(dateobj);

      // Now you can use `monthData` to filter your data for the current month
      // console.log("Current Month:", dateobj);
    }
    else if (value === 'PreviousMonth') {
      const today = new Date(); // Get today's date
      const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1); // First day of the current month
      const firstDayOfPreviousMonth = new Date(firstDayOfCurrentMonth); // Copy the date
      firstDayOfPreviousMonth.setMonth(firstDayOfPreviousMonth.getMonth() - 1); // Set it to the previous month
      const lastDayOfPreviousMonth = new Date(firstDayOfCurrentMonth); // Copy the date again
      lastDayOfPreviousMonth.setDate(0); // Set it to the last day of the previous month

      const dateobj = {
        startDate: firstDayOfPreviousMonth,
        endDate: lastDayOfPreviousMonth
      };

      setFilterDate(dateobj);

      // console.log("Last Month:", dateobj);
    }

    else if (value === 'LastThreeMonths') {
      const today = new Date(); // Get today's date
      const firstDateThirdMonthAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1); // First day of the third last month
      const lastDateLastMonth = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of the previous month

      const dateobj = {
        startDate: firstDateThirdMonthAgo,
        endDate: lastDateLastMonth
      };

      setFilterDate(dateobj);

      // console.log("Last 3 Month:", dateobj);
    }
    else if (value === 'Last6Months') {
      const today = new Date(); // Get today's date
      const firstDateThirdMonthAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1); // First day of the third last month
      const lastDateLastMonth = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of the previous month

      const dateobj = {
        startDate: firstDateThirdMonthAgo,
        endDate: lastDateLastMonth
      };

      setFilterDate(dateobj);
      // console.log("Last 6 Month:", dateobj);
    }

    else if (value === 'all') {
      // setFilterDate(null);
      // console.log("Last 6 Month:", dateobj);
    }
    else {
      //setFilterDate('all');
    }
  }

    const MobilePositionRow = ({ position, isExpanded, onToggle, onLongPressTrigger }) => { 
      
      const handleLongPress = () => {
        onLongPressTrigger(position);
        console.log('Long press triggered');
      };

      const {
        handlers,
        isLongPress,
        cancel: cancelLongPress
      } = useLongPress(handleLongPress, 100);


      const handleClick = () => {
        if (isLongPress())
        return;
        onToggle();
        
        console.log('Single click');
        // alert('Single click');
      };

      return (
        <div className={`mobile-position-row ${isExpanded ? 'expanded' : ''}`} >
          <div onClick={handleClick} {...handlers} onTouchStart={handlers.onTouchStart}>
            <div className="main-row">
              <div className="left-section">
                <div className="symbol-direction">
                  <span className="symbol-name">{position.symbol}</span>
                  <span
                    style={{
                      color:
                        position.direction?.toLowerCase() === 'buy'
                          ? selectedStyle.buyColor
                          : selectedStyle.sellColor
                    }}
                  >
                    {position.direction}
                  </span>
                  <span className="quantity">{Number(position.quantity).toFixed(3)}</span>
                </div>
                <div className="price-movement">
                  {formatDigitBasePrice(position.entry_price, 5)} → {position.current_price || '-'}
                </div>
              </div>
              <div
                style={{
                  color:
                    position.pnl >= 0
                      ? selectedStyle.buyColor
                      : selectedStyle.sellColor
                }}
              >
                {!isNaN(Number(position.pnl))
                  ? Number(position.pnl).toFixed(2)
                  : '---'}
              </div>
            </div>

            {isExpanded && (
              <div className="expanded-section">
                <div className="created-at">
                  {formatDate(adjustDateTime(position.created_at, utcOffset))}
                </div>
                <div className="row">
                  <div className="half-row">
                    <span className="label">S/L:</span>
                    <span className="value">
                      {position.SL ? formatDigitBasePrice(position.SL, 5) : '--'}
                    </span>
                  </div>
                  <div className="half-row">
                    <span className="label">T/P:</span>
                    <span className="value">
                      {position.TP ? formatDigitBasePrice(position.TP, 5) : '--'}
                    </span>
                  </div>
                </div>
                <div className="row">
                  <div className="half-row">
                    <span className="label">Margin:</span>
                    <span className="value">{formatDigitBasePrice(position.margin, 7)}</span>
                  </div>
                  <div className="half-row">
                    <span className="label">ID:</span>
                    <span className="value">{`PID${position.position_id.toString().padStart(8, "0")}`}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    };


  const MobilePositionsList = ({ positions }) => {
    const toggleRow = (positionId) => {
      setExpandedRows(prev => ({
        ...prev,
        [positionId]: !prev[positionId]
      }));
    };    
    const handleLongPressTrigger = (position) => {
      setPopupPosition(position);
      setShowClosePopup(true);
    };
  
    return (
      <>
        <div className="mobile-positions-container">
          <div className="ellipsis-header">
            <button className="ellipsis-btn" onClick={() => setShowCloseAllPopup(true)}>
              ⋯
            </button>
          </div>
          {positions.map(position => (
            <MobilePositionRow
              key={position.position_id}
              position={position}
              isExpanded={expandedRows[position.position_id]}
              onToggle={() => toggleRow(position.position_id)}
              onLongPressTrigger={handleLongPressTrigger}
            />
          ))}
        </div>
        {showCloseAllPopup && (
          <div className="bottom-popup-overlay" onClick={() => setShowCloseAllPopup(false)} ref={modalBottom}>
            <div className="bottom-popup" onClick={(e) => e.stopPropagation()}>
              <h3 className="popup-heading">Bulk Operations</h3>

              <div className="bulk-buttons-container">
                <button
                  className="bulk-button"
                  onClick={(e) => {
                    clearPopup(e, 'close all positions');
                    setShowCloseAllPopup(false);
                  }}
                >
                  Close All Positions 
                  {/* <span className={`${parseFloat(metrics?.totalUnrealizedPnL) >= 0 ? selectedStyle.buyColor : selectedStyle.sellColor} ${expandView && 'multiline-truncate'}`} title={netPnl} >{netPnl}</span> */}
                  <span
                    style={{
                      color: parseFloat(metrics?.totalUnrealizedPnL) >= 0 
                        ? selectedStyle.buyColor 
                        : selectedStyle.sellColor,
                      ...(expandView && { 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,   
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }),
                    }}
                    title={netPnl}
                  >
                    {netPnl}
                  </span>
                </button>

                {/* Only show the Close Profitable Positions button if there are profitable positions */}
                {openPositions.some(pos => pos.pnl > 0 && !selPositionId.includes(pos.position_id)) && (
                  <button
                    className="bulk-button"
                    onClick={(e) => {
                      setBulkOperationType('profitable');
                      setShowCloseAllPopup(false);
                      setClearWindow("true");
                      setPopupTitle('close profitable positions');
                    }}
                  >
                    Close Profitable Positions
                  </button>
                )}

                {/* Only show the Close Losing Positions button if there are losing positions */}
                {openPositions.some(pos => pos.pnl <= 0 && !selPositionId.includes(pos.position_id)) && (
                  <button
                    className="bulk-button"
                    onClick={(e) => {
                      setBulkOperationType('losing');
                      setShowCloseAllPopup(false);
                      setClearWindow("true");
                      setPopupTitle('close losing positions');
                    }}
                  >
                    Close Losing Positions
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showClosePopup && popupPosition && (
          <div className="bottom-popup-overlay2" onClick={() => setShowClosePopup(false)}>
            <div className="bottom-popup2" onClick={(e) => e.stopPropagation()}>
              <button
                className="close-all-button"
                onClick={() => {
                  setSelPositionId((prev) => [...prev, popupPosition.position_id]);

                  closePosition(
                    user.userId,
                    popupPosition,  
                    popupPosition.direction === 'Buy' ? popupPosition.bid_price : popupPosition.ask_price,
                    popupPosition.direction
                  );

                  setShowClosePopup(false);
                }}
                disabled={selPositionId.includes(popupPosition.position_id)}
              >
                Close Position
              </button>
            </div>
          </div>
        )}
      </>
    );
  };
  function changehanldefunction(e) {
    const value = e.target.value;
    setselectedOrderDate(value);
    if (value === 'Today') {
      const today = new Date(); // Get today's date

      // First date starting from midnight
      const startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0); // Set time to midnight (0 hours, 0 minutes, 0 seconds, 0 milliseconds)

      // Second date ending at 23:59:59.999
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999); // Set time to 23:59:59.999 (23 hours, 59 minutes, 59 seconds, 999 milliseconds)


      const dateobj = {
        startDate: startDate,
        endDate: endDate
      };
      setOrderDate(dateobj);
      // console.log("Today", dateobj)
    }
    else if (value === 'Yesterday') {
      const today = new Date(); // Get today's date

      // Subtract one day from today to get yesterday's date
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      // First date starting from midnight
      const startDate = new Date(yesterday);
      startDate.setHours(0, 0, 0, 0); // Set time to midnight (0 hours, 0 minutes, 0 seconds, 0 milliseconds)

      // Second date ending at 23:59:59.999
      const endDate = new Date(yesterday);
      endDate.setHours(23, 59, 59, 999); // Set time to 23:59:59.999 (23 hours, 59 minutes, 59 seconds, 999 milliseconds)

      yesterday.setDate(today.getDate() - 1);
      const dateobj = {
        startDate: startDate,
        endDate: endDate
      };
      setOrderDate(dateobj);
      // console.log("Yesterday", dateobj)
    }

    else if (value === 'CurrentWeek') {
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay())); // Get the start of the current week (Sunday)
      const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6)); // Get the end of the current week (Saturday)

      const dateobj = {
        startDate: startOfWeek,
        endDate: endOfWeek
      };
      setOrderDate(dateobj);
      // console.log("current week:", dateobj);
    }

    else if (value === 'CurrentMonth') {
      const today = new Date(); // Get today's date
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // First day of the month
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of the month

      const dateobj = {
        startDate: firstDayOfMonth,
        endDate: lastDayOfMonth
      };
      setOrderDate(dateobj);
      // Now you can use `monthData` to filter your data for the current month
      // console.log("Current Month:", dateobj);
    }
    else if (value === 'PreviousMonth') {
      const today = new Date(); // Get today's date
      const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1); // First day of the current month
      const firstDayOfPreviousMonth = new Date(firstDayOfCurrentMonth); // Copy the date
      firstDayOfPreviousMonth.setMonth(firstDayOfPreviousMonth.getMonth() - 1); // Set it to the previous month
      const lastDayOfPreviousMonth = new Date(firstDayOfCurrentMonth); // Copy the date again
      lastDayOfPreviousMonth.setDate(0); // Set it to the last day of the previous month

      const dateobj = {
        startDate: firstDayOfPreviousMonth,
        endDate: lastDayOfPreviousMonth
      };
      console.log('1 months', dateobj);
      setOrderDate(dateobj);
      // console.log("Last Month:", dateobj);
    }

    else if (value === 'LastThreeMonth') {
      const today = new Date(); // Get today's date
      const firstDateThirdMonthAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1); // First day of the third last month
      const lastDateLastMonth = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of the previous month

      const dateobj = {
        startDate: firstDateThirdMonthAgo,
        endDate: lastDateLastMonth
      };
      console.log('3 months', dateobj);

      setOrderDate(dateobj);

      // console.log("Last 3 Month:", dateobj);
    }
    else if (value === 'Last6Month') {
      const today = new Date(); // Get today's date
      const firstDateThirdMonthAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1); // First day of the third last month
      const lastDateLastMonth = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of the previous month

      const dateobj = {
        startDate: firstDateThirdMonthAgo,
        endDate: lastDateLastMonth
      };
      console.log('6 months', dateobj);

      setOrderDate(dateobj);
      // console.log("Last 6 Month:", dateobj);
    }

    else if (value === 'all') {
      // setOrderDate(null);
      // console.log("Last 6 Month:", dateobj);
    }
    else {
      //setOrderDate('all');
    }
  }
  const handleFirstDivClick = () => {
    setRadioChecked(true);
    setSelectDisabled(false); // Ensure select is enabled when clicking on the first div
  };

  const handleSecondDivClick = () => {
    setRadioChecked(false);
    setSelectDisabled(true); // Disable select when clicking on the second div
  };

  const handleFirstDivClick2 = () => {
    setRadioChecked2(true);
    setSelectDisabled2(false); // Ensure select is enabled when clicking on the first div
  };

  const handleSecondDivClick2 = () => {
    setRadioChecked2(false);
    setSelectDisabled2(true); // Disable select when clicking on the second div
  };

  const handleDateInputClick = (event) => {
    event.stopPropagation(); // Prevent event propagation to avoid affecting div clicks
  };

  const [clearWindow, setClearWindow] = useState("false");
  const [popupTitle, setPopupTitle] = useState();
  const clearPopup = (e, title) => {
    setClearWindow("true");
    setPopupTitle(title);
  };
  const popupAction = (e) => {
    if (popupTitle  === 'close all positions')  {
      clearAllPositions();
    } else if (bulkOperationType === 'profitable') {
      clearAllProfitablePositions();
    } else if (bulkOperationType === 'losing') {
      clearAllLosingPositions();
    }
    setClearWindow("false");
  };

  const [tab, setTab] = useState("1");
  const tabMenu: Element = document.getElementsByClassName("tabs-ah-mb")[0];

  const setTabFunction = (time: number): void => {
    const currentPosition: string | null =
      tabMenu.getAttribute("aria-colcount");
    const indicator: Element = document.getElementsByClassName(
      "active-tab-indicator"
    )[0];
    const tabXData: Element =
      document.getElementsByClassName("tabs-ah-mb-data")[0];

    setTimeout(() => {
      let leftGap: number = 0;
      let currentWidth: string | null = null;

      if (currentPosition !== null) {
        for (let i = 0; i < tabMenu.children.length - 1; i++) {
          if (
            tabMenu.children[i] === tabMenu.children[parseInt(currentPosition)]
          ) {
            currentWidth = getComputedStyle(tabMenu.children[i]).width;
            localStorage.setItem("accountHistory", String(i));
            tabXData.children[i].setAttribute("role", "true");
            tabMenu.children[i].setAttribute("role", "true");

            for (let j = 0; j < i; j++) {
              const currentPrefix: CSSStyleDeclaration = getComputedStyle(
                tabMenu.children[j]
              );
              leftGap += parseInt(currentPrefix.width.split("px")[0]);
            }
          } else {
            tabMenu.children[i].setAttribute("role", "false");
            tabXData.children[i].setAttribute("role", "false");
          }
        }

        if (currentWidth !== null) {
          indicator.style.width = currentWidth;
          indicator.style.left = `${leftGap}px`;
        }
      }
    }, time);
  };

  const filterData = (text, direction, botFilter) => {
    let filteredItems = openPositions; 
    // if (botPositions?.length > 0) filteredItems.unshift(...botPositions);

    if (botFilter !== 'all') {
      filteredItems = filteredItems.filter((item) => {
        if (botFilter === 'isBot') {
          return item.is_bot_trade === 1;  
        } else if (botFilter === 'nonBot') {
          return item.is_bot_trade === 0;  
        }
        return true; 
      });
    }

    if (direction !== 'all') {
      filteredItems = filteredItems.filter((item) => item.direction === direction);
    }


    if (text) {
      filteredItems = filteredItems.filter(
        (item) => {
          const searchText = text.toLowerCase().replace('pid', '').replace(/^0+/, '');
          return item.symbol.toLowerCase().includes(searchText) || 
             item.position_id.toString().toLowerCase().includes(searchText);
        }
      );
    }
    setFilteredData(filteredItems);
  };

  // useEffect(() => {
  //   if (tabMenu !== undefined) {
  //     setTabFunction(1000);
  //   }

  //   const savedAccountHistory = localStorage.getItem("accountHistory");
  //   if (savedAccountHistory !== null) {
  //     setTab(savedAccountHistory);
  //   }
  // }, [tabMenu]);


  const tabMenuRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabXDataRef = useRef<HTMLDivElement>(null);

  const [activeHistoryTab, setActiveHistoryTab] = useState(0);
  const selectTab = (e: number): void => {
    // tabMenu.setAttribute("aria-colcount", e);
    // setTabFunction(0);
    // setCurrActiveTab(e);
    setActiveHistoryTab(e);
  };

  //CONTEXT
  const {
    selectedAuthSymbol,
    openPositions,
    openOrders,
    closedPositions,
    closedOrders,
    closePosition,
    closeOrder,
    cancelOrder,
    setAllOpenPositions,
    setAllOpenOrders,
    setAllClosePositions,
    setAllCloseOrders,
    isClosing,
    isClosingOrder,
    setIsClosing,
    setIsClosingOrder,
    closeAllPosition,
    closeProfitablePositions,
    closeLosingPositions,
    closeAllOrder,
    activeTab,
    setActiveTab,
    isClosingPosition,
    orderHistoryCount,
    positionHistoryCount,
    isClosingAllPositions,
    isCancellingOrder,
    positionCount,
    ordersCount,
    botPositionHistoryCount,
    totalBotPositionHistoryCount
  } = useAccountManagerContext();
  const { user, platFromData, setAuthSelectedCategory, setAuthSelectedSymbol, setSelectedAuthSymbolId } = useAuthContext();
  const { symbolData, updateSymbolData, setSelectedCategoryId, setSelectedSymbolSession } = useSymbolContext();

  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});
  const [showCloseAllPopup, setShowCloseAllPopup] = useState(false);
  const [showClosePopup, setShowClosePopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState(null);
  
  const [filter, setfilter] = useState('');
  const [firstfilter, setfirstfilter] = useState("");
  const [secondfilter, setsecondfilter] = useState("");
  const [thirdfilter, setthirdfilter] = useState("");
  const [isEditSltpVisible, setIsEditSltpVisible] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState({ position_id: null, symbol: '', SL: null, TP: null, quantity: null });
  const [isEdit, setIsEdit] = useState(false);

  const [filterText, setFilterText] = useState('');
  const [filteredData, setFilteredData] = useState([]);



  const [filteredCount, setFilteredCount] = useState();

  useEffect(() => {
    const filteredPositions = openPositions.filter((item) => {
      const symbolMatches = filter === '' ? item : item.symbol.toLowerCase().includes(filter.toLowerCase());
      const directionMatches = direction === 'all' ? true : item.direction.toLowerCase() === direction;
      let botFilterMatches = botFilter === 'all' ? true : botFilter === 'isBot'   ? item.is_bot_trade === 1 : botFilter === 'nonBot' ? item.is_bot_trade !== 0 : false;

      return symbolMatches && directionMatches && botFilterMatches;
    });

    setFilteredCount(filteredPositions.length);
  }, [filter, openPositions, direction, botFilter]);

  const handleSearchChange = (event) => {
    const filterValue = event.target.value;
    setfilter(filterValue);
  };

  const [filteredOrder, setFilterOrder] = useState("");
useEffect(() => {
    function handleClickOutside(event) {
      if (
        modalBottom.current &&
        !modalBottom.current.contains(event.target)
      ) {
        setShowCloseAllPopup(false);
      }
    }

    if (showCloseAllPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCloseAllPopup]);
  useEffect(() => {

    const filteredPositions = openOrders.filter((item) => {
      const symbolMatches = firstfilter === '' ? item : item.symbol.toLowerCase().includes(firstfilter.toLowerCase());
      const directionMatches = firstdirection === 'all' ? true : item.direction.toLowerCase() === firstdirection;
      return symbolMatches && directionMatches;

    });
    setFilterOrder(filteredPositions.length);
  }, [firstfilter, openOrders, firstdirection]);

  const handleSearchOrder = (event) => {
    const filterValue = event.target.value;
    setfirstfilter(filterValue);
  };

  const [filteredHistory, setFilteredHistory] = useState(closedPositions.length);

  useEffect(() => {
    const filteredPositions = closedPositions.filter(item => {
      const itemDate = new Date(item.position_closed_at);

      // Check if the item passes the date filter based on radioChecked
      if (radioChecked) {
        if (selectedDateState !== "all") {
          return itemDate >= filterDate.startDate && itemDate <= filterDate.endDate;
        } else {
          return true;
        }
      } else {
        if (startingDate.startDate && startingDate.endDate) {
          return itemDate >= startingDate.startDate && itemDate <= startingDate.endDate;
        } else {
          return true;
        }
      }
    }).filter(item => item.symbol.toLowerCase().includes(secondfilter.toLowerCase()));

    setFilteredHistory(filteredPositions.length);
  }, [closedPositions, secondfilter]);

  const handleSearchHistory = (event) => {
    const filterValue = event.target.value;
    setsecondfilter(filterValue);
  };

  const [filteredOrdersCount, setFilteredOrdersCount] = useState(0);

  useEffect(() => {
    const filteredOrders = closedOrders.filter(item => {
      const itemDate = new Date(item.status_updated_at);
  
      // Check if the item passes the date filter based on radioChecked2
      if (radioChecked2) {
        if (selectedOrderDate !== "all") {
          return itemDate >= orderDate.startDate && itemDate <= orderDate.endDate;
        } else {
          return true;
        }
      } else {
        if (datePickar.startDate && datePickar.endDate) {
          return itemDate >= datePickar.startDate && itemDate <= datePickar.endDate;
        } else {
          return true;
        }
      }
    }).filter(item => item.symbol.toLowerCase().includes(thirdfilter.toLowerCase()));
    setFilteredOrdersCount(filteredOrders.length);
  }, [ closedOrders ,thirdfilter]);

    const handleHistoryChange = (event) => {
    const filterValue = event.target.value;
    setthirdfilter(filterValue);
  };

  useEffect(() => {
    if (user && user.userId != undefined && user.userId > 0) {
      const loadAccountData = async () => {
        //get all opened position
        await getOpenedPositions();

        //get all closed position
        // await getClosedPositions();

        await getOpenedOrders();

        // await getClosedOrders();

        //when data loaded then set flag to false
        if (loading) setLoading(false);

        setIsClosingOrder(false);
      };
      loadAccountData();
    }
  }, [user, platFromData[3], platFromData[4]]); // The empty dependency array ensures this effect runs once on mount

  // useEffect(() => {
  //   if (user && user.userId != undefined && user.userId > 0) {
  //     // Calculate and set the initial total P&L when component mounts
  //     // updateTotalPnl();

  //     // if no position is in Closing State then look for SL and TP hit
  //     // if (!isClosing) {
  //     //   checkSLTP();
  //     // }

  //     // if (!isClosingOrder) {
  //     //   checkOrderEntryPrice();
  //     // }

  //     //return () => clearInterval(checkSLTPInterval); // Cleanup on component unmount
  //   }
  // }, [symbolData, selectedAuthSymbol]);
  useEffect(() => {
    filterData(filterText, direction, botFilter);
  }, [openPositions, filterText, direction, botFilter]);
  // useEffect(() => {
  //   if (user && user.userId != undefined && user.userId > 0) {
  //     ws_account.ws_connect(WS_ENDPOINT_ACCOUNT_DETAILS(user?.userId, selectedAuthSymbol), WS_MESSAGE_EVENT_LISTENER);

  //     //handle data got from web-socket message and apply to the component
  //     const handleAccountData = (event) => {
  //       updateAccountData(event.detail);

  //     };

  //     //listen event emit(dispatched) from on-message event of web-socket-middleware
  //     document.addEventListener(WS_MESSAGE_EVENT_LISTENER, handleAccountData);

  //     const updateAccountData = (item) => {
  //       const data = item;
  //     }
  //   }
  // }, [user]);

  // const clearOrder = (e) => {
  //   if(e == 'view'){
  //     document.querySelector(".confirm-box").setAttribute("view", "true");
  //   }
  //   if(e == 'no'){
  //     document.querySelector(".confirm-box").setAttribute("view", "false");
  //   }
  //   if(e == 'ok'){
  //     document.querySelector(".confirm-box").setAttribute("view", "false");
  //     clearAllOrders()
  //   }
  // };

  // Select Symbol Handler
  const handleRowClick = ({ symbol: symbolName }) => {
    if (window.innerWidth < 990 || !symbolName) return;
    setIsSymbolSelecting(true);
    // setIsSymbolSelectingWatchlist(true);
    // Update symbol context data when a row is clicked
  
    updateSymbolData(symbolName, symbolData[symbolName].ea,symbolData[symbolName].eb, symbolData[symbolName].bid,symbolData[symbolName].ask,symbolData[symbolName].is_session_active);
    setSelectedCategoryId(symbolData[symbolName].symbol_category);
    // setSelectedSymbolSession(symbolData[symbolName].is_session_active);
    // updateSymbolDetailsData(symbolName);
    setAuthSelectedCategory(symbolData[symbolName].symbol_category);
    setAuthSelectedSymbol(symbolName);
    setSelectedAuthSymbolId(symbolData[symbolName]?.id);

    setTimeout(() => {
        setIsSymbolSelecting(false);
    }, 3000);
  };

  const [currentPage, setCurrentPage] = useState(1)
  const positionsPerPage = 9;
  const indexOfLast = currentPage * positionsPerPage;
  const indexOfFirst = indexOfLast - positionsPerPage;
  const currentPositions = filteredData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredData.length / positionsPerPage);
  
  const currTab = document.body.getAttribute('mobileCurrentView');

  const handlePageChange = (pg) => {
    setCurrentPage(pg);
  };

  const clearAllPositions = async () => {
    closeAllPosition(user.userId);
  };

  const clearAllProfitablePositions = async () => {
    closeProfitablePositions(user.userId, 1);
  }

  const clearAllLosingPositions = async () => {
    closeLosingPositions(user.userId, 0);
  };

  const clearAllOrders = async () => {
    const currentDate = new Date();
    const currentDateTime = new Date(currentDate);
    closeAllOrder(user.userId);
  };

  const handleExpandCollapseRow = (e, id) => {
    setExpandedRows((prevExpandedRows) => ({
      ...prevExpandedRows,
      [id]: !prevExpandedRows[id],
    }));
  };

  // check SL and TP for each open position
  const checkSLTP = () => {
    let position_local = null;
    let currentPrice_local = null;

    for (const position of openPositions) {
      const currentPrice = position.current_price;
      if (currentPrice !== undefined) {
        if (position.direction === "Buy") {
          // For Buy positions
          if (position.SL > 0 && currentPrice <= position.SL) {
            // If current price is less than or equal to SL, get selected position and close it
            position_local = position;
            currentPrice_local = currentPrice;
            break;
          } else if (position.TP > 0 && currentPrice >= position.TP) {
            // If current price is greater than or equal to TP, get selected position and close it
            position_local = position;
            currentPrice_local = currentPrice;
            break;
          }
        } else {
          // For Sell positions
          if (position.SL > 0 && currentPrice >= position.SL) {
            // If current price is greater than or equal to SL, get selected position and close it
            position_local = position;
            currentPrice_local = currentPrice;
            break;
          } else if (position.TP > 0 && currentPrice <= position.TP) {
            // If current price is less than or equal to TP, get selected position and close it
            position_local = position;
            currentPrice_local = currentPrice;
            break;
          }
        }
      }
    }

    // if SL / TP hit any of the open position then close that position
    if (position_local && currentPrice_local) {
      setIsClosing(true);
      // setLoadingSymbolContext(true);
      closePosition(user.userId, position_local, currentPrice_local, metrics);
    }
  };

  // fetch opened positions and update the context with the retrieved data
  const getOpenedPositions = async () => {
    try {
      if (platFromData && platFromData.length > 3 && platFromData[3] && platFromData[3]['openedPositions']) {
        if (user && user.userId != undefined && user.userId > 0) {
          const positions: Position[] = platFromData[3]['openedPositions'].map((obj) => {
            return {
              id: obj.id,
              created_at: obj.created_at,
              position_id: obj.id,
              symbol: obj.symbol,
              quantity: obj.quantity,
              direction: obj.direction,
              botFilter: obj.botFilter,
              entry_price: obj.entry_price,
              TP: obj.TP != 0 ? obj.TP : "",
              SL: obj.SL != 0 ? obj.SL : "",
              netEUR: 0, // Set appropriate values
              status: "",
              margin: obj.margin,
              pnl: obj.pnl,
              current_price: obj.current_price,
              formatted_date: obj.formatted_date,
              ask_price: obj.ask_price,
              bid_price: obj.bid_price,
              lot_step: obj.lot_step,
              is_bot_trade: obj.is_bot_trade
            };
          });

          setAllOpenPositions(positions);
        }

      }
    } catch (error) {
      console.error(`Error getting opened positions`, error);
    }
  };

  // fetch closed positions and update the context with the retrieved data
  const getClosedPositions = async () => {
    try {
      if (platFromData && platFromData.length > 3 && platFromData[3] && platFromData[3]['closedPositions']) {
        if (user && user.userId != undefined && user.userId > 0) {
          const positions: Position[] = platFromData[3]['closedPositions'].map((obj) => {
            // Map the properties from the received data to the desired format
            return {
              id: obj.id,
              created_at: new Date(obj.created_at), // Convert the string to a Date object
              position_id: obj.position_id,
              symbol: obj.symbol,
              quantity: obj.quantity,
              direction: obj.direction,
              entry_price: obj.entry_price,
              TP: obj.TP != 0 ? obj.TP : "",
              SL: obj.SL != 0 ? obj.SL : "",
              netEUR: 0, // Set appropriate values
              status: "",
              margin: obj.margin,
              exit_price: obj.exit_price,
              position_closed_at: new Date(obj.position_closed_at),
              formatted_date: obj.formatted_date,
              formatted_date_open: obj.formatted_date_open
            };
          });

          setAllClosePositions(positions);
        }
      }
    } catch (error) {
      console.error(`Error getting closed positions`, error);
    }
  };

  const getClosedOrders = async () => {
    try {
      if (platFromData && platFromData.length > 4 && platFromData[4] && platFromData[4]['closedOrders']) {
        if (user && user.userId != undefined && user.userId > 0) {
          const orders: Order[] = platFromData[4]['closedOrders'].map((obj) => {
            // Map the properties from the received data to the desired format
            return {
              id: obj.id,
              // created_at: new Date(obj.created_at), // Convert the string to a Date object
              status_updated_at: new Date(obj.status_updated_at),
              order_id: obj.order_id,
              symbol: obj.symbol,
              quantity: obj.quantity,
              direction: obj.direction,
              entry_price: obj.entry_price,
              TP: obj.TP != 0 ? obj.TP : "",
              SL: obj.SL != 0 ? obj.SL : "",
              netEUR: 0, // Set appropriate values
              status: obj.status,
              margin: obj.margin,
              exit_price: obj.exit_price,
            };
          });

          setAllCloseOrders(orders);
        }
      }
    } catch (error) {
      // Handle API request error
      // console.error(`API request error: ${API_ENDPOINT_CLOSED_ORDERS}`, error);
      console.error(`Error getting closed orders`, error);
    }
  };

  // fetch opened orders and update the context with the retrieved data
  const getOpenedOrders = async () => {
    try {
      if (platFromData && platFromData.length > 4 && platFromData[4] && platFromData[4]['openedOrders']) {

        if (user && user.userId != undefined && user.userId > 0) {
          const orders: Order[] = platFromData[4]['openedOrders'].map((obj) => {
            // Map the properties from the received data to the desired format
            return {
              id: obj.id,
              created_at: obj.created_at,
              symbol: obj.symbol,
              quantity: obj.quantity,
              direction: obj.direction,
              botFilter: obj.botFilter,
              entry_price: obj.entry_price,
              TP: obj.TP != 0 ? obj.TP : "",
              SL: obj.SL != 0 ? obj.SL : "",
              netEUR: 0, // Set appropriate values
              status: "",
              margin: obj.margin,
              order_id: obj.order_id,
              current_price: obj.current_price
            };
          });
          setAllOpenOrders(orders);
        }
      }
    } catch (error) {
      console.error(`Error getting opened orders`, error);
    }
  };

  const handleTabClick = (tab: string) => {
    localStorage.setItem("accountManager", tab);
    setActiveTab(tab);
  };

  const calculatePNL = (
    direction: string,
    quantity: number,
    entryPrice: number,
    currentPrice: number
  ) => {
    let pnl = 0;
    if (direction === "Buy") {
      pnl = (currentPrice - entryPrice) * quantity;
    } else {
      pnl = (entryPrice - currentPrice) * quantity;
    }
    return pnl.toFixed(2);
  };

  const showEditSltp = () => {
    setIsEditSltpVisible(true);
  };

  const hideEditSltp = () => {
    setIsEditSltpVisible(false);
  };

  useEffect(() => {
    let timeoutId;
  
    const checkButtonRef = () => {
      if (buttonRef?.current) {
        buttonRef.current.click();
      } else {
        timeoutId = setTimeout(checkButtonRef, 5000);
      }
    };
    if (currTab === 'history') checkButtonRef();

    return () => clearTimeout(timeoutId);
  }, [currTab]);

  //show spinner while loading data
  if (loading) {
    return <Spinner />;
  }

  const positionDetails = (e) => {
    let element;
    if (e.target.parentNode.parentNode.tagName == "P") {
      element = e.target.parentNode.parentNode.parentNode;
    } else if (e.target.parentNode.parentNode.tagName == "DIV") {
      element = e.target.parentNode.parentNode;
    } else if (e.target.parentNode.parentNode.tagName == "BUTTON") {
      element = e.target.parentNode.parentNode.parentNode.parentNode;
    }
    const inp = document
      .getElementsByClassName("wm-parent")[0]
      .querySelectorAll("input");
    document
      .getElementsByClassName("wm-parent")[0]
      .setAttribute("aria-modal", "true");
    document.getElementsByClassName(
      "wmTitleDynamic"
    )[0].innerHTML = `Position Info ${element.querySelectorAll("p")[1].innerText
    }`;
    document.getElementsByClassName(
      "wmTitleDynamic"
    )[1].innerHTML = `Position Info: ${element.querySelectorAll("p")[1].innerText
    }`;
    document.getElementsByClassName(
      "wmDescriptionDynamic"
    )[0].innerHTML = `Current Symbol: ${element.querySelectorAll("p")[3].innerText
    }`;
    inp[0].value = element.querySelectorAll("p")[1].innerText;
    inp[1].value = element.querySelectorAll("p")[6].innerText;
    inp[2].value = element.querySelectorAll("p")[7].innerText;
    inp[3].value = element.querySelectorAll("p")[8].innerText;
    inp[4].value = element.querySelectorAll("p")[9].innerText;
    inp[4].setAttribute("role", element.querySelectorAll("p")[9].className);
    inp[5].value = element.querySelectorAll("p")[2].innerText;
    inp[6].value = element.querySelectorAll("p")[4].innerText;
    inp[7].value = element.querySelectorAll("p")[5].innerText;
    inp[7].setAttribute("role", element.querySelectorAll("p")[5].innerText);
    inp[8].value = element.querySelectorAll("p")[3].innerText;
  };
  const positionDetailsView = (e) => {
    setSelectedPosition(e);
    setIsEdit(true);
  };
  const formatPostitionId = (orderId) => {
    return orderId ? `PID${orderId.toString().padStart(8, "0")}` : "---";
  };
  
  const columns = [
    {
      name: "",
      cell: (row) => (
        <div className="positions-button">
          <button role="info" className="modal-icon" onClick={() => positionDetailsView(row)}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            width={14}
            height={14}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 16.0001V12.0001M12 8.00008H12.01M3 7.94153V16.0586C3 16.4013 3 16.5726 3.05048 16.7254C3.09515 16.8606 3.16816 16.9847 3.26463 17.0893C3.37369 17.2077 3.52345 17.2909 3.82297 17.4573L11.223 21.5684C11.5066 21.726 11.6484 21.8047 11.7985 21.8356C11.9315 21.863 12.0685 21.863 12.2015 21.8356C12.3516 21.8047 12.4934 21.726 12.777 21.5684L20.177 17.4573C20.4766 17.2909 20.6263 17.2077 20.7354 17.0893C20.8318 16.9847 20.9049 16.8606 20.9495 16.7254C21 16.5726 21 16.4013 21 16.0586V7.94153C21 7.59889 21 7.42756 20.9495 7.27477C20.9049 7.13959 20.8318 7.01551 20.7354 6.91082C20.6263 6.79248 20.4766 6.70928 20.177 6.54288L12.777 2.43177C12.4934 2.27421 12.3516 2.19543 12.2015 2.16454C12.0685 2.13721 11.9315 2.13721 11.7985 2.16454C11.6484 2.19543 11.5066 2.27421 11.223 2.43177L3.82297 6.54288C3.52345 6.70928 3.37369 6.79248 3.26463 6.91082C3.16816 7.01551 3.09515 7.13959 3.05048 7.27477C3 7.42756 3 7.59889 3 7.94153Z"
              stroke="#c5c5c5"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          </button>
          {
          
          row.is_bot_trade == 1 ? '' :
          <button
            className="modal-icon"
            role="info"
            onClick={() => {
              showEditSltp();
              setSelectedPosition(row)
            }}
          >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            width={18}
            height={18}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M14.1395 12.0002C14.1395 13.1048 13.2664 14.0002 12.1895 14.0002C11.1125 14.0002 10.2395 13.1048 10.2395 12.0002C10.2395 10.8957 11.1125 10.0002 12.1895 10.0002C13.2664 10.0002 14.1395 10.8957 14.1395 12.0002Z"
              stroke="#c5c5c5"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M7.57381 18.1003L5.12169 12.8133C4.79277 12.2907 4.79277 11.6189 5.12169 11.0963L7.55821 5.89229C7.93118 5.32445 8.55898 4.98876 9.22644 5.00029H12.1895H15.1525C15.8199 4.98876 16.4477 5.32445 16.8207 5.89229L19.2524 11.0923C19.5813 11.6149 19.5813 12.2867 19.2524 12.8093L16.8051 18.1003C16.4324 18.674 15.8002 19.0133 15.1281 19.0003H9.24984C8.5781 19.013 7.94636 18.6737 7.57381 18.1003Z"
              stroke="#c5c5c5"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          </button>
          }
        </div>
      ),
      ignoreRowClick: true,
      nonSortable: true,
      grow: 1,
      minWidth : '50px',
      wrap:true,
    },
  
    {
      name: "ID",
      selector: (row) => formatPostitionId(row.position_id),
      // grow:2,
      fixed: true,
      minWidth: '74px',
      wrap:true
    }, 
    {
      name: "Created",
      selector: (row) =>
      formatDate(adjustDateTime(row.created_at,utcOffset)),
      // grow: 1,
      wrap:true
    },
    {
      name: "Symbol",
      selector: (row) => row.symbol,
      // grow:2,
      minWidth: '55px',
      wrap:true
    },
    {
      name: "Quantity",
      // selector: (row) => row.lot_step < 0 || !row.lot_step ?  formatDigitBasePrice(row.quantity, 7) : row.lot_step + " Lots",
      // selector: (row) => (row.lot_step == 0 || !row.lot_step) ? formatDigitBasePrice(row.quantity, 7) + " Units" : row.lot_step + " Lots",
      selector: (row) => formatDigitBasePrice(row.quantity, 7),
      // grow:2,
      minWidth: '65px',
      wrap:true
    },
    {
      name: "Direction",
      selector: (row) => row.direction,
      // width: deviceType === 'mobile' ? "15%" : deviceType === 'tablet' ? '7%': deviceType === 'laptop' ? '15%' : '7%',
      minWidth: '60px',
      wrap:true
    },
    {
      name: "Margin",
      selector: (row) => formatDigitBasePrice(row.margin, 7),
      // width: deviceType === 'mobile' ? "15%" : deviceType === 'tablet' ? '7%': deviceType === 'laptop' ? '12%' : '8%',
      minWidth: '60px',
      wrap:true
    },
    {
      name: "Entry",
      selector: (row) => row.entry_price,
      // width: deviceType === 'mobile' ? "15%" : deviceType === 'tablet' ? '7%': deviceType === 'laptop' ? '12%' : '8%',
      minWidth: '60px',
      wrap:true
    },
    {
      name: "Current",
      selector: (row) => row?.current_price||"-",
      // width:'10%',
      // minWidth:'50px !important',
      wrap:true
    },
    {
      name: "PNL",
      selector: (row) => (
        <span style={{
          color: row?.pnl >= 0 || !row?.pnl?.toString().includes('-') 
            ? selectedStyle.buyColor 
            : selectedStyle.sellColor
        }}>
          {row?.pnl}
        </span>
      ),
      grow: 1,
      minWidth: '60px',
      wrap: true
    },
    {
      name: "S/L",
      selector: (row) => row.is_bot_trade == 1 ? '--' : String(row.SL) !== '' ? formatDigitBasePrice(row.SL, 7) : '--',
      // width: deviceType === 'mobile' ? "15%" : deviceType === 'tablet' ? '7%': deviceType === 'laptop' ? '12%' : '8%',
      minWidth: '55px',
      wrap:true
    },
    {
      name: "T/P",
      selector: (row) => row.is_bot_trade == 1 ? '--' : String(row.TP) !== '' ? formatDigitBasePrice(row.TP, 7) : '--',
      // width: deviceType === 'mobile' ? "15%" : deviceType === 'tablet' ? '7%': deviceType === 'laptop' ? '12%' : '8%',
      minWidth: '55px',
      wrap:true
    },
    {
      name:(
          <button
            className="Close-button"
            disabled={openPositions.every(item => item.pnl == '-' || item.current_price == '-'|| item.pnl == null ||item.current_price == null ||((symbolData[item.symbol] && symbolData[item.symbol].is_session_active === 0))) || platFromData[3]?.keepPrevData || platFromData[5]?.accessRight == 3|| localStorage.getItem('accountType') =="0"}
            onClick={(e) => clearPopup(e,"close all positions")}
            data-platformdata={platFromData[3]?.keepPrevData}
          >
            {isClosingAllPositions ? 'Closing...' : 'Close All'}
          </button>
        ),
      cell: (position) => (
        position.is_bot_trade === 1 ? (
          <FaRobot style={{height: '1rem', width: '1rem'}} />
        ) :
        <div className="positions-close-button">
          <button
            title={
              !symbolData[position.symbol] 
                ? "This symbol is disabled"
                // :
                // platFromData[5]?.accessRight == 3
                // ? "Trading for this Account in Disabled"
                : symbolData[position.symbol]?.is_session_active === 0 
                  ? "Market for this symbol is closed" 
                  : ""
            }           
            disabled={
              platFromData[5]?.accessRight == 3|| localStorage.getItem('accountType') =="0" || position.pnl == null ||selPositionId.includes(position.position_id) || position.current_price == null || platFromData[3]?.keepPrevData || isClosingPosition || 
              (symbolData[position.symbol] && symbolData[position.symbol].is_session_active === 0)
            }

            className="close-icon"
            onClick={(e) => {
              setSelPositionId([...selPositionId, position.position_id]);
              closePosition(
                user.userId,
                position,
                position?.direction === "Buy" ? position?.bid_price : position?.ask_price,
                position?.direction
              );
            }
            }
          >
            <FaTimes />
          </button>
        </div>
      ),
      // width: deviceType === 'mobile' ? "15%" : deviceType === 'tablet' ? '8%': deviceType === 'laptop' ? '12%' : '10%',
      minWidth: '60px',
      wrap:true,
    },
  ];
  createTheme(
    "solarized",
    {
      text: {
        primary: "#c5c5c5",
      },
      background: {
        default: "#2d2d2d",
      },
      context: {
        background: "#2d2d2d",
        text: "#c5c5c5",
      },
    },
    "dark"
  ); 
  const customStyles = {
    headCells: {
      style: {
        paddingLeft:'13px !important',
        justifyContent: 'flex-start !important',
      },
    },
    cells: {
      style: {
        paddingLeft:'13px !important',
        justifyContent: 'flex-start !important',
        cursor: `${!mobileMode ? isSymbolSelecting ? 'wait' : 'pointer' : ''}`,
      },
    },
    pagination: {
      style: {
        // width: '100vw',
        minHeight: '30px',
        height: '30px'
      },
    },
    headRow: {
      style: {
        minHeight: '10px',
        height: '30px'
      },
      denseStyle: {
        minHeight: '10px',
        height: '30px'
      },
    },
  };
  const conditionalRowStyles = [
    {
      when: row => row.is_bot_trade === 1,
      style: {
        backgroundColor: '#3b3a3a',
        color: 'white',
      },
    },
  ];
  const paginationComponentOptions = {
    noRowsPerPage: true,
  };
  return (
    <>
      {/* <div className="new-position-popup">
        <MarketOrder />
      </div> */}
        {isEdit && (
        <div className="wm-parent">
          <div
            className="window-module"
            style={{ position: "fixed", top: "25%" , zIndex:999 }}
          >
            <div className="wm-header">
              <h2 className="wmTitleDynamic">
                Position Info: PID{selectedPosition?.position_id ? selectedPosition.position_id.toString().padStart(8, "0") : "---"}
              </h2>
              <div
                className="wm-exit close-icon"
                onClick={() => {
                  setIsEdit(false);
                }}
              >
                <FaTimes />
              </div>
            </div>
            <div className="wm-content">
              <div className="content-wm-title">
                <h1 className="wmTitleDynamic"></h1>
              </div>
              <div className="input-content-wm">
                <div className="row">
                  <div className="wm-read-p-in mx">
                    <p>Position ID Information</p>
                    <input
                      type="text"
                      readonly=""
                      value={`PID${selectedPosition?.position_id ? selectedPosition.position_id.toString().padStart(8, "0") : "---"}`}
                    />
                  </div>
                </div>
              </div>
              <div className="input-content-wm">
                <div className="row">
                  <div className="wm-read-p-in">
                    <p>Margin</p>
                    <input
                      type="text"
                      readOnly
                      value={parseFloat(selectedPosition.margin).toFixed(4)}
                    />
                  </div>
                  <div className="wm-read-p-in">
                    <p>Entry</p>
                    <input
                      type="text"
                      readOnly
                      value={parseFloat(selectedPosition.entry_price)
          }
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="wm-read-p-in">
                    <p>Current</p>
                    <input
                      type="text"
                      readOnly
                      value={selectedPosition?.current_price}
                    />
                  </div>
                  <div className="wm-read-p-in">
                    <p>PNL</p>
                    <input
                      type="text"
                      readOnly
                      value={selectedPosition?.pnl}
                    />
                  </div>
                </div>
                <div className={`icon`}>
                  <div className="wm-read-p-in-start"  onClick={handlePositionModal}>
                    <span className="text">Position Details
                      
                    </span>
                    <div className="icon-background">

                    <FaArrowUpRightFromSquare size={15} color="#ffffff"/>
                    </div>
                  </div>
                    {showDealsModal && <PositionEvent positionInfo={positionDealsInfo}/>}
                </div>
              </div>
              <div className="input-content-wm">
                <div className="row">
                  <div className="wm-read-p-in mx">
                    <p>Created Date and Time</p>
                    <input
                      type="text"
                      readOnly
                      value={`${new Date(
                        selectedPosition.created_at
                      ).toLocaleDateString("en-GB")}, ${new Date(
                        selectedPosition.created_at
                      ).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}`}
                    />
                  </div>
                </div>
              </div>
              <div className="input-content-wm">
                <div className="row">
                  <div className="wm-read-p-in">
                    <p>Quantity</p>
                    <input
                      type="text"
                      readOnly
                      value={parseFloat(selectedPosition.quantity).toFixed(4)}
                    />
                  </div>
                  <div className="wm-read-p-in">
                    <p>Direction</p>
                    <input
                      type="text"
                      readOnly
                      value={selectedPosition.direction}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="wm-read-p-in mx">
                    <p>Symbol Name</p>
                    <input
                      type="text"
                      readOnly
                      value={selectedPosition.symbol}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="confirm-box" role={clearWindow}>
        <div className="card">
          <h2>Are you sure you want to {popupTitle} forever all at once?</h2>
          <div className="row-scss">
            <button
              onClick={(e) => {
                setClearWindow("false");
              }}
              style={{
                position: 'relative',
                overflow: 'hidden',
                isolation: 'isolate',
                backgroundColor: selectedStyle.buyColor,
              }}
            >
              <Ripple />
              Cancel
            </button>
            <div className="blank"></div>
            <button
              onClick={(e) => {
                popupAction(e);
              }}
              style={{
                position: 'relative',
                overflow: 'hidden',
                isolation: 'isolate',
                backgroundColor: selectedStyle.sellColor,
              }}
            >
              <Ripple />
              Confirm
            </button>
          </div>
        </div>
      </div>

      {/* Edit SLTP MODAL  */}
      {/* <EditSltp/> */}
      {isEditSltpVisible && <EditSltp  onCancel={hideEditSltp} editPositionId={selectedPosition.position_id} currentPrice={openPositions.find(
        (pos) => pos.symbol === selectedPosition.symbol && pos.position_id === selectedPosition.position_id
      )
      } />}

      <div className="tabs-section-acc global-platfrom">
        <div className="tabs-acc">
          <button
            className={`tab-button-acc ${activeTab === "open-positions-acc" ? "tab-active-acc" : ""
              }`}
            onClick={(e) => {
              handleTabClick("open-positions-acc");
              // mkRipple(e);
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
            }}
            data-tab="open-positions-acc"
          >
            <Ripple />
            Positions <span id="countPositions">{filteredData.length}</span>
          </button>
          <button
            className={`tab-button-acc ${activeTab === "open-orders-acc" ? "tab-active-acc" : ""
              }`}
            onClick={(e) => {
              handleTabClick("open-orders-acc");
              // mkRipple(e);
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
            }}
            data-tab="open-orders-acc"
          >
            <Ripple />
            Orders <span id="countOrders">{openOrdersCountD}</span>
          </button>
          <button
            className={`tab-button-acc ${activeTab === "history-acc" ? "tab-active-acc" : ""
              }`}
            onClick={(e) => {
              handleTabClick("history-acc");
              // mkRipple(e);
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
            }}
            data-tab="history-acc"
          >
            <Ripple />
            Position History{" "}
            <span id="countHistory">{positionHistoryCount}</span>
          </button>
          <button
            className={`tab-button-acc ${activeTab === "history-orders" ? "tab-active-acc" : ""
              }`}
            onClick={(e) => {
              handleTabClick("history-orders");
              // mkRipple(e);
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
            }}
            data-tab="history-orders"
          >
            <Ripple />
            Orders History{" "}
            <span id="countOrdersHistory">{orderHistoryCount}</span>
          </button>
          {
            totalBotPositionHistoryCount > 0 && (
          <button
            className={`tab-button-acc ${activeTab === "bot-positions-history" ? "tab-active-acc" : ""
              }`}
            onClick={(e) => {
              handleTabClick("bot-positions-history");
              // mkRipple(e);
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
            }}
            data-tab="history-orders"
          >
            <Ripple />
            Bot Positions History{" "}
            <span>{botPositionHistoryCount}</span>
          </button>
          )}
          {/* <button
            className={`tab-button-acc ${activeTab === "account-history-acc" ? "tab-active-acc" : ""
              }`}
            onClick={(e) => {
              handleTabClick("account-history-acc");
              // mkRipple(e);
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
            }}
            data-tab="account-history-acc"
          >
            <Ripple />
            Account History <span id="countAccountHistory">0</span>
          </button> */}
        </div>
        <div
          className={`tab-content-acc ${activeTab === "open-positions-acc" ? "tab-content-active-acc" : ""
            }`}
          id="open-positions-acc"
        >
          <div className="pos-section">
            {/* <Positions /> */}
            <div className="open-positions-table bottom-table-bstorm"  style={{ overflowY: "auto" }} >
            {/* , position: "absolute", zIndex: 0 */}
            <div className="positions-button" style={{justifyContent: 'space-between'}}>
          <div className="input-text">
            <input
              type="text"
              value={filterText}
              onChange={handleFilter}
              placeholder="Search Symbol.."
            />
            <div className="input-svg" id="searchSvgColor">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="11"
                fill="currentColor"
                className="bi bi-search"
                viewBox="0 0 16 16"
              >
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
              </svg>
            </div>
          </div>
          
          <div
            className={`flex-tag ${botFilter === 'all' ? '' : 'disabled'}}`}
          >
            <div className="span-tag">
              <span>Positions:</span>
            </div>
            <div className="bot-trade-options">
              <span>
                <input
                  type="radio"
                  name="borTrade"
                  value="all"
                  id="allBotTradee"
                  checked={botFilter === "all"}
                  onChange={() => handleBotFilterChange('all')}
                />
                <label htmlFor="allBotTradee">
                  All
                </label>
              </span>
              <span>
                <input
                  type="radio"
                  name="borTrade"
                  value="isBot"
                  id="isBot"
                  checked={botFilter === 'isBot'}
                  onChange={() => handleBotFilterChange('isBot')}
                />
                <label htmlFor="isBot">
                  Bot Only
                </label>
              </span>
              <span>
                <input
                  type="radio"
                  name="borTrade"
                  value="nonBot"
                  id="nonBot"
                  checked={botFilter === 'nonBot'}
                  onChange={() => handleBotFilterChange('nonBot')}
                />
                <label htmlFor="nonBot">
                  Non-Bot Only
                </label>
              </span>
            </div>
          </div>

          <div>
            <Select
              options={options}
              value={options.find((option) => option.value === direction)} // Sets the selected value
              onChange={handleSelectChange}
              styles={customStyle}
              menuPortalTarget={document.body}
              isSearchable={false}

            />
          </div>
            </div>
              <DataTable
              columns={columns}
              data={filteredData}
              persistTableHead
              fixedHeader={true}
              pagination
              theme="solarized"
              customStyles={customStyles}
              conditionalRowStyles={conditionalRowStyles}
              paginationComponentOptions={paginationComponentOptions}
              onRowDoubleClicked={handleRowClick}
            />
           
            </div>
          </div>
        </div>
        <div
          className={`tab-content-acc ${activeTab === "open-orders-acc" ? "tab-content-active-acc" : ""
            }`}
          id="open-orders-acc"
        >
          {/* Orders content will be added here */}
          <div className="pos-section">

            <Orders openOrders={openOrders}  handleOpenOrdersUpdate={handleOpenOrdersDesktop} handleRowClick={handleRowClick} isSymbolSelecting={isSymbolSelecting} mobileMode={mobileMode} />
          </div>
        </div>
        <div
          className={`tab-content-acc ${activeTab === "history-acc" ? "tab-content-active-acc" : ""
            }`}
          id="history-acc"
        >
         {!mobileMode && <PositionHistory name={"positionHistory"} handleRowClick={handleRowClick} />}
        </div>
        <div
          className={`tab-content-acc ${activeTab === "history-orders" ? "tab-content-active-acc" : ""
            }`}
          id="history-orders"
        >
          <OrderHistory name={"orderHistory"} handleRowClick={handleRowClick} isSymbolSelecting={isSymbolSelecting} mobileMode={mobileMode} />
        </div>
        <div
          className={`tab-content-acc ${activeTab === "bot-positions-history" ? "tab-content-active-acc" : ""
            }`}
          id="history-orders"
        >
         {!mobileMode && <BotPositionHistory name={"position-history-bot"} handleRowClick={handleRowClick} isSymbolSelecting={isSymbolSelecting} mobileMode={mobileMode} />}
         </div>
        <div
          className={`tab-content-acc ${activeTab === "account-history-acc" ? "tab-content-active-acc" : ""
            }`}
          id="account-history-acc"
        >
          <div className="overflow-y-table-body">
            <br /><br /><br />
            <div className="f-center">
              <svg viewBox="0 0 86 59" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5 17.5H66M17.5 17.5L1 1M17.5 17.5L31 39L17.5 58.5M17.5 58.5H66M17.5 58.5L1 51.5L17.5 39L1 1M66 58.5L84 51.5L66 39L84 1M66 58.5L53.5 39L66 17.5M66 17.5L84 1M1 1H84" />
                <path d="M33 6L37.5 12.5M42.5 12.5V6M47.5 12.5L52.5 6" />
              </svg>
            </div>
          </div>
        </div>
        <hr />
        <div className="metric-parent global-platfrom1">
          {<MetricsPanel />}
        </div>
        <div className="metric-parent  global-platfrom2"  >
        <div className="metrics-panel global-platfrom-dd">
                  <div className="metrics-scroll-container">
                      <ul className="metrics-list">
                          <li className='metric-item'>
                          
                          </li>
                       
                      </ul>
                  </div>
              </div>
        </div>
      </div>

      {/* Just positions on mobile */}

      <div id="accountHistory" className="global-platfrom">
        <div
          className="tabs-ah-mb tabs-container-account-mb"
          draggable={false}
          ref={tabMenuRef}
        >
          <button
            className={`tab-button-mb ${
              activeHistoryTab === 0 ? 'active-tab-account-mb' : ''
            }`}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
            }}
            onClick={() => {
              selectTab(0);
            }}
          >
            <Ripple />
            Positions <span>{filteredData.length}</span>
            {
              activeHistoryTab === 0
              ? <div className="active-tab-mb" />
              : <div className="non-active-tab-mb" />
            }
          </button>
          <button
            className={`tab-button-mb ${
              activeHistoryTab === 1 ? 'active-tab-account-mb' : ''
            }`}
            onClick={() => {
              selectTab(1);
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
            }}
          >
            <Ripple />
            Positions History <span>{positionHistoryCount}</span>
            {
              activeHistoryTab === 1
              ? <div className="active-tab-mb" />
              : <div className="non-active-tab-mb" />
            }
          </button>
          <button
            className={`tab-button-mb ${
              activeHistoryTab === 2 ? 'active-tab-account-mb' : ''
            }`}
            onClick={() => {
              selectTab(2);
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
            }}
          >
            <Ripple />
            Orders <span>{openOrdersCountM}</span>
            {
              activeHistoryTab === 2
              ? <div className="active-tab-mb" />
              : <div className="non-active-tab-mb" />
            }
          </button>
          <button
            className={`tab-button-mb ${
              activeHistoryTab === 3 ? 'active-tab-account-mb' : ''
            }`}
            onClick={() => {
              selectTab(3);
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
            }}
          >
            <Ripple />
            Orders History <span>{orderHistoryCount}</span>
            {
              activeHistoryTab === 3
              ? <div className="active-tab-mb" />
              : <div className="non-active-tab-mb" />
            }
          </button>

          {
            totalBotPositionHistoryCount > 0 && (
              <button
                className={`tab-button-mb ${
                  activeHistoryTab === 4 ? "active-tab-account-mb" : ""
                }`}
                onClick={() => selectTab(4)}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  isolation: "isolate",
                }}
              >
                <Ripple />
                Bot Positions History{" "}
                <span>{botPositionHistoryCount}</span>
                {activeHistoryTab === 4 ? (
                  <div className="active-tab-mb" />
                ) : (
                  <div className="non-active-tab-mb" />
                )}
              </button>
            )
          }
          {/* <button
            className={`tab-button-mb ${
              activeHistoryTab === 4 ? 'active-tab-account-mb' : ''
            }`}
            onClick={() => {
              selectTab(4);
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
            }}
          >
            <Ripple />
            Account History <span>0</span>
            {
              activeHistoryTab === 4
              ? <div className="active-tab-mb" />
              : <div className="non-active-tab-mb" />
            }
          </button> */}
        </div>

        <div className="tabs-ah-mb-data" ref={tabXDataRef} >
          <div className={`data-x-atomic ${activeHistoryTab === 0 ? 'data-x-atomic-active' : ''}`}>
            <div className="positions-button" style={{justifyContent: 'space-between'}}>
              <div className="input-text">
                <input
                  type="text"
                  value={filterText}
                  onChange={handleFilter}
                  placeholder="Search Symbol.."
                />
                <div className="input-svg" id="searchSvgColor">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                  </svg>
                </div>
              </div>
              <Select
                options={options}
                value={options.find((option) => option.value === direction)}
                onChange={handleSelectChange}
                styles={customStyle}
                isSearchable={false}
                menuPortalTarget={document.body}
              />
            </div>
            <div className="mobile-positions-wrapper">
              {filteredData.length > 0 ? (
                <>
                  <MobilePositionsList positions={currentPositions} />
                  {filteredData.length > positionsPerPage && (
                    <div className="pagination-controls">
                      <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor"
                            viewBox="0 0 16 16">
                          <path d="M11.354 1.146a.5.5 0 0 1 0 .708L6.207 7l5.147 5.146a.5.5 0 0 1-.708.708l-5.5-5.5a.5.5 0 0 1 0-.708l5.5-5.5a.5.5 0 0 1 .708 0z"/>
                          <path d="M7.354 1.146a.5.5 0 0 1 0 .708L2.207 7l5.147 5.146a.5.5 0 0 1-.708.708l-5.5-5.5a.5.5 0 0 1 0-.708l5.5-5.5a.5.5 0 0 1 .708 0z"/>
                        </svg>
                      </button>
                    
                      <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor"
                            viewBox="0 0 16 16">
                          <path d="M11.354 1.146a.5.5 0 0 1 0 .708L6.207 7l5.147 5.146a.5.5 0 0 1-.708.708l-5.5-5.5a.5.5 0 0 1 0-.708l5.5-5.5a.5.5 0 0 1 .708 0z"/>
                        </svg>
                      </button>
                    
                      <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor"
                            viewBox="0 0 16 16">
                          <path d="M4.646 1.146a.5.5 0 0 1 .708 0l5.5 5.5a.5.5 0 0 1 0 .708l-5.5 5.5a.5.5 0 1 1-.708-.708L9.793 7 4.646 1.854a.5.5 0 0 1 0-.708z"/>
                        </svg>
                      </button>
                    
                      <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor"
                            viewBox="0 0 16 16">
                          <path d="M4.646 1.146a.5.5 0 0 1 .708 0L10.5 6.293 5.354 11.44a.5.5 0 0 1-.708-.708L9.293 7 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                          <path d="M8.646 1.146a.5.5 0 0 1 .708 0L14.5 6.293 9.354 11.44a.5.5 0 1 1-.708-.708L13.293 7 8.646 2.354a.5.5 0 0 1 0-.708z"/>
                        </svg>
                      </button>
                    </div>                  
                  )}
                </>
              ) : ( 
                <div className="no-positions">No open positions</div>
              )}
            </div>
          </div>
          <div className={`data-x-atomic ${activeHistoryTab === 1 ? 'data-x-atomic-active' : ''}`}>
            <div className="mob-position-tab">
              {mobileMode && <PositionHistory name={"position-history"}/>}
            </div>
          </div>
          <div className={`data-x-atomic ${activeHistoryTab === 2 ? 'data-x-atomic-active' : ''}`}>
            <div className="mob-position-tab" ref={ordersDivRef}>
              <Orders
                openOrders={openOrders}
                currTab={currTab}
                parentRef={ordersDivRef}
                handleOpenOrdersUpdate={handleOpenOrdersMobile}
                />
            </div>
          </div>
          <div className={`data-x-atomic ${activeHistoryTab === 3 ? 'data-x-atomic-active' : ''}`}>
            <div className="mob-position-tab" ref={orderHistoryDivRef}>
              <OrderHistory
                name={'order-history'}
                currTab={currTab}
                parentRef={orderHistoryDivRef}
              />
            </div>
          </div>
          <div className={`data-x-atomic ${activeHistoryTab === 4 ? 'data-x-atomic-active' : ''}`}>
            <div className="mob-position-tab">
              {mobileMode && <BotPositionHistory name={"positionHistoryBot"} handleRowClick={handleRowClick} isSymbolSelecting={isSymbolSelecting} mobileMode={mobileMode}/>}
            </div>
          </div>
          <div className={`data-x-atomic ${activeHistoryTab === 5 ? 'data-x-atomic-active' : ''}`}>
            <div className="f-center">
              <svg viewBox="0 0 86 59" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5 17.5H66M17.5 17.5L1 1M17.5 17.5L31 39L17.5 58.5M17.5 58.5H66M17.5 58.5L1 51.5L17.5 39L1 1M66 58.5L84 51.5L66 39L84 1M66 58.5L53.5 39L66 17.5M66 17.5L84 1M1 1H84" />
                <path d="M33 6L37.5 12.5M42.5 12.5V6M47.5 12.5L52.5 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountManager;

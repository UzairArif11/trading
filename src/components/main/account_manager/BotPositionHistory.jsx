import React, { useEffect, useState } from "react";
import DataTable , { createTheme } from "react-data-table-component";
import APIMiddleware from "../../../data/api/Api-Middleware.js";
import { API_ENDPOINT_All_CLOSED_POSITIONS , API_ENDPOINT_GET_ALL_CLOSED_POSITIONS_AND_SAVE } from "../../../data/Endpoints-API.js";
import { useAuthContext } from "../../../contexts/Auth-Context.js";
import { useChartContext } from "../../../contexts/Chart-Context.js";
import { adjustDateTime, formatDate, formatDigitBasePrice } from "../../../utils/format.js";
import './Positions.css'
import { TbInfoHexagon } from "react-icons/tb";
import { FaRobot, FaSync } from "react-icons/fa";
import { useAccountManagerContext } from "../../../contexts/Account-Manager-Context.js";
import { useMetricsContext } from "../../../contexts/Metrics-Context.js";
import Select from 'react-select';
import { useSymbolContext } from "../../../contexts/Symbol-Context.js";
import { toast } from "react-toastify";


const BotPositionHistory = ({name, handleRowClick, isSymbolSelecting}) => {
  const botPositonHistoryDivRef = React.useRef(null);
  const { user, platFromData } = useAuthContext();
  const { setClickedPosition,symbolData } = useSymbolContext();
  const { utcOffset } =  useMetricsContext();
  const { selectedStyle, setSelectedStyle, styleOptions,} = useChartContext();
  const [radioChecked, setRadioChecked] = useState(true);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [selectDisabled2, setSelectDisabled2] = useState(false);
  const [selectDisabled, setSelectDisabled] = useState(false);
  const [symbolOrId, setSymbolOrId] = useState("");
  const [radioChecked2, setRadioChecked2] = useState(true);
  const [filter, setFilter] = useState("");
  const [botFilter, setBotFilter] = useState("isBot");
  const [selectedOrderDate, setselectedOrderDate] = useState("all");
  const [search, setSearch] = useState("");
  const [mobileMode, setMobileMode] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const { setPositionHistoryCount,isClosingAllPositions, closedPositions, setClosedPositions, setClosedPositionLength , positionHistoryCount , setClosedPositionsAll, setBotPositionHistoryCount, setTotalBotPositionHistoryCount  } = useAccountManagerContext()
  const [isCustomRangeSelected, setIsCustomRangeSelected] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [isRefreshed, setIsRefreshed] = useState(false);
    const [isBotPositionClosed, setIsBotPositionClosed] = useState(false);
  const [orderDate, setOrderDate] = useState({
    startDate: "2000-01-01 00:00:00",
    endDate: getTodaysEnd(),
  });
  const [datePickar, setDatePickar] = useState({
    startDate: '2000-01-01 00:00:00',
    endDate: getTodaysEnd(),
  });

  useEffect(() => {
    const handleResize = () => {
      if(window.innerWidth <= 786){
        setMobileMode(true);
        setPageSize(8);
      }
      else{
        setMobileMode(false);
        setPageSize(10);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, []);

  createTheme('solarized', {
    text: {
      primary: '#c5c5c5',
    },
    background: {
      default: '#2d2d2d',
    },
    context: {
      background: '#2d2d2d',
      text: '#c5c5c5',
    }
  }, 'dark');
  function getTodaysEnd() {
    const today = new Date();
  
    // Set the time to the end of the day (23:59:59)
    today.setHours(23, 59, 59, 999); // Hours, minutes, seconds, milliseconds
  
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month (0-indexed) with leading zero
    const day = String(today.getDate()).padStart(2, '0');
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    const seconds = String(today.getSeconds()).padStart(2, '0');
  
    // Format the date and time in the desired format
    const formattedTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  
    return formattedTimestamp;
  }
  
  function convertDatetime(datetimeString) {
    // Parse the date string using a date object
    const date = new Date(datetimeString);
  
    // Get year, month (0-indexed), day, hours, minutes, and seconds
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Add leading zero for single-digit months
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
  
    // Format the date in the desired format
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  
    return formattedDate;
  }


  const handleRowTheClick = (row) => {
    const clickedData = {
      id: row.position_id,
      symbol: row.symbol,
      openedAt: row.position_opened_at, 
      direction: row.direction,
      closedAt: row.created_at,
    };
  
    console.log("Clicked Position Data:", clickedData);
  
    setClickedPosition(clickedData); 
  };
  

  // Pagination - calc no. of rows based of parent height
  const currTab = document.body.getAttribute('mobileCurrentView');
  // useEffect(() => {
  //   const calculateRowsPerPage = () => {
  //     if (botPositonHistoryDivRef?.current) {
  //       const divHeight = botPositonHistoryDivRef.current.clientHeight;
  //       const rowHeight = 35;
  //       let rows;
  //       if (window.innerHeight < 960) {
  //         rows = Math.floor((divHeight * 0.7) / rowHeight);
  //       } else {
  //         rows = Math.floor((divHeight * 0.9) / rowHeight);
  //       }
  //       setPageSize(Math.max(8, rows));
  //     } else {
  //       setPageSize(8); 
  //     }
  //   };
  //   if (currTab === 'history') calculateRowsPerPage();
  // }, [currTab]);


  const fetchData = async () => {
    var startDate = convertDatetime(orderDate.startDate);
    var endDate = convertDatetime(orderDate.endDate);
    if(isCustomRangeSelected){
      startDate = convertDatetime(datePickar.startDate);
      endDate = convertDatetime(datePickar.endDate);
    }
    try {
      const response = await APIMiddleware.get(
        API_ENDPOINT_All_CLOSED_POSITIONS(
          user.userId,
          currentPage,
          pageSize,
          search,
          startDate,
          endDate,
          botFilter
        )
      );
      setData(response.data);
      setClosedPositions(response.data);
      setTotal(response.total);
      setClosedPositionLength(response.total)
      // setPositionHistoryCount(response.total)
      setBotPositionHistoryCount(response.total)
      setTotalBotPositionHistoryCount(response.totalBotPositions)
      setIsRefreshed(false);
      setIsBotPositionClosed(false);
    } catch (error) {
      setIsRefreshed(false);
      setIsBotPositionClosed(false);
      console.error(error);
    }
  };

  useEffect(() => {
    
    
    if(isRefreshed){
      console.log("1", currentPage, pageSize, filter, search, orderDate,datePickar,isCustomRangeSelected, botFilter, isRefreshed);
      fetchData();
    }
  }, [isRefreshed]);
  useEffect(() => {
    
    if (!isRefreshed) {
      fetchData();
      console.log("2", currentPage, pageSize, filter, search, orderDate,datePickar,isCustomRangeSelected, botFilter, isRefreshed);
    }

  }, [currentPage, pageSize, filter, search, orderDate,datePickar,isCustomRangeSelected, botFilter]);

  useEffect(() => {
    setIsBotPositionClosed(true);
  }, [platFromData[3]?.botClosedPositions]);
  
  const positionDetails = (e) => {
    setSelectedPosition(e);
    console.log(selectedPosition,"selectedPosition")
    setIsEdit(true);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (value) => {
    setFilter(value);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value); // Update search state
  };
  const formatPositionHistoryId = (orderId) => {
    return orderId ? `PID${orderId.toString().padStart(8, "0")}` : "---";
  };

  const MobileBotPositionHistoryRow = ({ botPosition, isExpanded, onToggle, name }) => {
    return (
      <div className={`mobile-position-row ${isExpanded ? 'expanded' : ''}`}>
        <div onClick={onToggle}>
          <div className="main-row">
            <div className="left-section">
              <div className="symbol-direction">
                <span className="symbol-name">{botPosition.symbol}</span>
                <span
                  style={{
                    color:
                      botPosition.direction?.toLowerCase() === 'buy'
                        ? selectedStyle.buyColor
                        : selectedStyle.sellColor
                  }}
                >
                  {botPosition.direction}
                </span>
                <span className="quantity">{Number(botPosition.quantity).toFixed(3)}</span>
              </div>
              <div className="price-movement">
                {formatDigitBasePrice(botPosition.entry_price, 5)} → {formatDigitBasePrice(botPosition.exit_price, 5) || '-'}
              </div>
            </div>
            <div
              style={{
                color:
                  botPosition.realized_pnl >= 0
                    ? selectedStyle.buyColor
                    : selectedStyle.sellColor
              }}
            >
              {!isNaN(botPosition.realized_pnl)
                ? Number(botPosition.realized_pnl).toFixed(2)
                : '---'}
            </div>
          </div>
          
          {isExpanded && (
            <div className="expanded-section">
              <div className="row">
                <div className="half-row">
                  <span className="label-open-time">{formatDate(adjustDateTime(botPosition.position_opened_at, utcOffset))}</span>
                </div>
                <div className="half-row">
                  <span className="label-close-time">{formatDate(adjustDateTime(botPosition.created_at, utcOffset))}</span>
                </div>
              </div>
            
              <div className="row">
                <div className="half-row">
                  <span className="label">Margin:</span>
                  <span className="value">{formatDigitBasePrice(botPosition.margin, 7)}</span>
                </div>
                <div className="half-row">
                  <span className="label">ID:</span>
                  <span className="value">{`PID${botPosition.id.toString().padStart(8, "0")}`}</span>
                </div>
              </div>
            </div>          
          )}
        </div>
      </div>
    );
  };

  const MobileBotPositionHistoryList = ({ botPositions, name }) => {
    
    const toggleRow = (id) => {
      setExpandedRows(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    };    
  
    return (
      <div className="mobile-positions-container">
        {botPositions.map(botPosition => (
          <MobileBotPositionHistoryRow
            name={name}
            key={`botPosition-${botPosition.id}`}
            botPosition={botPosition}
            isExpanded={expandedRows[botPosition.id]}
            onToggle={() => toggleRow(botPosition.id)}
          />
        ))}
      </div>
    );
  };

  const columns = [
    {
      name:(
  <>
    {isBotPositionClosed && (
      <FaSync style={{ height: '1rem', width: '1rem', cursor: "pointer" }} onClick={() => setIsRefreshed(true)} />
    )}
  </>

      ),
      cell: (row) => (
        <div className="positions-button">
          <button role="info" className="modal-icon">
          <TbInfoHexagon onClick={() => {
                positionDetails(row);
              }} style={{height: '1rem', width: '1rem'}}/>
          </button>
      {
      row.is_bot_trade === 1 ? (
        <FaRobot style={{height: '1rem', width: '1rem'}} />
      ) : ""}
        </div>
      ),
      ignoreRowClick: true,
      nonSortable: true,
    },

  
    {
      name: "ID",
      selector: (row) => formatPositionHistoryId(row.id),
      minWidth: '80px'
    },
    {
      name: "Opened At",
      selector: (row) =>
          formatDate(adjustDateTime(row.position_opened_at,utcOffset))
    },
    {
      name: "Closed At",
      selector: (row) =>
          formatDate(adjustDateTime(row.created_at,utcOffset))
    },
    {
      name: "Symbol",
      selector: (row) => row.symbol,
    },
    {
      name: "Quantity",
      selector: (row) => formatDigitBasePrice(row.quantity, 7)
    },
    {
      name: "Direction",
      selector: (row) => row.direction,
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
      selector: (row) => parseFloat(row.entry_price),
    },
    {
      name: "Exit",
      selector: (row) => parseFloat(row.exit_price),
    },
    {
      name: "PNL",
      selector: (row) => {
        const pnlValue = parseFloat(row.realized_pnl);
        const color = pnlValue > 0 ? selectedStyle.buyColor : pnlValue < 0 ? selectedStyle.sellColor : 'white';

        return (
          <span style={{ color }}>
            {pnlValue.toFixed(2)}
          </span>
        );
      },
    }
    
  ];

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

  const paginationComponentOptions = {
    noRowsPerPage: true,
  };
  const handleFirstDivClick2 = () => {
    setRadioChecked2(true);
    setSelectDisabled2(false); // Ensure select is enabled when clicking on the first div
    setIsCustomRangeSelected(false)
  };
  const handleFirstDivClick = () => {
    setRadioChecked(true);
    setSelectDisabled(false); // Ensure select is enabled when clicking on the first div
  };
  const customStyle = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '27px !important',
      width: '150px',
      borderColor: '#484848 !important',
      backgroundColor: '#2d2d2d  !important',
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
  const options = [
    { value: "Today", label: "Today" },
    { value: "Yesterday", label: "Yesterday" },
    { value: "CurrentWeek", label: "Current Week" },
    { value: "CurrentMonth", label: "Current Month" },
    { value: "PreviousMonth", label: "Previous Month" },
    { value: "LastThreeMonth", label: "Last Three Month" },
    { value: "Last6Month", label: "Last 6 Month" },
    { value: "all", label: "All History" },
  ];
  const [selectedOption, setSelectedOption] = useState({
    value: "all",
    label: "All History",
  });

  const changehandlefunction = (selectedOption) => {
    console.log("dsfjkl");
    
    const value = selectedOption.value;
  
    if (value === "Today") {
      const today = new Date();
  
      const startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
  
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
  
      const dateobj = { startDate, endDate };
      setOrderDate(dateobj);
    } else if (value === "Yesterday") {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
  
      const startDate = new Date(yesterday);
      startDate.setHours(0, 0, 0, 0);
  
      const endDate = new Date(yesterday);
      endDate.setHours(23, 59, 59, 999);
  
      const dateobj = { startDate, endDate };
      setOrderDate(dateobj);
    } else if (value === "CurrentWeek") {
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  
      startOfWeek.setHours(0, 0, 0, 0);
      endOfWeek.setHours(23, 59, 59, 999);
  
      const dateobj = { startDate: startOfWeek, endDate: endOfWeek };
      setOrderDate(dateobj);
    } else if (value === "CurrentMonth") {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
      firstDayOfMonth.setHours(0, 0, 0, 0);
      lastDayOfMonth.setHours(23, 59, 59, 999);
  
      const dateobj = { startDate: firstDayOfMonth, endDate: lastDayOfMonth };
      setOrderDate(dateobj);
    } else if (value === "PreviousMonth") {
      const today = new Date();
      const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayOfPreviousMonth = new Date(firstDayOfCurrentMonth);
      firstDayOfPreviousMonth.setMonth(firstDayOfPreviousMonth.getMonth() - 1);
  
      const lastDayOfPreviousMonth = new Date(firstDayOfCurrentMonth);
      lastDayOfPreviousMonth.setDate(0);
  
      firstDayOfPreviousMonth.setHours(0, 0, 0, 0);
      lastDayOfPreviousMonth.setHours(23, 59, 59, 999);
  
      const dateobj = { startDate: firstDayOfPreviousMonth, endDate: lastDayOfPreviousMonth };
      setOrderDate(dateobj);
    } else if (value === "LastThreeMonth") {
      const today = new Date();
      const firstDateThreeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      const lastDateCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
      firstDateThreeMonthsAgo.setHours(0, 0, 0, 0);
      lastDateCurrentMonth.setHours(23, 59, 59, 999);
  
      const dateobj = { startDate: firstDateThreeMonthsAgo, endDate: lastDateCurrentMonth };
      setOrderDate(dateobj);
    } else if (value === "Last6Month") {
      const today = new Date();
      const firstDateSixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      const lastDateCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
      firstDateSixMonthsAgo.setHours(0, 0, 0, 0);
      lastDateCurrentMonth.setHours(23, 59, 59, 999);
  
      const dateobj = { startDate: firstDateSixMonthsAgo, endDate: lastDateCurrentMonth };
      setOrderDate(dateobj);
    } else if (value === "all") {
      const dateobj = {
        startDate: new Date("2000-01-01T00:00:00"),
        endDate: new Date(),
      };
      setOrderDate(dateobj);
    } else {
      const dateobj = {
        startDate: new Date("2000-01-01T00:00:00"),
        endDate: new Date(),
      };
      setOrderDate(dateobj);
    }
  };
  const handleChange = (selectedOption) => {
    setSelectedOption(selectedOption);
    changehandlefunction({ target: { value: selectedOption.value } });
  };
  
  const handleSecondDivClick2 = () => {
    setRadioChecked2(false);
    setSelectDisabled2(true); // Disable select when clicking on the second div
    setIsCustomRangeSelected(true)
  };
  const handleDateInputClick = (event) => {
    event.stopPropagation(); // Prevent event propagation to avoid affecting div clicks
  };
  const datePickarFunction = (event, key) => {
    const newDate = new Date(event.target.value);
    if (key === "endDate") {
      newDate.setHours(23, 59, 59, 999);
    } else if (key === "startDate") {
      newDate.setHours(0, 0, 0, 0);
    }
    setDatePickar((prev) => ({ ...prev, [key]: newDate }));
  };
  return (
    <div className="history-section">
      <div className="bottom-table-bstorm">
        <div className="positions-button" style={{flexWrap:"wrap", gap: "5px", paddingTop: "3px !important"}}>
          <div className="input-text">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
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
            className={`flex-tag ${radioChecked2 ? "" : "disabled"}`}
            id="flex-tag1"
            onClick={handleFirstDivClick2}
          >
            <div className="span-tag">
              <span>Periods:</span>
              <input
                type="radio"
                name={name}
                checked={radioChecked2}
                onChange={() => setRadioChecked2(true)}
              />
            </div>
            <Select
              options={options}
              // value={selectedOption}
              onChange={changehandlefunction}
              isDisabled={selectDisabled2}
              styles={customStyle}
              isSearchable={false}
              menuPortalTarget={document.body}    
            />
          </div>
          {/* <div
            className={`flex-tag ${true ? "" : "disabled"}`}
          >
            <div className="span-tag">
              <span>Positions:</span>
            </div>
            <div className="bot-trade-options">
              <span>
                <input
                  type="radio"
                  name="isBotTrade"
                  value="all"
                  id="allBotTrade"
                  checked={botFilter === "all"}
                  onChange={() => setBotFilter('all')}
                />
                <label htmlFor="allBotTrade">
                  All
                </label>
              </span>
              <span>
                <input
                  type="radio"
                  name="isBotTrade"
                  value="isBot"
                  id="isBot"
                  checked={botFilter === 'isBot'}
                  onChange={() => setBotFilter('isBot')}
                />
                <label htmlFor="isBot">
                  Bot Only
                </label>
              </span>
              <span>
                <input
                  type="radio"
                  name="isBotTrade"
                  value="nonBot"
                  id="nonBot"
                  checked={botFilter === 'nonBot'}
                  onChange={() => setBotFilter('nonBot')}
                />
                <label htmlFor="nonBot">
                  Non-Bot Only
                </label>
              </span>
            </div>
          </div> */}
          
          <div
            className={`flex-tag ${!radioChecked2 ? "" : "disabled"}`}
            onClick={handleSecondDivClick2}
          >
            <div className="span-tag">
              <span>Periods:</span>
              <input
                type="radio"
                name={name}
                checked={!radioChecked2}
                onChange={() => setRadioChecked2(false)}
              />
            </div>
            <div className="date-time">
              <input
                type="date"
                name=""
                id=""
                disabled={radioChecked2}
                onClick={handleDateInputClick}
                onChange={(e) => datePickarFunction(e, "startDate")}
              />
              <span>---</span>
              <input
                type="date"
                name=""
                id=""
                disabled={radioChecked2}
                onClick={handleDateInputClick}
                onChange={(e) => datePickarFunction(e, "endDate")}
              />
            </div>
          </div>
        </div>
        {isEdit && (
        <div className="wm-parent">
          <div
            className="window-module"
            style={{ position: "fixed", top: "25%" }}
          >
            <div className="wm-header">
              <h2 className="wmTitleDynamic">
                Position Info: {selectedPosition?.position_id ? selectedPosition.position_id.toString().padStart(8, "0") : "---"}
              </h2>
              <div
                className="wm-exit"
                onClick={() => {
                  setIsEdit(false);
                }}
              >
                X
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
                      value={`${selectedPosition?.position_id ? selectedPosition.position_id.toString().padStart(8, "0") : "---"}`}
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
                      readonly=""
                      value={parseFloat(selectedPosition.margin).toFixed(2)}
                    />
                  </div>
                  <div className="wm-read-p-in">
                    <p>Entry</p>
                    <input
                      type="text"
                      readonly=""
                      value={parseFloat(selectedPosition.entry_price)}
                    />
                  </div>
                </div>
                <div className="row">
               
                  <div className="wm-read-p-in">
                    <p>PNL</p>
                    <input
                      type="text"
                      readonly=""
                      value={parseFloat(selectedPosition.
                        realized_pnl).toFixed(2)}
                    />
                  </div>
                </div>
              </div>
              <div className="input-content-wm">
                <div className="row">
                  <div className="wm-read-p-in mx">
                    <p>Created Date and Time</p>
                    <input
                      type="text"
                      readonly=""
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
                      readonly=""
                      value={formatDigitBasePrice(parseFloat(selectedPosition.quantity), 7)}
                    />
                  </div>
                  <div className="wm-read-p-in">
                    <p>Direction</p>
                    <input
                      type="text"
                      readonly=""
                      value={selectedPosition.direction}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="wm-read-p-in mx">
                    <p>Symbol Name</p>
                    <input
                      type="text"
                      readonly=""
                      value={selectedPosition.symbol}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        <div ref={botPositonHistoryDivRef}>
          {mobileMode ? (
            <>
              <MobileBotPositionHistoryList botPositions={data} name={name} />
              {total > 1 && (
                <div className="pagination-controls">
                  <button 
                    onClick={() => setCurrentPage(1)} 
                    disabled={currentPage === 1}
                    className="pagination-button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M11.354 1.146a.5.5 0 0 1 0 .708L6.207 7l5.147 5.146a.5.5 0 0 1-.708.708l-5.5-5.5a.5.5 0 0 1 0-.708l5.5-5.5a.5.5 0 0 1 .708 0z"/>
                      <path d="M7.354 1.146a.5.5 0 0 1 0 .708L2.207 7l5.147 5.146a.5.5 0 0 1-.708.708l-5.5-5.5a.5.5 0 0 1 0-.708l5.5-5.5a.5.5 0 0 1 .708 0z"/>
                    </svg>
                  </button>
                  
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                    disabled={currentPage === 1}
                    className="pagination-button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M11.354 1.146a.5.5 0 0 1 0 .708L6.207 7l5.147 5.146a.5.5 0 0 1-.708.708l-5.5-5.5a.5.5 0 0 1 0-.708l5.5-5.5a.5.5 0 0 1 .708 0z"/>
                    </svg>
                  </button>
                  
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(p + 1, total))} 
                    disabled={currentPage === Math.ceil((total/pageSize))}
                    className="pagination-button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4.646 1.146a.5.5 0 0 1 .708 0l5.5 5.5a.5.5 0 0 1 0 .708l-5.5 5.5a.5.5 0 1 1-.708-.708L9.793 7 4.646 1.854a.5.5 0 0 1 0-.708z"/>
                    </svg>
                  </button>
                  
                  <button 
                    onClick={() => setCurrentPage(Math.ceil(total/pageSize))} 
                    disabled={currentPage === Math.ceil(total/pageSize)}
                    className="pagination-button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4.646 1.146a.5.5 0 0 1 .708 0L10.5 6.293 5.354 11.44a.5.5 0 0 1-.708-.708L9.293 7 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                      <path d="M8.646 1.146a.5.5 0 0 1 .708 0L14.5 6.293 9.354 11.44a.5.5 0 1 1-.708-.708L13.293 7 8.646 2.354a.5.5 0 0 1 0-.708z"/>
                    </svg>
                  </button>
                </div>
              )}
            </>
          ) : (
            <DataTable
              id='position-history'
              columns={columns}
              data={data}
              pagination
              paginationServer
              paginationTotalRows={total}
              onChangePage={handlePageChange}
              paginationDefaultPage={currentPage}
              filteringFunction={handleFilterChange}
              filtering={true}
              theme="solarized"
              customStyles={customStyles}
              persistTableHead
              paginationComponentOptions={paginationComponentOptions}
              // onRowDoubleClicked={handleRowTheClick}
              onRowDoubleClicked={handleRowClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BotPositionHistory;

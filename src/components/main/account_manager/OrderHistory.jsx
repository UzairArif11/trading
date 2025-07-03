import React, { useEffect, useState } from "react";
import DataTable, { createTheme } from "react-data-table-component";
import APIMiddleware from "../../../data/api/Api-Middleware.js";
import { API_ENDPOINT_GET_All_CLOSED_ORDERS } from "../../../data/Endpoints-API";
import { useAuthContext } from "../../../contexts/Auth-Context";
import { useChartContext } from "../../../contexts/Chart-Context.js";
import { adjustDateTime, formatDate, formatDigitBasePrice } from "../../../utils/format.js";
import "./Positions.css";
import { useAccountManagerContext } from "../../../contexts/Account-Manager-Context.js";
import { useMetricsContext } from "../../../contexts/Metrics-Context.js";
import Select from 'react-select';
const OrderHistory = ({name,parentRef, currTab, handleRowClick, isSymbolSelecting}) => {
  const { utcOffset } =  useMetricsContext();
  const { user, platFromData } = useAuthContext();
  const { setOrderHistoryCount,isOrderClosing } = useAccountManagerContext();
  const { selectedStyle } = useChartContext();
  const [radioChecked, setRadioChecked] = useState(true);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectDisabled2, setSelectDisabled2] = useState(false);
  const [selectDisabled, setSelectDisabled] = useState(false);
  const [symbolOrId, setSymbolOrId] = useState("");
  const [radioChecked2, setRadioChecked2] = useState(true);
  const [filter, setFilter] = useState("");
  const [selectedOrderDate, setselectedOrderDate] = useState("all");
  const [isCustomRangeSelected, setIsCustomRangeSelected] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileMode, setMobileMode] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [orderDate, setOrderDate] = useState({
    startDate: "2000-01-01 00:00:00",
    endDate: getTodaysEnd(),
  });
  const [datePickar, setDatePickar] = useState({
    startDate: "2000-01-01 00:00:00",
    endDate: getTodaysEnd(),
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setMobileMode(true);
        setPageSize(8);
      } else {
        setMobileMode(false);
        setPageSize(10);
      }
    };
    handleResize();  
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const customStyles = {
    headCells: {
      style: {
        justifyContent: 'flex-start !important',
        paddingLeft:'13px !important'
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

  const MobileOrderHistoryRow = ({ order, isExpanded, onToggle, name }) => {
      return (
        <div className={`mobile-position-row ${isExpanded ? 'expanded' : ''}`}>
          <div onClick={onToggle}>
            <div className="main-row">
              <div className="left-section">
                <div className="symbol-direction">
                  <span className="symbol-name">{order.symbol}</span>
                  <span
                    style={{
                      color:
                        order.direction?.toLowerCase() === 'buy'
                          ? selectedStyle.buyColor
                          : selectedStyle.sellColor
                    }}
                  >
                    {order.direction}
                  </span>
                  <span className="quantity">{Number(order.quantity).toFixed(3)}</span>
                </div>
                <div className="price-movement">
                  {formatDigitBasePrice(order.entry_price, 5)} → {formatDigitBasePrice(order.exit_price, 5) || '-'}
                </div>
              </div>
              <div className="status">
                {order.status || '---'}
              </div>
            </div>
            
            {isExpanded && (
              <div className="expanded-section">
                <div className="created-at">
                  <span className="label-open-time">{formatDate(adjustDateTime(order.created_at, utcOffset))}</span>
                </div>
              
                <div className="row">
                  <div className="half-row">
                    <span className="label">Margin:</span>
                    <span className="value">{formatDigitBasePrice(order.margin, 7)}</span>
                  </div>
                  <div className="half-row">
                    <span className="label">ID:</span>
                    <span className="value">{`PID${order.order_id.toString().padStart(8, "0")}`}</span>
                  </div>
                </div>
              </div>          
            )}
          </div>
        </div>
      );
    };
  
    const MobileOrderHistoryList = ({ orders, name }) => {
      
      const toggleRow = (id) => {
        setExpandedRows(prev => ({
          ...prev,
          [id]: !prev[id]
        }));
      };    
    
      return (
        <div className="mobile-orders-container">
          {orders.map(order => (
            <MobileOrderHistoryRow
            name={name}
              key={`order-${order.id}`}
              order={order}
              isExpanded={expandedRows[order.id]}
              onToggle={() => toggleRow(order.id)}
            />
          ))}
        </div>
      );
    };

  function getTodaysEnd() {
    const today = new Date();

    // Set the time to the end of the day (23:59:59)
    today.setHours(23, 59, 59, 999); // Hours, minutes, seconds, milliseconds

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // Month (0-indexed) with leading zero
    const day = String(today.getDate()).padStart(2, "0");
    const hours = String(today.getHours()).padStart(2, "0");
    const minutes = String(today.getMinutes()).padStart(2, "0");
    const seconds = String(today.getSeconds()).padStart(2, "0");

    // Format the date and time in the desired format
    const formattedTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    return formattedTimestamp;
  }

  function convertDatetime(datetimeString) {
    // Parse the date string using a date object
    const date = new Date(datetimeString);

    // Get year, month (0-indexed), day, hours, minutes, and seconds
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Add leading zero for single-digit months
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    // Format the date in the desired format
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    return formattedDate;
  }

  useEffect(() => {
    const calculateRowsPerPage = () => {
      if (parentRef?.current) {
        const divHeight = parentRef.current.clientHeight;
        const rowHeight = 35;
        let rows;
        if (window.innerHeight < 960) {
          rows = Math.floor((divHeight * 0.6) / rowHeight);
        } else rows = Math.floor((divHeight * 0.8) / rowHeight);
      } else {
        setPageSize(10);
      }
    };
    // Call the function if currTab = history
    if (currTab === 'history') calculateRowsPerPage();
  }, [currTab, parentRef]);

  useEffect(() => {
    const fetchData = async () => {
      var startDate = convertDatetime(orderDate.startDate);
      var endDate = convertDatetime(orderDate.endDate);
      if (isCustomRangeSelected) {
        startDate = convertDatetime(datePickar.startDate);
        endDate = convertDatetime(datePickar.endDate);
      }
      try {
        const response = await APIMiddleware.get(
          API_ENDPOINT_GET_All_CLOSED_ORDERS(
            user.userId,
            currentPage,
            pageSize,
            search,
            startDate,
            endDate
          )
        );
        setData(response.data);
        setTotal(response.total);
        setOrderHistoryCount(response.total);
      } catch (error) {
        console.error(error);
      }
    };

    if(!isOrderClosing){
      fetchData();
    }
  }, [
    currentPage,
    pageSize,
    filter,
    search,
    orderDate,
    datePickar,
    isCustomRangeSelected,
    platFromData[4]?.closedOrders,
  ]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (value) => {
    setFilter(value);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value); // Update search state
  };

  const columns = [
    {
      name: "ID",
      selector: (row) => row.order_id,
    },
    {
      name: "Close/Expired At",
      selector: (row) =>
        formatDate(adjustDateTime(row.created_at,utcOffset)),
      style: {
        fontSize: "10px",
      },
    },
    {
      name: "Symbol",
      selector: (row) => row.symbol,
      minWidth: '60px',
    },
    {
      name: "Quantity",
      selector: (row) => formatDigitBasePrice(row.quantity, 7),
      minWidth: '60px',
    },
    {
      name: "Direction",
      selector: (row) => row.direction,
      minWidth: '60px',
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
      selector: (row) => row.exit_price,
    },
    {
      name: "Status",
      selector: (row) => row.status,
    },
  ];
  const paginationComponentOptions = {
    noRowsPerPage: true,
  };
  const handleFirstDivClick2 = () => {
    setRadioChecked2(true);
    setSelectDisabled2(false); // Ensure select is enabled when clicking on the first div
    setIsCustomRangeSelected(false);
  };
  const handleFirstDivClick = () => {
    setRadioChecked(true);
    setSelectDisabled(false); // Ensure select is enabled when clicking on the first div
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


  const changehanldefunction = (selectedOption) => {
    const value = selectedOption.value;

    if (value === "Today") {
      const today = new Date();
      const startDate = new Date(today).setHours(0, 0, 0, 0);
      const endDate = new Date(today).setHours(23, 59, 59, 999);
      setOrderDate({ startDate, endDate });
    } else if (value === "Yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const startDate = new Date(yesterday).setHours(0, 0, 0, 0);
      const endDate = new Date(yesterday).setHours(23, 59, 59, 999);
      setOrderDate({ startDate, endDate });
    } else if (value === "CurrentWeek") {
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay())).setHours(0, 0, 0, 0);
      const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6)).setHours(23, 59, 59, 999);
      setOrderDate({ startDate: startOfWeek, endDate: endOfWeek });
    } else if (value === "CurrentMonth") {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).setHours(0, 0, 0, 0);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).setHours(23, 59, 59, 999);
      setOrderDate({ startDate: firstDayOfMonth, endDate: lastDayOfMonth });
    } else if (value === "PreviousMonth") {
      const today = new Date();
      const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayOfPreviousMonth = new Date(firstDayOfCurrentMonth).setMonth(firstDayOfCurrentMonth.getMonth() - 1);
      const lastDayOfPreviousMonth = new Date(firstDayOfCurrentMonth).setDate(0);
      setOrderDate({
        startDate: new Date(firstDayOfPreviousMonth).setHours(0, 0, 0, 0),
        endDate: new Date(lastDayOfPreviousMonth).setHours(23, 59, 59, 999),
      });
    } else if (value === "LastThreeMonth") {
      const today = new Date();
      const firstDateThreeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1).setHours(0, 0, 0, 0);
      const lastDateCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).setHours(23, 59, 59, 999);
      setOrderDate({ startDate: firstDateThreeMonthsAgo, endDate: lastDateCurrentMonth });
    } else if (value === "Last6Month") {
      const today = new Date();
      const firstDateSixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1).setHours(0, 0, 0, 0);
      const lastDateCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).setHours(23, 59, 59, 999);
      setOrderDate({ startDate: firstDateSixMonthsAgo, endDate: lastDateCurrentMonth });
    } else if (value === "all") {
      setOrderDate({ startDate: new Date("2000-01-01T00:00:00"), endDate: getTodaysEnd() });
    } else {
      setOrderDate({ startDate: new Date("2000-01-01T00:00:00"), endDate: getTodaysEnd() });
    }
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
  const handleSecondDivClick2 = () => {
    setRadioChecked2(false);
    setSelectDisabled2(true); // Disable select when clicking on the second div
    setIsCustomRangeSelected(true);
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
        <div className="positions-button" style={{flexWrap: "wrap", gap: "4px"}}>
          <div className="input-text" >
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
              isDisabled={selectDisabled2}
              onChange={changehanldefunction}
              defaultValue={options.find((option) => option.value === "all")}
              styles={customStyle}
              isSearchable={false}
              menuPortalTarget={document.body}
            />
          </div>

          <div
            className={`flex-tag ${!radioChecked2 ? "" : "disabled"} pt-10`}
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

        <div className="">
          {mobileMode ? (
            <>
              <MobileOrderHistoryList orders={data} name={name} />
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
          ): (
            <DataTable
              columns={columns}
              data={data}
              pagination
              paginationServer
              paginationTotalRows={total}
              onChangePage={handlePageChange}
              paginationDefaultPage={currentPage}
              filteringFunction={handleFilterChange}
              filtering={true}
              persistTableHead
              theme="solarized"
              customStyles={customStyles}
              paginationComponentOptions={paginationComponentOptions}
              onRowDoubleClicked={handleRowClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;

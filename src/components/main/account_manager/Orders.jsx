import React, { useEffect, useState, useRef } from 'react';
import { useAuthContext } from '../../../contexts/Auth-Context.js';
import DataTable, { createTheme } from 'react-data-table-component';
import { useSymbolContext } from '../../../contexts/Symbol-Context.js';
import { useChartContext } from '../../../contexts/Chart-Context.js';
import { FaTimes } from 'react-icons/fa';
import './Positions.css';
import { useAccountManagerContext } from '../../../contexts/Account-Manager-Context.js';
import { adjustDateTime, formatDate, formatDigitBasePrice, formatPrice } from '../../../utils/format.js';
import { useMetricsContext } from "../../../contexts/Metrics-Context.js";

import { Ripple } from 'react-ripple-click';
import 'react-ripple-click/dist/index.css';
import EditOrderSltp from '../edit_sltp_modal/Edit-Order-Sltp';
import Select from 'react-select';
import useLongPress from "../../../lib/hooks/useLongPress.js";

function chunkArray(array, size) {
  let size2 = size;
  if (!Array.isArray(array)) {
    console.log('Please provide a valid array (in chunkArray function orders)');
    return [];
  }
  if (typeof size2 !== 'number' || size2 <= 0) {
    size2 = 5;
  }

  const chunkedArray = [];
  for (let i = 0; i < array.length; i += size2) {
    chunkedArray.push(array.slice(i, i + size2));
  }
  return chunkedArray;
}

const Orders = ({ openOrders,handleOpenOrdersUpdate, parentRef, currTab, handleRowClick, isSymbolSelecting }) => {
  const { user ,platFromData} = useAuthContext();
  const { closeAllOrder, cancelOrder, closeBuyPendingOrders, closeSellPendingOrders } = useAccountManagerContext();
  const { symbolData } = useSymbolContext();
  const { selectedStyle, setSelectedStyle, styleOptions } = useChartContext();
  const [popupTitle, setPopupTitle] = useState();
  const { utcOffset} = useMetricsContext();
  const [closeAll, setCloseAll] = useState('false');
  const [selectedOrder, setSelectedOrder] = useState({ order_id: null, symbol: '', SL: null, TP: null, quantity: null });
  const [isEdit, setIsEdit] = useState(false);
  const [mobileMode, setMobileMode] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [isEditSltpVisible, setIsEditSltpVisible] = useState(false);
  const [popupOrder, setPopupOrder] = useState(null);
  const [showClosePopup, setShowClosePopup] = useState(false);
  const [showCloseAllPopup, setShowCloseAllPopup] = useState(false);
  const [isOrderClosing, setIsOrderClosing] = useState(false);
  const modalBottom = useRef(null)
  const positionDetailsView = (e) => {
    setSelectedOrder(e);
    setIsEdit(true);
  };

  const hasBuyPendingOrders = () => {
    return openOrders.some(order => 
      order.direction === 'Buy' && 
      order.current_price !== null && 
      order.current_price !== undefined
    );
  };

  const hasSellPendingOrders = () => {
    return openOrders.some(order => 
      order.direction === 'Sell' && 
      order.current_price !== null && 
      order.current_price !== undefined
    );
  };

  const popupAction = (e) => {
    if (popupTitle === 'close all orders') {
      clearAllOrders();
    } else if (popupTitle === 'Buy') {
      clearAllBuyOrders();
    } else if (popupTitle === 'Sell') {
      clearAllSellOrders();
    }
    setCloseAll("false");
  };

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
    const handleResize = () => {
      if(window.innerWidth <= 786) {
        setMobileMode(true);
      } else {
        setMobileMode(false);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, []);

  const customStyles = {
    headCells: {
      style: {
        paddingLeft: '13px !important',
        justifyContent: 'flex-start !important',
      },
    },
    cells: {
      style: {
        paddingLeft: '13px !important',
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
    'solarized',
    {
      text: {
        primary: '#c5c5c5',
      },
      background: {
        default: '#2d2d2d',
      },
      context: {
        background: '#2d2d2d',
        text: '#c5c5c5',
      },
    },
    'dark',
  );

  const MobileOrderRow = ({ order, isExpanded, onToggle, onLongPressTrigger }) => {
    const handleLongPress = () => {
      onLongPressTrigger(order);
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
    };
    return (
      <div className={`mobile-position-row ${isExpanded ? 'expanded' : ''}`}>
        <div onClick={handleClick} {...handlers}>
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
                {formatDigitBasePrice(order.entry_price, 5)} → {order.current_price || '-'}
              </div>
            </div>
          </div>
          
          {isExpanded && (
            <div className="expanded-section">
              <div className="created-at">
                {formatDate(adjustDateTime(order.created_at, utcOffset))}
              </div>
            
              <div className="row">
                <div className="half-row">
                  <span className="label">S/L:</span>
                  <span className="value">{order.SL ? formatDigitBasePrice(order.SL, 5) : '--'}</span>
                </div>
                <div className="half-row">
                  <span className="label">T/P:</span>
                  <span className="value">{order.TP ? formatDigitBasePrice(order.TP, 5) : '--'}</span>
                </div>
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

  const MobileOrderList = ({ orders }) => {
    const toggleRow = (orderId) => {
      setExpandedRows(prev => ({
        ...prev,
        [orderId]: !prev[orderId]
      }));
    };    
    const handleLongPressTrigger = (order) => {
      setPopupOrder(order);
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
        {orders.map(order => (
          <MobileOrderRow
            key={order.order_id}
            order={order}
            isExpanded={expandedRows[order.order_id]}
            onToggle={() => toggleRow(order.order_id)}
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
                disabled={(platFromData[5]?.accessRight == 3|| localStorage.getItem('accountType') == "0" || openOrders?.length === 0 )}
                onClick={() => {
                  setCloseAll('true');
                  setPopupTitle('close all orders');
                }}
              >
                Close All Orders
              </button>

              {hasBuyPendingOrders() && (
                <button
                  className="bulk-button"
                  onClick={() => {
                    setPopupTitle('Buy');
                    setShowCloseAllPopup(false);
                    setCloseAll('true');
                  }}
                >
                  Close Buy Pending Orders
                </button>
              )}

              {hasSellPendingOrders() && (
                <button
                  className="bulk-button"
                  onClick={() => {
                    setPopupTitle('Sell');
                    setShowCloseAllPopup(false);
                    setCloseAll('true');
                  }}
                >
                  Close Sell Pending Orders
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showClosePopup && popupOrder && (
          <div className="bottom-popup-overlay2" onClick={() => setShowClosePopup(false)}>
            <div className="bottom-popup2" onClick={(e) => e.stopPropagation()}>
              <button
                className="close-all-button"
                onClick={() => {
                  if (popupOrder && popupOrder.current_price) {
                    cancelOrder(user.userId, popupOrder, popupOrder.current_price, 'cancelled');
                    setShowClosePopup(false);
                  } else {
                    console.error("Cannot cancel order: missing current price");
                  }
                }}
              >
                Close Order
              </button>
            </div>
          </div>
        )}
      </>
    );
  };
  
  const columns = [
    {
      name: "",
      cell: (row) => (
        <div className="positions-button">
          <button role="info" className="modal-icon" 
          onClick={() => positionDetailsView(row)}
          >
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
          <button
            className="modal-icon"
            role="info"
            onClick={() => {
              showEditSltp();
              setSelectedOrder(row)
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
        </div>
      ),
      ignoreRowClick: true,
      nonSortable: true,
      width:'7.69%',
      minWidth:'50px !important',
      wrap:true
    },
    {
      name: 'ID',
      selector: (row) => row.order_id,
      width:'9.09%',
      minWidth:'75px !important',
      wrap:true
    },

    {
      name: 'Created',
      selector: (row) =>
        `${new Date(row.created_at).toLocaleDateString('en-GB')}, ${new Date(
          row.created_at,
        ).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}`,
      // width:'9.09%',
      // minWidth:'72.2px !important',
      wrap:true
    },
    {
      name: 'Symbol',
      selector: (row) => row.symbol,
      width:'9.09%',
      minWidth:'65px !important',
      wrap:true
    },
    {
      name: 'Quantity',
      selector: (row) => parseFloat(row.quantity).toFixed(5),
      width:'9.09%',
      minWidth:'65px !important',
      wrap:true
    },
    {
      name: 'Direction',
      selector: (row) => row.direction,
      width:'9.09%',
      minWidth:'65px !important',
      wrap:true
    },
    {
      name: 'Margin',
      selector: (row) => parseFloat(row.margin).toFixed(5),
      width:'9.09%',
      minWidth:'60px !important',
      wrap:true
    },
    {
      name: 'Entry',
      selector: (row) => parseFloat(row.entry_price),
      width:'9.09%',
      minWidth:'60px !important',
      wrap:true
    },
    {
      name: 'Current',
      selector: (row) => formatDigitBasePrice(row.current_price, 7),
      width:'9.09%',
      minWidth:'60px !important',
      wrap:true
    },
    {
      name: 'S/L',
      selector: (row) =>
        String(row.SL) !== '' ? formatDigitBasePrice(row.SL, 5) : '--',
      width:'9.09%',
      minWidth:'72.2px !important',
      wrap:true
    },
    {
      name: 'T/P',
      selector: (row) =>
        String(row.TP) !== '' ? formatDigitBasePrice(row.TP, 5) : '--',
      width:'9.09%',
      minWidth:'72.2px !important',
      wrap:true
    },
    {
      name: (
        <button
          className={`Close-button`}
          disabled={(platFromData[5]?.accessRight == 3|| localStorage.getItem('accountType') == "0" || openOrders?.length === 0 )}
          onClick={() => {
            setCloseAll('true');
            setPopupTitle('close all orders');
          }}
        >
          {isOrderClosing ? 'Cancelling':"Cancel all"}
        </button>
      ),
      cell: (row) => (
        <div className="positions-button">
          <button
            className="react-icon"
            disabled={platFromData[5]?.accessRight == 3|| localStorage.getItem('accountType') =="0" ||(row.current_price ? false : true)}
            onClick={() => {
              cancelOrder(user.userId, row, row.current_price, 'cancelled');
            }}
          >
            <FaTimes />
          </button>
        </div>
      ),
      // width:'9.09%',
      // minWidth:'72.2px !important',
      wrap:true
    },
  ];
  const showEditSltp = () => {
    setIsEditSltpVisible(true);
  };

  const hideEditSltp = () => {
    setIsEditSltpVisible(false);
  };
  const paginationComponentOptions = {
    noRowsPerPage: true,
  };
  const clearAllOrders = async () => {
    const currentDate = new Date();
    closeAllOrder(user.userId);
  };
  
  const clearAllBuyOrders = async () => {
    closeBuyPendingOrders(user.userId, 'Buy');
  }

  const clearAllSellOrders = async () => {
    closeSellPendingOrders(user.userId, 'Sell');
  }

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
  
  const [filterText, setFilterText] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [direction, setDirection] = useState({ value: "all", label: "All Directions (Default)" });

  const options = [
    { value: "all", label: "All Directions (Default)" },
    { value: "Buy", label: "Buy" },
    { value: "Sell", label: "Sell" },
  ];

  useEffect(() => {
    filterData(filterText, direction.value);
  }, [openOrders, filterText, direction.value]);

  const handleFilter = (e) => {
    const value = e.target.value;
    setFilterText(value);
  };

  const handleSelectChange = (selectedOption) => {
    setDirection(selectedOption);
  };

  const filterData = (text, direction) => {
    let filteredItems = openOrders;

    if (direction !== 'all') {
      filteredItems = filteredItems.filter((item) => item.direction === direction);
    }

    if (text) {
      filteredItems = filteredItems.filter(
        (item) =>
          item.symbol.toLowerCase().includes(text.toLowerCase()) ||
          item.order_id.toString().toLowerCase().includes(text.toLowerCase())
      );
    }
    handleOpenOrdersUpdate(filteredItems.length)
    setFilteredData(filteredItems);
  };

  // useEffect that calculates pagination rows based on height of container
  const [currentPage, setCurrentPage] = useState(1)
  const [paginationPerPage, setPaginationPerPage] = useState(10);
  const [filteredDataCopy, setFilteredDataCopy] = useState([]);
  const ordersPerPage = 9;
  const indexOfLast = currentPage * ordersPerPage;
  const indexOfFirst = indexOfLast - ordersPerPage;
  const currentorders = filteredData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredData.length / ordersPerPage);

  const handlePageChange = (pg) => {
    setCurrentPage(pg);
  };

  useEffect(() => {
    if (window.innerWidth < 990) return;
    const calculateRowsPerPage = () => {
      setPaginationPerPage(10);
      if (parentRef?.current) {
        const divHeight = parentRef.current.clientHeight;
        const rowHeight = 35;
        let rows = 10;
        // rows = rows > 10 ? 10 : rows;
        // setPaginationPerPage(rows);
        setFilteredDataCopy(chunkArray(filteredData, rows));
      } else {
        // setPaginationPerPage(5);
        setFilteredDataCopy(chunkArray(filteredData, 10));
      }
    };
    // Call the function if currTab = history
    if (currTab === 'history') calculateRowsPerPage();
  }, [currTab, filteredData, parentRef]);

  return (
    <>
            {isEdit && (
        <div className="wm-parent">
          <div
            className="window-module"
            style={{ position: "fixed", top: "25%" }}
          >
            <div className="wm-header">
              <h2 className="wmTitleDynamic">
                Order Info: {selectedOrder.order_id}
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
                    <p>Order ID Information</p>
                    <input
                      type="text"
                      readonly=""
                      value={selectedOrder.order_id}
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
                      value={parseFloat(selectedOrder.margin).toFixed(4)}
                    />
                  </div>
                  <div className="wm-read-p-in">
                    <p>Entry</p>
                    <input
                      type="text"
                      readOnly
                      value={parseFloat(selectedOrder.entry_price)}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="wm-read-p-in">
                    <p>Current</p>
                    <input
                      type="text"
                      readOnly
                      value={selectedOrder?.current_price}
                    />
                  </div>
                  <div className="wm-read-p-in" style={{visibility:"Hidden"}}>
                    <p></p>
                    <input
                      type="text"
                      readOnly
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
                      readOnly
                      value={`${new Date(
                        selectedOrder.created_at
                      ).toLocaleDateString("en-GB")}, ${new Date(
                        selectedOrder.created_at
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
                      value={parseFloat(selectedOrder.quantity).toFixed(6)}
                    />
                  </div>
                  <div className="wm-read-p-in">
                    <p>Direction</p>
                    <input
                      type="text"
                      readOnly
                      value={selectedOrder.direction}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="wm-read-p-in mx">
                    <p>Symbol Name</p>
                    <input
                      type="text"
                      readOnly
                      value={selectedOrder.symbol}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {closeAll && (
        <div className="confirm-box" role={closeAll}>
          <div className="card">
            <h2>
              {popupTitle === 'close all orders' && 'Are you sure you want to close all orders?'}
              {popupTitle === 'Buy' && 'Are you sure you want to close all Buy pending orders?'}
              {popupTitle === 'Sell' && 'Are you sure you want to close all Sell pending orders?'}
            </h2>
            <div className="row-scss">
              <button
                onClick={(e) => {
                  setCloseAll('false');
                }}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  isolation: 'isolate',
                  backgroundColor: selectedStyle.buyColor,
                }}
              >
                <Ripple/>
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
      )}
      {isEditSltpVisible && <EditOrderSltp  onCancel={hideEditSltp} editPositionId={selectedOrder.order_id}  currentPrice={openOrders.find(
        (pos) => pos.symbol === selectedOrder.symbol && pos.order_id === selectedOrder.order_id
      )
      } />}
      <div
        className="open-positions-table bottom-table-bstorm"
        style={{ overflowY: 'auto' }}
      >
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
          <div>
      
      <Select
        styles={customStyle}
        value={direction}
        onChange={handleSelectChange}
        options={options}
        isSearchable={false}
        menuPortalTarget={document.body}
      />
    </div>
        </div>
        { mobileMode ? (
          <>
            <MobileOrderList orders={currentorders} />
            {filteredData.length > ordersPerPage && (
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
        <DataTable
          columns={columns}
          data={filteredDataCopy[currentPage - 1] || filteredData}
          persistTableHead
          fixedHeader={true}
          pagination
          paginationTotalRows={filteredData.length}
          onChangePage={handlePageChange}
          paginationDefaultPage={currentPage}
          paginationServer
          paginationPerPage={paginationPerPage}
          theme="solarized"
          customStyles={customStyles}
          paginationComponentOptions={paginationComponentOptions}
          onRowDoubleClicked={handleRowClick}
        />
      )}
      </div>
    </>
  );
};

export default Orders;

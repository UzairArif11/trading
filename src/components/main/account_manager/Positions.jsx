import React, { useEffect, useState } from "react";
import { API_ENDPOINT_OPENED_POSITIONS } from "../../../data/Endpoints-API";
import { useAuthContext } from "../../../contexts/Auth-Context.js";
import APIMiddleware from "../../../data/api/Api-Middleware.js";
import DataTable, {createTheme} from "react-data-table-component";
import { useSymbolContext } from "../../../contexts/Symbol-Context.js";
import { MdCloseAll } from 'react-icons/md'
import { FaTimes } from "react-icons/fa";
import CurrentPriceCell from "./CurrentPrice.jsx";
import EditSltp from "../edit_sltp_modal/Edit-Sltp";
import "./Positions.css";
import CalculatePNL from "./PNLCalculator.jsx";
import { useAccountManagerContext } from "../../../contexts/Account-Manager-Context.js";

import { Ripple } from 'react-ripple-click';
import 'react-ripple-click/dist/index.css';

const Positions = () => {
  const { user, platFromData } = useAuthContext();
  const {
    closeAllPosition,
    closePosition,
    isPositionClosed,
    setPositionCount,
  } = useAccountManagerContext();
  const [data, setData] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const { newPositionOpen, symbolData, isPositionEdited } =
    useSymbolContext();
  const [isEditSltpVisible, setIsEditSltpVisible] = useState(false);
  const [closeAll, setCloseAll] = useState("false");
  const [filterText, setFilterText] = useState('');
  
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
  const filteredItems = data.filter(item => item.symbol && item.symbol.toLowerCase().includes(filterText.toLowerCase()));

  const pnlCalc = (row) => {
    var currentPrice =
      row.direction == "Buy"
        ? symbolData[row.symbol]?.ask * 1
        : symbolData[row.symbol]?.bid * 1;

    let pnl = 0;
    if (row.direction == "Buy") {
      pnl = parseFloat(
        (parseFloat(row.entry_price) - currentPrice) * row.quantity
      ).toFixed(2);
    } else {
      pnl = parseFloat(
        (currentPrice - parseFloat(row.entry_price)) * row.quantity
      ).toFixed(2);
    }
    return pnl;
  };

  const handleSearchChange = (event) => {
    const filterValue = event.target.value;
    setFilterText(filterValue);
  };
  const handleClear = () => {
    if (filterText) {
      setResetPaginationToggle(!resetPaginationToggle);
      setFilterText('');
    }
  };

  const customStyles = {
    rows: {
      style: {
        fontSize: "10px !important",
        justifyContent: 'flex-start !important',
      },
    },
    headCells: {
      style: {
        fontSize: "10px",
        justifyContent: 'flex-start !important',
      },
    },
    cells: {
      style: {
        fontSize: "10px",
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
  const currentPriceCal = (row) => {
    var currentPrice =
      row.direction == "Buy"
        ? symbolData[row.symbol]?.ask
        : symbolData[row.symbol]?.bid;
    return parseFloat(currentPrice);
  };
  const positionDetails = (e) => {
    const pnl = pnlCalc(e);
    setSelectedPosition({ ...e, pnl: pnl });
    const currPirce = currentPriceCal(e);
    setSelectedPosition({ ...e, currPirce: currPirce });
    setIsEdit(true);
  };
  const hideEditSltp = () => {
    setIsEditSltpVisible(false);
  };

  const exitPriceCalculator = (row) => {
    return row?.direction == "Buy"
      ? symbolData[row.symbol]?.bid
      : symbolData[row.symbol]?.ask;
  };
  const showEditSltp = (row) => {
    setIsEditSltpVisible(true);
    var currentPrice =
      row.direction == "Buy"
        ? symbolData[row.symbol]?.ask
        : symbolData[row.symbol]?.bid;
    const formattedPrice = parseFloat(currentPrice);

    setSelectedPosition({ ...row, current_price: formattedPrice });
    // console.log(symbolData)
  };
  const clearAllPositions = async () => {
    const currentDate = new Date();
    // Whenever openPositions or symbolData changes, update positionDetailsArray
    const updatedDetailsArray = data.map((position) => ({
      id: position.id,
      symbol: position.symbol,
      exit_price: exitPriceCalculator(position),
      direction: position.direction,
      position_closed_at: currentDate,
      // Add other details as needed
    }));

    closeAllPosition(user.userId, updatedDetailsArray);
  };
  const columns = [
    {
      name: "",
      cell: (row) => (
        <div className="positions-button">
          <button role="info" className="modal-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              fill="currentColor"
              className="bi bi-info-sm"
              viewBox="0 0 16 16"
              onClick={() => {
                positionDetails(row);
              }}
            >
              <path d="m9.708 6.075-3.024.379-.108.502.595.108c.387.093.464.232.38.619l-.975 4.577c-.255 1.183.14 1.74 1.067 1.74.72 0 1.554-.332 1.933-.789l.116-.549c-.263.232-.65.325-.905.325-.363 0-.494-.255-.402-.704zm.091-2.755a1.32 1.32 0 1 1-2.64 0 1.32 1.32 0 0 1 2.64 0" />
            </svg>
          </button>
          <button
            className="modal-icon"
            role="info"
            onClick={() => {
              showEditSltp(row);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 50 50"
            >
              <path d="M 22.205078 2 A 1.0001 1.0001 0 0 0 21.21875 2.8378906 L 20.246094 8.7929688 C 19.076509 9.1331971 17.961243 9.5922728 16.910156 10.164062 L 11.996094 6.6542969 A 1.0001 1.0001 0 0 0 10.708984 6.7597656 L 6.8183594 10.646484 A 1.0001 1.0001 0 0 0 6.7070312 11.927734 L 10.164062 16.873047 C 9.583454 17.930271 9.1142098 19.051824 8.765625 20.232422 L 2.8359375 21.21875 A 1.0001 1.0001 0 0 0 2.0019531 22.205078 L 2.0019531 27.705078 A 1.0001 1.0001 0 0 0 2.8261719 28.691406 L 8.7597656 29.742188 C 9.1064607 30.920739 9.5727226 32.043065 10.154297 33.101562 L 6.6542969 37.998047 A 1.0001 1.0001 0 0 0 6.7597656 39.285156 L 10.648438 43.175781 A 1.0001 1.0001 0 0 0 11.927734 43.289062 L 16.882812 39.820312 C 17.936999 40.39548 19.054994 40.857928 20.228516 41.201172 L 21.21875 47.164062 A 1.0001 1.0001 0 0 0 22.205078 48 L 27.705078 48 A 1.0001 1.0001 0 0 0 28.691406 47.173828 L 29.751953 41.1875 C 30.920633 40.838997 32.033372 40.369697 33.082031 39.791016 L 38.070312 43.291016 A 1.0001 1.0001 0 0 0 39.351562 43.179688 L 43.240234 39.287109 A 1.0001 1.0001 0 0 0 43.34375 37.996094 L 39.787109 33.058594 C 40.355783 32.014958 40.813915 30.908875 41.154297 29.748047 L 47.171875 28.693359 A 1.0001 1.0001 0 0 0 47.998047 27.707031 L 47.998047 22.207031 A 1.0001 1.0001 0 0 0 47.160156 21.220703 L 41.152344 20.238281 C 40.80968 19.078827 40.350281 17.974723 39.78125 16.931641 L 43.289062 11.933594 A 1.0001 1.0001 0 0 0 43.177734 10.652344 L 39.287109 6.7636719 A 1.0001 1.0001 0 0 0 37.996094 6.6601562 L 33.072266 10.201172 C 32.023186 9.6248101 30.909713 9.1579916 29.738281 8.8125 L 28.691406 2.828125 A 1.0001 1.0001 0 0 0 27.705078 2 L 22.205078 2 z M 23.056641 4 L 26.865234 4 L 27.861328 9.6855469 A 1.0001 1.0001 0 0 0 28.603516 10.484375 C 30.066026 10.848832 31.439607 11.426549 32.693359 12.185547 A 1.0001 1.0001 0 0 0 33.794922 12.142578 L 38.474609 8.7792969 L 41.167969 11.472656 L 37.835938 16.220703 A 1.0001 1.0001 0 0 0 37.796875 17.310547 C 38.548366 18.561471 39.118333 19.926379 39.482422 21.380859 A 1.0001 1.0001 0 0 0 40.291016 22.125 L 45.998047 23.058594 L 45.998047 26.867188 L 40.279297 27.871094 A 1.0001 1.0001 0 0 0 39.482422 28.617188 C 39.122545 30.069817 38.552234 31.434687 37.800781 32.685547 A 1.0001 1.0001 0 0 0 37.845703 33.785156 L 41.224609 38.474609 L 38.53125 41.169922 L 33.791016 37.84375 A 1.0001 1.0001 0 0 0 32.697266 37.808594 C 31.44975 38.567585 30.074755 39.148028 28.617188 39.517578 A 1.0001 1.0001 0 0 0 27.876953 40.3125 L 26.867188 46 L 23.052734 46 L 22.111328 40.337891 A 1.0001 1.0001 0 0 0 21.365234 39.53125 C 19.90185 39.170557 18.522094 38.59371 17.259766 37.835938 A 1.0001 1.0001 0 0 0 16.171875 37.875 L 11.46875 41.169922 L 8.7734375 38.470703 L 12.097656 33.824219 A 1.0001 1.0001 0 0 0 12.138672 32.724609 C 11.372652 31.458855 10.793319 30.079213 10.427734 28.609375 A 1.0001 1.0001 0 0 0 9.6328125 27.867188 L 4.0019531 26.867188 L 4.0019531 23.052734 L 9.6289062 22.117188 A 1.0001 1.0001 0 0 0 10.435547 21.373047 C 10.804273 19.898143 11.383325 18.518729 12.146484 17.255859 A 1.0001 1.0001 0 0 0 12.111328 16.164062 L 8.8261719 11.46875 L 11.523438 8.7734375 L 16.185547 12.105469 A 1.0001 1.0001 0 0 0 17.28125 12.148438 C 18.536908 11.394293 19.919867 10.822081 21.384766 10.462891 A 1.0001 1.0001 0 0 0 22.132812 9.6523438 L 23.056641 4 z M 25 17 C 20.593567 17 17 20.593567 17 25 C 17 29.406433 20.593567 33 25 33 C 29.406433 33 33 29.406433 33 25 C 33 20.593567 29.406433 17 25 17 z M 25 19 C 28.325553 19 31 21.674447 31 25 C 31 28.325553 28.325553 31 25 31 C 21.674447 31 19 28.325553 19 25 C 19 21.674447 21.674447 19 25 19 z"></path>
            </svg>
          </button>
        </div>
      ),
      ignoreRowClick: true,
      nonSortable: true,
    },

    {
      name: "IDreter",
      selector: (row) => row.position_id,
    },

    {
      name: "Created",
      selector: (row) =>
        `${new Date(row.created_at).toLocaleDateString("en-GB")}, ${new Date(
          row.created_at
        ).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}`,
    },
    {
      name: "Symbol",
      selector: (row) => row.symbol,
    },
    {
      name: "Quantity",
      selector: (row) => parseFloat(row.quantity).toFixed(6),
    },
    {
      name: "Direction",
      selector: (row) => row.direction,
    },
    {
      name: "Margin",
      selector: (row) => parseFloat(row.margin).toFixed(6),
    },
    {
      name: "Entry",
      selector: (row) => parseFloat(row.entry_price),
    },
    {
      name: "Current",
      selector: (row) => <CurrentPriceCell row={row} />,
    },
    {
      name: "PNL",
      selector: (row) => <CalculatePNL row={row} />,
    },
    {
      name: "S/L",
      selector: (row) => (row.SL > 0 ? parseFloat(row.SL) : ""),
    },
    {
      name: "T/P",
      selector: (row) => (row.TP > 0 ? parseFloat(row.TP): ""),
    },
    {
      name: (
        <button
          className="Close-button"
          disabled={data.length > 0 ? false : true}
          onClick={() => {
            setCloseAll("true");
          }}
        >
          <MdCloseAll color="blue" />
        </button>
      ),
      cell: (row) => (
        <div className="positions-button">
          <button
            className="react-icon"
            onClick={() => {
              closePost(row);
            }}
          >
            <FaTimes />
          </button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    getAllOpenPositions();
  }, [
    newPositionOpen,
    isPositionClosed,
    isPositionEdited,
    platFromData[3]?.openedPositions?.length,
    platFromData[3]?.closedPositions?.length,
    platFromData[4]?.openedOrders?.length,
    platFromData[4]?.closedOrders?.length,
  ]);
  const getAllOpenPositions = async () => {
    const response = await APIMiddleware.get(
      API_ENDPOINT_OPENED_POSITIONS(user.userId)
    );
    setData(response.data);
    setPositionCount(response.data.length);
  };
  const paginationComponentOptions = {
    noRowsPerPage: true,
  };
  const closePost = (row) => {
    const exitPrice = exitPriceCalculator(row);
    closePosition(user.userId, row, exitPrice, row?.direction);
  };
  return (
    <>
      {closeAll && (
        <div className="confirm-box" role={closeAll}>
          <div className="card">
            <h2>
              Are you sure you want to close all positions forever all at once?
            </h2>
            <div className="row-scss">
              <button
                onClick={(e) => {
                  // mkRipple(e);
                  setCloseAll("false");
                }}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  isolation: "isolate",
                }}
              >
                <Ripple />
                Cancel
              </button>
              <div className="blank"></div>
              <button
                onClick={(e) => {
                  // mkRipple(e);
                  clearAllPositions();
                  setCloseAll("false");
                }}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  isolation: 'isolate',
                }}
              >
                <Ripple />
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
      {isEdit && (
        <div className="wm-parent">
          <div
            className="window-module"
            style={{ position: "fixed", top: "25%" }}
          >
            <div className="wm-header">
              <h2 className="wmTitleDynamic">
                Position Info: {selectedPosition.position_id}
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
                      value={selectedPosition.position_id}
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
                      value={parseFloat(selectedPosition.margin).toFixed(4)}
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
                    <p>Current</p>
                    <input
                      type="text"
                      readonly=""
                      value={selectedPosition.currPirce}
                    />
                  </div>
                  <div className="wm-read-p-in">
                    <p>PNL</p>
                    <input
                      type="text"
                      readonly=""
                      value={selectedPosition.pnl}
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
                      value={parseFloat(selectedPosition.quantity).toFixed(6)}
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

      {isEditSltpVisible && (
        <EditSltp
          onCancel={hideEditSltp}
          editPositionId={selectedPosition.position_id}
          currentPrice={selectedPosition}
        />
      )}
      <div
        className="open-positions-table bottom-table-bstorm"
        style={{ overflowY: "auto" }}
      >
        <div className="positions-button">
                {/* <div className="input-text">
                  <input type="text"
                    value={filterText} onChange={handleSearchChange}
                    placeholder="Search Symbol.."
                  />
                  <div className="input-svg" id="searchSvgColor">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" className="bi bi-search"
                      viewBox="0 0 16 16">
                      <path
                        d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                    </svg>
                  </div>
                </div> */}
                {/* <div>
                  <select className="select-option" onChange={(e) => { setDirection(e.target.value) }}>
                    <option value="all">All Directions (Default) </option>
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                  
                </div> */}
              </div>
        <DataTable
          columns={columns}
          data={filteredItems}
          persistTableHead
          // fixedHeader={true}
          // fixedHeaderScrollHeight={'470px'}
          pagination
          theme="solarized"
          customStyles={customStyles}
          paginationComponentOptions={paginationComponentOptions}
        />
      </div>
    </>
  );
};

export default Positions;

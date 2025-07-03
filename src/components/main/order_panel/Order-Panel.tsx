import React, { useState, useEffect, useContext } from "react";
import Spinner from "../../utils/spinner/Spinner";
import { useSymbolContext } from "../../../contexts/Symbol-Context.js";
import { useChartContext } from "../../../contexts/Chart-Context.js";
import "./Order-Panel.scss";
import { BsArrowUpSquare, BsArrowDownSquare } from "react-icons/bs";
import { GoDotFill } from "react-icons/go";
import Select from "react-select";
import MarketOrder from "../market_order/Market-Order.tsx";
import NotificationsDropdown from "../notifications/NotificationDropdown.jsx"
import PendingOrder from "../pending_order/Pending-Order.tsx";
import { useAuthContext } from "../../../contexts/Auth-Context.js";
import UTCTimeConverter from "./UTCTimeConverter.jsx";
import { useMetricsContext } from '../../../contexts/Metrics-Context';
import SystemNotification from "./SystemNotification.js";
import FloatingWindow from "./FloatingWindow.jsx";


import { Ripple } from 'react-ripple-click';
import 'react-ripple-click/dist/index.css';

// Developed explicit Component for showing ask and bid price in the select symbol option
// import { components } from 'react-select';
// import { formatPrice } from "../../../utils/format.js";
import ServerTime from "./ServerTime.jsx";
import BotPanel from "../bot_panel/BotPanel";
import { RiRobot2Line } from "react-icons/ri";
import ReactSelect from "./React-Select.jsx";
// import Switch1 from "react-switch";
import Switch from "../bot_panel/Switch.jsx"
import UpdateSection from "./UpdateSection.jsx";
import { PromotionContext } from "../../../contexts/promotionContext.js";
import DepositModal from "../../depositModal/DepositModal.jsx";
import { useAccountManagerContext } from "../../../contexts/Account-Manager-Context.js";
import BankDetails from "../../depositModal/BankDetails.jsx";
import WithdrawModal from "../../withdrawModal/WithdrawModal.jsx";
import SwapCountdown from "../market_order/SwapCountdown.jsx";

// const CustomOption = ({ innerRef, innerProps, data }) => {
//   const [prevBid, setPrevBid] = useState(data.bid);
//   const [prevAsk, setPrevAsk] = useState(data.ask);
//   const [bidColor, setBidColor] = useState('#2ecc71'); // Initial color green
//   const [askColor, setAskColor] = useState('#2ecc71'); // Initial color green

//   useEffect(() => {
//     if (data.bid !== prevBid) {
//       setBidColor(data.bid > prevBid ? '#2ecc71' : '#e74c3c');
//       setPrevBid(data.bid);
//     }

//     if (data.ask !== prevAsk) {
//       setAskColor(data.ask > prevAsk ? '#2ecc71' : '#e74c3c');
//       setPrevAsk(data.ask);
//     }
//   }, [data.bid, data.ask, prevBid, prevAsk]);

//   // const formatPrice = (price) => {
//   //   if (price === undefined) return "";
//   //   const formattedPrice = price.toFixed(4);
//   //   const [whole, fractional] = formattedPrice.split('.');
//   //   const displayedFractional = fractional.length > 3 ? fractional.slice(0, 3) : fractional;
//   //   return (
//   //     <span>
//   //       {whole}.
//   //       <span className="fractional">{displayedFractional}</span>
//   //     </span>
//   //   );
//   // };

//   return (
//     <div ref={innerRef} {...innerProps} className="custom-option">
//       <div className="symbol" style={{ color: '#ffffff' }}>{data.label}</div>
//       <div className="bid" style={{ color: bidColor }}>
//         {formatPrice(data.bid)}
//       </div>
//       <div className="ask" style={{ color: askColor }}>
//         {formatPrice(data.ask)}
//       </div>
//     </div>
//   );
// };

// const CustomMenuList = (props) => {
//   return (
//     <components.MenuList {...props}>
//       <div className="header">
//         <div className="symbol-title">Symbol</div>
//         <div className="bid-title">Bid</div>
//         <div className="ask-title">Ask</div>
//       </div>
//       {props.children}
//     </components.MenuList>
//   );
// };


// Actual code of Order panel starts from here 

const OrderPanel: React.FC = () => {
  let prePositionMarkerState = 'show';
  if (localStorage.positionMarker !== undefined) {
    prePositionMarkerState = localStorage.positionMarker;
  } else {
    localStorage.setItem('positionMarker', prePositionMarkerState);
  }
  const [positionMarker, setPositionMarker] = useState(prePositionMarkerState);
  const setPositionMarkerValue = (e) => {
    setPositionMarker(e);
    localStorage.setItem('positionMarker', e);
  }
  const fontSelecter = (e) => {
    setFont(e.target.value);
    localStorage.setItem("storedFont", e.target.value);
    fontAdjuster(e);
  };
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);

  //CONTEXT
  const {
    loadingSymbolContext,
    showTooltip, setShowTooltip,
    showBullets, setShowBullets,
    symbolInfo,
    marketHours,
    // symbolData,
    // allSymbolOptions,
    // selectedSymbolOption,
    // handleSymbolOptionChange,
    leverage,
    hideLeverageCard,
    activeLvg,
    bidPrice,
    askPrice,
    selectedSymbolSession,
    currentExposureLevel
  } = useSymbolContext();
  const { showWithdraw, setShowWithdraw, showDeposit, setShowDeposit, showBank } = useAccountManagerContext();
  const { isHidden } = useContext(PromotionContext);
  const { selectedStyle, setSelectedStyle, styleOptions } = useChartContext();
  const [isPositionOpening, setIsPositionOpening] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  // console.log(allSymbolOptions)
  const { platFromData, selectedAuthSymbol, showFloatingWindow, setShowFloatingWindow } =
    useAuthContext();
  const { fontAdjuster, fontUpdating } = useAuthContext();
  let toggleTooltipLocal;
  if (localStorage.chartTooltips !== undefined) {
    toggleTooltipLocal = localStorage.chartTooltips;
  } else {
    localStorage.setItem('chartTooltips', 'show');
    toggleTooltipLocal = 'show';
  }
  const [toggleTooltip, setToggleTooltip] = useState(toggleTooltipLocal);
  const [font, setFont] = useState(localStorage.getItem('storedFont') || 'Large');
  const [mobileMode, setMobileMode] = useState<boolean>(false);
  const largeRef = React.useRef();

  // bot is subscribed or not
  const subscribed = platFromData[7]['show_bot_stats'] != undefined && platFromData[7]['show_bot_stats'] == 1 ? true : false;

  const resetChanges = () => {
    const c: boolean = window.confirm(
      "Are you sure you want to reset all the changes from this browser?"
    );
    if (c) {
      const makeSure = () => {
        for (let i = 0; i < localStorage.length; i++) {
          if (
            localStorage.key(i) !== "userId" &&
            localStorage.key(i) !== "userData" &&
            localStorage.key(i) !== "variantId"
          ) {
            localStorage.removeItem(localStorage.key(i));
            if (localStorage.length !== 1) {
              makeSure();
              window.location.reload();
            }
          }
        }
      };
      makeSure();
    }
  };

  const handleTooltipToggle = (checked: boolean) => {
    setShowTooltip(checked);
  };
  const handleDisabledButton = (data) => {
    setIsButtonDisabled(data)
  };

  //LOcal States
  const [activeMode, setActiveMode] = useState("order");
  const [selectedTab, setSelectedTab] = useState("market");
  useEffect(() => {
    if (localStorage.getItem("activeMode") != null) {
      setActiveMode(localStorage.getItem("activeMode"));
    }
    if (localStorage.getItem("orderTab") != null) {
      setSelectedTab(localStorage.getItem("orderTab"));
    }
  }, [localStorage.getItem("activeMode"), localStorage.getItem("orderTab"), localStorage.getItem("direction")]);

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
  const {
    currentUTCDate,
    setCurrentUTCDate,
    utcOffset,
    setUTCOffset,
    formatTime,
    utcOffsetInitial,
  } = useMetricsContext();
  useEffect(() => {
    const interval = setInterval(() => {
      const adjustedDate = new Date();
      const [hoursStr, minutesStr] = utcOffset.split(':');
      const hoursOffset = parseInt(hoursStr, 10) || 0;
      const minutesOffset = parseInt(minutesStr, 10) || 0;

      adjustedDate.setUTCHours(
        adjustedDate.getUTCHours() + hoursOffset,
        adjustedDate.getUTCMinutes() + minutesOffset,
      );

      setCurrentUTCDate(adjustedDate);
    }, 1000);

    return () => clearInterval(interval);
  }, [utcOffset]);

  const handleChangeUTCOffset = (selectedOption) => {
    localStorage.setItem('utc_time', selectedOption.value);
    if (selectedOption) {
      setUTCOffset(selectedOption.value);
    }
  };
  const getExposureLevel = (number, array) => {
    if (!array || array.length === 0) {
      return null;
    }

    if (array[0]?.exposure_level === undefined || array[array.length - 1]?.exposure_level === undefined) {
      return null;
    }

    if (number < array[0]?.exposure_level) {
      return array[0];
    }

    if (number > array[array.length - 1]?.exposure_level) {
      return array[array.length - 1];
    }
    for (let i = 0; i < array.length; i++) {
      if (array[i]?.exposure_level !== undefined && number <= array[i]?.exposure_level) {
        return array[i];
      }
    }

    // Return null or some default value if no match is found
    return null;
  };

  const marketTypeOptions = [{ label: "Market Order", value: "market" }, { label: "Pending Order", value: "pending-order" }, { label: "Bot Trading", value: "bot-trading" }];

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      padding: '7px !important',
      color: 'white',
      borderColor: '#484848 !important',
      // backgroundColor: state.isFocused ? 'rgb(33, 196, 109) !important' : null,
      backgroundColor: null,
      '&:hover': {
        backgroundColor: 'rgb(33, 196, 109) !important',
        cursor: 'pointer',
      },
      cursor: 'pointer',
    }),
    control: (provided, state) => ({
      ...provided,
      width: '100%',
      backgroundColor: '#232323 !important',
      borderColor: '#484848 !important',
      boxShadow: state.isFocused ? '#484848 !important' : provided.boxShadow,
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#3b3a3a !important',
      width: '100% !important',
      zIndex: 111,
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '120px !important',
      overflowY: 'auto',
    }),
    input: (provided) => ({
      ...provided,
      padding: '0 !important'
    }),
  };

  const options = [
    { value: '-12:00', label: 'UTC-12:00' },
    { value: '-11:30', label: 'UTC-11:30' },
    { value: '-11:00', label: 'UTC-11:00' },
    { value: '-10:30', label: 'UTC-10:30' },
    { value: '-10:00', label: 'UTC-10:00' },
    { value: '-09:30', label: 'UTC-9:30' },
    { value: '-09:00', label: 'UTC-9:00' },
    { value: '-08:30', label: 'UTC-8:30' },
    { value: '-08:00', label: 'UTC-8:00' },
    { value: '-07:30', label: 'UTC-7:30' },
    { value: '-07:00', label: 'UTC-7:00' },
    { value: '-06:30', label: 'UTC-6:30' },
    { value: '-06:00', label: 'UTC-6:00' },
    { value: '-05:45', label: 'UTC-5:45' },
    { value: '-05:30', label: 'UTC-5:30' },
    { value: '-05:00', label: 'UTC-5:00' },
    { value: '-04:30', label: 'UTC-4:30' },
    { value: '-04:00', label: 'UTC-4:00' },
    { value: '-03:30', label: 'UTC-3:30' },
    { value: '-03:00', label: 'UTC-3:00' },
    { value: '-02:30', label: 'UTC-2:30' },
    { value: '-02:00', label: 'UTC-2:00' },
    { value: '-01:30', label: 'UTC-1:30' },
    { value: '-01:00', label: 'UTC-1:00' },
    { value: '+00:00', label: 'UTC+0' },
    { value: '+01:00', label: 'UTC+1:00' },
    { value: '+02:00', label: 'UTC+2:00' },
    { value: '+02:30', label: 'UTC+2:30' },
    { value: '+03:00', label: 'UTC+3:00' },
    { value: '+03:30', label: 'UTC+3:30' },
    { value: '+04:00', label: 'UTC+4:00' },
    { value: '+04:30', label: 'UTC+4:30' },
    { value: '+05:00', label: 'UTC+5:00' },
    { value: '+05:30', label: 'UTC+5:30' },
    { value: '+05:45', label: 'UTC+5:45' },
    { value: '+06:00', label: 'UTC+6:00' },
    { value: '+06:30', label: 'UTC+6:30' },
    { value: '+07:00', label: 'UTC+7:00' },
    { value: '+07:30', label: 'UTC+7:30' },
    { value: '+08:00', label: 'UTC+8:00' },
    { value: '+08:30', label: 'UTC+8:45' },
    { value: '+09:00', label: 'UTC+9:00' },
    { value: '+09:30', label: 'UTC+9:30' },
    { value: '+10:00', label: 'UTC+10:00' },
    { value: '+10:30', label: 'UTC+10:30' },
    { value: '+11:00', label: 'UTC+11:00' },
    { value: '+11:30', label: 'UTC+11:30' },
    { value: '+12:00', label: 'UTC+12:00' },
    { value: '+13:00', label: 'UTC+13:00' },
    { value: '+14:00', label: 'UTC+14:00' },
  ];
  const orderCustomStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '15px !important',
      width: '100px',
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
    indicatorSeparator: (provided, state) => ({
      ...provided,
      backgroundColor: '#484848 !important',
      borderColor: state.isFocused
        ? `${selectedStyle.buyColor} !important`
        : '#484848 !important',
      color: '#484848 !important',
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
      width: 'calc(100% - 1.6rem) !important',
      margin: '0.3rem 0.8rem 0 0.8rem !important',
      zIndex: 111,
    }),

    menuList: (provided) => ({
      ...provided,
      maxHeight: '130px',
      overflowY: 'auto',
    }),
  };


  useEffect(() => {
    // TODO: use an alternative to useRef
    if (largeRef.current && localStorage.getItem('storedFont') == null) {
      const tempObj = { target: { value: 'Large' } };
      // setFont('Large');
      localStorage.setItem("storedFont", 'Large');
      fontAdjuster(tempObj);
    }
  }, [largeRef.current]);


  useEffect(() => {
    const checkMobileMode = () => {
      const isMobile = window.innerWidth <= 960;
      setMobileMode(isMobile);
    };

    // Initial check
    checkMobileMode();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobileMode);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('resize', checkMobileMode);
    };
  }, []);

  const [collapseState, setCollapseState] = useState({
    orders: true,
    symbols: false,
    market_hours: false,
    leverage: false,
    promotion: true,
  });

  // Determine classes based on activeMode
  const orderPanelClass = (activeMode === "order" || activeMode === "withdraw" || activeMode === "deposit") ? "visible" : "hidden";
  const settingsClass = activeMode === "settings" ? "visible" : "hidden";
  const updatePanelClass = activeMode === "update" ? "visible" : "hidden";
  const notificationClass = activeMode === "notifications" ? "visible" : "hidden";

  const handleModeClick = (mode: string) => {
    setActiveMode(mode);
    localStorage.setItem("activeMode", mode);
  };

  const handleTabClick = (tab: string) => {
    setSelectedTab(tab);
    localStorage.setItem("orderTab", tab);
  };

  useEffect(() => {
    if (!subscribed) {
      handleTabClick('market');
    }
  }, [subscribed]);

  //show spinner while loading data
  if (loadingSymbolContext) {
    return <Spinner />;
  }

  const handleCollapseClick = (section) => {
    setCollapseState((prevState) => ({
      ...prevState,
      [section]: !prevState[section],
    }));
  };
  const orderStyles = {
    container: (provided) => ({
      ...provided,
      display: 'flex',
      justifyContent: 'center',
    }),
    control: (provided, state) => {
      return {
        ...provided,
        paddingLeft: '10px !important',
        boxShadow: state.isFocused ? '0 0 50px #484848 !important' : provided.boxShadow,
        '&:hover': {
          borderColor: 'rgb(33, 196, 109) !important',
          cursor: 'pointer',
          boxShadow: '0 0 0 transparent !important',
        },
        backgroundColor: '#232323 !important',
        borderColor: '#484848 !important',
        width: 'calc(100% - 0.9rem) !important',
        cursor: 'pointer',
        margin: '0 auto !important',
      };
    },
    singleValue: (provided, state) => ({
      ...provided,
      paddingLeft: '10px !important',
      borderColor: state.isFocused ? 'rgb(33, 196, 109) !important' : '#484848 !important',
      color: '#c5c5c5 !important',
    }),
    indicatorSeparator: (provided, state) => ({
      ...provided,
      backgroundColor: '#484848 !important',
      borderColor: state.isFocused ? 'rgb(33, 196, 109) !important' : '#484848 !important',
      color: '#484848 !important',
    }),
    option: (provided, state) => ({
      ...provided,
      padding: '0.3rem !important',
      cursor: 'pointer',
      borderBottom: '1px solid #232323',
      '&:nth-last-child(1)': {
        borderBottom: 'none !important',
      },
      '&:hover': {
        backgroundColor: 'rgb(33, 196, 109) !important',
        color: '#2d2d2d !important',
      },
      backgroundColor: state.isSelected ? '#232323 !important' : 'transparent',
      color: state.isSelected ? 'rgb(33, 196, 109) !important' : '#c5c5c5 !important',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#3b3a3a !important',
      zIndex: 111,
      width: 'calc(100% - 2.25rem) !important',
      margin: '0 auto !important',
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '50vh',
      overflowY: 'auto',
      padding: '20px !important'
    }),
  };
  return (
    <div className="global-platfrom">
      {
        showDeposit && <DepositModal />
      }
      {
        showBank && <BankDetails />
      }
      {
        showWithdraw && <WithdrawModal />
      }
      <div className="global-platform-order-child">
        <div className="mode-tabs" >
          <button
            className={`mode-tab-button ${activeMode === "deposit" ? "mode-tab-active" : ""
              }`}
            onClick={() => {
              handleModeClick("deposit");
              setShowDeposit(true)
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
            }}
            disabled={platFromData[5]?.accessRight == 3 || localStorage.getItem('accountType') == "0" || platFromData[5]?.accessRight == 2 || isButtonDisabled}
          >
            <Ripple />
            Deposit
          </button>
          <button
            className={`mode-tab-button ${activeMode === "withdraw" ? "mode-tab-active" : ""}`}
            onClick={() => {
              handleModeClick("withdraw");
              setShowWithdraw(true);
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
            }}
            disabled={platFromData[5]?.accessRight == 3 || localStorage.getItem('accountType') == "0" || platFromData[5]?.accessRight == 2 || isButtonDisabled}
          >
            <Ripple />
            Withdraw
          </button>
          <button
            className={`mode-tab-button ${activeMode === "order" ? "mode-tab-active" : ""
              }`}
            onClick={() => {
              handleModeClick("order");
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
            }}
          >
            <Ripple />
            Order
          </button>
          <button
            className={`mode-tab-button ${activeMode === "settings" ? "mode-tab-active" : ""
              }`}
            onClick={() => {
              handleModeClick("settings");
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
            }}
          >
            <Ripple />
            Settings
          </button>
          {/* { isHidden &&
          <button
            className={`mode-tab-button ${activeMode === "update" ? "mode-tab-active" : ""
              }`}
            onClick={() => {
              handleModeClick("update");
            }}
            style={{
              position: 'relative',
              // left:'48%',
              overflow: 'hidden',
              isolation: 'isolate',
              
            }}
          >
            <Ripple />
            Promotions
          </button> 
          } */}
          {/* <button
              className={`mode-tab-button ${activeMode === "notifications" ? "mode-tab-active" : ""
              }`}
            onClick={() => {
              handleModeClick("notifications");
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
            }}
          >
            <Ripple />
            Notifications
          </button> */}

          <div style={{ position: 'absolute', left: '50%' }}>

            {!mobileMode && <NotificationsDropdown />}
          </div>
        </div>
        <div className={`order-panel ${orderPanelClass}`}>
          <div className="symbol-selector-container">
            <ReactSelect />
            {/* <Select className="testclass100"
              value={selectedSymbolOption}
              onChange={handleSymbolOptionChange}
              options={allSymbolOptions}
              isSearchable
              placeholder="Select Symbol"
              components={{ Option: CustomOption, MenuList: CustomMenuList }}
            /> */}
          </div>
          <div
            className="collapse-card-header"
            onClick={() => handleCollapseClick("orders")}
          >
            <label htmlFor="text">New Order</label>
            <div className="arrow-icons"  style={{color: selectedStyle.buyColor}}>
              <BsArrowUpSquare
                className={`${collapseState["orders"] ? "visible" : "hidden"}`}
              />
              <BsArrowDownSquare
                className={`${!collapseState["orders"] ? "visible" : "hidden"}`}
              />
            </div>
          </div>
          <div
            className={`collapse-card-container`}
            role={`${collapseState["orders"] ? "visible" : "hidden"}`}
          >
            <div className="collapse-card-wrapper">
              <div className="flex-container">
                <div>{selectedAuthSymbol}</div>
                {platFromData[1]?.dailyChange && (
                  <div className={parseFloat(platFromData[1].dailyChange.split('(')[0]) >= 0 ? 'positive' : 'negative'}>
                    {platFromData[1]?.dailyChange}
                  </div>
                )}
              </div>
              {
               false && symbolInfo?.swap_period &&
              <div className="flex-container">
                <div>Swap Countdown</div>
                <SwapCountdown />
              </div>
              }



              {
                !mobileMode &&
                // <div className="order-tabs">
                //   <button
                //     className={`tab-button ${selectedTab === "market" ? "order-tab-active" : ""
                //       }`}
                //     onClick={() => {
                //       handleTabClick("market");
                //     }}
                //     style={{
                //       position: 'relative',
                //       overflow: 'hidden',
                //       isolation: 'isolate',
                //     }}
                //   >
                //     <Ripple />
                //     Market
                //   </button>
                //   <button
                //     className={`tab-button ${selectedTab === "pending-order" ? "order-tab-active" : ""
                //       }`}
                //     onClick={() => {
                //       handleTabClick("pending-order");
                //     }}
                //     style={{
                //       position: 'relative',
                //       overflow: 'hidden',
                //       isolation: 'isolate',
                //     }}
                //   >
                //     <Ripple />
                //     Pending Order
                //   </button>
                //   {subscribed && (
                //     <button
                //       className={`tab-button ${selectedTab === "bot-trading" ? "order-tab-active" : ""
                //         }`}
                //       onClick={() => {
                //         handleTabClick("bot-trading");
                //         // mkRipple(e);
                //       }}
                //       style={{
                //         position: 'relative',
                //         overflow: 'hidden',
                //         isolation: 'isolate',
                //       }}
                //     >
                //       <Ripple />
                //       <span style={{
                //         display: 'flex',
                //         alignItems: 'center',
                //         justifyContent: 'center',
                //         gap: '0.5rem',
                //       }}>
                //         <span>
                //           iBot
                //         </span>
                //         <RiRobot2Line height={14} />
                //       </span>
                //     </button>
                //   )}
                // </div>
                <div className="order-tabs-binance">
                  <p
                    className={`tab-button-binance ${selectedTab === "market" ? "order-tab-active" : ""}`}
                    onClick={() => handleTabClick("market")}
                  >
                    Market Order
                  </p>

                  <p
                    className={`tab-button-binance ${selectedTab === "pending-order" ? "order-tab-active" : ""}`}
                    onClick={() => handleTabClick("pending-order")}
                  >
                    Pending Order
                  </p>

                  {subscribed && (
                    <button
                      className={`tab-button-binance ${selectedTab === "bot-trading" ? "order-tab-active" : ""}`}
                      onClick={() => handleTabClick("bot-trading")}
                    >
                      <span className="tab-content">
                        <span>iBot</span>
                        <RiRobot2Line size={14} />
                      </span>
                    </button>
                  )}
                </div>

                ||
                <div className="market-dropdown">
                  <Select
                    options={marketTypeOptions.filter((option) => {
                      if (option.value == "bot-trading") {
                        return subscribed
                      }
                      return true
                    })}
                    value={marketTypeOptions.find((option) => option.value === selectedTab)}
                    onChange={(selectedOption) => handleTabClick(selectedOption?.value)}
                    // styles={customStyle}
                    isSearchable={false}
                    menuPortalTarget={document.body}
                    styles={customStyles}
                  />
                </div>
              }

              {/* <div className="order-tabs">
                <button
                  className={`tab-button ${selectedTab === "market" ? "order-tab-active" : ""
                    }`}
                  onClick={() => {
                    handleTabClick("market");
                  }}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    isolation: 'isolate',
                  }}
                >
                  <Ripple />
                  Market
                </button>
                <button
                  className={`tab-button ${selectedTab === "pending-order" ? "order-tab-active" : ""
                    }`}
                  onClick={() => {
                    handleTabClick("pending-order");
                  }}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    isolation: 'isolate',
                  }}
                >
                  <Ripple />
                  Pending Order
                </button>
                {subscribed && (
                <button
                  className={`tab-button ${selectedTab === "bot-trading" ? "order-tab-active" : ""
                    }`}
                  onClick={() => {
                    handleTabClick("bot-trading");
                    // mkRipple(e);
                  }}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    isolation: 'isolate',
                  }}
                >
                  <Ripple />
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}>
                    <span>
                      iBot
                    </span>
                    <RiRobot2Line height={14} />
                  </span>
                </button>
                )}
              </div> */}

              {/* <div className="market-dropdown">
                <Select
                  options={marketTypeOptions.filter((option) => {
                    if (option.value == "bot-trading") {
                      return subscribed
                    }
                    return true
                  })}
                  value={marketTypeOptions.find((option) => option.value === selectedTab)}
                  onChange={(selectedOption) => handleTabClick(selectedOption?.value)}
                  // styles={customStyle}
                  isSearchable={false}
                  menuPortalTarget={document.body}
                  styles={customStyles}
                />
              </div> */}
              <div
                className={`order-section ${selectedTab === "market" ? "visible" : "hidden"
                  }`}
                id="market"
              >

                <MarketOrder selectedOrderTab={selectedTab} />
              </div>
              <div
                className={`order-section ${selectedTab === "pending-order" ? "visible" : "hidden"
                  }`}
                id="pending"
              >
                <PendingOrder selectedOrderTab={selectedTab} />
              </div>
              {subscribed && (
                <div
                  className={`order-section ${selectedTab === "bot-trading" ? "visible" : "hidden"
                    }`}
                  id="bot"
                >
                  <BotPanel selectedOrderTab={selectedTab} />
                </div>
              )}
            </div>
          </div>
          {isHidden &&
            <div
              className="collapse-card-header"
              onClick={() => handleCollapseClick("promotion")}
            >
              <label htmlFor="text">Promotion</label>
              <div className="arrow-icons"  style={{color: selectedStyle.buyColor}}>
                <BsArrowUpSquare
                  className={`${collapseState["promotion"] ? "visible" : "hidden"}`}
                />
                <BsArrowDownSquare
                  className={`${!collapseState["promotion"] ? "visible" : "hidden"}`}
                />
              </div>
            </div>
          }
          {/* prmotion section  */}
          {isHidden &&
            <div
              className={`collapse-card-container ${collapseState["promotion"] ? "visible" : "hidden"
                }`}
              role={`${collapseState["promotion"] ? "visible" : "hidden"}`}
            >
              <div className="collapse-card-wrapper">
                <UpdateSection />
              </div>
            </div>
          }

          {/* Symbols Info */}
          <div
            className="collapse-card-header"
            onClick={() => handleCollapseClick("symbols")}
          >
            <label htmlFor="text">Symbol Info</label>
            <div className="arrow-icons"  style={{color: selectedStyle.buyColor}}>
              <BsArrowUpSquare
                className={`${collapseState["symbols"] ? "visible" : "hidden"}`}
              />
              <BsArrowDownSquare
                className={`${!collapseState["symbols"] ? "visible" : "hidden"}`}
              />
            </div>
          </div>
          <div
            className={`collapse-card-container`}
            role={`${collapseState["symbols"] ? "visible" : "hidden"}`}
          >
            <div className="collapse-card-wrapper">
              <div className="symbol-info-panel">
                <ul className="symbol-info-list">
                  <li>
                    <strong>Pip Position</strong>{" "}
                    <span>{symbolInfo?.pip_position}</span>
                  </li>
                  <li>
                    <strong>Base Asset</strong> <span>{symbolInfo?.base_asset}</span>
                  </li>
                  <li>
                    <strong>Quote Asset</strong> <span>{symbolInfo?.quote_asset}</span>
                  </li>
                  {/* <li>
                    <strong>Swap (long)</strong>{" "}
                    <span>{parseInt(symbolInfo?.swap_long) || '\u2014'}</span>
                  </li>
                  <li>
                    <strong>Swap (short)</strong>{" "}
                    <span>{parseInt(symbolInfo?.swap_short) || '\u2014'}</span>
                  </li>
                  <li>
                    <strong>3-day swaps</strong>{" "}
                    <span>{parseInt(symbolInfo?.three_day_swaps) || '\u2014'}</span>
                  </li> */}
                  {symbolInfo?.hide_swap_details ? (
                    <>
                      <li>
                        <strong>Swap (long)</strong>{" "}
                        <span>{parseInt(symbolInfo?.swap_long) || '\u2014'}</span>
                      </li>
                      <li>
                        <strong>Swap (short)</strong>{" "}
                        <span>{parseInt(symbolInfo?.swap_short) || '\u2014'}</span>
                      </li>
                      <li>
                        <strong>3-day swaps</strong>{" "}
                        <span>{symbolInfo?.three_day_swaps || '\u2014'}</span>
                      </li>
                      <li>
                        <strong>Weekend swaps</strong>{" "}
                        <span>{symbolInfo?.weekend_swap || '\u2014'}</span>
                      </li>
                      <li>
                        <strong>Swap time (Server)</strong>{" "}
                        <span>{symbolInfo?.swap_time || '\u2014'}</span>
                      </li>
                      <li>
                        <strong>Swap period</strong>{" "}
                        <span>{symbolInfo?.swap_period || '\u2014'}</span>
                      </li>
                      <li>
                        <strong>Grace period</strong>{" "}
                        <span>{symbolInfo?.grace_period || '\u2014'}</span>
                      </li>
                    </>
                  ) : (<></>)}

                </ul>
              </div>
            </div>
          </div>

          {/* Markets sections */}
          {
            false && (<div
              className="collapse-card-header"
              onClick={() => handleCollapseClick("market_hours")}
            >
              <label htmlFor="text">Market Hours</label>
              <div className="arrow-icons"  style={{color: selectedStyle.buyColor}}>
                <BsArrowUpSquare
                  className={`${collapseState["market_hours"] ? "visible" : "hidden"
                    }`}
                />
                <BsArrowDownSquare
                  className={`${!collapseState["market_hours"] ? "visible" : "hidden"
                    }`}
                />
              </div>
            </div>)
          }
          <div
            className={`collapse-card-container`}
            role={`${collapseState["market_hours"] ? "visible" : "hidden"}`}
          >
            <div className="collapse-card-wrapper">
              <div className="market-hours-panel">
                <ul className="market-hours-list">
                  {Array.isArray(marketHours) &&
                    marketHours.map((market_hours, index) => {
                      return (
                        <li key={index}>
                          <strong>
                            {market_hours.start_day} {market_hours.start_time} -{" "}
                            {market_hours.end_time}
                          </strong>{" "}
                          <span>
                            <GoDotFill className={market_hours.is_active == true ? 'svg-green' : 'svg-red'} />
                          </span>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>
          </div>

          {/* leverage sections */}
          <div>
            {leverage && leverage.length > 0 && hideLeverageCard && (
              <div>
                <div
                  className="collapse-card-header"
                  onClick={() => handleCollapseClick("leverage")}
                >
                  <label htmlFor="text">Leverage</label>
                  <div className="arrow-icons" style={{color: selectedStyle.buyColor}}>
                    <BsArrowUpSquare
                      className={`${collapseState["leverage"] ? "visible" : "hidden"
                        }`}
                    />
                    <BsArrowDownSquare
                      className={`${!collapseState["leverage"] ? "visible" : "hidden"
                        }`}
                    />
                  </div>
                </div>
                <div
                  className={`collapse-card-container`}
                  role={`${collapseState["leverage"] ? "visible" : "hidden"}`}
                >
                  <div className="collapse-card-wrapper">
                    <div className="leverage-panel">
                      <ul className="leverage-list">
                        <li className="leverage-heading">
                          <strong>Volume</strong>
                          <strong>Leverage</strong>
                          <strong>Status</strong>
                        </li>
                        {leverage && Array.isArray(leverage[0]?.group_level_leverage) && leverage[0]?.group_level_leverage.length > 0 ? (
                          (() => {
                            const selectedOption = getExposureLevel(currentExposureLevel, leverage[0]?.group_level_leverage);
                            let isSelected = false;
                            return leverage[0]?.group_level_leverage.map((lvg, index) => {
                              const isLast = index === leverage[0].group_level_leverage.length - 1;
                              const getMinLvgVar = getMinimumLeverage(leverage[0].user_default_leverage, lvg.max_leverage, []);
                              isSelected = lvg?.exposure_level === selectedOption?.exposure_level;

                              const svgClass = isSelected ? 'svg-green' : 'svg-red';

                              return (
                                <li key={index}>
                                  <span style={{ display: 'flex', alignItems: 'center' }}>
                                    <span className="marginRight" style={{ textAlign: 'center', fontSize: '1.5em' }}>{isLast ? '∞' : '≤'}</span>
                                    <span style={{ textAlign: 'center', fontSize: '1.0em' }}>{lvg?.exposure_level}</span>
                                  </span>
                                  <span>1:{getMinLvgVar}</span>{" "}
                                  <span>
                                    <GoDotFill className={
                                      svgClass
                                    } />
                                  </span>
                                </li>
                              );
                            });
                          })()
                        )
                          : leverage && Array.isArray(leverage[0]?.symbol_default_leverage) && leverage[0]?.symbol_default_leverage.length > 0 ? (
                            (() => {
                              // Check if activeLvg matches all getMinLvgVar in symbol_default_leverage
                              let isSelected = false;
                              const selectedOption = getExposureLevel(currentExposureLevel, leverage[0]?.symbol_default_leverage);
                              return leverage[0]?.symbol_default_leverage?.map((lvg, index) => {
                                const isLast = index === leverage[0].symbol_default_leverage.length - 1;
                                const getMinLvgVar = getMinimumLeverage(leverage[0]?.user_default_leverage, [], lvg?.max_leverage);
                                isSelected = lvg?.exposure_level === selectedOption?.exposure_level;

                                const svgClass = isSelected ? 'svg-green' : 'svg-red';
                                return (
                                  <li key={index}>
                                    <span style={{ display: 'flex', alignItems: 'center' }}>
                                      <span className="marginRight" style={{ textAlign: 'center', fontSize: '1.5em' }}>{isLast ? '∞' : '≤'}</span>
                                      <span style={{ textAlign: 'center', fontSize: '1.0em' }}>{lvg?.exposure_level}</span>
                                    </span>
                                    <span>1:{getMinLvgVar}</span>{" "}
                                    <span>
                                      <GoDotFill className={
                                        svgClass
                                      } />
                                    </span>
                                  </li>
                                );
                              });
                            })()
                          ) : <li >
                            <span> </span>{" "}
                            <span>1:{leverage[0].user_default_leverage} </span>
                            <span><GoDotFill className={activeLvg == parseInt(leverage[0]?.user_default_leverage) ? 'svg-green' : 'svg-red'} /></span>
                          </li>
                        }
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
        <div className={`settings-right-panel ${settingsClass}`}>
          <div className="main-row">
            <div className="font-adjuster -setting-panel-divider header-select-container" >
              <h2>Current Time Zone</h2>
              <Select
                styles={orderCustomStyles}
                value={{
                  value: utcOffset,
                  label: `UTC ${utcOffset >= 0 ? '+' : ''}${utcOffset}`,
                }}
                onChange={handleChangeUTCOffset}
                options={options}
                menuPlacement="auto"
              />
            </div>
            <div className="font-adjuster -setting-panel-divider">
              <UTCTimeConverter />
            </div>
            <div className="font-adjuster -setting-panel-divider" style={{ borderBottom: "1px solid #232323" }}>
              <ServerTime />
            </div>
            <div className="tooltip-toggle font-adjuster -setting-panel-divider" style={{ borderBottom: "1px solid #232323" }}>
              <h2>Show Tooltip</h2>
              <div className="row-2-col-2" style={{ marginTop: "10px" }}>
                <Switch
                  subscribed={handleTooltipToggle}
                  handleToggle={handleTooltipToggle}
                  isChecked={showTooltip}
                // uncheckedIcon={false}
                // checkedIcon={false}
                // offColor="#888"
                // onColor="#4caf50"
                />
              </div>
            </div>
            <div
              className="tooltip-toggle font-adjuster -setting-panel-divider"
              style={{ borderBottom: "1px solid #232323" }}
            >
              <h2>Floating Window</h2>
              <div className="row-2-col-2" style={{ marginTop: "10px" }}>
                <Switch
                  handleToggle={() => setShowFloatingWindow(prev => !prev)}
                  isChecked={showFloatingWindow}
                  subscribed={setShowFloatingWindow}
                />
              </div>
            </div>
            <div className="style-settings-container font-adjuster -setting-panel-divider">
              <h2>Style Settings</h2>
              <div className="style-selector-wrapper">
                <button 
                  className="style-toggle-button"
                  onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
                >
                  <div className="style-preview">
                    {selectedStyle.colors.map((color, index) => (
                      <span 
                        key={index} 
                        className="color-swatch"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="style-name">{selectedStyle.name}</span>
                  <span className="dropdown-arrow">
                    {isStyleMenuOpen ? "▲" : "▼"}
                  </span>
                </button>

                {isStyleMenuOpen && (
                  <div className="style-options-menu">
                    {styleOptions.map((option) => (
                      <div
                        key={option.name}
                        className={`style-option ${selectedStyle.name === option.name ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedStyle(option);
                          setIsStyleMenuOpen(false);
                        }}
                      >
                        <div className="style-preview">
                          {option.colors.map((color, index) => (
                            <span 
                              key={index} 
                              className="color-swatch"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <span className="style-name">{option.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* <div className="tooltip-toggle font-adjuster -setting-panel-divider" style={{borderBottom:"1px solid #232323"}}>
              <h2>Show Bullets</h2>
              <div className="row-2-col-2" style={{ marginTop: "10px" }}>
                <Switch
                  subscribed={setShowBullets}
                  handleToggle={setShowBullets} 
                  isChecked={showBullets}
                  // uncheckedIcon={false}
                  // checkedIcon={false}
                  // offColor="#888"
                  // onColor="#4caf50"
                  />
              </div>
            </div> */}
          </div>
        </div>

        {isHidden &&
          <div className={`settings-right-panel ${updatePanelClass}`}>
            <div className="main-row">
              {/* <h1>Adds</h1> */}
            </div>
            {/* <UpdateSection /> */}
          </div>
        }

        <div className={`notification-right-panel ${notificationClass}`}>
          <div className="main-row">
            {/* < SystemNotification /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPanel; 
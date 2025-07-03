import React, { useState, useEffect } from "react";
import Spinner from "../../utils/spinner/Spinner";
import { toast } from "react-toastify";
import { useSymbolContext } from "../../../contexts/Symbol-Context.js";
import { API_ENDPOINT_OPEN_ORDER } from "../../../data/Endpoints-API.js";
import APIMiddleware from "../../../data/api/Api-Middleware.js";
import { useAccountManagerContext } from "../../../contexts/Account-Manager-Context.js";
import { useAuthContext } from "../../../contexts/Auth-Context.js";
import { useMetricsContext } from "../../../contexts/Metrics-Context.js";
import { useChartContext } from "../../../contexts/Chart-Context.js";
import { Order } from "../../../interfaces/Order.js";
import { formatPositionToPipSize, formatPrice, formatPriceUptoDecimals } from "../../../utils/format.js";
import { useOrderContext } from "../../../contexts/Order-Context.js";
import SLTP from "../market_order/OrderSLTP.jsx";
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';

import { Ripple } from 'react-ripple-click';
import 'react-ripple-click/dist/index.css';
import UTCTimeConverter from "../order_panel/UTCTimeConverter.jsx";

//Declaring props
interface ChildProps {
  selectedOrderTab: any;
}
const customStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: '15px !important',
    width: '150px',
    borderColor: '#484848 !important',
    backgroundColor: 'transparent !important',
    boxShadow: state.isFocused ? '#484848 !important' : provided.boxShadow,
    '&:hover': {
      borderColor: state.isFocused ? '#484848 !important' : provided.borderColor,
      cursor: 'pointer',
    },
    cursor: 'pointer',
  }),
  option: (provided, state) => ({
    ...provided,
    padding: '10px !important',
    color: 'white',
    borderColor: '#484848 !important',
    backgroundColor: state.isFocused ? 'rgb(33, 196, 109) !important;' : null,
    '&:hover': {
      backgroundColor: 'rgb(33, 196, 109) !important',
    },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: '#3b3a3a !important',
    zIndex: 111,
  }),
  menuList: (provided) => ({
    ...provided,
    maxHeight: '120px',
    overflowY: 'auto',
  }),
  input: (provided) => ({
    ...provided,
    padding: '0 !important'
  }),
};
const orderCustomStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: '15px !important',
    width: '75px',
    borderColor: '#484848 !important',
    backgroundColor: 'transparent !important',
    boxShadow: state.isFocused ? '#484848 !important' : provided.boxShadow,
    '&:hover': {
      borderColor: state.isFocused ? '#484848 !important' : provided.borderColor,
      cursor: 'pointer',
    },
    cursor: 'pointer',
  }),
  option: (provided, state) => ({
    ...provided,
    padding: '10px !important',
    color: 'white',
    borderColor: '#484848 !important',
    backgroundColor: state.isFocused ? 'rgb(33, 196, 109) !important;' : null,
    '&:hover': {
      backgroundColor: 'rgb(33, 196, 109) !important',
    },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: '#3b3a3a !important',
    zIndex: 111,
  }),
  menuList: (provided) => ({
    ...provided,
    maxHeight: '120px',
    overflowY: 'auto',
  }),
  input: (provided) => ({
    ...provided,
    padding: '0 !important'
  }),
};

const PendingOrder: React.FC<ChildProps> = ({ selectedOrderTab }) => {
  //CONTEXT
  const {
    loadingSymbolContext,

    bidPrice,
    askPrice,
      askPriceExchangeRate,
    bidPriceExchangeRate,
    symbolInfo,
    marketHours,
    symbolData,
    allSymbolOptions,
    selectedSymbolOption,
    handleSymbolOptionChange,
    leverage,
    selectedSymbolExchangeRate,
    lotSteps,
    lotSize,
    unitOptions
  } = useSymbolContext();
  const { openOrder, setActiveTab } = useAccountManagerContext();
  const { user, sendDataToServer, selectedAuthSymbol, platFromData } = useAuthContext();
  const { metrics } = useMetricsContext();
  const { selectedStyle } = useChartContext();
  const [buyActive, setBuyActive] = useState(true);
  const [sellActive, setSellActive] = useState(false);
  const [direction, setDirection] = useState("");
  const [orderQuantity, setOrderQuantity] = useState<number | null>(0);
  const [stopLoss, setStopLoss] = useState(0.0);
  const [slPips, setSlPips] = useState(0.0);
  const [tpPips, setTpPips] = useState(0.0);
  const [takeProfit, setTakeProfit] = useState(0.0);
  const [orderEntryPrice, setOrderEntryPrice] = useState(0.0);
  const [expiresAt, setExpiresAt] = useState("");
  // const [quantity, setQuantity] = useState();

  const [pointerEvents, setPointerEvents] = useState("all");

  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [preDefineQuantities, setPreDefineQuantities] = useState("false");
  const [orderComment, setOrderComment] = useState("");
  const [assetState, setAssetState] = useState({
    type: "quote_asset",
    name: symbolInfo.quote_asset,
  });
  const [amount, setAmount] = useState<number | null>(0);
  const [expiresAtStatus, setExpiresAtStatus] = useState(false);
  const [isOrderOpening, setIsOrderOpening] = useState(false);
  const [selectedLotStep, setSelectedLotStep] = useState(0.0);
  const [selectedLotStepOption, setSelectedLotStepOption] = useState({ value: 0.0, label: '0.0 Lots' });
  const [inputValue, setInputValue] = useState('');

  const [inputQtyValue, setInputQtyValue] = useState('');
  const [selectedQtyOption, setSelectedQtyOption] = useState({ value: 0.0, label: '0.0' });
  const formatCreateLabelLots = (inputValue) => `${inputValue} Lots`;
  const formatCreateLabelQty = (inputValue) => `${inputValue}`;
  const [assetOptions, setAssetOptions] = useState('false');
  const [focusOut, setFocusOut] = useState(true);

  useEffect(() => {
    const category = localStorage.getItem('category');
    if (category == "1") {
     setOrderQuantity("");
      setSelectedQtyOption({ value: 0.1, label: '0.1' });
    } else {
           setAmount("")
      setSelectedLotStepOption({ value: 1000, label: '1k' });
  
    }

  }, [selectedAuthSymbol, localStorage.getItem('category')]);

  const handleProfitChange = (data) => {
    setTakeProfit(data)
  };
  const handleLossChange = (data) => {
    setStopLoss(data)
  };
  const handleTPPipsChange = (data) => {
    setTpPips(data)
  };
  const handleSLPipsChange = (data) => {
    setSlPips(data)
  };
  useEffect(() => {
    // setSelectedAssetId(symbolInfo.asset_id)
    if (symbolInfo.asset_id == 1) {
      setAssetState({
        type: "quote_asset",
        name: symbolInfo.quote_asset
      });
    }
    else {
      setAssetState({
        type: "base_asset",
        name: symbolInfo.base_asset
      });
    }
    if (symbolInfo.trade_type === 'units') {
      // const unitFirst = unitOptions?.length > 0 ? unitOptions[0] : { value: 0.1, label: '0.1' };
      const unitFirst = unitOptions?.length > 0 ? unitOptions[0] : { value: 1000, label: '1k' };
      setSelectedQtyOption(unitFirst);
    } else {
      // const lotFirst = lotSteps?.length > 0 ? lotSteps[0] : { value: 0.1, label: '0.1' };
      const lotFirst = lotSteps?.length > 0 ? lotSteps[0] : { value: 1000, label: '1k' };
      setSelectedLotStep(parseFloat(lotFirst.value));
      setSelectedLotStepOption(lotFirst);
    }
  }, [lotSteps, symbolInfo, unitOptions]);
 

  //  useEffect(() => {
  //   setQuantity(0.00);
  // }, [symbolInfo]);

  // console.log("symbolInfo.base_asset:", symbolInfo.base_asset);
  // console.log("symbolInfo.quote_asset:", symbolInfo.quote_asset);



  // useEffect(() => {
  // }, [
  //   bidPrice,
  //   askPrice,
  //   orderEntryPrice,
  // ]);



  useEffect(() => {
    if (selectedOrderTab === "pending-order" && bidPrice > 0 && askPrice) {
      setOrderEntryPrice(
        direction == "Buy" ? parseFloat(askPrice) : parseFloat(bidPrice)
      );
    }
  }, [selectedOrderTab, direction, selectedAuthSymbol]);

  useEffect(() => {
    setTakeProfit(0.0);
    setStopLoss(0.0);
    setSelectedLotStep(0.0);
  }, [selectedAuthSymbol]);


  const handleDateTimeChange = (event) => {
    setExpiresAt(event);
  };
  const handleDisabledButton = (data) => {
    setIsButtonDisabled(data)
  };
  useEffect(() => {
    //If amount entry price and quantity is not null or nan then it will pass to the condition
    if (!isNaN(amount) && !isNaN(orderEntryPrice) && !isNaN(orderQuantity)) {
      //If the selected type is base asset (BTC)
      //then it will set amount according to given quantity
      if (assetState.type === "base_asset") {
        if (orderQuantity > 0 && orderEntryPrice > 0) {
        setAmount(orderEntryPrice * orderQuantity);
        }
      }
      //If the selected type is quote asset (USDT)
      //then it will set quantity according to given amount
      else if (assetState.type === "quote_asset") {
        if (amount > 0 && orderEntryPrice > 0) {
          setOrderQuantity(amount / orderEntryPrice);
        }
      }
    }
  }, [amount, orderQuantity, orderEntryPrice]);


  const handleAssetChange = (e) => {
    // const { value } = selectedOption;
    setAmount(0.00);
    setOrderQuantity('');
    setInputQtyValue('');

    // setSelectedQtyOption({ value: 1000, label: '1k' });

    // Create a new object with updated values based on selection
    // const updatedAssetState = {
    //   type: value === symbolInfo.base_asset ? "base_asset" : "quote_asset",
    //   name: value,
    // };

    // // Update the state using the updated object
    // setAssetState(updatedAssetState);

    const updatedAssetState = {
      type: e === symbolInfo.base_asset ? "base_asset" : "quote_asset",
      name: e,
    };
    // Update the state using the updated object
    setAssetState(updatedAssetState);
  };
  const customStyle = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '3px !important',
      width: '75px',
      borderColor: '#484848 !important',
      backgroundColor: '#00000000!important',
      marginLeft: '10px !important', // Add margin on the left
      boxShadow: state.isFocused
        ? '0 0 50px #484848 !important'
        : provided.boxShadow,
      cursor: 'pointer',
      '&:hover': {
        borderColor: 'rgb(33, 196, 109) !important',
        cursor: 'pointer',
        boxShadow: '0 0 0 transparent !important',
      },
    }),
    singleValue: (provided, state) => ({
      ...provided,
      paddingLeft: '10px !important',
      borderColor: state.isFocused
        ? 'rgb(33, 196, 109) !important'
        : '#484848 !important',
      color: '#c5c5c5 !important',
    }),
    option: (provided, state, inSettings = true) => ({
      ...provided,
      padding: inSettings ? '0.3rem !important' : '0 !important',
      cursor: 'pointer',
      color: state.isSelected
        ? 'rgb(33, 196, 109) !important'
        : '#c5c5c5 !important',
      borderBottom: '1px solid #232323',
      backgroundColor: state.isSelected ? '#232323 !important' : 'transparent',
      '&:hover': {
        backgroundColor: 'rgb(33, 196, 109) !important',
        color: '#2d2d2d !important',
      },
      '&:nth-last-child(1)': {
        borderBottom: 'none !important',
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#3b3a3a !important',
      margin: '0.3rem 0.8rem 0 1rem !important', // Add margin on the left
      zIndex: 111,
      left: '-10px', // Adjust position if needed
      width: '80px',
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '100px', // Reduced height
      minHeight: '3px',
      width: '80px', // Ensures the menu list width matches the menu container
      overflowY: 'auto',
    }),
  };


  const expiryDate = (e) => {
    if (e.target.checked == true) {
      e.target.parentNode.children[0].setAttribute("aria-checked", true);
      setExpiresAtStatus(e.target.checked);
    } else {
      e.target.parentNode.children[0].setAttribute("aria-checked", false);
      setExpiresAt("");
      setExpiresAtStatus(e.target.checked);
    }
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

  const countLetters = (e) => {
    const counter = e.target.value.split("").length;
    const countBox = document.getElementById("count-comment-letters-po");
    if (counter <= 100 && countBox != null) {
      countBox.innerText = counter;
    } else {
      e.target.value = e.target.value.slice(0, 100);
    }
  };

  const handleBuySellOrderClick = (buy: boolean) => {
    setBuyActive(buy);
    setSellActive(!buy);
    setDirection(buy ? "Buy" : "Sell");
  };

  const handleSLTPDirectionChange = (direction) => {
    setDirection(direction);
    setBuyActive(direction == "Buy" ? true : false);
    setSellActive(direction != "Buy" ? true : false);
    // localStorage.setItem('directions', direction == "Buy" ? 'buy' : 'sell');
  }

  const placeOrder = (dir) => {
    if (user && user.userId != undefined && user.userId > 0) {
      setIsOrderOpening(true);
      setActiveTab("open-orders-acc");
      placePendingOrder(dir);
    }
  };

  const placePendingOrder = (dir) => {
    if (orderEntryPrice > 0) {
      if (dir && orderQuantity > 0 && orderEntryPrice > 0) {
        // Calculate required margin based on trading logic
        // const requiredMargin = calculateOrderRequiredMargin();
        const requiredMargin = dir == "Buy" ? calculateRequiredMarginAccToAskPrice() : calculateRequiredMarginAccToBidPrice();

        // Check if the user has enough balance
        if (requiredMargin < 10) {
          // Show an alert for insufficient balance
          toast.error(`Margin Should be greater than 10 ${metrics?.userCurrencyName || 'EUR'}.`, {
            position: "top-right",
          });
          document.getElementById("closeSound").play();
          setIsOrderOpening(false);
        } else if (metrics.equity >= requiredMargin) {
          // Continue with opening the position
          openPendingOrder_api(requiredMargin, dir);
        } else {
          // Show an alert for insufficient balance
          toast.error("Insufficient equity to open the order.", {
            position: "top-right",
          });
          document.getElementById("closeSound").play();
          setIsOrderOpening(false);
        }
      } else {
        toast.error("Order Quantity should be greater than 0.", {
          position: "top-right",
        });
        setIsOrderOpening(false);
      }
    } else {
      toast.error("Entry Price should be greater than 0.", {
        position: "top-right",
      });
      setIsOrderOpening(false);
    }
  };

  // const calculateOrderRequiredMargin = () => {
  //   let reqMarginWithoutLeverage = orderQuantity * orderEntryPrice * selectedSymbolExchangeRate;

  //   if (
  //     platFromData[6] &&
  //     platFromData[6].availableLeverage &&
  //     Array.isArray(platFromData[6].availableLeverage) &&
  //     platFromData[6].availableLeverage.length > 0 &&
  //     platFromData[6].availableLeverage[0]?.available_leverage &&
  //     Array.isArray(platFromData[6].availableLeverage[0].available_leverage) &&
  //     platFromData[6].availableLeverage[0].available_leverage.length > 0 &&
  //     Array.isArray(platFromData[6].availableLeverage[0].available_leverage[0]?.group_level_leverage) &&
  //     platFromData[6].availableLeverage[0].available_leverage[0].group_level_leverage.length > 0
  //   ) {

  //     let symbolLeverage = platFromData[6]?.availableLeverage[0]?.available_leverage[0].group_level_leverage.sort((a, b) => {
  //       const aLevel = a && a.exposure_level !== null && a.exposure_level !== undefined
  //         ? parseFloat(a.exposure_level)
  //         : Infinity;
  //       const bLevel = b && b.exposure_level !== null && b.exposure_level !== undefined
  //         ? parseFloat(b.exposure_level)
  //         : Infinity;
  //       return aLevel - bLevel;
  //     });

  //     let groupMinLeverage = symbolLeverage.filter(lev => {
  //       // Ensure `lev.exposure_level` exists and is a valid number before comparison
  //       const exposureLevel = lev && lev.exposure_level !== null && lev.exposure_level !== undefined
  //         ? parseFloat(lev.exposure_level)
  //         : NaN;
  //       return !isNaN(exposureLevel) && exposureLevel >= reqMarginWithoutLeverage;
  //     })




  //     let groupDefaultLeverage

  //     if (platFromData[6]?.availableLeverage[0]?.available_leverage[0].group_level_leverage.length > 0 && groupMinLeverage.length == 0) {
  //       groupDefaultLeverage = symbolLeverage[symbolLeverage.length - 1]
  //     } else {
  //       groupDefaultLeverage = groupMinLeverage[0];
  //     }

  //     let minimumLeverage = 1;
  //     if (platFromData[6]?.availableLeverage[0]?.available_leverage[0]) {
  //       minimumLeverage = getMinimumLeverage(
  //         platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage,
  //         groupDefaultLeverage.max_leverage,
  //         []
  //       );
  //     }
  //     const lvg = minimumLeverage || 1;
  //     const converted_entry_price = orderEntryPrice * selectedSymbolExchangeRate
  //     const requiredMargin = orderQuantity * (converted_entry_price / lvg);
  //     return isNaN(requiredMargin)
  //       ? 0
  //       : requiredMargin < 1 ? requiredMargin.toFixed(5)
  //         : Math.round(requiredMargin * 10) / 10
  //   } else if (
  //     platFromData[6] &&
  //     platFromData[6].availableLeverage &&
  //     Array.isArray(platFromData[6].availableLeverage) &&
  //     platFromData[6].availableLeverage.length > 0 &&
  //     platFromData[6].availableLeverage[0]?.available_leverage &&
  //     Array.isArray(platFromData[6].availableLeverage[0].available_leverage) &&
  //     platFromData[6].availableLeverage[0].available_leverage.length > 0 &&
  //     Array.isArray(platFromData[6].availableLeverage[0].available_leverage[0]?.symbol_default_leverage) &&
  //     platFromData[6].availableLeverage[0].available_leverage[0].symbol_default_leverage.length > 0
  //   ) {
  //     let symbolLeverage = platFromData[6]?.availableLeverage[0]?.available_leverage[0].symbol_default_leverage.sort((a, b) => {
  //       // Handle missing or invalid `exposure_level` values using parseFloat
  //       const aLevel = a && a.exposure_level !== null && a.exposure_level !== undefined
  //         ? parseFloat(a.exposure_level)
  //         : Infinity;
  //       const bLevel = b && b.exposure_level !== null && b.exposure_level !== undefined
  //         ? parseFloat(b.exposure_level)
  //         : Infinity;
  //       return aLevel - bLevel;
  //     })

  //     let symbolMinLeverage = symbolLeverage.filter(lev => {
  //       // Ensure `lev.exposure_level` exists and is a valid number before comparison
  //       const exposureLevel = lev && lev.exposure_level !== null && lev.exposure_level !== undefined
  //         ? parseFloat(lev.exposure_level)
  //         : NaN;
  //       return !isNaN(exposureLevel) && exposureLevel >= reqMarginWithoutLeverage;
  //     })

  //     let symbolDefaultLeverage

  //     if (platFromData[6]?.availableLeverage[0]?.available_leverage[0].symbol_default_leverage.length > 0 && symbolMinLeverage.length == 0) {
  //       symbolDefaultLeverage = symbolLeverage[symbolLeverage.length - 1]
  //     } else {
  //       symbolDefaultLeverage = symbolMinLeverage[0];
  //     }

  //     let minimumLeverage = 1;
  //     if (platFromData[6]?.availableLeverage[0]?.available_leverage[0]) {
  //       minimumLeverage = getMinimumLeverage(
  //         platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage,
  //         [],
  //         symbolDefaultLeverage.max_leverage,

  //       );
  //     }
  //     const lvg = minimumLeverage || 1;
  //     const converted_entry_price = orderEntryPrice * selectedSymbolExchangeRate
  //     const requiredMargin = orderQuantity * (converted_entry_price / lvg);
  //     return isNaN(requiredMargin)
  //       ? 0
  //       : requiredMargin < 1 ? requiredMargin.toFixed(5)
  //         : Math.round(requiredMargin * 10) / 10
  //   } else if (platFromData[6] &&
  //     platFromData[6].availableLeverage &&
  //     Array.isArray(platFromData[6].availableLeverage) &&
  //     platFromData[6].availableLeverage.length > 0 &&
  //     platFromData[6].availableLeverage[0]?.available_leverage &&
  //     Array.isArray(platFromData[6].availableLeverage[0].available_leverage) &&
  //     platFromData[6].availableLeverage[0].available_leverage.length > 0 &&
  //     platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage) {

  //     const lvg = platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage || 1;
  //     console.log("minimumLeverage", lvg)
  //     const converted_entry_price = orderEntryPrice * selectedSymbolExchangeRate
  //     const requiredMargin = orderQuantity * (converted_entry_price / lvg);
  //     return isNaN(requiredMargin)
  //       ? 0
  //       : requiredMargin < 1 ? requiredMargin.toFixed(5)
  //         : Math.round(requiredMargin * 10) / 10

  //   }
  // };
  const calculateRequiredMarginAccToAskPrice = () => {
    let reqMarginWithoutLeverage = orderQuantity * askPrice * selectedSymbolExchangeRate *askPriceExchangeRate;

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
    ) {

      let symbolLeverage = platFromData[6]?.availableLeverage[0]?.available_leverage[0].group_level_leverage.sort((a, b) => {
        const aLevel = a && a.exposure_level !== null && a.exposure_level !== undefined
          ? parseFloat(a.exposure_level)
          : Infinity;
        const bLevel = b && b.exposure_level !== null && b.exposure_level !== undefined
          ? parseFloat(b.exposure_level)
          : Infinity;
        return aLevel - bLevel;
      });

      let groupMinLeverage = symbolLeverage.filter(lev => {
        // Ensure `lev.exposure_level` exists and is a valid number before comparison
        const exposureLevel = lev && lev.exposure_level !== null && lev.exposure_level !== undefined
          ? parseFloat(lev.exposure_level)
          : NaN;
        return !isNaN(exposureLevel) && exposureLevel >= reqMarginWithoutLeverage;
      })




      let groupDefaultLeverage

      if (platFromData[6]?.availableLeverage[0]?.available_leverage[0].group_level_leverage.length > 0 && groupMinLeverage.length == 0) {
        groupDefaultLeverage = symbolLeverage[symbolLeverage.length - 1]
      } else {
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
      const converted_entry_price = askPrice * selectedSymbolExchangeRate *askPriceExchangeRate;
      const requiredMargin = orderQuantity * (converted_entry_price / lvg);
      return isNaN(requiredMargin)
        ? 0
        : requiredMargin < 1 ? requiredMargin?.toFixed(5)
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
    ) {
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

      let symbolMinLeverage = symbolLeverage.filter(lev => {
        // Ensure `lev.exposure_level` exists and is a valid number before comparison
        const exposureLevel = lev && lev.exposure_level !== null && lev.exposure_level !== undefined
          ? parseFloat(lev.exposure_level)
          : NaN;
        return !isNaN(exposureLevel) && exposureLevel >= reqMarginWithoutLeverage;
      })

      let symbolDefaultLeverage

      if (platFromData[6]?.availableLeverage[0]?.available_leverage[0].symbol_default_leverage.length > 0 && symbolMinLeverage.length == 0) {
        symbolDefaultLeverage = symbolLeverage[symbolLeverage.length - 1]
      } else {
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
      const converted_entry_price = askPrice * selectedSymbolExchangeRate *askPriceExchangeRate;
      const requiredMargin = orderQuantity * (converted_entry_price / lvg);
      return isNaN(requiredMargin)
        ? 0
        : requiredMargin < 1 ? requiredMargin?.toFixed(5)
          : Math.round(requiredMargin * 10) / 10
    } else if (platFromData[6] &&
      platFromData[6].availableLeverage &&
      Array.isArray(platFromData[6].availableLeverage) &&
      platFromData[6].availableLeverage.length > 0 &&
      platFromData[6].availableLeverage[0]?.available_leverage &&
      Array.isArray(platFromData[6].availableLeverage[0].available_leverage) &&
      platFromData[6].availableLeverage[0].available_leverage.length > 0 &&
      platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage) {

      const lvg = platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage || 1;
      console.log("minimumLeverage", lvg)
      const converted_entry_price = askPrice * selectedSymbolExchangeRate *askPriceExchangeRate;
      const requiredMargin = orderQuantity * (converted_entry_price / lvg);
      return isNaN(requiredMargin)
        ? 0
        : requiredMargin < 1 ? requiredMargin?.toFixed(5)
          : Math.round(requiredMargin * 10) / 10

    }
  };
  const calculateRequiredMarginAccToBidPrice = () => {
    let reqMarginWithoutLeverage = orderQuantity * bidPrice * selectedSymbolExchangeRate * bidPriceExchangeRate;

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
    ) {

      let symbolLeverage = platFromData[6]?.availableLeverage[0]?.available_leverage[0].group_level_leverage.sort((a, b) => {
        const aLevel = a && a.exposure_level !== null && a.exposure_level !== undefined
          ? parseFloat(a.exposure_level)
          : Infinity;
        const bLevel = b && b.exposure_level !== null && b.exposure_level !== undefined
          ? parseFloat(b.exposure_level)
          : Infinity;
        return aLevel - bLevel;
      });

      let groupMinLeverage = symbolLeverage.filter(lev => {
        // Ensure `lev.exposure_level` exists and is a valid number before comparison
        const exposureLevel = lev && lev.exposure_level !== null && lev.exposure_level !== undefined
          ? parseFloat(lev.exposure_level)
          : NaN;
        return !isNaN(exposureLevel) && exposureLevel >= reqMarginWithoutLeverage;
      })




      let groupDefaultLeverage

      if (platFromData[6]?.availableLeverage[0]?.available_leverage[0].group_level_leverage.length > 0 && groupMinLeverage.length == 0) {
        groupDefaultLeverage = symbolLeverage[symbolLeverage.length - 1]
      } else {
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
      const converted_entry_price = bidPrice * selectedSymbolExchangeRate* bidPriceExchangeRate;
      const requiredMargin = orderQuantity * (converted_entry_price / lvg);
      return isNaN(requiredMargin)
        ? 0
        : requiredMargin < 1 ? requiredMargin?.toFixed(5)
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
    ) {
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

      let symbolMinLeverage = symbolLeverage.filter(lev => {
        // Ensure `lev.exposure_level` exists and is a valid number before comparison
        const exposureLevel = lev && lev.exposure_level !== null && lev.exposure_level !== undefined
          ? parseFloat(lev.exposure_level)
          : NaN;
        return !isNaN(exposureLevel) && exposureLevel >= reqMarginWithoutLeverage;
      })

      let symbolDefaultLeverage

      if (platFromData[6]?.availableLeverage[0]?.available_leverage[0].symbol_default_leverage.length > 0 && symbolMinLeverage.length == 0) {
        symbolDefaultLeverage = symbolLeverage[symbolLeverage.length - 1]
      } else {
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
      const converted_entry_price = bidPrice * selectedSymbolExchangeRate* bidPriceExchangeRate;
      const requiredMargin = orderQuantity * (converted_entry_price / lvg);
      return isNaN(requiredMargin)
        ? 0
        : requiredMargin < 1 ? requiredMargin?.toFixed(5)
          : Math.round(requiredMargin * 10) / 10
    } else if (platFromData[6] &&
      platFromData[6].availableLeverage &&
      Array.isArray(platFromData[6].availableLeverage) &&
      platFromData[6].availableLeverage.length > 0 &&
      platFromData[6].availableLeverage[0]?.available_leverage &&
      Array.isArray(platFromData[6].availableLeverage[0].available_leverage) &&
      platFromData[6].availableLeverage[0].available_leverage.length > 0 &&
      platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage) {

      const lvg = platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage || 1;
      console.log("minimumLeverage", lvg)
      const converted_entry_price = bidPrice * selectedSymbolExchangeRate* bidPriceExchangeRate;
      const requiredMargin = orderQuantity * (converted_entry_price / lvg);
      return isNaN(requiredMargin)
        ? 0
        : requiredMargin < 1 ? requiredMargin?.toFixed(5)
          : Math.round(requiredMargin * 10) / 10

    }
  };

  //#region API CALLS

  const openPendingOrder_api = async (margin, dir) => {
    try {
      const currentDate = new Date();
      const currentDateTime = new Date(currentDate);

      const data: Order = {
        id: -1,
        created_at: null,
        symbol: selectedAuthSymbol,
        quantity: orderQuantity,
        amount: amount,
        asset_type: assetState.type,
        // direction: direction,
        entry_price: orderEntryPrice,
   
        direction: dir,
        // entry_price: dir == "Buy" ? askPrice : bidPrice,
        // converted_entry_price: (dir == "Buy" ? askPrice : bidPrice) * selectedSymbolExchangeRate,
        TP: takeProfit,
        SL: stopLoss,
        netEUR: 0, // Set appropriate values
        status: "",
        quote_asset: symbolInfo.quote_asset,
        userId: user.userId,
        margin: margin,
        exit_price: 0,
        totalUnrealizedPnL: metrics.totalUnrealizedPnL,
        order_id: "OID" + Math.floor(100000 + Math.random() * 900000),
        status_updated_at: null,
        expires_at: expiresAt ? expiresAt : null,
        comment: orderComment,
        lot_step: selectedLotStep,
        trade_type: symbolInfo.trade_type,
        lot_size: lotSize
      };

      const response = await APIMiddleware.post(API_ENDPOINT_OPEN_ORDER(), data);

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
      toast.success("Order opened successfully!", { position: "top-right" });
      document.getElementById("openSound").play();
      localStorage.accountManager = "open-orders-acc";
      setIsOrderOpening(false);
    } catch (error) {
      toast.error(error.response.data.error, { position: "top-right" });
      // Handle API request error
      console.error(`API request error: ${API_ENDPOINT_OPEN_ORDER()}`, error);
      setIsOrderOpening(false);
    }
  };

  const handleLotStepOptionChange = (lotStep) => {
    setSelectedLotStep(parseFloat(lotStep.value));
    setSelectedLotStepOption(lotStep);
  }

  const handleInputChange = (value) => {
    const sanitizedValue = value.replace(/[^0-9.]/g, '');

    // Split the input into parts if multiple dots are present
    const floatValueParts = sanitizedValue.split('.');

    // Allow only one dot and concatenate valid parts
    const validValue = floatValueParts.length > 2
      ? `${floatValueParts[0]}.${floatValueParts[1]}`
      : sanitizedValue;

    // Update the state with the valid value
    setInputValue(validValue);
  };

  const handleQtyOptionChange = (option) => {
    setOrderQuantity(parseFloat(option.value));
    setSelectedQtyOption(option);
  }

  const handleQtyInputChange = (value) => {
    const sanitizedValue = value.replace(/[^0-9.]/g, '');
    const floatValueParts = sanitizedValue.split('.');
    // Allow only one dot and concatenate valid parts
    const validValue = floatValueParts.length > 2
      ? `${floatValueParts[0]}.${floatValueParts[1]}`
      : sanitizedValue;
    // Update the state with the valid value
    setInputQtyValue(validValue);
  };

  //show spinner while loading data
  if (loadingSymbolContext) {
    return <Spinner />;
  }

  return (
    <>
      <div className="spread-equity">
        Avbl:{' '}
        {metrics?.equity !== undefined ? metrics?.freeMargin?.toFixed(2) : '0.00'}{' '}
        {user?.userCurrencyName || 'EUR'}
      </div>
      <div className="input-wrapper">
        <label htmlFor="order-input" className="order-label">
          Price:
        </label>
        <div className="crypto-input">
          <input
            type="number"
            placeholder="0.00"
            id="order-entry-price"
            className="order-input"
            value={orderEntryPrice}
            onChange={(e) => setOrderEntryPrice(parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="input-wrapper">
        <label htmlFor="order-label">Size:</label>
        <div className="crypto-input">
          {
            assetState.type === "base_asset" ? (
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={orderQuantity ?? ""}
                id="amount-input"
                maxLength={10}
                onChange={(e) => {
                  const val = e.target.value;
                  // Optional: allow only valid numeric input
                  if (/^\d*\.?\d*$/.test(val)) {
                    setOrderQuantity(parseFloat(val || 0));
                  }
                }}
                onKeyDown={(e) => {
                  // Prevent scientific notation and math symbols
                  if (['e', 'E', '+', '-'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            ) : (
              <input
                type="number"
                inputMode="decimal"
                value={amount || ""}
                placeholder="0.00"
                id="amount-input"
                maxLength={10}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*\.?\d*$/.test(val)) {
                    setAmount(parseFloat(val || 0));
                  }
                }}
                onKeyDown={(e) => {
                  if (['e', 'E', '+', '-'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            )
          }

          {/* <select onChange={(e) => handleAssetChange(e.target.value)}>
    {assetState.type === "base_asset" ? (
      <>
        <option value={symbolInfo.base_asset}>{symbolInfo.base_asset}</option>
        <option value={symbolInfo.quote_asset}>{symbolInfo.quote_asset}</option>
      </>
    ) : (
      <>
        <option value={symbolInfo.quote_asset}>{symbolInfo.quote_asset}</option>
        <option value={symbolInfo.base_asset}>{symbolInfo.base_asset}</option>
      </>
    )}
  </select> */}

          <div className="new-asset">
            <div className="-select-asset">
              <div className="asset-icon"></div>
              <div
                className="selectedAsset"
                onClick={() => {
                  // setAssetOptions('true');
                  setAssetOptions((prev) => {
                    const current = prev === true || prev === 'true';
                    const newValue = !current;

                    setFocusOut(!newValue); // When assetOptions is true, setFocusOut to false

                    // Return new value in the same type as original
                    return typeof prev === 'string'
                      ? String(newValue)
                      : newValue;
                  });
                  // setFocusOut(false)
                }}
              >
                <p>{assetState.name}</p>
                <svg viewBox="0 0 16 16" aria-selected={assetOptions}>
                  <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
                </svg>
              </div>
            </div>

            {assetState.type === 'base_asset' ? (
              <div
                className="custom-options-assets-binance"
                aria-selected={assetOptions}
              >
                <div
                  className={`option-asset ${assetState.name === symbolInfo.base_asset ? 'selected' : ''}`}
                  onClick={() => {
                    handleAssetChange(symbolInfo.base_asset);
                    setAssetOptions('false');
                    setFocusOut(true);
                  }}
                >
                  <div className="left">
                    <p>{symbolInfo.base_asset}</p>
                    {assetState.name === symbolInfo.base_asset && (
                      <svg className="checkmark" viewBox="0 0 16 16">
                        <path
                          fill="currentColor"
                          d="M13.485 1.929l-7.071 7.071-3.535-3.535-1.414 1.414 4.95 4.95 8.485-8.485z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div
                  className={`option-asset ${assetState.name === symbolInfo.quote_asset ? 'selected' : ''}`}
                  onClick={() => {
                    handleAssetChange(symbolInfo.quote_asset);
                    setAssetOptions('false');
                    setFocusOut(true);
                  }}
                >
                  <div className="left">
                    <p>{symbolInfo.quote_asset}</p>
                    {assetState.name === symbolInfo.quote_asset && (
                      <svg className="checkmark" viewBox="0 0 16 16">
                        <path
                          fill="currentColor"
                          d="M13.485 1.929l-7.071 7.071-3.535-3.535-1.414 1.414 4.95 4.95 8.485-8.485z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="custom-options-assets-binance"
                aria-selected={assetOptions}
              >
                <div
                  className={`option-asset ${assetState.name === symbolInfo.base_asset ? 'selected' : ''}`}
                  onClick={() => {
                    handleAssetChange(symbolInfo.base_asset);
                    setAssetOptions('false');
                    setFocusOut(true);
                  }}
                >
                  <div className="left">
                    <p>{symbolInfo.base_asset}</p>
                    {assetState.name === symbolInfo.base_asset && (
                      <svg className="checkmark" viewBox="0 0 16 16">
                        <path
                          fill="currentColor"
                          d="M13.485 1.929l-7.071 7.071-3.535-3.535-1.414 1.414 4.95 4.95 8.485-8.485z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div
                  className={`option-asset ${assetState.name === symbolInfo.quote_asset ? 'selected' : ''}`}
                  onClick={() => {
                    handleAssetChange(symbolInfo.quote_asset);
                    setAssetOptions('false');
                    setFocusOut(true);
                  }}
                >
                  <div className="left">
                    <p>{symbolInfo.quote_asset}</p>
                    {assetState.name === symbolInfo.quote_asset && (
                      <svg className="checkmark" viewBox="0 0 16 16">
                        <path
                          fill="currentColor"
                          d="M13.485 1.929l-7.071 7.071-3.535-3.535-1.414 1.414 4.95 4.95 8.485-8.485z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* <div className="reuqired-margin">
        <div className="title">Required Margin</div>
        <div className="value">
          {calculateOrderRequiredMargin()}{" "}
          {user?.userCurrencyName ||"EUR"}
        </div>
      </div> */}
      {selectedOrderTab === 'pending-order' ? (
        <SLTP
          isPendingOrder={true}
          isEditPosition={false}
          handleDisabledButton={handleDisabledButton}
          handleSLPipsChange={handleSLPipsChange}
          handleTPPipsChange={handleTPPipsChange}
          handleProfitChange={handleProfitChange}
          handleLossChange={handleLossChange}
          direction={direction}
          quantity={orderQuantity}
          entryPrice={orderEntryPrice}
          EntryPriceExchangeRate={ direction === "Buy" ? askPriceExchangeRate : bidPriceExchangeRate}
          handleSLTPDirection={handleSLTPDirectionChange}
        />
      ) : (
        <></>
      )}
      {/* <div className="text-bx">
        <div className="text-area-letter-counter-sltp">
          <span id="count-comment-letters-po">0</span>/100
        </div>
        <textarea
          className="comment-sltp-lst"
          placeholder="Comment"
          onInput={(e) => {
            countLetters(e);
          }}
          value={orderComment}
          onChange={(e) => {
            setOrderComment(e.target.value);
          }}
        ></textarea>
      </div> */}

      <div className="buy-sell-place-button-wrapper">
        <div className="button-with-stats">
          <button
            disabled={
              platFromData[5]?.accessRight == 3 ||
              localStorage.getItem('accountType') == '0' ||
              platFromData[5]?.accessRight == 2 ||
              !bidPrice ||
              !askPrice ||
              isOrderOpening ||
              isButtonDisabled ||
              direction == 'Sell'
            }
            className={`place-order-button place-order-button-buy`}
            onClick={() => {
              placeOrder('Buy');
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
              backgroundColor: selectedStyle.buyColor,
            }}
          >
            <b style={{ fontSize: '14px', fontWeight: 'bolder' }}>
              {!isOrderOpening ? 'Buy/Long' : 'Loading...'}
            </b>
            <br />
            {/* <span>
                  {formatPriceUptoDecimals(askPrice, symbolInfo.digit)}
                </span> */}
            {/* <span style={{fontSize: '13px'}}>
                  {quantity.toFixed(2) || ""} {selectedAuthSymbol} @{" "}
                  {formatPrice(askPrice)}
                </span> */}
          </button>
          <div className="order-stats">
            <div>
              Cost: <b>{calculateRequiredMarginAccToAskPrice() || '---'}</b>{' '}
              <span>{user?.userCurrencyName || 'EUR'}</span>
            </div>
          </div>
        </div>
        <div className="button-with-stats">
          <button
            disabled={
              platFromData[5]?.accessRight == 3 ||
              localStorage.getItem('accountType') == '0' ||
              platFromData[5]?.accessRight == 2 ||
              !bidPrice ||
              !askPrice ||
              isButtonDisabled ||
              direction == 'Buy'
            }
            className={`place-order-button place-order-button-sell`}
            onClick={() => {
              placeOrder('Sell');
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
              backgroundColor: selectedStyle.sellColor,
            }}
          >
            <b style={{ fontSize: '14px', fontWeight: 'bolder' }}>
              {!isOrderOpening ? 'Sell/Short' : 'Loading...'}
            </b>
            <br />
            {/* <span>
                  {formatPriceUptoDecimals(bidPrice, symbolInfo.digit)}
                </span> */}
            {/* <span style={{fontSize: '13px'}}>
                  {quantity.toFixed(2) || ""} {selectedAuthSymbol} @{" "}
                  {formatPrice(bidPrice)}
                </span> */}
          </button>
          <div className="order-stats">
            <div>
              Cost: <b>{calculateRequiredMarginAccToBidPrice() || '---'}</b>{' '}
              <span>{user?.userCurrencyName || 'EUR'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PendingOrder;

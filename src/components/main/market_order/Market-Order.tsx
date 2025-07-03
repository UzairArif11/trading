import React, { useState, useEffect, useRef } from "react";
import Spinner from "../../utils/spinner/Spinner";
import { toast } from "react-toastify";
import { useSymbolContext } from "../../../contexts/Symbol-Context.js";
import { API_ENDPOINT_OPEN_POSITION } from "../../../data/Endpoints-API.js";
import APIMiddleware from "../../../data/api/Api-Middleware.js";
import { useAccountManagerContext } from "../../../contexts/Account-Manager-Context.js";
import { useAuthContext } from "../../../contexts/Auth-Context.js";
import { useMetricsContext } from "../../../contexts/Metrics-Context.js";
import { useOrderContext } from "../../../contexts/Order-Context.js";
import { useChartContext } from "../../../contexts/Chart-Context.js";
import { Position } from "../../../interfaces/Position.ts";
import CreatableSelect from 'react-select/creatable';
import { components } from 'react-select';


import { Ripple } from 'react-ripple-click';
import 'react-ripple-click/dist/index.css';

import {
  formatPrice,
  formatPriceUptoDecimals,
  formatPositionToPipSize,
  formatDigitBasePrice,
} from "../../../utils/format.js";
import btcIcon from "../../../imgs/btc.png";
import usdtIcon from "../../../imgs/usdt.png";
import ProfitLoss from "./OrderSLTP.jsx";
import "./Market-Order.scss";
import UTCTimeConverter from "../order_panel/UTCTimeConverter.jsx";
import PriceDrop from "../../priceDrop/PriceDrop.jsx";
import SliderQuantity from "../../utils/slider/Slider.jsx";
interface ChildProps {
  selectedOrderTab: any;
}
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
const MarketOrder: React.FC<ChildProps> = ({ selectedOrderTab }) => {
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
    selectedSymbolSession,
    setSelectedSymbolSession,
    quoteCurrency,
    baseCurrency,
    setNewPositionOpen,
    selectedSymbolExchangeRate,
    lotSteps,
    lotSize,
    unitOptions,
    setActiveLvg,
    showPriceAlert,
    setCurrentExposureLevel
  } = useSymbolContext();
  const { openPosition, updateUserData_Local, setActiveTab } =
    useAccountManagerContext();
  const { user, updateUserData, sendDataToServer, selectedAuthSymbol, platFromData } =
    useAuthContext();
  const { metrics } = useMetricsContext();
  const { selectedStyle } = useChartContext();

  // #region All states defined here States
  const [calculatedMargins, setCalculatedMargins] = useState([]);
  const [pointerEvents, setPointerEvents] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [buyActive, setBuyActive] = useState(true);
  const [sellActive, setSellActive] = useState(false);
  const [direction, setDirection] = useState("");
  const [quantity, setQuantity] = useState("");
  const [amount, setAmount] = useState("");
  // const [amount, setAmount] = useState<number | null>(0.1);
  const [entryPrice, setEntryPrice] = useState(0.0);
  const [secondPrice, setSecondPrice] = useState(0.0)
  const [expiresAt, setExpiresAt] = useState("");

  const [slPips, setSlPips] = useState(0.0);
  const [tpPips, setTpPips] = useState(0.0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [preDefineQuantities, setPreDefineQuantities] = useState("false");
  const [assetState, setAssetState] = useState({
    type: "",
    name: "",
  });
  const [orderComment, setOrderComment] = useState("");

  const [assetOptions, setAssetOptions] = useState('false');
  const currentAssetIcon = assetState.name === "USDT" ? usdtIcon : btcIcon;

  const [isPositionOpening, setIsPositionOpening] = useState(false);

  const [takeProfit, setTakeProfit] = useState(0.0);
  const [stopLoss, setStopLoss] = useState(0.0)
  const [selectedLotStep, setSelectedLotStep] = useState(0.0);
  const [selectedLotStepOption, setSelectedLotStepOption] = useState({ value: 0.0, label: '0.0' });
  const [inputValue, setInputValue] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState(null)
  const [inputQtyValue, setInputQtyValue] = useState('');
  const [inputAmountValue, setInputAmountValue] = useState('');
  // const [selectedQty, setSelectedQty] = useState(0.0);
  const [selectedQtyOption, setSelectedQtyOption] = useState({ value: 1000, label: '1k' });
  const [selectedAmountOption, setSelectedAmountOption] = useState({ value: 1000, label: '1k' });
  const formatCreateLabelLots = (inputValue) => `${inputValue} Lots`;
  const formatCreateLabelQty = (inputValue) => `${inputValue}`;
  const [sliderValue, setSliderValue] = useState(0);
  const [enableSlider, setEnableSlider] = useState(false);
  const divREf = useRef(null);
  const INPUTREf = useRef(null);
  //calculate the required margin before open the trade
  // const calculateRequiredMargin = () => {
  //   let reqMarginWithoutLeverage = quantity * getEntryPrice() * getEntryPriceExchangeRate;
  //   setCurrentExposureLevel(reqMarginWithoutLeverage)
  //   // console.log("1st" , reqMarginWithoutLeverage , quantity , getEntryPrice() , selectedSymbolExchangeRate);

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
  //       // Handle missing or invalid `exposure_level` values using parseFloat
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
  //     setActiveLvg(lvg);
  //     const converted_entry_price = getEntryPrice() * selectedSymbolExchangeRate;
  //     const requiredMargin = quantity * (converted_entry_price / lvg);
  //     // console.log("1stcccccc" , requiredMargin , quantity , getEntryPrice() , selectedSymbolExchangeRate,lvg);
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
  //     setActiveLvg(lvg);
  //     const converted_entry_price = getEntryPrice() * selectedSymbolExchangeRate;
  //     const requiredMargin = quantity * (converted_entry_price / lvg);
  //     // console.log("2ndccc" , requiredMargin , quantity , getEntryPrice() , selectedSymbolExchangeRate,lvg);
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
  //     setActiveLvg(lvg);
  //     const converted_entry_price = getEntryPrice() * selectedSymbolExchangeRate;
  //     const requiredMargin = quantity * (converted_entry_price / lvg);
  //     // console.log("3rdcc" , requiredMargin , quantity , getEntryPrice() , selectedSymbolExchangeRate,lvg);

  //     return isNaN(requiredMargin)
  //       ? 0
  //       : requiredMargin < 1 ? requiredMargin.toFixed(5)
  //         : Math.round(requiredMargin * 10) / 10

  //   }
  // }
  const calculateRequiredMarginAccToBidPrice = () => {
    let reqMarginWithoutLeverage = quantity * bidPrice * selectedSymbolExchangeRate *bidPriceExchangeRate;
    setCurrentExposureLevel(reqMarginWithoutLeverage)
    // console.log("1st" , reqMarginWithoutLeverage , quantity , getEntryPrice() , selectedSymbolExchangeRate);

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
        // Handle missing or invalid `exposure_level` values using parseFloat
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
      setActiveLvg(lvg);
      const converted_entry_price = bidPrice * selectedSymbolExchangeRate * bidPriceExchangeRate;
      const requiredMargin = quantity * (converted_entry_price / lvg);
      // console.log("1stcccccc" , requiredMargin , quantity , getEntryPrice() , selectedSymbolExchangeRate,lvg);
      return isNaN(requiredMargin)
        ? 0
        : requiredMargin < 1 ? requiredMargin.toFixed(5)
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
      setActiveLvg(lvg);
      const converted_entry_price = bidPrice * selectedSymbolExchangeRate * bidPriceExchangeRate;
      const requiredMargin = quantity * (converted_entry_price / lvg);
      // console.log("2ndccc" , requiredMargin , quantity , getEntryPrice() , selectedSymbolExchangeRate,lvg);
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
      setActiveLvg(lvg);
      const converted_entry_price = bidPrice * selectedSymbolExchangeRate* bidPriceExchangeRate;
      const requiredMargin = quantity * (converted_entry_price / lvg);
      // console.log("3rdcc" , requiredMargin , quantity , getEntryPrice() , selectedSymbolExchangeRate,lvg);

      return isNaN(requiredMargin)
        ? 0
        : requiredMargin < 1 ? requiredMargin?.toFixed(5)
          : Math.round(requiredMargin * 10) / 10

    }
  }
  const calculateRequiredMarginAccToAskPrice = () => {
    let reqMarginWithoutLeverage = quantity * askPrice * selectedSymbolExchangeRate * askPriceExchangeRate;
    setCurrentExposureLevel(reqMarginWithoutLeverage)
    // console.log("1st" , reqMarginWithoutLeverage , quantity , getEntryPrice() , selectedSymbolExchangeRate);

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
        // Handle missing or invalid `exposure_level` values using parseFloat
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
      setActiveLvg(lvg);
      const converted_entry_price = askPrice * selectedSymbolExchangeRate  * askPriceExchangeRate;;
      const requiredMargin = quantity * (converted_entry_price / lvg);
      // console.log("1stcccccc" , requiredMargin , quantity , getEntryPrice() , selectedSymbolExchangeRate,lvg);
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
      setActiveLvg(lvg);
      const converted_entry_price = askPrice * selectedSymbolExchangeRate  * askPriceExchangeRate;;
      const requiredMargin = quantity * (converted_entry_price / lvg);
      // console.log("2ndccc" , requiredMargin , quantity , getEntryPrice() , selectedSymbolExchangeRate,lvg);
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
      setActiveLvg(lvg);
      const converted_entry_price = askPrice * selectedSymbolExchangeRate * askPriceExchangeRate;;
      const requiredMargin = quantity * (converted_entry_price / lvg);
      // console.log("3rdcc" , requiredMargin , quantity , getEntryPrice() , selectedSymbolExchangeRate,lvg);

      return isNaN(requiredMargin)
        ? 0
        : requiredMargin < 1 ? requiredMargin?.toFixed(5)
          : Math.round(requiredMargin * 10) / 10

    }
  }

  // useEffect(() => {
  //   if (divREf.current) {
  //     divREf.current.blur?.(); // force blur
  //     setTimeout(() => {
  //       divREf.current.focus?.(); // re-focus
  //     }, 10);
  //   }
  // }, [quantity]);

  // useEffect(() => {
  //   if((calculateRequiredMargin()*100/metrics.equity) <100){
  //   if(enableSlider){
  //     // setEnableSlider(false);
  //     if (INPUTREf.current) { clearTimeout(INPUTREf.current); } 
  //     INPUTREf.current= setTimeout(() => {

  //       setSliderValue(calculateRequiredMargin()*100/metrics.equity);
  //    console.log("SLIDER SLIDER SLIDER SLIDER Slider SLIDEr 3",sliderValue , enableSlider) ;
  //    }, 2000);
  //     }
  //   }else{

  //     handleSliderChange(100);
  //     console.log("SLIDER SLIDER SLIDER SLIDER Slider SLIDEr 4",sliderValue , enableSlider) ;


  //   }


  // }, [quantity, amount, entryPrice, selectedQtyOption, selectedAmountOption]);

  useEffect(() => {
    if (!enableSlider) return;
  
    // Clear previous timeout
    if (INPUTREf.current) {
      clearTimeout(INPUTREf.current);
    }
  
    INPUTREf.current = setTimeout(() => {
      const askMargin = parseFloat(calculateRequiredMarginAccToAskPrice());
      const bidMargin = parseFloat(calculateRequiredMarginAccToBidPrice());
      const equity = parseFloat(metrics?.equity);
  
      if (!askMargin || !bidMargin || !equity || equity <= 0) {
        setSliderValue(0);
        return;
      }
  
      const avgMargin = (askMargin + bidMargin) / 2;
      const sliderPercent = (avgMargin * 100) / equity;
  
      setSliderValue(sliderPercent);
    }, 200);
  
    return () => clearTimeout(INPUTREf.current); // cleanup on unmount or re-run
  }, [quantity, entryPrice, enableSlider, metrics?.equity]);
  


  // useEffect(() => {
  //   if((calculateRequiredMargin()*100/metrics.equity) <100){
  //   if(enableSlider){
  //     // setEnableSlider(false);
  //     if (INPUTREf.current) { clearTimeout(INPUTREf.current); } 
  //     INPUTREf.current= setTimeout(() => {

  //       setSliderValue(calculateRequiredMargin()*100/metrics.equity);
  //    console.log("SLIDER SLIDER SLIDER SLIDER Slider SLIDEr 3",sliderValue , enableSlider) ;
  //    }, 2000);
  //     }
  //   }else{

  //     handleSliderChange(100);
  //     console.log("SLIDER SLIDER SLIDER SLIDER Slider SLIDEr 4",sliderValue , enableSlider) ;


  //   }


  // }, [quantity, amount, entryPrice, selectedQtyOption, selectedAmountOption]);


  // useEffect(() => {
  //   if (selectedQtyOption && metrics.balance > 0) {
  //     const percentage = (selectedQtyOption.value / metrics.balance) * 100;
  //     setSliderValue(Math.min(percentage, 100)); 
  //   }
  // }, [selectedQtyOption, metrics.balance]); 

  // useEffect(() => {
  //   if (selectedAmountOption && metrics.balance > 0) {
  //     const percentage = (selectedAmountOption.value / metrics.balance) * 100;
  //     setSliderValue(Math.min(percentage, 100)); // Ensure it doesn't exceed 100%
  //   }
  // }, [selectedAmountOption, metrics.balance]);


  // useEffect(() => {
  //   const LSdirection = localStorage.directions;
  //   if (LSdirection === undefined) {
  //     handleBuySellOrderClick(true);

  //   } else {
  //     handleBuySellOrderClick(LSdirection === 'buy' ? true : false);
  //   }
  // }, []);


  useEffect(() => {
    setSelectedAssetId(symbolInfo.asset_id)
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
  useEffect(() => {
    if (unitOptions && unitOptions.length > 0) {
      setCalculatedMargins(unitOptions.map(option => ({
        ...option,
        calculatedMargin: calculateRequiredMargin2(option.value),
      })));
    }
  }, [unitOptions, entryPrice]);

  useEffect(() => {
    //If amount entry price and quantity is not null or nan then it will pass to the condition
    if (!isNaN(amount) && !isNaN(entryPrice) && !isNaN(quantity)) {
      //If the selected type is base asset (BTC)
      //then it will set amount according to given quantity
      if (assetState.type === "base_asset") {
        setAmount(entryPrice * quantity);
      }
      //If the selected type is quote asset (USDT)
      //then it will set quantity according to given amount
      else if (assetState.type === "quote_asset") {
        setQuantity(amount / entryPrice);
      }
    }
    else {
      // setAmount(0.1)
    }
  }, [amount, quantity, entryPrice]);

  useEffect(() => {
    setEntryPrice(
      direction == "Buy" ? parseFloat(askPrice) : parseFloat(bidPrice)
    );
    setSecondPrice(direction == "Buy" ? parseFloat(bidPrice) : parseFloat(askPrice))
  }, [bidPrice, askPrice, entryPrice]);

  useEffect(() => {
    const category = localStorage.getItem('category');
    if (category == "1") {
      setAmount("")
      setSelectedAmountOption({ value: 1000, label: '1k' });
    } else {
      setQuantity("");
      setSelectedQtyOption({ value: 0.1, label: '0.1' });
    }

  }, [selectedAuthSymbol, localStorage.getItem('category')]);

  const handleProfitChange = (data) => {
    setTakeProfit(data)
  };
  const handleSLPipsChange = (data) => {
    setSlPips(data)
  };
  const handleTPPipsChange = (data) => {
    setTpPips(data)
  };
  const handleLossChange = (data) => {
    setStopLoss(data)
  };

  const handleAssetChange = (e) => {

    // sltp states null on change
    setTakeProfit(0.0);
    setAmount("");
    setQuantity("");
    setInputQtyValue('');
    setInputAmountValue('');
    // setSelectedQtyOption({ value: 1000, label: '1k' });
    // setSelectedAmountOption({ value: 1000, label: '1k' });
    setSliderValue(0);
    // Create a new object with updated values based on selection
    const updatedAssetState = {
      type: e === symbolInfo.base_asset ? "base_asset" : "quote_asset",
      name: e,
    };
    // Update the state using the updated object
    setAssetState(updatedAssetState);
  };

  const countLetters = (e) => {
    const counter = e.target.value.split("").length;
    const countBox = document.getElementById("count-comment-letters-mo");
    if (counter <= 100 && countBox != null) {
      countBox.innerText = counter;
    } else {
      e.target.value = e.target.value.slice(0, 100);
    }
  };
  const handleDisabledButton = (data) => {
    setIsButtonDisabled(data)
  };
  const handleBuySellOrderClick = (buy: boolean) => {
    setBuyActive(buy);
    setSellActive(!buy);
    setDirection(buy ? "Buy" : "Sell");
    localStorage.setItem('directions', buy ? 'buy' : 'sell');
    setEntryPrice(buy ? parseFloat(askPrice) : parseFloat(bidPrice));
    setSecondPrice(buy ? parseFloat(bidPrice) : parseFloat(askPrice))
  };

  const handleSLTPDirectionChange = (direction) => {
    setDirection(direction);
    setBuyActive(direction == "Buy" ? true : false);
    setSellActive(direction != "Buy" ? true : false);
    // localStorage.setItem('directions', direction == "Buy" ? 'buy' : 'sell');
    setEntryPrice(direction == "Buy" ? parseFloat(askPrice) : parseFloat(bidPrice));
    setSecondPrice(direction == "Buy" ? parseFloat(bidPrice) : parseFloat(askPrice))
  }

  const placeOrder = (dir) => {
    if (user && user.userId != undefined && user.userId > 0) {
      setActiveTab("open-positions-acc");
      setIsPositionOpening(true);
      placeMarketOrder(dir);
    }
  };
  function calculateNetMarginInti(allOpenedPositions, requiredMargin) {

    let positions = [...allOpenedPositions.openedPositions, { symbol: selectedAuthSymbol, direction, margin: requiredMargin }]

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
  const placeMarketOrder = (dir) => {
    if (dir && quantity > 0) {
      // Calculate required margin based on trading logic
      let entryPrice = dir == "Buy" ? askPrice : bidPrice
      let requiredMargin = dir == "Buy" ? calculateRequiredMarginAccToAskPrice() : calculateRequiredMarginAccToBidPrice();
      
      
      let useMargin = calculateNetMarginInti(platFromData[3], requiredMargin)
      let freeMargin;
      let openPositionCheck;
      console.log(platFromData[5].equity - useMargin, requiredMargin, "requiredMargin", )


      if (platFromData[5].margin_calculation == "net") {
        freeMargin = platFromData[5].equity - useMargin
        openPositionCheck = freeMargin > 0
      } else {

        freeMargin = metrics.freeMargin;
        openPositionCheck = freeMargin >= requiredMargin
      }
      // Check if the user has enough balance
      if (openPositionCheck) {
        // Continue with opening the position
        if (requiredMargin < 10) {
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




  const getEntryPrice = () => (buyActive ? askPrice : bidPrice);
  const getEntryPriceExchangeRate = () => (direction === "Buy" ? askPriceExchangeRate : bidPriceExchangeRate);

  //#region API CALLS
  const openPosition_api = async (margin, dir) => {
    try {
      const currentDate = new Date();
      const currentDateTime = new Date(currentDate);

      const data: Position = {
        id: -1,
        position_id: "PID" + Math.floor(100000 + Math.random() * 900000),
        symbol: selectedAuthSymbol,
        quantity: quantity,
        amount: amount,
        asset_type: assetState.type,
        direction: dir,
        entry_price: dir == "Buy" ? askPrice : bidPrice,
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

  const changeOrderTab = () => {
    localStorage.orderTab = "pending-order"
  }

  const [focusOut, setFocusOut] = useState(true);

  const handleLotStepOptionChange = (lotStep) => {
    setSelectedLotStep(parseFloat(lotStep.value));
    setSelectedLotStepOption(lotStep);
  }

  const handleInputChange = (value) => {
    setInputValue(value);
  };


  const handleQtyOptionChange = (option) => {
    setEnableSlider(true);
    setQuantity(parseFloat(option.value));
    setSelectedQtyOption(option);
    // console.log(option , option.label.props.children[0]?.props.children);

    try {
      setSelectedQtyOption({
        value: option.value,
        label: option.label.props.children[0]?.props.children || option.value,
      });
    } catch (error) {
      console.error("Error setting selected amount option:", error);
      setSelectedQtyOption({
        value: option.value,
        label: option.value,
      });
    }
  }
  const handleQtyChange = (e) => {
    setEnableSlider(true);
    setQuantity(parseFloat(e.target.value));
  }


  const handleAmountOptionChange = (option) => {
    setEnableSlider(true);
    setAmount(parseFloat(option.value));

    // Pass an object with `label` and `value` for the CreatableSelect input
    try {
      setSelectedAmountOption({
        value: option.value,
        label: option.label.props.children[0]?.props.children || option.value,
      });
    } catch (error) {
      console.error("Error setting selected amount option:", error);
      setSelectedAmountOption({
        value: option.value,
        label: option.value,
      });
    }
    // console.log(option);
    // console.log(option.label.props.children[0]?.props.children); 
  };

  const handleAmountChange = (e) => {
    setEnableSlider(true);
    setAmount(parseFloat(e.target.value));
  };


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


  const handleAmountInputChange = (value) => {
    const sanitizedValue = value.replace(/[^0-9.]/g, ''); // Allow only numbers
    const floatValue = sanitizedValue.split('.');
    // Allow only one dot in the input
    if (floatValue.length > 2) {
      setInputAmountValue(`${floatValue[0]}.${floatValue[1]}`);
    } else {
      setInputAmountValue(sanitizedValue);
    }
  };

  //show spinner while loading data
  if (loadingSymbolContext) {
    return <Spinner />;
  }
  const calculateSpread = () => {
    return formatPriceUptoDecimals(Math.pow(10, symbolInfo?.pip_position) * (formatPriceUptoDecimals(askPrice, symbolInfo.digit) - formatPriceUptoDecimals(bidPrice, symbolInfo.digit)), 2)
  }
  const calculateRequiredMargin2 = (param_quantity) => {

    let converstion = param_quantity;
    let reqMarginWithoutLeverage
    if (assetState.type === "base_asset") {
      reqMarginWithoutLeverage = converstion * selectedSymbolExchangeRate * getEntryPrice()*getEntryPriceExchangeRate();

    } else {
      // let reqMarginWithoutLeverage = quantity * getEntryPrice() * selectedSymbolExchangeRate;
      // console.log("Paramter value",param_quantity);
      converstion = param_quantity / getEntryPrice();
      reqMarginWithoutLeverage = converstion * selectedSymbolExchangeRate * getEntryPrice()**getEntryPriceExchangeRate();
      // console.log("2nd :" , reqMarginWithoutLeverage , converstion , getEntryPrice() , selectedSymbolExchangeRate);
    }
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
        // Handle missing or invalid `exposure_level` values using parseFloat
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
      setActiveLvg(lvg);
      const converted_entry_price = getEntryPrice() * selectedSymbolExchangeRate*getEntryPriceExchangeRate();
      const requiredMargin = converstion * (converted_entry_price / lvg);
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
      setActiveLvg(lvg);
      const converted_entry_price = getEntryPrice() * selectedSymbolExchangeRate*getEntryPriceExchangeRate();
      const requiredMargin = converstion * (converted_entry_price / lvg);
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
      setActiveLvg(lvg);
      const converted_entry_price = getEntryPrice() * selectedSymbolExchangeRate*getEntryPriceExchangeRate();
      const requiredMargin = converstion * (converted_entry_price / lvg);
      return isNaN(requiredMargin)
        ? 0
        : requiredMargin < 1 ? requiredMargin?.toFixed(5)
          : Math.round(requiredMargin * 10) / 10

    }
  }

  const handleDropdownOpen = () => {
    setEnableSlider(true)
    if (!unitOptions || unitOptions.length === 0) {
      return;
    }
    const margins = unitOptions.map(option => ({
      ...option,
      calculatedMargin: calculateRequiredMargin2(option.value),
    }));
    setCalculatedMargins(margins);
    setTimeout(() => {
      setIsDropdownOpen(true);
    }, 50);
  };

  const dropdownOptions = calculatedMargins.map(option => ({
    ...option,
    label: (
      <div className="required-margin">
        <span>{option.label}</span>
        <span>{`${option.calculatedMargin || 0} ${user?.userCurrencyName || 'EUR'}`}</span>
      </div>
    ),
  }));


//   const calculateRequiredQuantity = (reqMarginWithoutLeverage) => {
//     // let reqMarginWithoutLeverage = quantity * getEntryPrice() * selectedSymbolExchangeRate;


//     // console.log("1st" , reqMarginWithoutLeverage , quantity , getEntryPrice() , selectedSymbolExchangeRate);

//     if (
//       platFromData[6] &&
//       platFromData[6].availableLeverage &&
//       Array.isArray(platFromData[6].availableLeverage) &&
//       platFromData[6].availableLeverage.length > 0 &&
//       platFromData[6].availableLeverage[0]?.available_leverage &&
//       Array.isArray(platFromData[6].availableLeverage[0].available_leverage) &&
//       platFromData[6].availableLeverage[0].available_leverage.length > 0 &&
//       Array.isArray(platFromData[6].availableLeverage[0].available_leverage[0]?.group_level_leverage) &&
//       platFromData[6].availableLeverage[0].available_leverage[0].group_level_leverage.length > 0
//     ) {

// //       let symbolLeverage = platFromData[6]?.availableLeverage[0]?.available_leverage[0].group_level_leverage.sort((a, b) => {
// //         // Handle missing or invalid `exposure_level` values using parseFloat
// //         const aLevel = a && a.exposure_level !== null && a.exposure_level !== undefined
// //           ? parseFloat(a.exposure_level)
// //           : Infinity;
// //         const bLevel = b && b.exposure_level !== null && b.exposure_level !== undefined
// //           ? parseFloat(b.exposure_level)
// //           : Infinity;
// //         return aLevel - bLevel;
// //       });

//  let groupMinLeverage =symbolLeverage.filter(lev => {
//     // Ensure `lev.exposure_level` exists and is a valid number before comparison
//     const exposureLevel = lev && lev.exposure_level !== null && lev.exposure_level !== undefined
//       ? parseFloat(lev.exposure_level)
//       : NaN;
//     return !isNaN(exposureLevel) && exposureLevel >= reqMarginWithoutLeverage;
//   })




//       let groupDefaultLeverage

// if(platFromData[6]?.availableLeverage[0]?.available_leverage[0].group_level_leverage.length > 0 && groupMinLeverage.length ==0){
// groupDefaultLeverage = symbolLeverage[symbolLeverage.length-1]
// }else{
// groupDefaultLeverage = groupMinLeverage[0];
// }
  
//     let minimumLeverage = 1;
//     if (platFromData[6]?.availableLeverage[0]?.available_leverage[0]) {
//             minimumLeverage = getMinimumLeverage(
//               platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage,
//             groupDefaultLeverage.max_leverage,
//             []
//         );
//     }
//     const lvg = minimumLeverage || 1;
//     setActiveLvg(lvg);
//     const converted_entry_price = getEntryPrice() * selectedSymbolExchangeRate;
//     // console.log(reqMarginWithoutLeverage,lvg,converted_entry_price,"1strr");
//     // const requiredMargin = quantity * (converted_entry_price / lvg);
//     const quantity= reqMarginWithoutLeverage*lvg/converted_entry_price;
//     return isNaN(quantity)
//     ? 0
//     :quantity<1?quantity.toFixed(5)
//     : Math.round(quantity * 10) / 10
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
//   ){
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
    
//     let symbolMinLeverage= symbolLeverage.filter(lev => {
//       // Ensure `lev.exposure_level` exists and is a valid number before comparison
//       const exposureLevel = lev && lev.exposure_level !== null && lev.exposure_level !== undefined
//         ? parseFloat(lev.exposure_level)
//         : NaN;
//       return !isNaN(exposureLevel) && exposureLevel >= reqMarginWithoutLeverage;
//     })

//       let symbolDefaultLeverage

//       if (platFromData[6]?.availableLeverage[0]?.available_leverage[0].symbol_default_leverage.length > 0 && symbolMinLeverage.length == 0) {
//         symbolDefaultLeverage = symbolLeverage[symbolLeverage.length - 1]
//       } else {
//         symbolDefaultLeverage = symbolMinLeverage[0];
//       }

//       let minimumLeverage = 1;
//       if (platFromData[6]?.availableLeverage[0]?.available_leverage[0]) {
//         minimumLeverage = getMinimumLeverage(
//           platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage,
//           [],
//           symbolDefaultLeverage.max_leverage,

//         );
//       }
//       const lvg = minimumLeverage || 1;
//       setActiveLvg(lvg);
//       const converted_entry_price = getEntryPrice() * selectedSymbolExchangeRate;
//       // const requiredMargin = quantity * (converted_entry_price / lvg);
//       // console.log(reqMarginWithoutLeverage,lvg,converted_entry_price,selectedSymbolExchangeRate,"2ndrr",reqMarginWithoutLeverage*lvg/converted_entry_price);
//       const quantity = reqMarginWithoutLeverage * lvg / converted_entry_price;
//       return isNaN(quantity)
//         ? 0
//         : quantity < 1 ? quantity.toFixed(5)
//           : Math.round(quantity * 10) / 10
//     } else if (platFromData[6] &&
//       platFromData[6].availableLeverage &&
//       Array.isArray(platFromData[6].availableLeverage) &&
//       platFromData[6].availableLeverage.length > 0 &&
//       platFromData[6].availableLeverage[0]?.available_leverage &&
//       Array.isArray(platFromData[6].availableLeverage[0].available_leverage) &&
//       platFromData[6].availableLeverage[0].available_leverage.length > 0 &&
//       platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage) {

//     const lvg = platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage || 1;
//     setActiveLvg(lvg);
//     const converted_entry_price = getEntryPrice() * selectedSymbolExchangeRate;
//     // const requiredMargin = quantity * (converted_entry_price / lvg);
//     // console.log(reqMarginWithoutLeverage,lvg,converted_entry_price,"3rdrr");
    
//     const quantity= reqMarginWithoutLeverage*lvg/converted_entry_price;
//     return isNaN(quantity)
//     ? 0
//     :quantity<1?quantity.toFixed(5)
//     : Math.round(quantity * 10) / 10

//   }
//   }


  const handleSliderChange = (sliderPercent) => {
    // console.log("equity equity........",metrics.equity);

    // setEnableSlider(false)
    // const balance = metrics.equity * sliderPercent / 100;
    // // setSliderValue(balance);
    // const newValue = balance.toFixed(2);
    // const quantity = calculateRequiredQuantity(newValue);     
    // setInputQtyValue(quantity);
    // const option = { value: parseFloat(quantity), label: quantity };
    // handleQtyOptionChange(option);
    // setEnableSlider(true)
  };
  const handleAmountSliderChange = (sliderPercent) => {
    // const amount = metrics.equity * sliderPercent / 100; 
    // // setSliderValue(sliderPercent);
    // const newValue = amount.toFixed(2);
    // const requiredQuantity = calculateRequiredQuantity(newValue); 
    // setInputAmountValue(newValue);
    // const option = { value: parseFloat(newValue), label: newValue };
    // handleAmountOptionChange(option);
  };



  return (
    <>
      {showPriceAlert && <PriceDrop />}
      {/* <div className="focusOutElement" aria-hidden={focusOut} onClick={()=>{
            setAssetOptions('false');
            setFocusOut(true)}} ></div> */}
      {/* <div className="price-box-container">
        <div
          className={`price-box price-box-buy ${
            buyActive ? "price-box-buy-active" : ""
          }`}
          id="buyMarketOrder"
          onClick={() => handleBuySellOrderClick(true)}
        >
          <div style={{fontSize: '14px', fontWeight: 'bolder'}}>Buy</div>
          <div id="buyMarketPrice" style={{fontSize: '14px'}} >
            {formatPriceUptoDecimals(askPrice, symbolInfo.digit)}
          </div>
        </div>
        <div
          className={`price-box price-box-sell ${
            sellActive ? "price-box-sell-active" : ""
          }`}
          id="sellMarketOrder"
          onClick={() => handleBuySellOrderClick(false)}
        >
          <div style={{fontSize: '14px', fontWeight: 'bolder'}}>Sell</div>
          <div id="sellMarketPrice" style={{fontSize: '14px'}} >
            {formatPriceUptoDecimals(bidPrice, symbolInfo.digit)}
          </div>
        </div>
      </div> */}
      <div className="spread-equity">
        <div>Spread: {calculateSpread() ?? '--'}</div>
        <div>
          Avbl:{' '}
          {metrics?.equity !== undefined
            ? metrics?.freeMargin?.toFixed(2)
            : '0.00'}{' '}
          {user?.userCurrencyName || 'EUR'}
        </div>
      </div>
      {
        selectedAssetId == 1 ?
          <label htmlFor="quantity" className="order-label">
            Quantity
          </label>
          :
          symbolInfo?.trade_type == 'units' ? (
            <label htmlFor="quantity" className="order-label">
              {assetState.type === "quote_asset" ? "Size: " : "Size: "}
            </label>
          ) : (
            <label htmlFor="quantity" className="order-label">
              Lots:
            </label>
          )}

      <div className="crypto-input">
        {assetState.type === 'base_asset' ? (
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={quantity ?? ""}
            maxLength={10}
            onChange={(e) => {
              const val = e.target.value;

              if (val.length <= 10) {
                handleQtyChange(e);
              }
            }}
            onKeyDown={(e) => {
              // Prevent unwanted characters
              if (['e', 'E', '+', '-'].includes(e.key)) {
                e.preventDefault();
              }
            }}
          />
        ) : (
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
             maxLength={10}
            onChange={(e) => {
              const val = e.target.value;

              if (val.length <= 10) {
                handleAmountChange(e);
              }
            }}
            onKeyDown={(e) => {
              // Prevent unwanted characters
              if (['e', 'E', '+', '-'].includes(e.key)) {
                e.preventDefault();
              }
            }}
            value={amount??"" }
          
          />
        )}
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
                  return typeof prev === 'string' ? String(newValue) : newValue;
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

          {selectedAssetId != 1 ? (
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
            </div>
          )}
        </div>
      </div>

      {/* DROPDOWN Based quantity selector  */}
      {/* {symbolInfo?.trade_type == 'units' ? (

      <div className="volume-amount-container">
        {assetState.type === "base_asset" ? (
          // <div className="quantity-div">
          //   <CreatableSelect
          //     styles={customStyles}
          //     onInputChange={handleQtyInputChange}
          //     inputValue={inputQtyValue}
          //     value={selectedQtyOption}
          //     onChange={handleQtyOptionChange}
          //     options={unitOptions}
          //     isSearchable
          //     placeholder="Select Lots"
          //     formatCreateLabel={formatCreateLabelQty}
          //     defaultInputValue={inputQtyValue}
          //     defaultValue={selectedQtyOption}
          //   />
          // </div>
          <div
      className="quantity-div"
     
      onClick={handleDropdownOpen} // Trigger the function when the dropdown is clicked/opened
    >
      <CreatableSelect
       key={selectedQtyOption.value }  
       ref={divREf}
        styles={customStyles}
        onInputChange={handleQtyInputChange}
        inputValue={inputQtyValue}
        value={selectedQtyOption}
        onChange={handleQtyOptionChange}
        options={dropdownOptions}
        isSearchable
        placeholder="Select Lots"
        formatCreateLabel={formatCreateLabelQty}
        defaultInputValue={inputQtyValue}
        defaultValue={selectedQtyOption}
      />
    </div>
        ) : (
          // <div className="quantity-div">
          //   <CreatableSelect
          //     styles={customStyles}
          //     onInputChange={handleAmountInputChange}
          //     inputValue={inputAmountValue}
          //     value={selectedAmountOption}
          //     onChange={handleAmountOptionChange}
          //     options={unitOptions}
          //     isSearchable
          //     placeholder="Select Amount"
          //     formatCreateLabel={formatCreateLabelQty}
          //     defaultInputValue={inputAmountValue}
          //     defaultValue={selectedAmountOption}
          //   />
          // </div>
          <div
      className="quantity-div"
      onClick={handleDropdownOpen} // Trigger the function when the dropdown is clicked/opened
    >
      <CreatableSelect
       key={selectedQtyOption.value}  
      ref={divREf}
        styles={customStyles}
        onInputChange={handleAmountInputChange}
        inputValue={inputAmountValue}
        value={selectedAmountOption}
        onChange={handleAmountOptionChange}
        options={dropdownOptions}
        isSearchable
        placeholder="Select Amount"
        formatCreateLabel={formatCreateLabelQty}
        defaultInputValue={inputAmountValue}
        defaultValue={selectedAmountOption}
      />
    </div>
        )}
        <div className="-select-asset">
          <div className="asset-icon">
          </div>
          <div 
          className="selectedAsset"
          onClick={()=>{
            setAssetOptions('true');
            setFocusOut(false)}}
          >
            <p>{assetState.name}</p>
            <svg viewBox="0 0 16 16" aria-selected={assetOptions}>
  <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
</svg>
            </div>
        </div>
        {
          selectedAssetId != 1 ?  <div className="custom-options-assets" aria-selected={assetOptions}>
            <div className="option-asset" onClick={()=>{handleAssetChange(symbolInfo.base_asset);setAssetOptions('false');setFocusOut(true);}}>
              <div className="left">
                <p>{symbolInfo.base_asset}</p>
              </div>
            </div>
            <div className="option-asset" onClick={()=>{handleAssetChange(symbolInfo.quote_asset);setAssetOptions('false');setFocusOut(true);}}>
              <div className="left">
                <p>{symbolInfo.quote_asset}</p>
              </div>
            </div>
          </div>
          :
          <div className="custom-options-assets" aria-selected={assetOptions}>
            <div className="option-asset" onClick={()=>{handleAssetChange(symbolInfo.quote_asset);setAssetOptions('false');setFocusOut(true);}}>
              <div className="left">
                <p>{symbolInfo.quote_asset}</p>
              </div>
            </div>
            <div className="option-asset" onClick={()=>{handleAssetChange(symbolInfo.base_asset);setAssetOptions('false');setFocusOut(true);}}>
              <div className="left">
                <p>{symbolInfo.base_asset}</p>
              </div>
            </div>
          </div>
        }
      </div>
      ) : (
        <div className="lots-selector-container">
          <CreatableSelect
            styles={customStyles}
            onInputChange={handleInputChange}
            inputValue={inputValue}
            value={selectedLotStepOption}
            onChange={handleLotStepOptionChange}
            options={lotSteps}
            isSearchable
            placeholder="Select Lots"
            formatCreateLabel={formatCreateLabelLots}
            defaultInputValue={inputQtyValue}
            defaultValue={selectedQtyOption}
          />
        </div>
      )

      }    */}
      {/* <div className="reuqired-margin">
        <div className="title">Required Margin</div>
        <div className="value">
          {calculateRequiredMargin()}{" "}
          {user?.userCurrencyName || "EUR"}
        </div>
      </div> */}
      <div
        onChange={() => setEnableSlider(false)}
        onClick={() => setEnableSlider(false)}
      >
        <SliderQuantity
          value={sliderValue}
          onSliderChange={handleSliderChange}
          onAmountSliderChange={handleAmountSliderChange}
          direction={direction}
          stateUpdate={setEnableSlider}
        />
      </div>
      {selectedOrderTab === 'market' ? (
        <ProfitLoss
          isPendingOrder={false}
          secondPrice={secondPrice}
          isEditPosition={false}
          handleDisabledButton={handleDisabledButton}
          handleSLPipsChange={handleSLPipsChange}
          handleTPPipsChange={handleTPPipsChange}
          handleProfitChange={handleProfitChange}
          handleLossChange={handleLossChange}
          direction={direction}
          quantity={quantity}
          entryPrice={entryPrice}
          EntryPriceExchangeRate={ direction === "Buy" ? askPriceExchangeRate : bidPriceExchangeRate}
          handleSLTPDirection={handleSLTPDirectionChange}
        />
      ) : (
        <></>
      )}

      {/* <div className="text-bx">
        <div className="text-area-letter-counter-sltp">
          <span id="count-comment-letters-mo">0</span>/100
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

      <div className="place-order">
        {/* Conditionally set the disabled attribute based on the user's authentication status */}
        {/* <button
          disabled={platFromData[5]?.accessRight == 3|| localStorage.getItem('accountType') =="0"||platFromData[5]?.accessRight == 2||!bidPrice ||!askPrice || isPositionOpening || selectedSymbolSession === 0 || isButtonDisabled}
          className={`place-order-button ${
            buyActive ? "place-order-button-buy" : "place-order-button-sell"
          }`}
          title={
            // platFromData[5]?.accessRight == 3  ? "Trading for this Account in Disabled" :platFromData[5]?.accessRight == 2
            // ? "The status of this account is set to Close Only . You can only close your existing Positions" 
            // :
            selectedSymbolSession === 0 ? "The market is closed. Only pending orders are accepted" : ""}
          onClick={() => {
            placeOrder("Buy");
          }}
          style={{
            position: 'relative',
            overflow: 'hidden',
            isolation: 'isolate',
          }}
        >
          <b style={{fontSize: '14px', fontWeight: 'bolder'}}>
            {!isPositionOpening ? direction : "Loading..."}
          </b>
          <br />
          <span style={{fontSize: '13px'}}>
            {quantity.toFixed(2) || ""} {selectedAuthSymbol} @{" "}
            {buyActive ? formatPrice(askPrice) : formatPrice(bidPrice)}
          </span>
        </button> */}

        <div className="buy-sell-place-button-wrapper">
          <div className="button-with-stats">
            <button
              disabled={
                platFromData[5]?.accessRight == 3 ||
                localStorage.getItem('accountType') == '0' ||
                platFromData[5]?.accessRight == 2 ||
                !bidPrice ||
                !askPrice ||
                isPositionOpening ||
                selectedSymbolSession === 0 ||
                isButtonDisabled ||
                direction == 'Sell'
              }
              className={`place-order-button place-order-button-buy`}
              title={
                (selectedSymbolSession === 0 ? "The market is closed. Only pending orders are accepted" : "")
                || (direction == "Buy" ? "SL/TP is selected for Sell/Short" : "")
              }
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
                {!isPositionOpening ? 'Buy/Long' : 'Loading...'}
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
                isPositionOpening ||
                selectedSymbolSession === 0 ||
                isButtonDisabled ||
                direction == 'Buy'
              }
              className={`place-order-button place-order-button-sell`}
              title={
                // platFromData[5]?.accessRight == 3  ? "Trading for this Account in Disabled" :platFromData[5]?.accessRight == 2
                // ? "The status of this account is set to Close Only . You can only close your existing Positions"
                // :
                (selectedSymbolSession === 0
                  ? 'The market is closed. Only pending orders are accepted'
                  : '') ||
                (direction == 'Buy' ? 'SL/TP is selected for Buy/Long' : '')
              }
              onClick={() => {
                placeOrder('Sell');
              }}
              style={{
                backgroundColor: selectedStyle.sellColor,
                position: 'relative',
                overflow: 'hidden',
                isolation: 'isolate',
              }}
            >
              <b style={{ fontSize: '14px', fontWeight: 'bolder' }}>
                {!isPositionOpening ? 'Sell/Short' : 'Loading...'}
              </b>
              {/* <br />
          <span>
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

        {selectedSymbolSession === 0 ? (
          <button
            className="mkt-closed-notification-btn"
            onClick={() => {
              changeOrderTab();
            }}
          >
            {'The market is closed. Only pending orders are accepted'}
          </button>
        ) : (
          // : platFromData[5]?.accessRight == 3 ? (
          //   <button className="mkt-closed-notification-btn" onClick={() => {changeOrderTab()}}>
          //     {"Trading for this Account in Disabled"}
          //   </button>
          //   )  : platFromData[5]?.accessRight == 2 ? (
          //   <button className="mkt-closed-notification-btn" onClick={() => {changeOrderTab()}}>
          //     {"The status of this account is set to Close Only . You can only close your existing Positions"}
          //   </button>
          //   )

          ''
        )}
      </div>
    </>
  );
};

export default MarketOrder;

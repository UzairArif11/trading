import React, { useState, useContext, useEffect } from 'react';
import { toast } from "react-toastify";
// import { SymbolContext } from "../../contexts/Symbol-Context.js";
import { useSymbolContext } from "../../contexts/Symbol-Context.js";
import { useAccountManagerContext } from "../../contexts/Account-Manager-Context.js";
import { useAuthContext } from "../../contexts/Auth-Context.js";
import { useMetricsContext } from "../../contexts/Metrics-Context.js";
import { useChartContext } from "../../contexts/Chart-Context.js";
import APIMiddleware from "../../data/api/Api-Middleware.js";
import { API_ENDPOINT_OPEN_POSITION } from "../../data/Endpoints-API.js";
import CreatableSelect from 'react-select/creatable';
import { formatPrice } from "../../utils/format.js";
import '../../themes/dark.scss';

const OrderControl = () => {
  // Context hooks
  const { setActiveTab } = useAccountManagerContext();
  const { user, sendDataToServer, selectedAuthSymbol,platFromData } = useAuthContext();
  const { metrics } = useMetricsContext();
  const { selectedStyle } = useChartContext();
  const {
    leverage,
    askPrice,
    bidPrice,
    askPriceExchangeRate,
    bidPriceExchangeRate,
    lotSize,
    lotSteps,
    unitOptions,
    symbolInfo,
    selectedSymbolSession,
    selectedSymbolExchangeRate,
    isButtonDisabled,
    changeOrderTab
  } = useSymbolContext();

  // Component state
  const [quantity, setQuantity] = useState(0);
  const [direction, setDirection] = useState('Buy');
  const [newOrder, setNewOrder] = useState(false);
  const [amount, setAmount] = useState(0.0);
  const [assetState, setAssetState] = useState({ type: "", name: "" });
  const [takeProfit, setTakeProfit] = useState(0);
  const [stopLoss, setStopLoss] = useState(0);
  const [orderComment, setOrderComment] = useState('');
  const [slPips, setSlPips] = useState(0);
  const [tpPips, setTpPips] = useState(0);
  const [selectedLotStep, setSelectedLotStep] = useState(0);
  const [isPositionOpening, setIsPositionOpening] = useState(false);
  const [newPositionOpen, setNewPositionOpen] = useState(null);

  const [inputQtyValue, setInputQtyValue] = useState('');
  const [selectedQtyOption, setSelectedQtyOption] = useState(null);
  const [selectedLotStepOption, setSelectedLotStepOption] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [newAskprice,setNewAskprice ] = useState(0)
  const [newBidprice,setNewBidprice ] = useState(0)

useEffect(()=>{
  console.log("Changed values in mobile component: ", askPrice,bidPrice,selectedAuthSymbol)
  setNewAskprice(askPrice)
  setNewBidprice(bidPrice)
},[selectedAuthSymbol, askPrice, bidPrice])

  // Custom styles for CreatableSelect component
  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      // padding: '10px !important', // Adjust padding to make the option thicker
      textAlign: 'center',
      fontWeight: 'bold',
      color: 'white',
      borderColor: '#484848 !important',
      backgroundColor: state.isFocused ? 'rgb(33, 196, 109) !important' : null,
      '&:hover': {
        backgroundColor: 'rgb(33, 196, 109) !important',
        cursor: 'pointer',
      },
      cursor: 'pointer',
    }),
    control: (provided, state) => ({
      ...provided,
      width: '100%',
      minHeight: '35px !important', // Ensure minimum height to prevent squeezing
      backgroundColor: '#232323 !important',
      borderColor: '#484848 !important',
      boxShadow: state.isFocused ? '#484848 !important' : provided.boxShadow,
      // Optional: Adjust padding and box-sizing to ensure consistent sizing
      padding: '0 8px',
      boxSizing: 'border-box',
      borderRadius: '0px',
    }),
    dropdownIndicator: () => ({
    display: 'none', // Hide the dropdown indicator
  }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#3b3a3a !important',
      width: '100% !important',
      zIndex: 111,
      position: 'absolute',
      top: 'auto',
      bottom: '100%',
      marginBottom: '8px', // Optional: Add space between the select and the menu
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '120px !important',
      overflowY: 'auto',
      padding: '0', // Remove default padding
    }),
    input: (provided) => ({
      ...provided,
      padding: '0 !important',
      margin: '0 !important', // Ensure outer margin is zero
      maxWidth: '100px !important', // Fixed width for the input field
      flex: 'none !important', // Disable flex-grow to keep the width constant
      fontWeight: 'bold',
    }),
  };
  
  const customStyleforicons = {
      width: '55px',
      // padding: '10px',
      height: '20px',
      fontSize: '16px',
      textAlign: 'center',
      // backgroundColor: '#232323',
      color: 'white',
      border: '0.1px solid #484848',
      cursor: 'pointer',
      lineHeight: 'normal',
      borderRadius: '0px',
      borderTop: '0px',
      backgroundColor: '#3b3a3a',
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
  
  // Function to get entry price based on direction
  const getEntryPrice = () => (direction === "Buy" ? newAskprice : newBidprice);
  const getEntryPriceExchangeRate = () => (direction === "Buy" ? askPriceExchangeRate : bidPriceExchangeRate);

  // Update asset state when symbolInfo changes
  useEffect(() => {
    setAssetState({
      type: "base_asset",
      name: symbolInfo.base_asset
    });
  }, [symbolInfo]);

  // Update quantity and lot step when symbolInfo, lotSteps, or unitOptions change
  useEffect(() => {
    if (symbolInfo.trade_type === 'units') {
      const unitFirst = unitOptions?.length > 0 ? unitOptions[0] : { value: 0.1, label: '0.1' };
      setQuantity(parseFloat(unitFirst.value));
      setSelectedQtyOption(unitFirst);
    } else {
      const lotFirst = lotSteps?.length > 0 ? lotSteps[0] : { value: 0.1, label: '0.1' };
      setSelectedLotStep(parseFloat(lotFirst.value));
      setSelectedLotStepOption(lotFirst);
      setQuantity(parseFloat(lotFirst.value) * lotSize); // Set quantity based on selected lot step
    }
  }, [lotSteps, symbolInfo, unitOptions]);
  // Update amount based on quantity and entry price
  useEffect(() => {
    if (!isNaN(amount) && !isNaN(getEntryPrice()) && !isNaN(quantity)) {
      if (assetState.type === "base_asset") {
        setAmount(getEntryPrice() * quantity);
      } else if (assetState.type === "quote_asset") {
        setQuantity(amount / getEntryPrice());
      }
    }
  }, [amount, quantity, getEntryPrice]);

  // Calculate required margin for the order
  const calculateRequiredMargin = () => {
  
    let reqMarginWithoutLeverage = quantity * getEntryPrice() * selectedSymbolExchangeRate* getEntryPriceExchangeRate();
// console.log(platFromData[6],"platFromData[6]platFromData[6]platFromData[6]")
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
  console.log('llllll,',symbolLeverage)
groupDefaultLeverage = symbolLeverage[symbolLeverage.length-1]
}else{
groupDefaultLeverage = groupMinLeverage[0];
}
      
console.log(groupMinLeverage.length,groupDefaultLeverage,platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage, "after groupDefaultLeverage",reqMarginWithoutLeverage);
  
    let minimumLeverage = 1;
    if (platFromData[6]?.availableLeverage[0]?.available_leverage[0]) {
            minimumLeverage = getMinimumLeverage(
              platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage,
            groupDefaultLeverage.max_leverage,
            []
        );
    }
    const lvg = minimumLeverage || 1;
    console.log(minimumLeverage,"minimumLeverage",lvg)
    // const requiredMargin = quantity * (getEntryPrice() / lvg);
     
    const converted_entry_price = getEntryPrice() * selectedSymbolExchangeRate* getEntryPriceExchangeRate();
    const requiredMargin = quantity * (converted_entry_price / lvg);
    // return isNaN(requiredMargin) ? 0 : requiredMargin.toFixed(4);
    return isNaN(requiredMargin)
    ? 0
    :requiredMargin<1?requiredMargin.toFixed(5)
    : Math.round(requiredMargin * 10) / 10
    // : requiredMargin.toFixed(5)
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
  
  
  console.log(symbolMinLeverage,platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage, "before symbol_default_leverage",reqMarginWithoutLeverage);

  let symbolDefaultLeverage

  if(platFromData[6]?.availableLeverage[0]?.available_leverage[0].symbol_default_leverage.length > 0 && symbolMinLeverage.length ==0){
    symbolDefaultLeverage = symbolLeverage[symbolLeverage.length-1]
    }else{
    symbolDefaultLeverage = symbolMinLeverage[0];
    }
          
console.log(symbolDefaultLeverage,platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage, "after symbol_default_leverage",reqMarginWithoutLeverage);
  
let minimumLeverage = 1;
if (platFromData[6]?.availableLeverage[0]?.available_leverage[0]) {
        minimumLeverage = getMinimumLeverage(
        platFromData[6]?.availableLeverage[0]?.available_leverage[0].user_default_leverage,
        [],
        symbolDefaultLeverage.max_leverage,
        
    );
}
const lvg = minimumLeverage || 1;
console.log(minimumLeverage,"minimumLeverage",lvg)
// const requiredMargin = quantity * (getEntryPrice() / lvg);
const converted_entry_price = getEntryPrice() * selectedSymbolExchangeRate* getEntryPriceExchangeRate();
const requiredMargin = quantity * (converted_entry_price / lvg);
// return isNaN(requiredMargin) ? 0 : requiredMargin.toFixed(4);
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
    console.log("minimumLeverage",lvg)
    const converted_entry_price = getEntryPrice() * selectedSymbolExchangeRate* getEntryPriceExchangeRate();
    const requiredMargin = quantity * (converted_entry_price / lvg);
    return isNaN(requiredMargin)
    ? 0
    :requiredMargin<1?requiredMargin.toFixed(5)
    : Math.round(requiredMargin * 10) / 10

  }
  };

  useEffect(() => {
    if (newOrder) {
      placeOrder();
      setNewOrder(false);
    }
  }, [newOrder]);

  // Place an order and handle position opening logic
  const placeOrder = () => {
    console.log("Direction:", direction);
    console.log("Quantity:", quantity);
    console.log("Amount:", amount);
    console.log("Entry Price:", getEntryPrice());
    console.log("Is Position Opening:", isPositionOpening);

    if (user && user.userId !== undefined && user.userId > 0) {
      setActiveTab("open-positions-acc");
      setIsPositionOpening(true);
      placeMarketOrder();
    }
  };

  // Place a market order if the conditions are met
  const placeMarketOrder = () => {
    console.log("Placing Market Order with Direction:", direction);
    if ((direction === "Buy" || direction === "Sell") && quantity > 0) {
      const requiredMargin = calculateRequiredMargin();
      if (metrics.freeMargin >= requiredMargin) {
        openPosition_api(requiredMargin);
      } else {
        toast.error("Insufficient balance to open the position.", { position: "top-right" });
        setIsPositionOpening(false);
        document.getElementById("closeSound")?.play();
        document.querySelector(".deposit-cash")?.setAttribute("view", "true");
        const ig = document.getElementById("quantity-input-guide");
        ig?.setAttribute("shake", "true");
        setTimeout(() => {
          ig?.removeAttribute("shake");
        }, 2000);
      }
    } else {
      toast.error("Quantity should be greater than 0.", { position: "top-right" });
      document.getElementById("closeSound")?.play();
      setIsPositionOpening(false);
    }
  };

  // API call to open a position
  const openPosition_api = async (margin) => {
    try {
        if(margin < 10){
          toast.error(`Margin Should be greater than 10 ${metrics?.userCurrencyName || 'EUR'}.`, {
            position: "top-right",
          });
          setIsPositionOpening(false);
          document.getElementById("closeSound").play();
          return;
        }
      const data = {
        id: -1,
        position_id: 'PID' + Math.floor(100000 + Math.random() * 900000),
        symbol: selectedAuthSymbol,
        quantity: quantity,
        amount: amount,
        asset_type: assetState.type,
        direction: direction,
        entry_price: getEntryPrice(),
        TP: takeProfit,
        SL: stopLoss,
        netEUR: 0,
        status: '',
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

      console.log('Request Data:', data);

      const response = await APIMiddleware.post(API_ENDPOINT_OPEN_POSITION(), data);

      // Format and store the response data
      const data_m = {
        ...response.data,
        created_at: new Date(response.data.created_at).toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      sendDataToServer(3);
      toast.success('Position opened successfully!', { position: 'top-right' });
      setIsPositionOpening(false);
      localStorage.accountManager = 'open-positions-acc';
      document.getElementById('openSound')?.play();

      // Update localStorage with the current date and time
      const getCurrentDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = ('0' + (now.getMonth() + 1)).slice(-2);
        const day = ('0' + now.getDate()).slice(-2);
        const hour = ('0' + now.getHours()).slice(-2);
        const minute = ('0' + now.getMinutes()).slice(-2);
        return `${year}-${month}-${day} ${hour}:${minute}:00`;
      };

      const chartBullets = localStorage.chartBullets ?
        [localStorage.chartBullets, getCurrentDateTime()] :
        [getCurrentDateTime()];

      localStorage.chartBullets = chartBullets;

      setNewPositionOpen(Math.floor(Math.random() * 100));
    } catch (error) {
      console.error('API request error:', error.response || error);
      toast.error('Failed to open position.', { position: 'top-right' });
      setIsPositionOpening(false);
    }
  };

  // Handlers for input changes
  const handleQtyInputChange = (value) => {
    setInputQtyValue(value);
  };

  const handleQtyOptionChange = (selectedOption) => {
    setSelectedQtyOption(selectedOption);
    setQuantity(parseFloat(selectedOption.value) || 0);
  };

  const handleLotStepOptionChange = (selectedOption) => {
    setSelectedLotStepOption(selectedOption);
    const selectedLotStepValue = parseFloat(selectedOption.value) || 0.1;
    setSelectedLotStep(selectedLotStepValue);
    setQuantity(selectedLotStepValue * lotSize); // Set quantity based on selected lot step
  };

  // Labels for CreatableSelect
  const formatCreateLabelQty = (inputValue) => `Add "${inputValue}"`;
  const formatCreateLabelLots = (inputValue) => `Add "${inputValue}"`;

  const handleIncrement = (type) => {
    if (type === 'quantity') {
      setQuantity((prevQuantity) => (parseFloat(prevQuantity) + 1).toFixed(2));
    } else if (type === 'lots') {
      // Logic to increment lot step
      const currentIndex = lotSteps.findIndex(step => step.value === selectedLotStepOption.value);
      if (currentIndex < lotSteps.length - 1) {
        handleLotStepOptionChange(lotSteps[currentIndex + 1]);
      }
    }
  };

  const handleDecrement = (type) => {
    if (type === 'quantity') {
      setQuantity((prevQuantity) => (prevQuantity > 1 ? parseFloat(prevQuantity) - 1 : 1).toFixed(2));
    } else if (type === 'lots') {
      // Logic to decrement lot step
      const currentIndex = lotSteps.findIndex(step => step.value === selectedLotStepOption.value);
      if (currentIndex > 0) {
        handleLotStepOptionChange(lotSteps[currentIndex - 1]);
      }
    }
  };



  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
      {/* Buy Button */}
      <button
         title={
              
          // platFromData[5]?.accessRight == 3
          // ? "Trading for this Account in Disabled"
          // :platFromData[5]?.accessRight == 2
          //   ? "The status of this account is set to Close Only . You can only close your existing Positions" 
          //   : 
            ""
      } 
        disabled={platFromData[5]?.accessRight == 2 ||platFromData[5]?.accessRight == 3|| localStorage.getItem('accountType') =="0"||!newBidprice || !newAskprice || isPositionOpening || selectedSymbolSession === 0 || isButtonDisabled}
        style={{
          width: '110px',
          height: '55px',
          textAlign: 'left',
          backgroundColor: selectedStyle.buyColor,
          color: 'white',
          fontSize: '14px',
          border: 'none',
          // borderRadius: '5px',
          cursor: 'pointer',
        }}
        className='buy-button-mob-comp'
        onClick={() => {
          setDirection('Buy');
          console.log('Direction set to Buy');
          // placeOrder();
          setNewOrder(true);
        }}
      >
        <span>
          Buy:
        </span>
          <br />
        <span style={{fontWeight: 'bold'}}>
          {formatPrice(newAskprice)}
        </span>
      </button>

      {/* Quantity or Lot Step Selector */}
      {symbolInfo?.trade_type === 'units' ? (
        <div>
          {symbolInfo.type === 'base_asset' ? (
            <div className="quantity-div">
              <CreatableSelect
                styles={customStyles}
                onInputChange={handleQtyInputChange}
                inputValue={inputQtyValue}
                value={selectedQtyOption}
                onChange={handleQtyOptionChange}
                options={unitOptions}
                isSearchable
                placeholder="Select Quantity"
                formatCreateLabel={formatCreateLabelQty}
              />
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button style={customStyleforicons} onClick={() => handleDecrement('quantity')}>-</button>
                <input
                  type="number"
                  className="amount-input"
                  value={quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*\.?\d{0,8}$/.test(value)) {
                      setQuantity(value);
                    }
                  }}
                  onBlur={() => {
                    if (quantity === "" || isNaN(quantity)) {
                      setQuantity(0.0); // Set to zero if the input is empty or invalid
                    } else {
                      setQuantity(parseFloat(quantity).toFixed(2)); // Format it to 8 decimals
                    }
                  }}
                  placeholder="Quantity"
                  style={{ width: '110px', padding: '5px', height: '30px', textAlign: 'center', borderRadius: '0px' }}
                />
                <button style={customStyleforicons} onClick={() => handleIncrement('quantity')}>+</button>
              </div>
            </div>
          ) : (
            <div className="amount-div">
              <input
                  type="number"
                  className="amount-input"
                  value={quantity}
                  onChange={(e) => {
                    const value = e.target.value; 
                    if (/^\d*\.?\d{0,8}$/.test(value)) {setQuantity(value);}}}
                    onBlur={() => {
                      if (quantity === "" || isNaN(quantity)) {
                        setQuantity(0.1); // Set to zero if the input is empty or invalid
                      } else {
                        setQuantity(parseFloat(quantity).toFixed(2)); // Format it to 8 decimals
                      }
                    }}
                  placeholder="Quantity"
                  style={{ width: '110px', padding: '5px', height: '30px', textAlign: 'center', borderRadius: '0px' }}
                />
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button  style={customStyleforicons} onClick={() => handleDecrement('quantity')}>-</button>
                <button  style={customStyleforicons} onClick={() => handleIncrement('quantity')}>+</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="lots-selector-container">
          <CreatableSelect
            styles={customStyles}
            onInputChange={(value) => setInputValue(value)}
            inputValue={inputValue}
            value={selectedLotStepOption}
            onChange={handleLotStepOptionChange}
            options={lotSteps}
            isSearchable
            placeholder="Select Lot Step"
            formatCreateLabel={formatCreateLabelLots}
          />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button style={customStyleforicons}   onClick={() => handleDecrement('lots')}>-</button>
            <button  style={customStyleforicons} onClick={() => handleIncrement('lots')}>+</button>
          </div>
        </div>
      )}
      
        
      {/* Sell Button */}
      <button
         title={
              
          // platFromData[5]?.accessRight == 3 
          // ? "Trading for this Account in Disabled"
          // :platFromData[5]?.accessRight == 2
          //   ? "The status of this account is set to Close Only . You can only close your existing Positions" 
          //   :
            
            ""
      } 
        disabled={platFromData[5]?.accessRight == 2 ||platFromData[5]?.accessRight == 3|| localStorage.getItem('accountType') =="0"||!newBidprice || !newAskprice || isPositionOpening || selectedSymbolSession === 0 || isButtonDisabled}
        style={{
          width: '110px',
          height: '55px', 
          textAlign: 'right',
          backgroundColor: selectedStyle.sellColor,
          color: 'white',
          border: 'none',
          fontSize: '14px',
          cursor: 'pointer',
        }}
        className='sell-button-mob-comp'
        onClick={() => {
          setDirection('Sell');
          console.log('Direction set to Sell');
          setNewOrder(true);
        }}
      >
        <span>
          Sell:
        </span>
          <br />
        <span style={{fontWeight: 'bold'}}>
          {formatPrice(newBidprice)}
        </span>
      </button>
      
    </div>
  );
};

export default OrderControl;
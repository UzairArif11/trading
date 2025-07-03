import React, { createContext, useContext, useEffect, useState } from 'react';
import APIMiddleware from '../data/api/Api-Middleware';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import {
  API_ENDPOINT_LEVERAGE,
  API_ENDPOINT_SYMBOLS,
  API_ENDPOINT_SESSION,
  API_ENDPOINT_SYMBOL_INFO,
  API_ENDPOINT_SESSION_DETAIL,
} from '../data/Endpoints-API';

import { useAuthContext } from './Auth-Context';
import MarketUnitOptions from '../components/utils/MarketUnitOptions';
import axios from 'axios';
import { PromotionContext } from './promotionContext';
import { useAccountManagerContext } from './Account-Manager-Context';

export const SymbolContext = createContext();

export const useSymbolContext = () => {
  return useContext(SymbolContext);
};

export const SymbolProvider = ({ children }) => {
  const {
    user,
    // updateUserAuthorization,
    selectedAuthSymbol,
    setAuthSelectedSymbol,
    setAuthSelectedCategory,
    setIsMariginCallVisible,
    allValidSymbols,
    platFromData,
    setSelectedAuthSymbolId,
     setReloadApi,logout , setVariantLogout 
  } = useAuthContext();
  const { setShowBank, setBankDetails } =  useAccountManagerContext();
  const { fetchUpdates } = useContext(PromotionContext);
  // Make Ripple Effect Function
  const mkRipple = (e, getColor) => {
    if (e.target.className != 'ripple_once') {
      const size = e.target.getClientRects()[0].width;
      const ripple = document.createElement('div');
      let color;
      if (getColor == undefined) {
        color = getComputedStyle(e.target).color;
      } else {
        color = getColor;
      }
      e.target.style.position = 'relative';
      e.target.style.overflow = 'hidden';
      ripple.className = 'ripple_once';
      ripple.style.transition = '.6s ease';
      ripple.style.backgroundColor = color;
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '100%';
      ripple.style.top = `${e.nativeEvent.offsetY - size / 2}px`;
      ripple.style.left = `${e.nativeEvent.offsetX - size / 2}px`;
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.transform = 'scale(0)';
      ripple.style.opacity = 0.5;
      e.target.append(ripple);
      setTimeout(() => {
        ripple.style.transform = 'scale(2)';
        ripple.style.opacity = 0;
        setTimeout(() => {
          ripple.remove();
        }, 1000);
      }, 50);
    }
  };

  const [loadingSymbolContext, setLoadingSymbolContext] = useState(true);
  const [bidPrice, setBidPrice] = useState(null);
  const [askPrice, setAskPrice] = useState(null);
  const [bidPriceExchangeRate, setBidPriceExchangeRate] = useState(1);
  const [askPriceExchangeRate, setAskPriceExchangeRate] = useState(1);

  const [clickedPosition, setClickedPosition] = useState(false);

  //store list of all symbols
  const [symbolData, setSymbolData] = useState({});
  const [symbolNames, setSymbolNames] = useState([]);
  const [symbolWithCategories, setSymbolWithCategories] = useState({});
  const [symbolCategories, setSymbolCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(1);
  const [selectedSymbolSession, setSelectedSymbolSession] = useState(1);
  const [symbolInfo, setSymbolInfo] = useState({});
  const [symbolNumberFormat, setSymbolNumberFormat] = useState('#,###.00###');
  const [marketHours, setMarketHours] = useState({});
  const [showNetPnl, setShowNetPnl] = useState(true);
  const [showRLPnl, setShowRLPnl] = useState(true);
  const [showGrossPnl, setShowGrossPnl] = useState(true);
  const [leverage, setLeverage] = useState({});
  const [hideLeverageCard, setHideLeverageCard] = useState(false)
  const [symbolDetails, setsymbolDetails] = useState({});
  const [selectedSymbolOption, setSelectedSymbolOption] = useState({
    value: selectedAuthSymbol,
    label: selectedAuthSymbol,
  });
  const [newPositionOpen, setNewPositionOpen] = useState(false);
  const [quoteCurrency, setQuoteCurrency] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('');
  const [lotSize, setLotSize] = useState(1);
  const [lotSteps, setLotSteps] = useState(0.0);
  const [unitOptions, setUnitOptions] = useState();
  const [fetchUserDetails, setFetchUserDetails] = useState("");
  const [fetchUserDetails2, setFetchUserDetails2] = useState("");
  const [selectedSymbolExchangeRate, setSymbolExchangeRate] = useState(1);
  const [selectedSymbolQuoteExchangeRate, setSymbolQuoteExchangeRate] =
    useState(1);
  const [isPositionEdited, setIsPositionEdited] = useState(false);
  const [activeLvg, setActiveLvg] = useState(null);
  const [showPriceAlert, setShowPriceAlert] = useState(false)
  const [priceAlertDetails, setPriceAlertDetails] = useState({
    symbol:"",
    quantity:1,
    title:'',
    description:"",
    readOnly:false,
  })
  
  const [showTooltip, setShowTooltip] = useState(false);
  const [currentExposureLevel, setCurrentExposureLevel] = useState(null);

  const [showBullets , setShowBullets] = useState(()=>{
    return localStorage.getItem('chartBullets') == 'true';
  });

  const allSymbolOptions =  symbolNames.map(( value) => ({
    value: value,
    label: value,

  }));


  const handleSymbolOptionChange = (selectedAuthSymbol) => {

    setSelectedSymbolOption(selectedAuthSymbol);
    setSelectedCategoryId(symbolData[selectedAuthSymbol.value]?.symbol_category);
    setSelectedSymbolSession(symbolData[selectedAuthSymbol.value]?.is_session_active);
    setAuthSelectedCategory(symbolData[selectedAuthSymbol.value]?.symbol_category);
    setAuthSelectedSymbol(selectedAuthSymbol.value);

    localStorage.setItem('symbol_id', symbolData[selectedAuthSymbol.value]?.id);
    localStorage.setItem('category', symbolData[selectedAuthSymbol.value]?.symbol_category);

    // const { value, bid, ask, category, is_session_active } = selectedAuthSymbol;
    // updateSymbolData(value, bid, ask, category);
    // updateSymbolDetailsData(value)
  };

  useEffect(() => {
    localStorage.setItem("showTooltip", showTooltip);
  }, [showTooltip]);

  useEffect(()=>{
    localStorage.setItem('chartBullets',showBullets);
  },[showBullets])

  useEffect(() => {

    if (user &&selectedAuthSymbol&& user.userId != undefined && user.userId > 0) {

      // Initialize WebSocket connection
      const socket = io(process.env.REACT_APP_SOCKET_URL, {
        transports: ['websocket'],
      });

      // Handle WebSocket connection
      socket.on('connect', () => {
        console.log('Connected to WebSocket');
       
          socket.emit('joinRoom', user.userId.toString()); // Join the room based on user ID
          console.log(`Joined room for user ${user.userId}`);
      
      });

      // Register custom event listeners
      socket.on('feedback_updated', (data) => {
        console.log('Received feedback_updated log:', data);
        if (data.display) {
          toast.success(`${data.status}`);
        }
      });

      socket.on('sltpLog', (data) => {
        console.log('Received SLTP log:', data);
        if (data.display) {
          toast.warning(`${data.status}`);
        }
      });

      socket.on('marginCallLog', (data) => {
        console.log('Received SLTP log:', data);
        if (data.display) {
          // toast.warning(`${data.status}`);
          setIsMariginCallVisible(true);
        }
      });
      socket.on('variant_logout', (data) => {
        const variant_id = localStorage.variantId;
        console.log(variant_id, 'Received variant_logout log:', data);
        if(variant_id == data.variant_id){
          setVariantLogout(true);
          setTimeout(() => {
            console.log("variant logout called===============================================================");
            logout();
            setVariantLogout(false);
          }, 3000);
        }
        
      });

      socket.on('is_liquidate', (data) => {
        console.log('Received is_liquidate log:', data);
        if (data.display) {
          toast.warning(`${data.status}`);
        }
      });
      socket.on('symbolsDetailsInfo', (data) => {
        setFetchUserDetails(Date.now())
        console.log(selectedAuthSymbol,'Received symbolsDetailsInfo updations:', data);
        updateSymbolDetailsData(selectedAuthSymbol);
      });
      socket.on('userDetailsInfo', (data) => {
        setFetchUserDetails2(Date.now())
        console.log(selectedAuthSymbol,'Received userDetailsInfo updations:', data);
      
      });
      socket.on('promotion_fetch', (data) => {
        console.log(selectedAuthSymbol,'Received promotion_fetch updations:', data);
        fetchUpdates();
      });
      socket.on('logout',async (data) => {
        await logout();
      });
      socket.on('system_notification_fetch', (data) => {
        setReloadApi(Date.now());
        console.log('Received system_notification_fetch:', data);
        toast.info('New system notification received!', {
          position: "top-right",
          autoClose: 5000,
        });
      });

      // Handle WebSocket connection errors
      socket.on('connect_error', (err) => {
        console.error('Connection errorsss:', err);
      });
      socket.on('show_bank_details', (data) => {
        setShowBank(true);
        if(data?.bank_info){
          setBankDetails(data?.bank_info);
        }
        console.log('notification received',data);
      });

      socket.on('price_drop_alert', (data) => {
        console.log(data.price_drop_data.symbol_name,'Received:', data);

        const matchingSymbol = symbolWithCategories.find(
          (symbol) => symbol.name == data.price_drop_data.symbol_name,
        );
        
        console.log(matchingSymbol,"matchingSymbolmatchingSymbolmatchingSymbolmatchingSymbol")
        if (matchingSymbol) {

          localStorage.setItem('symbol_id', matchingSymbol.id);
          localStorage.setItem('category', matchingSymbol.symbol_category);
          localStorage.setItem('symbol', matchingSymbol.name);

          setSelectedCategoryId(matchingSymbol.symbol_category);
          setAuthSelectedCategory(matchingSymbol.symbol_category);
          setSelectedSymbolSession(matchingSymbol.is_session_active);
          updateSymbolName(matchingSymbol.name);
          setAuthSelectedSymbol(matchingSymbol.name);

          setShowPriceAlert(true);
          setPriceAlertDetails({ symbol:data.price_drop_data.symbol_name,
            quantity:data.price_drop_data.quantity,
            title:data.price_drop_data.title,
            description:data.price_drop_data.comment,
            readOnly:data.price_drop_data.quantity_change == 'false'
          })

      }
      });

      // Cleanup WebSocket connection on component unmount
      return () => {
        socket.disconnect();
        console.log('Socket disconnected');
      };
    }
  }, [user?.userId,selectedAuthSymbol]);
  useEffect(() => {
    if (user && user.userId != undefined && user.userId > 0) {
      loadSymbolName();
    }
  }, [allValidSymbols]);

  // const loadSymbolName = async () => {
  //   // get symbols by api
  //   // const response = await APIMiddleware.get(API_ENDPOINT_SYMBOLS(user.userId));
  //   // if (response.data) {
  //     // Extracting symbols names
  //     const symbolNames = allValidSymbols[0].map(symbol => symbol.name);
  //     if(localStorage.symbol == null){
  //     setAuthSelectedSymbol(symbolNames[0]);
  //       allValidSymbols[0].map((symbol)=>{
  //         if(symbol.name === symbolNames[0]){
  //           setSelectedCategoryId(symbol.symbol_category);
  //           setAuthSelectedCategory(symbol.symbol_category);
  //           setSelectedSymbolSession(symbol.is_session_active);
  //         }
  //     })
  //       // setSelectedCategoryId(symbolNames[0][0].symbol_category);
  //       // setAuthSelectedCategory(symbolNames[0][0].symbol_category);
  //       // setSelectedSymbolSession(symbolNames[0][0].is_session_active);

  //     }else{
  //       setAuthSelectedSymbol(localStorage.symbol);
  //       allValidSymbols[0].map((symbol)=>{
  //           if(symbol.name === localStorage.symbol){
  //             setSelectedCategoryId(symbol.symbol_category);
  //             setAuthSelectedCategory(symbol.symbol_category);
  //             setSelectedSymbolSession(symbol.is_session_active);
  //           }
  //       })
  //     }
  //     setSymbolNames(symbolNames);

  //     setSymbolWithCategories(allValidSymbols[0]);
  //     setSymbolCategories(allValidSymbols[1]);
  //     const symbolDetailsData = {};

  //     //setting initial values to all symbols
  //     allValidSymbols[0].forEach((symbol) => {
  //         symbolDetailsData[symbol.name] = { pip_position: symbol.pip_position, digit: symbol.digit, symbol_category: symbol.symbol_category, is_session_active: symbol.is_session_active};
  //     });

  //     setsymbolDetails(symbolDetailsData);

  //     setLoadingSymbolContext(false);
  //   // }
  // }

  useEffect(() => {
    if (platFromData[6] && platFromData[6].availableLeverage) {
      setLeverage(platFromData[6]?.availableLeverage[0]?.available_leverage);
      const availableLeverage = platFromData[6].availableLeverage[0] || {};
      setHideLeverageCard(availableLeverage.is_hidden === 0)
      setShowGrossPnl(availableLeverage.show_gross_pnl === 1);
      setShowNetPnl(availableLeverage.show_net_pnl === 1);
      setShowRLPnl(availableLeverage.show_todayRlPNL === 1);
    }
  },[platFromData[6]])

  
  
  useEffect(() => {
    console.log("ON SYMBOL CHANGE", symbolInfo);
    
        if (user && user.userId != undefined && user.userId > 0 && symbolInfo.quote_asset) {
          calculateApiExchangeRate();
          calculateQuoteApiExchangeRate();
    
        } 
      }, [ user, symbolInfo]);

  const calculateExchangeRate = (quotePrice, accPrice) => {
    return quotePrice / accPrice;
  };
  const calculateQuoteExchangeRate = (quotePrice, accPrice) => {
    return accPrice / quotePrice;
  };
  function getValidQuoteAsset(quoteAsset) {
  const supportedQuotes = [
    'TRY',
    'USD',
    'BRL',
    'JPY',
    'ZAR',
    'PLN',
    'MXN',
    'RON',
    'CZK'
  ];

  const asset = quoteAsset?.toUpperCase();
  return supportedQuotes.includes(asset) ? asset : 'USD';
}

  const calculateApiExchangeRate = () => {
      
    const dynamicUrl = process.env.REACT_APP_EXCHANGE_RATE_API;
    const userCurrency = user?.userCurrencyName || "EUR";
    // Payload for the POST request

    const payload = {
      quotation: getValidQuoteAsset(symbolInfo.quote_asset),
    };

    axios.post(dynamicUrl, payload)
    .then((response) => {
      const data = response.data;
  
  if(response.status == 204) {
    console.log("Exchange rate not found, setting default to 1============");
  }else if (data) {
        const rate = data[userCurrency];
        if (rate) {
          console.log( " rate?rate:currency",rate)
        setSymbolExchangeRate(rate);
      } else {
        setSymbolExchangeRate(1);
        console.error(`Exchange rate for ${userCurrency} not found.`);
      }
      }
    })
    .catch((error) => {
      setSymbolExchangeRate(1);
    
      console.error("Error fetching exchange rate1:",dynamicUrl,payload, error);
    });

  };

  //Calculates exchange rate in quote currency of selected symbol 
  const calculateQuoteApiExchangeRate = () => {
      
    const dynamicUrl = process.env.REACT_APP_EXCHANGE_RATE_API;
    const userCurrency = user?.userCurrencyName || "EUR";
    // Payload for the POST request

    const payload = {
      quotation: getValidQuoteAsset(symbolInfo.quote_asset),
    };

    axios.post(dynamicUrl, payload)
    .then((response) => {
      const data = response.data;
  
  if(response.status == 204) {
    console.log("Exchange rate not found, setting default to2============");
  }else if (data) {
        const rate = data[userCurrency];
        if (rate) {
          console.log( " rate?rate:quotes",1/rate)
         setSymbolQuoteExchangeRate(1/rate);
      } else {
         setSymbolQuoteExchangeRate(1);
        console.error(`Exchange rate for ${userCurrency} not found.`);
      }
      }
    })
    .catch((error) => {
       setSymbolQuoteExchangeRate(1);
    
      console.error("Error fetching exchange rate2:",dynamicUrl,payload, error);
    });

  };

  const loadSymbolName = async () => {
    // get symbols by api
    // const response = await APIMiddleware.get(API_ENDPOINT_SYMBOLS(user.userId));
    // if (response.data) {
    // Extracting symbols names
    const symbolNames = allValidSymbols[0].map((symbol) => symbol);
    if (localStorage.symbol == null) {
      // console.log(symbolNames[0].symbol_category,symbolNames[0].name)
      setAuthSelectedSymbol(symbolNames[0].name);
      setSelectedAuthSymbolId(symbolNames[0].id);
      setSelectedCategoryId(symbolNames[0].symbol_category);
      setAuthSelectedCategory(symbolNames[0].symbol_category);
      setSelectedSymbolSession(symbolNames[0].is_session_active);
    } else {
      setAuthSelectedSymbol(localStorage.symbol);
      setSelectedAuthSymbolId(localStorage.symbol_id);
      allValidSymbols[0].map((symbol) => {
        if (symbol.name === localStorage.symbol) {
          setSelectedCategoryId(symbol.symbol_category);
          setAuthSelectedCategory(symbol.symbol_category);
          setSelectedSymbolSession(symbol.is_session_active);
        }
      });
    }
    setSymbolNames(symbolNames.map((symbol) => symbol.name));

    setSymbolWithCategories(allValidSymbols[0]);
    setSymbolCategories(allValidSymbols[1]);
    const symbolDetailsData = {};

    //setting initial values to all symbols
    allValidSymbols[0].forEach((symbol) => {
      symbolDetailsData[symbol.name] = {
        pip_position: symbol.pip_position,
        digit: symbol.digit,
        symbol_category: symbol.symbol_category,
        is_session_active: symbol.is_session_active,
      };
    });

    setsymbolDetails(symbolDetailsData);

    setLoadingSymbolContext(false);
    // }
  };

  const loadAllSymbolsData = (data) => {
    setSymbolData((prevPrices) => ({
      ...prevPrices,
      ...data
    }));
 
  };
  //update symbols default values
  const updateSymbolData = (symbol,ea,eb, bid, ask,is_session_active) => {
    setAuthSelectedSymbol(symbol);
    setBidPrice(bid);
    setAskPrice(ask);
    setBidPriceExchangeRate(eb);
    setAskPriceExchangeRate(ea);
    setSelectedSymbolSession(is_session_active);
    // updateSymbolInfo(symbol);
    // updateMarketHours(symbol);
    // updateLeverage(symbol);
    setSelectedSymbolOption({ value: symbol, label: symbol });
  };

  //update symbols lev/ mkt hours etc
  const updateSymbolDetailsData = (symbol) => {
    // updateLeverage(symbol);
    updateSymbolInfo(symbol);
    // updateMarketHours(symbol);
  };

  const updateSymbolName = (symbol) => {
    setAuthSelectedSymbol(symbol);
  };

  const updateSymbolInfo = async (symbol) => {
    try {
      if (user && user.userId != undefined && user.userId > 0) {
        // get the selected symbol's info using param and return that data in setSymbolInfo as param to show on frontend

        const parts = symbol.split('USD');
        const quoteAsset = 'USD';
        const baseAsset = parts[0];
        const response = await APIMiddleware.get(
          API_ENDPOINT_SYMBOL_INFO(user.userId, symbol),
        );
        const responseData = response.data[0];
        const symbolInfo = {
          base_asset: responseData.base_asset
            ? responseData.base_asset
            : baseAsset,
          quote_asset: responseData.quote_asset
            ? responseData.quote_asset
            : quoteAsset,
          pip_position: responseData.pip_position,
          lot_size:
            responseData.lot_size <= 0 || !responseData.lot_size
              ? 100000
              : responseData.lot_size,
          trade_type: responseData.trade_type || 'units',
          // swap_long: 1111,
          // swap_short: 1111,
          // three_day_swaps: 1111,
          swap_long: responseData.swap_long,
          swap_short: responseData.swap_short,
          three_day_swaps: responseData.three_days_swap,
          digit: responseData.digit,
          asset_name: responseData.asset_name || 'Cryptocurrencies',
          asset_id: responseData.asset_id || 2,
          show_stop_out_details : responseData.show_stop_out_details,
          weekend_swap : responseData.weekend_swap,
          swap_time : responseData.swap_time,
          swap_period : responseData.swap_period,
          grace_period : responseData.grace_period,
          hide_swap_details : responseData.hide_swap_details
        };
        setSymbolInfo(symbolInfo);
        setSymbolNumberFormat(
          parseFloat(symbolInfo.digit)
            ? `#,###.${'0'.repeat(symbolInfo.digit)}`
            : `#,###.00`,
        );
        setQuoteCurrency(symbolInfo?.quote_asset);
        setBaseCurrency(symbolInfo?.base_asset);
        setLotSize(symbolInfo?.lot_size);

        setUnitOptions(MarketUnitOptions[symbolInfo.asset_name]);

        let miniLotSize = process.env.REACT_APP_LOT_SIZE || 10000;
        let result = parseFloat(miniLotSize) / parseFloat(symbolInfo?.lot_size);

        let step = 1;
        let stepArr = [];
        while (step <= 10) {
          // Corrected loop condition
          let lotSteps = (result * step).toFixed(8);
          stepArr.push({ label: lotSteps + ' ' + 'Lots', value: lotSteps });
          step++;
        }

        setLotSteps(stepArr);
      }
    } catch (error) {
      // Handle API request error
      console.error(`API request error: ${API_ENDPOINT_SYMBOL_INFO}`, error);
    }
  };

  const updateMarketHours = async (symbol) => {
    try {
      if (user && user.userId !== undefined && user.userId > 0) {
        const response = await APIMiddleware.get(
          API_ENDPOINT_SESSION_DETAIL(user.userId, symbol),
        );
        const marketHours = response.data.map((rowData) => {
          const isActive = rowData.is_active === 1; // Convert 1 to true, 0 to false
          return {
            start_day: rowData.start_day,
            start_time: rowData.start_time,
            end_day: rowData.end_day,
            end_time: rowData.end_time,
            is_active: isActive,
          };
        });

        setMarketHours(marketHours);
      }
    } catch (error) {
      // Handle API request error
      console.error(`API request error: ${API_ENDPOINT_SESSION_DETAIL}`, error);
    }
  };

  const updateLeverage = async (symbol) => {
    try {
      if (user && user.userId != undefined && user.userId > 0) {
        const response = await APIMiddleware.get(
          API_ENDPOINT_LEVERAGE(user.userId, symbol),
        );
        const responseData = response.data[0];
        const leverage = [
          {
            exposure_level: responseData.exposure_level
              ? responseData?.exposure_level?.toString()
              : 0,
            available_leverage: responseData?.available_leverage?.toString(),
            is_hidden: responseData.is_hidden,
          },
        ];

        setLeverage(leverage);
        setShowGrossPnl(responseData?.show_gross_pnl == 1 ? true : false);
        setShowNetPnl(responseData?.show_net_pnl == 1 ? true : false);
        setShowRLPnl(responseData?.show_todayRlPNL == 1 ? true : false);
      }
    } catch (error) {
      // Handle API request error
      console.error(`API request error: ${API_ENDPOINT_LEVERAGE}`, error);
    }
  };

  return (
    <SymbolContext.Provider
      value={{
        clickedPosition, setClickedPosition,
        showTooltip, setShowTooltip,
        showBullets, setShowBullets,
        loadingSymbolContext,
        symbolData,
        bidPrice,
        askPrice,
        askPriceExchangeRate,
        bidPriceExchangeRate,
        symbolNames,
        symbolInfo,
        marketHours,
        leverage,
        allSymbolOptions,
        selectedSymbolOption,
        symbolDetails,
        newPositionOpen,
        setNewPositionOpen,
        isPositionEdited,
        setIsPositionEdited,
        loadAllSymbolsData,
        updateSymbolData,
        updateSymbolName,
        handleSymbolOptionChange,
        mkRipple,
        updateSymbolDetailsData,
        setLoadingSymbolContext,
        symbolWithCategories,
        symbolCategories,
        selectedCategoryId,
        setSelectedCategoryId,
        selectedSymbolSession,
        setSelectedSymbolSession,
        baseCurrency,
        quoteCurrency,
        selectedSymbolQuoteExchangeRate,
        selectedSymbolExchangeRate,
        symbolNumberFormat,
        setSymbolNumberFormat,
        lotSize,
        setLotSize,
        lotSteps,
        unitOptions,
        showGrossPnl,
        showNetPnl,
        showRLPnl,
        hideLeverageCard,
        activeLvg,
        setActiveLvg,
        showPriceAlert,
        setShowPriceAlert,
        priceAlertDetails,
        setPriceAlertDetails,
        fetchUserDetails,
        fetchUserDetails2,
        currentExposureLevel,
        setCurrentExposureLevel
      }}
    >
      {children}
    </SymbolContext.Provider>
  );
};

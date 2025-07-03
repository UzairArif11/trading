import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthContext } from "./Auth-Context";

export const OrderContext = createContext();
export const useOrderContext = () => {
  return useContext(OrderContext);
};

export const OrderProvider = ({ children }) => {
  const { user } = useAuthContext();

  const [font, setFont] = useState("Default");
  useEffect(() => {
    const idTime = setTimeout(() => {
      if(localStorage.getItem('storedFont') != null){
        setFont(localStorage.getItem('storedFont'));
      } else {
        setFont('Large');
      }
    }, 2000);
  
    return () => {
      clearTimeout(idTime);
    }
  }, [])
  
  const [appElements, setAppElements] = useState([]);

  const [exchangeRate, setExchangeRate] = useState(0.0);
  const [quoteExchangeRate, setQuoteExchangeRate] = useState(0.0)

  //Calculating it using symbol context
  // useEffect(() => {
  //   if (user && user.userId != undefined && user.userId > 0) {
  //     currencyConvertedRate();
  //     quoteCurrencyConvertedRate()
  //   }
  // }, [user]);

  // const currencyConvertedRate = () => {
  //   const dynamicUrl = "https://api.exchangerate-api.com/v4/latest/USD"; //Deal with it later
  //   // Fetch exchange rate from API
  //   fetch(dynamicUrl)
  //     .then((response) => response.json())
  //     .then((data) => {
  //       const userCurrency = user?.userCurrencyName || "USD";
  //       if (data.rates[userCurrency]) {
          
  //         const rate = data.rates[userCurrency];
       
  //         setExchangeRate(rate);
  //       } else {
  //         console.error(`Exchange rate for ${userCurrency} not found.`);
  //       }
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching exchange rate:", error);
  //     });
  // };
  // const quoteCurrencyConvertedRate = () => {
  //   const userCurrency = user?.userCurrencyName || "USD";
  //   const dynamicUrl = `https://api.exchangerate-api.com/v4/latest/${userCurrency}`; //Deal with it later
  //   // Fetch exchange rate from API
  //   fetch(dynamicUrl)
  //     .then((response) => response.json())
  //     .then((data) => {
  //       if (data.rates['USD']) {
  //         const rate = data.rates['USD'];
  //         setQuoteExchangeRate(rate);
  //       } else {
  //         console.error(`Exchange rate for ${userCurrency} not found.`);
  //       }
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching exchange rate:", error);
  //     });
  // };

  return (
    <OrderContext.Provider
      value={{
        exchangeRate,
        setExchangeRate,
        font,
        quoteExchangeRate,
        setQuoteExchangeRate,
        setFont,
        appElements,
        setAppElements,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

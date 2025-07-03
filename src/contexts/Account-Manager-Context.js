import React, { createContext, useContext, useState } from 'react';
import { API_ENDPOINT_CLOSE_ORDER, API_ENDPOINT_CLOSE_POSITION, API_ENDPOINT_USER_DETAILS, API_ENDPOINT_OPEN_POSITION, API_ENDPOINT_CANCEL_ORDER, API_ENDPOINT_CLOSE_ALL_POSITIONS, API_ENDPOINT_CLOSE_ALL_ORDERS } from '../data/Endpoints-API';
import APIMiddleware from '../data/api/Api-Middleware';
import { useAuthContext } from './Auth-Context';
import { useOrderContext } from './Order-Context';
import { toast } from 'react-toastify';
// import { Position } from '../../../interfaces/Position.js';

export const AccountManagerContext = createContext();

export const useAccountManagerContext = () => {
  return useContext(AccountManagerContext);
};

export const AccountManagerProvider = ({ children }) => {
  //CONTEXT
  const { updateUserData, login, user, updateUserData_Local, sendDataToServer } = useAuthContext();
  const [openPositions, setOpenPositions] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [closedPositionsAll, setClosedPositionsAll] = useState([]);
  const [closedOrders, setClosedOrders] = useState([]);
  const [openTrades, setOpenTrades] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [isClosing, setIsClosing] = useState(false);
  const [isClosingPosition, setIsClosingPosition] = useState(false);
  const [isClosingAllPositions, setIsClosingAllPositions] = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [isPositionClosed, setIsPositionClosed] = useState(false)
  const [isClosingOrder, setIsClosingOrder] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState({});
  const [isOrderClosing, setIsOrderClosing] = useState(false)
  const [orderHistoryCount, setOrderHistoryCount] = useState(0)
  const [positionCount, setPositionCount] = useState(0)
  const [positionHistoryCount, setPositionHistoryCount] = useState(0)
  const [botPositionHistoryCount, setBotPositionHistoryCount] = useState(0)
  const [totalBotPositionHistoryCount, setTotalBotPositionHistoryCount] = useState(0)
  const [ordersCount, setOrdersCount] = useState(0)
  const [closedPositionLength, setClosedPositionLength] = useState(0)
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [bankDetails, setBankDetails] = useState({"description":""});
  const [selPositionId, setSelPositionId] = useState([]);


  let getActiveTab
  if (localStorage.accountManager !== null ) {
    getActiveTab = localStorage.accountManager;
  } else {
    getActiveTab = "open-positions-acc";
  }
  if(getActiveTab === undefined){
    getActiveTab = "open-positions-acc";
  }
  const [activeTab, setActiveTab] = useState(getActiveTab);
  // const [leverage, setLeverage] = useState({});
  // const [deposite, setDeposite] = useState({});

  // const updateAccountDetails = async (data) => {
  //   setLeverage(data.leverage);
  //   setDeposite(data.deposite);
  // };

  const openPosition = async (position) => {
    // Add the opened position to the openPositions array
    setOpenPositions([...openPositions, position]);
    // updateUserData_Local('opened new position');
  };

  const openOrder = async (order) => {
    // Add the opened order to the openOrders array
    setOpenOrders([...openOrders, order]);
  };

  const setAllOpenOrders = (orders) => {
    // Add all opened orders to the openOrders Context state
    setOpenOrders(orders);
  };

  const setAllOpenPositions = (positions) => {
    // Add all opened position to the openPositions Context state
    setOpenPositions(positions);
  };

  const setAllClosePositions = (positions) => {
    // Add all closed position to the closedPositions Context state
    // setClosedPositions(positions);
  };

  const setAllCloseOrders = (orders) => {
    // Add all closed order to the closedOrders Context state
    setClosedOrders(orders);
    // setClosedOrders(orders.sort((a, b) => b.status_updated_at - a.status_updated_at));
  };

  const closePosition = async (userId, position, exitPrice, direction) => {
    setIsClosingPosition(true);
    const currentDate = new Date();
    const currentDateTime = new Date(currentDate);
    position.exit_price = exitPrice;
    position.position_closed_at = currentDateTime
    const data = {
      userId: userId,
      id: position.id,
      exit_price: position.exit_price,
      position_closed_at: position.position_closed_at,
      symbol: position.symbol,
      direction: direction
    };

    try {
      const response = await APIMiddleware.post(API_ENDPOINT_CLOSE_POSITION(), data);
      if (response.data) {
        
        setIsPositionClosed(Math.floor(Math.random()*100))
        // Remove the closed position from openPositions and add it to closedPositions
        // setOpenPositions(openPositions.filter((p) => p.id !== position.id));
        // setClosedPositions([...closedPositions, position]);
        setIsClosing(false);
        // updateUserData(response.data);
        sendDataToServer(3);
        //setLoadingSymbolContext(false);
        toast.warning('Position closed successfully!', { position: 'top-right' });
        // setIsClosingPosition(false);
        document.getElementById('closeSound').play();
        const getCurrentDateTime = () => {
          var currentDate = new Date();
          var year = currentDate.getFullYear();
          var month = ('0' + (currentDate.getMonth() + 1)).slice(-2); // Adding 1 because months are zero-indexed
          var day = ('0' + currentDate.getDate()).slice(-2);
          var hour = ('0' + currentDate.getHours()).slice(-2);
          var minute = ('0' + currentDate.getMinutes()).slice(-2);
          var currentDateTime = `${year}-${month}-${day} ${hour}:${minute}:00`;
          return currentDateTime;
        }
        if (localStorage.chartBulletsClosed === undefined) {
          localStorage.setItem('chartBulletsClosed', getCurrentDateTime());
        } else {
          let history = [];
          history.push(localStorage.chartBulletsClosed);
          history.push(getCurrentDateTime());
          localStorage.chartBulletsClosed = history;
        }
      }
    } catch (error) {
      toast.error('An error occurred while closing the position', { position: 'top-right' });
      setIsClosingPosition(false);
 }
 finally{
  setIsClosingPosition(false);
 }
  };

  const closeAllPosition = async (userId, positionType) => {
    setIsClosingAllPositions(true);
    const response = await APIMiddleware.post(
      API_ENDPOINT_CLOSE_ALL_POSITIONS(userId, positionType)
    );

    if (response.data) {
      setIsClosing(false);
      setIsPositionClosed(Math.floor(Math.random()*100))

      // updateUserData(response.data);
      sendDataToServer(3);
      toast.warning('All positions closed successfully!', { position: 'top-right' });
      setIsClosingAllPositions(false);
      document.getElementById('closeSound').play();
      // updateUserData_Local('closed all positions');
      //setLoadingSymbolContext(false);
    }
    // }
  };

  const closeProfitablePositions = async () => {
    try {
      setIsClosingAllPositions(true);
      await closeAllPosition(user.userId, 1);
      document.getElementById('closeSound')?.play();
    } catch (error) {
      console.error('Error closing profitable positions:', error);
    } finally {
      setIsClosingAllPositions(false);
    }
  };


  const closeLosingPositions = async () => {
    try {
      setIsClosingAllPositions(true);
      await closeAllPosition(user.userId, 0);
      document.getElementById('closeSound')?.play();
      setSelPositionId([]);
    } catch (error) {
      console.error('Failed to close losing positions:', error);
    } finally {
      setIsClosingAllPositions(false);
    }
  };

  const closeAllOrder = async (userId, orderDetailsArray, orderType = 'all') => {

    try {
      setIsOrderClosing(true)
      const response = await APIMiddleware.post(
        API_ENDPOINT_CLOSE_ALL_ORDERS(userId, orderType),
        orderDetailsArray
      );
      if (response.data) {
        setIsOrderClosing(false);
        updateUserData_Local('cancelled all order');
        sendDataToServer(4);
        toast.warning('All orders closed successfully!', { position: 'top-right' });
        document.getElementById('closeSound').play();
      }
    } catch (error) {
      toast.error('An Error Occur', { position: 'top-right' });
    }
    finally{
      setIsOrderClosing(false)
    }
  };

  const closeBuyPendingOrders = async () => {
    try {
      setIsOrderClosing(true);
      await closeAllOrder(user.userId, openOrders, 'Buy');
      document.getElementById('closeSound')?.play();

    } catch (error) {
      console.error('Error closing BUY orders:', error);
    } finally {
      setIsClosingOrder(false);
    }
  };
  
  const closeSellPendingOrders = async () => {
    try {setIsOrderClosing(true);
      await closeAllOrder(user.userId, openOrders, 'Sell');
      document.getElementById('closeSound')?.play();
    } catch (error) {
      console.error('Error closing SELL orders:', error);
    } finally {
      setIsClosingOrder(false);
    }
  }

  const closeOrder = async (userId, order, exitPrice, totalUnrealizedPnL, exchangeRate, leverage) => {

    const currentDate = new Date();
    const currentDateTime = new Date(currentDate);
    order.exit_price = exitPrice;
    order.status_updated_at = currentDateTime
    const data = {
      userId: userId,
      id: order.id,
      exit_price: order.exit_price,
      status_updated_at: order.status_updated_at
    };

    const response = await APIMiddleware.post(API_ENDPOINT_CLOSE_ORDER(), data);
    if (response.data) {
      // Remove the closed order from openorders and add it to closedOrders
      // setOpenOrders(openOrders.filter((p) => p.id !== order.id));
      // const combinedOrders = [...closedOrders, order];
      // combinedOrders.sort((a, b) => b.status_updated_at - a.status_updated_at)
      // setClosedOrders(combinedOrders);
      // setClosedOrders([...closedOrders, order]);
      if (order) {
        openPositionApi(order, totalUnrealizedPnL, exchangeRate, leverage, userId);
      }
    }
  };

  const openPositionApi = async (order, totalUnrealizedPnL, exchangeRate, leverage, userId) => {
    try {
      const lvg = leverage[0]?.available_leverage > 0 ? leverage[0]?.available_leverage : 1;
      const requiredMargin = order.quantity * (order.exit_price / lvg);
      // const requiredMargin = quantity * getEntryPrice();
      const convertedRequiredMargin = requiredMargin * exchangeRate;

      const margin = isNaN(convertedRequiredMargin) ? 0 : convertedRequiredMargin;

      const currentDate = new Date();
      const currentDateTime = new Date(currentDate);
      const data = {
        id: -1,
        position_id: 'PID' + Math.floor(100000 + Math.random() * 900000),
        created_at: currentDateTime,
        symbol: order.symbol,
        quantity: order.quantity,
        direction: order.direction,
        entry_price: order.exit_price,
        converted_entry_price: order.exit_price * exchangeRate,
        TP: order.TP,
        SL: order.SL,
        netEUR: 0, // Set appropriate values
        status: '',
        userId: userId,
        // margin: margin,
        exit_price: 0,
        totalUnrealizedPnL,
      };

      const response = await APIMiddleware.post(API_ENDPOINT_OPEN_POSITION(), data);

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

      // Check if the response data matches the Position interface
      //if (Object.keys(response.data).every((key) => key in data)) {
      // openPosition(data_m);
      if (response.data) {
        sendDataToServer(4);
        updateUserData(response.data);
      }
      //}

      // Show a success notification
      toast.success('Position opened successfully!', { position: 'top-right' });
      document.getElementById('openSound').play();

    } catch (error) {
      // Handle API request error
      toast.error('An error occurred while opening the position', { position: 'top-right' });
      console.error(`API request error: ${API_ENDPOINT_OPEN_POSITION()}`, error);
    }
  };

  const cancelOrder = async (userId, order, exitPrice, status) => {
    setIsCancellingOrder(true);
    const currentDate = new Date();
    const currentDateTime = new Date(currentDate);

    order.exit_price = exitPrice;
    order.status = status;
    order.status_updated_at = currentDateTime

    const data = {
      userId: userId,
      id: order.id,
      status: status,
      exit_price: order.exit_price,
      status_updated_at: order.status_updated_at
    };

    const response = await APIMiddleware.post(API_ENDPOINT_CANCEL_ORDER(), data);
    if (response.data) {
      sendDataToServer(4);
      toast.warning('Order closed successfully!', { position: 'top-right' });
      setIsCancellingOrder(false);
      document.getElementById('closeSound').play();
      // Remove the closed order from openorders and add it to closedOrders
      // setOpenOrders(openOrders.filter((p) => p.id !== order.id));
      // setClosedOrders([...closedOrders, order]);
      // if (response.data)
      // setIsClosingOrder(false);
    }
  };

  const openTrade = (trade) => {
    // Add the opened trade to the openTrades array
    setOpenTrades([...openTrades, trade]);
  };

  const closeTrade = (trade) => {
    // Remove the closed trade from openTrades and add it to closedTrades
    setOpenTrades(openTrades.filter((t) => t.id !== trade.id));
    setClosedTrades([...closedTrades, trade]);
  };

  const updatePositionDetails = (position) => {
    setSelectedPosition(position);
  };

  return (
    <AccountManagerContext.Provider
      value={{
        openPositions,
        openOrders,
        closedPositions,
        closedOrders,
        openTrades,
        closedTrades,
        isClosing,
        isClosingOrder,
        openPosition,
        openOrder,
        setAllOpenPositions,
        setAllClosePositions,
        setAllCloseOrders,
        setAllOpenOrders,
        closePosition,
        openTrade,
        closeTrade,
        setIsClosing,
        closeOrder,
        cancelOrder,
        setIsClosingOrder,
        closeAllPosition,
        closeProfitablePositions,
        closeLosingPositions,
        closeAllOrder,
        closeBuyPendingOrders,
        closeSellPendingOrders,
        activeTab,
        setActiveTab,
        updatePositionDetails,
        selectedPosition,
        isClosingPosition,
        isClosingAllPositions,
        isCancellingOrder,
        isPositionClosed,
        setIsPositionClosed,
        orderHistoryCount,
        setOrderHistoryCount,
        positionHistoryCount,
        setPositionHistoryCount,
        positionCount, 
        setPositionCount,
        ordersCount,
        setOrdersCount,
        isOrderClosing,
        setIsOrderClosing,
        closedPositions, setClosedPositions,
        closedPositionLength, setClosedPositionLength,
        closedPositionsAll, setClosedPositionsAll,
        botPositionHistoryCount, setBotPositionHistoryCount,
        totalBotPositionHistoryCount, setTotalBotPositionHistoryCount,
        showWithdraw,
        setShowWithdraw,
        showDeposit,
        setShowDeposit,
        showBank, setShowBank,
        bankDetails, setBankDetails
      }}
    >
      {children}
    </AccountManagerContext.Provider>
  );
};

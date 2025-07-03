// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { API_ENDPOINT_SYMBOLS, API_ENDPOINT_LOGOUT } from "../data/Endpoints-API";
import { WS_ENDPOINT_PLATFORM_LIVE_FEEDS } from "../data/Endpoints-WS";
import APIMiddleware from "../data/api/Api-Middleware";
import { ws_close_all, ws_create } from "../data/websocket/Websocket-Middleware";

// import { IdleTimerProvider, useIdleTimer } from 'react-idle-timer';
import * as PusherPushNotifications from "@pusher/push-notifications-web";

export const AuthContext = createContext();

export function useAuthContext() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [connectionClosed, setConnectionClosed] = useState(false);

  useEffect(() => {
    let timeIdClose;
    const eventListenerIdClose = document.addEventListener('connectionClosed', (e) => {
      setIsWebSocketConnected(false)
      console.log('Connection closed');
      if (e?.detail) {
        // Handle the connection closed event
        timeIdClose = setTimeout(() => {
          setConnectionClosed(true);
        }, 3500);
      }
    });

    const eventListenerIdOpen = document.addEventListener('connectionOpened', (e) => {
      console.log('Connection opened');
      setIsWebSocketConnected(true)
      sendDataToServer()
      if (e?.detail) {
        // Handle the connection closed event
        setConnectionClosed(false);
      }
    });

    return () => {
      document.removeEventListener('connectionOpened', eventListenerIdOpen);
      document.removeEventListener('connectionClosed', eventListenerIdClose);
      clearTimeout(timeIdClose);
    };
  }, []);

  const [user, setUser] = useState({
    userId: 0,
    userName: "",
    total_deposit: 0,
    total_withdrawal: 0,
    total_margin: 0,
    total_realized_pnl: 0,
    totalUnrealizedGrossPnL: 0,
    tempData: "",
    isAuthorized: false,
    is_bot_subscribed: false,
    is_bot_enabled: false,
  });
  
  const [fontSize, setFontSize] = useState(12);
  const [reloadApi, setReloadApi] = useState("");
  const [font, setFont] = useState(useState(() => localStorage.getItem('storedFont') || 'Large'));
  const [fontSizeTrigger, setFontSizeTrigger] = useState('');
  const [fontUpdating, setFontUpdating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [selectedAuthSymbol, setAuthSelectedSymbol] = useState('');
  const [selectedAuthSymbolId, setSelectedAuthSymbolId] = useState('');
  const [defaultSelectedSymbol, setDefaultSelectedSymbol] = useState('');
  const [defaultSelectedCategory, setDefaultSelectedCategory] = useState('');
  const [selectedAuthTimeFrame, setAuthTimeFrame] = useState('15m');
  const [authSelectedCategory, setAuthSelectedCategory] = useState(1);
  const [allValidSymbols, setAllValidSymbols] = useState([]);
  const [isMariginCallVisible, setIsMariginCallVisible] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false)
  const [isWebSocketRefetch, setIsWebSocketRefetch] = useState(false)
  const [showFloatingWindow, setShowFloatingWindow] = useState(() => {
    const storedValue = localStorage.getItem('showFloatingWindow');
    return storedValue === null ? true : JSON.parse(storedValue);
  });
  const [variantLogout , setVariantLogout] = useState(false);
  //create web-socket instance for the component
  const ws_platform = ws_create();
  const WS_MESSAGE_EVENT_LISTENER = "ws_message_platform";
  // const data = [];

  const [platFromData, setPlatFromData] = useState([[],[], [], [], [], [], [], [], []]); // Initial data state
  const [isReconnected, setIsReconnected] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [loginPortalModal, setLoginPortalModal] = useState(false);

  const updateData = (index, newData, keepPrevData = false) => {
   
    setPlatFromData((prevData) => {
      const updatedData = [...prevData];
      if (keepPrevData) updatedData[index] = {...updatedData[index], keepPrevData};
      else updatedData[index] = newData;
      return updatedData;
    });
  };

  useEffect(() => {
    localStorage.setItem('showFloatingWindow', JSON.stringify(showFloatingWindow));
  }, [showFloatingWindow]);
  
  // useEffect(()=>{
  //   setFontSize(2);
  //   setFontSizeTrigger('2LD');
  // },[])



  // const handleOnIdle = async () => {
  //   if (user && user.userId != undefined && user.userId > 0) {
  //     ws_close_all();
  //     setShowLogoutModal(true)
  //   }
  // };

  // const handleOnActive = () => {
  //   // Optional: Handle what happens when the user becomes active again
  //   // console.log('User is active');
  // };

  // const handleOnAction = () => {
  //   // Optional: Handle what happens on any user action
  //  // console.log('User action detected');
  // };

  // Set idle timeout to 30 minutes
  // const { reset } = useIdleTimer({
  //   timeout: 30 * 60 * 1000,
  //   onIdle: handleOnIdle,
  //   onActive: handleOnActive,
  //   onAction: handleOnAction
  // });



  const fontAdjuster = (e) => {
    setFontUpdating(true);
    const selectedFont = e.target.value;
    if (selectedFont === 'Large') {
      if (font === 'Default') {
        console.log('def: large')
        setFontSize(2);
        setFontSizeTrigger('2LD');
      } else if (font === 'Small') {
        console.log('small: large')
        setFontSize(4);
        setFontSizeTrigger('4LS');
      }
    } else if (selectedFont === 'Default') {
      if (font === 'Large') {
        setFontSize(-2);
        setFontSizeTrigger('-2DL');
      } else if (font === 'Small') {
        setFontSize(2);
        setFontSizeTrigger('-2DS');
      }
    } else if (selectedFont === 'Small') {
      if (font === 'Default') {
        setFontSize(-2);
        setFontSizeTrigger('-2SD');
      } else if (font === 'Large') {
        setFontSize(-4);
        setFontSizeTrigger('-2SL');
      }      
    }
    setFont(selectedFont);
  };


 
  useEffect(() => {
    if (authSelectedCategory && selectedAuthSymbol && user && user.userId != undefined && user.userId > 0) {
      if (isWebSocketConnected){
        sendDataToServer(user);
      }
      else{
        loadPlatform(user);
      }
    }
  }, [selectedAuthSymbol, selectedAuthTimeFrame, allValidSymbols]);

  useEffect(() => {

    if (user && user.userId != undefined && user.userId > 0) {
      getAllValidSymbols();

    }
  }, [user?.userId]);


  useEffect(() => {
    
    if (user && user.userId != undefined && user.userId > 0) {
      console.log(user, user.userId);

    registerDeviceWithBeams(user.userId);
    
    // beamsClient.start()
    //   .then((beamsClient) => beamsClient.getDeviceId())
    //   .then((deviceId) =>
    //     console.log("Successfully registered with Beams. Device ID:", deviceId)
    //   )
    //   .then(() => beamsClient.addDeviceInterest("user-push-notification-subscriber-id" + user.userId))
    //   .then(() => beamsClient.getDeviceInterests())
    //   .then((interests) => console.log("Current interests:", interests))
    //   .catch((error) => console.error(error));
    }
  }, [user?.userId]);


  const registerDeviceWithBeams = async (userId) => {
    try {
      const beamsClient = new PusherPushNotifications.Client({
        instanceId: process.env.REACT_APP_INSTANCE_KEY,
      });

        // Start Beams client
      await beamsClient.start();

      // await beamsClient.removeDeviceInterest('user-push-notification-subscriber-id85')
      await beamsClient.clearAllState()

      // Clear any previous interests
      // await beamsClient.clearDeviceInterests();
      console.log("Cleared previous device interests");

      // Get Device ID
      const deviceId = await beamsClient.getDeviceId();
      console.log("Successfully registered with Beams. Device ID:", deviceId);

      // Add interest for the current user
      await beamsClient.addDeviceInterest("user-push-notification-subscriber-id" + userId);
      console.log(`Added interest: user-push-notification-subscriber-id${userId}`);

      // Get current interests
      const interests = await beamsClient.getDeviceInterests();
      console.log("Current interests:", interests);
    } catch (error) {
      console.error("Error with Beams registration:", error);
    }
  }
  
  const getAllValidSymbols = async () => {
    // get symbols by api
    const response = await APIMiddleware.get(API_ENDPOINT_SYMBOLS(user.userId));
    if (response.data) {

      setAllValidSymbols(response.data);
      setDefaultSelectedSymbol(response.data[0][0].name)
      setDefaultSelectedCategory(response.data[0][0].symbol_category)
    }
  }

  const login = (userObj) => {
    // Implement login logic, e.g., by making an API request to server.
    // If login is successful, set the user.
    setUser(userObj);
    localStorage.setItem('accountManager', 'open-positions-acc');
    // loadPlatform(userObj);
  };

  const updateUserAuthorization = () => {
    user.isAuthorized = !user.isAuthorized;
  };

  const updateUserData = (updatedUserAccountData) => {
    if (user && user.userId != undefined && user.userId > 0) {
      // If the user is logged in, update account data
      setUser(updatedUserAccountData);
    }
  };

  const updateUserData_Local = (value) => {
    setUser((prevUserData) => ({
      ...prevUserData,
      tempData: value,
    }));
  };



  const loadPlatform = async (user) => {
    if (user && user.userId != undefined && user.userId > 0) {
      // get symbols by api
      // const response = await APIMiddleware.get(API_ENDPOINT_SYMBOLS(user.userId));

      // if (defaultSelectedSymbol) {
      // Extracting symbols names
      let selectedSymbolName;
      let selectedCategory;
      let selectedSymbolTimeFrame;
      // const symbolNames = response.data[0].map((symbol) => symbol.name);
      if (localStorage.symbol == null || localStorage.category == null) {
        selectedSymbolName = defaultSelectedSymbol;
        selectedCategory = defaultSelectedCategory;
        console.log(defaultSelectedCategory, "defaultSelectedCategory")
      }
      // else if (selectedAuthSymbol){
      //   selectedSymbolName = selectedAuthSymbol;
      // } 
      else {
        selectedSymbolName = localStorage.symbol;
        selectedCategory = localStorage.category;
      }

      if (localStorage.timeFrame == null) {
        selectedSymbolTimeFrame = selectedAuthTimeFrame;
        // localStorage.setItem('timeFrame', selectedAuthTimeFrame);
      }
      else {
        selectedSymbolTimeFrame = localStorage.timeFrame;
      }

      if (selectedSymbolName) {
        //ws://localhost:8800/platform@BTCUSDT&10&1000ms&1m?id=8&variant_id=1
        //ws://localhost:8800/platform@ETCUSDT&10&100ms&1m?id=0&variant_id=1
        if (localStorage.variantId && localStorage.token) {
         await ws_platform.ws_connect(
            WS_ENDPOINT_PLATFORM_LIVE_FEEDS(user?.userId, 10, '100ms', localStorage.variantId, localStorage.token),
            WS_MESSAGE_EVENT_LISTENER
          );
        }

        const handleLiveFeedData = (event) => {
          // Update data based on event detail
          if (event.detail.type === 'symbols') {
            updateData(0, event.detail.updatedSymbolData, false);
          } else if (event.detail.type === 'klines') {
            updateData(1, event.detail, false);
          } else if (event.detail.type === 'depth') {
            updateData(2, event.detail, false);
          } else if (event.detail.type === 'positions') {
            updateData(3, event.detail, event.detail.keepPrevData);
          } else if (event.detail.type === 'orders') {
            updateData(4, event.detail, event.detail.keepPrevData);
          } else if (event.detail.type === 'user_details') {
            
              if (event.detail?.logoutVariants?.length && event.detail?.logoutVariants.includes(localStorage.variantId)) {
                
          setVariantLogout(true);
          setTimeout(() => {
            logout();
            setVariantLogout(false);
          }, 3000);
        
              
              }
            updateData(5, event.detail, event.detail.keepPrevData);
          } else if (event.detail.type === "availableLeverage" ) {
            updateData(6, event.detail, false);
          } else if (event.detail.type === "Bot") {
            updateData(7, event.detail, false);
          }else if (event.detail.type === 'selectedSymbol') {
            updateData(8, event.detail, false);
          }else if(event.detail.type === 'sendDataAgain'){
            sendDataToServer()
       setIsWebSocketRefetch(true)
            // const savedStart = 0;
            // const savedLimit = 100;
            // const category = parseInt(localStorage.getItem('symbolCategoryList')) || 1;
            // sendDataToServer({
            //     type: 'SymbolsPagination',
            //     paginationStart: savedStart,
            //     paginationEnd: savedStart + savedLimit,
            //   category: category,
            // });
          }
        };

        document.addEventListener(WS_MESSAGE_EVENT_LISTENER, handleLiveFeedData);
      } else {
        console.error("SYmbol not selected");
      }
      // }
    }
  };


  const sendDataToServer = (data) => {
    try {

    if(data  ){
        ws_platform.ws_send(
          WS_ENDPOINT_PLATFORM_LIVE_FEEDS(localStorage.userId, 10, '100ms', localStorage.variantId, localStorage.token),
          JSON.stringify(data)
        );
  
        }
       
    
          if(localStorage.userId && localStorage.userId != undefined && localStorage.userId > 0 ){
        
            let selectedSymbolName;
            let selectedCategory;
            let selectedSymbolTimeFrame;
            if (localStorage.symbol == null || localStorage.category == null) {
              selectedSymbolName = localStorage.prevSymbol;
              selectedCategory = defaultSelectedCategory;
            }
            else {
              selectedSymbolName = localStorage.symbol;
              selectedCategory = localStorage.category;
            }
      
            if (localStorage.timeFrame == null) {
              selectedSymbolTimeFrame = selectedAuthTimeFrame;
            }
            else {
              selectedSymbolTimeFrame = localStorage.timeFrame;
            }
                ws_platform.ws_send(
                  WS_ENDPOINT_PLATFORM_LIVE_FEEDS(localStorage.userId, 10, '100ms', localStorage.variantId, localStorage.token),
                  JSON.stringify({type:"selectedSymbolChange",selectedSymbolName,selectedSymbolTimeFrame,selectedCategory})
                );
              }  
      
  
      
    } catch (error) {
      console.log("Error sending data to server:", error);
    }
  
  };


  const logout = async () => {
    setIsLoggingOut(true);
    const userId=localStorage.userId
    // Implement logout logic, e.g., by clearing user data or revoking tokens.
    try {
      console.log((API_ENDPOINT_LOGOUT(localStorage.variantId,userId)),"APIMiddleware")
      const response = await APIMiddleware.get(API_ENDPOINT_LOGOUT(localStorage.variantId,userId));
      console.log(response,"response from logout")
      if (response ) {
        await ws_close_all();
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem('is_margin_call_visible')
    
        if (localStorage.variantId != undefined) {
          localStorage.removeItem("variantId");
        }
        setUser(null);
        // document.body.className = "";
        window.location.reload();
        return null;
      }
    } catch (logoutError) {
      console.log('Logout error:', logoutError);
      setIsLoggingOut(false);
      return logoutError.message || 'Logout failed';
    }
  };
  const logoutWithOutRefresh = async() => {
    const userId=localStorage.userId
    // Implement logout logic, e.g., by clearing user data or revoking tokens.
    const response = await APIMiddleware.get(API_ENDPOINT_LOGOUT(localStorage.variantId,userId));
    if (response ) {
      await ws_close_all();
      localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem('is_margin_call_visible')
 
    if (localStorage.variantId != undefined) {
      localStorage.removeItem("variantId");
        }
    setUser(null);
    // document.body.className = "";
    // setTimeout(() => {
    //   window.location.reload();
    // }, 300);
  }};


  return (
    <AuthContext.Provider
      value={{
        connectionClosed,
        allValidSymbols,
        user,
        login,
        logout,
        logoutWithOutRefresh,
        isLoggingOut,
        updateUserData,
        updateUserData_Local,
        updateUserAuthorization,
        loadPlatform,
        platFromData,
        sendDataToServer,
        selectedAuthSymbol,
        setAuthSelectedSymbol,
        setAuthTimeFrame,
        selectedAuthTimeFrame,
        setAuthSelectedCategory,
        authSelectedCategory,
        fontAdjuster,
        fontSize,
        selectedAuthSymbolId,
        setSelectedAuthSymbolId,
        fontUpdating,
        setFontUpdating,
        fontSizeTrigger,
        defaultSelectedCategory,
        setShowLogoutModal,
        showLogoutModal,
        isMariginCallVisible, 
        setIsMariginCallVisible,
        isReconnected, 
        setIsReconnected,
        setAllValidSymbols,
        reloadApi, setReloadApi,
        logoutModal, setLogoutModal,
        loginPortalModal, setLoginPortalModal,isWebSocketRefetch,
        showFloatingWindow, setShowFloatingWindow,
        setVariantLogout , variantLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

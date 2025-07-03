import React, { useEffect, useState } from 'react';
import Chart from '../../components/main/chart/Chart';
import Symbol from '../../components/main/symbol/Symbol';
import OrderPanel from '../../components/main/order_panel/Order-Panel';
import OrderBook from '../../components/main/order_book/Order-Book';
import AccountManager from '../../components/main/account_manager/Account-Manager';
import UserSettings from '../../components/main/user_settings/UserSettings';
import MetricsPanel from '../../components/main/metrics_panel/Metrics-Panel';
import { API_ENDPOINT_SAVE_LOGIN_TOKEN } from '../../data/Endpoints-API.js';
import FloatingActionButton  from '../../components/floatingActionButton/FloatingActionButton'
import FloatingWindow from '../../components/main/order_panel/FloatingWindow.jsx';
// import { useRippleContext } from '../../contexts/Ripple-Context';
// import guide from "../../imgs/guide.png";
// import installImg from "../../imgs/install.png";
import './Main.scss';
import '../../themes/common.scss';
import '../../themes/dark.scss';
// import '../../themes/light.scss';
// import '../../themes/ocean.scss';
// import '../../themes/venom.scss';
// import '../../themes/skyline.scss';
import { useOrderContext } from '../../contexts/Order-Context';
import { GoDiscussionOutdated } from 'react-icons/go';
import { useAuthContext } from '../../contexts/Auth-Context';
import { useChartContext } from '../../contexts/Chart-Context.js';
import { useNavigate } from 'react-router-dom';
import APIMiddleware from '../../data/api/Api-Middleware';
import openSound from '../../audio/open-beep.mp3';
import closeSound from '../../audio/close-beep.mp3';
import { API_ENDPOINT_SAVE_FCM_TOKEN, API_ENDPOINT_SYMBOLS, API_ENDPOINT_USER_DETAILS } from '../../data/Endpoints-API';

import { Ripple } from 'react-ripple-click';
import 'react-ripple-click/dist/index.css';
import { toast } from 'react-toastify';
import { handleReconnect } from '../../data/websocket/Websocket-Middleware';
import Spinner from '../../components/utils/spinner/Spinner';
import MobileComp from './MobileComp';
import MarginCall from '../../components/main/margin_call_modal/Margin-Call.tsx';
import { useAccountManagerContext } from '../../contexts/Account-Manager-Context.js';
import VariantModal from '../login/VariantLogout.jsx';
import getBackendUrl from '../../components/utils/RedirectUrl.js';
// import { messaging } from "../../firebase.js"; // Firebase configuration
// import { getToken, onMessage } from "firebase/messaging";

const Main = () => {
  const [mobileMode, setMobileMode] = useState(false);
  const [currentMobileMode, setCurrentMobileMode] = useState('home');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [navBarStyle, setNavBarStyle] = useState({});
  const { setShowDeposit } = useAccountManagerContext();
  const { selectedStyle } = useChartContext();

  useEffect(() => {
    const isMobile = window.innerWidth <= 960;
    setMobileMode(isMobile);
    setLoading(false); // Set loading to false once the mobileMode is set
  }, []);

  // Force navigation bar to absolute bottom using direct DOM manipulation
  useEffect(() => {
    if (mobileMode) {
      const forceNavBarPosition = () => {
        const navBar = document.querySelector('.smart-brain-mobile-view');
        if (navBar) {
          // Force CSS properties directly on the DOM element
          navBar.style.setProperty('position', 'fixed', 'important');
          navBar.style.setProperty('bottom', '0px', 'important');
          navBar.style.setProperty('top', 'auto', 'important');
          navBar.style.setProperty('left', '0px', 'important');
          navBar.style.setProperty('right', '0px', 'important');
          navBar.style.setProperty('width', '100vw', 'important');
          navBar.style.setProperty('height', '45px', 'important');
          navBar.style.setProperty('background-color', '#1a1a1a', 'important');
          navBar.style.setProperty('border-top', '1px solid #3a3a3a', 'important');
          navBar.style.setProperty('display', 'flex', 'important');
          navBar.style.setProperty('justify-content', 'space-around', 'important');
          navBar.style.setProperty('align-items', 'center', 'important');
          navBar.style.setProperty('padding', '0px', 'important');
          navBar.style.setProperty('padding-bottom', '15px', 'important');
          navBar.style.setProperty('padding-top', '5px', 'important');
          navBar.style.setProperty('margin', '0px', 'important');
          navBar.style.setProperty('z-index', '999999999999', 'important');
          navBar.style.setProperty('box-shadow', '0 -2px 10px rgba(0, 0, 0, 0.3)', 'important');
          navBar.style.setProperty('box-sizing', 'border-box', 'important');
          navBar.style.setProperty('transform', 'none', 'important');
          navBar.style.setProperty('transition', 'none', 'important');
        }
      };

      // Use multiple approaches to ensure it gets applied
      forceNavBarPosition();
      
      // Use MutationObserver to watch for DOM changes
      const observer = new MutationObserver(forceNavBarPosition);
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Force update on events
      window.addEventListener('resize', forceNavBarPosition);
      window.addEventListener('orientationchange', forceNavBarPosition);
      
      // Multiple delayed attempts to override theme styles
      setTimeout(forceNavBarPosition, 10);
      setTimeout(forceNavBarPosition, 100);
      setTimeout(forceNavBarPosition, 500);
      setTimeout(forceNavBarPosition, 1000);
      
      // Continuous monitoring for first few seconds
      const interval = setInterval(forceNavBarPosition, 100);
      setTimeout(() => clearInterval(interval), 3000);
      
      return () => {
        observer.disconnect();
        window.removeEventListener('resize', forceNavBarPosition);
        window.removeEventListener('orientationchange', forceNavBarPosition);
      };
    }
  }, [mobileMode]);

  const mobMenu = (e) => {
    console.log("Mobile Menu Clicked: ", e);    
    document.body.setAttribute('mobileCurrentView', e);
    setCurrentMobileMode(e);
    // alert("Mobile Menu Clicked: ", e);
  };

  const loginToPortal = async () => {
    try {
      if (user && user.userId != undefined && user.userId > 0) {
        const response = await APIMiddleware.get(
          API_ENDPOINT_SAVE_LOGIN_TOKEN(user.userId)
        );
        if (response.data[0].UserLoginToken){
          window.open(`${getBackendUrl()}/auto_login?token=${response.data[0].UserLoginToken}`, '_blank');
        }
      }
    } catch (error) {
        toast.error("An error occurred. Please try again later.", {
          position: "top-right",
        });

      console.error(`Error getting user`, error);
    }
  };

  let toggleAccountManagerLocal;
  if (localStorage.bottomElementBtn !== undefined) {
    toggleAccountManagerLocal = localStorage.bottomElementBtn;
  } else {
    toggleAccountManagerLocal = false;
  }
  const [toggleAccountManagerPanel, setToggleAccountManagerPanel] = useState(
    toggleAccountManagerLocal,
  );

  const toggleAccountManager = (e) => {
    if (toggleAccountManagerPanel === true) {
      document
        .querySelector('.bottom-section')
        .setAttribute('aria-hidden', true);
      localStorage.setItem('bottomElement', true);
      const chartFullHeight =
        parseInt(
          getComputedStyle(document.querySelector('.main-screen')).height.split(
            'px',
          )[0],
        ) - 115;
      document.querySelector('.chart-box').style.height =
        `${chartFullHeight}px`;
      localStorage.setItem('chartHeight', `${chartFullHeight}px`);
      localStorage.setItem('bottomElementBtn', false);
      setToggleAccountManagerPanel(false);
    } else {
      setToggleAccountManagerPanel(true);
      localStorage.setItem('bottomElementBtn', true);
      document.querySelector('.chart-box').style.height = `40px`;
      localStorage.setItem('chartHeight', `40px`);
      document
        .querySelector('.bottom-section')
        .setAttribute('aria-hidden', false);
      localStorage.setItem('bottomElement', false);
    }
  };
  const [isLoaded, setIsLoaded] = useState(false);
  const { login, fontSize, setFontUpdating,fontSizeTrigger, connectionClosed, logout, isLoggingOut,showLogoutModal,setShowLogoutModal, user, isMariginCallVisible, setIsMariginCallVisible, isReconnected, setIsReconnected ,setAllValidSymbols, logoutModal, setLogoutModal, loginPortalModal, setLoginPortalModal, showFloatingWindow, setShowFloatingWindow, variantLogout } = useAuthContext();

  const adjustAllElementFontSize = (fontSize) => {
    // console.log('font updated');
    const elements = document.querySelectorAll('.global-platfrom');
      const fontSizeMap = new Map();

    elements.forEach((element) => {
      const currentFontSize = parseFloat(window.getComputedStyle(element).getPropertyValue('font-size'));
      const newFontSize = currentFontSize + parseFloat(fontSize);

      if (!fontSizeMap.has(newFontSize)) {
        fontSizeMap.set(newFontSize, []);
      }
      fontSizeMap.get(newFontSize).push(element);

      const children = element.querySelectorAll('*');
      children.forEach((child) => {
        const childFontSize = parseFloat(window.getComputedStyle(child).getPropertyValue('font-size'));
        const newChildFontSize = childFontSize + parseFloat(fontSize);

        if (!fontSizeMap.has(newChildFontSize)) {
          fontSizeMap.set(newChildFontSize, []);
        }
        fontSizeMap.get(newChildFontSize).push(child);
      });
    });


    // Batch update font sizes
    fontSizeMap.forEach((elements, newFontSize) => {
      elements.forEach((element) => {
        element.style.fontSize = `${newFontSize}px`;
      });
    });
    setTimeout(setFontUpdating(false), 1000);      
  };
  React.useEffect(() => {
    if(isLoaded){
       adjustAllElementFontSize(fontSize);
    }
    else{
      setIsLoaded(true);
    }
  }, [fontSizeTrigger]);
  const getAllValidSymbols = async () => {
    // get symbols by api
    const response = await APIMiddleware.get(API_ENDPOINT_SYMBOLS(user.userId));
    if (response.data) {

      setAllValidSymbols(response.data);

    }
  }

  React.useEffect(() => {

    if (connectionClosed) {
          console.log('connectionClosed: ', connectionClosed);
      window.location.reload();
      // console.log("mob mode", mobileMode);
      // if (mobileMode) {
        
        // const id = toast.loading("Reconnecting to the server...", {
        //   position: "top-center",
        // });

        // handleReconnect().then(ws => {
        //   // toast.update(id, {
        //   //   render: "Reconnected to the server.",
        //   //   type: "success",
        //   //   isLoading: false,
        //   //   autoClose: 3000,
        //   // });
        //   console.log('reconnecting to server')
        //   getAllValidSymbols()
        //   // setModalIsOpen(false);
        //   setIsReconnected(true);
        // }).catch(err => {
        //   // setModalIsOpen(true);
        //   console.log('error reconnecting to server')
        //   // toast.update(id, {
        //   //   render: "Failed to reconnect to the server.",
        //   //   type: "error",
        //   //   isLoading: false,
        //   //   autoClose: 3000,
        //   // });
        // })
      }
    // } else {
    //   setModalIsOpen(false);
    //   // setReconnectLoading(false);
    // }
  }, [connectionClosed]);


  const navigate = useNavigate();

  const [chartHeightState, setChartHeightState] = useState('55vh');

  useEffect(() => {
    if (localStorage.getItem('chartHeight') != null) {
      setChartHeightState(localStorage.getItem('chartHeight'));
    }
  }, [localStorage.getItem('chartHeight')]);
  const { setAppElements, appElements } = useOrderContext();
  //Disable Zoom on all devices by updating DOM

  // useEffect(() => {
  //   const disableZoom = (e) => {
  //     if (e.touches.length > 1 || e.scale && e.scale !== 1) {
  //       e.preventDefault();
  //     }
  //   };

  //   document.addEventListener('touchstart', disableZoom, { passive: false });
  //   document.addEventListener('touchmove', disableZoom, { passive: false });
  //   document.addEventListener('gesturestart', disableZoom);
  //   document.addEventListener('gesturechange', disableZoom);

  //   return () => {
  //     document.removeEventListener('touchstart', disableZoom);
  //     document.removeEventListener('touchmove', disableZoom);
  //     document.removeEventListener('gesturestart', disableZoom);
  //     document.removeEventListener('gesturechange', disableZoom);
  //   };
  // }, []);

  // const { font, setFont } = useOrderContext();
  // setTimeout(() => {
  //   let allElements = document.querySelectorAll(
  //     `button, h6, h5, h4,
  //     h3, h2, h1, p, span, strong,
  //     label, .bstorm-body-tr, .tab-button-acc,
  //     td, .mode-tab-button, li, .z-top`
  //   );
  //   setAppElements(allElements);
  // }, 2000);

  // const zoomClicker = (e) => {
  //   const rangebar = document.getElementById("zoomRanger");
  //   const currentValue = parseFloat(rangebar.value);
  //   const step = parseFloat(rangebar.step);
  //   let newValue;
  //   if (e === "+") {
  //     newValue = currentValue + step;
  //   } else {
  //     newValue = currentValue - step;
  //   }
  //   rangebar.value = newValue.toString();
  //   const event = new Event("change");
  //   rangebar.dispatchEvent(event);
  // };

  // const defineCurrentFont = (hook) => {
  //   const preFont = localStorage.currentFont;
  //   if (preFont == undefined) {
  //     localStorage.setItem('currentFont', 'Default');
  //   } else {
  //     localStorage.setItem('currentFont', hook);
  //   }
  //   const setFont = (e, o) => {
  //     for (let i = 0; i < appElements.length; i++) {
  //       let size = parseInt(
  //         getComputedStyle(appElements[i]).fontSize.split('px')[0],
  //       );
  //       if (o == '+') {
  //         appElements[i].style.fontSize = `${(size += e)}px`;
  //         console.log('Plus');
  //       } else {
  //         appElements[i].style.fontSize = `${(size -= e)}px`;
  //         console.log('Minus');
  //       }
  //     }
  //   };

  //   if (
  //     (preFont == 'Default' && hook == 'Large') ||
  //     (preFont == 'Small' && hook == 'Default')
  //   ) {
  //     setFont(1, '+');
  //   }
  //   if (
  //     (preFont == 'Large' && hook == 'Default') ||
  //     (preFont == 'Default' && hook == 'Small')
  //   ) {
  //     setFont(1, '-');
  //   }

  //   if (preFont == 'Large' && hook == 'Small') {
  //     setFont(2, '-');
  //   }
  //   if (preFont == 'Small' && hook == 'Large') {
  //     setFont(2, '+');
  //   }
  // };

  // useEffect(() => {
  //   defineCurrentFont(font);
  // }, [font]);

  useEffect(() => {
    const autoLogin = async () => {
      const userId = localStorage.getItem('userId');
      if (
        userId &&
        userId !== 'undefined' &&
        userId != undefined &&
        userId > 0
      ) {
        const data = {
          userId,
        };
        const response = await APIMiddleware.post(
          API_ENDPOINT_USER_DETAILS(),
          data,
        );
        if (response.data[0]) {
          const d = response.data[0];
          login(d);
        }
      }
    };

    autoLogin();
  }, []);

  

  // const panelExpander = (element) => {
  //   let panelExpandStatus = true;
  //   window.onmouseup = () => {
  //     panelExpandStatus = false;
  //   };
  //   window.onmousemove = (m) => {
  //     if (panelExpandStatus == true) {
  //       if (element == "left-nav") {
  //         const panel = document.getElementsByClassName(element)[0];
  //         const preWidth = parseInt(getComputedStyle(panel).width.split("px")[0]);
  //         const maxWidth = 600;
  //         if (preWidth < m.x && m.x < maxWidth) {
  //           panel.style.width = `${m.x}px`;
  //         }
  //       }
  //       if ((window.innerWidth - m.x) > 0 && element == "right-nav") {
  //         const rightX = window.innerWidth - m.x;
  //         const panel = document.getElementsByClassName(element)[0];
  //         const preWidth = parseInt(getComputedStyle(panel).width.split("px")[0]);
  //         const maxWidth = 960;
  //         if (preWidth < rightX && rightX < maxWidth) {
  //           panel.style.width = `${rightX}px`;
  //         }
  //       }
  //     }
  //   };
  // };

  const dragWm = (element) => {
    let wmDrag = true;
    window.onmouseup = () => {
      wmDrag = false;
    };
    window.onmousemove = (position) => {
      if (wmDrag == true && window.innerWidth >= 960) {
        const elemSize = element.target.parentNode.getClientRects()[0];
        if (elemSize.width + elemSize.left <= window.innerWidth) {
          element.target.parentNode.style.left = `${
            position.x - elemSize.width / 2
          }px`;
        } else {
          element.target.parentNode.style.left = `${
            window.innerWidth - elemSize.width - 1
          }px`;
        }
        if (elemSize.height + elemSize.top <= window.innerHeight) {
          element.target.parentNode.style.top = `${
            position.y - (elemSize.height - (elemSize.height - 10))
          }px`;
        } else {
          element.target.parentNode.style.top = `${
            window.innerHeight - elemSize.height - 1
          }px`;
        }
      }
    };
  };

  const exitWm = (e) => {
    e.target.parentNode.parentNode.parentNode.setAttribute(
      'aria-modal',
      'false',
    );
  };

  const guideExit = () => {
    document.querySelector('.mob-guide').setAttribute('hide', 'true');
  };
  const guideStart = () => {
    document.querySelector('.mob-guide').setAttribute('hide', 'false');
  };

  const depositRedirect = (e) => {
    const action = e.target.getAttribute('action');
    if (action == 'exit') {
      e.target.parentNode.parentNode.parentNode.setAttribute('view', false);
    } else{
      e.target.parentNode.parentNode.parentNode.setAttribute('view', false);
      setShowDeposit(true);
    }
    // else {
    //   e.target.parentNode.parentNode.parentNode.setAttribute('view', false);
    //   window.open(action, '_blank');
    // }
  };
  let preLeftPanelState;
  if (localStorage.getItem('left-nav') == null) {
    preLeftPanelState = 'show';
  } else {
    preLeftPanelState = localStorage.getItem('left-nav');
  }
  let preRightPanelState;
  if (localStorage.getItem('right-nav') == null) {
    preRightPanelState = 'show';
  } else {
    preRightPanelState = localStorage.getItem('right-nav');
  }
  const [isMaximized, setIsMaximized] = useState(false);
  const [rightPanel, setRightPanel] = useState(preRightPanelState);
  const [leftPanel, setLeftPanel] = useState(preLeftPanelState);
  const [remaining, setRemaining] = useState(30)
  useEffect(()=>{
    if(localStorage.getItem('left-nav')!=null){
      setLeftPanel(localStorage.getItem('left-nav'))
    }
    if(localStorage.getItem('right-nav')!=null){
      setRightPanel(localStorage.getItem('right-nav'))
    }
  },[localStorage.getItem('right-nav'),localStorage.getItem('left-nav')])

  const handleTimeOut =  () => {
     logout();
  };
  const sidePanelSwitch = (element) => {
    const attr = document
      .getElementsByClassName(element)[0]
      .getAttribute('role');
    if (element == 'right-nav') {
      if (attr == 'show') {
        setRightPanel('hide');
        localStorage.setItem(element, 'hide');
      } else {
        setRightPanel('show');
        localStorage.setItem(element, 'show');
      }
    }
    if (element == 'left-nav') {
      if (attr == 'show') {
        setLeftPanel('hide');
        localStorage.setItem(element, 'hide');
      } else {
        setLeftPanel('show');
        localStorage.setItem(element, 'show');
      }
    }
  };

  // useEffect(() => {
  //   let interval;
    
  //   if (showLogoutModal) {
  //     interval = setInterval(() => {
  //       setRemaining(prevRemaining => {
  //         if (prevRemaining <= 1) {
  //           clearInterval(interval);
  //           handleTimeOut();
  //           return 0;
  //         }
  //         return prevRemaining - 1;
  //       });
  //     }, 1000);
  //   } else {
  //     clearInterval(interval);
  //   }

  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, [showLogoutModal]);

  const windowsReadyState = () => {
    if (localStorage.zoomRange === undefined) {
      localStorage.setItem('zoomRange', 0.9);
    }
    if (localStorage.bottomElement !== undefined) {
      document
        .querySelector('.bottom-section')
        .setAttribute('aria-hidden', localStorage.bottomElement);
      document
        .querySelector('.bottom-stats')
        .setAttribute('aria-hidden', localStorage.bottomElement);
    }
    document.body.style.display = 'block';
    const div = document.querySelector('.chart-box');
    const childChart = (width, height) => {
      const screenHeight = document
        .querySelector('.left-nav')
        .getClientRects()[0].height;
      if (document.body.className == 'theme-skyline') {
        // document.querySelector('.height-24vh-css').style.height =
        //   `${screenHeight - height - 100}px`;
        document.querySelector('.height-24vh-css').style.height = '42vh';
      } else {
        // document.querySelector('.height-24vh-css').style.height =
        //   `${screenHeight - height - 115}px`;
        document.querySelector('.height-24vh-css').style.height = '42vh';
      }
      if (localStorage.getItem('resizePositionTop') && localStorage.resizePositionTop === 'true') {
        document.querySelector('.height-24vh-css').style.height = '90vh';
      }
      document.querySelector('#chartdiv').style.height = `${height}px`;
      document.querySelector(
        '.chart-box',
      ).children[0].children[0].children[1].children[0].children[0].children[0].children[1].style.width =
        `${width}px`;
      document.querySelector(
        '.chart-box',
      ).children[0].children[0].children[1].children[0].children[0].children[0].children[0].style.width =
        `${width}px`;
      document.querySelector(
        '.chart-box',
      ).children[0].children[0].children[1].children[0].children[0].children[0].children[1].style.height =
        `${height}px`;
      document.querySelector(
        '.chart-box',
      ).children[0].children[0].children[1].children[0].children[0].children[0].children[0].style.height =
        `${height}px`;
    };

    const handleResize = (entries) => {
      for (const entry of entries) {
        if (document.querySelector('.chart-box')) {
          const chartParent = document
            .querySelector('.chart-box')
            .getClientRects()[0];
          childChart(chartParent.width, chartParent.height);
        }
      }
    };
    // const chartParent = document
    //   .querySelector('.chart-box')
    //   .getClientRects()[0];
    if (window.innerWidth > 960) {
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(div);
    }
    // const resizeDirection =
    //   document.querySelector('#resizeHistory').children[0];
    // const resizeHistory = document.getElementById('resizeHistory');
    // let isResizing = false;
    // resizeHistory.addEventListener('mousedown', () => {
    //   isResizing = true;
    // });

    // let preY = 0;
    // window.addEventListener('mousemove', (event) => {
    //   if (isResizing == true && event.clientY <= 395 && event.clientY >= 39) {
    //     document
    //       .querySelector('.bottom-section')
    //       .setAttribute('aria-hidden', false);
    //     localStorage.setItem('bottomElement', false);
    //     childChart(chartParent.width, event.clientY);
    //     document.querySelector('.chart-box').style.height =
    //       `${event.clientY}px`;
    //     localStorage.setItem('chartHeight', `${event.clientY}px`);
    //     if (event.clientY > preY) {
    //       resizeDirection.style.transform = 'rotateX(0deg)';
    //     } else if (event.clientY < preY) {
    //       resizeDirection.style.transform = 'rotateX(180deg)';
    //     }
    //   }

    //   preY = event.clientY;
    // });
    // window.addEventListener('mouseup', () => {
    //   isResizing = false;
    // });
  };

  const handleResizeToMiddle = (e) => {
    e.preventDefault();
    document.querySelector('.chart-box').style.height = `55vh`;
    localStorage.setItem('chartHeight', `55vh`);
    document
      .querySelector('.bottom-section')
      .setAttribute('aria-hidden', false);
    localStorage.setItem('bottomElement', false);
    localStorage.setItem('resizePositionTop', false);
  }

  const handleResizeToTop = (e) => {
    if (document.body.className == 'theme-skyline') {
      document.querySelector('.chart-box').style.height = `67px`;
      localStorage.setItem('chartHeight', `67px`);
      localStorage.setItem('resizePositionTop', true);
    } else {
      document.querySelector('.chart-box').style.height = `40px`;
      localStorage.setItem('chartHeight', `40px`);
      localStorage.setItem('resizePositionTop', true);
    }
    setTimeout(() => {
      // resizeDirection.style.transform = 'rotateX(0deg)';
      // resizeDirection.setAttribute('data-direction', 'up');
      document.querySelector('.height-24vh-css').style.height = '90vh';
    }, 500);
    document
      .querySelector('.bottom-section')
      .setAttribute('aria-hidden', false);
    localStorage.setItem('bottomElement', false);
  }

  const handleResizeToBottom = (e) => {
    e.preventDefault();
    document
          .querySelector('.bottom-section')
          .setAttribute('aria-hidden', true);
        localStorage.setItem('bottomElement', true);
        document.querySelector('.chart-box').style.height = '90vh';
        localStorage.setItem('chartHeight', '90vh');
        localStorage.setItem('resizePositionTop', false);
  }

  useEffect(() => {
    const wiseWatcher = setInterval(() => {
      if (document.querySelector('.am5stock') != null) {
        clearInterval(wiseWatcher);
        windowsReadyState();
      }
    }, 500);

    return () => clearInterval(wiseWatcher);
  }, []);

  const hideMarginCall = () => {
    setIsMariginCallVisible(false);
  };


  // const { mkRipple } = useRippleContext();

  // const renderCheckForMobileChart = (Component) => {
  //   if (!mobileMode) return Component;
  //   else if (currentMobileMode !== 'chart') return Component;
  //   else return null;
  // };

  // const candleColorPicker = (e) => {
  //   e.target.style.backgroundColor = e.target.value;
  //   if (e.target.getAttribute("id") == "chartUpColor") {
  //     document.getElementById(
  //       "upCandle-color-indication"
  //     ).style.backgroundColor = e.target.value;
  //   } else {
  //     document.getElementById(
  //       "downCandle-color-indication"
  //     ).style.backgroundColor = e.target.value;
  //   }
  // };
  // if (isLoggingOut) {
  //   return <Spinner />;
  // }

  return (
    <>
    <VariantModal show={variantLogout}  title={"New Login Detected"} message={"Your account was just accessed from another device. If this wasn't you, please change your password immediately."}/>
    <div className='global-platfrom'>
       {/* <FloatingActionButton /> */}
       {showFloatingWindow && window.innerWidth >= 970 && (
          <FloatingWindow
            onClose={() => setShowFloatingWindow(false)}
            isVisible={showFloatingWindow}
          />
        )}
      <audio src={openSound} hidden id="openSound"></audio>
      <audio src={closeSound} hidden id="closeSound"></audio>
      <div className="wm-parent global-platfrom" aria-modal="false">
        <div className="window-module">
          <div className="wm-header" onMouseDown={(e) => dragWm(e)}>
            <h2 className="wmTitleDynamic"></h2>
            <div
              className="wm-exit"
              onClick={(e) => {
                exitWm(e);
              }}
            >
              X
            </div>
          </div>
          <div className="wm-content">
            <div className="content-wm-title sidebar-content">
              <h1 className="wmTitleDynamic"></h1>
              <p className="wmDescriptionDynamic"></p>
            </div>
            <div className="input-content-wm">
              <div className="row">
                <div className="wm-read-p-in mx sidebar-content">
                  <p>Position ID Information</p>
                  <input type="text" readOnly />
                </div>
              </div>
            </div>
            <div className="input-content-wm">
              <div className="row">
                <div className="wm-read-p-in sidebar-content">
                  <p>Margin</p>
                  <input type="text" readOnly />
                </div>
                <div className="wm-read-p-in sidebar-content">
                  <p>Entry</p>
                  <input type="text" readOnly />
                </div>
              </div>
              <div className="row">
                <div className="wm-read-p-in sidebar-content">
                  <p>Current</p>
                  <input type="text" readOnly />
                </div>
                <div className="wm-read-p-in sidebar-content">
                  <p>PNL</p>
                  <input type="text" readOnly />
                </div>
              </div>
            </div>
            <div className="input-content-wm">
              <div className="row">
                <div className="wm-read-p-in mx sidebar-content">
                  <p>Created Date and Time</p>
                  <input type="text" readOnly />
                </div>
              </div>
            </div>
            <div className="input-content-wm">
              <div className="row">
                <div className="wm-read-p-in sidebar-content">
                  <p>Quantity</p>
                  <input type="text" readOnly />
                </div>
                <div className="wm-read-p-in sidebar-content">
                  <p>Direction</p>
                  <input type="text" readOnly />
                </div>
              </div>
              <div className="row">
                <div className="wm-read-p-in mx sidebar-content">
                  <p>Symbol Name</p>
                  <input type="text" readOnly />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <div className="download-now" onClick={guideStart}>
        Install
      </div>
      <div className="mob-guide" hide="true">
        <img src={'./guide.png'} alt="Mobile Guide" />
        <button onClick={guideExit}>ok, got it</button>
      </div> */}
      <div id="divMain" className="row global-platfrom" aria-atomic="default">
        {modalIsOpen && (
          <div className="confirm-box" role={`${modalIsOpen}`}>
            <div className="card">
              <h2>
              You have been disconnected due to inactivity. Reconnect?
              </h2>
              <div className="row-scss">
                <button
                  onClick={async (e) => {
                    const toastId = toast.loading("Logging out...", {
                      position: "top-center",
                    })
                    const res = await logout();
                    if (res) {
                      toast.update(toastId, {
                        render: res,
                        type: 'error',
                        isLoading: false,
                        autoClose: 2000,
                      });
                    }
                    // navigate('/');
                  }}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    isolation: "isolate",
                  }}
                >
                  <Ripple />
                  Cancel & Logout
                </button>
                <div className="blank"></div>
                <button
                  onClick={(e) => {
                    const id = toast.loading("Reconnecting to the server...", {
                      position: "top-center",
                    });
                    handleReconnect().then(ws => {
                      toast.update(id, {
                        render: "Reconnected to the server.",
                        type: "success",
                        isLoading: false,
                        autoClose: 3000,
                      });
                      setModalIsOpen(false);
                      setIsReconnected(true);
                    }).catch(err => {
                      toast.update(id, {
                        render: "Failed to reconnect to the server.",
                        type: "error",
                        isLoading: false,
                        autoClose: 3000,
                      });
                    })
                  }}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    isolation: 'isolate',
                  }}
                >
                  <Ripple />
                  Reconnect
                </button>
              </div>
            </div>
          </div>
        )}
         {logoutModal && (
          <div className="confirm-box" role={`${logoutModal}`}>
            <div className="card">
              <h2>
              Are you sure you want to logout?
              </h2>
              <div className="row-scss">
                <button
                  onClick={async (e) => {
                    const toastId = toast.loading("Logging out...", {
                      position: "top-center",
                    })
                    const res = await logout();
                    if (res) {
                      toast.update(toastId, {
                        render: res,
                        type: 'error',
                        isLoading: false,
                        autoClose: 2000,
                      });
                    }
                  }}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    isolation: "isolate",
                    backgroundColor: selectedStyle.buyColor,
                  }}
                >
                  <Ripple />
                  Logout
                </button>
                <div className="blank"></div>
                <button
                  onClick={(e) => {
                    setLogoutModal(false)
                  
                  }}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    isolation: 'isolate',
                    backgroundColor: selectedStyle.sellColor,
                  }}
                >
                  <Ripple />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {loginPortalModal && (
          <div className="confirm-box" role={`${loginPortalModal}`}>
            <div className="card">
              <h2>
              Are you sure you want to login to portal?
              </h2>
              <div className="row-scss">
                <button
                  onClick={async (e) => {
                    const toastId = toast.loading("Logging in...", {
                      position: "top-center",
                    });
                  
                    const res = await loginToPortal();
                  
                    if (res) {
                      toast.update(toastId, {
                        render: res,
                        type: 'error',
                        isLoading: false,
                        autoClose: 2000,
                      });
                    } else {
                      toast.update(toastId, {
                        render: "Login successful!",
                        type: 'success',
                        isLoading: false,
                        autoClose: 2000,
                      });
                  
                      // Close the modal after a short delay (e.g., 2 seconds)
                      setTimeout(() => {
                        setLoginPortalModal(false);
                      }, 3000);
                    }
                  }}                  
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    isolation: "isolate",
                    backgroundColor: selectedStyle.buyColor,
                  }}
                >
                  <Ripple />
                  Login
                </button>
                <div className="blank"></div>
                <button
                  onClick={(e) => {
                    setLoginPortalModal(false)
                  
                  }}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    isolation: 'isolate',
                    backgroundColor: selectedStyle.sellColor,
                  }}
                >
                  <Ripple />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* {showLogoutModal && <div className="confirm-box" role={`${showLogoutModal}`}>
          <div className="card">
            
            <h2>
              You have been disconnected due to inactivity. Would you like to reconnect?   {remaining} 
            </h2>
            <div className="row-scss">
              <button
                onClick={async () => {
                  const toastId = toast.loading("Logging out...", {
                    position: "top-center",
                  })
                  const res = await logout();
                  if (res) {
                    toast.update(toastId, {
                      render: res,
                      type: 'error',
                      isLoading: false,
                      autoClose: 2000,
                    });
                  }
                }}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  isolation: "isolate",
                }}
              >
                <Ripple />
                Cancel & Logout
              </button>
              <div className="blank"></div>
              <button
                  onClick={(e) => {
                    const id = toast.loading("Reconnecting to the server...", {
                      position: "top-center",
                    });
                    handleReconnect().then(ws => {
                      toast.update(id, {
                        render: "Reconnected to the server.",
                        type: "success",
                        isLoading: false,
                        autoClose: 3000,
                      });
                      setShowLogoutModal(false);
                      setIsReconnected(true);
                    }).catch(err => {
                      toast.update(id, {
                        render: "Failed to reconnect to the server.",
                        type: "error",
                        isLoading: false,
                        autoClose: 3000,
                      });
                    })
                  }}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    isolation: 'isolate',
                  }}
                >
                  <Ripple />
                  Reconnect
                </button>
            </div>
          </div>
        </div>} */}
        <div className="deposit-cash">
          <div className="card">
            <h2>Insufficient balance to open this position. Please deposit to proceed.</h2>
            <div className="row-scss">
              <button
                onClick={(e) => {
                  // mkRipple(e);
                  depositRedirect(e);
                }}
                action="exit"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  isolation: 'isolate',
                  backgroundColor: selectedStyle.buyColor,
                }}
              >
                <Ripple />
                Not now
              </button>
              <button
                onClick={(e) => {
                  // mkRipple(e);
                  depositRedirect(e);
                }}
                // action="https://backoffice.rxbt.net/user/new_deposit_request"
                action={`${getBackendUrl()}/new_deposit_request`}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  isolation: 'isolate',
                  backgroundColor: selectedStyle.sellColor,
                }}
              >
                <Ripple />
                Deposit
              </button>
            </div>
          </div>
        </div>
        {isMariginCallVisible && <MarginCall  onCancel={hideMarginCall} />}
        <div className="scr-lft-main">
          <div className="w-100-css">
            <div className="main-screen">
              <div className="user-header-mobile">
                <UserSettings />
              </div>
              <div className="left-nav" role={leftPanel} style={{ height: "calc(100% - 120px) !important" }}>
                <button className="panelSwitch">
                  <svg
                    onClick={(e) => sidePanelSwitch('left-nav')}
                    // onMouseDown={(e) => panelExpander("left-nav")}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 15 36"
                  >
                    <path d="M6 5h1v5H6zM6 26h1v5H6zM8 5h1v5H8zM8 26h1v5H8zM9 18l-3-3v6Z"></path>
                  </svg>
                </button>
                <div className="user-details">
                  <UserSettings />
                </div>
                {/* <div className="left-nav-shrink-true">
                  <svg
                    onClick={(e) => sidePanelSwitch('left-nav')}
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 13v4H6v2h3v2h2v-2h2v2h2v-2.051c1.968-.249 3.5-1.915 3.5-3.949 0-1.32-.65-2.484-1.64-3.213A3.982 3.982 0 0018 9c0-1.858-1.279-3.411-3-3.858V3h-2v2h-2V3H9v2H6v2h2v6zm6.5 4H10v-4h4.5c1.103 0 2 .897 2 2s-.897 2-2 2zM10 7h4c1.103 0 2 .897 2 2s-.897 2-2 2h-4V7z" />
                  </svg>
                </div> */}
              <Symbol />
              </div>
              <div className="col-dir">
                {/* <div className="chart-tabs"></div> */}
                <div className="direction-col">
                  <div className="chart-zoom"></div>
                  {/* THis input will be used to store default colors from theme  */}
                  <div className="chart-color-picker">
                    <input type="color" id="chartUpColor" />
                    <input type="color" id="chartDownColor" />
                  </div>
                  <div
                    className="chart-box"
                    style={{ height: chartHeightState }}
                  >
                    <div className="chart-con" data-mobile={mobileMode}>
                      <Chart mobileMode={mobileMode} />
                    </div>
                  </div>
                  <div className="resize-history-position">
                    <button
                      // id="resizeHistory"
                      title="Click to Expand Account Management Section."
                      onClick={handleResizeToTop}
                    >
                    <svg
                      fill="#000000"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z" />
                    </svg>
                    </button>
                    <button
                      // id="resizeHistory"
                      title="Click to reset expansions."
                      onClick={handleResizeToMiddle}
                    >
                      <svg
                        viewBox="0 0 32 32"
                        id="icon"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <style>{".cls-1{fill:none;}"}</style>
                        </defs>
                        <path d="M27,8H6.83l3.58-3.59L9,3,3,9l6,6,1.41-1.41L6.83,10H27V26H7V19H5v7a2,2,0,0,0,2,2H27a2,2,0,0,0,2-2V10A2,2,0,0,0,27,8Z" />
                        <rect
                          id="_Transparent_Rectangle_"
                          data-name="&lt;Transparent Rectangle&gt;"
                          className="cls-1"
                          width={32}
                          height={32}
                        />
                      </svg>
                    </button>
                    <button
                      // id="resizeHistory"
                      title="Click to Expand Chart to full height."
                      onClick={handleResizeToBottom}
                    >
                    <svg
                      fill="#000000"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M11.178 19.569a.998.998 0 0 0 1.644 0l9-13A.999.999 0 0 0 21 5H3a1.002 1.002 0 0 0-.822 1.569l9 13z" />
                    </svg>
                    </button>
                    {isMaximized ?
                    (
                    <button className='last-svg-button min-button'
                    onClick={e => {
                      e.preventDefault();
                      sidePanelSwitch('left-nav');
                      sidePanelSwitch('right-nav');
                      handleResizeToMiddle(e);
                      setIsMaximized(false);
                    }}>
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
                        <g id="Complete">
                          <g id="minimize">
                            <g>
                              <path
                                d="M8,3V6A2,2,0,0,1,6,8H3"
                                fill="none"
                                stroke="#c5c5c5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                              />
                              <path
                                d="M16,21V18a2,2,0,0,1,2-2h3"
                                fill="none"
                                stroke="#c5c5c5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                              />
                              <path
                                d="M8,21V18a2,2,0,0,0-2-2H3"
                                fill="none"
                                stroke="#c5c5c5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                              />
                              <path
                                d="M16,3V6a2,2,0,0,0,2,2h3"
                                fill="none"
                                stroke="#c5c5c5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                              />
                            </g>
                          </g>
                        </g>
                      </svg>
                    </button>
                    )
                    :
                    (
                    <button className='last-svg-button max-button'
                    onClick={e => {
                      e.preventDefault();
                      sidePanelSwitch('left-nav');
                      sidePanelSwitch('right-nav');
                      handleResizeToBottom(e);
                      setIsMaximized(true);
                    }} >
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
                        <g id="Complete">
                          <g id="maximize">
                            <g>
                              <path
                                d="M3,8V5A2,2,0,0,1,5,3H8"
                                fill="none"
                                stroke="#c5c5c5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                              />
                              <path
                                d="M21,16v3a2,2,0,0,1-2,2H16"
                                fill="none"
                                stroke="#c5c5c5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                              />
                              <path
                                d="M3,16v3a2,2,0,0,0,2,2H8"
                                fill="none"
                                stroke="#c5c5c5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                              />
                              <path
                                d="M21,8V5a2,2,0,0,0-2-2H16"
                                fill="none"
                                stroke="#c5c5c5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                              />
                            </g>
                          </g>
                        </g>
                      </svg>
                    </button>
                    )}
                    {/* <div className="more-actions-right">
                      <div
                        title="Toggle your account manager panel"
                        className="history-sceen-mode"
                        onClick={(e) => {
                          toggleAccountManager(e);
                        }}
                        aria-checked={toggleAccountManagerPanel}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          class="bi bi-fullscreen"
                          viewBox="0 0 16 16"
                        >
                          <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5M.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5" />
                        </svg>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          class="bi bi-fullscreen-exit"
                          viewBox="0 0 16 16"
                        >
                          <path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5m5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5M0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5m10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0z" />
                        </svg>
                      </div>
                    </div> */}
                  </div>
                  <div className="bottom-section">
                    <div className="row-Bottom">
                      <div className="height-24vh-css">
                        {/* Add Stats section above History content in mobile view */}
                        {mobileMode && currentMobileMode === 'history' && (
                          <div className="mobile-stats-section">                           
                            <div className="mobile-stats-content">
                              <div className="metrics-wrapper">
                                <MetricsPanel mobileMode={mobileMode} />
                              </div>
                            </div>
                          </div>
                        )}
                        <AccountManager  mobileMode={mobileMode} />
                      </div>
                      <div className="metric-parent metric-parent-main">
                        {mobileMode && currentMobileMode !== 'chart' && currentMobileMode !== 'history' && (
                          <div className="mobile-metrics-accordion">
                            
                          </div>
                        )}
                        {!mobileMode && (
                          <MetricsPanel mobileMode={false} />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bottom-stats">
                    <div className="row-Bottom">
                      <div className="metric-parent metric-parent-main">
                        {mobileMode && currentMobileMode !== 'chart' && currentMobileMode !== 'history' && (
                         <div className="metrics-accordion-inner">
                          <MetricsPanel mobileMode={mobileMode} />
                         </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="right-nav" role={rightPanel} style={{zIndex:1}}>
            <button className="panelSwitch" >
              <svg
                onClick={(e) => sidePanelSwitch('right-nav')}
                // onMouseDown={(e) => panelExpander("right-nav")}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 15 36"
              >
                <path d="M6 5h1v5H6zM6 26h1v5H6zM8 5h1v5H8zM8 26h1v5H8zM9 18l-3-3v6Z"></path>
              </svg>
            </button>
            <div className="in-right">
              <OrderPanel />
            </div>
          </div>
        </div>
        {currentMobileMode === 'chart' && <MobileComp />}
      </div>
    </div>
      
    {/* Mobile Navigation Bar - Moved outside all containers for absolute positioning */}
    <div 
      className="smart-brain-mobile-view"
              style={{ display: mobileMode ? 'flex' : 'none' }}
        onAnimationEnd={() => {
          // Add active class to current active nav item
          const navItems = document.querySelectorAll('.btn-icon-block');
          navItems.forEach(item => {
            if (item.getAttribute('role') === currentMobileMode) {
              item.classList.add('active');
            } else {
              item.classList.remove('active');
            }
          });
        }}
    >
      <div
        className="btn-icon-block"
        role="stats"
        tabIndex={0}
        onClick={() => {
          mobMenu('stats');
          // mkRipple(e);
        }}
        onPointerDown={() => mobMenu('stats')}
        
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') mobMenu('home');
        }}
        style={{
          display: 'none',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          minWidth: '50px',
          minHeight: '50px',
          borderRadius: '8px',
          cursor: 'pointer',
          color: '#c5c5c5',
          flex: '1',
          maxWidth: '80px',
          margin: '2px',
          backgroundColor: 'transparent'
        }}
      >
        <Ripple />
        <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" class="bi bi-graph-up" viewBox="0 0 16 16" style={{ marginBottom: '4px' }}>
          <path fill-rule="evenodd" d="M0 0h1v15h15v1H0zm14.817 3.113a.5.5 0 0 1 .07.704l-4.5 5.5a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61 4.15-5.073a.5.5 0 0 1 .704-.07"/>
        </svg>
        <p style={{ fontSize: '0.7rem', margin: '0', fontWeight: '500', textAlign: 'center', lineHeight: '1' }}>Stats</p>
      </div>
      <div
        className={`btn-icon-block ${currentMobileMode === 'home' ? 'active' : ''}`}
        role="home"
        tabIndex={0}
        onClick={() => {
          mobMenu('home');
          // mkRipple(e);
        }}
        onPointerDown={() => mobMenu('home')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') mobMenu('home');
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
          minWidth: '45px',
          minHeight: '45px',
          borderRadius: '10px',
          cursor: 'pointer',
          color: '#c5c5c5',
          flex: '1',
          maxWidth: '75px',
          margin: '2px',
          backgroundColor: 'transparent'
        }}
      >
        <Ripple />
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          height="18px"
          width="18px"
          style={{ marginBottom: '3px', strokeWidth: '1.5' }}
        >
          <path d="M5 22h14a2 2 0 002-2v-9a1 1 0 00-.29-.71l-8-8a1 1 0 00-1.41 0l-8 8A1 1 0 003 11v9a2 2 0 002 2zm5-2v-5h4v5zm-5-8.59l7-7 7 7V20h-3v-5a2 2 0 00-2-2h-4a2 2 0 00-2 2v5H5z" />
        </svg>
        <p style={{ fontSize: '0.65rem', margin: '0', fontWeight: '400', textAlign: 'center', lineHeight: '1', letterSpacing: '0.3px' }}>Home</p>
      </div>
      <div
        className={`btn-icon-block ${currentMobileMode === 'chart' ? 'active' : ''}`}
        role="chart"
        tabIndex={0}
        onClick={() => {
          mobMenu('chart');
          // mkRipple(e);
        }}
        onPointerDown={() => mobMenu('chart')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') mobMenu('chart');
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
          minWidth: '45px',
          minHeight: '45px',
          borderRadius: '10px',
          cursor: 'pointer',
          color: '#c5c5c5',
          flex: '1',
          maxWidth: '75px',
          margin: '2px',
          backgroundColor: 'transparent'
        }}
      >
        <Ripple />
        <svg
          viewBox="0 0 21 21"
          fill="currentColor"
          height="18px"
          width="18px"
          style={{ marginBottom: '3px', strokeWidth: '1.5' }}
        >
          <g
            fill="none"
            fillRule="evenodd"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          >
            <path d="M4.5 3.5v11a2 2 0 002 2h11" />
            <path d="M6.5 12.5l3-3 2 2 5-5" />
            <path d="M16.5 9.5v-3h-3" />
          </g>
        </svg>
        <p style={{ fontSize: '0.65rem', margin: '0', fontWeight: '400', textAlign: 'center', lineHeight: '1', letterSpacing: '0.3px' }}>Chart</p>
      </div>
      <div
        className={`btn-icon-block ${currentMobileMode === 'trading' ? 'active' : ''}`}
        role="trading"
        tabIndex={0}
        onClick={() => {
          mobMenu('trading');
          // mkRipple(e);
        }}
        onPointerDown={() => mobMenu('trading')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') mobMenu('trading');
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
          minWidth: '45px',
          minHeight: '45px',
          borderRadius: '10px',
          cursor: 'pointer',
          color: '#c5c5c5',
          flex: '1',
          maxWidth: '75px',
          margin: '2px',
          backgroundColor: 'transparent'
        }}
      >
        <Ripple />
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          height="18px"
          width="18px"
          style={{ marginBottom: '3px', strokeWidth: '1.5' }}
        >
          <path d="M16.146 0v24l6.134-4.886V3.334zm-2.853 18.758l-4.939 2.157V2.086l4.939 1.462zm-11.572-.553l3.78-.999V5.188l-3.762-.606z" strokeWidth="1.5" />
        </svg>
        <p style={{ fontSize: '0.65rem', margin: '0', fontWeight: '400', textAlign: 'center', lineHeight: '1', letterSpacing: '0.3px' }}>Trading</p>
      </div>
      <div
        className={`btn-icon-block ${currentMobileMode === 'history' ? 'active' : ''}`}
        role="history"
        tabIndex={0}
        onClick={() => {
          mobMenu('history');
          // mkRipple(e);
        }}
        onPointerDown={() => mobMenu('history')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') mobMenu('history');
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
          minWidth: '45px',
          minHeight: '45px',
          borderRadius: '10px',
          cursor: 'pointer',
          color: '#c5c5c5',
          flex: '1',
          maxWidth: '75px',
          margin: '2px',
          backgroundColor: 'transparent'
        }}
      >
        <Ripple />
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          height="18px"
          width="18px"
          style={{ marginBottom: '3px', strokeWidth: '1.5' }}
        >
          <path d="M16.727 3.18C12.31.81 6.915 2.103 4 6V3.5a.5.5 0 00-1 0v4a.5.5 0 00.5.5h4a.5.5 0 000-1H4.522a8.954 8.954 0 017.411-4A8.967 8.967 0 113 12c0-.16 0-.312.009-.472A.5.5 0 002.52 11c-.27-.01-.5.2-.51.472C2 11.652 2 11.82 2 12c.006 5.52 4.48 9.994 10 10a10.005 10.005 0 008.81-5.273c2.614-4.868.786-10.933-4.083-13.547zM12 8a.5.5 0 00-.5.5V12a.5.5 0 00.5.5h2.5a.5.5 0 000-1h-2v-3A.5.5 0 0012 8z" strokeWidth="1.5" />
        </svg>
        <p style={{ fontSize: '0.65rem', margin: '0', fontWeight: '400', textAlign: 'center', lineHeight: '1', letterSpacing: '0.3px' }}>Stats</p>
      </div>
    </div>
    <div 
      className="smart-brain-mobile-view" id='mobile-view-bottom-z-index'
              style={{ display: mobileMode ? 'flex' : 'none' }} 
              ></div>
    </>
  );
};

export default Main;

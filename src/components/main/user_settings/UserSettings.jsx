import React, { useEffect, useState } from 'react';
import { FaBuilding, FaDashcube, FaIcons, FaIdCardAlt, FaPowerOff, FaRegBuilding, FaSignInAlt, FaSignOutAlt, FaUnlockAlt } from 'react-icons/fa';
import { useThemeContext } from '../../../contexts/Theme-Context';
import { useAuthContext } from '../../../contexts/Auth-Context';
import { useSymbolContext } from '../../../contexts/Symbol-Context';
import { useMetricsContext } from '../../../contexts/Metrics-Context';
//import LoginWrapper from '../../utils/wrappers/LoginWrapper'
import './UserSettings.scss';
import { useNavigate } from 'react-router-dom';

import { Ripple } from 'react-ripple-click';
import 'react-ripple-click/dist/index.css';
import NotificationsDropdown from "../notifications/NotificationDropdown.jsx"
import { API_ENDPOINT_SAVE_LOGIN_TOKEN } from '../../../data/Endpoints-API.js';
import APIMiddleware from '../../../data/api/Api-Middleware.js';
import { toast } from 'react-toastify';
import getBackendUrl from '../../utils/RedirectUrl.js';

const UserSettings = () => {
  //CONTEXT
  const { theme, profileImage, setProfileImage } = useThemeContext();
  const { user, logout, login, isLoggingOut , setLogoutModal, setLoginPortalModal} = useAuthContext();
  // const { mkRipple } = useSymbolContext();
  const { metrics } = useMetricsContext();
  const navigate = useNavigate();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mobileMode, setMobileMode] = useState(false);

  // const handleThemeChange = (themeKey) => {
  //   setTheme(themeKey);
  // };

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

  const handleLoginClick = () => {
    //if user already logged in then don't need to sho login page/modal
    if (user && user.userId != undefined) {
      login(user.userId, user.userName, user.balance);
    } else {
      setShowLoginModal(true);
    }
  };
  const clearAllThenLogout = async () => {
    await logout();
    // navigate('/');
  };

  const changeProfileImage = (e) => {
    setProfileImage(window.URL.createObjectURL(e.target.files[0]));
    window.URL.revokeObjectURL(e.target.files[0]);
  };
  return (
    <>
      <div className="user-container">
        <div className="user-data-nd-settings">
          <div className="user-profile-picture">
            <input
              type="file"
              hidden
              id="imgSetter"
              onChange={(e) => changeProfileImage(e)}
              accept="image/.png,.jpeg,.jpeg,.webp,.heic,.bmp,.ico,.png"
            />
            <label htmlFor="imgSetter">
              <img src={profileImage} alt="profile picture" />
            </label>
          </div>
          <div className="settings-nd-name">
            <h2 id="textBoldColor">{user?.userName || ''}</h2>
            <h2 id="textBoldColor">{user?.userAccountId || ''}</h2>
          </div>
        </div>
        {
          <div className="user-info-container">
              {mobileMode && <NotificationsDropdown />}
              <button
                className="login-button"
                disabled={isLoggingOut || localStorage.getItem('accountType') =="0"}
                onClick={() => {
                  setLoginPortalModal(true)
                }}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  isolation: 'isolate',
                  // backgroundColor: "#c5c5c5", 
                  color: "rgb(45, 45, 45)"
                }}
                title='Login to Portal'
              >
                <Ripple />
                {/* Log into portal  */}
              <FaSignInAlt />
              </button>
              <button
                className="login-button"
                disabled={isLoggingOut}
                onClick={() => 
                  setLogoutModal(true)
                }
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  isolation: 'isolate',
                }}
                title="Log Out"
              >
                <Ripple />
                <FaPowerOff />
              </button>
          </div>
        }
      </div>
      {/* <hr className="horizontal-rule-1" /> */}

      <div className='balance-container'>
      <div className="user-balance global-platfrom" style={{display:'flex', justifyContent:'space-between'}}>
      <p>
          Equity
          <span className='fw-bold'>
            {metrics?.equity || metrics?.equity === 0
              ? `${metrics.equity.toFixed(2) || 0.00} ${
                metrics?.userCurrencyName || 'EUR'
                }`
              : 'Loading...'}
          </span>
        </p>
        <div>
       </div>
      </div>
      <div className="user-balance global-platfrom mobile-show">
        <p>
          Balance
          <span className='fw-bold'>
            {metrics?.balance || metrics?.balance === 0
              ? `${metrics.balance.toFixed(2) || 0.00} ${
                metrics?.userCurrencyName || 'EUR'
                }`
              : 'Loading...'}
          </span>
        </p>
      </div>
      </div>
      {/* <hr className="horizontal-rule-2" /> */}
    </>
  );
};

export default UserSettings;
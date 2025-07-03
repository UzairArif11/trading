import React, { useEffect, useRef, useState } from 'react';
import './NotificationDropdown.scss';
import { FaBell, FaRegBell, FaTimes } from "react-icons/fa";
import { API_ENDPOINT_MARK_NOTIFICATIONS_AS_READ, API_ENDPOINT_NOTIFICATIONS } from '../../../data/Endpoints-API';
import { useAuthContext } from '../../../contexts/Auth-Context';
import { useChartContext } from '../../../contexts/Chart-Context';
import APIMiddleware from '../../../data/api/Api-Middleware';
import { adjustDateTime, formatDate } from '../../../utils/format';
import { useMetricsContext } from '../../../contexts/Metrics-Context';
import { Ripple } from 'react-ripple-click';
import SystemNotification from '../order_panel/SystemNotification';
import { toast } from 'react-toastify';

const NotificationDropdown = () => {
    const {
        user
      } = useAuthContext();
      const { utcOffset, metrics } =  useMetricsContext();
    const { selectedStyle } = useChartContext();

    const [isOpen, setIsOpen] = useState(false);
    const [notifications , setNotifications ] = useState([]);
    const [visibleCount,setVisibleCount] = useState(15);
    const [isNotificationsVisible, setIsNotificationsVisible] = useState(true);
  const [isSystemNotificationsVisible, setIsSystemNotificationsVisible] = useState(false);


    const dropdownRef = useRef(null);

    const toggleDropdown = async () => {
        // await getUserNotifications()
        if (!isOpen) {
          // Modal is opening
          await getUserNotifications();
      } else {
          // Modal is closing
          await markNotifictionsAsRead();
      }
        setIsOpen(!isOpen);
    } 


    const getUserNotifications = async () => {
        try {
          if (user && user.userId != undefined && user.userId > 0) {
            const response = await APIMiddleware.get(
              API_ENDPOINT_NOTIFICATIONS(user.userId),
            );
            const responseData = response.data;
                setNotifications(responseData)
                
          }
        } catch (error) {
          // Handle API request error
          console.error(`API request error: ${API_ENDPOINT_NOTIFICATIONS}`, error);
        }
      };

    const markNotifictionsAsRead = async () => {
        try {
          if (user && user.userId != undefined && user.userId > 0) {
            const response = await APIMiddleware.get(
              API_ENDPOINT_MARK_NOTIFICATIONS_AS_READ(user.userId),
            );
            const responseData = response.data;
                setNotifications(responseData)
                
          }
        } catch (error) {
          // Handle API request error
          console.error(`API request error: ${API_ENDPOINT_MARK_NOTIFICATIONS_AS_READ}`, error);
        }
      };
      // close notification when click outside the notfication bar
      useEffect(() => {         
        const handleClickOutside = (event) => {             
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {                 
              setIsOpen(false);             
            }         
        };         
        // Attach event listener
        document.addEventListener('mousedown', handleClickOutside);         
        
        // Clean up event listener on component unmount
        return () => {             
            document.removeEventListener('mousedown', handleClickOutside);         
        };     
      }, []);
      const loadMoreNotification = ()=>
      {
        setVisibleCount((prevNotification)=> prevNotification + 15);
      }
      const toggleSystemNotificationsVisibility = () => {
        // Show system notifications and hide alert notifications
        setIsSystemNotificationsVisible(true);
        setIsNotificationsVisible(false);
      };
    
      const toggleAlertNotificationsVisibility = () => {
        // Show alert notifications and hide system notifications
        setIsNotificationsVisible(true);
        setIsSystemNotificationsVisible(false);
      };
    
    const stripHtml = (html) => {
      if (typeof window !== "undefined") {
        const doc = new DOMParser().parseFromString(html, "text/html");
        return doc.body.textContent || "";
      }

      // Replace tags with a new line before the tag
      return html.replace(/<\/?[^>]+(>|$)/g, (match) => {
        return '\n' + match;
      }).replace(/<\/?[^>]+(>|$)/g, ""); // Remove the tags
    };
    const copyToClipboard = async (htmlString) => {
      const tempElement = document.createElement("div");
      tempElement.innerHTML = htmlString;
  
      const textToCopy = tempElement.innerText || tempElement.textContent;
  
      try {
          await navigator.clipboard.writeText(textToCopy);
          toast.success("Details copied to clipboard!", { position: "top-right" });
      } catch (err) {
          console.error("Failed to copy text: ", err);
      }
  };
  
    return (
      <>
        <style>
        {`
        .system-button{
          margin-left:-1.2rem !important;
        }
        .heading button{
            background-color: rgba(43, 43, 43, 0.7607843137) !important;
            padding: 0.6rem 0.5rem !important;
            width: max-content !important;
            height: -moz-fit-content !important;
            height: fit-content !important;
            border-radius: 0 !important;
            margin-right: 0.3rem !important;
            color: #c5c5c5 !important;
            box-shadow: inset 0px -20px 20px 0px rgba(0, 0, 0, 0.07) !important;
        }
          .system-notification {
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
            font-family: Arial, sans-serif;
          }

          .loading {
            text-align: center;
            padding: 20px;
            font-size: 16px;
          }

          .notification-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .notification-item {
            display: flex;
            align-items: center;
            padding: 10px 0px 10px 10px !important;
            border-bottom: 1px solid #000;
            transition: background-color 0.3s;
            background-color: #232323 !important;
          }

          .notification-icon {
            flex-shrink: 0;
            margin-right: 15px;
            font-size: 24px;
            color: inherit; /* Keeps the current text color */
          }

          .notification-content {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            margin-bottom: 50px;
          }

          .notification-text {
            margin: 0 !important;
            padding: 0 !important;
            font-size: 14px;
            color: #c5c5c5;
            margin-left: 5px !important;
          }

          .notification-time {
            margin: 5px 0 0 0;
            font-size: 12px;
            margin-left: 5px !important;
          }

          h5 {
            text-align: center;
            padding: 20px;
            font-size: 16px;
            color: #666;
          }

          /* Responsive Design */
          @media (max-width: 600px) {
            .notification-item {
              flex-direction: column;
              align-items: flex-start;
            }

            .notification-icon {
              margin-bottom: 10px;
            }

            .notification-time {
              margin: 5px 0 0 0;
            }
          }
        `}
      </style>
        <div className="notification-dropdown" ref={dropdownRef}>
            <div onClick={toggleDropdown} className="notification-icon">
                {metrics.userUnseenNotificationsCount > 0 ? <FaBell size={14} color='#c5c5c5'/> : <FaRegBell size={14} color='#c5c5c5'/>}
                {metrics.userUnseenNotificationsCount > 0 && <span className="notification-count">{metrics.userUnseenNotificationsCount}</span>}
            </div>
            {isOpen && (
                <div className="notification-list">
                    <div className="heading heading1">
                        {/* <h5>Notifications</h5> */}
                          <button
                              onClick={toggleAlertNotificationsVisibility}
                              className='visible-notification'
                              style={{
                                position: 'relative',
                                overflow: 'hidden',
                                isolation: 'isolate',
                                backgroundColor: isNotificationsVisible ? 'gray' : 'transparent', // Red when visible
                                border: isNotificationsVisible ? '1px solid gray' : 'none', // Red border when active, no border when inactive
                              }}
                            >
                              <Ripple />
                              Alert Notifications
                            </button>

                            <button
                            className='system-button visible-notification'
                              onClick={toggleSystemNotificationsVisibility}
                              style={{
                                position: 'relative',
                                overflow: 'hidden',
                                isolation: 'isolate',
                               backgroundColor: isSystemNotificationsVisible ? 'gray' : 'transparent', // Red when visible
                              border: isSystemNotificationsVisible ? '1px solid gray' : 'none', // Red border when active, no border when inactive
                              }}
                            >
                              <Ripple />
                              System Notifications
                            </button>
                          <button
                            onClick={() => {
                              setIsOpen(false);
                            }}
                            className="close-icon"
                          >
                            <FaTimes />
                          </button>
                    </div>
                    {/* <div className="notification-list-item">
                      {notifications.length === 0 ? (
                          <div className="no-notifications">No notifications found</div>
                        ) : (
                          notifications.slice(0 , visibleCount).map((notification, index) => (
                            <div key={index} className="notification-item">
                              <div className="message">{notification.message}</div>
                              <div className="date">
                                {formatDate(adjustDateTime(notification.created_at, utcOffset))}
                              </div>
                            </div>
                          ))
                        )}
                    </div> */}
                    {/* {
                      visibleCount < notifications.length && (
                        <button className='load-more' onClick={loadMoreNotification}>
                          View More
                        </button>
                      )
                    } */}
                          {/* Notification Section */}
                    {/* Show regular notifications if isNotificationsVisible is true */}
                    {isNotificationsVisible && (
        <div className="notification-list-item">
          {notifications.length === 0 ? (
            <div className="no-notifications">No notifications found</div>
          ) : (
            notifications.slice(0, visibleCount).map((notification, index) => (
              <div 
                key={notification.id || index} 
                className="notification-item" 
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div className="message">
                  {notification.type === "transactionLog" ? (
                    stripHtml(notification.message).split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))
                  ) : (
                    <p>{notification.message}</p>
                  )}
                </div>
                <div className="date" style={{color: selectedStyle.buyColor}}>
                  <p>{formatDate(adjustDateTime(notification.created_at, utcOffset))}</p>
                </div>
               { notification.type === "transactionLog" ? <button 
                  className="copy-btn" 
                  onClick={() => copyToClipboard(notification.message)}
                  style={{ marginLeft: "10px", padding: "5px 10px", cursor: "pointer" }}
                >
                  📋 Copy
                </button>:<></>}
              </div>
            ))
          )}

          {visibleCount < notifications.length && (
            <button className="load-more" onClick={loadMoreNotification}>
              View More
            </button>
          )}
        </div>
      )}

      {/* Show system notifications if isSystemNotificationsVisible is true */}
      {isSystemNotificationsVisible && <SystemNotification />}
                </div>
            )}
        </div>
        </>
    );
};

export default NotificationDropdown;

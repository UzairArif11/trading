import React, { memo, useContext, useEffect, useState, useRef } from 'react';
import { notificationSystem } from '../../../data/Endpoints-API';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../../../contexts/Auth-Context';
import { useChartContext } from '../../../contexts/Chart-Context';

function SystemNotification() {
  const { user, reloadApi, setReloadApi } = useContext(AuthContext);  // Get the user context
  const { selectedStyle } = useChartContext();
  const [systemNotificationUpdates, setUpdates] = useState([]); 
  const [systemNotificationLoading, setLoading] = useState(false); 
  const [currentPage, setCurrentPage] = useState(1); 
  const [hasMore, setHasMore] = useState(true);  
  const bottomRef = useRef(null);

  // Function to fetch updates from the backend with pagination support
  const fetchUpdatesNotification = async (page) => {
    setLoading(true); // Set loading to true when we start fetching
    try {
      const response = await axios.post(notificationSystem(), {
        userId: user.userId,
        page,  
        perPage: 15,  
      });

      if (response.data && Array.isArray(response.data.notifications)) {
        if (response.data.notifications.length > 0) {
          setHasMore(false);
          setUpdates(prevUpdates => page === 1 ? [...response.data.notifications] : [...prevUpdates, ...response.data.notifications]);
        } else {
          // setHasMore(false); // No more notifications available
        }
      } else {
        // setHasMore(false); // No notifications available
        setUpdates([]);
      }
    } catch (error) {
      console.error("Error fetching updates:", error);
    } finally {
      setLoading(false); // Set loading to false once fetching is complete
    }
  };

  useEffect(() => {
    setLoading(true);          
    setHasMore(true);            
    setCurrentPage(1);          
    fetchUpdatesNotification(1);
  }, [reloadApi]);

  useEffect(() => {
    if (currentPage !== 1) {
      fetchUpdatesNotification(currentPage); 
    }
  }, [currentPage]);


  // Function to format the timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();  // Format the timestamp as a string
  };

  // Handle the scroll event
  const handleScroll = () => {
    const container = bottomRef.current;
    if (container) {
      const { scrollHeight, scrollTop, clientHeight } = container;
      // Check if the user has scrolled to the bottom
      if (scrollHeight - scrollTop <= clientHeight + 50 && !systemNotificationLoading && hasMore) {
        // Increment the page number to fetch the next batch of notifications
        setCurrentPage(prevPage => prevPage + 1);
      }
    }
  };

  // Scroll event listener setup
  useEffect(() => {
    const container = bottomRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [systemNotificationLoading, hasMore]);  // Re-run if loading or hasMore changes

  return (
    <>
      {/* Integrated Styling */}
      <style>
        {`
          .system-notification {
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
            font-family: Arial, sans-serif;
            overflow-y: auto;
            height: 200px; /* Adjust based on your layout */
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
            display: contents !important;
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
            margin-left: auto !important;
            padding-right: 31px !important;
            font-size: 12px;
            color: #21c46d;
          }

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

      {/* Component Structure */}
      <div
  className="system-notification"
  ref={bottomRef}
  style={{
    height: systemNotificationUpdates.length === 0 ? '103px' : 'auto',
  }}
>
  {systemNotificationLoading && currentPage === 1 ? (
    <div className="loading">
      <span>Loading notifications...</span>
    </div>
  ) : systemNotificationUpdates.length > 0 ? (
    // CASE 2: Notifications exist
    <ul className="notification-list-item">
      {systemNotificationUpdates.map((notification) => (
        <li key={notification.id} className="notification-item">
          <div className="notification-icon" aria-hidden="true">
            {/* Replace with your preferred icon */}
            <i className="fas fa-info-circle"></i>
          </div>
          <div className="notification-content">
            <p className="notification-text">{notification.notification}</p>
            <p className="notification-time" style={{ color: selectedStyle.buyColor }}>{formatTimestamp(notification.created_at)}</p>
          </div>
        </li>
      ))}
      {systemNotificationLoading && (
        <div className="loading">
          <span>Loading more notifications...</span>
        </div>
      )}
    </ul>
  ) : (
    // CASE 4: Finished loading and no notifications found
    <h5
      style={{
        textAlign: 'center',
        padding: '10px',
        fontSize: '14px',
        color: '#c5c5c5',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      No System Notifications Found
    </h5>
  )}
</div>


    </>
  );
}

export default memo(SystemNotification);

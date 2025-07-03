import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { API_ENDPOINT_SAVE_LOGIN_TOKEN, API_ENDPOINT_TOGGLE_BOT } from "../../../data/Endpoints-API.js";
import APIMiddleware from "../../../data/api/Api-Middleware.js";
import { useAuthContext } from "../../../contexts/Auth-Context.js";
import styles from './BotPanel.module.scss';
import Switch from "./Switch.jsx";
import getBackendUrl from "../../utils/RedirectUrl.js";

const openNewTab = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

function checkKeyIsNumber(obj, key) {
  return key in obj && typeof obj[key] === 'number';
}

const BotPanel = () => {
  //CONTEXT
  const { platFromData } = useAuthContext();

  const userId = platFromData[5]['userId'];

  const subscribed = platFromData[7]['is_bot_subscribed'] || platFromData[7]['is_bot_subscribed'] != undefined ? platFromData[7]['is_bot_subscribed'] == 1 ? true : false : false;

  const enabled = platFromData[7]['is_bot_enabled'] || platFromData[7]['is_bot_enabled'] != undefined ? platFromData[7]['is_bot_enabled'] == 1 ? true : false : false;

  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    setIsEnabled(enabled);
  }, [enabled]);

  const success = (bool) => {
    setIsEnabled(bool);
    const action = bool ? 'Enable' : 'Disable';
    toast.success(`Bot ${action}d, successfully!`, {
      position: "top-right",
    });
  };

  const fail = (bool) => {
    setIsEnabled(!bool);
    toast.error("Bot failed to toggle.", {
      position: "top-right",
    });
  };

  const toggleBot = async (bool) => {
    if (!subscribed) return;
    if (platFromData[7]["openedPositions"] > 0) {
      toast.error("You must have no open trades to disable the bot.");
      return;
    };
    setIsEnabled(bool);
    try {
      const response = await APIMiddleware.post(
        API_ENDPOINT_TOGGLE_BOT(),
        { userId: userId, status: bool ? 1 : 0 },
      );
      if (response?.message?.status === (bool ? 1 : 0)) {
        success(bool, 'enabled');
      } else {
        fail(bool);
      }
      console.log(response);
    } catch (error) {
      fail(bool);
      console.error(error);
    }
  };

  // Subscription Call to Action Button Click Handler
  const ctaHandler = async () => {
  try {
    if (userId != undefined && userId > 0 && userId) {
      const response = await APIMiddleware.get(
        API_ENDPOINT_SAVE_LOGIN_TOKEN(userId)
      );
      if (response.data[0].UserLoginToken){
        openNewTab(`${getBackendUrl()}/auto_login?token=${response.data[0].UserLoginToken}&redirect=bot_subscribe`);
      }
    }
  } catch (error) {
    toast.error("An error occurred. Please try again later.", {
      position: "top-right",
    });
    console.error(`Error getting user`, error);
  }
  };

  return (
    <>
      <div className={`${styles.container} ${!subscribed ? styles.unsubscribed : ''}`}>
        <div className={styles.row}>
            <p>Enable Bot</p>
            <Switch subscribed={subscribed} isChecked={isEnabled} handleToggle={toggleBot} />
        </div>
        {/* <div className={styles.row}>
            <p>Bot Balance</p>
            <p className={styles.metric}>{subscribed ? platFromData[7]["botBalance"] : 0}</p>
        </div> */}
        {checkKeyIsNumber(platFromData[7], 'gainProfit') && (
          <>
            <div className={styles.row}>
                <p>Today's Total Trades</p>
                <p className={styles.metric}>{subscribed ? platFromData[7]["closedPositions"] + platFromData[7]["openedPositions"] : 0}</p>
            </div>
            <div className={styles.row}>
                <p>Today's Finished Trades</p>
                <p className={styles.metric}>{subscribed ? platFromData[7]["closedPositions"] : 0}</p>
            </div>
            <div className={styles.row}>
                <p>Today's Open Trades</p>
                <p className={styles.metric}>{subscribed ? platFromData[7]["openedPositions"] : 0}</p>
            </div>
            <div className={styles.row}>
                <p>Today's Realized PnL</p>
                <p className={styles.metric}>{subscribed ? platFromData[7]["gainProfit"]?.toFixed(2) : 0.00}</p>
            </div>
            <div className={styles.row}>
                <p>Bot Reset After</p>
                <p className={styles.metric}>{subscribed ? platFromData[7]["stopTime"] : 0.00}</p>
            </div>
          </>
        )}
      </div>
      {/* {!subscribed && (
        <div className={styles.buttonContainer}>
          <button className={styles.button} onClick={ctaHandler}>
            <p>Activate Premium AI Trading</p>
            <MdOutlineWorkspacePremium />
          </button>
        </div>
      )} */}
    </>
  );
};

export default BotPanel;

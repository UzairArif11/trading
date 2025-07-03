import React, { useState, useEffect } from "react";
import Spinner from "../../utils/spinner/Spinner.jsx";
import { toast } from "react-toastify";
import { useSymbolContext } from "../../../contexts/Symbol-Context.js";
import {
    API_ENDPOINT_SAVE_LOGIN_TOKEN
} from "../../../data/Endpoints-API.js";
import APIMiddleware from "../../../data/api/Api-Middleware.js";
import { useAuthContext } from "../../../contexts/Auth-Context.js";
import { FaTimes } from "react-icons/fa";
import { formatPrice } from "../../../utils/format.js";
import { Ripple } from "react-ripple-click";
import "./Margin-Call.scss"
import getBackendUrl from "../../utils/RedirectUrl.js";

interface MarginCallProps {
    onCancel: () => void;
  }
  
  const MarginCall: React.FC<MarginCallProps> = ({
    onCancel,
  }) =>  {
    const {
      user
    } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);


    const onSubmit = async () => {
      try {
        if (user && user.userId != undefined && user.userId > 0) {
          const response = await APIMiddleware.get(
            API_ENDPOINT_SAVE_LOGIN_TOKEN(user.userId)
          );
          if (response.data[0].UserLoginToken){
            window.open(`${getBackendUrl()}/auto_login?token=${response.data[0].UserLoginToken}&redirect=deposit`, '_blank');
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
        <div className="modal-container">
        <div className="card">
          <div className="model-header">
            <h2>Margin Call</h2>
            <button
              onClick={() => {
                onCancel();
              }}
              className="close-icon"
            >
              <FaTimes />
            </button>
          </div>
          <div className="model-details">
            
            <p className="text-1">Your margin is too low, your account is approaching liquidation</p>
            <p className="text-2">Deposit immediately to increase your margin</p>
          </div>
  
  
          <div className="row-scss">
            <button
              className="cancel-btn"
              onClick={() => {
                onCancel();
              }}
            >
              Cancel
            </button>
            <button
            className="submit-btn"
            disabled={isLoading}
              onClick={() => {
                onSubmit();
              }}
            >
              {!isLoading ? "Deposit" : "Loading..."}
            </button>
          </div>
        </div>
      </div>
    );
};

export default MarginCall;

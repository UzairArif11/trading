import React, { useState, useEffect } from "react";
import Spinner from "../../utils/spinner/Spinner";
import { toast } from "react-toastify";
import { useSymbolContext } from "../../../contexts/Symbol-Context.js";
import {
  API_ENDPOINT_POSITION_DETAIL,
  API_ENDPOINT_UPDATE_POSITION_DETAIL,
} from "../../../data/Endpoints-API.js";
import APIMiddleware from "../../../data/api/Api-Middleware.js";
import { useAuthContext } from "../../../contexts/Auth-Context.js";
import { FaTimes } from "react-icons/fa";
import { formatPrice } from "../../../utils/format.js";
import SLTP from "../market_order/SLTP.jsx";

interface EditSltpProps {
  onCancel: () => void;
  editPositionId: any;
  currentPrice: any;
}

const EditSltp: React.FC<EditSltpProps> = ({
  onCancel,
  editPositionId,
  currentPrice,
}) => {
  //CONTEXT
  const { loadingSymbolContext, symbolData,setIsPositionEdited } = useSymbolContext();
  const { user,selectedAuthSymbol ,platFromData} = useAuthContext();
  // #region All states defined here States
  const [direction, setDirection] = useState("Buy");
  const [tradeQuantity, setTradeQuantity] = useState(0.0);
  const [tradeEntryPrice, setTradeEntryPrice] = useState(0.0);
  const [takeProfit, setTakeProfit] = useState(0.0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stopLoss, setStopLoss] = useState(0.0);
  const [selectedSymbol, setSelectedSymbol] = useState({ask:0.0, bid:0.0})
  const [selectedPosition, setSelectedPosition] = useState({
    SL: null,
    TP: null,
    position_id: "",
    direction: "",
    entry_price: "",
    symbol: "",
  });
  const [slPips, setSlPips] = useState(0.0);

  //dragable dialogbox 
  const [position, setPosition] = useState({x:0 , y:0});
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({x:0, y:0});

  const handleMouseDown = (e)=>{
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = (e)=>{
    if(isDragging){
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
    }
  }

  const handleMouseUp = ()=>{
    setIsDragging(false)
  }

  const handleDisabledButton = (data) => {
    setIsButtonDisabled(data)
  };

  const [tpPips, setTpPips] = useState(0.0);
  // SL: null, TP: null, position_id: '', direction: '', entry_price: ''

  // #endregion

  // #region All UseEffect defined here States

  useEffect(() => {
    if (editPositionId) {
      updateSelectedPosition(editPositionId);
    }
  }, [editPositionId]);

  // #region All functions defined here States
  useEffect(() => {
    setSelectedSymbol(symbolData[selectedPosition?.symbol])
  }, [editPositionId, selectedPosition?.symbol])
  
  useEffect(() => {
    setTradeEntryPrice((direction == "Buy" ? selectedSymbol?.bid: selectedSymbol?.ask));
  }, [selectedSymbol?.ask, selectedSymbol?.bid]);
  const handleProfitChange = (data) => {
    setTakeProfit(data);
  };
  const handleLossChange = (data) => {
    setStopLoss(data);
  };
  const handleSLPipsChange = (data) => {
    setSlPips(data)
  };


  const handleTPPipsChange = (data) => {
    setTpPips(data)
  };

  const updateSelectedPosition = async (p_id) => {
    try {
      if (user && user.userId !== undefined && user.userId > 0) {
        const response = await APIMiddleware.get(
          API_ENDPOINT_POSITION_DETAIL(user.userId, p_id)
        );
        if (response.data) {
          const positionDetails = response.data[0];
          setSelectedPosition(positionDetails);
          setDirection(positionDetails.direction);
          setTradeQuantity(positionDetails.quantity);
        }
      }
    } catch (error) {
      // Handle API request error
      console.error(
        `API request error: ${API_ENDPOINT_POSITION_DETAIL}`,
        error
      );
    }
  };
 
  const onSubmit = async () => {
    try {
      setIsLoading(true);
      if (user && user.userId !== undefined && user.userId > 0) {
        const response = await APIMiddleware.post(
          API_ENDPOINT_UPDATE_POSITION_DETAIL(),
          {
            userId: user.userId,
            positionId: selectedPosition.position_id,
            SL: stopLoss,
            TP: takeProfit,
            symbol: selectedPosition.symbol,
            quantity:tradeQuantity,
            entry_price:tradeEntryPrice,
            direction: direction,
            stop_loss_pips: slPips,
            take_profit_pips:tpPips
          }
        );

        if (response.data) {
          setIsLoading(false); 
          setTakeProfit(0.0);
          setStopLoss(0.0);
          toast.success(response.data[0].message, { position: "top-right" });
          setIsPositionEdited(Math.floor(Math.random()*100))
          onCancel();
        }
      }
    } catch (error) {
      // Handle API request error
      console.error(
        `API request error: ${API_ENDPOINT_POSITION_DETAIL}`,
        error
      );
    }
  };
  //show spinner while loading data
  if (loadingSymbolContext) {
    return <Spinner />;
  }
  
  return (
    <div className="dialog-modal" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      <div className="card" style={{transform:`translate(${position.x}px, ${position.y}px)`,
      position: `absolute`, }}>
        <div className="model-header" onMouseDown={handleMouseDown}>
          <h2>Modify Position: PID{selectedPosition?.position_id ? selectedPosition.position_id.toString().padStart(8, "0") : "---"}</h2>
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
          <p>Symbol:</p> <h2>{selectedPosition?.symbol}</h2>
          <p>Current Price:</p> <h2> {formatPrice(tradeEntryPrice)}</h2>
        </div>
            
        <div className="model-sltp-container">
          <SLTP
            isPendingOrder={false}
            isEditPosition={true}
            handleDisabledButton={handleDisabledButton}
            secondPrice={(direction == "Buy" ? selectedSymbol?.bid   : selectedSymbol?.ask)}
            positionDetails={currentPrice}
            handleSLPipsChange={handleSLPipsChange}
            handleTPPipsChange={handleTPPipsChange}
            handleProfitChange={handleProfitChange}
            handleLossChange={handleLossChange}
            direction={direction}
            quantity={tradeQuantity}
            entryPrice={(direction == "Buy" ? selectedPosition?.entry_price: selectedPosition?.entry_price)}
            EntryPriceExchangeRate={(direction == "Buy" ? selectedSymbol?.ea: selectedSymbol?.eb)}
          />
        </div>

        <div className="row-scss">
          <button
            onClick={() => {
              onCancel();
            }}
          >
            Cancel
          </button>
          <button
            title={
              
                // platFromData[5]?.accessRight == 3
                // ? "Trading for this Account in Disabled"
                // :platFromData[5]?.accessRight == 2
                //   ? "The status of this account is set to Close Only . You can only close your existing Positions" 
                //   :
                   ""
            }   
          disabled={platFromData[5]?.accessRight == 3|| localStorage.getItem('accountType') =="0"|| platFromData[5]?.accessRight == 2|| isButtonDisabled || isLoading}
            onClick={() => {
              onSubmit();
            }}
          >
            {!isLoading ? "Submit" : "Loading..."}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSltp;

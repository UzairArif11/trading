import React, { useEffect, useState } from "react";
import { useSymbolContext } from "../../../contexts/Symbol-Context.js";
import { useOrderContext } from "../../../contexts/Order-Context.js";
import { useMetricsContext } from "../../../contexts/Metrics-Context.js";
import { useAuthContext } from "../../../contexts/Auth-Context.js";
import { formatPositionToPipSize } from "../../../utils/format.js";
import "./OrderSLTP.scss";

import { Ripple } from 'react-ripple-click';
import 'react-ripple-click/dist/index.css';

const SLTP = ({
  isPendingOrder,
  secondPrice,
  isEditPosition,
  positionDetails,
  handleSLPipsChange,
  handleTPPipsChange,
  handleDisabledButton,
  handleProfitChange,
  handleLossChange,
  quantity,
  entryPrice,
  EntryPriceExchangeRate,
  handleSLTPDirection
}) => {
  const TO_FIXED = 4;
  const { symbolInfo, selectedSymbolExchangeRate, selectedSymbolQuoteExchangeRate } = useSymbolContext();

  const { metrics } = useMetricsContext();
  const { user, selectedAuthSymbol } = useAuthContext();

  const [isSLSelected, setIsSLSelected] = useState(
    positionDetails && positionDetails.SL && positionDetails.SL > 0
      ? true
      : false
  );
  const [isTPSelected, setIsTPSelected] = useState(
    positionDetails && positionDetails.TP && positionDetails.TP > 0
      ? true
      : false
  );

  const [pipSize, setPipSize] = useState(0.0);
  const [slPrice, setSlPrice] = useState(
    positionDetails && positionDetails.SL && positionDetails.SL > 0
      ? parseFloat(positionDetails.SL)
      : 0.0
  );
  const [slBalance, setSlBalance] = useState(0.0);
  const [slProfit, setSlProfit] = useState(0.0);
  const [slPips, setSlPips] = useState(0.0);
  const [tpPrice, setTpPrice] = useState(
    positionDetails && positionDetails.TP && positionDetails.TP > 0
      ? parseFloat(positionDetails.TP)
      : 0.0
  );
  const [tpBalance, setTpBalance] = useState(0.0);
  const [tpProfit, setTpProfit] = useState(0.0);
  const [tpPips, setTpPips] = useState(0.0);
  const [slSelectedState, setSlSelectedState] = useState("");
  const [direction, setDirection] = useState(""); // "long" or "short"

  const [isSLError, setIsSLError] = useState(false);
  const [isTPError, setIsTPError] = useState(false);
  const [errorList, setErrorList] = useState({
    buySL: "Stop-loss should be lower than bid price",
    buyTP: "Take-profit should be greater than ask price",
    priNeg: "Please enter a valid price",
    priLower: "price should be lower than bid price",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [errorMessageTP, setErrorMessageTP] = useState("")
  useEffect(() => {
    handleDisabledButton(isSLError || isTPError);
  }, [isSLError, isTPError])

  const [tpSelectedState, setTpSelectedState] = useState("");
  useEffect(() => {
    setPipSize(formatPositionToPipSize(symbolInfo.pip_position));
  }, [symbolInfo]);

  useEffect(() => {
    if (slSelectedState === "pips") {
      slPips_fn(slPips);
    } else if (slSelectedState === "price") {
      slPrice_fn(slPrice);
    } else if (slSelectedState === "balance") {
      slBalance_fn(slBalance);
    } else if (slSelectedState === "profit") {
      slProfit_fn(slProfit);
    }

    if (tpSelectedState === "pips") {
      tpPips_fn(tpPips);
    } else if (tpSelectedState === "price") {
      tpPrice_fn(tpPrice);
    } else if (tpSelectedState === "balance") {
      tpBalance_fn(tpBalance);
    } else if (tpSelectedState === "profit") {
      tpProfit_fn(tpProfit);
    }
  }, [direction, quantity, entryPrice]);
  useEffect(() => {
    if (isEditPosition && isSLSelected) {
      reCalculate_slPrice_fn();
    }
    if (isEditPosition && isTPSelected) {
      reCalculate_tpPrice_fn();
    }
  }, []);
  useEffect(() => {
    if (!isEditPosition) {
      setSlPips(0.0);
      handleSLPipsChange(0.0);
      handleTPPipsChange(0.0);
      setSlProfit(0.0);
      setSlBalance(0.0);
      setSlPrice(0.0);
      setTpPrice(0.0);
      setTpPips(0.0);
      setTpProfit(0.0);
      setTpBalance(0.0);
      handleLossChange(0.0);
      handleProfitChange(0.0);
      setSlSelectedState("");
      setTpSelectedState("");
    }
  }, [selectedAuthSymbol]);
  useEffect(() => {
    if (!isEditPosition) {
      setSlPips(0.0);
      handleSLPipsChange(0.0);
      handleTPPipsChange(0.0);
      setSlProfit(0.0);
      setSlBalance(0.0);
      setTpPips(0.0);
      setSlPrice(0.0);
      setTpPrice(0.0);
      setTpProfit(0.0);
      setTpBalance(0.0);
      handleLossChange(0.0);
      handleProfitChange(0.0);
      setSlSelectedState("");
      setTpSelectedState("");
    }
  }, [
    quantity === null ||
    quantity <= 0 ||
    quantity === undefined ||
    isNaN(quantity),
  ]);

  function handleDirection(direction) {
    handleSLTPDirection(direction);
    setDirection(direction);
  }

  const sltpToggle = (e) => {
    if (e.target.checked) {
      handleDirection("Buy");
    }else{
      handleDirection("")
    }
    // if (e.target.id === "stop_loss") {
    setIsSLSelected(e.target.checked);
    setIsSLError(false);
    setSlPips(0.0);
    setSlPrice(0.0);
    handleSLPipsChange(0.0);
    setSlProfit(0.0);
    setSlBalance(0.0);
    handleLossChange(0.0);

    setSlSelectedState("");
    // }

    // if (e.target.id === "take_profit") {
    setIsTPSelected(e.target.checked);
    setIsTPError(false);
    setTpPips(0.0);
    handleTPPipsChange(0.0);
    setTpPrice(0.0);
    setTpProfit(0.0);
    setTpBalance(0.0);
    handleProfitChange(0.0);
    setTpSelectedState("");
    // }
  };
  const slPips_fn = (e) => {
    setSlSelectedState("pips");
    setSlPips(e);
    handleSLPipsChange(e);

    if (direction == "Buy") {
      const pip_movement = pipSize * e;
      const price = entryPrice - pip_movement;
      if (price > secondPrice || price < 0) {
        setIsSLError(true);
        setErrorMessage(errorList.buySL);
      } else {
        setIsSLError(false);
        setErrorMessage("");
      }
      const loss_profit_in_quote = quantity * (entryPrice - price);
      const loss_profit_in_account_currecny = loss_profit_in_quote * selectedSymbolExchangeRate*EntryPriceExchangeRate;

      const balance = (loss_profit_in_account_currecny / metrics.balance) * 100;

      setSlPrice(price.toFixed(TO_FIXED));

      setSlBalance(balance.toFixed(TO_FIXED));
      setSlProfit(loss_profit_in_account_currecny.toFixed(TO_FIXED));

      handleLossChange(price.toFixed(TO_FIXED));
    }

    ///////STOP LOSS DIRECTION SELL
    if (direction == "Sell") {
      const pip_movement = pipSize * e;

      const price = parseFloat(entryPrice) + pip_movement;
      if (price < secondPrice || price < 0) {
        setIsSLError(true);
        setErrorMessage(errorList.sellSL);
      } else {
        setIsSLError(false);
        setErrorMessage("");
      }
      const loss_profit_in_quote = quantity * (price - parseFloat(entryPrice));
      const loss_profit_in_account_currecny =
        loss_profit_in_quote * selectedSymbolExchangeRate*EntryPriceExchangeRate;
      const balance = (loss_profit_in_account_currecny / metrics.balance) * 100;

      setSlPrice(price.toFixed(TO_FIXED));

      setSlBalance(balance.toFixed(TO_FIXED));
      setSlProfit(loss_profit_in_account_currecny.toFixed(TO_FIXED));

      handleLossChange(price.toFixed(TO_FIXED));
    }
  };
  const reCalculate_slPrice_fn = () => {
    setSlSelectedState("price");

    if (direction == "Buy") {
      const pip_movement = entryPrice - slPrice;
      const pips = pip_movement / pipSize;
      const loss_profit_in_quote = quantity * (entryPrice - slPrice);

      const loss_profit_in_account_currecny =
        loss_profit_in_quote * selectedSymbolExchangeRate*EntryPriceExchangeRate;
      const balance = (loss_profit_in_account_currecny / metrics.balance) * 100;

      setSlPips(pips.toFixed(TO_FIXED));
      handleSLPipsChange(pips.toFixed(TO_FIXED));
      setSlBalance(balance.toFixed(TO_FIXED));
      setSlProfit(loss_profit_in_account_currecny.toFixed(TO_FIXED));
      handleLossChange(parseFloat(slPrice).toFixed(TO_FIXED));
    }

    ////////////STOP LOSS DIRECTION SELL
    if (direction == "Sell") {
      const pip_movement = entryPrice - tpPrice;

      const pips = pip_movement / pipSize;

      const loss_profit_in_quote = quantity * (tpPrice - entryPrice);

      const loss_profit_in_account_currecny =
        loss_profit_in_quote * selectedSymbolExchangeRate*EntryPriceExchangeRate;
      const balance = (loss_profit_in_account_currecny / metrics.balance) * 100;

      setSlPips(pips.toFixed(TO_FIXED));
      handleSLPipsChange(pips.toFixed(TO_FIXED));
      setSlBalance(balance.toFixed(TO_FIXED));
      setSlProfit(loss_profit_in_account_currecny.toFixed(TO_FIXED));
      handleLossChange(parseFloat(tpPrice));
    }
  };
  const slPrice_fn = (e) => {
    setSlSelectedState("price");
    setSlPrice(e);

    if (direction == "Buy") {
      const pip_movement = entryPrice - e;

      if (e < 0 || e >= secondPrice) {
        if (e < 0 || e >= secondPrice) {
          setIsSLError(true);
          setErrorMessage(errorList.buySL);
        } else {
          setIsSLError(false);
          setErrorMessage("");
        }
      }
      else {
        if (pip_movement < 0) {
          setIsSLError(true);
          setErrorMessage(errorList.priNeg);
        } else {
          setIsSLError(false);
          setErrorMessage("");
        }
      }

      const pips = pip_movement / pipSize;
      const loss_profit_in_quote = quantity * (entryPrice - e);

      const loss_profit_in_account_currecny =
        loss_profit_in_quote * selectedSymbolExchangeRate*EntryPriceExchangeRate;
      const balance = (loss_profit_in_account_currecny / metrics.balance) * 100;

      setSlPips(pips.toFixed(TO_FIXED));
      handleSLPipsChange(pips.toFixed(TO_FIXED));
      setSlBalance(balance.toFixed(TO_FIXED));
      setSlProfit(loss_profit_in_account_currecny.toFixed(TO_FIXED));
      handleLossChange(parseFloat(e).toFixed(TO_FIXED));
    }

    ////////////STOP LOSS DIRECTION SELL
    if (direction == "Sell") {
      const pip_movement = e - entryPrice;

      if (e < 0 || e < secondPrice) {

        if (e < 0 || e < secondPrice) {
          setIsSLError(true);
          setErrorMessage("price should be greater than ask price");
        } else {
          setIsSLError(false);
          setErrorMessage("");
        }
      }
      else {
        if (pip_movement < 0) {
          setIsSLError(true);
          setErrorMessage(errorList.buySL);
        } else {
          setIsSLError(false);
          setErrorMessage("");
        }
      }



      const pips = pip_movement / pipSize;

      const loss_profit_in_quote = quantity * (e - entryPrice);

      const loss_profit_in_account_currecny =
        loss_profit_in_quote * selectedSymbolExchangeRate*EntryPriceExchangeRate;
      const balance = (loss_profit_in_account_currecny / metrics.balance) * 100;

      setSlPips(pips.toFixed(TO_FIXED));
      handleSLPipsChange(pips.toFixed(TO_FIXED));
      setSlBalance(balance.toFixed(TO_FIXED));
      setSlProfit(loss_profit_in_account_currecny.toFixed(TO_FIXED));
      handleLossChange(parseFloat(e));
    }
  };
  const slBalance_fn = (e) => {
    setSlSelectedState("balance");
    setSlBalance(e);

    if (direction == "Buy") {
      const loss_profit_in_account_currecny = (metrics.balance / 100) * e;
      const price =
        entryPrice -
        (loss_profit_in_account_currecny / quantity) * selectedSymbolQuoteExchangeRate*EntryPriceExchangeRate;
      if (price < 0 || price > secondPrice) {
        setIsSLError(true);
        setErrorMessage(errorList.buySL)
      }
      else {
        setIsSLError(false);
        setErrorMessage("");
      }

      const pip_movement = entryPrice - price;
      const pips = pip_movement / pipSize;

      setSlPips(pips.toFixed(TO_FIXED));
      handleSLPipsChange(pips.toFixed(TO_FIXED));
      setSlPrice(price.toFixed(TO_FIXED));

      setSlProfit(loss_profit_in_account_currecny.toFixed(TO_FIXED));
      handleLossChange(price.toFixed(TO_FIXED));
    }

    // ////////STOP LOSS DIRECTION SELL
    if (direction == "Sell") {
      const loss_profit_in_account_currecny = (metrics.balance / 100) * e;
      const price =
        parseFloat(entryPrice) +
        (loss_profit_in_account_currecny / quantity) * selectedSymbolQuoteExchangeRate*EntryPriceExchangeRate;
      const pip_movement = price - entryPrice;

      if (pip_movement < 0 || price < secondPrice) {
        setIsSLError(true);
        setErrorMessage(errorList.buySL);
      } else {
        setIsSLError(false);
        setErrorMessage("");
      }

      const pips = pip_movement / pipSize;

      setSlPips(pips.toFixed(TO_FIXED));
      handleSLPipsChange(pips.toFixed(TO_FIXED));
      setSlPrice(price.toFixed(TO_FIXED));

      setSlProfit(loss_profit_in_account_currecny.toFixed(TO_FIXED));
      handleLossChange(price.toFixed(TO_FIXED));
    }
  };
  const slProfit_fn = (e) => {
    setSlSelectedState("profit");
    setSlProfit(e);

    if (direction == "Buy") {
      const balance = (e / metrics.balance) * 100;

      const price = entryPrice - (e / quantity) * selectedSymbolQuoteExchangeRate*EntryPriceExchangeRate;

      const pip_movement = entryPrice - price;

      if (price < 0 || price > secondPrice) {
        setIsSLError(true);
        setErrorMessage(errorList.buySL);
      } else {
        setIsSLError(false);
        setErrorMessage("");
      }
      const pips = pip_movement / pipSize;

      setSlPips(pips.toFixed(TO_FIXED));
      handleSLPipsChange(pips.toFixed(TO_FIXED));
      setSlBalance(balance.toFixed(TO_FIXED));

      setSlPrice(price.toFixed(TO_FIXED));

      handleLossChange(price.toFixed(TO_FIXED));
    }

    if (direction == "Sell") {
      const balance = (e / metrics.balance) * 100;

      const price = parseFloat(entryPrice) + (e / quantity) * selectedSymbolQuoteExchangeRate*EntryPriceExchangeRate;

      const pip_movement = price - entryPrice;

      if (pip_movement < 0) {
        setIsSLError(true);
        setErrorMessage(errorList.buySL);
      } else {
        setIsSLError(false);
        setErrorMessage("");
      }

      const pips = pip_movement / pipSize;

      setSlPips(pips.toFixed(TO_FIXED));
      handleSLPipsChange(pips.toFixed(TO_FIXED));
      setSlBalance(balance.toFixed(TO_FIXED));
      setSlPrice(price.toFixed(TO_FIXED));

      handleLossChange(price.toFixed(TO_FIXED));
    }
  };
  const tpPips_fn = (e) => {
    setTpSelectedState("pips");
    setTpPips(e);
    handleTPPipsChange(e);
    if (direction == "Buy") {
      const pip_movement = e * pipSize;
      const price = parseFloat(entryPrice) + pip_movement;
      if (price < secondPrice) {
        setIsTPError(true);
        setErrorMessageTP(errorList.buyTP);
      } else {
        setIsTPError(false);
        setErrorMessageTP("");
      }
      const loss_profit_in_quote = quantity * (price - parseFloat(entryPrice));

      const loss_profit_in_account_currecny =
        loss_profit_in_quote * selectedSymbolExchangeRate*EntryPriceExchangeRate;

      const balance = (loss_profit_in_account_currecny / metrics.balance) * 100;
      setTpPrice(price.toFixed(TO_FIXED));
      setTpBalance(balance.toFixed(TO_FIXED));
      setTpProfit(loss_profit_in_account_currecny.toFixed(TO_FIXED));

      handleProfitChange(price);
    }

    ///////TAKE PROFIT DIRECTION SELL
    if (direction == "Sell") {
      const pip_movement = e * pipSize;
      const price = entryPrice - pip_movement;
      if (price < 0 || price > secondPrice) {
        setIsTPError(true);
        setErrorMessageTP(errorList.buyTP);
      } else {
        setIsTPError(false);
        setErrorMessageTP("");
      }
      const loss_profit_in_quote = quantity * (entryPrice - price);
      const loss_profit_in_account_currecny =
        loss_profit_in_quote * selectedSymbolExchangeRate*EntryPriceExchangeRate;
      const balance = (loss_profit_in_account_currecny / metrics.balance) * 100;

      setTpPrice(price.toFixed(TO_FIXED));
      setTpBalance(balance.toFixed(TO_FIXED));
      setTpProfit(loss_profit_in_account_currecny.toFixed(TO_FIXED));

      handleProfitChange(price);
    }
  };
  const tpPrice_fn = (e) => {
    setTpSelectedState("price");
    setTpPrice(e);

    if (direction == "Buy") {
      const pip_movement = entryPrice - e;

      if (e < secondPrice || e < 0) {
        setIsTPError(true);
        setErrorMessageTP(errorList.buyTP);
      } else {
        setIsTPError(false);
        setErrorMessageTP("");
      }

      const pips = Math.abs(pip_movement) / pipSize;
      const loss_profit_in_quote = quantity * (e - entryPrice);
      const loss_profit_in_account_currecny =
        loss_profit_in_quote * selectedSymbolExchangeRate*EntryPriceExchangeRate;
      const balance = (loss_profit_in_account_currecny / metrics.balance) * 100;

      setTpPips(pips.toFixed(TO_FIXED));
      handleTPPipsChange(pips.toFixed(TO_FIXED));
      setTpBalance(balance.toFixed(TO_FIXED));
      setTpProfit(loss_profit_in_account_currecny.toFixed(TO_FIXED));
      handleProfitChange(parseFloat(e));
    }

    ////////////Take PROFIT DIRECTION SELL
    if (direction == "Sell") {
      const pip_movement = entryPrice - e;
      if (e > entryPrice || e < 0) {
        if (e > entryPrice) {
          setIsTPError(true);
          setErrorMessageTP(errorList.priLower);
        }
        else if (e < 0) {
          setIsTPError(true);
          setErrorMessageTP(errorList.priNeg);
        }
      } else {
        setIsTPError(false);
        setErrorMessageTP("");
      }
      const pips = Math.abs(pip_movement) / pipSize;
      const loss_profit_in_quote = Math.abs(quantity * (e - entryPrice));
      const loss_profit_in_account_currecny =
        loss_profit_in_quote * selectedSymbolQuoteExchangeRate*EntryPriceExchangeRate;
      const balance = (loss_profit_in_account_currecny / metrics.balance) * 100;

      setTpPips(pips.toFixed(TO_FIXED));
      handleTPPipsChange(pips.toFixed(TO_FIXED));
      setTpBalance(balance.toFixed(TO_FIXED));
      setTpProfit(loss_profit_in_account_currecny.toFixed(TO_FIXED));
      handleProfitChange(parseFloat(e));
    }
  };
  const reCalculate_tpPrice_fn = () => {
    setTpSelectedState("price");

    if (direction == "Buy") {
      const pip_movement = entryPrice - tpPrice;
      const pips = pip_movement / pipSize;
      const loss_profit_in_quote = quantity * (tpPrice - entryPrice);
      const loss_profit_in_account_currecny =
        loss_profit_in_quote * selectedSymbolQuoteExchangeRate*EntryPriceExchangeRate;
      const balance = (loss_profit_in_account_currecny / metrics.balance) * 100;

      setTpPips(Math.abs(pips.toFixed(TO_FIXED)));
      handleTPPipsChange(pips.toFixed(TO_FIXED));
      setTpBalance(balance.toFixed(TO_FIXED));
      setTpProfit(loss_profit_in_account_currecny.toFixed(TO_FIXED));
      handleProfitChange(parseFloat(tpPrice));
    }

    ////////////Take PROFIT DIRECTION SELL
    if (direction == "Sell") {
      const pip_movement = entryPrice - tpPrice;
      const pips = pip_movement / pipSize;
      const loss_profit_in_quote = quantity * (tpPrice - entryPrice);
      const loss_profit_in_account_currecny =
        loss_profit_in_quote * selectedSymbolQuoteExchangeRate*EntryPriceExchangeRate;
      const balance = (loss_profit_in_account_currecny / metrics.balance) * 100;

      setTpPips(pips.toFixed(TO_FIXED));
      handleTPPipsChange(pips.toFixed(TO_FIXED));
      setTpBalance(balance.toFixed(TO_FIXED));
      setTpProfit(loss_profit_in_account_currecny.toFixed(TO_FIXED));
      handleProfitChange(parseFloat(tpPrice));
    }
  };
  const tpBalance_fn = (e) => {
    setTpSelectedState("balance");
    setTpBalance(e);

    if (direction == "Buy") {
      const loss_profit_in_account_currecny = (metrics.balance / 100) * e;

      const price =
        parseFloat(entryPrice) +
        (loss_profit_in_account_currecny / quantity) * selectedSymbolQuoteExchangeRate*EntryPriceExchangeRate;

      const pip_movement = price - entryPrice;

      if (price < secondPrice) {
        setIsTPError(true);
        setErrorMessageTP(errorList.buyTP);
      } else {
        setIsTPError(false);
        setErrorMessageTP("");
      }

      const pips = pip_movement / pipSize;

      setTpPips(pips.toFixed(TO_FIXED));
      handleTPPipsChange(pips.toFixed(TO_FIXED));
      setTpPrice(price.toFixed(TO_FIXED));
      setTpProfit(loss_profit_in_account_currecny.toFixed(TO_FIXED));

      handleProfitChange(price);
    }

    ////////Take Profit DIRECTION SELL
    if (direction == "Sell") {
      const loss_profit_in_account_currecny = (metrics.balance / 100) * e;

      const price = Math.abs(entryPrice -
        (loss_profit_in_account_currecny / quantity) * selectedSymbolQuoteExchangeRate*EntryPriceExchangeRate);

      if (price < 0 || price > secondPrice) {
        setIsTPError(true);
        setErrorMessageTP(errorList.buyTP);
      } else {
        setIsTPError(false);
        setErrorMessageTP("");
      }

      const pip_movement = Math.abs(price - entryPrice);

      const pips = pip_movement / pipSize;

      setTpPips(pips.toFixed(TO_FIXED));
      handleTPPipsChange(pips.toFixed(TO_FIXED));
      setTpPrice(price.toFixed(TO_FIXED));
      setTpProfit(loss_profit_in_account_currecny.toFixed(TO_FIXED));

      handleProfitChange(price);
    }
  };
  const tpProfit_fn = (e) => {
    setTpSelectedState("profit");
    setTpProfit(e);

    if (direction == "Buy") {
      const balance = (e / metrics.balance) * 100;

      const price = parseFloat(entryPrice) + (e / quantity) * selectedSymbolQuoteExchangeRate*EntryPriceExchangeRate;

      const pip_movement = Math.abs(entryPrice - price);

      if (price < secondPrice) {
        setIsTPError(true);
        setErrorMessageTP(errorList.buyTP);
      } else {
        setIsTPError(false);
        setErrorMessageTP("");
      }

      const pips = pip_movement / pipSize;

      setTpPips(pips.toFixed(TO_FIXED));
      handleTPPipsChange(pips.toFixed(TO_FIXED));
      setTpBalance(balance.toFixed(TO_FIXED));
      setTpPrice(price.toFixed(TO_FIXED));

      handleProfitChange(price);
    }

    if (direction == "Sell") {
      const balance = (e / metrics.balance) * 100;

      const price = entryPrice - (e / quantity) * selectedSymbolQuoteExchangeRate*EntryPriceExchangeRate;

      if (price < 0 || price > secondPrice) {
        setIsTPError(true);
        setErrorMessageTP(errorList.buyTP);
      } else {
        setIsTPError(false);
        setErrorMessageTP("");
      }

      const pip_movement = entryPrice - price;

      const pips = pip_movement / pipSize;

      setTpPips(pips.toFixed(TO_FIXED));
      handleTPPipsChange(pips.toFixed(TO_FIXED));
      setTpBalance(balance.toFixed(TO_FIXED));
      setTpPrice(price.toFixed(TO_FIXED));

      handleProfitChange(price);
    }
  };
  const isDisabledSLInput = () => {
    if (quantity > 0 && isSLSelected && parseFloat(entryPrice) > 0) {
      return false;
    } else {
      return true;
    }
  };
  const isDisabledTPInput = () => {
    if (quantity > 0 && isTPSelected && parseFloat(entryPrice) > 0) {
      return false;
    } else {
      return true;
    }
  };
  const handleScroll = (e) => {
    // e.preventDefault();
    e.target.blur();
  }
  return (
    <>
      <div
        className="sltp-container-binance"
      >
        <div className="left">
          <div className="stop-loss ">
            <div className="sltp-checkbox-binance">
              <div className="">
                <input
                  hidden
                  type="checkbox"
                  id="stop_loss"
                  checked={isSLSelected}
                  onChange={sltpToggle}
                />
                <label
                  htmlFor="stop_loss"
                  className="my-chk-xbx"
                  role={isSLSelected ? "checked" : "unchecked"}
                >
                  <div
                    className="chkx-xbx"
                    onClick={() => {
                      // mkRipple(j);
                    }}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      isolation: 'isolate',
                    }}
                  >
                    <Ripple />
                  </div>
                  <span className="col-white">SL/TP</span>
                </label>
              </div>
              {
                (isSLSelected || isTPSelected) && (
                  <div className="position-toggle">
                    <button
                      className={`toggle-button ${direction === "Buy" ? "active" : ""}`}
                      onClick={() => handleDirection("Buy")}
                    >
                      Long
                    </button>
                    <button
                      className={`toggle-button ${direction === "Sell" ? "active" : ""}`}
                      onClick={() => handleDirection("Sell")}
                    >
                      Short
                    </button>
                  </div>
                )
              }
            </div>
          </div>
        </div>

        {(isSLSelected || isTPSelected) && (
          <div className="sltp-grid">
            {/* LEFT COLUMN: PIPS & BALANCE */}
            <div className="column left">
              <div className="input-group">
                <label>SL Pips</label>
                <input
                  type="number"
                  value={slPips}
                  onChange={(e) => slPips_fn(parseFloat(e.target.value))}
                  disabled={isDisabledSLInput()}
                  className={`sl_pips ${isDisabledSLInput() ? "disabled-fields" : ""}`}
                  onWheel={handleScroll}
                  step={pipSize}
                />
              </div>

              <div className="input-group">
                <label>SL Balance (%)</label>
                <input
                  type="number"
                  value={slBalance}
                  onChange={(e) => slBalance_fn(parseFloat(e.target.value))}
                  disabled={isDisabledSLInput()}
                  className={`sl_balance ${isDisabledSLInput() ? "disabled-fields" : ""}`}
                  onWheel={handleScroll}
                  step={0.01}
                />
              </div>

              <div className="input-group">
                <label>TP Pips</label>
                <input
                  type="number"
                  value={tpPips}
                  onChange={(e) => tpPips_fn(parseFloat(e.target.value))}
                  disabled={isDisabledTPInput()}
                  className={`tp_pips ${isDisabledTPInput() ? "disabled-fields" : ""}`}
                  onWheel={handleScroll}
                  step={pipSize}
                />
              </div>

              <div className="input-group">
                <label>TP Balance (%)</label>
                <input
                  type="number"
                  value={tpBalance}
                  onChange={(e) => tpBalance_fn(parseFloat(e.target.value))}
                  disabled={isDisabledTPInput()}
                  className={`tp_balance ${isDisabledTPInput() ? "disabled-fields" : ""}`}
                  onWheel={handleScroll}
                  step={0.01}
                />
              </div>
            </div>

            {/* RIGHT COLUMN: PRICE & PROFIT */}
            <div className="column right">
              <div className="input-group">
                <label>SL Price</label>
                <input
                  type="number"
                  value={Math.abs(slPrice)}
                  onChange={(e) => slPrice_fn(parseFloat(e.target.value))}
                  disabled={isDisabledSLInput()}
                  className={`sl_price ${isDisabledSLInput() ? "disabled-fields" : ""}`}
                  onWheel={handleScroll}
                  step={0.001}
                  style={
                    isSLError && !isPendingOrder
                      ? {
                        background: "#8e3f3f",
                        borderWidth: "2px",
                        borderStyle: "solid",
                      }
                      : {}
                  }
                  title={errorMessage}
                />
              </div>

              <div className="input-group">
                <label>PNL ~ {user?.userCurrencyName || "EUR"}</label>
                <input
                  type="number"
                  value={slProfit}
                  onChange={(e) => slProfit_fn(parseFloat(e.target.value))}
                  disabled={isDisabledSLInput()}
                  className={`sl_profit ${isDisabledSLInput() ? "disabled-fields" : ""}`}
                  onWheel={handleScroll}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      const inc = parseFloat(+slPips + +pipSize).toFixed(TO_FIXED);
                      slPips_fn(inc);
                    } else if (e.key === "ArrowDown") {
                      e.preventDefault();
                      const dec = parseFloat(+slPips - +pipSize).toFixed(TO_FIXED);
                      slPips_fn(dec);
                    }
                  }}
                />
              </div>

              <div className="input-group">
                <label>TP Price</label>
                <input
                  type="number"
                  value={tpPrice}
                  onChange={(e) => tpPrice_fn(parseFloat(e.target.value))}
                  disabled={isDisabledTPInput()}
                  className={`tp_price ${isDisabledTPInput() ? "disabled-fields" : ""}`}
                  onWheel={handleScroll}
                  step={0.001}
                  style={
                    isTPError && !isPendingOrder
                      ? {
                        background: "#8e3f3f",
                        borderWidth: "2px",
                        borderStyle: "solid",
                      }
                      : {}
                  }
                  title={errorMessageTP}
                />
              </div>

              <div className="input-group">
                <label>PNL ~ {user?.userCurrencyName || "EUR"}</label>
                <input
                  type="number"
                  value={tpProfit}
                  onChange={(e) => tpProfit_fn(parseFloat(e.target.value))}
                  disabled={isDisabledTPInput()}
                  className={`tp_profit ${isDisabledTPInput() ? "disabled-fields" : ""}`}
                  onWheel={handleScroll}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      const inc = parseFloat(+tpPips + +pipSize).toFixed(TO_FIXED);
                      tpPips_fn(inc);
                    } else if (e.key === "ArrowDown") {
                      e.preventDefault();
                      const dec = parseFloat(+tpPips - +pipSize).toFixed(TO_FIXED);
                      tpPips_fn(dec);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default SLTP;

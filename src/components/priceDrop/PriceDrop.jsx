import React, { useState } from 'react';
import { Ripple } from 'react-ripple-click';
import { formatPriceUptoDecimals } from '../../utils/format';
import './PriceDropAlert.scss';
import { toast } from 'react-toastify';
import { useSymbolContext } from '../../contexts/Symbol-Context';
import { useAuthContext } from '../../contexts/Auth-Context';
import { useMetricsContext } from '../../contexts/Metrics-Context';
import APIMiddleware from '../../data/api/Api-Middleware';
import { API_ENDPOINT_OPEN_POSITION } from '../../data/Endpoints-API';

const PriceDrop = () => {
  const {
    bidPrice,
    askPrice,
    symbolInfo,
   askPriceExchangeRate,
    bidPriceExchangeRate,
    selectedSymbolExchangeRate,
    setNewPositionOpen,
    lotSize,
    setShowPriceAlert,
    priceAlertDetails,
    setPriceAlertDetails,
    selectedSymbolSession
  } = useSymbolContext();
  const { selectedAuthSymbol, user, platFromData } = useAuthContext();
  const { metrics } = useMetricsContext();
  const [buyActive, setBuyActive] = useState(true);
  const [sellActive, setSellActive] = useState(false);
  const [direction, setDirection] = useState('Buy');
  const [isPositionOpening, setIsPositionOpening] = useState(false);

  const handleBuySellOrderClick = (buy) => {
    setBuyActive(buy);
    setSellActive(!buy);
    setDirection(buy ? 'Buy' : 'Sell');
    localStorage.setItem('directions', buy ? 'buy' : 'sell');
    // setEntryPrice(buy ?   parseFloat(askPrice) : parseFloat(bidPrice));
    // setSecondPrice(buy ?  parseFloat(bidPrice) :parseFloat(askPrice))
  };

  const customStyleforicons = {
    width: '100px',
    // padding: '10px',
    height: '20px',
    fontSize: '16px',
    textAlign: 'center',
    // backgroundColor: '#232323',
    color: 'white',
    border: '0.1px solid #484848',
    cursor: 'pointer',
    lineHeight: 'normal',
    borderRadius: '0px',
    borderTop: '0px',
    backgroundColor: '#3b3a3a',
  };
  const handleIncrement = () => {
    setPriceAlertDetails((prevDetails) => ({
      ...prevDetails,
      quantity:
        parseFloat(prevDetails.quantity) >= 1
          ? parseFloat(prevDetails.quantity) + 1
          : 1,
    }));
  };

  const handleQuantityChange = (e) => {
    const newQuantity =
      e.target.value === '' ? '' : Math.max(1, Number(e.target.value));

    setPriceAlertDetails((prevDetails) => ({
      ...prevDetails,
      quantity: newQuantity,
    }));
  };

  const handleDecrement = () => {
    setPriceAlertDetails((prevDetails) => ({
      ...prevDetails,
      quantity:
        parseFloat(prevDetails.quantity) > 1
          ? parseFloat(prevDetails.quantity) - 1
          : 1,
    }));
  };
  const getEntryPrice = () => (buyActive ? askPrice : bidPrice);
    const getEntryPriceExchangeRate = () => (buyActive ? askPriceExchangeRate : bidPriceExchangeRate);
  const getMinimumLeverage = (userLeverage, groupLeverage, symbolLeverage) => {
    const parsedUserLeverage = parseFloat(userLeverage);
    const parsedGroupLeverage = parseFloat(groupLeverage);
    const parsedSymbolLeverage = parseFloat(symbolLeverage);
    if (
      groupLeverage !== undefined &&
      groupLeverage !== null &&
      groupLeverage !== 'null' &&
      !isNaN(parsedGroupLeverage)
    ) {
      return Math.min(parsedUserLeverage, parsedGroupLeverage);
    }

    if (
      symbolLeverage !== undefined &&
      symbolLeverage !== null &&
      symbolLeverage !== 'null' &&
      !isNaN(parsedSymbolLeverage)
    ) {
      return Math.min(parsedUserLeverage, parsedSymbolLeverage);
    }

    return isNaN(parsedUserLeverage) ? 1 : parsedUserLeverage;
  };
  const calculateRequiredMargin = () => {
    let reqMarginWithoutLeverage =
      priceAlertDetails.quantity * getEntryPrice() * selectedSymbolExchangeRate* getEntryPriceExchangeRate();
    if (
      platFromData[6] &&
      platFromData[6].availableLeverage &&
      Array.isArray(platFromData[6].availableLeverage) &&
      platFromData[6].availableLeverage.length > 0 &&
      platFromData[6].availableLeverage[0]?.available_leverage &&
      Array.isArray(platFromData[6].availableLeverage[0].available_leverage) &&
      platFromData[6].availableLeverage[0].available_leverage.length > 0 &&
      Array.isArray(
        platFromData[6].availableLeverage[0].available_leverage[0]
          ?.group_level_leverage,
      ) &&
      platFromData[6].availableLeverage[0].available_leverage[0]
        .group_level_leverage.length > 0
    ) {
      let symbolLeverage =
        platFromData[6]?.availableLeverage[0]?.available_leverage[0].group_level_leverage.sort(
          (a, b) => {
            const aLevel =
              a && a.exposure_level !== null && a.exposure_level !== undefined
                ? parseFloat(a.exposure_level)
                : Infinity;
            const bLevel =
              b && b.exposure_level !== null && b.exposure_level !== undefined
                ? parseFloat(b.exposure_level)
                : Infinity;
            return aLevel - bLevel;
          },
        );

      let groupMinLeverage = symbolLeverage.filter((lev) => {
        const exposureLevel =
          lev && lev.exposure_level !== null && lev.exposure_level !== undefined
            ? parseFloat(lev.exposure_level)
            : NaN;
        return (
          !isNaN(exposureLevel) && exposureLevel >= reqMarginWithoutLeverage
        );
      });

      let groupDefaultLeverage;

      if (
        platFromData[6]?.availableLeverage[0]?.available_leverage[0]
          .group_level_leverage.length > 0 &&
        groupMinLeverage.length == 0
      ) {
        groupDefaultLeverage = symbolLeverage[symbolLeverage.length - 1];
      } else {
        groupDefaultLeverage = groupMinLeverage[0];
      }

      let minimumLeverage = 1;
      if (platFromData[6]?.availableLeverage[0]?.available_leverage[0]) {
        minimumLeverage = getMinimumLeverage(
          platFromData[6]?.availableLeverage[0]?.available_leverage[0]
            .user_default_leverage,
          groupDefaultLeverage.max_leverage,
          [],
        );
      }
      const lvg = minimumLeverage || 1;

      const converted_entry_price =
        getEntryPrice() * selectedSymbolExchangeRate* getEntryPriceExchangeRate();
      const requiredMargin =
        priceAlertDetails.quantity * (converted_entry_price / lvg);

      return isNaN(requiredMargin)
        ? 0
        : requiredMargin < 1
          ? requiredMargin.toFixed(5)
          : Math.round(requiredMargin * 10) / 10;
    } else if (
      platFromData[6] &&
      platFromData[6].availableLeverage &&
      Array.isArray(platFromData[6].availableLeverage) &&
      platFromData[6].availableLeverage.length > 0 &&
      platFromData[6].availableLeverage[0]?.available_leverage &&
      Array.isArray(platFromData[6].availableLeverage[0].available_leverage) &&
      platFromData[6].availableLeverage[0].available_leverage.length > 0 &&
      Array.isArray(
        platFromData[6].availableLeverage[0].available_leverage[0]
          ?.symbol_default_leverage,
      ) &&
      platFromData[6].availableLeverage[0].available_leverage[0]
        .symbol_default_leverage.length > 0
    ) {
      let symbolLeverage =
        platFromData[6]?.availableLeverage[0]?.available_leverage[0].symbol_default_leverage.sort(
          (a, b) => {
            const aLevel =
              a && a.exposure_level !== null && a.exposure_level !== undefined
                ? parseFloat(a.exposure_level)
                : Infinity;
            const bLevel =
              b && b.exposure_level !== null && b.exposure_level !== undefined
                ? parseFloat(b.exposure_level)
                : Infinity;
            return aLevel - bLevel;
          },
        );

      let symbolMinLeverage = symbolLeverage.filter((lev) => {
        const exposureLevel =
          lev && lev.exposure_level !== null && lev.exposure_level !== undefined
            ? parseFloat(lev.exposure_level)
            : NaN;
        return (
          !isNaN(exposureLevel) && exposureLevel >= reqMarginWithoutLeverage
        );
      });

      let symbolDefaultLeverage;

      if (
        platFromData[6]?.availableLeverage[0]?.available_leverage[0]
          .symbol_default_leverage.length > 0 &&
        symbolMinLeverage.length == 0
      ) {
        symbolDefaultLeverage = symbolLeverage[symbolLeverage.length - 1];
      } else {
        symbolDefaultLeverage = symbolMinLeverage[0];
      }

      let minimumLeverage = 1;
      if (platFromData[6]?.availableLeverage[0]?.available_leverage[0]) {
        minimumLeverage = getMinimumLeverage(
          platFromData[6]?.availableLeverage[0]?.available_leverage[0]
            .user_default_leverage,
          [],
          symbolDefaultLeverage.max_leverage,
        );
      }
      const lvg = minimumLeverage || 1;
      const converted_entry_price =
        getEntryPrice() * selectedSymbolExchangeRate* getEntryPriceExchangeRate();
      const requiredMargin =
        priceAlertDetails.quantity * (converted_entry_price / lvg);
      return isNaN(requiredMargin)
        ? 0
        : requiredMargin < 1
          ? requiredMargin.toFixed(5)
          : Math.round(requiredMargin * 10) / 10;
    } else if (
      platFromData[6] &&
      platFromData[6].availableLeverage &&
      Array.isArray(platFromData[6].availableLeverage) &&
      platFromData[6].availableLeverage.length > 0 &&
      platFromData[6].availableLeverage[0]?.available_leverage &&
      Array.isArray(platFromData[6].availableLeverage[0].available_leverage) &&
      platFromData[6].availableLeverage[0].available_leverage.length > 0 &&
      platFromData[6]?.availableLeverage[0]?.available_leverage[0]
        .user_default_leverage
    ) {
      const lvg =
        platFromData[6]?.availableLeverage[0]?.available_leverage[0]
          .user_default_leverage || 1;
      const converted_entry_price =
        getEntryPrice() * selectedSymbolExchangeRate* getEntryPriceExchangeRate();
      const requiredMargin =
        priceAlertDetails.quantity * (converted_entry_price / lvg);

      return isNaN(requiredMargin)
        ? 0
        : requiredMargin < 1
          ? requiredMargin.toFixed(5)
          : Math.round(requiredMargin * 10) / 10;
    }
  };
  function calculateNetMarginInti(allOpenedPositions, requiredMargin) {
    let positions = [
      ...allOpenedPositions.openedPositions,
      { symbol: selectedAuthSymbol, direction, margin: requiredMargin },
    ];

    const positionsBySymbol = positions.reduce((acc, position) => {
      if (!position || !position.symbol || !position.direction) {
        return acc;
      }
  
      const symbol = position.symbol;
      const direction = position.direction;
      const margin = parseFloat(position.margin || 0);

      if (!acc[symbol]) {
        acc[symbol] = { Buy: 0, Sell: 0 };
      }

      if (direction === 'Buy') {
        acc[symbol].Buy += margin;
      } else if (direction === 'Sell') {
        acc[symbol].Sell += margin;
      }
      return acc;
    }, {});

    let totalMargin = 0;

    for (const symbol in positionsBySymbol) {
      const { Buy, Sell } = positionsBySymbol[symbol];
      if (Buy > Sell) {
        totalMargin += Buy - Sell;
      } else {
        totalMargin += Sell - Buy;
      }
    }
    return totalMargin;
  }
  const placeOrder = () => {
    if (user && user.userId != undefined && user.userId > 0) {
      setIsPositionOpening(true);
      placeMarketOrder();
    }
  };
  const placeMarketOrder = () => {
    if ((buyActive || sellActive) && priceAlertDetails.quantity > 0) {
      const requiredMargin = calculateRequiredMargin();

      let useMargin = calculateNetMarginInti(platFromData[3], requiredMargin);
      let freeMargin;
      let openPositionCheck;

      if (platFromData[5].margin_calculation == 'net') {
        freeMargin = platFromData[5].equity - useMargin;

        openPositionCheck = freeMargin > 0;
      } else {
        freeMargin = metrics.freeMargin;
        openPositionCheck = freeMargin >= requiredMargin;
      }
      // Check if the user has enough balance
      if (openPositionCheck) {
        // Continue with opening the position
        openPosition_api(requiredMargin);
      } else {
        // Show an alert for insufficient balance
        toast.error('Insufficient balance to open the position.', {
          position: 'top-right',
        });
        setIsPositionOpening(false);
        document.getElementById('closeSound').play();
        document.querySelector('.deposit-cash')?.setAttribute('view', 'true');
        const ig = document.getElementById(
          'priceAlertDetails.quantity-input-guide',
        );
        ig?.setAttribute('shake', 'true');
        setTimeout(() => {
          ig?.removeAttribute('shake');
        }, 2000);
      }
    } else {
      toast.error('Quantity should be greater than 0.', {
        position: 'top-right',
      });
      document.getElementById('closeSound').play();
      setIsPositionOpening(false);
    }
  };

  const openPosition_api = async (requiredMargin) => {
        if(requiredMargin < 10){
          toast.error(`Margin Should be greater than 10 ${metrics?.userCurrencyName || 'EUR'}.`, {
            position: "top-right",
          });
          setIsPositionOpening(false);
          document.getElementById("closeSound").play();
          return;
        }
    try {
      const data = {
        id: -1,
        position_id: 'PID' + Math.floor(100000 + Math.random() * 900000),
        symbol: selectedAuthSymbol,
        quantity: priceAlertDetails.quantity,
        amount: 0,
        asset_type: 'base_asset',
        direction: direction,
        entry_price: getEntryPrice(),
        TP: 0,
        SL: 0,
        netEUR: 0,
        status: '',
        userId: user.userId,
        exit_price: 0,
        totalUnrealizedPnL: metrics.totalUnrealizedPnL,
        position_closed_at: null,
        comment: '',
        stop_loss_pips: 0,
        take_profit_pips: 0,
        lot_step: 0,
        trade_type: symbolInfo.trade_type,
        lot_size: lotSize,
      };
      const response = await APIMiddleware.post(
        API_ENDPOINT_OPEN_POSITION(),
        data,
      );
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

      toast.success('Position opened successfully!', { position: 'top-right' });
      setIsPositionOpening(false);
      localStorage.accountManager = 'open-positions-acc';
      document.getElementById('openSound').play();
      setNewPositionOpen(Math.floor(Math.random() * 100));
    } catch (error) {
      console.error(`API request error: ${API_ENDPOINT_OPEN_POSITION()}`, error);
      setIsPositionOpening(false);
    } finally {
      hideModal();
      setIsPositionOpening(false);
    }
  };
  const hideModal = () => {
    setShowPriceAlert(false);
  };
  console.log(priceAlertDetails.readOnly)
  return (
    <div className="confirm-boxs" role="true">
      <div className="card width">
        <h2>{priceAlertDetails?.title || ''}</h2>
        <div
          className='price-div'
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 40px',
          }}
        >
          <div className='price-first-div'>
          <div className="color-gray symbol-no-wrap">{priceAlertDetails?.symbol || ''}</div>
          <div className="amount-div width200">
              <input
                type="number"
                className="amount-input"
                disabled={priceAlertDetails.readOnly}
                value={priceAlertDetails.quantity}
                onChange={handleQuantityChange}
                placeholder="Quantity"
                style={{
                  width: '100%',
                  padding: '5px',
                  height: '30px',
                  textAlign: 'center',
                  borderRadius: '0px',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', width : '100%' }} >
                <button
                  // style={{width : '100px !important'}}
                  disabled={priceAlertDetails.readOnly}
                  style={customStyleforicons}
                  onClick={() => handleDecrement('priceAlertDetails.quantity')}
                >
                  -
                </button>
                <button
                  // style={{width : '100px !important'}}
                  disabled={priceAlertDetails.readOnly}
                  style={customStyleforicons}
                  onClick={() => handleIncrement('priceAlertDetails.quantity')}
                >
                  +
                </button>
              </div>
            </div>
          </div>


          <div className="price-box-container">
            <div
              className={`price-box price-box-buy ${
                buyActive ? 'price-box-buy-active' : ''
              }`}
              id="buyMarketOrder"
              onClick={() => handleBuySellOrderClick(true)}
            >
              <div className='buy-small-font' style={{ fontSize: '14px', fontWeight: 'bolder' }}>Buy</div>
              <div id="buyMarketPrice" style={{ fontSize: '12px' }}>
                { askPrice }
              </div>
            </div>
            <div
              className={`price-box price-box-sell ${
                sellActive ? 'price-box-sell-active' : ''
              }`}
              id="sellMarketOrder"
              onClick={() => handleBuySellOrderClick(false)}
            >
              <div className='sell-small-font' style={{ fontSize: '14px', fontWeight: 'bolder', paddingRight: '5px' }}>Sell</div>
              <div id="sellMarketPrice" style={{ fontSize: '12px' }}>
                { bidPrice }
              </div>
            </div>
          </div>
          <div>
          </div>
        </div>
        <hr />
        <div className="px-40 py-10 color-gray description-full-width">
          {priceAlertDetails?.description || ''}
        </div>
        <div className="row-scss">
          <button
            id='trade-button'
            onClick={placeOrder}
            disabled={isPositionOpening || platFromData[5]?.accessRight == 3 || localStorage.getItem('accountType') == "0" || platFromData[5]?.accessRight == 2 || !bidPrice || !askPrice || selectedSymbolSession === 0}
            style={{
              position: 'relative',
              overflow: 'hidden',
              isolation: 'isolate',
              backgroundColor: buyActive ? 'rgb(33, 196, 109)' : 'rgb(225, 50, 50)',
              borderRight: '1px solid #232323 ',
              color: 'black',
            }}
          >
            <Ripple />
            {isPositionOpening ? 'Loading' :(buyActive ? 'Buy Now' : 'Sell Now')}
          </button>
          <div className="blank"></div>
          <button id='cancel-button' onClick={hideModal}>
            <Ripple />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriceDrop;

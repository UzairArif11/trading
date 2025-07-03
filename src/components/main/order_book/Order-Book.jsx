import React, { useRef, useEffect, useState } from 'react';
import Spinner from '../../utils/spinner/Spinner'
import { WS_ENDPOINT_DEPTH_LIVE_FEEDS } from '../../../data/Endpoints-WS';
import { ws_create } from '../../../data/websocket/Websocket-Middleware';
import { useSymbolContext } from '../../../contexts/Symbol-Context';
import { useAuthContext } from '../../../contexts/Auth-Context';
import { useChartContext } from '../../../contexts/Chart-Context';
import './Order-Book.scss';

const levelsOfDepth = 10;
const speedOfDepth = '1000ms';
const changePriceValue = 0; // Replace with your actual value

let totalBidQuantity = 0; // Initialize with 0
let totalAskQuantity = 0; // Initialize with 0

const OrderBook = () => {
    //CONTEXT

    const { user, platFromData,selectedAuthSymbol } = useAuthContext();
    const { selectedTimeFrame } = useChartContext();

    const [loading, setLoading] = useState(true);
    const [bids, setBids] = useState([]);
    const [asks, setAsks] = useState([]);

    //create web-socket instance for the component
    const ws_orderBook = ws_create();
    const WS_MESSAGE_EVENT_LISTENER = "ws_message_depth";

    useEffect(() => {

        //open web socket connection to the provided end point
        //ws_orderBook.ws_connect(WS_ENDPOINT_DEPTH_LIVE_FEEDS(user?.userId, selectedAuthSymbol, levelsOfDepth, speedOfDepth), WS_MESSAGE_EVENT_LISTENER);

        //handle data got from web-socket message and apply to the component
        // const handleLiveFeedData = (event) => {
        //     updateLiveFeedData(event.detail);
        // };

        // //listen event emit(dispatched) from on-message event of web-socket-middleware
        // document.addEventListener(WS_MESSAGE_EVENT_LISTENER, handleLiveFeedData);

        const updateLiveFeedData = () => {
            if (platFromData.length > 0 && platFromData[2] && platFromData[2] != undefined && platFromData[2] != 'undefined' && platFromData[2].bids && platFromData[2].asks) {
                // Calculate the total bid and ask quantities
                totalBidQuantity = platFromData[2].bids.reduce((total, bid) => total + parseFloat(bid[1]), 0);
                totalAskQuantity = platFromData[2].asks.reduce((total, ask) => total + parseFloat(ask[1]), 0);

                setBids(platFromData[2].bids);
                setAsks(platFromData[2].asks);

                //when data loaded then set flag to false 
                if (loading) setLoading(false);
            }
        };

        updateLiveFeedData();

        return async () => {
            // clean up websocket connection when the component unmounts
            //ws_orderBook.ws_disconnect(WS_ENDPOINT_DEPTH_LIVE_FEEDS(user?.userId, selectedAuthSymbol, levelsOfDepth, speedOfDepth));
            //ws_close_all();
            // document.removeEventListener(WS_MESSAGE_EVENT_LISTENER, handleLiveFeedData);
        };
    }, [selectedAuthSymbol, user, selectedTimeFrame, platFromData[2]]);

    //show spinner while loading data
    if (loading) {
        return <Spinner />
    }

    return (
        <>
        <div className='t-head'>
            <span className="order-book-table-header-price">Price ({selectedAuthSymbol})</span>
            <span className="order-book-table-header-quantity">Quantity</span>
        </div>
        <div className="order-book-container" data-simplebar>
            <div className="order-book-side" id="asks">
                <div className="order-book-table">
                    <div>
                        {asks.slice().reverse().map((ask, index) => (
                            <OrderRow
                                key={index}
                                price={ask[0]}
                                quantity={ask[1]}
                                type="ask"
                                totalQuantity={totalAskQuantity}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div className="order-book-side" id="bids">
                <div className="order-book-table">
                    <div>
                        {bids.map((bid, index) => (
                            <OrderRow
                                key={index}
                                price={bid[0]}
                                quantity={bid[1]}
                                type="bid"
                                totalQuantity={totalBidQuantity}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

const OrderRow = ({ price, quantity, type, totalQuantity }) => {
    const quantityPercentage = (quantity / totalQuantity) * 100;

    const priceCellClass = type === 'bid' ? "order-book-table-cell-bid-price" : "order-book-table-cell-ask-price";
    const quantityCellClass = type === 'bid' ? "order-book-table-cell-bid-quantity" : "order-book-table-cell-ask-quantity";

    // Create a ref for the row element
    const rowRef = useRef(null);

    useEffect(() => {
        if (rowRef.current) {
            // Call applyGradientBackground with appropriate colors and percentages
            if (type == 'bid') {
                applyGradientBackground(rowRef.current, '#046152', quantityPercentage, 'transparent', quantityPercentage);
            }
            else {
                applyGradientBackground(rowRef.current, '#9a222c', quantityPercentage, 'transparent', quantityPercentage);
            }
        }
    }, [rowRef, quantityPercentage]);

    return (
        <div className="gradient-row">
            <div className="grad-box" ref={rowRef}></div>
            <div className="z-top">
            <div className={priceCellClass}>{parseFloat(price) + changePriceValue}</div>
            <div className={quantityCellClass}>{quantity}</div>
            </div>
        </div>
    );
};

const applyGradientBackground = (element, color1, color1Percentage, color2, color2Percentage) => {
    const gradient = `${color1},${color2}`;
    element.setAttribute('status',gradient);
    element.style.width = `${color1Percentage}%`;
};

export default OrderBook;

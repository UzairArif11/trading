import React, { useEffect, useState, useRef, useCallback } from 'react'
import Spinner from '../../utils/spinner/Spinner'
import { FaSearch, FaTimes } from 'react-icons/fa';
import { WS_ENDPOINT_PLATFORM_LIVE_FEEDS, WS_ENDPOINT_SYMBOLS_LIVE_FEEDS } from "../../../data/Endpoints-WS";
import { ws_create } from "../../../data/websocket/Websocket-Middleware";
import { useSymbolContext } from "../../../contexts/Symbol-Context";
import { useAuthContext } from '../../../contexts/Auth-Context';
import { useChartContext } from '../../../contexts/Chart-Context';
import { API_ENDPOINT_SYMBOLS } from '../../../data/Endpoints-API';
import { API_ENDPOINT_USER_WATCHLIST } from '../../../data/Endpoints-API';
import { API_ENDPOINT_INSERT_WATCHLIST } from '../../../data/Endpoints-API';
import { API_ENDPOINT_DELETE_WATCHLIST } from '../../../data/Endpoints-API';
import './Symbol.scss'
import APIMiddleware from '../../../data/api/Api-Middleware';
import { formatDigitBasePrice, formatPriceUptoDecimals } from '../../../utils/format';
import Select from 'react-select';
import { Ripple } from 'react-ripple-click';
import 'react-ripple-click/dist/index.css';
import StarSvg from './StarSvg';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const Symbol = () => {


    //Tabs  
    const [activeMode, setActiveMode] = useState('symbols');
    const [symbolCategory,setSymbolCategory] = useState(() => {
        const symbolCategoryLocal = localStorage.getItem(`symbolCategory`);
        return symbolCategoryLocal ? symbolCategoryLocal: "Forex";
      });
    const [symbolCategoryId,setSymbolCategoryId] = useState(() => {
        const symbolCategoryIdLocal = localStorage.getItem(`symbolCategoryID`);
        return symbolCategoryIdLocal ? symbolCategoryIdLocal: "1";
      });


      
      
    //start click
    const [watchlistSymbols, setWatchlistSymbols] = useState({});

      
    const handleTdClick = (symbol) => {
        // Toggle the clicked status for the specific symbol
        setWatchlistSymbols((prevClickedSymbols) => ({
            ...prevClickedSymbols,
            [symbol]: !prevClickedSymbols[symbol],
        }));

        // Check the clicked status to determine whether to insert or delete watchlist data
        if (!watchlistSymbols[symbol]) {
            // If the symbol is not selected (clicked), insert it into the watchlist
            insertWatchlist(symbol);
        } else {
            // If the symbol is already selected (clicked), delete it from the watchlist
            deleteWatchlist(symbol);
        }
    };
 
    const starBoolean = (e) => {
        if (e.target.tagName == 'path') {
            if (e.target.parentNode.getAttribute('bool') == 'false') {
                e.target.parentNode.setAttribute('bool', true);
            } else {
                e.target.parentNode.setAttribute('bool', false);
            }
        } else {
            if (e.target.children[0].getAttribute('bool') == 'false') {
                e.target.children[0].setAttribute('bool', true);
            } else {
                e.target.children[0].setAttribute('bool', false);
            }
        }
    }

        //CONTEXT
    const { loadingSymbolContext, symbolData, symbolNames,  updateSymbolData, loadAllSymbolsData, updateSymbolDetailsData, symbolDetails, symbolWithCategories, symbolCategories, setSelectedCategoryId, allSymbolOptions,selectedSymbolSession, setSelectedSymbolSession } = useSymbolContext();
    const { user, platFromData, sendDataToServer, selectedAuthSymbol, setAuthSelectedSymbol,setAuthSelectedCategory,authSelectedCategory,selectedAuthSymbolId,setSelectedAuthSymbolId ,isWebSocketRefetch} = useAuthContext();
    const { selectedTimeFrame, selectedStyle } = useChartContext();
    
    //everything must be initialize before further processing, so block everything base on this flag state
    const [isInitialized, setIsInitialized] = useState(false);
    const [isSymbolSelecting, setIsSymbolSelecting] = useState(false);


    const [isSymbolSelectingWatchlist, setIsSymbolSelectingWatchlist] = useState(false);


    const [searchInput, setSearchInput] = useState('');
// Replace the localStorage-based initialization with simple state
const [paginationStart, setPaginationStart] = useState(0);
const [paginationLimit] = useState(100); // Fixed limit of 100 items per page
      const [totalSymbols, setIsTotalSymbols] =  useState();

   const debounceRef = useRef(null);


    const listRef = useRef(null);
    const isFetchingRef = useRef(false);
  

    useEffect(() => {
      if (listRef.current) listRef.current.scrollTop = 0;
      
           if (activeMode !== 'watchlists'){
                sendDataToServer({
            type: 'SymbolsPagination',
            paginationStart: 0,
            paginationEnd: 100,
            category: symbolCategoryId,
        });
           }
      
    }, [symbolCategoryId,isWebSocketRefetch]);

 

const changeSymbolCategory = (e, o) => {
    if (o === false) {
        setSymbolCategory(e);
        let categories = symbolCategories.find((category) => category.name == e);
        setSymbolCategoryId(categories.id);
        
        
        setIsTotalSymbols(symbolWithCategories.filter((symbol) => 
            symbol.symbol_category == categories.id
        ).length);
        
        // Reset pagination when changing category
        setPaginationStart(0);
        
        // sendDataToServer({
        //     type: 'SymbolsPagination',
        //     paginationStart: 0,
        //     paginationEnd: paginationLimit,
        //     category: categories.id,
        // });
    } else {
        setSymbolCategory(null);
    }
};

const handleSearchChange = useCallback((e) => {
    const value = e;
    setSearchInput(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
        if (value.length > 0) {
            sendDataToServer({
                type: 'SearchSymbols',
                searchInput: value,
            });
        } else {
            setSymbolCategory(null);
            // const CategoryId = parseInt(localStorage.getItem('symbolCategoryID')) || 1
   
            // // Reset pagination when clearing search
            // setPaginationStart(0);
            // sendDataToServer({
            //     type: 'SymbolsPagination',
            //     paginationStart: 0,
            //     paginationEnd: paginationLimit,
            //     category: CategoryId,
            // });
        }
    }, 500);
}, [symbolCategoryId, paginationLimit]);
    // //list data showing all symbols
    // const [symbolData, setSymbolData] = useState({});

    //create web-socket instance for the component
    const ws_symbol = ws_create();
    // const WS_MESSAGE_EVENT_LISTENER = "ws_message_symbols";
    const WS_MESSAGE_EVENT_LISTENER = "ws_message_platform";

    const [watchlistData, setWatchlistData] = useState([]);
    let isSymbolDetailsUpdated = false;

    // console.log("allSymbolOptions: ", allSymbolOptions)  
    useEffect(() => {
        if (selectedAuthSymbol != '') {
            localStorage.setItem('prevSymbol', localStorage.symbol);
            localStorage.setItem('symbol', selectedAuthSymbol);
            localStorage.setItem('category',authSelectedCategory);
        }
    }, [selectedAuthSymbol])

    useEffect(() => {
      if(selectedAuthSymbolId != ''){
            localStorage.setItem('symbol_id', selectedAuthSymbolId);
        }
    }, [selectedAuthSymbolId])
    useEffect(() => {
        if (user && user.userId != undefined && user.userId > 0) {
            //nothing will load in this component until SymbolContext fully loaded 
            if (!loadingSymbolContext) {
                //everything must be initialize before further processing, so block everything base on this flag state
                if (!isInitialized) {
                    const getSymbols = () => {
                        try {
                            const initialSymbolData = {};
                            // const initialSymbolCategoryData = {};

                            //setting initial values to all symbols
                            // symbolNames.forEach((symbol) => {

                            //     initialSymbolData[symbol] = { ask: null, bid: null, spread: null, ask_class: 'Symbol-price-same', bid_class: 'Symbol-price-same' };
                            // });
                            // let categories=symbolCategories.find((category)=> category.name==symbolCategory)
                            const savedStart = parseInt(localStorage.getItem(`paginationStart_${symbolCategory}`)) || 0;
                            const savedLimit = parseInt(localStorage.getItem(`paginationLimit_${symbolCategory}`)) || 10;
                            setIsTotalSymbols( symbolWithCategories.filter((symbol)=>symbol.symbol_category==symbolCategoryId).length);
                            
                            symbolWithCategories.forEach((symbol) => {
                                
                                initialSymbolData[symbol.name] = {id:symbol.id, ask: symbol.initial_ask_price, bid: symbol.initial_bid_price, spread: null, ask_class: 'Symbol-price-same', bid_class: 'Symbol-price-same', symbol_category: symbol.symbol_category, is_session_active: symbol.is_session_active, };
                                });
                       // Filter out rows where the specified column is Disable
                            // const filteredData = result.filter(row => row.Status !== Disable);
                            // setData(filteredData);
    
                            //set symbol initial list data
                            loadAllSymbolsData(initialSymbolData);
    
                            if (localStorage.symbol == null) {
                                updateSymbolDetailsData(symbolNames[0]);
                            } else {
                                updateSymbolDetailsData(localStorage.symbol);
                            }
    
                            //everything must be initialize before further processing, so block everything base on this flag state
                            setIsInitialized(true);

                            getWatchlistdata();

                        } catch (error) {
                            // Handle API request error
                            console.error(`API request error: ${API_ENDPOINT_SYMBOLS}`, error);
                        }
                    }
    
                    //load symbols in list
                    getSymbols();
                }

                //once everything initialized then further process base on this flag state
                if (isInitialized && platFromData.length > 0  && !platFromData[3]?.keepPrevData && platFromData[0] != undefined && platFromData[0] != 'undefined'&& Object.keys(platFromData[0]).length > 0) {
                    //update list with updated live feed
                    const updateLiveFeedData = () => {

                        // Calculate spread and update only relevant parts
                    
                        const updatedSymbolData = platFromData[0];
                     
                        let selectedSymbol=platFromData[8]?.symbol;

                        if(selectedSymbol?.name==selectedAuthSymbol){
                           
                                        updateSymbolData(selectedSymbol?.name,selectedSymbol.ea,selectedSymbol.eb,selectedSymbol?.bid, selectedSymbol?.ask, selectedSymbol?.is_session_active);
                            
                                            }
                             
                   
                        // platFromData[0].forEach((item) => {
                        //     const { s, a, b } = item;

                        //     // Calculate spread
                        //     // const spread = a - b;

                        //     // Determine the color based on the comparison
                        //     // let ask_class = 'Symbol-price-same';
                        //     // let bid_class = 'Symbol-price-same';                    

                        //     // format price and limit digits
                        //     // const ak = formatPrice(a);
                        //     // const bd = formatPrice(b);

                        //     // Update relevant data
                        //     if (updatedSymbolData[s]) {
                        //         const prevAsk = updatedSymbolData[s].ask;
                        //         const prevBid = updatedSymbolData[s].bid;

                        //         if (a < prevAsk) {
                        //             ask_class = 'Symbol-price-down';
                        //         } else if (a > prevAsk) {
                        //             ask_class = 'Symbol-price-up';
                        //         }

                        //         if (b < prevBid) {
                        //             bid_class = 'Symbol-price-down';
                        //         } else if (b > prevBid) {
                        //             bid_class = 'Symbol-price-up';
                        //         }

                        //         // updatedSymbolData[s].ask = a;
                        //         // updatedSymbolData[s].bid = b;
                        //         // // updatedSymbolData[s].spread = spread.toFixed(2);
                        //         // updatedSymbolData[s].ask_class = ask_class;
                        //         // updatedSymbolData[s].bid_class = bid_class;

                        //         updatedSymbolData[s].ask = a || updatedSymbolData[s].ask;
                        //         updatedSymbolData[s].bid = b || updatedSymbolData[s].bid;
                        //         // updatedSymbolData[s].spread = spread.toFixed(2);
                        //         updatedSymbolData[s].ask_class = ask_class || updatedSymbolData[s].ask_class;
                        //         updatedSymbolData[s].bid_class = bid_class || updatedSymbolData[s].bid_class;
                        //         // updatedSymbolData[s].symbol_category = updatedSymbolData[s].symbol_category;

                        //         //update selected symbol data context                    
                        //         if (selectedAuthSymbol) {
                        //             if (selectedAuthSymbol === s) {
                        //                 updateSymbolData(s, b, a, updatedSymbolData[s].symbol_category);
                        //             }
                        //         }
                        //         else {
                        //             updateSymbolData(symbolNames[0], b, a, 1);
                        //         }
                        //     }

                        // });


                        loadAllSymbolsData(updatedSymbolData);
                    };

                    //Calling this function to show symbols data
                    updateLiveFeedData();

                    return async () => {
                        // clean up websocket connection when the component unmounts
                        //ws_symbol.ws_disconnect(WS_ENDPOINT_SYMBOLS_LIVE_FEEDS(user?.userId));
                        //ws_close_all();
                        // document.removeEventListener(WS_MESSAGE_EVENT_LISTENER, handleLiveFeedData);
                    };
                }
            }
        }

    }, [loadingSymbolContext, isInitialized, selectedAuthSymbol, user, selectedTimeFrame,symbolCategory, platFromData[0]]);

    useEffect(() => {
        if (symbolCategories?.length) {
        changeSymbolCategory(symbolCategories[0].name, false);
        }
    }, [symbolCategories?.length]);

    const getWatchlistdata = async () => {
        try {
            // Use the API_ENDPOINT_USER_WATCHLIST in the fetch request
            const response = await APIMiddleware.get(API_ENDPOINT_USER_WATCHLIST(user.userId));

            if (response.data) {
                const symbols = response.data;
                setWatchlistSymbols(() => {
                    // Use reduce to iterate over the symbols array and create an object with true values
                    const updatedSymbols = symbols.reduce((acc, symbol) => {
                        acc[symbol.name] = true;
                        return acc;
                    }, {});

                    return updatedSymbols;
                });

            }
        } catch (error) {
            console.error('Error fetching watchlist data:', error);
        }
    };

    const insertWatchlist = async (symbol) => {
        try {
            // Call the API endpoint that triggers the stored procedure
            await APIMiddleware.post(API_ENDPOINT_INSERT_WATCHLIST(user.userId, symbol));
        } catch (error) {
            console.error('Error inserting watchlist item:', error);
        }
    };

    const deleteWatchlist = async (symbol) => {
        try {
            // Call the API endpoint that triggers the stored procedure for deletion
            await APIMiddleware.post(API_ENDPOINT_DELETE_WATCHLIST(user.userId, symbol));
            console.log('Watchlist item deleted successfully.');
        } catch (error) {
            console.error('Error deleting watchlist item:', error);
        }
    };

    // Filter symbols based on the search input
    const filteredSymbols = Object.keys(symbolData).filter((symbol) =>
        symbol.toLowerCase().includes(searchInput.toLowerCase())
    );

    //handle symbols list row clicks
    const handleRowClick = (symbolName,symbolData) => {
        setIsSymbolSelecting(true);
        setIsSymbolSelectingWatchlist(true);
            // Update symbol context data when a row is clicked      
            updateSymbolData(symbolName, symbolData[symbolName].bid, symbolData[symbolName].ask, symbolData[symbolName].is_session_active);
            setSelectedCategoryId(symbolData[symbolName].symbol_category);
            // setSelectedSymbolSession(symbolData[symbolName].is_session_active);
            // updateSymbolDetailsData(symbolName);
    setAuthSelectedCategory(symbolData[symbolName].symbol_category);
            setAuthSelectedSymbol(symbolName);
           
            setSelectedAuthSymbolId(symbolData[symbolName]?.id);
            // if (window.innerWidth <= 960) {
            //     document.body.setAttribute('mobilecurrentview', 'chart');
            // }
        setTimeout(() => {
            setIsSymbolSelecting(false);
            setIsSymbolSelectingWatchlist(false);
        }, 4000);
    };

    //show spinner while loading data
    // if (loadingSymbolContext) {
    //     return <Spinner />
    // }
    // Determine classes based on activeMode
    const SymbolPanelClass = activeMode === 'symbols' ? 'visible' : 'hidden';
    const WatchListClass = activeMode === 'watchlists' ? 'visible' : 'hidden';

 
    const handleModeClick = (mode) => {
        setActiveMode(mode);
        setSymbolCategory(null);
         setSearchInput("");
        if (mode === 'watchlists') {
            const watchlistSymbolsArray = Object.keys(watchlistSymbols).filter(symbol => watchlistSymbols[symbol]);
            sendDataToServer({
                type: 'watchlist',
                watchlistSymbols: watchlistSymbolsArray,
            });
        } else {
            // Reset pagination when switching to symbols mode
            // setPaginationStart(0);
            // sendDataToServer({
            //     type: 'SymbolsPagination',
            //     paginationStart: 0,
            //     paginationEnd: paginationLimit,
            //     category: symbolCategoryId,
            // });
        }
    };
    // function checkRange(first, second) {
    //     const inRange = n => n >= paginationStart && n <= paginationStart + paginationLimit;
      
    //     const isFirstInRange = inRange(first);
    //     const isSecondInRange = inRange(second);
      
    //     if (!isFirstInRange && !isSecondInRange) return 'reset';
    //     if (!isFirstInRange) return 'up';
    //     if (!isSecondInRange) return 'down';
    //     return 'skip'; // both are in range, so skip return
    //   }
      
    // const fetchMoreSymbols = useCallback((first, second) => {
    //     if (isFetchingRef.current) return;
        
    //     isFetchingRef.current = true;
    //     let direction = checkRange(first, second);
    //     console.log(direction,'direction ================')
    //     if (direction === 'down') {
    //         const nextStart = paginationStart + paginationLimit;
    //         if (nextStart < totalSymbols) {
    //             setPaginationStart(nextStart);
    //             sendDataToServer({
    //                 type: 'SymbolsPagination',
    //                 paginationStart: nextStart,
    //                 paginationEnd: nextStart + paginationLimit,
    //                 category: symbolCategoryId,
    //             });
    //         }
    //     } else if (direction === 'up') {
    //         const prevStart = Math.max(0, paginationStart - paginationLimit);
    //         setPaginationStart(prevStart);
    //         sendDataToServer({
    //             type: 'SymbolsPagination',
    //             paginationStart: prevStart,
    //             paginationEnd: prevStart + paginationLimit,
    //             category: symbolCategoryId,
    //         });
    //     }
    //      else if (direction === 'reset') {
        
    //         setPaginationStart(first);
    //         sendDataToServer({
    //             type: 'SymbolsPagination',
    //             paginationStart: first,
    //             paginationEnd: first + paginationLimit,
    //             category: symbolCategoryId,
    //         });
    //     }
        
    //     setTimeout(() => {
    //         isFetchingRef.current = false;
    //     }, 500);
    // }, [paginationStart, totalSymbols, symbolCategoryId, paginationLimit]);


    return (
        <div className='global-platfrom mobile-styled' style={{ height: 'calc(100% - 70px)' }}>

            {/* Tab section */}

            <div className="symbol-mode-tabs global-platfrom ">
                <button
                    className={`mode-tab-button ${activeMode === 'symbols' ? 'mode-tab-active' : ''}`}
                    onClick={() => {
                        handleModeClick('symbols');
                        // mkRipple();
                    }}
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        isolation: 'isolate',
                    }}
                >
                    <Ripple />
                    All Symbols
                </button>
                <button
                    className={`mode-tab-button ${activeMode === 'watchlists' ? 'mode-tab-active' : ''}`}
                    onClick={() => {
                        handleModeClick('watchlists');
                        
                        // mkRipple();
                    }}
                    disabled={!isWebSocketRefetch}
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        isolation: 'isolate',
                      }}
                >
                    <Ripple />
                    WatchLists
                </button>
            </div>

            <div className={`Symbol ${SymbolPanelClass} symbol-panel-parent`}>
                <div className="Symbol global-platfrom symbol-panel-height" >
                    {/* Search input */}
                    <div className="search-container">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search symbol..."
                            disabled={!isWebSocketRefetch}
                            value={searchInput}
                            onChange={(e) =>handleSearchChange(e.target.value)}
                            className='className=input-symbol-field'
                        />
                        {searchInput && (
                            <FaTimes
                                className="clear-icon-symbol"
                                disabled={!isWebSocketRefetch}
                                onClick={() => handleSearchChange('')}
                            />
                        )}
                    </div>
                    <div className=''>
                        <table className="Symbol-table-head">
                            <thead className="Symbol-table-thead">
                                    <th className='star-th'></th>
                                    <th className='session-th'></th>
                                    <th className='symbol-th'>Symbol</th>
                                    <th className='bid-th'>Bid</th>
                                    <th className='ask-th'>Ask</th>
                            </thead>
                        </table>
                    </div>
                    
     <div className="Symbol-list" ref={listRef}>

                        {symbolCategories?.map((category) => (
                            searchInput.length === 0 ?
                           <wrapper key={category.id}>
                                <heading onClick={()=>{changeSymbolCategory(category.name,symbolCategory === category.name ? true : false)}} >
                                <div className='indicator' >
                                <svg viewBox="0 0 14 8" style={{
                                                    transform: symbolCategory == category.name ? 'rotate(90deg)' : 'none',
                                                              }} >
                                <path d="M1 1L7 7L13 1" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                </div>  
                                {category.name}</heading>
                                
                                {symbolCategory === category.name ? (
    <div
    className="Symbol-list-virtual"
     style={{ 
        height: 'calc(100vh - 250px)'
    }}>
        <AutoSizer>
            {({ height, width }) => (
            <List
            key={`${symbolCategoryId}-${paginationStart}`}
            height={height}
            width={width}
            itemCount={Object.entries(symbolData).filter(([symbol, data]) => 
                data.symbol_category === category.id && 
                filteredSymbols.includes(symbol)
            ).length}
            itemSize={40}
            onItemsRendered={({ visibleStartIndex, visibleStopIndex }) => {
                // console.log('Scroll Event:', {
                //     visibleStartIndex,
                //     visibleStopIndex,
                //     totalSymbols,
                //     paginationStart,
                //     paginationLimit
                // });
                // fetchMoreSymbols(visibleStartIndex, visibleStopIndex);
                sendDataToServer({
                    type: 'SymbolsPagination',
                    paginationStart: visibleStartIndex,
                    paginationEnd: visibleStopIndex+5,
                    category: symbolCategoryId,
                });
           
            }}
        >
            {({ index, style }) => {
                const filteredEntries = Object.entries(symbolData).filter(([symbol, data]) => 
                    data.symbol_category === category.id && 
                    filteredSymbols.includes(symbol)
                );
                const [symbol, data] = filteredEntries[index];
                const isSelected = selectedAuthSymbol === symbol;

                if (!data) return null;

                return (
                    <div
                        className={`Symbol-tr ${isSelected ? 'selected-row' : ''} ${isSymbolSelecting ? 'row-disabled' : ''}`}
                        style={{
                            ...style,
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%'
                        }}
                    >
                        <StarSvg 
                            handleTdClick={handleTdClick} 
                            symbol={symbol} 
                            watchlistSymbols={watchlistSymbols[symbol] || false}
                        >
                            Add to Watchlist
                        </StarSvg>


                        {/* <div className='pt-2 size'>
                                                                    {
                                                                        data.bid_class === 'Symbol-price-same' ?
                                                                            <svg width="356px" height="356px" viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#afafaf" stroke-width="2.4"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 9.5C13.3807 9.5 14.5 10.6193 14.5 12C14.5 13.3807 13.3807 14.5 12 14.5C10.6193 14.5 9.5 13.3807 9.5 12C9.5 10.6193 10.6193 9.5 12 9.5Z" fill="#afafaf"></path> </g></svg> :
                                                                            (data.bid_class === 'Symbol-price-up' ?
                                                                                <div className='size2'>
                                                                                    <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(180)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M7.49992 10.2072L11.707 6.00006L3.29282 6.00006L7.49992 10.2072Z" fill="#21c46d"></path> </g></svg>
                                                                                </div> :
                                                                                <div className='size2'>
                                                                                    <svg width="256px" height="256px" viewBox="0 0 16.00 16.00" fill="#e13232" stroke="#e13232" strokeWidth="0.00016">
                                                                                        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                                                                                        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                                                                                        <g id="SVGRepo_iconCarrier">
                                                                                            <rect width="16" height="16" id="icon-bound" fill="none"></rect>
                                                                                            <polygon points="8,11 3,6 13,6"></polygon>
                                                                                        </g>
                                                                                    </svg>
                                                                                </div>

                                                                            )

                                                                    }

                                                                </div> */}

                        <div className={`specific-td session-td`}>
                            {data.is_session_active === 0 ? (
                                <div className='pause-mark'>||</div>
                            ) : (
                                <div className='check-mark'>
                                    <svg
                                        id='checkmarkId'
                                        width={16}
                                        height={16}
                                        viewBox="0 0 24 24"
                                        fill={selectedStyle.buyColor}
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M9 19.4l-7-7L3.4 10 9 15.6 20.6 4 22 5.4z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div
                            className="Symbol-td symbol-td"
                            onClick={() => handleRowClick(symbol, symbolData)}
                            style={{
                                position: 'relative',
                                overflow: 'hidden',
                                isolation: 'isolate',
                            }}
                        >
                            <Ripple />
                            {symbol}
                        </div>
                        <div
                            className={`Symbol-td ${data.bid_class} bid-td`}
                            onClick={() => handleRowClick(symbol, symbolData)}
                            style={{
                                color:
                                data.bid_class === 'Symbol-price-up'
                                    ? selectedStyle.buyColor
                                    : data.bid_class === 'Symbol-price-down'
                                    ? selectedStyle.sellColor
                                    : 'white',
                                position: 'relative',
                                overflow: 'hidden',
                                isolation: 'isolate',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                   
                            }}
                        >
                            <Ripple />
                            {data.bid
                                ? data.bid
                           
                                : '-'}
                        </div>
                        <div
                            className={`Symbol-td ${data.ask_class} ask-td`}
                            onClick={() => handleRowClick(symbol, symbolData)}
                            data-full-text={data.ask ?? '-'}
                            style={{
                                color:
                                data.bid_class === 'Symbol-price-up'
                                    ? selectedStyle.buyColor
                                    : data.bid_class === 'Symbol-price-down'
                                    ? selectedStyle.sellColor
                                    : 'white',
                                position: 'relative',
                                overflow: 'hidden',
                                isolation: 'isolate',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                      
                            }}
                        >
                            <Ripple />
                            {data.ask
                                ? data.ask
                                // ? formatPriceUptoDecimals(data.ask, symbolDetails[symbol]?.digit)
                                //     .split('.')
                                    // .map((part, index) =>
                                    //     index === 0 ? (
                                    //         <span key={index}>{part}</span>
                                    //     ) : (
                                    //         <span key={index} className='afterDecimal'>.{part}</span>
                                    //     )
                                    // )
                                : '-'}
                        </div>
                    </div>
                );
            }}
        </List>
            )}
        </AutoSizer>
    </div>
) : null}
                            </wrapper> : 
                           <wrapper>
                                <heading onClick={()=>{changeSymbolCategory(category.name,symbolCategory === category.name ? true : false)}} >
                                <div className='indicator' >
                                <svg viewBox="0 0 14 8" style={{
                                    transform: symbolCategory == category.name ? 'rotate(90deg)' : 'none',
                                                            }}>
                                <path d="M1 1L7 7L13 1" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                </div>  
                                {category.name}</heading>
                                <table className="Symbol-table" id="symbolTable">
                                    <tbody className="Symbol-tbody" id="symbolList">
                                        {/* {filteredSymbols.map((symbol) => { */}
                                        {Object.entries(symbolData).map(([symbol, data]) => {
                                            const isSelected = selectedAuthSymbol === symbol;
                                            if (data.symbol_category === category.id && filteredSymbols.includes(symbol)) {
                                                return (
                                                    <tr className={`Symbol-tr ${isSelected ? 'selected-row' : ''} ${isSymbolSelecting ? 'row-disabled' : ''}`} key={symbol}>

                                                        <StarSvg handleTdClick={handleTdClick} symbol={symbol} watchlistSymbols={watchlistSymbols[symbol] || false} >Add to Watchlist</StarSvg>


                                                        {/* <div className='pt-2 size'>
                                                                    {
                                                                        data.bid_class === 'Symbol-price-same' ?
                                                                            <svg width="356px" height="356px" viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#afafaf" stroke-width="2.4"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 9.5C13.3807 9.5 14.5 10.6193 14.5 12C14.5 13.3807 13.3807 14.5 12 14.5C10.6193 14.5 9.5 13.3807 9.5 12C9.5 10.6193 10.6193 9.5 12 9.5Z" fill="#afafaf"></path> </g></svg> :
                                                                            (data.bid_class === 'Symbol-price-up' ?
                                                                                <div className='size2'>
                                                                                    <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(180)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M7.49992 10.2072L11.707 6.00006L3.29282 6.00006L7.49992 10.2072Z" fill="#21c46d"></path> </g></svg>
                                                                                </div> :
                                                                                <div className='size2'>
                                                                                    <svg width="256px" height="256px" viewBox="0 0 16.00 16.00" fill="#e13232" stroke="#e13232" strokeWidth="0.00016">
                                                                                        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                                                                                        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                                                                                        <g id="SVGRepo_iconCarrier">
                                                                                            <rect width="16" height="16" id="icon-bound" fill="none"></rect>
                                                                                            <polygon points="8,11 3,6 13,6"></polygon>
                                                                                        </g>
                                                                                    </svg>
                                                                                </div>

                                                                            )

                                                                    }

                                                                </div> */}
 
                                                        <td className={`specific-td session-td`}>
                                                            {data.is_session_active === 0 ? (
                                                                <div className='pause-mark'>||</div>
                                                            ) : (
                                                                <div className='check-mark'>
                                                                    <svg
                                                                        id='checkmarkId'
                                                                        width={16}
                                                                        height={16}
                                                                        viewBox="0 0 24 24"
                                                                        fill={selectedStyle.buyColor}
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                    >
                                                                        <path d="M9 19.4l-7-7L3.4 10 9 15.6 20.6 4 22 5.4z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="Symbol-td symbol-td" onClick={() => {
                                                            handleRowClick(symbol,symbolData); 
                                                            // mkRipple(e);
                                                            }}
                                                            style={{
                                                                position: 'relative',
                                                                overflow: 'hidden',
                                                                isolation: 'isolate',
                                                            }}
                                                            >
                                                                <Ripple />
                                                                {symbol}
                                                            </td>
                                                        <td className={`Symbol-td ${data.bid_class} bid-td`} onClick={() => {
                                                            handleRowClick(symbol,symbolData);
                                                            // mkRipple(e);
                                                            }}
                                                            style={{
                                                                color:
                                                                    data.bid_class === 'Symbol-price-up'
                                                                        ? selectedStyle.buyColor
                                                                        : data.bid_class === 'Symbol-price-down'
                                                                        ? selectedStyle.sellColor
                                                                        : 'white',
                                                                position: 'relative',
                                                                overflow: 'hidden',
                                                                isolation: 'isolate',
                                                              }}
                                                            >
                                                                <Ripple />
                                                            {/* {data.bid ? formatPriceUptoDecimals(data.bid, symbolDetails[symbol]?.digit).split('.').map((part, index) => ( */}
                                                            {data.bid ? data.bid : '-'}
                                                        </td>

                                                        <td className={`Symbol-td ${data.ask_class} ask-td`} onClick={() => {
                                                            handleRowClick(symbol,symbolData);
                                                            // mkRipple(e);
                                                            }}
                                                            style={{
                                                                color:
                                                                    data.ask_class === 'Symbol-price-up'
                                                                        ? selectedStyle.buyColor
                                                                        : data.ask_class === 'Symbol-price-down'
                                                                        ? selectedStyle.sellColor
                                                                        : 'white',
                                                                position: 'relative',
                                                                overflow: 'hidden',
                                                                isolation: 'isolate',
                                                              }}
                                                            >
                                                                <Ripple />
                                                            {data.ask ? data.ask : '-'}
                                                        </td>

                                                    </tr>
                                                )
                                            }
                                            return null;
                                        })}
                                    </tbody>
                                </table>
                            </wrapper> 
                        ))}
                    </div>
                </div>
            </div>
            <div className={`order-book-wrapper ${WatchListClass}`}>
                <div className="Symbol global-platfrom" style={{ height: '100%' }} >
                    {/* Search input */}
                    <div className="search-container">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search symbol..."
                            value={searchInput}
                            disabled={!isWebSocketRefetch}
                            onChange={(e) =>handleSearchChange(e.target.value)}
                            className='input-symbol-field'
                        />
                        {searchInput && (
                            <FaTimes
                                className="clear-icon-symbol"
                                disabled={!isWebSocketRefetch}
                                onClick={() => handleSearchChange('')}
                            />
                        )}
                    </div>

                    {/* WATCH LIST TAB  */}

                    <div className=''>
                        <table className="Symbol-table-head">
                            <thead className="Symbol-table-thead">
                                    <th className='star-th'></th>
                                    <th className='session-th'></th>
                                    <th className='symbol-th'>Symbol</th>
                                    <th className='bid-th'>Bid</th>
                                    <th className='ask-th'>Ask</th>
                            </thead>
                        </table>
                    </div>
                    
                    <div className="Symbol-list">
                        {symbolCategories?.map((category) => (
                            searchInput.length === 0 ?
                           <wrapper key={category.id}>
                                <heading onClick={()=>{changeSymbolCategory(category.name,symbolCategory === category.name ? true : false)}} >
                                <div className='indicator' >
                                <svg viewBox="0 0 14 8" style={{
                                            transform: symbolCategory == category.name ? 'rotate(90deg)' : 'none',
                                                            }}>
                                <path d="M1 1L7 7L13 1" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                </div>  
                                {category.name}</heading>
                                
                                { symbolCategory === category.name ? (
                                <table className="Symbol-table" id="symbolTable">
                                    <tbody className="Symbol-tbody" id="symbolList">
                                        {/* {filteredSymbols.map((symbol) => { */}
                                        {Object.entries(symbolData)
                                            .filter(([symbol]) => watchlistSymbols[symbol]) // Only include watchlist symbols
                                            .map(([symbol, data]) => {
                                                const isSelected = selectedAuthSymbol === symbol;
                                                if (data.symbol_category === category.id && filteredSymbols.includes(symbol)) {
                                                    return (
                                                    <tr className={`Symbol-tr ${isSelected ? 'selected-row' : ''} ${isSymbolSelecting ? 'row-disabled' : ''}`} key={symbol}>

                                                        <StarSvg handleTdClick={handleTdClick} symbol={symbol} watchlistSymbols={watchlistSymbols[symbol] || false} >Remove From Watchlist</StarSvg>


                                                        {/* <div className='pt-2 size'>
                                                                    {
                                                                        data.bid_class === 'Symbol-price-same' ?
                                                                            <svg width="356px" height="356px" viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#afafaf" stroke-width="2.4"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 9.5C13.3807 9.5 14.5 10.6193 14.5 12C14.5 13.3807 13.3807 14.5 12 14.5C10.6193 14.5 9.5 13.3807 9.5 12C9.5 10.6193 10.6193 9.5 12 9.5Z" fill="#afafaf"></path> </g></svg> :
                                                                            (data.bid_class === 'Symbol-price-up' ?
                                                                                <div className='size2'>
                                                                                    <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(180)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M7.49992 10.2072L11.707 6.00006L3.29282 6.00006L7.49992 10.2072Z" fill="#21c46d"></path> </g></svg>
                                                                                </div> :
                                                                                <div className='size2'>
                                                                                    <svg width="256px" height="256px" viewBox="0 0 16.00 16.00" fill="#e13232" stroke="#e13232" strokeWidth="0.00016">
                                                                                        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                                                                                        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                                                                                        <g id="SVGRepo_iconCarrier">
                                                                                            <rect width="16" height="16" id="icon-bound" fill="none"></rect>
                                                                                            <polygon points="8,11 3,6 13,6"></polygon>
                                                                                        </g>
                                                                                    </svg>
                                                                                </div>

                                                                            )

                                                                    }

                                                                </div> */}
 
                                                        <td className={`specific-td session-td`}>
                                                            {data.is_session_active === 0 ? (
                                                                <div className='pause-mark'>||</div>
                                                            ) : (
                                                                <div className='check-mark'>
                                                                    <svg
                                                                        id='checkmarkId'
                                                                        width={16}
                                                                        height={16}
                                                                        viewBox="0 0 24 24"
                                                                        fill={selectedStyle.buyColor}
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                    >
                                                                        <path d="M9 19.4l-7-7L3.4 10 9 15.6 20.6 4 22 5.4z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="Symbol-td symbol-td" onClick={() => {
                                                            handleRowClick(symbol,symbolData); 
                                                            // mkRipple(e);
                                                            }}
                                                            style={{
                                                                position: 'relative',
                                                                overflow: 'hidden',
                                                                isolation: 'isolate',
                                                            }}
                                                            >
                                                                <Ripple />
                                                                {symbol}
                                                            </td>
                                                        <td className={`Symbol-td ${data.bid_class} bid-td`} onClick={() => {
                                                            handleRowClick(symbol,symbolData);
                                                            // mkRipple(e);
                                                            }}
                                                            style={{
                                                                color:
                                                                    data.bid_class === 'Symbol-price-up'
                                                                        ? selectedStyle.buyColor
                                                                        : data.bid_class === 'Symbol-price-down'
                                                                        ? selectedStyle.sellColor
                                                                        : 'white',
                                                                position: 'relative',
                                                                overflow: 'hidden',
                                                                isolation: 'isolate',
                                                              }}
                                                            >
                                                                <Ripple />
                                                            {data.bid ?data.bid : '-'}
                                                        </td>

                                                        <td className={`Symbol-td ${data.ask_class} ask-td`} onClick={() => {
                                                            handleRowClick(symbol,symbolData);
                                                            // mkRipple(e);
                                                            }}
                                                            style={{
                                                                color:
                                                                    data.ask_class === 'Symbol-price-up'
                                                                        ? selectedStyle.buyColor
                                                                        : data.ask_class === 'Symbol-price-down'
                                                                        ? selectedStyle.sellColor
                                                                        : 'white',
                                                                position: 'relative',
                                                                overflow: 'hidden',
                                                                isolation: 'isolate',
                                                              }}
                                                            >
                                                                <Ripple />
                                                            {data.ask ? data.bid : '-'}
                                                        </td>

                                                    </tr>
                                                )
                                            }
                                            return null;
                                        })}
                                    </tbody>
                                </table>
                                ) : null
                                }
                            </wrapper> : 
                           <wrapper>
                                <heading onClick={()=>{changeSymbolCategory(category.name,symbolCategory === category.name ? true : false)}} >
                                <div className='indicator' >
                                <svg viewBox="0 0 14 8" style={{
                                    transform: symbolCategory == category.name ? 'rotate(90deg)' : 'none',
                                                            }}>
                                <path d="M1 1L7 7L13 1" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                </div>  
                                {category.name}</heading>
                                <table className="Symbol-table" id="symbolTable">
                                    <tbody className="Symbol-tbody" id="symbolList">
                                        {/* {filteredSymbols.map((symbol) => { */}
                                        {Object.entries(symbolData)
                                            .filter(([symbol]) => watchlistSymbols[symbol]) // Only include watchlist symbols
                                            .map(([symbol, data]) => {
                                                const isSelected = selectedAuthSymbol === symbol;
                                                if (data.symbol_category === category.id && filteredSymbols.includes(symbol)) {
                                                    return (
                                                    <tr className={`Symbol-tr ${isSelected ? 'selected-row' : ''} ${isSymbolSelecting ? 'row-disabled' : ''}`} key={symbol}>

                                                    <StarSvg handleTdClick={handleTdClick} symbol={symbol} watchlistSymbols={watchlistSymbols[symbol] || false} >Remove From Watchlist</StarSvg>


                                                    {/* <div className='pt-2 size'>
                                                                    {
                                                                        data.bid_class === 'Symbol-price-same' ?
                                                                            <svg width="356px" height="356px" viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#afafaf" stroke-width="2.4"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 9.5C13.3807 9.5 14.5 10.6193 14.5 12C14.5 13.3807 13.3807 14.5 12 14.5C10.6193 14.5 9.5 13.3807 9.5 12C9.5 10.6193 10.6193 9.5 12 9.5Z" fill="#afafaf"></path> </g></svg> :
                                                                            (data.bid_class === 'Symbol-price-up' ?
                                                                                <div className='size2'>
                                                                                    <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(180)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M7.49992 10.2072L11.707 6.00006L3.29282 6.00006L7.49992 10.2072Z" fill="#21c46d"></path> </g></svg>
                                                                                </div> :
                                                                                <div className='size2'>
                                                                                    <svg width="256px" height="256px" viewBox="0 0 16.00 16.00" fill="#e13232" stroke="#e13232" strokeWidth="0.00016">
                                                                                        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                                                                                        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                                                                                        <g id="SVGRepo_iconCarrier">
                                                                                            <rect width="16" height="16" id="icon-bound" fill="none"></rect>
                                                                                            <polygon points="8,11 3,6 13,6"></polygon>
                                                                                        </g>
                                                                                    </svg>
                                                                                </div>

                                                                            )

                                                                    }

                                                                </div> */}
 
                                                        <td className={`specific-td session-td`}>
                                                            {data.is_session_active === 0 ? (
                                                                <div className='pause-mark'>||</div>
                                                            ) : (
                                                                <div className='check-mark'>
                                                                    <svg
                                                                        id='checkmarkId'
                                                                        width={16}
                                                                        height={16}
                                                                        viewBox="0 0 24 24"
                                                                        fill={selectedStyle.buyColor}
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                    >
                                                                        <path d="M9 19.4l-7-7L3.4 10 9 15.6 20.6 4 22 5.4z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="Symbol-td symbol-td" onClick={() => {
                                                            handleRowClick(symbol,symbolData); 
                                                            // mkRipple(e);
                                                            }}
                                                            style={{
                                                                position: 'relative',
                                                                overflow: 'hidden',
                                                                isolation: 'isolate',
                                                            }}
                                                            >
                                                                <Ripple />
                                                                {symbol}
                                                            </td>
                                                        <td className={`Symbol-td ${data.bid_class} bid-td`} onClick={() => {
                                                            handleRowClick(symbol,symbolData);
                                                            // mkRipple(e);
                                                            }}
                                                            style={{
                                                                color:
                                                                    data.bid_class === 'Symbol-price-up'
                                                                        ? selectedStyle.buyColor
                                                                        : data.bid_class === 'Symbol-price-down'
                                                                        ? selectedStyle.sellColor
                                                                        : 'white',
                                                                position: 'relative',
                                                                overflow: 'hidden',
                                                                isolation: 'isolate',
                                                              }}
                                                            >
                                                                <Ripple />
                                                            {data.bid ? data.bid : '-'}
                                                        </td>

                                                        <td className={`Symbol-td ${data.ask_class} ask-td`} onClick={() => {
                                                            handleRowClick(symbol,symbolData);
                                                            // mkRipple(e);
                                                            }}
                                                            style={{
                                                                color:
                                                                    data.ask_class === 'Symbol-price-up'
                                                                        ? selectedStyle.buyColor
                                                                        : data.ask_class === 'Symbol-price-down'
                                                                        ? selectedStyle.sellColor
                                                                        : 'white',
                                                                position: 'relative',
                                                                overflow: 'hidden',
                                                                isolation: 'isolate',
                                                              }}
                                                            >
                                                                <Ripple />
                                                            {data.ask ? data.ask : '-'}
                                                        </td>

                                                    </tr>
                                                )
                                            }
                                            return null;
                                        })}
                                    </tbody>
                                </table>
                            </wrapper> 
                        ))}
                    </div>


                </div>
            </div>


        </div>
    );
};

export default Symbol;
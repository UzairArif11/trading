//below are api endpoints different possible formates

import getBackendUrl from "../components/utils/RedirectUrl";

//'http://server:port/endpoint';
//'http://server:port/endpoint?param1=value1';
//'http://server:port/endpoint?param1=value1&param2=value2';
//'http://server:port/endpoint?param1=value1&param2=value2&param3=value3';
//'http://server:port/endpoint?param1=value1&param2=value2&param3=value3&...';
const backOfficeUrl = getBackendUrl();

const protocol = process.env.REACT_APP_IS_SECURED_PROTOCOL === 'true' ? 'https' : 'http';

// const defaultServer = process.env.REACT_APP_DEFAULT_SERVER;
const serverUrl = () => {
  if (localStorage.getItem('serverUrl')) {
    return  `${protocol}://${localStorage.getItem('serverUrl')}`
  } else {
    return` ${backOfficeUrl}/api`
  }
}


export const API_ROOT = () => {
  return  serverUrl();
}
//const API_ROOT() = `${protocol}://${server}:${port}`;

//API Endpoints Names................................................................................................
const LOGIN = 'login';
const LOGOUT = 'logout';
const USER_DETAILS = 'user-details';
const OPEN_POSITION = 'open-position';
const CLOSE_POSITION = 'close-position';
const OPENED_POSITIONS = 'opened-positions';
const CLOSED_POSITIONS = 'closed-positions';
const SYMBOLS = 'symbols';
const KLINES = 'klines';
const KLINES_MT = 'match-trader-klines';
const FMP_KLINES = 'fmp-klines';
const LEVERAGE = 'leverage';
const SYMBOL_INFO = 'symbol-info';
const USER_WATCHLIST = 'user-watchlist';
const INSERT_WATCHLIST = 'insert-watchlist';
const DELETE_WATCHLIST = 'delete-watchlist';
const SESSION = 'session';
const OPEN_ORDER = 'open-order';
const CLOSE_ORDER = 'close-order';
const CANCEL_ORDER = 'cancel-order';
const OPENED_ORDERS = 'opened-orders';
const CLOSED_ORDERS = 'closed-orders';
const GET_ALL_CLOSED_ORDERS = 'get-all-closed-orders'
const GET_ALL_OPENED_ORDERS = 'get-all-opened-orders'
const CLOSE_ALL_POSITIONS = 'close-all-positions';
const GET_ALL_CLOSED_POSITIONS_AND_SAVE = "get-all-closed-positions-and-save";
const CLOSE_ALL_ORDERS = 'close-all-orders';
const SESSION_DETAIL = 'session-detail';
const POSITION_DETAIL = 'position-details';
const ORDER_DETAIL = 'order-details';
const UPDATE_POSITION_DETAILS = 'update-position';
const UPDATE_ORDER_DETAILS = 'update-order';
const GET_ALL_CLOSED_POSITIONS = "closed-all-positions"
const CHECK_EMAIL = "check-email"
const DIRECT_LOGIN = "direct-login"
const GET_NOTIFICATIONS = "get-user-notifications"
const MARK_NOTIFICATIONS_AS_READ = "mark-notification-as-read"
const SAVE_LOGIN_TOKEN = "save-login-token"
const SAVE_FCM_TOKEN = "save-fcm-token"
const TOGGLE_BOT = "UpdateBotStatus"
const MAKE_DEPOSIT = "store-deposit-request"
const MAKE_WITHDRAW = "store-withdrawal-request"
const GET_POSITION_DETAILS = "position-deal-info"
const ADD_FEEDBACK = 'add-feedback';
const GET_FEEDBACK_TYPES = 'get_feedback_types';

//API Endpoints URLs.................................................................................................
export const API_ENDPOINT_LOGIN = () => `${backOfficeUrl}/api/${LOGIN}`
export const API_ENDPOINT_DIRECT_LOGIN = () => `${backOfficeUrl}/api/${DIRECT_LOGIN}`
export const API_ENDPOINT_LOGOUT = (variant_id, userId) => (`${API_ROOT()}/${LOGOUT}?variant_id=${variant_id}&userId=${userId}`)
export const API_ENDPOINT_USER_DETAILS = () =>   `${API_ROOT()}/${USER_DETAILS}`
export const API_ENDPOINT_OPEN_POSITION =  () => `${API_ROOT()}/${OPEN_POSITION}`
export const API_ENDPOINT_OPEN_ORDER = () =>  `${API_ROOT()}/${OPEN_ORDER}`
export const API_ENDPOINT_CLOSE_POSITION = () =>   `${API_ROOT()}/${CLOSE_POSITION}`
export const API_ENDPOINT_CLOSE_ORDER = () =>   `${API_ROOT()}/${CLOSE_ORDER}`
export const API_ENDPOINT_CANCEL_ORDER = () =>   `${API_ROOT()}/${CANCEL_ORDER}`
export const API_ENDPOINT_OPENED_POSITIONS = (userId) => (`${API_ROOT()}/${OPENED_POSITIONS}?id=${userId}&`)
export const API_ENDPOINT_All_CLOSED_POSITIONS = (userId, currentPage, pageSize, search, startDate, endDate, botFilter) => (`${API_ROOT()}/${GET_ALL_CLOSED_POSITIONS}?botFilter=${botFilter}&userId=${userId}&page=${currentPage}&pageSize=${pageSize}&search=${search}&startDate=${startDate.toString()}&endDate=${endDate.toString()}`)
export const API_ENDPOINT_GET_All_CLOSED_ORDERS = (userId, currentPage, pageSize, search, startDate, endDate) => (`${API_ROOT()}/${GET_ALL_CLOSED_ORDERS}?userId=${userId}&page=${currentPage}&pageSize=${pageSize}&search=${search}&startDate=${startDate.toString()}&endDate=${endDate.toString()}`)
export const API_ENDPOINT_GET_ALL_OPEN_ORDERS = (userId, currentPage, pageSize, search, direction) => (`${API_ROOT()}/${GET_ALL_OPENED_ORDERS}?userId=${userId}&page=${currentPage}&pageSize=${pageSize}&search=${search}&direction=${direction}`)
export const API_ENDPOINT_CLOSED_POSITIONS = (userId) => (`${API_ROOT()}/${CLOSED_POSITIONS}?id=${userId}`)
export const API_ENDPOINT_SYMBOLS = (userId) => (`${API_ROOT()}/${SYMBOLS}?id=${userId}`)
export const API_ENDPOINT_KLINES = (selectedAuthSymbol, selectedTimeFrame, userId) => (`${API_ROOT()}/${KLINES}?s=${selectedAuthSymbol}&tf=${selectedTimeFrame}&userId=${userId}`)
export const API_ENDPOINT_KLINES_MT = (selectedAuthSymbol, selectedTimeFrame, userId, selectedAuthSymbolId, categoryId) => (`${API_ROOT()}/${KLINES_MT}?s=${selectedAuthSymbol}&tf=${selectedTimeFrame}&userId=${userId}&sId=${selectedAuthSymbolId}&categoryId=${categoryId}`)
// export const API_ENDPOINT_KLINES_MT = (selectedAuthSymbol, selectedTimeFrame, userId, selectedAuthSymbolId, categoryId) => (`${process.env.REACT_APP_INFLUX_ENDPOINT}/getCandles?symbol=${selectedAuthSymbol}&&timeframe=${selectedTimeFrame}`)

export const API_ENDPOINT_LEVERAGE = (userId, symbol) => (`${API_ROOT()}/${LEVERAGE}?id=${userId}&s=${symbol}`)
export const API_ENDPOINT_SYMBOL_INFO = (userId, symbol) => (`${API_ROOT()}/${SYMBOL_INFO}?id=${userId}&s=${symbol}`)
export const API_ENDPOINT_SESSION_DETAIL = (userId, symbol) => (`${API_ROOT()}/${SESSION_DETAIL}?id=${userId}&s=${symbol}`)
export const API_ENDPOINT_POSITION_DETAIL = (userId, positionId) => (`${API_ROOT()}/${POSITION_DETAIL}?user_id=${userId}&p_id=${positionId}`)
export const API_ENDPOINT_ORDER_DETAIL = (userId, orderId) => (`${API_ROOT()}/${ORDER_DETAIL}?user_id=${userId}&o_id=${orderId}`)
export const API_ENDPOINT_NOTIFICATIONS = (userId) => (`${API_ROOT()}/${GET_NOTIFICATIONS}?id=${userId}`)
export const API_ENDPOINT_MARK_NOTIFICATIONS_AS_READ = (userId) => (`${API_ROOT()}/${MARK_NOTIFICATIONS_AS_READ}?id=${userId}`)
export const API_ENDPOINT_UPDATE_POSITION_DETAIL = () => `${API_ROOT()}/${UPDATE_POSITION_DETAILS}`
export const API_ENDPOINT_UPDATE_ORDER_DETAIL = () => `${API_ROOT()}/${UPDATE_ORDER_DETAILS}`
export const API_ENDPOINT_TOGGLE_BOT = () => `${API_ROOT()}/${TOGGLE_BOT}`
export const BACK_OFFICE_IMAGES = () => `${backOfficeUrl}/upload/settings`
export const promotionProduct = (userId) => `${API_ROOT()}/promotionProduct?id=${userId}`
export const notificationSystem = () => `${API_ROOT()}/systemNotifications/notification`
export const API_ENDPOINT_INSERT_WATCHLIST = (p_user_id, p_symbol_name) => (`${API_ROOT()}/${INSERT_WATCHLIST}?id=${p_user_id}&sname=${p_symbol_name}`)
export const API_ENDPOINT_DELETE_WATCHLIST = (p_user_id, p_symbol_name) => (`${API_ROOT()}/${DELETE_WATCHLIST}?id=${p_user_id}&sname=${p_symbol_name}`);
export const API_ENDPOINT_GET_ALL_CLOSED_POSITIONS_AND_SAVE = (userId) => (`${API_ROOT()}/${GET_ALL_CLOSED_POSITIONS_AND_SAVE}?userId=${userId}`)
export const API_ENDPOINT_USER_WATCHLIST = (p_user_id) => (`${API_ROOT()}/${USER_WATCHLIST}?id=${p_user_id}`)

export const API_ENDPOINT_SESSION = (userId, symbol) => (`${API_ROOT()}/${SESSION}?id=${userId}&s=${symbol}`)
export const API_ENDPOINT_OPENED_ORDERS = (userId) => (`${API_ROOT()}/${OPENED_ORDERS}?id=${userId}`)
export const API_ENDPOINT_CLOSED_ORDERS = (userId) => (`${API_ROOT()}/${CLOSED_ORDERS}?id=${userId}`)
export const API_ENDPOINT_CHECK_EMAIL = (email) => (`${backOfficeUrl}/api/${CHECK_EMAIL}?email=${email}`)
export const API_ENDPOINT_SAVE_LOGIN_TOKEN = (userId) => (`${API_ROOT()}/${SAVE_LOGIN_TOKEN}?userId=${userId}`)
export const API_ENDPOINT_SAVE_FCM_TOKEN = () => `${API_ROOT()}/${SAVE_FCM_TOKEN}`
export const API_ENDPOINT_MAKE_DEPOSIT = () => `${API_ROOT()}/api/${MAKE_DEPOSIT}`
export const API_ENDPOINT_MAKE_WITHDRAW = () => `${API_ROOT()}/api/${MAKE_WITHDRAW}`
export const API_ENDPOINT_GET_POSITION_DETAILS = (userId, positionId) => `${API_ROOT()}/${GET_POSITION_DETAILS}?userId=${userId}&positionId=${positionId}`
export const API_ENDPOINT_ADD_FEEDBACK =  () => `${backOfficeUrl}/api/${ADD_FEEDBACK}`
export const API_ENDPOINT_GET_FEEDBACK_TYPES =  () => `${API_ROOT()}/${GET_FEEDBACK_TYPES}`

// export const API_ENDPOINT_EXCHANGE_RATE_API = (symbol) => (`${process.env.REACT_APP_EXCHANGE_RATE_API}/${symbol}`)
export const API_ENDPOINT_EXCHANGE_RATE_API = () => (`${process.env.REACT_APP_EXCHANGE_RATE_API}`) //API URL TO GET RATE FROM MICROSERVICE

export const API_ENDPOINT_CLOSE_ALL_POSITIONS = (userId, positionType) => {
  return `${API_ROOT()}/${CLOSE_ALL_POSITIONS}?id=${userId}&type=${positionType}`;
};
export const API_ENDPOINT_CLOSE_ALL_ORDERS = (userId, orderType) => {
  return `${API_ROOT()}/${CLOSE_ALL_ORDERS}?id=${userId}&type=${orderType}`;
};

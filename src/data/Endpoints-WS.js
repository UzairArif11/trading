//below are web-socket endpoints different possible formates

//'ws://server:port/endpoint';
//'ws://server:port/endpoint?querystring1=value1&querystring2=value2';
//'ws://server:port/endpoint@param1';
//'ws://server:port/endpoint@param1?querystring1=value1&querystring2=value2';
//'ws://server:port/endpoint@param1&param2';
//'ws://server:port/endpoint@param1&param2&param3';
//'ws://server:port/endpoint@param1&param2&param3&...';

const protocol = process.env.REACT_APP_IS_SECURED_PROTOCOL === 'true' ? 'wss' : 'ws';
// const server = process.env.REACT_APP_DATA_SERVER;
// const port = process.env.REACT_APP_DATA_SERVER_PORT;


const server = () => {
    if (localStorage.getItem('serverUrl')) {
        return localStorage.getItem('serverUrl')
    }
}
export const WS_ROOT = () => {
  return  `${protocol}://${server()}`;
}
//const WS_ROOT = `${protocol}://${server}`;

//Websocket Endpoints Names................................................................................................
const SYMBOLS = 'symbols';
const KLINE = 'kline';
const DEPTH = 'depth';
const PLATFORM = 'platform';
const ACCOUNT_DETAILS = 'account-details';

//Websocket Endpoints URLs.................................................................................................
//pass querystring after ? mark if needed
export const WS_ENDPOINT_SYMBOLS_LIVE_FEEDS = (id) => (`${WS_ROOT()}/${SYMBOLS}${ws_queryString(id)}`);
export const WS_ENDPOINT_KLINE_LIVE_FEEDS = (id, symbol, timeFrame) => (`${WS_ROOT()}/${KLINE}@${symbol}&${timeFrame}${ws_queryString(id)}`)
export const WS_ENDPOINT_DEPTH_LIVE_FEEDS = (id, symbol, levelsOfDepth, speedOfDepth) => (`${WS_ROOT()}/${DEPTH}@${symbol}&${levelsOfDepth}&${speedOfDepth}${ws_queryString(id)}`)
export const WS_ENDPOINT_PLATFORM_LIVE_FEEDS = (id, levelsOfDepth, speedOfDepth, variant_id,token) => (`${WS_ROOT()}/${PLATFORM}@${levelsOfDepth}&${speedOfDepth}${ws_queryString_platform(id, variant_id)}&token=${"accessToken="+token}`)
export const WS_ENDPOINT_ACCOUNT_DETAILS = (id, symbol) => (`${WS_ROOT()}/${ACCOUNT_DETAILS}@${symbol}${ws_queryString(id)}`)

//Helper function
const ws_queryString = (id) => {
    return id ? `?id=${id}` : '';
}

const ws_queryString_platform = (id, variant_id) => {
    return `?id=${id}&variant_id=${variant_id}`;
}


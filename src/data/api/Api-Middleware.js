//serves as a layer between components and the APIManager. 
//It provides a convenient way for components to make API requests by offering a clean and uniform API interface
//easily add more methods for other HTTP methods or customize the headers for specific requests.
import { API_ENDPOINT_LOGOUT } from "../Endpoints-API";
import { apiManagerGlobal } from "./Api-Manager";
import { ws_close_all } from "../websocket/Websocket-Middleware";


import axios from "axios";
const APIMiddleware = {
    // Method to make a GET request
    get: (endpoint, headers = {}) => {
        headers.Authorization = localStorage.getItem("token");
        return apiManagerGlobal.request(endpoint, "get", undefined, headers);
    },

    // Method to make a POST request
    post: (endpoint, data, headers = {}) => {
        headers.Authorization = localStorage.getItem("token");
        return apiManagerGlobal.request(endpoint, "post", data, headers);
    },

    // Method to make a PUT request
    put: (endpoint, data, headers = {}) => {
        headers.Authorization = localStorage.getItem("token");
        return apiManagerGlobal.request(endpoint, "put", data, headers);
    },

    // Method to make a DELETE request
    delete: (endpoint, headers = {}) => {
        headers.Authorization = localStorage.getItem("token");
        return apiManagerGlobal.request(endpoint, "delete", undefined, headers);
    },
    // Method to make a POST request which includes form
    postForm: (endpoint, data, headers = {}) => {
        headers.Authorization = localStorage.getItem("token");
        return apiManagerGlobal.requestIncludesImage(endpoint, "post", data, headers);
    },
};


// Add Axios interceptor for handling unauthorized errors globally
axios.interceptors.response.use(
    function (response) {
        return response;
    },
    async function (error) {
        if (error.response && error.response.status == 401 || error.response && error.response.data.accessRight == 4)  {
 
            // Clear cookies and local storage
            // Make a request to logout endpoint
            const variantId=localStorage.variantId
            const userId=localStorage.userId
           const response= await APIMiddleware.get(API_ENDPOINT_LOGOUT(variantId,userId));
           if (response) {
            localStorage.removeItem("userId");
            localStorage.removeItem("token");
                await ws_close_all();
                if (variantId != undefined) {
                    localStorage.removeItem("variantId");
                      }
            setTimeout(() => {
              window.location.reload();
            }, 100);
          }
          
        }
        return Promise.reject(error);
    }
);
export default APIMiddleware;

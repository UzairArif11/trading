//designed to centralize the logic for making API requests and can be easily extended as needed
//managing and handling API requests in a structured manner
//easily extend this class to include more API-related methods, authentication handling, or other features specific to application.

import axios from "axios";

class APIManager {
    constructor() {
        this.apiInstances = new Map();
            }
           
    // Method to make an API request
    async request(url, method, data, headers) {
        
        // Create an Axios configuration object
        const axiosConfig = {
            method,
            url,
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            data,
            withCredentials: true, // Include cookies with the request
        };
        
        try {
            // Send the Axios request
            const response = await axios(axiosConfig);

            // Return the response data
            return response.data;
        } catch (error) {
            // If there's an error, throw it for handling in middleware
            throw error;
        }
    }
    async requestIncludesImage(url, method, data, headers) {
        const axiosConfig = {
            method,
            url,
            headers: {
                'Content-Type': 'multipart/form-data',
                ...headers,
            },
            data,
            withCredentials: true,
        };

        try {
            const response = await axios(axiosConfig);

            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Add more API-related methods as needed
}

// Create a global instance of the APIManager
export const apiManagerGlobal = new APIManager();

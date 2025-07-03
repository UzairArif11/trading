import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
// import { toast } from "react-toastify";
import { promotionProduct } from "../data/Endpoints-API";
import { useAuthContext } from "./Auth-Context";


// Create Context
// export const PromotionContext = createContext();
export const PromotionContext = createContext({
  updates: [],
  loading: true,
  isHidden: true,
  fetchUpdates: () => {
    // console.log('i am running')
  }, 
});


export const PromotionProvider = ({ children }) => {
  const { user } = useAuthContext();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  // Function to fetch updates from the backend
  const fetchUpdates = async () => {
    // console.log('no i am running')
    try {
      const response = await axios.get(promotionProduct(user.userId));
      // console.log(response, "responseresponse");
      
      if (response?.data?.filterData.length === 0) {
        setIsHidden(false);
        setUpdates([]); 
        return;
      }

      // Process the data based on new response format
      const data = response?.data?.filterData.map((item) => ({
        id: item.id,
        images: item.images,  
        title: item.title,
        description: item.description,
        button_link: item.url,
        background_color:item.background_color,
        title_color:item.title_color,
        title_font_size:item.title_font_size,
        description_color:item.description_color,
        description_font_size:item.description_font_size,
        button_text:item.button_text,
        button_color:item.button_bg_color,
        button_status:item.button_status,
        buttonTextCol:item.button_txt_color,
      }));
      console.log("datdatadatadat",data);
      
      setIsHidden(true)
      
      // console.log(data, "datadatadatadata"); 
      setUpdates(data);      
      // console.log(data.images,"imageimageimageimage");
      

      // setIsHidden(true);
    } catch (error) {
      console.log("Error fetching updates:", error);
      // toast.error("Failed to fetch updates.", { position: "top-right", autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.userId != undefined && user.userId > 0) {
    fetchUpdates(); 
    }
  }, [user]);

  return (
    <PromotionContext.Provider value={{ updates, loading, isHidden, fetchUpdates}}>
      {children}
    </PromotionContext.Provider>
  );
};

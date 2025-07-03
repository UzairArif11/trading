import React, { createContext, useContext, useState, useEffect } from 'react';
import defaultUser from "../imgs/default.png";
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const themes = {
        dark: 'dark',
        light: 'light',
        ocean: 'ocean',
        venom: 'venom',
        skyline: 'skyline',
        // Add more themes as needed
    };
    let myTheme;
    if(localStorage.theme != null){
      myTheme = localStorage.theme;
    }else{
      myTheme = 'dark';
    }
    const [currentTheme, setCurrentTheme] = useState(myTheme);
    const [profileImage, setProfileImage] = useState(defaultUser);

    // useEffect(() => {
    //     // Set the initial theme when the component mounts
    //     setTheme(currentTheme);
    // }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // const setTheme = (themeKey) => {
    //     if (themes[themeKey]) {
            
    //         // Update the body class
    //         if(localStorage.userId !== undefined){
    //             document.body.className = `theme-${themeKey}`;
    //         }else{
    //             document.body.className = 'theme-none';
    //         }

    //         setCurrentTheme(themeKey);
    //         localStorage.setItem('theme',themeKey);
    //     } else {
    //         console.warn(`Theme '${themeKey}' not found.`);
    //     }
    // };

    const contextValue = {
        theme: themes[currentTheme],
        // setTheme,
        profileImage,
        setProfileImage
    };

    return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => {
    return useContext(ThemeContext);
};

import React, { createContext, useContext, useEffect, useState } from 'react';

export const RippleContext = createContext();

export const useRippleContext = () => {
  return useContext(RippleContext);
};

export const RippleProvider = ({ children }) => {

     // Make Ripple Effect Function
     const mkRipple = (e, getColor) => {
      if(e.target.className != 'ripple_once'){
      const size = e.target.getClientRects()[0].width;
      const ripple = document.createElement('div');
      let color;
      if (getColor == undefined) {
      color = getComputedStyle(e.target).color;
      } else {
      color = getColor;
      }
      e.target.style.position = 'relative';
      e.target.style.overflow = 'hidden';
      ripple.className = 'ripple_once';
      ripple.style.transition = '.6s ease';
      ripple.style.backgroundColor = color;
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '100%';
      ripple.style.top = `${e.nativeEvent.offsetY - (size / 2)}px`;
      ripple.style.left = `${e.nativeEvent.offsetX - (size / 2)}px`;
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.transform = 'scale(0)';
      ripple.style.opacity = 0.5;
      e.target.append(ripple);
      setTimeout(() => {
      ripple.style.transform = 'scale(2)';
      ripple.style.opacity = 0;
      setTimeout(() => {
      ripple.remove();
      }, 1000);
      }, 50);
      }};


  return (
    <RippleContext.Provider value={{ mkRipple }}>
      {children}
    </RippleContext.Provider>
  );
};
import { useState, useEffect } from 'react';

const useIsTablet = () => {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 600px) and (max-width: 1024px)');

    const handleChange = (event) => setIsTablet(event.matches);

    handleChange(mediaQuery); // Set initial value
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isTablet;
};

export default useIsTablet;

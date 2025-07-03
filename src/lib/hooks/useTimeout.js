import { useEffect, useRef } from 'react';

export default function useTimeout(callback, delay) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const timeoutId = setTimeout(() => callbackRef.current(), delay);
    return () => clearTimeout(timeoutId);
  }, [delay]);
}
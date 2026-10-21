import { useState, useEffect } from "react";

/**
 * Custom hook to debounce a value by a given delay in milliseconds.
 * Useful for real-time search inputs to prevent excessive API calls while typing.
 */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

"use client";

import { useState, useCallback } from "react";

export function useAsyncOperation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (asyncFunction) => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFunction();
      return result;
    } catch (err) {
      console.error("Async operation failed:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const retry = useCallback(
    async (asyncFunction) => {
      return execute(asyncFunction);
    },
    [execute]
  );

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    execute,
    retry,
    reset,
  };
}

export function useApiCall(apiFunction, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      console.error("API call failed:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  const retry = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    fetchData,
    retry,
    reset,
  };
}

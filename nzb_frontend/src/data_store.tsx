import {useEffect, useState} from 'react';

export interface DataStoreApi<GetData, SetData> {
  getData: () => GetData;
  setData: (data: SetData) => void;
  useData: () => GetData;
}

export function createDataStore<T>(): DataStoreApi<T | undefined, T>;
export function createDataStore<T>(initialValue: T): DataStoreApi<T, T>;
export function createDataStore<T>(initialValue?: T): DataStoreApi<T | undefined, T> {
  let currentData = initialValue;
  const storeListeners: ((dataStore: T | undefined) => void)[] = [];

  function getData(): T | undefined {
    return currentData;
  }

  function setData(data: T | undefined): void {
    currentData = data;
    for (const listener of storeListeners) {
      listener(currentData);
    }
  }

  function useData(): T | undefined {
    const [internalData, setInternalData] = useState(currentData);
    useEffect(() => {
      // In case the rev of the data store changed between the time we did the `useState`
      // and the time of the `useEffect` we need to refresh manually the state.
      if (internalData !== currentData) {
        setInternalData(currentData);
      }
      // Register the state setter to be called for any subsequent data store change
      storeListeners.push(setInternalData);
      return () => {
        storeListeners.splice(storeListeners.indexOf(setInternalData), 1);
      };
    }, []); /* eslint-disable-line react-hooks/exhaustive-deps */
    return internalData;
  }

  return {getData, setData, useData};
}

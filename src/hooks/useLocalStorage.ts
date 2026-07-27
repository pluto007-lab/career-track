import { useCallback, useState } from "react";
import {
  readStorage,
  writeStorage,
  type StorageError,
  type StorageKey,
  type StorageResult,
} from "../lib/storage";

type SetStoredValue<T> = T | ((currentValue: T) => T);
type SetValue<T> = (
  value: SetStoredValue<T>,
) => StorageResult<undefined>;

export function useLocalStorage<T>(
  key: StorageKey,
  initialValue: T,
): [T, SetValue<T>, StorageError | null] {
  const [initialResult] = useState(() => readStorage(key, initialValue));
  const [storedValue, setStoredValue] = useState<T>(initialResult.value);
  const [storageError, setStorageError] = useState<StorageError | null>(
    initialResult.ok ? null : initialResult.error,
  );

  const setStoredValueAfterWrite = useCallback(
    (value: SetStoredValue<T>): StorageResult<undefined> => {
      const nextValue =
        value instanceof Function ? value(storedValue) : value;
      const result = writeStorage(key, nextValue);

      if (result.ok) {
        setStoredValue(nextValue);
        setStorageError(null);
      } else {
        setStorageError(result.error);
      }

      return result;
    },
    [key, storedValue],
  );

  return [storedValue, setStoredValueAfterWrite, storageError];
}

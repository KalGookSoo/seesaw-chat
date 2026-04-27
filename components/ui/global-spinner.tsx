import React, { useEffect, useState } from 'react';
import { spinnerService } from '@/services/spinner';
import { ActivityIndicator, View } from 'react-native';

export function GlobalSpinner() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return spinnerService.subscribe(setIsLoading);
  }, []);

  if (!isLoading) return null;

  return (
    <View className="absolute inset-0 bg-black/40 justify-center items-center z-[9999]">
      <View className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-md">
        <ActivityIndicator size="large" className="text-primary-600" />
      </View>
    </View>
  );
}

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { spinnerService } from '@/services/spinner';
import { colors, shadows, borderRadius } from '@/constants/design';

export function GlobalSpinner() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return spinnerService.subscribe(setIsLoading);
  }, []);

  if (!isLoading) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  container: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: borderRadius['2xl'],
    ...shadows.md,
  },
});

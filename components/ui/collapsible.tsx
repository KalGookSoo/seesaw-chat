import { PropsWithChildren, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ThemedView>
      <TouchableOpacity className="flex-row items-center gap-1.5" onPress={() => setIsOpen((value) => !value)} activeOpacity={0.8}>
        <MaterialIcons name="chevron-right" size={18} className="text-gray-500 dark:text-gray-400" style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }} />

        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </TouchableOpacity>
      {isOpen && <ThemedView className="mt-1.5 ml-6">{children}</ThemedView>}
    </ThemedView>
  );
}

import React from 'react';
import type { UserResponse } from '@/services/mock-data';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { FlatList, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface SearchUserModalProps {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchQueryChange: (text: string) => void;
  onSearch: () => void;
  searchResults: UserResponse[] | null;
  onUserSelect: (userId: string) => void;
  onSendRequest: (user: UserResponse) => void;
}

export function SearchUserModal({ visible, onClose, searchQuery, onSearchQueryChange, onSearch, searchResults, onUserSelect, onSendRequest }: SearchUserModalProps) {
  const renderSearchResult = ({ item }: { item: UserResponse }) => (
    <TouchableOpacity className="flex-row items-center bg-white dark:bg-gray-900 rounded-xl p-4 mb-2 shadow-sm" onPress={() => onUserSelect(item.id)} activeOpacity={0.7}>
      <View className="w-[52px] h-[52px] rounded-full bg-blue-600 dark:bg-blue-500 justify-center items-center mr-4">
        <Text className="text-white text-xl font-semibold">{item.name[0]}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">{item.name}</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">@{item.username}</Text>
      </View>
      <TouchableOpacity
        className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 justify-center items-center"
        onPress={(e) => {
          e.stopPropagation();
          onSendRequest(item);
        }}
      >
        <MaterialIcons name="add" size={20} color="#2563eb" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-gray-50 dark:bg-gray-950 pt-10">
        <View className="flex-row justify-between items-center px-5 pb-5 bg-white dark:bg-gray-900">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">친구 찾기</Text>
          <TouchableOpacity onPress={onClose} className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 justify-center items-center">
            <MaterialIcons name="close" size={24} color="#4b5563" />
          </TouchableOpacity>
        </View>

        <View className="flex-row px-5 pt-5 gap-2">
          <View className="flex-1 flex-row items-center h-12 bg-white dark:bg-gray-900 rounded-xl px-4 border-2 border-gray-200 dark:border-gray-700 gap-2">
            <MaterialIcons name="search" size={20} color="#9ca3af" />
            <TextInput
              className="flex-1 text-base text-gray-900 dark:text-white"
              placeholder="아이디/이름 검색 (영문 대소문자 구분)"
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={onSearchQueryChange}
              onSubmitEditing={onSearch}
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity className="h-12 px-5 bg-blue-600 dark:bg-blue-500 rounded-xl justify-center items-center" onPress={onSearch}>
            <Text className="text-white text-base font-semibold">검색</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={searchResults || []}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id}
          className="flex-1 mt-5"
          contentContainerStyle={{ paddingHorizontal: 20 }}
          ListEmptyComponent={
            searchResults !== null ? (
              <View className="items-center py-12 px-5">
                <Text className="text-6xl mb-4">🔍</Text>
                <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-2">검색 결과가 없습니다</Text>
                <Text className="text-base text-gray-500 dark:text-gray-400 text-center">정확한 아이디나 이름을 입력했는지 확인해보세요</Text>
              </View>
            ) : (
              <View className="items-center py-12 px-5">
                <Text className="text-6xl mb-4">👋</Text>
                <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-2">친구를 찾아보세요</Text>
                <Text className="text-base text-gray-500 dark:text-gray-400 text-center">아이디 또는 이름으로 검색할 수 있습니다</Text>
              </View>
            )
          }
        />
      </View>
    </Modal>
  );
}

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
    <TouchableOpacity className="flex-row items-center bg-background rounded-xl p-4 mb-2 shadow-sm" onPress={() => onUserSelect(item.id)} activeOpacity={0.7}>
      <View className="w-[52px] h-[52px] rounded-full bg-primary-500 justify-center items-center mr-4">
        <Text className="text-white text-xl font-semibold">{item.name[0]}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground mb-0.5">{item.name}</Text>
        <Text className="text-sm text-muted-foreground">@{item.username}</Text>
      </View>
      <TouchableOpacity
        className="w-10 h-10 rounded-full bg-primary-500/20 justify-center items-center"
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
      <View className="flex-1 bg-background pt-10">
        <View className="flex-row justify-between items-center px-4 pb-5 bg-background">
          <Text className="text-2xl font-semibold text-foreground">친구 찾기</Text>
          <TouchableOpacity onPress={onClose} className="w-10 h-10 rounded-lg bg-secondary justify-center items-center">
            <MaterialIcons name="close" size={24} color="#4b5563" />
          </TouchableOpacity>
        </View>

        <View className="flex-row px-4 pt-5 gap-2">
          <View className="flex-1 flex-row items-center bg-secondary border border-border rounded-xl p-4 gap-2">
            <MaterialIcons name="search" size={20} color="#9ca3af" />
            <TextInput
              className="flex-1 text-base text-foreground"
              placeholder="아이디/이름 검색 (영문 대소문자 구분)"
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={onSearchQueryChange}
              onSubmitEditing={onSearch}
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity className="bg-primary-500 rounded-xl p-4 justify-center items-center" onPress={onSearch}>
            <Text className="text-white text-base font-semibold">검색</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={searchResults || []}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id}
          className="flex-1 mt-5"
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ListEmptyComponent={
            searchResults !== null ? (
              <View className="items-center py-12 px-4">
                <Text className="text-6xl mb-4">🔍</Text>
                <Text className="text-xl font-medium text-foreground mb-2">검색 결과가 없습니다</Text>
                <Text className="text-base text-muted-foreground text-center">정확한 아이디나 이름을 입력했는지 확인해보세요</Text>
              </View>
            ) : (
              <View className="items-center py-12 px-4">
                <Text className="text-6xl mb-4">👋</Text>
                <Text className="text-xl font-medium text-foreground mb-2">친구를 찾아보세요</Text>
                <Text className="text-base text-muted-foreground text-center">아이디 또는 이름으로 검색할 수 있습니다</Text>
              </View>
            )
          }
        />
      </View>
    </Modal>
  );
}

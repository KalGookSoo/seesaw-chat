import React from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface CreateChatRoomModalProps {
  visible: boolean;
  onClose: () => void;
  selectedFriendsCount: number;
  newChatRoomName: string;
  onNameChange: (text: string) => void;
  onCreate: () => void;
}

export function CreateChatRoomModal({ visible, onClose, selectedFriendsCount, newChatRoomName, onNameChange, onCreate }: CreateChatRoomModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-center items-center p-6">
        <View className="w-full bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">새 채팅방 생성</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-6">{selectedFriendsCount}명의 친구 초대됨</Text>

          <TextInput
            className="h-[52px] bg-gray-100 dark:bg-gray-800 rounded-xl px-4 text-base text-gray-900 dark:text-white mb-6"
            placeholder="채팅방 이름을 입력하세요"
            placeholderTextColor="#9ca3af"
            value={newChatRoomName}
            onChangeText={onNameChange}
            autoFocus
          />

          <View className="flex-row gap-4">
            <TouchableOpacity className="flex-1 h-[52px] rounded-xl bg-gray-100 dark:bg-gray-800 justify-center items-center" onPress={onClose}>
              <Text className="text-base text-gray-600 dark:text-gray-300 font-semibold">취소</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-[2] h-[52px] rounded-xl bg-blue-600 dark:bg-blue-500 justify-center items-center" onPress={onCreate}>
              <Text className="text-base text-white font-bold">생성하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

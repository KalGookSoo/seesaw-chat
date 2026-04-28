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
        <View className="w-full bg-background rounded-2xl p-6 shadow-xl">
          <Text className="text-2xl font-semibold text-foreground">새 채팅방 생성</Text>
          <Text className="text-sm text-muted-foreground mb-6">{selectedFriendsCount}명의 친구 초대됨</Text>

          <TextInput
            className="bg-secondary border border-border rounded-xl p-4 text-foreground text-base mb-6"
            placeholder="채팅방 이름을 입력하세요"
            placeholderTextColor="#8E8E93"
            value={newChatRoomName}
            onChangeText={onNameChange}
            autoFocus
          />

          <View className="flex-row gap-4">
            <TouchableOpacity className="flex-1 rounded-xl bg-secondary p-4 justify-center items-center" onPress={onClose}>
              <Text className="text-base text-secondary-foreground font-semibold">취소</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-[2] rounded-xl bg-primary-500 p-4 justify-center items-center" onPress={onCreate}>
              <Text className="text-base text-white font-semibold">생성하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

import React from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '@/constants/design';

interface CreateChatRoomModalProps {
  visible: boolean;
  onClose: () => void;
  selectedFriendsCount: number;
  newChatRoomName: string;
  onNameChange: (text: string) => void;
  onCreate: () => void;
}

export function CreateChatRoomModal({
  visible,
  onClose,
  selectedFriendsCount,
  newChatRoomName,
  onNameChange,
  onCreate,
}: CreateChatRoomModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.createRoomCard}>
          <Text style={styles.modalTitle}>새 채팅방 생성</Text>
          <Text style={styles.modalSubtitle}>{selectedFriendsCount}명의 친구 초대됨</Text>

          <TextInput
            style={styles.roomNameInput}
            placeholder="채팅방 이름을 입력하세요"
            value={newChatRoomName}
            onChangeText={onNameChange}
            autoFocus
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onCreate}>
              <Text style={styles.confirmButtonText}>생성하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  createRoomCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.lg,
  },
  roomNameInput: {
    height: 52,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    marginBottom: spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    fontWeight: fontWeight.semibold,
  },
  confirmButton: {
    flex: 2,
    height: 52,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: fontSize.base,
    color: '#fff',
    fontWeight: fontWeight.bold,
  },
});

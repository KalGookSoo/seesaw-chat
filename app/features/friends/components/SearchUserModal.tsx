import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { borderRadius, colors, fontSize, fontWeight, shadows, spacing } from '@/constants/design';
import type { UserResponse } from '@/services/mock-data';

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

export function SearchUserModal({
  visible,
  onClose,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  searchResults,
  onUserSelect,
  onSendRequest,
}: SearchUserModalProps) {
  const renderSearchResult = ({ item }: { item: UserResponse }) => (
    <TouchableOpacity style={styles.searchResultCard} onPress={() => onUserSelect(item.id)} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name[0]}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendUsername}>@{item.username}</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={(e) => {
          e.stopPropagation();
          onSendRequest(item);
        }}
      >
        <IconSymbol name="plus" size={20} color={colors.primary[600]} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>친구 찾기</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color={colors.gray[600]} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <IconSymbol name="magnifyingglass" size={20} color={colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="아이디/이름 검색 (영문 대소문자 구분)"
              placeholderTextColor={colors.gray[400]}
              value={searchQuery}
              onChangeText={onSearchQueryChange}
              onSubmitEditing={onSearch}
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={onSearch}>
            <Text style={styles.searchButtonText}>검색</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={searchResults || []}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id}
          style={styles.searchResults}
          contentContainerStyle={styles.searchResultsContent}
          ListEmptyComponent={
            searchResults !== null ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>검색 결과가 없습니다</Text>
                <Text style={styles.emptySubtitle}>정확한 아이디나 이름을 입력했는지 확인해보세요</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👋</Text>
                <Text style={styles.emptyTitle}>친구를 찾아보세요</Text>
                <Text style={styles.emptySubtitle}>아이디 또는 이름으로 검색할 수 있습니다</Text>
              </View>
            )
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background.primary,
  },
  modalTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray[200],
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
  searchButton: {
    height: 48,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  searchResults: {
    flex: 1,
    marginTop: spacing.lg,
  },
  searchResultsContent: {
    paddingHorizontal: spacing.lg,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
});

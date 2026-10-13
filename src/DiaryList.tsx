import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderIconButton } from './HeaderButtons';
import type { DiaryEntry } from './types';

type DiaryListProps = {
  entries: DiaryEntry[];
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
};

export default function DiaryList({ entries, onSelect, onAdd, onDelete }: DiaryListProps) {
  const insets = useSafeAreaInsets();

  const confirmDelete = (entry: DiaryEntry, onCancel: () => void) => {
    const mediaCount = entry.photos?.length ?? 0;
    Alert.alert(
      'Delete entry?',
      mediaCount > 0
        ? `"${entry.title}" and its ${mediaCount} ${mediaCount === 1 ? 'photo or video' : 'photos and videos'} will be permanently deleted.`
        : `"${entry.title}" will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(entry.id) },
      ],
      { cancelable: true, onDismiss: onCancel }
    );
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Text style={styles.headerTitle}>Progress Diary</Text>
        <View style={styles.headerButtons}>
          <HeaderIconButton ios="add" android="add" accessibilityLabel="Add entry" onPress={onAdd} />
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}>
        {entries.map((entry) => (
          <Swipeable
            key={entry.id}
            renderRightActions={(_progress, _drag, swipeable) => (
              <View style={styles.rightActionContainer}>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => confirmDelete(entry, () => swipeable.close())}
                  accessibilityRole="button"
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              </View>
            )}
          >
            <Pressable
              onPress={() => onSelect(entry.id)}
              style={styles.listItem}
            >
              <Text style={styles.itemTitle}>{entry.title}</Text>
              <Text style={styles.itemDate}>{entry.date}</Text>
              <Text numberOfLines={2} style={styles.itemContent}>
                {entry.content}
              </Text>
            </Pressable>
          </Swipeable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f8fb',
  },
  header: {
    paddingBottom: 4,
    paddingLeft: 20,
    paddingRight: Platform.OS === 'ios' ? 12 : 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1f69ff',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemDate: {
    color: '#667085',
    marginBottom: 8,
    fontSize: 13,
  },
  itemContent: {
    color: '#4b5563',
    fontSize: 15,
    lineHeight: 22,
  },
  rightActionContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 12,
    marginBottom: 14,
  },
  deleteButton: {
    backgroundColor: '#ff4d4f',
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

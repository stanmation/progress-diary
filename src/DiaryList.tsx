import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import type { DiaryEntry } from './types';

type DiaryListProps = {
  entries: DiaryEntry[];
  onSelect: (id: string) => void;
  onAdd: () => void;
  onTimelinePress: () => void;
  onDelete: (id: string) => void;
};

export default function DiaryList({ entries, onSelect, onAdd, onTimelinePress, onDelete }: DiaryListProps) {
  const hasPhotos = entries.some((entry) => (entry.photos?.length ?? 0) > 0);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress Diary</Text>
        <View style={styles.headerButtons}>
          {hasPhotos && (
            <Pressable onPress={onTimelinePress} style={styles.timelineButton}>
              <Text style={styles.timelineButtonText}>📷</Text>
            </Pressable>
          )}
          <Pressable onPress={onAdd} style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {entries.map((entry) => (
          <Swipeable
            key={entry.id}
            renderRightActions={() => (
              <View style={styles.rightActionContainer}>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => onDelete(entry.id)}
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
    height: 80,
    paddingTop: 32,
    paddingHorizontal: 20,
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
  timelineButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  timelineButtonText: {
    fontSize: 20,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#1f69ff',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DiaryEntry } from './types';

type DiaryPhotosTimelineProps = {
  entries: DiaryEntry[];
  onBack: () => void;
};

export default function DiaryPhotosTimeline({
  entries,
  onBack,
}: DiaryPhotosTimelineProps) {
  const photoEntries = entries
    .flatMap((entry) =>
      (entry.photos ?? []).map((photo) => ({
        ...photo,
        entryTitle: entry.title,
        entryDate: entry.date,
      }))
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? b.selectedAt).getTime() -
        new Date(a.createdAt ?? a.selectedAt).getTime()
    );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Photo Timeline</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.timelineContainer}>
        {photoEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No photos yet</Text>
            <Text style={styles.emptySubtext}>
              Add photos to your diary entries to see them here
            </Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {/* Vertical line */}
            <View style={styles.verticalLine} />

            {/* Timeline items */}
            <View style={styles.timelineContent}>
              {photoEntries.map((photo) => (
                <View key={photo.id} style={styles.timelineItem}>
                  <View style={styles.dotContainer}>
                    <View style={styles.dot} />
                  </View>

                  <View style={styles.photoCard}>
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.photoImage}
                      resizeMode="cover"
                    />
                    <View style={styles.photoInfo}>
                      <Text style={styles.photoTitle}>{photo.entryTitle}</Text>
                      <Text style={styles.photoDate}>
                        {new Date(photo.createdAt ?? photo.selectedAt).toLocaleString()}
                      </Text>
                      <Text style={styles.photoDate}>{photo.entryDate}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
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
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  backButtonText: {
    color: '#1f69ff',
    fontWeight: '700',
  },
  timelineContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  timeline: {
    position: 'relative',
  },
  verticalLine: {
    position: 'absolute',
    left: 19,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#1f69ff',
  },
  timelineContent: {
    marginLeft: 60,
  },
  timelineItem: {
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dotContainer: {
    position: 'absolute',
    left: -50,
    top: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1f69ff',
    borderWidth: 3,
    borderColor: '#f7f8fb',
  },
  photoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  photoImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  photoInfo: {
    padding: 16,
  },
  photoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  photoDate: {
    fontSize: 13,
    color: '#667085',
  },
});

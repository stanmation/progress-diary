import React from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderBackButton } from './HeaderButtons';
import type { DiaryEntry } from './types';
import VideoThumbnailView from './VideoThumbnailView';

type DiaryPhotosTimelineProps = {
  entries: DiaryEntry[];
  onBack: () => void;
};

export default function DiaryPhotosTimeline({
  entries,
  onBack,
}: DiaryPhotosTimelineProps) {
  const insets = useSafeAreaInsets();
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
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerSide}>
          <HeaderBackButton onPress={onBack} />
        </View>
        <Text style={styles.headerTitle} numberOfLines={1}>Media Timeline</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={[styles.timelineContainer, { paddingBottom: insets.bottom + 40 }]}>
        {photoEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No media yet</Text>
            <Text style={styles.emptySubtext}>
              Add photos or videos to your diary entries to see them here
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
                    {photo.mediaType === 'video' ? (
                      <VideoThumbnailView uri={photo.uri} style={styles.photoImage} />
                    ) : (
                      <Image
                        source={{ uri: photo.uri }}
                        style={styles.photoImage}
                        resizeMode="cover"
                      />
                    )}
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
    paddingBottom: 4,
    paddingHorizontal: Platform.OS === 'ios' ? 16 : 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1f69ff',
  },
  // iOS: centered semibold nav bar title. Android: left-aligned Material top app bar title.
  headerTitle: {
    flex: 1,
    color: '#fff',
    ...Platform.select({
      ios: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
      default: { fontSize: 22, fontWeight: '400', textAlign: 'left', marginLeft: 12 },
    }),
  },
  headerSide: {
    width: Platform.OS === 'ios' ? 80 : 48,
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

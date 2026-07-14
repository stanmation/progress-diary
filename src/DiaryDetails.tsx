import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { DiaryEntry, DiaryPhoto } from './types';

type DiaryDetailsProps = {
  entry: DiaryEntry;
  onBack: () => void;
  onPhotoSelect?: (photo: DiaryPhoto) => void;
};

export default function DiaryDetails({ entry, onBack, onPhotoSelect }: DiaryDetailsProps) {
  const [hasPhotoPermission, setHasPhotoPermission] = useState<boolean | null>(null);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      setHasPhotoPermission(false);
      alert('Permission to access camera roll is required!');
      return;
    }

    setHasPhotoPermission(true);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const photo: DiaryPhoto = {
        id: String(Date.now()),
        uri: asset.uri,
        selectedAt: new Date().toISOString(),
        createdAt: asset.exif?.DateTimeOriginal ?? undefined,
        fileName: asset.fileName ?? undefined,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
      };
      onPhotoSelect?.(photo);
    }
  };

  const sortedPhotos = [...(entry.photos ?? [])].sort(
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
        <Text style={styles.headerTitle}>Timeline</Text>
        <Pressable onPress={pickImage} style={styles.photoButton}>
          <Text style={styles.photoButtonText}>📷</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.timelineContainer}>
        <View style={styles.timeline}>
          <View style={styles.verticalLine} />

          <View style={styles.timelineContent}>
            {sortedPhotos.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No photos yet. Tap the camera to add one.
                </Text>
              </View>
            ) : (
              sortedPhotos.map((photo) => (
                <View key={photo.id} style={styles.timelineItem}>
                  <View style={styles.dotContainer}>
                    <View style={styles.dot} />
                  </View>

                  <View style={styles.timelineCard}>
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.photoImage}
                      resizeMode="cover"
                    />
                    <View style={styles.photoInfo}>
                      <Text style={styles.photoTitle}>
                        Photo selected
                      </Text>
                      <Text style={styles.photoDate}>
                        {new Date(photo.createdAt ?? photo.selectedAt).toLocaleString()}
                      </Text>
                      {photo.fileName ? (
                        <Text style={styles.fileMeta}>{photo.fileName}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
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
  photoButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    fontSize: 20,
  },
  timelineContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  timeline: {
    position: 'relative',
  },
  verticalLine: {
    position: 'absolute',
    left: 20,
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
  timelineCard: {
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
    height: 240,
    backgroundColor: '#e0e0e0',
  },
  photoPlaceholder: {
    width: '100%',
    height: 240,
    backgroundColor: '#e9eff8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  photoPlaceholderText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  photoInfo: {
    padding: 18,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  detailDate: {
    color: '#64748b',
    marginBottom: 12,
  },
  detailContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#334155',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 16,
  },
  fileMeta: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
  },
  photoTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  photoDate: {
    color: '#64748b',
    marginBottom: 12,
  },
  photoContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#334155',
  },
});


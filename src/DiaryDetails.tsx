import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  SectionList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { DiaryEntry, DiaryPhoto } from './types';
import PhotoViewer from './PhotoViewer';

type DiaryDetailsProps = {
  entry: DiaryEntry;
  onBack: () => void;
  onPhotoSelect?: (photo: DiaryPhoto) => void;
  onPhotoUpdate?: (photoId: string, patch: Partial<DiaryPhoto>) => void;
  onPhotoDelete?: (photoId: string) => void;
  onEntryUpdate?: (patch: Partial<DiaryEntry>) => void;
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// EXIF's date tags are 'YYYY:MM:DD HH:MM:SS' (colons in the date part), which
// new Date() can't parse. Rebuild from numeric parts into an ISO string so it
// matches selectedAt's format used for sorting/display.
function exifDateToISO(raw?: string): string | undefined {
  if (!raw) return undefined;
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(raw);
  if (!m) return undefined;
  const [y, mo, d, h, mi, s] = [m[1], m[2], m[3], m[4], m[5], m[6]].map(Number);
  return new Date(y, mo - 1, d, h, mi, s).toISOString();
}

// The creation date can live under several EXIF tags, and iOS sometimes nests
// them in '{Exif}' / '{TIFF}' sub-dictionaries instead of at the top level.
// Try each known location and take the first that parses.
function readExifDate(exif?: Record<string, any> | null): string | undefined {
  if (!exif) return undefined;
  const candidates = [
    exif.DateTimeOriginal,
    exif.DateTimeDigitized,
    exif.DateTime,
    exif['{Exif}']?.DateTimeOriginal,
    exif['{Exif}']?.DateTimeDigitized,
    exif['{TIFF}']?.DateTime,
  ];
  for (const candidate of candidates) {
    const iso = exifDateToISO(candidate);
    if (iso) return iso;
  }
  return undefined;
}

// Parse the diary date without relying on Hermes' strict Date parser or Intl.
// Handles both 'YYYY-MM-DD' (seed data) and 'M/D/YYYY' (toLocaleDateString).
function parseEntryDate(raw: string): { day: string; month: string } {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (isoMatch) {
    const [, , month, day] = isoMatch;
    return { day, month: MONTHS[Number(month) - 1] ?? '' };
  }

  const localeMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(raw);
  if (localeMatch) {
    // Ambiguous M/D/Y (US) vs D/M/Y (most other locales): if the first part is
    // greater than 12 it can only be the day, so swap.
    const first = Number(localeMatch[1]);
    const second = Number(localeMatch[2]);
    const [monthNum, dayNum] = first > 12 ? [second, first] : [first, second];
    return {
      day: String(dayNum).padStart(2, '0'),
      month: MONTHS[monthNum - 1] ?? '',
    };
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return {
      day: String(parsed.getDate()).padStart(2, '0'),
      month: MONTHS[parsed.getMonth()] ?? '',
    };
  }

  // Give up on parsing but still show something rather than a blank column.
  return { day: raw, month: '' };
}

export default function DiaryDetails({
  entry,
  onBack,
  onPhotoSelect,
  onPhotoUpdate,
  onPhotoDelete,
  onEntryUpdate,
}: DiaryDetailsProps) {
  const [hasPhotoPermission, setHasPhotoPermission] = useState<boolean | null>(null);
  // A photo picked without a creation date, waiting for the user to set one.
  const [pendingPhoto, setPendingPhoto] = useState<DiaryPhoto | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<DiaryPhoto | null>(null);
  const [editingContent, setEditingContent] = useState(false);
  const [contentDraft, setContentDraft] = useState(entry.content ?? '');
  const today = useMemo(() => new Date(), []);
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(today.getMonth()); // 0-11
  const [pickerDay, setPickerDay] = useState(today.getDate());

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
      // allowsEditing (cropping) strips EXIF on iOS, so keep it off to preserve
      // the photo's original creation date. exif:true asks for the metadata.
      allowsEditing: false,
      exif: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const photo: DiaryPhoto = {
        id: String(Date.now()),
        uri: asset.uri,
        selectedAt: new Date().toISOString(),
        createdAt: exifDateToISO(asset.exif?.DateTimeOriginal),
        fileName: asset.fileName ?? undefined,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
      };

      // No creation-date metadata on the photo — ask the user to set one
      // manually before saving instead of leaving it undated.
      if (!photo.createdAt) {
        setPickerYear(today.getFullYear());
        setPickerMonth(today.getMonth());
        setPickerDay(today.getDate());
        setPendingPhoto(photo);
        return;
      }

      onPhotoSelect?.(photo);
    }
  };

  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
  // Clamp the day if the chosen month/year has fewer days (e.g. 31 -> Feb).
  const safeDay = Math.min(pickerDay, daysInMonth);
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const yearOptions = Array.from({ length: 20 }, (_, i) => today.getFullYear() - i);

  const confirmPhotoDate = () => {
    if (!pendingPhoto) return;
    // Build the ISO string from numeric parts (avoids Date string parsing) so
    // it matches selectedAt's format used everywhere for sorting/display.
    const createdAt = new Date(pickerYear, pickerMonth, safeDay).toISOString();
    onPhotoSelect?.({ ...pendingPhoto, createdAt });
    setPendingPhoto(null);
  };

  const skipPhotoDate = () => {
    if (!pendingPhoto) return;
    onPhotoSelect?.(pendingPhoto);
    setPendingPhoto(null);
  };

  const sortedPhotos = [...(entry.photos ?? [])].sort(
    (a, b) =>
      new Date(b.createdAt ?? b.selectedAt).getTime() -
      new Date(a.createdAt ?? a.selectedAt).getTime()
  );

  // Group photos into sections by year for a sticky section header
  const sections = (() => {
    const map = new Map<number, typeof sortedPhotos>();
    for (const photo of sortedPhotos) {
      const ts = photo.createdAt ?? photo.selectedAt;
      const year = new Date(ts).getFullYear();
      const arr = map.get(year) ?? [];
      arr.push(photo);
      map.set(year, arr);
    }
    // Sort years descending so newest year appears first
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, data]) => ({ title: String(year), data }));
  })();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {entry.title}
        </Text>
        <View style={styles.headerSide} />
      </View>

      <SectionList
        contentContainerStyle={styles.contentContainer}
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <Pressable onPress={() => {
            setContentDraft(entry.content ?? '');
            setEditingContent(true);
          }}>
            <Text style={styles.entryContent}>{entry.content}</Text>
          </Pressable>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>No photo yet. Tap the camera to add one.</Text>}
        renderSectionHeader={({ section }) => (
          <View style={styles.yearHeader}>
            <Text style={styles.yearHeaderText}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item: photo }) => {
          const { day, month } = parseEntryDate(photo.createdAt ?? photo.selectedAt);
          return (
            <View key={photo.id} style={styles.entryRow}>
              <View style={styles.dateColumn}>
                <Text style={styles.dayNumber} numberOfLines={1}>
                  {day}
                </Text>
                <Text style={styles.monthLabel} numberOfLines={1}>
                  {month}
                </Text>
              </View>

              <View style={styles.detailColumn}>
                <Pressable onPress={() => setViewingPhoto(photo)}>
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                </Pressable>
                <Pressable onPress={() => setViewingPhoto(photo)}>
                  <Text style={[styles.descriptionInput, styles.descriptionReadOnly]} numberOfLines={3}>
                    {photo.description ?? ''}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        stickySectionHeadersEnabled
      />

      <Pressable
        onPress={pickImage}
        style={styles.floatingPhotoButton}
        accessibilityLabel="Add photo"
      >
        <Text style={styles.floatingPhotoButtonText}>📷</Text>
      </Pressable>

      <Modal
        visible={pendingPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={skipPhotoDate}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>When was this taken?</Text>
            <Text style={styles.modalSubtitle}>
              This photo has no creation date. Pick one to place it on the timeline.
            </Text>

            {pendingPhoto ? (
              <Image
                source={{ uri: pendingPhoto.uri }}
                style={styles.modalPreview}
                resizeMode="cover"
              />
            ) : null}

            <View style={styles.pickerRow}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView style={styles.pickerScroll}>
                  {dayOptions.map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => setPickerDay(d)}
                      style={[styles.pickerItem, safeDay === d && styles.pickerItemSelected]}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          safeDay === d && styles.pickerItemTextSelected,
                        ]}
                      >
                        {d}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView style={styles.pickerScroll}>
                  {MONTHS.map((m, i) => (
                    <Pressable
                      key={m}
                      onPress={() => setPickerMonth(i)}
                      style={[styles.pickerItem, pickerMonth === i && styles.pickerItemSelected]}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          pickerMonth === i && styles.pickerItemTextSelected,
                        ]}
                      >
                        {m}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView style={styles.pickerScroll}>
                  {yearOptions.map((y) => (
                    <Pressable
                      key={y}
                      onPress={() => setPickerYear(y)}
                      style={[styles.pickerItem, pickerYear === y && styles.pickerItemSelected]}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          pickerYear === y && styles.pickerItemTextSelected,
                        ]}
                      >
                        {y}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={skipPhotoDate} style={[styles.modalButton, styles.modalButtonGhost]}>
                <Text style={styles.modalButtonGhostText}>Skip</Text>
              </Pressable>
              <Pressable onPress={confirmPhotoDate} style={[styles.modalButton, styles.modalButtonPrimary]}>
                <Text style={styles.modalButtonPrimaryText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <PhotoViewer
        visible={viewingPhoto !== null}
        photo={viewingPhoto}
        onClose={() => setViewingPhoto(null)}
        onSave={(photoId, patch) => onPhotoUpdate?.(photoId, patch)}
        onDelete={(photoId) => {
          onPhotoDelete?.(photoId);
        }}
      />

      <Modal
        visible={editingContent}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingContent(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit entry</Text>
            <TextInput
              style={[styles.descriptionInput, { minHeight: 120 }]}
              value={contentDraft}
              onChangeText={setContentDraft}
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable onPress={() => setEditingContent(false)} style={[styles.modalButton, styles.modalButtonGhost]}>
                <Text style={styles.modalButtonGhostText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => {
                onEntryUpdate?.({ content: contentDraft });
                setEditingContent(false);
              }} style={[styles.modalButton, styles.modalButtonPrimary]}>
                <Text style={styles.modalButtonPrimaryText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    flex: 1,
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSide: {
    width: 70,
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
  contentContainer: {
    padding: 20,
    paddingBottom: 112,
  },
  floatingPhotoButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1f69ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
  },
  floatingPhotoButtonText: {
    fontSize: 24,
  },
  entryContent: {
    fontSize: 18,
    lineHeight: 26,
    color: '#334155',
    marginBottom: 24,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 28,
  },
  dateColumn: {
    width: 72,
    alignItems: 'flex-start',
    paddingRight: 16,
    paddingTop: 4,
  },
  dayNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1e293b',
    lineHeight: 40,
  },
  monthLabel: {
    fontSize: 18,
    color: '#94a3b8',
    marginTop: 2,
  },
  detailColumn: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
  },
  photoImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  descriptionInput: {
    fontSize: 16,
    lineHeight: 22,
    color: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 44,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
    marginBottom: 14,
  },
  modalPreview: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
    textAlign: 'center',
  },
  pickerScroll: {
    height: 160,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  pickerItem: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#1f69ff',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#334155',
  },
  pickerItemTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  yearHeader: {
    width: '100%',
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    marginBottom: 8,
    justifyContent: 'center',
  },
  yearHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
    paddingLeft: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonGhost: {
    backgroundColor: '#f1f5f9',
  },
  modalButtonGhostText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 16,
  },
  modalButtonPrimary: {
    backgroundColor: '#1f69ff',
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  descriptionReadOnly: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#334155',
    minHeight: 44,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  // viewer styles moved to PhotoViewer.tsx
});


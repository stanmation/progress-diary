import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
  View,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { DiaryPhoto } from './types';

type PhotoViewerProps = {
  visible: boolean;
  photo: DiaryPhoto | null;
  onClose: () => void;
  onSaveDate: (photoId: string, createdAt: string) => void;
  onSave: (photoId: string, patch: Partial<DiaryPhoto>) => void;
  onDelete: (photoId: string) => void;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WHEEL_ITEM_HEIGHT = 40;
const WHEEL_HEIGHT = 200;
const WHEEL_PADDING = (WHEEL_HEIGHT - WHEEL_ITEM_HEIGHT) / 2;
const DATE_PICKER_LABEL_HEIGHT = 14;
const DATE_PICKER_LABEL_GAP = 6;

function getPhotoDate(photo: DiaryPhoto): Date {
  const date = new Date(photo.createdAt ?? photo.selectedAt);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatPhotoDate(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function VideoPlayback({ uri, style }: { uri: string; style: StyleProp<ViewStyle> }) {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.play();
  });

  return <VideoView player={player} style={style} contentFit="contain" nativeControls />;
}

export default function PhotoViewer({ visible, photo, onClose, onSaveDate, onSave, onDelete }: PhotoViewerProps) {
  const [draft, setDraft] = useState<string | undefined>(photo?.description);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => photo ? getPhotoDate(photo).getFullYear() : new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(() => photo ? getPhotoDate(photo).getMonth() : new Date().getMonth());
  const [pickerDay, setPickerDay] = useState(() => photo ? getPhotoDate(photo).getDate() : new Date().getDate());
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const dayWheelRef = useRef<ScrollView>(null);
  const monthWheelRef = useRef<ScrollView>(null);
  const yearWheelRef = useRef<ScrollView>(null);
  const FOOTER_HEIGHT = 250;
  const HEADER_HEIGHT = Platform.OS === 'ios' ? 88 : 72;
  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
  const safeDay = Math.min(pickerDay, daysInMonth);
  const dayOptions = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const yearOptions = Array.from(
    { length: new Date().getFullYear() + 5 - 1800 + 1 },
    (_, index) => new Date().getFullYear() + 5 - index
  );
  const yearIndex = Math.max(0, yearOptions.indexOf(pickerYear));

  const centerPickerWheels = () => {
    dayWheelRef.current?.scrollTo({ y: (safeDay - 1) * WHEEL_ITEM_HEIGHT, animated: false });
    monthWheelRef.current?.scrollTo({ y: pickerMonth * WHEEL_ITEM_HEIGHT, animated: false });
    yearWheelRef.current?.scrollTo({ y: yearIndex * WHEEL_ITEM_HEIGHT, animated: false });
  };

  useEffect(() => {
    setDraft(photo?.description);
    if (photo) {
      const date = getPhotoDate(photo);
      setPickerYear(date.getFullYear());
      setPickerMonth(date.getMonth());
      setPickerDay(date.getDate());
    }
  }, [photo]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const windowHeight = Dimensions.get('window').height;
    const MAX_RATIO = 0.6; // don't let keyboard height exceed 60% of window
    const SAFE_MARGIN = 20; // keep a small gap from top

    const onShow = (e: any) => {
      const raw = e.endCoordinates?.height ?? 0;
      // Clamp to both a ratio of the window and ensure the footer stays visible
      const maxByRatio = Math.floor(windowHeight * MAX_RATIO);
      const maxAllowed = Math.max(0, windowHeight - FOOTER_HEIGHT - SAFE_MARGIN);
      const clamped = Math.min(raw, maxByRatio, maxAllowed);
      setKeyboardHeight(clamped);
    };
    const onHide = () => setKeyboardHeight(0);

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!datePickerVisible) return;
    const frame = requestAnimationFrame(centerPickerWheels);
    return () => cancelAnimationFrame(frame);
  }, [datePickerVisible, safeDay, pickerMonth, yearIndex]);

  if (!photo) return null;

  const savePhotoDate = () => {
    const createdAt = new Date(pickerYear, pickerMonth, safeDay).toISOString();
    onSaveDate(photo.id, createdAt);
    setDatePickerVisible(false);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.viewerContainer}>
          <View style={[styles.viewerHeader, { height: HEADER_HEIGHT }] }>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={({ pressed }) => [
                styles.viewerHeaderButton,
                pressed && styles.viewerHeaderButtonPressed,
              ]}
            >
              <Text style={styles.viewerCloseText}>{'Close'}</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Alert.alert(
                  'Delete',
                  'Are you sure you want to delete this entry?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        onDelete(photo.id);
                        onClose();
                      },
                    },
                  ],
                  { cancelable: true }
                );
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={({ pressed }) => [
                styles.viewerHeaderButton,
                pressed && styles.viewerHeaderButtonPressed,
              ]}
            >
              <Text style={styles.viewerDeleteText}>Delete</Text>
            </Pressable>
          </View>

          {photo.mediaType === 'video' ? (
            <VideoPlayback
              key={photo.uri}
              uri={photo.uri}
              style={[styles.viewerImage, { marginBottom: FOOTER_HEIGHT, marginTop: HEADER_HEIGHT }]}
            />
          ) : (
            <Image source={{ uri: photo.uri }} style={[styles.viewerImage, { marginBottom: FOOTER_HEIGHT, marginTop: HEADER_HEIGHT }]} resizeMode="contain" />
          )}

          <View
            style={[
              styles.viewerFooter,
              {
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: FOOTER_HEIGHT,
                transform: [{ translateY: -keyboardHeight }],
              },
            ]}
          >
            <Text style={styles.viewerLabel}>Description</Text>
            <TextInput
              style={styles.viewerDescriptionInput}
              value={draft ?? ''}
              onChangeText={setDraft}
              multiline
              placeholder="Add a description…"
              placeholderTextColor="#94a3b8"
            />
            <Pressable
              onPress={() => setDatePickerVisible(true)}
              style={({ pressed }) => [styles.dateField, pressed && styles.dateFieldPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Photo date, ${formatPhotoDate(getPhotoDate(photo))}`}
            >
              <View>
                <Text style={styles.dateFieldLabel}>Date</Text>
                <Text style={styles.dateFieldValue}>{formatPhotoDate(getPhotoDate(photo))}</Text>
              </View>
              <Text style={styles.dateFieldChevron}>›</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onSave(photo.id, { description: draft });
                onClose();
              }}
              style={styles.viewerSave}
            >
              <Text style={styles.viewerSaveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <Modal
        visible={datePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePickerVisible(false)}
        onShow={centerPickerWheels}
      >
        <View style={styles.dateModalOverlay}>
          <View style={styles.dateModalCard}>
            <Text style={styles.dateModalTitle}>Change photo date</Text>
            <Text style={styles.dateModalSubtitle}>Choose when this photo was taken.</Text>

            <View style={styles.datePickerRow}>
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>Day</Text>
                <ScrollView
                  ref={dayWheelRef}
                  style={styles.datePickerScroll}
                  contentContainerStyle={styles.datePickerWheelContent}
                  snapToInterval={WHEEL_ITEM_HEIGHT}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  showsVerticalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT);
                    setPickerDay(Math.max(1, Math.min(daysInMonth, index + 1)));
                  }}
                >
                  {dayOptions.map((day) => (
                    <Pressable
                      key={day}
                      onPress={() => setPickerDay(day)}
                      style={styles.datePickerItem}
                    >
                      <Text style={[styles.datePickerItemText, safeDay === day && styles.datePickerItemTextSelected]}>
                        {day}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>Month</Text>
                <ScrollView
                  ref={monthWheelRef}
                  style={styles.datePickerScroll}
                  contentContainerStyle={styles.datePickerWheelContent}
                  snapToInterval={WHEEL_ITEM_HEIGHT}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  showsVerticalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT);
                    setPickerMonth(Math.max(0, Math.min(MONTHS.length - 1, index)));
                  }}
                >
                  {MONTHS.map((month, index) => (
                    <Pressable
                      key={month}
                      onPress={() => setPickerMonth(index)}
                      style={styles.datePickerItem}
                    >
                      <Text style={[styles.datePickerItemText, pickerMonth === index && styles.datePickerItemTextSelected]}>
                        {month.slice(0, 3)}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>Year</Text>
                <ScrollView
                  ref={yearWheelRef}
                  style={styles.datePickerScroll}
                  contentContainerStyle={styles.datePickerWheelContent}
                  snapToInterval={WHEEL_ITEM_HEIGHT}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  showsVerticalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT);
                    setPickerYear(yearOptions[Math.max(0, Math.min(yearOptions.length - 1, index))]);
                  }}
                >
                  {yearOptions.map((year) => (
                    <Pressable
                      key={year}
                      onPress={() => setPickerYear(year)}
                      style={styles.datePickerItem}
                    >
                      <Text style={[styles.datePickerItemText, pickerYear === year && styles.datePickerItemTextSelected]}>
                        {year}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View pointerEvents="none" style={styles.datePickerSelectionBand} />
            </View>

            <View style={styles.dateModalActions}>
              <Pressable onPress={() => setDatePickerVisible(false)} style={styles.dateCancelButton}>
                <Text style={styles.dateCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={savePhotoDate} style={styles.dateSaveButton}>
                <Text style={styles.dateSaveText}>Save date</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerHeader: {
    // positioned absolute so it floats above the image
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 50,
    elevation: 50,
  },
  viewerCloseText: {
    color: '#1f69ff',
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  viewerDeleteText: {
    color: '#ef4444',
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  viewerHeaderButton: {
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerHeaderButtonPressed: {
    backgroundColor: '#eef2ff',
  },
  viewerImage: {
    flex: 1,
    width: '100%',
  },
  viewerFooter: {
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32,
    // keep a minimum height so layout is stable when keyboard hidden
    minHeight: 220,
  },
  viewerLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  viewerDescriptionInput: {
    minHeight: 56,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    color: '#111827',
    marginBottom: 12,
  },
  viewerSave: {
    backgroundColor: '#1f69ff',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewerSaveText: {
    color: '#fff',
    fontWeight: '700',
  },
  dateField: {
    minHeight: 44,
    marginBottom: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  dateFieldPressed: {
    backgroundColor: '#eef2f7',
  },
  dateFieldLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
  dateFieldValue: {
    marginTop: 2,
    color: '#111827',
    fontSize: 14,
  },
  dateFieldChevron: {
    color: '#64748b',
    fontSize: 24,
  },
  dateModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  dateModalCard: {
    width: '100%',
    maxWidth: 380,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  dateModalTitle: {
    color: '#111827',
    fontSize: 19,
    fontWeight: '800',
  },
  dateModalSubtitle: {
    marginTop: 4,
    marginBottom: 16,
    color: '#64748b',
    fontSize: 14,
  },
  datePickerRow: {
    position: 'relative',
    flexDirection: 'row',
    gap: 10,
  },
  datePickerColumn: {
    flex: 1,
  },
  datePickerLabel: {
    height: DATE_PICKER_LABEL_HEIGHT,
    marginBottom: 6,
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  datePickerScroll: {
    height: WHEEL_HEIGHT,
    overflow: 'hidden',
  },
  datePickerWheelContent: {
    paddingVertical: WHEEL_PADDING,
  },
  datePickerSelectionBand: {
    position: 'absolute',
    top: DATE_PICKER_LABEL_HEIGHT + DATE_PICKER_LABEL_GAP + WHEEL_PADDING,
    left: 0,
    right: 0,
    height: WHEEL_ITEM_HEIGHT,
    backgroundColor: 'rgba(31, 105, 255, 0.06)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#bfd2ff',
    zIndex: 2,
    elevation: 2,
  },
  datePickerItem: {
    height: WHEEL_ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  datePickerItemText: {
    color: '#334155',
    fontSize: 14,
  },
  datePickerItemTextSelected: {
    color: '#1f69ff',
    fontWeight: '700',
  },
  dateModalActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  dateCancelButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  dateCancelText: {
    color: '#334155',
    fontWeight: '700',
  },
  dateSaveButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#1f69ff',
  },
  dateSaveText: {
    color: '#fff',
    fontWeight: '700',
  },
});

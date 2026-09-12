import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import type { DiaryPhoto } from './types';

type PhotoViewerProps = {
  visible: boolean;
  photo: DiaryPhoto | null;
  onClose: () => void;
  onSave: (photoId: string, patch: Partial<DiaryPhoto>) => void;
  onDelete: (photoId: string) => void;
};

export default function PhotoViewer({ visible, photo, onClose, onSave, onDelete }: PhotoViewerProps) {
  const [draft, setDraft] = useState<string | undefined>(photo?.description);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const FOOTER_HEIGHT = 180;
  const HEADER_HEIGHT = Platform.OS === 'ios' ? 88 : 72;

  useEffect(() => {
    setDraft(photo?.description);
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

  if (!photo) return null;

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

          <Image source={{ uri: photo.uri }} style={[styles.viewerImage, { marginBottom: FOOTER_HEIGHT, marginTop: HEADER_HEIGHT }]} resizeMode="contain" />

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
    minHeight: 140,
  },
  viewerLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  viewerDescriptionInput: {
    minHeight: 80,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
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
});

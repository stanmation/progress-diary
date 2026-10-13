import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, BackHandler, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import DiaryDetails from './DiaryDetails';
import DiaryList from './DiaryList';
import DiaryPhotosTimeline from './DiaryPhotosTimeline';
import type { DiaryEntry, DiaryPhoto } from './types';

const STORAGE_KEY = '@progress_diary_entries';

const initialEntries: DiaryEntry[] = [
  {
    id: '1',
    title: 'Progress diary',
    date: '2026-07-11',
    content: 'This is the first diary entry. Tap an item to view details.',
    photos: [],
  },
];

type Screen = 'list' | 'details' | 'timeline';

// Slides a screen in from the right on mount, and back out to the right when `leaving` turns true.
function ScreenTransition({
  children,
  leaving,
  onExited,
}: {
  children: React.ReactNode;
  leaving: boolean;
  onExited: () => void;
}) {
  const { width } = useWindowDimensions();
  const slideProgress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(slideProgress, {
      toValue: 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [slideProgress]);

  useEffect(() => {
    if (!leaving) return;
    Animated.timing(slideProgress, {
      toValue: 1,
      duration: 240,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onExited();
    });
  }, [leaving]);

  const translateX = slideProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width],
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
      {children}
    </Animated.View>
  );
}

export default function App() {
  const [entries, setEntries] = useState<DiaryEntry[]>(initialEntries);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('list');
  const [isReady, setIsReady] = useState(false);
  // True while the details/timeline screen is sliding out over the list.
  const [isLeaving, setIsLeaving] = useState(false);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedId) ?? null,
    [entries, selectedId]
  );

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: DiaryEntry[] = JSON.parse(saved);
          setEntries(parsed);
        }
      } catch (error) {
        console.warn('Failed to load saved entries', error);
      } finally {
        setIsReady(true);
      }
    };

    loadEntries();
  }, []);

  useEffect(() => {
    const persistEntries = async () => {
      if (!isReady) return;
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      } catch (error) {
        console.warn('Failed to save entries', error);
      }
    };

    persistEntries();
  }, [entries, isReady]);

  // Android hardware back: return to the list from other screens; on the list, fall through to exit.
  useEffect(() => {
    if (currentScreen === 'list') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBackToList();
      return true;
    });
    return () => subscription.remove();
  }, [currentScreen]);

  const addEntry = () => {
    const nextId = String(Date.now());
    const newEntry: DiaryEntry = {
      id: nextId,
      title: `New diary entry`,
      date: new Date().toISOString().slice(0, 10),
      content: 'This is a new diary entry. Tap back to return to the list.',
      photos: [],
    };
    setEntries([newEntry, ...entries]);
    setSelectedId(nextId);
    setCurrentScreen('details');
  };

  // Starts the slide-out; the screen actually switches in finishGoBack once it completes.
  const goBackToList = () => {
    setIsLeaving(true);
  };

  const finishGoBack = () => {
    setIsLeaving(false);
    setCurrentScreen('list');
    setSelectedId(null);
  };

  const goToDetails = (id: string) => {
    setSelectedId(id);
    setCurrentScreen('details');
  };

  const goToTimeline = () => {
    setCurrentScreen('timeline');
  };

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setCurrentScreen('list');
    }
  };

  const handlePhotoSelect = (photo: DiaryPhoto) => {
    setEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.id === selectedId
          ? { ...entry, photos: [photo, ...(entry.photos ?? [])] }
          : entry
      )
    );
  };

  const handlePhotoUpdate = (photoId: string, patch: Partial<DiaryPhoto>) => {
    setEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.id === selectedId
          ? {
              ...entry,
              photos: (entry.photos ?? []).map((photo) =>
                photo.id === photoId ? { ...photo, ...patch } : photo
              ),
            }
          : entry
      )
    );
  };

  const handleEntryUpdate = (patch: Partial<DiaryEntry>) => {
    if (!selectedId) return;
    setEntries((prevEntries) =>
      prevEntries.map((entry) => (entry.id === selectedId ? { ...entry, ...patch } : entry))
    );
  };

  const handlePhotoDelete = (photoId: string) => {
    setEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.id === selectedId
          ? { ...entry, photos: (entry.photos ?? []).filter((p) => p.id !== photoId) }
          : entry
      )
    );
  };

  const list = (
    <DiaryList
      entries={entries}
      onSelect={goToDetails}
      onAdd={addEntry}
      onDelete={handleDeleteEntry}
    />
  );

  let overlay: React.ReactNode = null;
  if (currentScreen === 'timeline') {
    overlay = (
      <DiaryPhotosTimeline
        entries={entries}
        onBack={goBackToList}
      />
    );
  } else if (currentScreen === 'details' && selectedEntry) {
    overlay = (
      <DiaryDetails
        entry={selectedEntry}
        onBack={goBackToList}
        onPhotoSelect={handlePhotoSelect}
        onPhotoUpdate={handlePhotoUpdate}
        onPhotoDelete={handlePhotoDelete}
        onEntryUpdate={handleEntryUpdate}
      />
    );
  }

  // The list is only mounted underneath while the overlay slides out, so it's revealed as it goes.
  return (
    <View style={{ flex: 1 }}>
      {/* Light status bar icons to sit on the blue headers. */}
      <StatusBar style="light" />
      {(!overlay || isLeaving) && list}
      {overlay && (
        <ScreenTransition leaving={isLeaving} onExited={finishGoBack}>
          {overlay}
        </ScreenTransition>
      )}
    </View>
  );
}


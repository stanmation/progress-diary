import React, { useMemo, useState } from 'react';
import DiaryDetails from './DiaryDetails';
import DiaryList from './DiaryList';
import DiaryPhotosTimeline from './DiaryPhotosTimeline';
import type { DiaryEntry, DiaryPhoto } from './types';

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

export default function App() {
  const [entries, setEntries] = useState<DiaryEntry[]>(initialEntries);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('list');

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedId) ?? null,
    [entries, selectedId]
  );

  const addEntry = () => {
    const nextId = String(Date.now());
    const newEntry: DiaryEntry = {
      id: nextId,
      title: `New diary entry`,
      date: new Date().toLocaleDateString(),
      content: 'This is a new diary entry. Tap back to return to the list.',
    };
    setEntries([newEntry, ...entries]);
    setSelectedId(nextId);
    setCurrentScreen('details');
  };

  const goBackToList = () => {
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

  const handlePhotoSelect = (photo: DiaryPhoto) => {
    setEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.id === selectedId
          ? { ...entry, photos: [photo, ...(entry.photos ?? [])] }
          : entry
      )
    );
  };

  if (currentScreen === 'timeline') {
    return (
      <DiaryPhotosTimeline
        entries={entries}
        onBack={goBackToList}
      />
    );
  }

  if (currentScreen === 'details' && selectedEntry) {
    return (
      <DiaryDetails
        entry={selectedEntry}
        onBack={goBackToList}
        onPhotoSelect={handlePhotoSelect}
      />
    );
  }

  return (
    <DiaryList
      entries={entries}
      onSelect={goToDetails}
      onAdd={addEntry}
      onTimelinePress={goToTimeline}
    />
  );
}


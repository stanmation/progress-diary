export type DiaryPhoto = {
  id: string;
  uri: string;
  mediaType?: 'image' | 'video';
  selectedAt: string;
  createdAt?: string;
  description?: string;
  fileName?: string;
  width?: number;
  height?: number;
  fileSize?: number;
};

export type DiaryEntry = {
  id: string;
  title: string;
  date: string;
  content: string;
  photos?: DiaryPhoto[];
};


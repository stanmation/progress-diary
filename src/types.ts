export type DiaryPhoto = {
  id: string;
  uri: string;
  selectedAt: string;
  createdAt?: string;
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


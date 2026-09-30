import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { useVideoPlayer, type VideoThumbnail } from 'expo-video';
import {
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type VideoThumbnailViewProps = {
  uri: string;
  style: StyleProp<ViewStyle>;
};

export default function VideoThumbnailView({ uri, style }: VideoThumbnailViewProps) {
  const player = useVideoPlayer(uri);
  const [thumbnail, setThumbnail] = useState<VideoThumbnail | null>(null);

  useEffect(() => {
    let isMounted = true;

    player.generateThumbnailsAsync(0.2)
      .then(([frame]) => {
        if (isMounted && frame) setThumbnail(frame);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [player]);

  if (thumbnail) {
    return <Image source={thumbnail} style={style as StyleProp<ImageStyle>} contentFit="cover" />;
  }

  return (
    <View style={[style, styles.placeholder]}>
      <Text style={styles.playIcon}>▶</Text>
      <Text style={styles.videoLabel}>VIDEO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#172033',
  },
  playIcon: {
    color: '#fff',
    fontSize: 42,
  },
  videoLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
  },
});
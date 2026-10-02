import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView, type VideoThumbnail } from 'expo-video';
import {
  Platform,
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

    if (Platform.OS === 'web') {
      const showVideoFrame = () => {
        if (player.status !== 'readyToPlay') return;
        player.pause();
        player.muted = true;
        const duration = player.duration;
        player.currentTime = Number.isFinite(duration) && duration > 0
          ? Math.min(1, Math.max(0, duration - 0.05))
          : 1;
      };
      const subscription = player.addListener('statusChange', ({ status }) => {
        if (status === 'readyToPlay') showVideoFrame();
      });
      showVideoFrame();

      return () => {
        isMounted = false;
        subscription.remove();
      };
    }

    const generateThumbnail = async () => {
      for (const time of [1, 0.2, 0]) {
        try {
          const [frame] = await player.generateThumbnailsAsync(time, {
            maxWidth: 600,
            maxHeight: 600,
          });
          if (isMounted && frame) {
            setThumbnail(frame);
            return;
          }
        } catch {
          // Short clips may not have a frame at the requested timestamp.
        }
      }
    };

    generateThumbnail();

    return () => {
      isMounted = false;
    };
  }, [player]);

  return (
    <View style={[style, styles.frameContainer]}>
      {thumbnail ? (
        <Image
          source={thumbnail}
          style={styles.frameMedia as StyleProp<ImageStyle>}
          contentFit="cover"
        />
      ) : Platform.OS === 'web' ? (
        <VideoView
          player={player}
          style={styles.frameMedia}
          contentFit="cover"
          nativeControls={false}
        />
      ) : (
        <View style={[styles.frameMedia, styles.placeholder]} />
      )}
      <View pointerEvents="none" style={styles.playBadge}>
        <Text style={styles.playIcon}>▶</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frameContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  frameMedia: {
    ...StyleSheet.absoluteFill,
  },
  placeholder: {
    backgroundColor: '#172033',
  },
  playBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 48,
    height: 48,
    marginTop: -24,
    marginLeft: -24,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 3,
  },
});
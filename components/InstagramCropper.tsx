import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Image, PanResponder, StyleSheet, View, Text } from 'react-native';

const CROP_SIZE = Math.floor(Dimensions.get('window').width * 0.8); // 80% of screen width

type CropParams = { scale: number; pan: { x: number; y: number } };

interface InstagramCropperProps {
  uri: string;
  onReady?: () => void;
  onCropParamsChange?: (params: CropParams) => void;
}

export default function InstagramCropper({
  uri,
  onReady,
  onCropParamsChange,
}: InstagramCropperProps) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animated values
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastScale = useRef(1);
  const lastPan = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const prevDistance = useRef(0);

  useEffect(() => {
    if (!uri) return;
    setLoading(true);
    setError(null);
    Image.getSize(
      uri,
      (width, height) => {
        setImageSize({ width, height });
        setLoading(false);
        // Set cropParams immediately after image loads
        if (onCropParamsChange) {
          // Calculate display size and minScale
          const aspect = width / height;
          let displayW, displayH;
          if (aspect > 1) {
            displayW = CROP_SIZE * aspect;
            displayH = CROP_SIZE;
          } else {
            displayW = CROP_SIZE;
            displayH = CROP_SIZE / aspect;
          }
          const minScale = Math.max(
            CROP_SIZE / displayW,
            CROP_SIZE / displayH,
            1
          );
          onCropParamsChange({ scale: minScale, pan: { x: 0, y: 0 } });
        }
      },
      () => {
        setError('Failed to load image');
        setLoading(false);
      }
    );
  }, [uri]);

  // Calculate display size to fit image in crop area
  const getDisplaySize = () => {
    if (!imageSize.width || !imageSize.height) return { width: CROP_SIZE, height: CROP_SIZE };
    const aspect = imageSize.width / imageSize.height;
    if (aspect > 1) {
      return { width: CROP_SIZE * aspect, height: CROP_SIZE };
    } else {
      return { width: CROP_SIZE, height: CROP_SIZE / aspect };
    }
  };
  const displaySize = getDisplaySize();

  // Minimum scale so image always covers the crop circle
  const minScale = Math.max(
    CROP_SIZE / displaySize.width,
    CROP_SIZE / displaySize.height,
    1
  );
  const maxScale = 6;

  // PanResponder for Instagram-style pinch and pan
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, gesture) => {
        isPinching.current = false;
        prevDistance.current = 0;
      },
      onPanResponderMove: (e, gesture) => {
        if (gesture.numberActiveTouches === 2) {
          isPinching.current = true;
          const touches = e.nativeEvent.touches;
          if (touches.length === 2) {
            const dx = touches[0].pageX - touches[1].pageX;
            const dy = touches[0].pageY - touches[1].pageY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            let scaleChange = 1;
            if (prevDistance.current > 0) {
              scaleChange = distance / prevDistance.current;
            }
            let newScale = lastScale.current * scaleChange;
            newScale = Math.max(minScale, Math.min(newScale, maxScale));
            scale.setValue(newScale);
            if (onCropParamsChange) onCropParamsChange({ scale: newScale, pan: lastPan.current });
          }
        } else if (!isPinching.current) {
          let newPan = {
            x: lastPan.current.x + gesture.dx,
            y: lastPan.current.y + gesture.dy,
          };
          // Clamp pan so image always covers the crop circle
          const w = displaySize.width * lastScale.current;
          const h = displaySize.height * lastScale.current;
          const minX = Math.min(0, CROP_SIZE - w);
          const maxX = Math.max(0, CROP_SIZE - w);
          const minY = Math.min(0, CROP_SIZE - h);
          const maxY = Math.max(0, CROP_SIZE - h);
          newPan.x = Math.max(minX, Math.min(newPan.x, maxX));
          newPan.y = Math.max(minY, Math.min(newPan.y, maxY));
          pan.setValue(newPan);
          if (onCropParamsChange) onCropParamsChange({ scale: lastScale.current, pan: newPan });
        }
      },
      onPanResponderRelease: (e, gesture) => {
        if (isPinching.current) {
          lastScale.current = Math.max(minScale, Math.min(lastScale.current, maxScale));
        }
        let newPan = {
          x: lastPan.current.x + gesture.dx,
          y: lastPan.current.y + gesture.dy,
        };
        // Clamp pan
        const w = displaySize.width * lastScale.current;
        const h = displaySize.height * lastScale.current;
        const minX = Math.min(0, CROP_SIZE - w);
        const maxX = Math.max(0, CROP_SIZE - w);
        const minY = Math.min(0, CROP_SIZE - h);
        const maxY = Math.max(0, CROP_SIZE - h);
        newPan.x = Math.max(minX, Math.min(newPan.x, maxX));
        newPan.y = Math.max(minY, Math.min(newPan.y, maxY));
        lastPan.current = newPan;
        pan.setValue(newPan);
        isPinching.current = false;
        prevDistance.current = 0;
        if (onCropParamsChange) onCropParamsChange({ scale: lastScale.current, pan: newPan });
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  // Set initial scale and pan
  useEffect(() => {
    scale.setValue(minScale);
    lastScale.current = minScale;
    lastPan.current = { x: 0, y: 0 };
    pan.setValue({ x: 0, y: 0 });
    if (onCropParamsChange) onCropParamsChange({ scale: minScale, pan: { x: 0, y: 0 } });
    if (onReady) onReady();
    // eslint-disable-next-line
  }, [minScale, uri]);

  if (loading) return <ActivityIndicator color="#fff" style={{ flex: 1 }} />;
  if (error) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'red' }}>{error}</Text></View>;
  if (!uri) return null;

  return (
    <View style={styles.cropArea}>
      <Animated.View
        style={{
          width: CROP_SIZE,
          height: CROP_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: CROP_SIZE / 2,
          overflow: 'hidden',
          backgroundColor: '#222',
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scale },
          ],
        }}
        {...panResponder.panHandlers}
      >
        <Image
          source={{ uri }}
          style={{ width: displaySize.width, height: displaySize.height }}
          resizeMode="cover"
        />
      </Animated.View>
      {/* Circular mask overlay */}
      <View pointerEvents="none" style={styles.maskOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  cropArea: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    borderRadius: CROP_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  maskOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CROP_SIZE,
    height: CROP_SIZE,
    borderRadius: CROP_SIZE / 2,
    borderWidth: 3,
    borderColor: '#fff',
    opacity: 0.5,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});

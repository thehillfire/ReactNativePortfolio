import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import InstagramCropper from '../../../components/InstagramCropper';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';

export default function AvatarCrop() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cropping, setCropping] = useState(false);
  const [cropParams, setCropParams] = useState<{ scale: number; pan: { x: number; y: number } } | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        if (params?.imageUrl && params?.characterId) {
          setImageUrl(params.imageUrl as string);
          setOriginalImageUrl(params.imageUrl as string);
          setCharacterId(params.characterId as string);
          setLoading(false);
          return;
        }
        if (!user) return;
        const activeCharacterId = await AsyncStorage.getItem('activeCharacterId');
        if (!activeCharacterId) return;
        setCharacterId(activeCharacterId);
        const charDoc = await getDoc(doc(db, 'characters', activeCharacterId));
        if (charDoc.exists()) {
          const data = charDoc.data();
          const origUrl = data.originalImageUrl || data.imageUrl || null;
          setOriginalImageUrl(origUrl);
          setImageUrl(origUrl);
        }
      } catch (e) {
        setImageUrl(null);
        setOriginalImageUrl(null);
      } finally {
        setLoading(false);
      }
    };
    fetchImage();
  }, [user, params]);

  const handleCrop = async () => {
    if (!originalImageUrl || !cropParams || !characterId) return;
    setCropping(true);
    try {
      // Get image size
      const { width: imgW, height: imgH } = await new Promise<{ width: number; height: number }>((resolve) => {
        // @ts-ignore
        Image.getSize(originalImageUrl, (width, height) => resolve({ width, height }), () => resolve({ width: 0, height: 0 }));
      });
      if (!imgW || !imgH) throw new Error('Image size error');
      // Calculate crop area in image coordinates
      // (Instagram logic: use scale, pan, and crop circle size)
      const CROP_SIZE = Math.floor(require('react-native').Dimensions.get('window').width * 0.8);
      const aspect = imgW / imgH;
      let displayW, displayH;
      if (aspect > 1) {
        displayW = CROP_SIZE * aspect;
        displayH = CROP_SIZE;
      } else {
        displayW = CROP_SIZE;
        displayH = CROP_SIZE / aspect;
      }
      const scale = cropParams.scale;
      const pan = cropParams.pan;
      const w = displayW * scale;
      const h = displayH * scale;
      const offsetX = (CROP_SIZE - w) / 2 + pan.x;
      const offsetY = (CROP_SIZE - h) / 2 + pan.y;
      const cropLeft = Math.max(0, -offsetX / w * imgW);
      const cropTop = Math.max(0, -offsetY / h * imgH);
      const cropDiameter = (CROP_SIZE / w) * imgW;
      const safeCrop = Math.min(cropDiameter, imgW - cropLeft, imgH - cropTop);
      const manipResult = await ImageManipulator.manipulateAsync(
        originalImageUrl,
        [{ crop: { originX: cropLeft, originY: cropTop, width: safeCrop, height: safeCrop } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );
      await updateDoc(doc(db, 'characters', characterId), { imageUrl: manipResult.uri });
      await AsyncStorage.setItem('activeCharacterId', characterId);
      setImageUrl(manipResult.uri);
      Alert.alert('Cropped!', 'Your avatar has been updated.');
      router.replace('/projects');
    } catch (e) {
      Alert.alert('Error', 'Failed to crop image.');
    } finally {
      setCropping(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 }}>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : imageUrl ? (
        <>
          <InstagramCropper
            uri={imageUrl}
            onReady={() => {}}
            onCropParamsChange={setCropParams}
          />
          {/* Debug: show cropParams */}
          <Text style={{ color: '#fff', fontSize: 12, marginBottom: 8 }}>
            CropParams: {cropParams ? JSON.stringify(cropParams) : 'Not set'}
          </Text>
          <Pressable
            style={{ backgroundColor: cropParams ? '#333' : '#555', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 30, marginBottom: 16 }}
            onPress={handleCrop}
            disabled={cropping || !imageUrl || !cropParams}
          >
            {cropping ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Confirm</Text>}
          </Pressable>
          {!cropParams && (
            <Text style={{ color: 'red', fontSize: 12 }}>Cropper not ready. Try panning/zooming the image.</Text>
          )}
        </>
      ) : (
        <View style={{ width: 200, height: 200, borderRadius: 20, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', marginBottom: 32, borderWidth: 2, borderColor: '#333' }}>
          <Text style={{ color: '#fff' }}>No Image</Text>
        </View>
      )}
    </View>
  );
}

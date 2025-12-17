import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../config/firebase';

// Use Cloud Function to upload image (works around CORS restrictions)
export const uploadImageToStorage = async (imageUrl: string, userId: string): Promise<string> => {
  try {
    console.log("Uploading image via Cloud Function...");
    
    // Get the Cloud Function URL
    const functionUrl = process.env.EXPO_PUBLIC_UPLOAD_IMAGE_FUNCTION_URL || 
                       'https://us-central1-loreforgeauth.cloudfunctions.net/uploadImageFromUrl';
    
    // Try to use Cloud Function first (if deployed)
    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Image uploaded successfully via Cloud Function");
        return data.imageUrl;
      } else {
        console.warn("Cloud Function failed, falling back to client-side upload");
      }
    } catch (functionError) {
      console.warn("Cloud Function not available, trying client-side upload:", functionError);
    }
    
    // Fallback to client-side upload
    console.log("Attempting client-side download and upload...");
    
    // Try multiple methods to fetch the image
    let blob: Blob | null = null;
    
    // Method 1: Try direct fetch with CORS
    try {
      const response = await fetch(imageUrl, {
        method: 'GET',
        mode: 'cors',
      });
      
      if (response.ok) {
        blob = await response.blob();
        console.log("Successfully fetched image via direct fetch");
      }
    } catch (e) {
      console.log("Direct fetch failed, trying canvas method...");
    }
    
    // Method 2: Try canvas method (works around CORS in some cases)
    if (!blob) {
      try {
        blob = await urlToBlob(imageUrl);
        console.log("Successfully fetched image via canvas method");
      } catch (canvasError) {
        console.error("Canvas method also failed:", canvasError);
        throw new Error("CORS_BLOCKED");
      }
    }
    
    if (!blob) {
      throw new Error("Failed to get image blob");
    }
    
    console.log("Image downloaded, uploading to Firebase Storage...");
    
    // Create a reference to Firebase Storage
    const timestamp = Date.now();
    const storageRef = ref(storage, `characters/${userId}/${timestamp}.png`);
    
    // Upload the blob
    await uploadBytes(storageRef, blob);
    
    // Get the permanent download URL
    const permanentUrl = await getDownloadURL(storageRef);
    
    console.log("Image uploaded to Firebase Storage:", permanentUrl);
    
    return permanentUrl;
  } catch (error: any) {
    // All methods failed - return original URL with warning
    console.error("❌ CRITICAL: Failed to upload image to Firebase Storage");
    console.error("Error:", error.message);
    console.warn("⚠️  WARNING: Using temporary DALL-E URL which will expire in ~1 hour");
    console.warn("To fix this:");
    console.warn("1. Deploy Firebase Cloud Functions: cd functions && npm run deploy");
    console.warn("2. Set EXPO_PUBLIC_UPLOAD_IMAGE_FUNCTION_URL in your .env file");
    console.warn("3. Or configure Firebase Storage CORS properly");
    return imageUrl;
  }
};

// Helper function to convert URL to Blob using canvas (works around CORS in some cases)
async function urlToBlob(url: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Try to enable CORS
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/png');
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

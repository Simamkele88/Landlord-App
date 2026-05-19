import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from 'expo-image-manipulator';
import api from "./api";

export async function uploadImage(imageAsset, uploadType = 'maintenance') {
  try {
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageAsset.uri,
      [{ resize: { width: 600 } }],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
    );

    const response = await fetch(manipulatedImage.uri);
    const blob = await response.blob();

    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const sizeKB = (base64.length / 1024).toFixed(1);
    console.log(` Base64: ${sizeKB}KB (${uploadType})`);

    if (base64.length > 500000) {
      const smallerImage = await ImageManipulator.manipulateAsync(
        imageAsset.uri,
        [{ resize: { width: 400 } }],
        { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG }
      );
      const r2 = await fetch(smallerImage.uri);
      const b2 = await r2.blob();
      const base642 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(b2);
      });
      
      if (base642.length > 500000) {
        throw new Error("Image too large. Use a smaller photo.");
      }
      
      return await doUpload(base642, uploadType);
    }

    return await doUpload(base64, uploadType);
  } catch (error) {
    console.error("Upload failed:", error.message);
    throw error;
  }
}

async function doUpload(base64, uploadType) {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const uploadResponse = await fetch(`${api.getBaseUrl()}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      image: `data:image/jpeg;base64,${base64}`,
      fileName: `${uploadType}-${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      fileSize: base64.length,
      uploadType: uploadType,
    }),
  });

  const rawText = await uploadResponse.text();

  if (rawText.includes('<!DOCTYPE') || rawText.includes('<html')) {
    throw new Error("Server rejected request");
  }

  const data = JSON.parse(rawText);

  if (!uploadResponse.ok) {
    throw new Error(data.error || "Upload failed");
  }

  return {
    document_url: data.document_url,
    document_name: data.document_name || "Photo",
    mime_type: "image/jpeg",
    file_size: data.file_size || 0,
    photo_type: uploadType === 'maintenance' ? "before" : "evidence",
  };
}

// For maintenance photos
export async function uploadImages(imageAssets) {
  if (!imageAssets || imageAssets.length === 0) return [];
  const results = [];
  for (const img of imageAssets) {
    results.push(await uploadImage(img, 'maintenance'));
  }
  return results;
}

// For complaint evidence — use this in ComplaintNew.jsx
export async function uploadComplaintEvidence(imageAssets) {
  if (!imageAssets || imageAssets.length === 0) return [];
  const results = [];
  for (const img of imageAssets) {
    results.push(await uploadImage(img, 'complaint'));
  }
  return results;
}
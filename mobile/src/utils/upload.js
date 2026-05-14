// src/utils/upload.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from 'expo-image-manipulator';
import api from "./api";


export async function uploadImage(imageAsset) {
  try {

    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageAsset.uri,
      [
        { resize: { width: 600 } }  
      ],
      { 
        compress: 0.7,  
        format: ImageManipulator.SaveFormat.JPEG 
      }
    );
    
    console.log("Original size:", imageAsset.fileSize, "bytes");
    console.log("Compressed:", manipulatedImage);

    const response = await fetch(manipulatedImage.uri);
    const blob = await response.blob();
    
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const sizeKB = (base64.length / 1024).toFixed(1);
 
    if (base64.length > 700000) { 
      throw new Error("Image too large. Please take a smaller photo or lower quality.");
    }


    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Not authenticated");

    const uploadUrl = `${api.getBaseUrl()}/upload/maintenance-photo-base64`;

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${base64}`,
        fileName: `maintenance-${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
        fileSize: base64.length,
      }),
    });

    const contentType = uploadResponse.headers.get("content-type");
    console.log("Response content type:", contentType);

    const rawText = await uploadResponse.text();

    if (rawText.includes('<!DOCTYPE') || rawText.includes('<html')) {
      console.error("Got HTML instead of JSON");
      throw new Error("Server rejected request - likely too large for ngrok");
    }

    const data = JSON.parse(rawText);

    if (!uploadResponse.ok) {
      throw new Error(data.error || "Upload failed");
    }
    
    return {
      document_url: data.document_url,
      document_name: data.document_name || "Maintenance photo",
      mime_type: "image/jpeg",
      file_size: data.file_size || 0,
      photo_type: "before",
    };

  } catch (error) {
    console.error("Upload failed:", error.message);
    throw error;
  }
}

export async function uploadImages(imageAssets) {
  if (!imageAssets || imageAssets.length === 0) return [];
  
  const results = [];
  for (let i = 0; i < imageAssets.length; i++) {
    console.log(`Uploading image ${i + 1}/${imageAssets.length}...`);
    try {
      const result = await uploadImage(imageAssets[i]);
      results.push(result);
    } catch (err) {
      console.error(`Failed to upload image ${i + 1}:`, err.message);
      throw err; 
    }
  }
  return results;
}
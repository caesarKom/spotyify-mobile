import { useEffect, useState } from "react";
import useAuthStore from "../state/storage";

export const useAuthImage = (imageUrl: string) => {
  const [imageSrc, setImageSrc] = useState<string|null>(null);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!imageUrl) return;

    const loadImage = async () => {
      try {
        // Jeśli obraz jest publiczny, użyj bezpośrednio
        if (!imageUrl.includes('/uploads/')) {
          setImageSrc(imageUrl);
          return;
        }

        // Dla obrazów chronionych, użyj fetch z autoryzacją
        const response = await fetch(imageUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setImageSrc(objectUrl);
        } else {
          console.error('Failed to load image:', response.status);
          setImageSrc(null);
        }
      } catch (error) {
        console.error('Error loading image:', error);
        setImageSrc(null);
      }
    };

    loadImage();

    // Cleanup
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageUrl, accessToken]);

  return imageSrc;
};
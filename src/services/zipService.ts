import { VideoItem } from '../types';

/**
 * Helper to crop image to 9:16 aspect ratio via Canvas
 * Optimized to prevent memory leaks
 */
const cropTo916 = (imageUrl: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const targetRatio = 9 / 16;
      const newWidth = img.height * targetRatio;
      const startX = (img.width - newWidth) / 2;

      canvas.width = newWidth;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return reject("Canvas context error");

      ctx.drawImage(img, startX, 0, newWidth, img.height, 0, 0, newWidth, img.height);

      canvas.toBlob((blob) => {
        // Clear references immediately
        canvas.width = 0;
        canvas.height = 0;
        if (blob) resolve(blob);
        else reject("Blob conversion failed");
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => reject("Image load error");
    img.src = imageUrl;
  });
};

export const generateZip = async (
  list: VideoItem[],
  name: string,
  onProgress: (percent: number) => void
): Promise<void> => {
  if (!list.length) return;

  const JSZip = window.JSZip;
  const saveAs = window.saveAs;

  if (!JSZip || !saveAs) {
    throw new Error("JSZip or FileSaver library not loaded.");
  }

  onProgress(1);
  const zip = new JSZip();
  const folder = zip.folder(name);

  // Concurrency limit to prevent memory spikes
  const BATCH_SIZE = 5;
  for (let i = 0; i < list.length; i += BATCH_SIZE) {
    const batch = list.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (v, indexInBatch) => {
      const globalIndex = i + indexInBatch;
      try {
        let blob: Blob;
        if (v.isShort) {
          blob = await cropTo916(v.thumbnail);
        } else {
          const res = await fetch(v.thumbnail);
          if (!res.ok) throw new Error("Fetch failed");
          blob = await res.blob();
        }

        let safeTitle = v.title.replace(/[\\/:*?"<>|]/g, '_');
        safeTitle = safeTitle.substring(0, 100).trim();

        const fileName = `${globalIndex + 1}. ${safeTitle}.jpg`;
        folder.file(fileName, blob);

      } catch (e) {
        console.warn("Failed process thumbnail:", v.title, e);
      }
    }));

    onProgress(Math.round(((i + batch.length) / list.length) * 100));
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${name}_Thumbnails.zip`);
  onProgress(0);
};

/**
 * Compresses an image file client-side using HTML5 Canvas.
 * Reduces resolution to max 1000px on the longest edge
 * and converts to JPEG at 75% quality.
 * Returns a new File object if compressed, or the original if it fails/is bypassed.
 */
export const compressImage = (file: File, maxMb: number = 5): Promise<File> => {
  return new Promise((resolve) => {
    // If file is already under target size (600 KB) and under maxMb, don't compress it
    if (file.size < 600 * 1024 && file.size <= maxMb * 1024 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const performCompression = (quality: number, maxDim: number) => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                  type: "image/jpeg",
                });
                
                // If the compressed file still exceeds maxMb, recursively try with lower parameters
                if (compressedFile.size > maxMb * 1024 * 1024 && (quality > 0.15 || maxDim > 300)) {
                  performCompression(Math.max(0.15, quality - 0.15), Math.max(300, maxDim - 200));
                } else {
                  resolve(compressedFile);
                }
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            quality
          );
        };

        // Start compression with 75% quality and max 1000px dimension
        performCompression(0.75, 1000);
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

/**
 * Enforces maximum size limits on files.
 * Returns true if valid, false if exceeds limit.
 */
export const checkFileSize = (file: File, maxMb: number = 5): boolean => {
  const maxSize = maxMb * 1024 * 1024;
  return file.size <= maxSize;
};

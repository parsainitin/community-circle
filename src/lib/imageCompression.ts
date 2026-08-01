/**
 * Compresses an image file client-side using HTML5 Canvas.
 * Reduces resolution to max 1000px on the longest edge
 * and converts to JPEG at 75% quality.
 * Returns a new File object if compressed, or the original if it fails/is bypassed.
 */
export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    // If file is already small (e.g., < 600 KB), don't compress it
    if (file.size < 600 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
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
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.75 // 75% quality
        );
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

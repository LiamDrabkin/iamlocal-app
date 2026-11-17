/**
 * Shrink a picked photo to a small JPEG data URL so it can live in saved profile state.
 * Runs in the browser only. The photo never leaves the device in this mock-up unless the
 * member is signed in, in which case it is saved with their account state.
 */
export function shrinkImage(file: File, maxEdge: number, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => {
      const k = Math.min(1, maxEdge / Math.max(el.width, el.height));
      const c = document.createElement('canvas');
      c.width = Math.round(el.width * k);
      c.height = Math.round(el.height * k);
      c.getContext('2d')?.drawImage(el, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    el.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image')); };
    el.src = url;
  });
}

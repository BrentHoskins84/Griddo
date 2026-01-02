export async function validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
    const buffer = await file.arrayBuffer();
    const arr = new Uint8Array(buffer);
    
    // Need at least 12 bytes to verify WEBP (RIFF header + WEBP chunk ID)
    if (arr.length < 12) {
      return { 
        valid: false, 
        error: 'File content does not match allowed image types. File may be corrupted or renamed.' 
      };
    }
    
    // Check magic numbers (first 4 bytes identify file type)
    const header = Array.from(arr.subarray(0, 4))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    
    // Check for JPEG, PNG, GIF (first 4 bytes are sufficient)
    if (header.startsWith('FFD8FF')) {
      return { valid: true };
    }
    if (header === '89504E47') {
      return { valid: true };
    }
    if (header.startsWith('47494638')) {
      return { valid: true };
    }
    
    // For WEBP, verify both RIFF header (bytes 0-3) and WEBP chunk ID (bytes 8-11)
    if (header === '52494646') {
      const webpChunk = Array.from(arr.subarray(8, 12))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
      
      if (webpChunk === '57454250') {
        return { valid: true };
      }
    }
    
    return { 
      valid: false, 
      error: 'File content does not match allowed image types. File may be corrupted or renamed.' 
    };
  }
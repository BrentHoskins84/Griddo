export async function validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
    const buffer = await file.arrayBuffer();
    const arr = new Uint8Array(buffer).subarray(0, 4);
    
    // Check magic numbers (first 4 bytes identify file type)
    const header = Array.from(arr)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    
    // Valid image file signatures
    const validHeaders: Record<string, string> = {
      'FFD8FF': 'image/jpeg',
      '89504E47': 'image/png',
      '47494638': 'image/gif',
      '52494646': 'image/webp', // RIFF container
    };
    
    const isValid = Object.keys(validHeaders).some(magic => header.startsWith(magic));
    
    if (!isValid) {
      return { 
        valid: false, 
        error: 'File content does not match allowed image types. File may be corrupted or renamed.' 
      };
    }
    
    return { valid: true };
  }
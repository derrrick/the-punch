const fs = require('fs');
const path = require('path');

// Simple ICO file generator for a 32x32 image
// ICO format: header + directory entries + image data

function createICO() {
  const size = 32;
  
  // ICO Header (6 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(1, 4); // Count: 1 image
  
  // ICO Directory Entry (16 bytes)
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);      // Width
  entry.writeUInt8(size, 1);      // Height
  entry.writeUInt8(0, 2);         // Colors (0 = >256)
  entry.writeUInt8(0, 3);         // Reserved
  entry.writeUInt16LE(1, 4);      // Color planes
  entry.writeUInt16LE(32, 6);     // Bits per pixel
  entry.writeUInt32LE(0, 8);      // Size of image data (will update)
  entry.writeUInt32LE(22, 12);    // Offset to image data
  
  // Create a simple 32x32 PNG-like data for the "P" icon
  // We'll create a simple BMP with alpha for the ICO
  const bmpHeaderSize = 40;
  const pixelDataSize = size * size * 4;
  const bmpSize = bmpHeaderSize + pixelDataSize;
  
  // Update entry with size
  entry.writeUInt32LE(bmpSize, 8);
  
  // BMP Info Header (40 bytes)
  const bmpHeader = Buffer.alloc(40);
  bmpHeader.writeUInt32LE(40, 0);     // Header size
  bmpHeader.writeInt32LE(size, 4);    // Width
  bmpHeader.writeInt32LE(size * 2, 8); // Height (doubled for XOR and AND masks)
  bmpHeader.writeUInt16LE(1, 12);     // Planes
  bmpHeader.writeUInt16LE(32, 14);    // Bits per pixel
  bmpHeader.writeUInt32LE(0, 16);     // Compression (0 = none)
  bmpHeader.writeUInt32LE(0, 20);     // Image size (0 for uncompressed)
  bmpHeader.writeInt32LE(0, 24);      // X pixels per meter
  bmpHeader.writeInt32LE(0, 28);      // Y pixels per meter
  bmpHeader.writeUInt32LE(0, 32);     // Colors used
  bmpHeader.writeUInt32LE(0, 36);     // Important colors
  
  // Create pixel data (BGRA format, bottom-up)
  const pixels = Buffer.alloc(pixelDataSize);
  
  // Dark background color (#171717)
  const bgR = 23, bgG = 23, bgB = 23;
  // White text color
  const textR = 255, textG = 255, textB = 255;
  
  // Simple "P" shape drawn pixel by pixel (very basic)
  // We'll use a simple approach: dark background with white P in center
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = ((size - 1 - y) * size + x) * 4;
      
      // Default: dark background
      let r = bgR, g = bgG, b = bgB, a = 255;
      
      // Draw a simple "P" shape
      // Vertical bar of P
      const centerX = size / 2;
      const centerY = size / 2;
      
      // Define P shape regions
      const isVerticalBar = x >= 8 && x <= 13;
      const isTopLoop = y >= 6 && y <= 17;
      const isTopBar = y >= 6 && y <= 11;
      const isRightBar = x >= 19 && x <= 24;
      
      // Simple P: vertical bar + top curve
      if (isVerticalBar && y >= 6 && y <= 26) {
        // Vertical stem
        r = textR; g = textG; b = textB;
      } else if (isTopBar && x >= 8 && x <= 24) {
        // Top horizontal
        r = textR; g = textG; b = textB;
      } else if (isRightBar && y >= 6 && y <= 17) {
        // Right vertical of loop
        r = textR; g = textG; b = textB;
      } else if (y >= 12 && y <= 17 && x >= 13 && x <= 24) {
        // Middle horizontal
        r = textR; g = textG; b = textB;
      }
      
      // BGRA format
      pixels[idx] = b;
      pixels[idx + 1] = g;
      pixels[idx + 2] = r;
      pixels[idx + 3] = a;
    }
  }
  
  // Combine all parts
  const ico = Buffer.concat([header, entry, bmpHeader, pixels]);
  
  return ico;
}

const icoData = createICO();
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), icoData);
console.log('favicon.ico generated successfully');
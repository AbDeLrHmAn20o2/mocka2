import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const supportedExtensions = ['.ttf', '.otf', '.woff', '.woff2'];

export async function GET() {
  try {
    const fontsDirectory = path.join(process.cwd(), 'public', 'fonts');
    
    // Check if fonts directory exists
    if (!fs.existsSync(fontsDirectory)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(fontsDirectory);
    const fontFiles = files.filter(file => 
      supportedExtensions.some(ext => file.toLowerCase().endsWith(ext))
    );

    const fonts = fontFiles.map(file => {
      const name = extractFontName(file);
      const family = name.replace(/\s+/g, '');
      
      return {
        name,
        family,
        file,
        type: getFileType(file),
        category: 'custom',
        size: getFileSize(path.join(fontsDirectory, file))
      };
    });

    return NextResponse.json(fonts);
  } catch (error) {
    console.error('Error scanning fonts:', error);
    return NextResponse.json({ error: 'Failed to scan fonts' }, { status: 500 });
  }
}

function extractFontName(filename) {
  // Remove extension
  let name = filename.replace(/\.[^/.]+$/, "");
  
  // Handle common font naming patterns
  name = name
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim();
    
  // Capitalize first letter of each word
  return name.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

function getFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return ext;
}

function getFileSize(filepath) {
  try {
    const stats = fs.statSync(filepath);
    return stats.size;
  } catch {
    return 0;
  }
}
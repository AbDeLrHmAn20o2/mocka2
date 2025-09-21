import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const canzatPath = path.join(process.cwd(), 'public', 'canzat', 'images');
    
    // Check if canzat images directory exists
    if (!fs.existsSync(canzatPath)) {
      return NextResponse.json({ error: 'Canzat images directory not found' }, { status: 404 });
    }

    // Read all files in canzat images directory
    const files = fs.readdirSync(canzatPath);
    
    // Filter only image files (jpg, jpeg, png, svg, webp)
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|svg|webp)$/i.test(file)
    );

    const canzatItems = [];

    // Process each image file
    for (const fileName of imageFiles) {
      try {
        const filePath = path.join(canzatPath, fileName);
        const stats = fs.statSync(filePath);
        
        // Extract canzat ID from filename (remove extension)
        const id = fileName.replace(/\.(jpg|jpeg|png|svg|webp)$/i, '');
        
        // Generate name from filename
        const name = id.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        const category = 'canzat';
        const description = `${name} canzat design`;
        
        // Default dimensions for canzat designs
        const width = 800;
        const height = 600;
        
        // All canzat items are premium
        const isPremium = true;

        // Use the image itself as thumbnail
        const thumbnail = `/canzat/images/${fileName}`;

        // Create canzat object
        const canzatItem = {
          id,
          name,
          fileName,
          thumbnail,
          category,
          description,
          width,
          height,
          isPremium,
          lastModified: stats.mtime.toISOString(),
          type: 'canzat', // Mark as canzat type
          imagePath: `/canzat/images/${fileName}` // Path to the actual image
        };

        canzatItems.push(canzatItem);
      } catch (error) {
        console.error(`Error processing canzat image ${fileName}:`, error);
        // Continue processing other files even if one fails
      }
    }

    // Sort canzat items by category and then by name
    canzatItems.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      success: true,
      data: canzatItems,
      count: canzatItems.length
    });

  } catch (error) {
    console.error('Error loading canzat items:', error);
    return NextResponse.json(
      { error: 'Failed to load canzat items', details: error.message },
      { status: 500 }
    );
  }
}

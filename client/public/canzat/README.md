# Canzat Items

This folder contains Canzat design files that appear in the Canzat section of the application.

## File Structure

Each Canzat item should be a `.json` file containing:

```json
{
  "version": "5.3.0",
  "isPremium": false,
  "canzatInfo": {
    "name": "Display Name",
    "category": "Category Name",
    "description": "Brief description of the canzat item"
  },
  "width": 800,
  "height": 600,
  "objects": [
    // Fabric.js canvas objects
  ]
}
```

## Properties

- `version`: Fabric.js version (should be "5.3.0")
- `isPremium`: Boolean indicating if this is a premium canzat item
- `canzatInfo`: Metadata about the canzat item
  - `name`: Display name shown in the UI
  - `category`: Used for grouping canzat items
  - `description`: Brief description shown in the UI
- `width`, `height`: Canvas dimensions
- `objects`: Array of Fabric.js objects that make up the design

## Categories

Common categories include:
- Business
- Marketing
- General
- Creative
- Event

## Premium Items

Set `isPremium: true` for items that require a premium subscription to access.

## Thumbnails

Optionally, you can provide thumbnail images by placing a file named `{filename}-thumb.jpg` in this folder. For example, for `business-card.json`, you would add `business-card-thumb.jpg`.

## Current Items

- `business-card.json` - Modern business card design (Free)
- `poster-design.json` - Event poster design (Premium)
- `sample-canzat.json` - Simple card design (Free)

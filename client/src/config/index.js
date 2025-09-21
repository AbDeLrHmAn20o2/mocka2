const {
  Youtube,
  Image,
  Palette,
  Heart,
  Type,
  Sticker,
  Printer,
} = require("lucide-react");

export const designTypes = [
  {
    icon: <Youtube className="h-6 w-6 text-white" />,
    label: "YouTube Thumbnail",
    bgColor: "bg-red-500",
    width: 900,
    height: 500,
  },
  {
    icon: <Image className="h-6 w-6 text-white" />,
    label: "Logo Design",
    bgColor: "bg-purple-500",
    width: 400,
    height: 465,
  },
  {
    icon: <Palette className="h-6 w-6 text-white" />,
    label: "Color Palette",
    bgColor: "bg-blue-500",
    width: 500,
    height: 500,
  },
  {
    icon: <Type className="h-6 w-6 text-white" />,
    label: "Typography",
    bgColor: "bg-green-500",
    width: 200,
    height: 200,
  },
  {
    icon: <Heart className="h-6 w-6 text-white" />,
    label: "Social Media",
    bgColor: "bg-red-400",
    width: 825,
    height: 465,
  },
  {
    icon: <Sticker className="h-6 w-6 text-white" />,
    label: "Stickers",
    bgColor: "bg-pink-500",
    width: 250,
    height: 250,
  },
  {
    icon: <Printer className="h-6 w-6 text-white" />,
    label: "Printables",
    bgColor: "bg-purple-500",
    width: 600,
    height: 600,
  },
];

export const colorPresets = [
  "#FFFFFF",
  "#F8F9FA",
  "#E9ECEF",
  "#DEE2E6",
  "#212529",
  "#000000",
  "#E53935",
  "#D81B60",
  "#8E24AA",
  "#5E35B1",
  "#3949AB",
  "#1E88E5",
  "#039BE5",
  "#00ACC1",
  "#00897B",
  "#43A047",
  "#7CB342",
  "#C0CA33",
  "#FFCDD2",
  "#F8BBD0",
  "#E1BEE7",
  "#D1C4E9",
  "#C5CAE9",
  "#BBDEFB",
  "#B3E5FC",
  "#B2EBF2",
  "#B2DFDB",
  "#C8E6C9",
  "#DCEDC8",
  "#F0F4C3",
];

export const textPresets = [
  {
    name: "Heading",
    text: "Add a heading",
    fontSize: 36,
    fontWeight: "bold",
    fontFamily: "Inter, sans-serid",
  },
  {
    name: "Subheading",
    text: "Add a subheading",
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Inter, sans-serid",
  },
  {
    name: "Body Text",
    text: "Add a little bit of body text",
    fontSize: 16,
    fontWeight: "normal",
    fontFamily: "Inter, sans-serid",
  },
  {
    name: "Caption",
    text: "Add a caption",
    fontSize: 12,
    fontWeight: "normal",
    fontFamily: "Inter, sans-serid",
    fontStyle: "normal",
  },
];

export const brushSizes = [
  { value: 2, label: "Small" },
  { value: 5, label: "Medium" },
  { value: 10, label: "Large" },
  { value: 20, label: "Extra Large" },
];

export const drawingPanelColorPresets = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFD1DC",
  "#FFADAD",
  "#FFD6A5",
  "#FDFFB6",
  "#CAFFBF",
  "#FF9900",
  "#9900FF",
  "#FF00FF",
  "#00FFFF",
  "#FFFF00",
  // Muted colors
  "#6B705C",
  "#A5A58D",
  "#B7B7A4",
  "#CB997E",
  "#DDBEA9",
  // Dark colors
  "#1A1A2E",
  "#16213E",
  "#0F3460",
  "#533483",
  "#E94560",
];

// Import from the new font system
import { getAllFontFamilies } from "./fonts";

// Legacy font families - now dynamically loaded
export const fontFamilies = [
  "Arial",
  "Helvetica", 
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Impact",
  "Comic Sans MS",
];

// Function to get all available fonts (including custom ones)
export const getAllAvailableFonts = getAllFontFamilies;

// Legacy static templates - now loaded dynamically from /public/examples/
// export const customTemplates = [
//   {
//     id: "business-card",
//     name: "Business Card",
//     fileName: "business-card.json",
//     thumbnail: "/examples/business-card-thumb.jpg",
//     category: "business",
//     width: 420,
//     height: 297,
//     isPremium: true,
//   },
//   {
//     id: "presentation-slide",
//     name: "Presentation Slide",
//     fileName: "presentation-slide.json",
//     thumbnail: "/examples/presentation-slide-thumb.jpg",
//     category: "presentation",
//     width: 800,
//     height: 600,
//     isPremium: true,
//   },
//   {
//     id: "simple-card",
//     name: "Simple Card",
//     fileName: "simple-card.json",
//     thumbnail: "/examples/simple-card-thumb.jpg",
//     category: "card",
//     width: 800,
//     height: 600,
//     isPremium: false,
//   },
//   {
//     id: "social-media-post",
//     name: "Social Media Post",
//     fileName: "social-media-post.json",
//     thumbnail: "/examples/social-media-post-thumb.jpg",
//     category: "social",
//     width: 1080,
//     height: 1080,
//     isPremium: false,
//   },
//   {
//     id: "web-banner",
//     name: "Web Banner",
//     fileName: "web-banner.json",
//     thumbnail: "/examples/web-banner-thumb.jpg",
//     category: "web",
//     width: 1200,
//     height: 630,
//     isPremium: true,
//   },
// ];

// Templates are now loaded dynamically via /api/templates
// This automatically includes all JSON files in /public/examples/

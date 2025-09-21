import {
  FileImage,
  Youtube,
  Palette,
  Type,
  Heart,
  Sticker,
  Printer,
  Image as ImageIcon,
  Layers,
} from "lucide-react";

const categoryIcons = {
  youtube_thumbnail: Youtube,
  "YouTube Thumbnail": Youtube,
  logo_design: ImageIcon,
  "Logo Design": ImageIcon,
  color_palette: Palette,
  "Color Palette": Palette,
  typography: Type,
  Typography: Type,
  social_media: Heart,
  "Social Media": Heart,
  stickers: Sticker,
  Stickers: Sticker,
  printables: Printer,
  Printables: Printer,
};

// Figma-inspired muted colors
const categoryColors = {
  youtube_thumbnail: "#ff4757",
  "YouTube Thumbnail": "#ff4757",
  logo_design: "#5f27cd",
  "Logo Design": "#5f27cd",
  color_palette: "#00d2d3",
  "Color Palette": "#00d2d3",
  typography: "#1dd1a1",
  Typography: "#1dd1a1",
  social_media: "#ff6b6b",
  "Social Media": "#ff6b6b",
  stickers: "#feca57",
  Stickers: "#feca57",
  printables: "#5f27cd",
  Printables: "#5f27cd",
};

export function DesignThumbnail({ design }) {
  const IconComponent = categoryIcons[design.category] || Layers;
  const color = categoryColors[design.category] || "#8c8c8c";

  return (
    <div className="w-full h-full bg-[#f8f9fa] flex flex-col items-center justify-center relative border border-[#e5e5e5]">
      {/* Figma-style grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 text-center">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
          style={{ backgroundColor: color + "15" }}
        >
          <IconComponent className="w-6 h-6" style={{ color: color }} />
        </div>
        <h3 className="text-[#1e1e1e] font-medium text-sm mb-1">
          {design.category?.replace(/_/g, " ") || "Design"}
        </h3>
        <div className="text-[#8c8c8c] text-xs">
          {design.width} × {design.height}
        </div>
      </div>

      {/* Figma-style corner indicator */}
      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#e5e5e5]"></div>
    </div>
  );
}

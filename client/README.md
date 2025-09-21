# 🎨 Canvas Design Editor

A modern, web-based design editor built with Next.js and Fabric.js that allows users to create stunning graphics, presentations, and designs with an intuitive drag-and-drop interface.

## ✨ Features

- **🖌️ Interactive Canvas Editor** - Create and edit designs with a powerful canvas-based editor
- **🎯 Drag & Drop Interface** - Intuitive design experience with easy-to-use tools
- **🔧 Design Tools** - Complete set of design tools including shapes, text, images, and drawing
- **👤 User Authentication** - Secure login and user management with NextAuth.js
- **💳 Subscription Management** - Premium features with subscription-based access
- **📱 Responsive Design** - Works seamlessly across desktop and mobile devices
- **🎨 Modern UI** - Built with Tailwind CSS and Radix UI components
- **⚡ High Performance** - Optimized with Next.js 15 and Turbopack
- **💾 Export Options** - Export designs as images or PDF documents

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Canvas Engine**: [Fabric.js 6](https://fabricjs.com/) for interactive graphics
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) for modern styling
- **UI Components**: [Radix UI](https://www.radix-ui.com/) for accessible components
- **Authentication**: [NextAuth.js 5](https://next-auth.js.org/) for secure authentication
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) for client state
- **HTTP Client**: [Axios](https://axios-http.com/) for API communication
- **Icons**: [Lucide React](https://lucide.dev/) for beautiful icons
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/) for toast notifications

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm, yarn, pnpm, or bun package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd client
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:

   ```env
   # Authentication
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   
   # API Configuration
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5001
   
   # Add other environment variables as needed
   ```

4. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```text
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
│   ├── auth/           # Authentication components
│   ├── editor/         # Canvas editor components
│   ├── home/           # Home page components
│   ├── subscription/   # Subscription management
│   └── ui/             # Base UI components
├── fabric/             # Fabric.js utilities and shapes
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── providers/          # Context providers
├── services/           # API service layer
├── store/              # Zustand store configuration
└── utils/              # Helper utilities
```

## 🎯 Key Features

### Canvas Editor

- **Drawing Tools**: Pencil, brush, and shape tools
- **Text Editor**: Add and customize text with various fonts and styles
- **Image Handling**: Upload and manipulate images
- **Layer Management**: Organize design elements with layers
- **Zoom & Pan**: Navigate large canvases with zoom and pan controls
- **Undo/Redo**: Full history management for design actions

### User Experience

- **Real-time Updates**: Instant feedback for all design changes
- **Keyboard Shortcuts**: Efficient workflow with keyboard shortcuts
- **Template Library**: Pre-built templates for quick start
- **Export Options**: Save designs as PNG, JPG, or PDF

### Authentication & Subscription

- **Secure Login**: Email/password and OAuth authentication
- **User Profiles**: Manage user accounts and preferences
- **Subscription Tiers**: Free and premium feature access
- **Payment Integration**: Secure payment processing

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure environment variables
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Deploy to Other Platforms

This Next.js application can be deployed to any platform that supports Node.js:

- **Netlify**: Use the Next.js build plugin
- **AWS**: Deploy with Amplify or EC2
- **Digital Ocean**: Use App Platform
- **Railway**: Simple deployment with Git integration

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXTAUTH_URL` | Base URL for authentication | ✅ |
| `NEXTAUTH_SECRET` | Secret key for JWT tokens | ✅ |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | ✅ |

### API Integration

The frontend communicates with multiple backend services:

- **Design Service**: Handle design data and templates
- **Upload Service**: Manage file uploads and assets
- **Subscription Service**: Handle user subscriptions
- **API Gateway**: Route requests to appropriate services

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed information
3. Provide steps to reproduce any bugs

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Fabric.js](https://fabricjs.com/) for the powerful canvas library
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) for accessible UI components

---

**Happy Designing!** 🎨✨

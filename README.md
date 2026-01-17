# SyncFlow 🚀
**Intelligent Collaborative System Architecture Design**

Build, visualize, and collaborate on complex system architectures in real-time with the power of AI.

![SyncFlow Workspace](https://via.placeholder.com/800x450.png?text=SyncFlow+Workspace+Screenshot)
*(Replace this link with your actual screenshot)*


## 🌟 Core Features

### 🤖 AI-Architect (Powered by Gemini 1.5 Flash)
Transform natural language into visual diagrams instantly. Describe your system requirements (e.g., "Design a scalable microservices architecture for an e-commerce app"), and SyncFlow's integrated **Gemini 1.5 Flash** agent will intelligently generate the corresponding nodes and connections on your canvas.

### ⚡ Real-Time Collaboration
Collaborate seamlessly with your team. Built on **Socket.io**, SyncFlow supports:
- **Live Cursors**: See where your team is working in real-time.
- **Instant Sync**: Node creation, movement, and connections are synchronized instantly across all connected clients.
- **Presence System**: See who is currently active in your workspace.

### 📷 High-Fidelity Exports / "Professional Print"
Forget blurry screenshots or broken exports. SyncFlow utilizes a custom **Native Print Pipeline** that leverages the browser's rendering engine to generate 100% accurate, high-resolution PDFs or PNGs of your architecture, ensuring every detail looks exactly as designed.

### 🗂️ Workspace Management
A full-featured Dashboard allows you to organize your projects effectively:
- **Multi-Tenancy**: Create unlimited, isolated workspaces.
- **Search & Filter**: Instantly find projects with real-time search.
- **Management**: Rename and delete workspaces with ease.

---

## 🛠️ Technical Stack

Built with the modern **MERN Stack** for performance and scalability:

- **Frontend**: React.js, React Flow, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Atlas)
- **Real-Time Engine**: Socket.io
- **AI Integration**: Google Gemini API (`gemini-1.5-flash`)

---

## 📊 Database Architecture

SyncFlow uses a Normalized Document Model where nodes and edges are stored as serialized arrays within a Workspace document. This enables sub-millisecond document retrieval and efficient real-time broadcasting through Socket.io rooms.

---

## 💡 Key Technical Challenges Solved

### 1. Reliable High-Fidelity Exports
**The Problem**: Traditional libraries like `html-to-image` often failed to capture complex React Flow canvases, resulting in missing edges, broken styles, or "white box" errors.
**The Solution**: We deprecated external capture libraries in favor of a **Native Serialization Approach**. By temporarily streamlining the UI and invoking the browser's native print-to-PDF functionality, we guarantee that the output matches the rendered DOM exactly, preserving all styles, gradients, and SVGs.

### 2. Strict Data Isolation
**The Problem**: Ensuring real-time events don't bleed between different workspaces.
**The Solution**: We implemented a strict **Room-Based Architecture** in Socket.io combined with MongoDB isolation. Every `GET`, `POST`, and `socket.emit` is scoped specifically to a unique `workspaceId`. The socket server enforces room boundaries, ensuring that actions in "Workspace A" are never broadcast to "Workspace B".

### 3. Attribute Injection vs. CSS Fidelity
**The Problem**: Attempting to force SVG visibility via manual attribute injection caused CSS collisions and 'white box' artifacts.
**The Solution**: I refactored the component styling to prioritize CSS isolation and utilized a native rendering pipeline to maintain visual integrity during export without compromising the UI's glassmorphism aesthetic.
---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or via Atlas)
- Google Cloud API Key (for Gemini)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/syncflow.git
cd syncflow
```

### 2. Setup Environment Variables
Create a `.env` file in the root directory (or separate ones for client/server if preferred, see `.env.example`).

```env
# .env
PORT=3000
MONGO_URI=mongodb://localhost:27017/syncflow
VITE_GEMINI_KEY=your_google_gemini_api_key_here
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Install Dependencies
SyncFlow has both a client and a server. Install dependencies for both:

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 4. Run the Application
You need to run both the backend and frontend concurrently.

**Terminal 1 (Server):**
```bash
cd server
npm run dev
```

**Terminal 2 (Client):**
```bash
cd client
npm run dev
```

Visit `http://localhost:5173` to start designing!

---

## 🔮 Future Roadmap

- **Version History**: Rollback to previous states of your architecture.
- **Team Permissions**: Granular read/write access controls.
- **Custom Node Templates**: Save and reuse your own node configurations.
- **Docker Support**: Full containerization for easy deployment.

---

*Built with ❤️ by Shreya Maity.*

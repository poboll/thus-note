# Project Brief: Liubai

## Core Purpose
Liubai (如是) is a comprehensive personal information management system that combines notes, calendar, tasks, and to-do lists with AI capabilities. The name "Liubai" (如是) emphasizes the importance of "leaving space" - both in design and in life.

## Primary Goals
1. Create a unified platform for personal information management
2. Provide seamless synchronization across multiple devices
3. Integrate AI capabilities to enhance user productivity
4. Maintain a clean, intuitive interface
5. Ensure data privacy and security
6. Support offline-first functionality

## Core Features
- 📝 Notes & Memos
- 📆 Calendar Management
- 📌 Task Tracking
- 📂 To-Do Lists
- 🤖 AI Integration
- 🔄 Cross-device Sync
- 🌐 Multi-platform Support (Web, Mobile, IDE plugins)

## Technical Stack
- Frontend: Vue 3.x + Vite + TypeScript + PWA
- Backend: Laf Cloud Functions
- Documentation: VitePress
- IDE Integration: VS Code Extension API
- Cloud Storage: MongoDB (via Laf)
- Build Tools: pnpm, esbuild

## Repository Structure
```
.
├─ liubai-backends
│  └─ thus-laf (Backend services)
│  └─ thus-ffmpeg (Media processing)
├─ thus-docs (Documentation)
└─ thus-frontends
   └─ thus-web (Main web application)
   └─ thus-vscode-extension (IDE integration)
```

## Project Scope
### In Scope
- Personal information management
- Cross-platform synchronization
- AI-assisted features
- IDE integration
- Third-party integrations (WeChat, DingTalk, etc.)

### Out of Scope
- Enterprise-level team collaboration
- Social networking features
- Complex project management

## Success Metrics
1. User adoption and retention
2. Offline functionality reliability
3. Sync performance and reliability
4. AI feature effectiveness
5. Cross-platform consistency
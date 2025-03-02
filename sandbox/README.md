# IR Manager Application

This application is designed to manage infrared (IR) remote control information. It consists of a frontend and a backend server.

## Server Roles

-   **Frontend:** Provides a user interface for managing remotes and buttons. It is built with React and TypeScript using Vite.
-   **Backend:** Provides API endpoints for the frontend to manage remotes and buttons, and handles receiving IR data and sending it to an IR transmission service. It is built with Express and TypeScript.
-   **IR Server:** Provides a mock IR transmission service. It receives IR registration requests and returns mock IR data. It also receives IR transmission requests. It is built with Express and TypeScript.

## Directory Structure

```
ir-manager/
├── backend/
│   ├── src/                  # Backend source code
│   │   ├── index.ts          # Main entry point for the backend application
│   │   └── ir-service.ts     # Mock IR transmission service
│   ├── package.json          # Backend dependencies and scripts
│   └── tsconfig.json         # TypeScript configuration
├── ir-server/
│   ├── index.ts              # IR Server source code
│   ├── package.json          # IR Server dependencies and scripts
│   └── tsconfig.json         # TypeScript configuration
├── frontend/
│   ├── src/                  # Frontend source code
│   │   ├── App.tsx           # Main entry point for the frontend application
│   │   ├── components/       # React components
│   │   ├── api/              # API client
│   │   └── assets/           # Assets (e.g., images)
│   ├── public/               # Public assets
│   ├── index.html            # Main HTML file
│   ├── package.json          # Frontend dependencies and scripts
│   └── tsconfig.json         # TypeScript configuration
└── README.md               # This file
└── task.md                 # Task progress
```

## Backend Setup

The backend is built with TypeScript and Express.

-   **Directory:** `backend/`
-   **Main file:** `backend/src/index.ts`
-   **Dependencies:** `express`, `cors`, `sqlite3`, `@types/express`, `@types/cors`, `@types/sqlite3`

## Features

-   **Remote Management:** Add, edit, and delete remotes.
-   **Button Management:** Add, edit, and delete buttons for each remote.
-   **IR Data Capture:** Capture IR data for each button by sending the same signal three times.
-   **IR Data Transmission:** Send captured IR data to an IR transmission service.

## Frontend Setup

The frontend is built with React and TypeScript using Vite.

-   **Directory:** `frontend/`
-   **Main file:** `frontend/src/App.tsx`
-   **Dependencies:** `react`, `react-dom`, `react-router-dom`, `axios`, `@types/react`, `@types/react-dom`

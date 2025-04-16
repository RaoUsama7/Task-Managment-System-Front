# Task Management System

A modern task management application built with Next.js, React, and Redux Toolkit. This application allows users to manage tasks efficiently with features like task creation, updates, assignment, and real-time notifications.

## Features

- User authentication (login/register)
- Dashboard with task overview
- Task creation, editing, and deletion
- Task assignment and tracking
- User profiles
- Real-time updates with Socket.io

## Tech Stack

- **Frontend**: Next.js 15, React 19, Redux Toolkit
- **Styling**: Tailwind CSS 4
- **Data Fetching**: Tanstack React Query
- **Authentication**: JWT with js-cookie
- **Real-time**: Socket.io client

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/task-management-system.git
   cd task-management-system
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Update the variables as needed

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Docker Setup

The application can be containerized using Docker:

1. Build the Docker image:
   ```bash
   docker build -t task-management-system .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 task-management-system
   ```

## Deployment

This project is deployed on [Vercel](https://vercel.com). The live version can be accessed at: [https://your-app-url.vercel.app](https://your-app-url.vercel.app)

## Project Structure

```
app/
├── components/    # Reusable UI components
├── context/       # React context providers
├── dashboard/     # Dashboard page and components
├── features/      # Feature-specific components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
├── login/         # Login page
├── profile/       # User profile page
├── register/      # Registration page
├── services/      # API service functions
├── layout.tsx     # Root layout component
└── page.tsx       # Home page
```

## License

[MIT](LICENSE)

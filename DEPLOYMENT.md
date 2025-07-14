
# Monity Deployment Guide

This guide provides instructions on how to deploy the Monity application, which consists of a Node.js backend and a React frontend.

## Prerequisites

- A [Supabase](https://supabase.com/) account and project.
- [Node.js](https://nodejs.org/) installed on your local machine or deployment server.
- A hosting provider for the Node.js backend (e.g., Heroku, Render, AWS).
- A static site hosting provider for the React frontend (e.g., Vercel, Netlify, GitHub Pages).

## Backend Deployment

The backend is a Node.js application that uses Express and connects to a Supabase database.

### 1. Configure Supabase

- In your Supabase project, navigate to the **SQL Editor** and execute the contents of `supabase_schema.sql` to create the necessary tables.
- Go to **Settings > API** to find your Supabase URL and `anon` key.

### 2. Set Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
PORT=3000
```

- `SUPABASE_URL`: Your Supabase project URL.
- `SUPABASE_KEY`: Your Supabase `anon` (public) key.
- `PORT`: The port on which the backend server will run.

### 3. Install Dependencies and Start the Server

```bash
cd backend
npm install
npm start
```

The backend will be running at `http://localhost:3000` or the URL provided by your hosting service.

## Frontend Deployment

The frontend is a React application built with Vite.

### 1. Set Environment Variables

Create a `.env.local` file in the `frontend` directory:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=your_backend_api_url
```

- `VITE_SUPABASE_URL`: Your Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase `anon` (public) key.
- `VITE_API_URL`: The URL where your backend is deployed (e.g., `https://your-backend.onrender.com`).

### 2. Build the Application

```bash
cd frontend
npm install
npm run build
```

This command generates a `dist` folder in the `frontend` directory containing the static assets.

### 3. Deploy Static Assets

Deploy the contents of the `frontend/dist` directory to your chosen static hosting provider. Configure your hosting provider's build settings to use `npm run build` as the build command and `frontend/dist` as the publish directory. 
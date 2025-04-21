# FocusFlow Productivity App

FocusFlow is a React-based productivity web app combining Pomodoro technique with task management to help users stay focused and accomplish their goals.

## Features

- **User Authentication**: Secure login/signup with Firebase Authentication
- **Pomodoro Timer**: Customizable work/break durations
- **Task Management**: Add, edit, delete and reorder tasks with drag-and-drop
- **Task History**: View completed pomodoro sessions by task
- **Progress Tracking**: Visualize productivity with charts
- **Dark/Light Mode**: Toggle between themes for comfortable viewing

## Technologies Used

- React with TypeScript
- Firebase (Authentication & Firestore)
- Tailwind CSS for styling
- Framer Motion for animations
- React Beautiful DnD for drag-and-drop
- Recharts for data visualization
- React Router for navigation

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a Firebase project and enable Authentication and Firestore
4. Update the `.env` file with your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```
5. Start the development server:
   ```
   npm run dev
   ```

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Add a web app to your Firebase project
3. Enable Email/Password Authentication
4. Create a Firestore database in test mode
5. Copy your Firebase configuration to the `.env` file

## Project Structure

- `/src/components`: UI components organized by feature
- `/src/contexts`: React Context providers for auth and theme
- `/src/hooks`: Custom React hooks including Firestore data hooks
- `/src/pages`: Main application pages/routes
- `/src/services`: Firebase initialization and configuration

## License

This project is open source and available under the MIT License.
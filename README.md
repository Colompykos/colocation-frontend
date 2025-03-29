# Colocation Frontend

This is a React-based frontend application for a student colocation platform that connects with the colocation-backend to provide a complete roommate-finding solution.

## Technologies Used

- **React**: JavaScript library for building the user interface
- **React Router**: Navigation and routing system
- **Firebase SDK**:
  - **Authentication**: User login, registration.
- **Google Maps API**: Location services and map display
- **Cloudinary**: Image hosting and management
- **CSS**: Styling and responsive design

## Installation

```sh
# Clone the repository
git clone git@github.com:Colompykos/colocation-frontend.git

# Navigate to the project directory
cd colocation-frontend

# Install dependencies
npm install

# Set up environment variables
# Download the .env file from the following link and add it to the root of the project:
# https://www.dropbox.com/scl/fo/ymsj675l2a1tz0gcxweje/AL5i5rh9fq1i3XYhEqvGG8U?rlkey=8ulhgbexrg99oktqur4jp0sni&st=axyrgvfo&dl=0

# Start the development server
npm start

# Build for production
npm run build
```

## Features

### User Management
- **Authentication**: Login, registration with email/password or social providers
- **Profile Management**: Create and edit personal profiles with photos
- **Student Verification**: Upload student cards for account verification

### Listings
- **Property Search**: Browse available properties with detailed filtering options
- **Map Integration**: View properties on an interactive map
- **Listing Creation**: Post new property listings with detailed information
- **Media Upload**: Add multiple photos to listings
- **Favorites**: Save preferred properties to a favorites list

### Communication
- **Messaging System**: Real-time chat between users
- **Typing Indicators**: See when someone is typing a message
- **Read Receipts**: Track when messages are read

### Additional Features
- **Alerts System**: Receive notifications about new listings matching preferences
- **Responsive Design**: Mobile-friendly interface for all devices
- **Admin Panel**:
  - User management
  - Listing approval
  - Content moderation

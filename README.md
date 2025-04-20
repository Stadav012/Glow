# Glow Project Team Guide

This document outlines the project structure and team responsibilities for the Glow application. Each team member has specific focus areas and corresponding folders/files to work with.

## Project Structure

The project is organized into two main directories:
- `frontend/`: React-based client application
- `backend/`: Express.js server application

## Team Responsibilities

### Stanley - Authentication Module
Focus areas:
- Backend authentication implementation
- Social integration features

Key folders/files:
- `backend/src/routes/auth/`
- `frontend/src/components/auth/`
- Authentication-related API endpoints

Tasks:
- Implement user authentication system
- Set up social login integration
- Manage user sessions and security

### Arman - Reflection Module
Focus areas:
- Reflection feature implementation
- User interaction components

Key folders/files:
- `backend/src/routes/reflection/`
- `frontend/src/components/reflection/`
- Reflection-related API endpoints

Tasks:
- Develop reflection creation/editing interface
- Implement reflection analytics
- Create reflection sharing features

### Daisy - AI Processing
Focus areas:
- AI integration
- Natural language processing

Key folders/files:
- `backend/src/routes/ai/`
- `frontend/src/components/ai/`
- AI processing utilities

Tasks:
- Implement AI text analysis
- Set up sentiment analysis
- Create AI-powered recommendations

### Sylvia - Mentor Matching System
Focus areas:
- Mentor-mentee matching algorithm
- Profile management

Key folders/files:
- `backend/src/routes/mentor/`
- `frontend/src/components/mentor/`
- Matching system components

Tasks:
- Develop matching algorithm
- Create mentor/mentee profiles
- Implement communication features

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development servers:
```bash
npm run dev
```

This will start both frontend and backend servers concurrently.

## Development Guidelines

- Follow the established folder structure
- Create new components in appropriate directories
- Maintain consistent code style
- Write tests for new features
- Document API endpoints and components

## Stanley

### Social Media API Structure (Planned)

The Social Media API will provide endpoints for retrieving and managing social media data (posts, captions, likes, engagement stats, etc.) for integration with the Reflections module.

#### Base URL
`/api/social`

#### Endpoints

- **GET /api/social/posts**
  - Description: Retrieve a list of social media posts.
  - Response Example:
    ```json
    [
      {
        "id": "123",
        "platform": "instagram",
        "caption": "Excited for the new launch!",
        "mediaUrl": "https://...",
        "likes": 150,
        "comments": 12,
        "timestamp": "2024-06-01T12:00:00Z",
        "engagement": {
          "views": 1000,
          "shares": 10
        }
      }
    ]
    ```

- **GET /api/social/posts/:id**
  - Description: Retrieve details for a single post.
  - Response Example:
    ```json
    {
      "id": "123",
      "platform": "instagram",
      "caption": "Excited for the new launch!",
      "mediaUrl": "https://...",
      "likes": 150,
      "comments": 12,
      "timestamp": "2024-06-01T12:00:00Z",
      "engagement": {
        "views": 1000,
        "shares": 10
      }
    }
    ```

- **GET /api/social/liked-posts**
  - Description: Retrieve a list of posts that the user has liked across connected social platforms.
  - Response Example:
    ```json
    [
      {
        "id": "789",
        "platform": "tiktok",
        "caption": "Inspiring story!",
        "mediaUrl": "https://...",
        "likes": 320,
        "comments": 45,
        "timestamp": "2024-06-02T15:30:00Z",
        "engagement": {
          "views": 5000,
          "shares": 25
        },
        "originalPoster": {
          "username": "creator123",
          "profileUrl": "https://..."
        }
      }
    ]
    ```

- **POST /api/social/posts**
  - Description: Create a new post (if applicable).
  - Request Example:
    ```json
    {
      "platform": "tiktok",
      "caption": "Check out our latest video!",
      "mediaUrl": "https://..."
    }
    ```
  - Response: Created post object.

#### Notes
- All endpoints return JSON.
- Authentication may be required for POST endpoints.
- More endpoints (analytics, comments, liked posts, etc.) can be added as needed.

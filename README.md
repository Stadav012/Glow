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

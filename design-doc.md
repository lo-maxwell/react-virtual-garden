# **Goose Farm Design Overview**

## Project Overview

Goose Farm is a 2D grid-based farming simulator that allows users to create and manage their own gardens. Users can plant seeds, place decorations, and harvest crops to expand their land and customize their gardening experience.

## Problem Identification and Motivation

I wanted to make a browser-based farming game similar to Farmville, but with no ads/IAPs/ways to speed up timers. Ideally players will log on for a few minutes a day to check on their farms and see some progression, without much incentive to either be online all the time or to spend money.

Initial challenges included defining the scope of the simulation (how much complexity to support for crops, plots, and user actions) and identifying a suitable, lightweight tech stack that supports scalability and real-time interactivity within a browser.

## System Architecture

- **Frontend**: React with TypeScript + TailwindCSS, built on Next.js for server-side rendering and routing.
- **Middleware**: Next.js API routes and AWS Lambda functions to handle server-side operations such as saving garden data or managing user inventories.
- **Backend**: AWS RDS (Postgres) to store user profiles, garden states, inventory data, and item definitions.
- **Hosting**: Deployed on Vercel for CI/CD and integration with GitHub.
- **Authentication**: Firebase Auth to manage user sessions securely.
- **Testing**: Jest

The decision to use serverless middleware (Lambda) allows scaling requests efficiently without maintaining dedicated servers. While live service games often rely on persistent websocket connections to support real-time interactions, Goose Farm is designed as a non–real-time, browser-based game. Therefore, a lightweight, lower-overhead architecture was selected to balance performance with development and operational efficiency.

## Key Features

- **User Accounts**: Each user can create an account to manage their own garden.
- **Garden Management**: Users can plant seeds, place decorations, and harvest crops.
- **Inventory System**: Users have an inventory to manage items, including seeds and decorations.
- **Store**: A shop where users can buy items to enhance their gardens.

## Code Structure and Organization

The project follows a modular React-based architecture:

```
virtual-garden/
│
├── app/                          # Next.js app directory (routes, pages, layouts)
│   ├── page.tsx                  # Main landing page
│   ├── layout.tsx                # Root layout and global structure
│   ├── garden/                   # Garden UI and related components
│   ├── store/                    # Store-related views
│   ├── user/                     # User profile and authentication pages
│   ├── login/                    # Login and account management
│   ├── settings/                 # User settings pages
│   └── hooks/                    # Custom React hooks
│
├── components/                   # Reusable UI components
│   ├── garden/                   # Garden grid, plots, visuals
│   ├── inventory/                # Inventory display and management
│   ├── itemStore/                # Store buying/selling interfaces
│   ├── buttons/, lists/, icons/  # UI primitives and utilities
│   ├── layout.tsx                # Global layout components
│   └── errorPages/, header/, user/, developer/
│
├── models/                       # Object-Oriented classes to serve as core game logic and data models
│   ├── garden/                   # Garden and plot model definitions
│   ├── itemStore/                # Item and store logic
│   ├── user/, account/, level/   # Player and progression systems
│   └── events/, utility/         # Game events and helper models
│
├── backend/                      # Server-side logic and AWS integration
│   ├── lambda/                   # AWS Lambda function handlers
│   ├── repositories/             # Database access and query logic
│   ├── services/                 # Higher-level backend services
│   ├── firebase/                 # Firebase Auth integration
│   ├── connection/               # DB connection setup (RDS)
│   └── testing/                  # Backend test utilities
│
├── middleware/                   # Middleware for request handling
│   ├── ipRateLimiter.ts
│   ├── accountRateLimiter.ts
│   └── middleware.ts
│
├── utils/                        # Shared utility modules
│   ├── api/                      # API call helpers
│   ├── firebase/                 # Firebase utilities
│   ├── localStorage/             # Local persistence helpers
│   ├── time/                     # Time and date utilities
│   └── errors.ts
│
├── store/                        # Global state management (Redux)
│   ├── slices/                   # Feature-level state slices
│   └── index.ts
│
├── tests/                        # Unit and integration tests
│   ├── models/, backend/         # Model and backend tests
│   ├── utilities.ts              # Shared testing utilities
│   └── __mocks__/                # Test mocks
│
├── data/                         # SQL scripts and database seeds
│   ├── user/, garden/, items/    # Table data and migrations
│   └── scripts/, final/          # Migration or setup scripts
│
├── public/                       # Static assets served by Next.js
│   ├── assets/, next.svg, vercel.svg
│
├── assets/                       # Additional project assets (e.g., SVGs)
│
├── lambda/                       # Lambda deployment configuration and tests
│   └── rds-sam-app/              # AWS SAM application for RDS integration
│
├── personal_notes/               # Developer notes and SQL experiments
│
├── coverage/                     # Test coverage reports
│
├── .vscode/, .gitignore, .env.*  # Configuration and environment files
├── tailwind.config.ts            # TailwindCSS configuration
├── jest.config.ts                # Jest configuration
├── package.json, tsconfig.json   # Project and TypeScript configs
└── README.md                     # Project overview

```

## Future Improvements

- Expand gameplay with multiplayer or real-time sync.
- Improve database schema for scalability.
- Introduce visual feedback (animations, sound).
- Refine store pricing and economic balance.

## In Progress

- Redesigning UI components for a better user experience
- Adding geese (sorry, they're only here in spirit right now)


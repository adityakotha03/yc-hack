# Frontend Application

A Next.js application that serves as the frontend interface for the MCP Client.

## Requirements

- Node.js (version 18 or higher recommended)
- npm or pnpm package manager

## Installation

1. Clone the repository

2. Navigate to the frontend directory:
```bash
cd frontend
```

3. Install dependencies:
```bash
# Using npm
npm install

# Using pnpm
pnpm install
```

## Running the Application

1. Start the development server:
```bash
# Using npm
npm run dev

# Using pnpm
pnpm dev
```

The application will be available at http://localhost:3000

2. Make sure the MCP client backend is running at http://localhost:8000 before using the frontend application.

## Building for Production

To build the application for production:

```bash
# Using npm
npm run build
npm start

# Using pnpm
pnpm build
pnpm start
```

## Technologies Used

- Next.js 15
- React 19
- Tailwind CSS
- shadcn/ui components
- Axios for API requests 
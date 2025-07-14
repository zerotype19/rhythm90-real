# Rhythm90 Companion App

A modern team performance platform built with React, Tailwind CSS, and Cloudflare Workers.

## 🚀 Features

- **Play Builder**: Transform ideas into testable hypotheses with AI assistance
- **Signal Lab**: Interpret observations and turn them into actionable insights  
- **Ritual Guide**: Create effective team rituals and meeting structures
- **Dashboard**: Overview of team activity and AI suggestions
- **Community Exchange**: Share best practices and learn from other teams
- **Team Management**: Multi-team support with role-based access

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Cloudflare Workers + D1 Database
- **Authentication**: Google OAuth2
- **AI Integration**: OpenAI GPT-4
- **Deployment**: Cloudflare Pages + Workers

## 📦 Project Structure

```
rhythm90-real/
├── src/
│   ├── backend/           # Cloudflare Workers API
│   │   ├── index.ts       # Main worker entry point
│   │   ├── types.ts       # TypeScript interfaces
│   │   ├── utils.ts       # Utility functions
│   │   ├── auth.ts        # Authentication handlers
│   │   ├── teams.ts       # Team management
│   │   └── ai.ts          # AI integration
│   └── frontend/          # React application
│       ├── components/    # Reusable components
│       ├── pages/         # Page components
│       └── lib/           # Utilities and API client
├── migrations/            # Database schema migrations
├── wrangler.toml          # Cloudflare Workers configuration
└── package.json           # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account with Workers and D1 access
- Google OAuth2 credentials
- OpenAI API key

### 1. Clone and Install

```bash
git clone <repository-url>
cd rhythm90-real
npm install
```

### 2. Environment Setup

Create a `.dev.vars` file in the root directory:

```env
# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# JWT Secret for session management
JWT_SECRET=your_jwt_secret_here

# App Configuration
APP_URL=http://localhost:5173
ENVIRONMENT=development
```

### 3. Database Setup

Apply the database migration to your D1 database:

```bash
# Apply migration to production D1
wrangler d1 execute rhythm90-db --file=./migrations/0000_initial_schema.sql --env=production
```

### 4. Development

```bash
# Start frontend development server
npm run dev

# Start backend development server (in another terminal)
wrangler dev --env=development
```

### 5. Build and Deploy

```bash
# Build frontend
npm run build

# Deploy to Cloudflare (commits trigger automatic deployment)
git add .
git commit -m "Your commit message"
git push origin main
```

## 🔧 Configuration

### Cloudflare Workers

The backend is configured in `wrangler.toml`:

```toml
name = "rhythm90-real"
main = "src/backend/index.ts"
compatibility_date = "2024-01-15"

[env.production]
name = "rhythm90-real"
[[env.production.d1_databases]]
binding = "DB"
database_name = "rhythm90-db"
database_id = "73d8857c-97f9-4cfa-800a-225d7346be67"
```

### Frontend

The frontend uses Vite with React and Tailwind CSS. Configuration files:

- `vite.frontend.config.ts` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration

## 📊 Database Schema

The application uses the following D1 database tables:

- `users` - User accounts and profiles
- `teams` - Team information and settings
- `team_members` - User-team relationships and roles
- `subscriptions` - Team subscription and billing info
- `plays` - Hypotheses and strategies
- `signals` - Observations and interpretations

## 🔐 Authentication

The app uses Google OAuth2 for authentication:

1. Users sign in with their Google account
2. JWT tokens are generated for session management
3. All API endpoints require valid authentication
4. Team context is maintained throughout the session

## 🤖 AI Integration

AI features are powered by OpenAI GPT-4:

- **Play Builder**: Converts ideas into testable hypotheses
- **Signal Lab**: Interprets observations with confidence scores
- **Ritual Guide**: Generates meeting agendas and discussion prompts

## 🎨 Design System

The app uses a clean, minimal design with:

- **Primary Colors**: Black, white, gray with red accents
- **Typography**: Modern, readable fonts
- **Components**: Consistent UI patterns with Tailwind CSS
- **Responsive**: Mobile-first design approach

## 📱 Pages and Routing

- `/` - Public landing page
- `/login` - Google OAuth sign-in
- `/app/dashboard` - Team dashboard
- `/app/play-builder` - Hypothesis creation tool
- `/app/signal-lab` - Observation interpretation
- `/app/ritual-guide` - Meeting structure generator
- `/app/community` - Team collaboration (coming soon)
- `/app/settings` - Team and account management
- `/app/team-benchmarking` - Performance tracking (coming soon)

## 🚀 Deployment

The app is automatically deployed via Cloudflare Pages:

1. Push changes to the main branch
2. Cloudflare Pages builds the frontend
3. Cloudflare Workers deploys the backend API
4. No manual deployment steps required

## 🔧 Development Workflow

1. **Local Development**: Use `npm run dev` and `wrangler dev`
2. **Database Changes**: Create new migration files
3. **Testing**: Test locally before pushing
4. **Deployment**: Commit and push to trigger automatic deployment

## 📝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is proprietary software for Rhythm90.

## 🆘 Support

For support or questions, please contact the development team. 
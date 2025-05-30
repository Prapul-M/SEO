# SEO Automation Platform

A modern SEO automation platform built with Next.js, React Three Fiber, and Supabase. The platform provides AI-powered SEO optimization tools with a beautiful 3D visualization interface.

## Features

- 🤖 AI-powered SEO analysis and recommendations
- 🌐 Real-time SEO performance monitoring
- 📊 Interactive 3D data visualization
- 🌍 Worldwide timezone support
- 🔄 Automated SEO optimization
- 📱 Responsive modern UI with glassmorphism effects

## Prerequisites

- Node.js 18.x or later
- npm 8.x or later
- A Supabase account
- OpenAI API key (for AI features)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd seo-automation
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key

# GitHub OAuth (optional)
GITHUB_ID=your-github-oauth-client-id
GITHUB_SECRET=your-github-oauth-client-secret

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run automation` - Run SEO automation tasks

## Project Structure

```
/
├── components/        # React components
├── pages/            # Next.js pages
├── public/           # Static assets
├── scripts/         # Build and automation scripts
├── styles/          # Global styles
└── types/           # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
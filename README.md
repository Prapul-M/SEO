# SEO Automation App

A powerful SEO automation tool built with GPT-4 Turbo to analyze and improve your website's SEO performance. This application helps you identify SEO issues, provides keyword suggestions, and automatically creates pull requests with suggested improvements.

## Features

- **GitHub Integration**: Connect your GitHub repositories for automatic SEO analysis
- **Content Analysis**: Analyze your HTML content for SEO best practices
- **Keyword Suggestions**: Get trending and relevant keyword suggestions for your content
- **Automated Improvements**: Generate pull requests with SEO improvements (with your approval)
- **Daily Scans**: Set up automatic daily scans of your repositories
- **Email Alerts**: Receive email notifications when SEO issues are detected
- **SEO Dashboard**: View your SEO scores and track improvements over time

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Node.js with Fastify
- **Database**: Supabase
- **Authentication**: Auth.js (NextAuth)
- **Cache**: Upstash Redis
- **Email**: Resend.com
- **AI**: OpenAI GPT-4 Turbo
- **Integration**: GitHub API

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/seo-automation-app.git
   cd seo-automation-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment variables file and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## CLI Usage

The app includes a command-line tool for SEO analysis:

```bash
# Analyze a local HTML file
npx ts-node scripts/seoScan.ts file ./public/sample.html

# Analyze a public URL
npx ts-node scripts/seoScan.ts url https://example.com

# Analyze a GitHub repository
npx ts-node scripts/seoScan.ts repo username/repository

# Include specific keywords to target
npx ts-node scripts/seoScan.ts file ./public/sample.html --keywords seo,automation,ai

# Save results to a file
npx ts-node scripts/seoScan.ts file ./public/sample.html --output results.json
```

## Automated GitHub Workflow

This app includes a GitHub Action that automatically runs SEO scans on a daily basis. To enable this:

1. Add your repository secrets in GitHub:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `GITHUB_TOKEN`: Your GitHub personal access token
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_KEY`: Your Supabase anon key
   - `RESEND_API_KEY`: Your Resend API key

2. The workflow will run automatically every day at midnight UTC.

## License

MIT

## Acknowledgments

- OpenAI for GPT-4 Turbo
- Next.js team for the amazing framework
- ShadCN UI for the beautiful components 
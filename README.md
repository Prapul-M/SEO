# SEO Automation App

An intelligent application that automatically analyzes and improves SEO for GitHub repositories. The app scans HTML files in repositories, identifies SEO issues, and creates pull requests with improvements.

## Features

- **GitHub Repository Integration**: Connect with your GitHub account and select repositories to analyze
- **Comprehensive SEO Analysis**: Scan HTML files for SEO issues including:
  - Title tag optimization
  - Meta descriptions
  - Heading hierarchy
  - Image alt text
  - Content quality
  - Keyword usage
- **Detailed Reports**: Get page-by-page and section-by-section analysis of SEO issues
- **Automated Improvements**: Apply recommended changes with one click through GitHub pull requests
- **Email Notifications**: Receive detailed SEO reports via email
- **Dashboard Tracking**: Monitor SEO scores and improvement opportunities for all repositories

## Getting Started

### Prerequisites

- Node.js 16.x or later
- GitHub account with repository access
- Email account for notifications

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/seo-automation-app.git
   cd seo-automation-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with the following variables:
   ```
   # Authentication
   GITHUB_ID=your_github_oauth_client_id
   GITHUB_SECRET=your_github_oauth_client_secret
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   
   # OpenAI (Optional - mock implementation used if not provided)
   OPENAI_API_KEY=your_openai_api_key
   
   # Email notifications
   RESEND_API_KEY=your_resend_api_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Sign in with GitHub**: Authenticate with your GitHub account
2. **Connect Repositories**: Your GitHub repositories will automatically appear on the dashboard
3. **Scan for SEO Issues**: Select a repository and click "Scan Now" to analyze HTML files
4. **Review Analysis**: View detailed SEO analysis including scores, issues, and suggested improvements
5. **Apply Changes**: Review suggested changes and click "Apply Changes" to create a pull request with improvements
6. **Check Email**: Receive a detailed SEO report via email (if email notifications are configured)

## Technologies Used

- Next.js
- NextAuth.js for authentication
- GitHub API for repository access
- OpenAI API for intelligent SEO analysis
- Resend for email notifications
- Tailwind CSS for styling

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for AI-powered SEO analysis
- GitHub for repository integration
- The Next.js team for the framework 
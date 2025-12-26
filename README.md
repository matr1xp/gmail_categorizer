# Gmail Categorizer

An intelligent email automation tool that uses Large Language Models (LLMs) to automatically categorize unread emails in your Gmail inbox. The tool analyzes email subjects and snippets, then applies appropriate labels to help you organize your inbox efficiently.

## Features

- 🤖 **AI-Powered Categorization**: Uses Google's Gemini 2.0 Flash model to intelligently categorize emails
- 📧 **Automatic Labeling**: Automatically creates and applies category labels to unread emails
- ⚡ **Batch Processing**: Process a specific number of emails or all unread emails at once
- 🔄 **Smart Filtering**: Skips emails that are already categorized to avoid duplicate processing
- 🏷️ **Predefined Categories**: 17 predefined categories covering common email types
- 🔐 **Secure Authentication**: Uses OAuth2 for secure Gmail API access

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Google Cloud Platform account
- A Google account with Gmail access
- A Gemini API key (from Google AI Studio)

## Installation

1. **Clone or download this repository**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

## Configuration

### Step 1: Google Cloud Platform Setup

Follow the detailed authentication setup guide in [`docs/auth_setup_guide.md`](docs/auth_setup_guide.md) to:

1. Enable the Gmail API in Google Cloud Console
2. Configure OAuth consent screen
3. Create OAuth credentials
4. Download `credentials.json` and place it in the project root

### Step 2: OAuth Authorization

After setting up credentials, you need to authorize the application.

**Option 1: Interactive Authorization (Recommended)**

Run the interactive authorization script:
```bash
npm run authorize
```

This will:
1. Display the authorization URL
2. Prompt you to visit the URL and authorize the app
3. Ask you to paste the authorization code
4. Automatically save the token

**Option 2: Manual Two-Step Process**

If you prefer a manual approach:

1. **Get the authorization URL:**
   ```bash
   npm run show-url
   ```

2. **Visit the URL** in your browser and authorize the application

3. **Copy the authorization code** from the redirect URL

4. **Save the token:**
   ```bash
   npm run save-token -- <authorization_code>
   ```

Both methods will create a `token.json` file that stores your authentication credentials.

### Step 3: Gemini API Key

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

2. Create a `.env` file in the project root:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

## Usage

### Basic Usage

Process unread emails (default: 20 emails):
```bash
npm start
```

Or using the development mode:
```bash
npm run dev
```

### Command Line Options

**Process all unread emails:**
```bash
npm start -- --all
```

**Process a specific number of emails:**
```bash
npm start -- --limit 50
```

**Examples:**
```bash
# Process 10 unread emails
npm start -- --limit 10

# Process all unread emails
npm start -- --all

# Development mode with limit
npm run dev -- --limit 30
```

## Email Categories

The tool automatically categorizes emails into the following predefined categories:

- **Newsletter**: Subscription updates or promotional content
- **Inquiry**: Emails requesting information or responses
- **Invoice**: Billing and payment-related emails
- **Proposal**: Business offers or collaboration opportunities
- **Action Required**: Emails demanding immediate tasks or actions
- **Follow-up Reminder**: Emails prompting follow-up actions
- **Task**: Emails containing actionable tasks
- **Personal**: Non-work-related emails
- **Urgent**: Time-sensitive or critical communications
- **Bank**: Banking alerts and financial statements
- **Job Update**: Recruitment or job-related communications
- **Spam/Junk**: Unwanted or irrelevant bulk emails
- **Social/Networking**: Notifications from social platforms
- **Receipt**: Purchase confirmations and receipts
- **Event Invite**: Invitations or calendar-related messages
- **Subscription Renewal**: Reminders for subscription expirations
- **System Notification**: Technical alerts from services or systems

Labels are automatically created in your Gmail account if they don't already exist.

## How It Works

1. **Authentication**: The tool authenticates with Gmail using OAuth2 credentials
2. **Label Setup**: Ensures all category labels exist in your Gmail account
3. **Email Fetching**: Retrieves unread emails from your inbox
4. **Categorization**: For each uncategorized email, the tool:
   - Extracts the subject and snippet
   - Sends it to the Gemini API for categorization
   - Applies the appropriate label to the email
5. **Reporting**: Displays a summary of processed, skipped, and total emails

## Project Structure

```
Gmail_Categorizer/
├── src/
│   ├── config/
│   │   └── labels.ts          # Category definitions
│   ├── services/
│   │   ├── auth.ts            # OAuth2 authentication
│   │   ├── categorizer.ts     # LLM categorization logic
│   │   └── gmail.ts           # Gmail API interactions
│   ├── scripts/               # Utility scripts
│   └── index.ts               # Main entry point
├── dist/                      # Compiled JavaScript
├── docs/
│   └── auth_setup_guide.md    # Detailed setup instructions
├── credentials.json           # OAuth2 credentials (not in repo)
├── token.json                 # OAuth2 token (not in repo)
└── .env                       # Environment variables (not in repo)
```

## Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled application
- `npm run dev` - Run in development mode with ts-node
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Troubleshooting

### Authentication Issues

- **"credentials.json not found"**: Make sure you've downloaded the OAuth credentials from Google Cloud Console and placed them in the project root
- **"token.json not found"**: Run the authorization flow using `scripts/show-url.ts` and `scripts/save-token.ts`
- **"Invalid credentials"**: Your token may have expired. Re-run the authorization flow

### API Issues

- **"GEMINI_API_KEY is missing"**: Make sure you've created a `.env` file with your Gemini API key
- **Categorization not working**: Check that your Gemini API key is valid and has sufficient quota

### Gmail API Issues

- **"Insufficient permissions"**: Make sure you've granted the `gmail.modify` scope during authorization
- **Rate limiting**: The Gmail API has rate limits. If you're processing many emails, the tool includes batching to handle this

## Security Notes

- Never commit `credentials.json`, `token.json`, or `.env` to version control
- Keep your API keys secure and rotate them if compromised
- The OAuth token provides access to modify your Gmail labels - only use this tool with trusted code

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues related to:
- **Gmail API**: Check the [Gmail API documentation](https://developers.google.com/gmail/api)
- **Gemini API**: Check the [Google AI documentation](https://ai.google.dev/docs)
- **OAuth Setup**: See [`docs/auth_setup_guide.md`](docs/auth_setup_guide.md)


# Google Cloud Platform & Gmail API Setup Guide

## Phase 1: Enable the Gmail API
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project.
3. In the sidebar, go to **APIs & Services** > **Library**.
4. Search for `Gmail API`.
5. Click on **Gmail API** and click the **Enable** button.

## Phase 2: Configure OAuth Consent Screen
1. In the sidebar, go to **APIs & Services** > **OAuth consent screen**.
2. Select **External** (unless you are in a Workspace organization and want to restrict it internal-only).
3. Click **Create**.
4. **App Information**:
   - App name: `Gmail Categorizer`
   - User support email: Select your email.
   - Developer contact information: Enter your email.
   - Click **Save and Continue**.
5. **Scopes**:
   - Click **Add or Remove Scopes**.
   - Search for `gmail.modify` or manually add `https://www.googleapis.com/auth/gmail.modify`.
   - Select it and click **Update**.
   - Click **Save and Continue**.
6. **Test Users**:
   - Click **Add Users**.
   - Enter your own email address (the one you want to categorize).
   - Click **Add**.
   - Click **Save and Continue**.
7. Review and click **Back to Dashboard**.

## Phase 3: Create Credentials
1. In the sidebar, go to **APIs & Services** > **Credentials**.
2. Click **+ CREATE CREDENTIALS** at the top.
3. Select **OAuth client ID**.
4. **Application type**: Select **Desktop app**.
   - *Note: If 'Desktop app' isn't available, check that you finished the Consent Screen setup.*
5. **Name**: `Gmail Categorizer Desktop Client` (or similar).
6. Click **Create**.
7. A popup will appear with "Your Client ID" and "Your Client Secret".
8. Click the **Download JSON** button (usually an icon with a down arrow).
9. Save this file as `credentials.json`.

## Phase 4: Project Setup
1. Move the `credentials.json` file to the root of this project folder:
   `/Users/marlon/workspace/Projects/Gmail_Categorizer/credentials.json`

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs/promises';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

export async function getAuthUrl(): Promise<string> {
    const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;

    const oAuth2Client = new google.auth.OAuth2(
      key.client_id,
      key.client_secret,
      key.redirect_uris[0]
    );

    return oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
}

export async function authenticate(): Promise<OAuth2Client> {
    const content = await fs.readFile(TOKEN_PATH, 'utf-8');
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials) as OAuth2Client;
}

async function loadSavedCredentialsIfExist(): Promise<OAuth2Client | null> {
  try {
    const content = await fs.readFile(TOKEN_PATH, 'utf-8');
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials) as OAuth2Client;
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client: OAuth2Client): Promise<void> {
  const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function authenticateWithLocalServer(): Promise<OAuth2Client> {
    const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;

    const oAuth2Client = new google.auth.OAuth2(
      key.client_id,
      key.client_secret,
      key.redirect_uris[0]
    );

    // If we're running in an environment where we can open a browser, we could use localAuth
    // But since we are an agent, we might need to output the URL for the user.
    // However, @google-cloud/local-auth is designed for local machines. 
    // Let's rely on a manual copy-paste flow for robustness in this environment if local-auth fails or if we want better control.
    
    // Actually, let's implement the manual flow to be safe as `local-auth` might hang if it can't open a browser.
    
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    console.log('Authorize this app by visiting this url:', authUrl);
    
    // We need the user to input the code. 
    // This function will likely be called from a script that handles stdin.
    // For now, let's assume we are running this via a helper script.
    
    return oAuth2Client;
}

export async function authorizeManual(code: string): Promise<OAuth2Client> {
    const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;

    const oAuth2Client = new google.auth.OAuth2(
      key.client_id,
      key.client_secret,
      key.redirect_uris[0]
    );
    
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    await saveCredentials(oAuth2Client);
    return oAuth2Client;
}

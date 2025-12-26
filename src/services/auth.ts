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

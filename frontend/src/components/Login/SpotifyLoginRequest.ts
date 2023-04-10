const CLIENT_ID = process.env.REACT_APP_CLIENT_ID || null;
const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI;

function generateRandomString(length: number) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier: string) {
  function base64encode(string: ArrayBuffer): string {
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(string))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);

  return base64encode(digest);
}

export const handleSpotifyLogin = async () => {
  const codeVerifier = generateRandomString(128);

  await generateCodeChallenge(codeVerifier).then(codeChallenge => {
    const state = generateRandomString(16);
    const scope = 'streaming user-read-private user-read-email';

    localStorage.setItem('code-verifier', codeVerifier);
    if (CLIENT_ID && REDIRECT_URI) {
      const args = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: scope,
        redirect_uri: REDIRECT_URI,
        state: state,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
      });

      const win: Window = window;
      win.location = 'https://accounts.spotify.com/authorize?' + args;
    }
  });
};

function processTokenResponse(data: {
  access_token: string;
  expires_in: number;
  refresh_token: string;
}) {
  localStorage.setItem('access-token', data.access_token);
  localStorage.setItem('access-token-expired', (Date.now() + data.expires_in * 1000).toString());
  localStorage.setItem('refresh-token', data.refresh_token);

  window.history.replaceState(null, '', window.location.pathname);
}

export async function exchangeToken(code: string) {
  const codeVerifier = localStorage.getItem('code-verifier');
  if (code && CLIENT_ID && codeVerifier && REDIRECT_URI) {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: codeVerifier,
    });

    fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('HTTP status ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        processTokenResponse(data);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
}

export async function refreshToken(refresh_token: string) {
  if (CLIENT_ID) {
    fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('HTTP status ' + response.status);
        }
        return response.json();
      })
      .then(processTokenResponse)
      .catch(error => {
        console.error('Error:', error);

        localStorage.removeItem('access-token');
        localStorage.removeItem('access-token-expired');
        localStorage.removeItem('refresh-token');
      });
  }
}

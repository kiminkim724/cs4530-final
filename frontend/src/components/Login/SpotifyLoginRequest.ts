const CLIENT_ID = process.env.REACT_APP_CLIENT_ID || null;
const REDIRECT_URI = 'http://localhost:3000';

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
    if (CLIENT_ID) {
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

export async function exchangeToken(code: string) {
  const codeVerifier = localStorage.getItem('code-verifier');
  if (code && CLIENT_ID && codeVerifier) {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: codeVerifier,
    });

    console.log('test');
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
        localStorage.setItem('access-token', data.access_token);
        window.history.replaceState(null, '', window.location.pathname);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
}

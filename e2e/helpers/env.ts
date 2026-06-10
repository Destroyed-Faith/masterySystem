export interface FoundryEnv {
  url: string;
  gameUrl?: string;
  worldName?: string;
  username: string;
  password?: string;
  adminPassword?: string;
}

export function loadFoundryEnv(): FoundryEnv | null {
  const url = process.env.FOUNDRY_URL?.trim();
  if (!url) return null;

  return {
    url: url.replace(/\/$/, ''),
    gameUrl: process.env.FOUNDRY_GAME_URL?.trim() || undefined,
    worldName: process.env.FOUNDRY_WORLD?.trim() || undefined,
    username: process.env.FOUNDRY_USERNAME?.trim() || 'Gamemaster',
    password: process.env.FOUNDRY_PASSWORD?.trim() || undefined,
    adminPassword: process.env.FOUNDRY_ADMIN_PASSWORD?.trim() || undefined,
  };
}

export function requireFoundryEnv(): FoundryEnv {
  const env = loadFoundryEnv();
  if (!env) {
    throw new Error(
      'FOUNDRY_URL is not set. Copy e2e/.env.example to e2e/.env and configure your Foundry instance.',
    );
  }
  return env;
}

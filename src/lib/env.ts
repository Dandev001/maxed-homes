/**
 * Environment variable validation and access
 * 
 * This module validates required environment variables on app startup
 * and provides type-safe access to environment configuration.
 */

interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiBaseUrl: string;
  nodeEnv: 'development' | 'staging' | 'production';
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Validates that a required environment variable is present
 */
function requireEnv(name: string): string {
  const value = import.meta.env[name];
  
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Please check your .env.local file and ensure ${name} is set.\n` +
      `See .env.example for required variables.`
    );
  }
  
  return value;
}

/**
 * Gets an optional environment variable with a default value
 */
function getEnv(name: string, defaultValue: string): string {
  return import.meta.env[name] || defaultValue;
}

/**
 * Validates and returns all environment configuration
 */
function validateEnv(): EnvConfig {
  // Required variables
  const supabaseUrl = requireEnv('VITE_SUPABASE_URL');
  const supabaseAnonKey = requireEnv('VITE_SUPABASE_ANON_KEY');
  
  // Optional variables with defaults
  const apiBaseUrl = getEnv('VITE_API_BASE_URL', 'http://localhost:3000/api');
  const nodeEnv = (getEnv('NODE_ENV', 'development') as 'development' | 'staging' | 'production');
  
  // Validate Supabase URL format
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    throw new Error(
      `Invalid VITE_SUPABASE_URL format: ${supabaseUrl}\n` +
      `Expected format: https://your-project-id.supabase.co`
    );
  }
  
  // Validate Supabase key format (should start with eyJ for JWT)
  if (!supabaseAnonKey.startsWith('eyJ')) {
    console.warn(
      `Warning: VITE_SUPABASE_ANON_KEY doesn't appear to be a valid JWT token.\n` +
      `Please verify your key from Supabase dashboard: Settings > API`
    );
  }
  
  return {
    supabaseUrl,
    supabaseAnonKey,
    apiBaseUrl,
    nodeEnv,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
  };
}

// Validate environment variables on module load
let envConfig: EnvConfig | null = null;
let envError: Error | null = null;

try {
  envConfig = validateEnv();
} catch (error) {
  envError = error instanceof Error ? error : new Error(String(error));
  // In development, show helpful error message
  if (import.meta.env.DEV) {
    console.error('\n❌ Environment Configuration Error:\n');
    console.error(envError.message);
    console.error('\n📝 To fix this:');
    console.error('1. Check your .env.local file');
    console.error('2. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
    console.error('3. Restart the development server\n');
  }
}

/**
 * Exported environment configuration
 * All required variables are validated on import
 * If validation fails, this will throw when accessed
 */
export const env = new Proxy({} as EnvConfig, {
  get(target, prop) {
    if (envError) {
      throw envError;
    }
    if (!envConfig) {
      throw new Error('Environment configuration not initialized');
    }
    return envConfig[prop as keyof EnvConfig];
  }
});

/**
 * Check if environment is properly configured
 */
export function isEnvConfigured(): boolean {
  return envConfig !== null && envError === null;
}

/**
 * Get environment error if any
 */
export function getEnvError(): Error | null {
  return envError;
}

/**
 * Helper to check if we're in development mode
 */
export const isDev = envConfig?.isDevelopment ?? import.meta.env.DEV;

/**
 * Helper to check if we're in production mode
 */
export const isProd = envConfig?.isProduction ?? import.meta.env.PROD;


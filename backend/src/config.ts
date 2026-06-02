// Supabase Configuration
export const supabaseConfig = {
  url: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  anonKey: process.env.SUPABASE_ANON_KEY || '',
  serviceKey: process.env.SUPABASE_SERVICE_KEY || ''
};

// GROQ Configuration
export const groqConfig = {
  apiKey: process.env.GROQ_API_KEY || '',
  model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768'
};

// Application Configuration
export const appConfig = {
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001'),
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info'
};

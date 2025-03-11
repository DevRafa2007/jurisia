/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    GROQ_API_KEY: process.env.GROQ_API_KEY,
  },
  // Configurações adicionais para otimização no Vercel
  poweredByHeader: false,
  compress: true,
  images: {
    domains: ['api.groq.com'],
    unoptimized: false,
  },
  // Configurações para TypeScript
  typescript: {
    // Verificação rigorosa de tipos para garantir código de qualidade
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig 
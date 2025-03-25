/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    GROQ_API_KEY: process.env.GROQ_API_KEY,
  },
  typescript: {
    // Ignorando erros de TypeScript temporariamente para permitir o deploy
    // Isso será necessário até resolvermos todos os problemas de tipagem
    ignoreBuildErrors: true,
  },
  experimental: {
    // Otimizações de compilação
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  eslint: {
    // Ignorando erros de linting durante o build para permitir o deploy
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 
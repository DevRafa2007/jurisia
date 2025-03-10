/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    GROQ_API_KEY: process.env.GROQ_API_KEY,
  },
  typescript: {
    // !! ATENÇÃO !!
    // Ignorando erros de TypeScript temporariamente
    // Remova isso em produção
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig 
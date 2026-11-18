import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite la IP local si existe en el .env, si no, usa un arreglo vacío o valores por defecto
  allowedDevOrigins: process.env.DEV_WIFI_IP ? [process.env.DEV_WIFI_IP] : [],
};

export default nextConfig;
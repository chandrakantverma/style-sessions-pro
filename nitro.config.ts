import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  // Set via environment variable: NITRO_PRESET=vercel npm run build
  // Vercel sets NITRO_PRESET automatically when this env var is configured
  // in the Vercel dashboard or vercel.json build.env.
});

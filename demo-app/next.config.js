/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // snarkjs + ffjavascript + circomlibjs reference Node-only builtins.
      // Stub them out for the browser bundle.
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        crypto: false,
        os: false,
        readline: false
      };
    }
    return config;
  }
};

module.exports = nextConfig;

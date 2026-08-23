module.exports = {
  apps: [
    {
      name: "mazad",
      script: "node_modules/tsx/dist/cli.mjs",
      args: "server/index.ts",
      cwd: __dirname,
      interpreter: "none",
      env: {
        NODE_ENV: "production",
      },
      // Environment-specific values (MONGODB_URI, AUTH_SECRET, PORT,
      // PRIVATE_UPLOAD_DIR) must be set in the actual deployment environment
      // or a .env file loaded via --env-file — never hardcoded here.
      //
      // Single instance only: Socket.IO rooms are held in this process's
      // memory. Running multiple instances (cluster mode) would silently
      // drop realtime events for clients connected to a different worker
      // than the one that handled a given bid — that requires a Socket.IO
      // Redis adapter (not configured here) before scaling out safely.
      // The auction/bid database writes themselves are already safe under
      // multiple instances (atomic conditional updates); only the realtime
      // fan-out is the constraint.
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "500M",
      autorestart: true,
      watch: false,
      merge_logs: true,
      out_file: "logs/mazad-out.log",
      error_file: "logs/mazad-error.log",
      time: true,
    },
  ],
};

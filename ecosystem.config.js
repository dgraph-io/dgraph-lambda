module.exports = {
  apps: [
    {
      name: "dgraph-lambda",
      script: "./dist/index.js",
      instances: 1,
      exp_backoff_restart_delay: 100,
      max_memory_restart: "1G",
      watch: ["./script/script.js"],
      watch_options: {
        followSymlinks: false,
      },
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};

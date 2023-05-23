module.exports = {
  apps: [
    {
      name: "dgraph-lambda",
      script: "./dist/index.js",
      instances: Number(process.env.INSTANCES || 4),
      exp_backoff_restart_delay: 100,
      max_memory_restart: process.env.MAX_MEMORY_LIMIT || "64M",
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
// add the option       node_args: ["--inspect"], to enable debugging.
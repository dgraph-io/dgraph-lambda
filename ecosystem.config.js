module.exports = {
    apps : [{
        name: "dgraph-lambda",
        script: "./dist/index.js",
        instances: 4,
        watch: ["script.js"],
        exec_mode  : "cluster",
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
        }
    }]
}
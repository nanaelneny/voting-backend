const sql = require("mssql");
require("dotenv").config();

const dbConfig = {
    user: process.env.DB_USER, // e.g., 'sa'
    password: process.env.DB_PASSWORD, // e.g., 'yourStrong(!)Password'
    server: process.env.DB_SERVER, // 🟢 e.g., 'localhost' or '127.0.0.1'
    database: process.env.DB_NAME, // e.g., 'VotingDB'
    options: {
        encrypt: true, // use true for Azure
        trustServerCertificate: true, // change to true for local dev / self-signed certs
    }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log("✅ Connected to SQL Server");
        return pool;
    })
    .catch(err => {
        console.error("❌ Database connection failed:", err);
        process.exit(1);
    });

module.exports = {
    sql,
    poolPromise
};

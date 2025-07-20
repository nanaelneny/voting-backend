const sql = require("mssql");
require("dotenv").config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false, // set to false for local dev
        trustServerCertificate: true, // allow self-signed certs
    },
};

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(async (pool) => {
        console.log("✅ Connected to SQL Server");

        try {
            // 🟢 Debug: Check current DB
            const result = await pool.request().query("SELECT DB_NAME() AS current_database");
            console.log("🗄 Connected to database:", result.recordset[0].current_database);
        } catch (err) {
            console.error("❌ Failed to fetch current DB:", err);
        }

        return pool;
    })
    .catch((err) => {
        console.error("❌ Database connection failed:", err);
        process.exit(1);
    });

// 🟢 Add query helper
async function query(sqlQuery, params = {}) {
    const pool = await poolPromise;
    const request = pool.request();

    for (const key in params) {
        request.input(key, params[key]);
    }

    return request.query(sqlQuery);
}

module.exports = {
    sql,
    poolPromise,
    query,
};

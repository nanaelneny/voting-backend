const { sql, poolPromise } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register User
exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "Username, email, and password are required" });
    }

    try {
        const pool = await poolPromise;

        // 🔍 Check if email already exists
        const checkRequest = pool.request();
        const existingUser = await checkRequest
            .input("email", sql.VarChar, email)
            .query(`SELECT id FROM Users WHERE email = @email`);

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ error: "❌ Email already exists" });
        }

        // 🔒 Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // ➕ Insert new user (fresh request)
        const insertRequest = pool.request();
        await insertRequest
            .input("username", sql.VarChar, username)
            .input("email", sql.VarChar, email)
            .input("password", sql.VarChar, hashedPassword)
            .input("role", sql.VarChar, "admin")
            .query(`
                INSERT INTO Users (username, email, password, role) 
                OUTPUT Inserted.id
                VALUES (@username, @email, @password, @role)
            `);

        console.log("✅ User registered successfully");
        res.status(201).json({ message: "✅ User registered successfully" });
    } catch (err) {
        console.error("❌ Error registering user:", err);
        res.status(500).json({ error: "❌ Server error" });
    }
};

// Login User
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const pool = await poolPromise;

        // 🔍 Fetch user by email
        const request = pool.request();
        const result = await request
            .input("email", sql.VarChar, email)
            .query(`SELECT * FROM Users WHERE email = @email`);

        const user = result.recordset[0];

        if (!user) {
            return res.status(400).json({ error: "❌ Invalid credentials" });
        }

        // 🔑 Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "❌ Invalid credentials" });
        }

        // 🪙 Create JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        console.log("✅ User logged in successfully");
        res.json({ message: "✅ Login successful", token });
    } catch (err) {
        console.error("❌ Error logging in:", err);
        res.status(500).json({ error: "❌ Server error" });
    }
};

const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const db = new sqlite3.Database("users.db");

// Create the users table
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, role TEXT DEFAULT 'user')");

    const saltRounds = 10;

    const users = [
        { username: "user1", password: "password1" },
        { username: "user2", password: "password2" },
        { username: "admin", password: "adminpass", role: "admin" }
    ];

    // Function to hash a password and insert the user
    const insertUser = (user) => {
        return new Promise((resolve, reject) => {
            bcrypt.hash(user.password, saltRounds, (err, hashedPassword) => {
                if (err) {
                    reject(err);
                    return;
                }

                db.run(
                    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                    [user.username, hashedPassword, user.role || 'user'],
                    (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    }
                );
            });
        });
    };

    const insertAllUsers = async () => {
        for (const user of users) {
            try {
                await insertUser(user);
                console.log(`User ${user.username} inserted successfully.`);
            } catch (err) {
                console.error(`Error inserting user ${user.username}:`, err);
            }
        }
    };

    insertAllUsers();

    // Create the reported_emails table 
    db.run(`
        CREATE TABLE IF NOT EXISTS reported_emails (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender TEXT,
            subject TEXT,
            received TEXT
        )
    `);

    // Create the reviewed_phishing_emails table 
    db.run(`
        CREATE TABLE IF NOT EXISTS reviewed_phishing_emails (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender TEXT,
            subject TEXT,
            received TEXT
        )
    `);

    // Create the quiz_results table
    db.run(`
        CREATE TABLE IF NOT EXISTS quiz_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Function to insert email data with duplicate check
    const insertEmail = (email) => {
        const { sender, subject, received } = email;

        db.get("SELECT * FROM reported_emails WHERE subject = ? AND sender = ? AND received = ?", [subject, sender, received], (err, row) => {
            if (err) {
                console.error("Error checking for duplicate:", err);
                return;
            }

            if (row) {
                console.log("Duplicate email detected. Skipping insert.");
            } else {
                const query = "INSERT INTO reported_emails (sender, subject, received) VALUES (?, ?, ?)";
                db.run(query, [sender, subject, received], (err) => {
                    if (err) {
                        console.error("Error inserting email:", err);
                    } else {
                        console.log(`Email from ${sender} inserted successfully.`);
                    }
                });
            }
        });
    };

    // Function to insert reviewed phishing emails
    const insertReviewedEmail = (email) => {
        const { sender, subject, received } = email;

        db.get("SELECT * FROM reviewed_phishing_emails WHERE subject = ? AND sender = ? AND received = ?", [subject, sender, received], (err, row) => {
            if (err) {
                console.error("Error checking for duplicate:", err);
                return;
            }

            if (row) {
                console.log("Duplicate reviewed email detected. Skipping insert.");
            } else {
                const query = "INSERT INTO reviewed_phishing_emails (sender, subject, received) VALUES (?, ?, ?)";
                db.run(query, [sender, subject, received], (err) => {
                    if (err) {
                        console.error("Error inserting reviewed email:", err);
                    } else {
                        console.log(`Reviewed email from ${sender} inserted successfully.`);
                    }
                });
            }
        });
    };

    const regularEmails = [
        { sender: "John Doe", subject: "Meeting Tomorrow", received: "2025-01-01 9:00 AM" },
        { sender: "Jane Smith", subject: "Project Update", received: "2025-01-01 10:15 AM" },
        { sender: "Michael Johnson", subject: "Invoice #12345", received: "2025-01-02 3:00 PM" }
    ];

    const reviewedEmails = [
        { sender: "phisher@example.com", subject: "Urgent: Verify Your Account", received: "2023-10-01" },
        { sender: "scam@example.com", subject: "You’ve Won a Prize!", received: "2023-10-02" }
    ];

    regularEmails.forEach(insertEmail);
    reviewedEmails.forEach(insertReviewedEmail);
});

module.exports = db;
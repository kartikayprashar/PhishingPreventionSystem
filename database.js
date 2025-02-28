const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const db = new sqlite3.Database("users.db");

// Create the users table
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (username TEXT, password TEXT)");

    const saltRounds = 10;

    const users = [
        { username: "user1", password: "password1" },
        { username: "user2", password: "password2" },
        { username: "admin", password: "adminpass" }
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
                    "INSERT INTO users (username, password) VALUES (?, ?)",
                    [user.username, hashedPassword],
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

    // Create the resources table with website_link column
    db.run(`
        CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resource_name TEXT,
            category TEXT,
            website_link TEXT,
            published TEXT
        )
    `);

    // Function to insert resource data
    const insertResource = (resource) => {
        const { resource_name, category, website_link, published } = resource;

        db.get("SELECT * FROM resources WHERE resource_name = ? AND category = ? AND published = ?", 
            [resource_name, category, published], (err, row) => {
                if (err) {
                    console.error("Error checking for duplicate resource:", err);
                    return;
                }

                if (row) {
                    console.log(`Duplicate resource "${resource_name}" detected. Skipping insert.`);
                } else {
                    const query = "INSERT INTO resources (resource_name, category, website_link, published) VALUES (?, ?, ?, ?)";
                    db.run(query, [resource_name, category, website_link, published], (err) => {
                        if (err) {
                            console.error("Error inserting resource:", err);
                        } else {
                            console.log(`Resource "${resource_name}" inserted successfully.`);
                        }
                    });
                }
            });
    };

    // Predefined resources with website links
    const resources = [
        { resource_name: "How to Spot Phishing Emails", category: "Video", website_link: "http://localhost:3000/Videos/spottingPhishingEmails.mp4", published: "2025-01-01 7:52 AM" },
        { resource_name: "Phishing Awareness Quiz", category: "Interactive", website_link: "https://example.com/phishing-quiz", published: "2025-01-01 8:57 AM" },
        { resource_name: "Securing Your Passwords", category: "PDF Guide", website_link: "http://localhost:3000/Pdfs/securingYourPasswords.pdf", published: "2025-01-07 9:57 AM" },
        { resource_name: "Reporting Phishing Emails to CRA IT Security Team", category: "Step-by-Step Guide", website_link: "http://localhost:3000/Pdfs/reportingPhishingEmails.pdf", published: "2025-01-08 10:00 PM" }
    ];

    // Insert predefined resources
    resources.forEach(insertResource);
});

module.exports = db;

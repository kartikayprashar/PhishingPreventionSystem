const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./database');
const path = require('path');

const app = express();
const port = 3000;

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the correct directory
const staticFilesPath = path.join(__dirname, 'PhishingPreventionSystem');
app.use(express.static(staticFilesPath));

// Serve the signin.html file on root path
app.get('/', (req, res) => {
    res.sendFile(path.join(staticFilesPath, 'signin.html'));
});

// POST endpoint to handle user registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    // Check if the username already exists
    db.get("SELECT * FROM users WHERE username = ?", [trimmedUsername], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "internal_error" });
        }

        if (row) {
            return res.status(200).json({ error: "username_exists" });
        }

        // Hash the password before storing it
        bcrypt.hash(trimmedPassword, 10, (err, hash) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "internal_error" });
            }

            // Insert the new user into the database
            db.run("INSERT INTO users (username, password) VALUES (?, ?)", [trimmedUsername, hash], function (err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "internal_error" });
                }

                res.status(200).json({ success: true });
            });
        });
    });
});

// POST endpoint to handle sign-in
app.post('/signin', (req, res) => {
    const { username, password } = req.body;

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    db.get("SELECT * FROM users WHERE username = ?", [trimmedUsername], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "internal_error" });
        }

        if (!row) {
            return res.status(200).json({ error: "invalid_user" });
        }

        bcrypt.compare(trimmedPassword, row.password, (err, isMatch) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "internal_error" });
            }

            if (!isMatch) {
                return res.status(200).json({ error: "invalid_password" });
            }

            res.status(200).json({ success: true });
        });
    });
});

// GET endpoint to retrieve phishing email data
app.get('/phishing-emails', (req, res) => {
    db.all("SELECT * FROM reviewed_phishing_emails", [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "internal_error" });
        }

        res.status(200).json(rows);
    });
});

// POST endpoint to report phishing email
app.post('/report-email', (req, res) => {
    const { from, subject, received } = req.body;

    if (!from || !subject || !received) {
        return res.status(400).json({ error: "missing_fields" });
    }

    // Insert into reviewed phishing emails table
    db.run("INSERT INTO reviewed_phishing_emails (sender, subject, received) VALUES (?, ?, ?)", [from, subject, received], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "internal_error" });
        }

        // Remove the email from the regular emails table
        db.run("DELETE FROM reported_emails WHERE sender = ? AND subject = ? AND received = ?", [from, subject, received], function (err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "internal_error" });
            }

            res.status(200).json({ success: true });
        });
    });
});

// GET endpoint to fetch resources
app.get('/resources', (req, res) => {
    db.all("SELECT * FROM resources", [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "internal_error" });
        }

        res.status(200).json(rows);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

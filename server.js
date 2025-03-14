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

// Serve static files
const publicPath = path.join('C:', 'Users', 'Akash', 'Documents', 'GitHub', 'PhishingPreventionSystem');
app.use(express.static(publicPath));
app.use('/Resources', express.static(path.join(publicPath, 'Resources')));
app.use('/Images', express.static(path.join(publicPath, 'Images')));

// Serve the signin page
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'signin.html'));
});

// User registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    db.get("SELECT * FROM users WHERE username = ?", [trimmedUsername], (err, row) => {
        if (err) return res.status(500).json({ error: "internal_error" });
        if (row) return res.status(200).json({ error: "username_exists" });

        bcrypt.hash(trimmedPassword, 10, (err, hash) => {
            if (err) return res.status(500).json({ error: "internal_error" });
            db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [trimmedUsername, hash, 'user'], function (err) {
                if (err) return res.status(500).json({ error: "internal_error" });
                res.status(200).json({ success: true });
            });
        });
    });
});

// User sign-in
app.post('/signin', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username.trim()], (err, row) => {
        if (err) return res.status(500).json({ error: "internal_error" });
        if (!row) return res.status(200).json({ error: "invalid_user" });

        bcrypt.compare(password.trim(), row.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: "internal_error" });
            if (!isMatch) return res.status(200).json({ error: "invalid_password" });
            res.status(200).json({ success: true, userId: row.id, role: row.role }); // Return userId and role
        });
    });
});

// Fetch phishing emails
app.get('/phishing-emails', (req, res) => {
    db.all("SELECT * FROM reviewed_phishing_emails", [], (err, rows) => {
        if (err) return res.status(500).json({ error: "internal_error" });
        
        const emailsWithImages = rows.map(email => ({
            ...email,
            image: email.image ? `http://localhost:3000/Images/emails/${email.image}` : null,
        }));

        res.status(200).json(emailsWithImages);
    });
});

// Report phishing email
app.post('/report-email', (req, res) => {
    const { from, subject, received, image } = req.body;
    if (!from || !subject || !received) return res.status(400).json({ error: "missing_fields" });

    db.run("INSERT INTO reviewed_phishing_emails (sender, subject, received, image) VALUES (?, ?, ?, ?)", [from, subject, received, image], function (err) {
        if (err) return res.status(500).json({ error: "internal_error" });
        db.run("DELETE FROM reported_emails WHERE sender = ? AND subject = ? AND received = ?", [from, subject, received]);
        res.status(200).json({ success: true });
    });
});

// Fetch training resources
app.get('/resources', (req, res) => {
    const resources = [
        { resource_name: "Phishing Awareness Guide", category: "Training", website_link: "http://localhost:3000/Resources/phishing-guide.pdf", published: "2023-10-01" },
        { resource_name: "Email Security Video", category: "Training", website_link: "http://localhost:3000/Resources/email-security.mp4", published: "2023-10-02" },
        { resource_name: "Phishing Infographic", category: "Training", website_link: "http://localhost:3000/Resources/infographic.png", published: "2023-10-03" }
    ];
    res.status(200).json(resources);
});

// Save quiz results
app.post('/save-quiz-result', (req, res) => {
    const { userId, score } = req.body;

    if (!userId || score === undefined) {
        return res.status(400).json({ error: "missing_fields" });
    }

    db.run("INSERT INTO quiz_results (user_id, score) VALUES (?, ?)", [userId, score], function (err) {
        if (err) return res.status(500).json({ error: "internal_error" });
        res.status(200).json({ success: true });
    });
});

// Fetch all quiz results (for admin)
app.get('/quiz-results', (req, res) => {
    db.all("SELECT quiz_results.*, users.username FROM quiz_results JOIN users ON quiz_results.user_id = users.id", [], (err, rows) => {
        if (err) return res.status(500).json({ error: "internal_error" });
        res.status(200).json(rows);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
// signin.js
document.getElementById("signin-form").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent the form from submitting normally

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:3000/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok) {
            if (result.error === "invalid_user") {
                document.getElementById("error-message").textContent = "Invalid username.";
            } else if (result.error === "invalid_password") {
                document.getElementById("error-message").textContent = "Invalid password.";
            } else {
                // Store userId in localStorage
                localStorage.setItem('userId', result.userId);

                alert("Sign-in successful!");
                window.location.href = "overview.html"; // Redirect to overview.html
            }
        } else {
            document.getElementById("error-message").textContent = "An error occurred. Please try again later.";
        }
    } catch (error) {
        console.error("Error during sign-in:", error);
        document.getElementById("error-message").textContent = "An error occurred. Please try again later.";
    }
});
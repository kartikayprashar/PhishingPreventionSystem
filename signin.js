document.getElementById("signin-form").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent the form from submitting normally

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:3000/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();

        if (response.ok) {
            if (result.error) {
                // Handle specific backend errors
                if (result.error === "invalid_user") {
                    document.getElementById("error-message").textContent = "Invalid username.";
                } else if (result.error === "invalid_password") {
                    document.getElementById("error-message").textContent = "Invalid password.";
                } else {
                    document.getElementById("error-message").textContent = "Unknown error. Please try again.";
                }
            } else {
                // Success
                alert("Sign-in successful!");
                window.location.href = "index.html"; // Redirect to the homepage
            }
        } else {
            document.getElementById("error-message").textContent =
                result.message || "An error occurred. Please try again later.";
        }
    } catch (error) {
        document.getElementById("error-message").textContent = "Unable to connect to the server. Please try again.";
        console.error("Error during sign-in:", error);
    }
});

// ============================================================
// TASKFLOW - FRONTEND ONLY AUTHENTICATION
// Uses LocalStorage - No Backend Required
// ============================================================


// ============================================================
// REGISTER
// ============================================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const name =
            document.getElementById("registerName").value.trim();

        const email =
            document.getElementById("registerEmail").value.trim();

        const password =
            document.getElementById("registerPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;


        // Check fields
        if (!name || !email || !password || !confirmPassword) {

            alert("Please fill in all fields.");

            return;
        }


        // Check password
        if (password.length < 6) {

            alert("Password must be at least 6 characters!");

            return;
        }


        // Check matching passwords
        if (password !== confirmPassword) {

            alert("Passwords do not match!");

            return;
        }


        // Get existing users
        let users =
            JSON.parse(localStorage.getItem("taskflowUsers")) || [];


        // Check existing email
        const existingUser =
            users.find(
                user =>
                    user.email.toLowerCase() === email.toLowerCase()
            );


        if (existingUser) {

            alert("An account with this email already exists.");

            return;
        }


        // Create user
        const newUser = {

            id: Date.now(),

            name: name,

            email: email,

            password: password,

            createdAt: new Date().toISOString()

        };


        // Save user
        users.push(newUser);

        localStorage.setItem(
            "taskflowUsers",
            JSON.stringify(users)
        );


        alert("Registration successful! 🎉");

        window.location.href = "login.html";

    });

}


// ============================================================
// LOGIN
// ============================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;


        if (!email || !password) {

            alert("Please enter your email and password.");

            return;
        }


        // Get registered users
        const users =
            JSON.parse(localStorage.getItem("taskflowUsers")) || [];


        // Find user
        const user =
            users.find(
                existingUser =>
                    existingUser.email.toLowerCase() ===
                        email.toLowerCase() &&
                    existingUser.password === password
            );


        if (!user) {

            alert("Invalid email or password.");

            return;
        }


        // Save current user
        const currentUser = {

            id: user.id,

            name: user.name,

            email: user.email

        };


        localStorage.setItem(
            "taskflowCurrentUser",
            JSON.stringify(currentUser)
        );


        // Frontend-only login
        localStorage.setItem(
            "taskflowLoggedIn",
            "true"
        );


        alert("Login successful! 🚀");

        window.location.href = "../index.html";

    });

}
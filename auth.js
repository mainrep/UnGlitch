/* =========================================
   UNGLITCH AUTHENTICATION
========================================= */

const API_BASE_URL =
    window.UNGLITCH_CONFIG.API_BASE_URL;

const GOOGLE_CLIENT_ID =
    window.UNGLITCH_CONFIG.GOOGLE_CLIENT_ID;


/* =========================================
   ACCOUNT STORAGE
========================================= */

function getCurrentUser() {

    try {

        const user = JSON.parse(
            localStorage.getItem("unglitch_user")
        );

        if (
            user?.role !== "consumer" &&
            user?.role !== "shop"
        ) {
            return null;
        }

        return user;

    } catch {

        return null;

    }

}


function getAccessToken() {

    return localStorage.getItem("unglitch_token");

}


function saveAccount(data) {

    localStorage.setItem(
        "unglitch_token",
        data.access_token
    );

    localStorage.setItem(
        "unglitch_user",
        JSON.stringify(data.user)
    );

}


function logout() {

    localStorage.removeItem("unglitch_token");
    localStorage.removeItem("unglitch_user");

    if (window.google?.accounts?.id) {
        google.accounts.id.disableAutoSelect();
    }

    window.location.href = "profile.html";

}


/* =========================================
   GOOGLE SIGN-IN
========================================= */

async function handleGoogleCredential(response) {

    const role =
        document.getElementById("accountRole")?.value;

    const status =
        document.getElementById("authStatus");

    if (!role) {

        status.textContent =
            "Please select your account type first.";

        return;

    }

    status.textContent = "Signing in...";

    try {

        const result = await fetch(
            `${API_BASE_URL}/auth/google`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    credential: response.credential,
                    role: role
                })
            }
        );

        const data = await result.json();

        if (!result.ok) {
            throw new Error(
                data.detail || "Google sign-in failed."
            );
        }

        saveAccount(data);

        status.textContent =
            "Signed in successfully.";

        window.location.reload();

    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        status.textContent = error.message;

    }

}


/* =========================================
   INITIALISE GOOGLE IDENTITY SERVICES
========================================= */

function initialiseGoogleSignIn() {

    const buttonContainer =
        document.getElementById("googleSignInButton");

    if (!buttonContainer) return;

    if (
        !GOOGLE_CLIENT_ID ||
        GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID"
    ) {

        document.getElementById("authStatus").textContent =
            "Google Client ID has not been configured.";

        return;

    }

    if (!window.google?.accounts?.id) {

        document.getElementById("authStatus").textContent =
            "Google sign-in could not be loaded. Please refresh.";

        return;

    }

    google.accounts.id.initialize({

        client_id: GOOGLE_CLIENT_ID,

        callback: handleGoogleCredential

    });

    google.accounts.id.renderButton(

        buttonContainer,

        {
            theme: "filled_black",
            size: "large",
            shape: "rectangular",
            text: "signin_with",
            width: 260
        }

    );

}


window.addEventListener(
    "load",
    initialiseGoogleSignIn
);
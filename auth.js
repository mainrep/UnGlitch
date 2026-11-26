/* =========================================
   UNGLITCH AUTHENTICATION
   Google Identity Services + FastAPI JWT
========================================= */

const API_BASE_URL = String(
    window.UNGLITCH_CONFIG?.API_BASE_URL || ""
).replace(/\/+$/, "");

const GOOGLE_CLIENT_ID =
    window.UNGLITCH_CONFIG?.GOOGLE_CLIENT_ID || "";

const BACKEND_CONFIGURED = Boolean(
    window.UNGLITCH_CONFIG?.isBackendConfigured
);

let googleSignInInitialised = false;
let googleWaitTimer = null;

function getCurrentUser() {
    try {
        const user = JSON.parse(localStorage.getItem("unglitch_user") || "null");
        const token = localStorage.getItem("unglitch_token");

        if (!token || !user || !["consumer", "shop"].includes(user.role)) {
            return null;
        }

        return user;
    } catch (error) {
        console.warn("Unable to read the saved UnGlitch account.", error);
        return null;
    }
}

function getAccessToken() {
    return localStorage.getItem("unglitch_token");
}

function saveAccount(data) {
    if (!data?.access_token || !data?.user) {
        throw new Error("The sign-in server returned an incomplete account response.");
    }

    localStorage.setItem("unglitch_token", data.access_token);
    localStorage.setItem("unglitch_user", JSON.stringify(data.user));
}

function logout() {
    localStorage.removeItem("unglitch_token");
    localStorage.removeItem("unglitch_user");

    if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
    }

    window.location.href = "profile.html#signInSection";
}

function setAuthStatus(message, isError = false) {
    const status = document.getElementById("authStatus");
    if (!status) return;
    status.textContent = message;
    status.dataset.state = isError ? "error" : "info";
}

async function handleGoogleCredential(response) {
    const role = document.getElementById("accountRole")?.value;

    if (!role) {
        setAuthStatus("Choose Consumer or Repair Shop Owner before continuing.", true);
        return;
    }

    if (!BACKEND_CONFIGURED) {
        setAuthStatus(
            "Google sign-in is not connected yet. The FastAPI backend must be deployed and its URL added to config.js.",
            true
        );
        return;
    }

    if (!response?.credential) {
        setAuthStatus("Google did not return a sign-in credential. Please try again.", true);
        return;
    }

    setAuthStatus("Verifying your Google account...");

    try {
        const result = await fetch(`${API_BASE_URL}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                credential: response.credential,
                role
            })
        });

        const data = await result.json().catch(() => ({}));

        if (!result.ok) {
            throw new Error(
                data.detail || `Sign-in failed (HTTP ${result.status}).`
            );
        }

        saveAccount(data);
        setAuthStatus("Signed in successfully. Opening your account...");
        window.location.href = "profile.html#accountSection";
    } catch (error) {
        console.error("UnGlitch sign-in error:", error);
        setAuthStatus(
            error instanceof TypeError
                ? "Could not reach the sign-in server. Check the backend URL and CORS settings."
                : error.message,
            true
        );
    }
}

function initialiseGoogleSignIn() {
    const buttonContainer = document.getElementById("googleSignInButton");
    if (!buttonContainer || googleSignInInitialised) return;

    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes("YOUR_GOOGLE_CLIENT_ID")) {
        setAuthStatus("The Google OAuth Client ID has not been configured.", true);
        return;
    }

    if (!window.google?.accounts?.id) {
        if (!googleWaitTimer) {
            setAuthStatus("Loading Google sign-in...");
            let attempts = 0;
            googleWaitTimer = window.setInterval(() => {
                attempts += 1;
                if (window.google?.accounts?.id) {
                    window.clearInterval(googleWaitTimer);
                    googleWaitTimer = null;
                    initialiseGoogleSignIn();
                } else if (attempts >= 40) {
                    window.clearInterval(googleWaitTimer);
                    googleWaitTimer = null;
                    setAuthStatus(
                        "Google sign-in could not load. Check your connection and refresh the page.",
                        true
                    );
                }
            }, 250);
        }
        return;
    }

    try {
        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredential,
            auto_select: false,
            cancel_on_tap_outside: true
        });

        window.google.accounts.id.renderButton(buttonContainer, {
            theme: "filled_black",
            size: "large",
            shape: "rectangular",
            text: "signin_with",
            width: 260
        });

        googleSignInInitialised = true;
    } catch (error) {
        console.error("Google Identity Services initialisation failed:", error);
        setAuthStatus(
            "Google sign-in could not be initialised. Check that https://mainrep.github.io is an authorised JavaScript origin for this OAuth client.",
            true
        );
        return;
    }

    const roleSelect = document.getElementById("accountRole");
    roleSelect?.addEventListener("change", () => {
        if (roleSelect.value) {
            setAuthStatus("Account type selected. Continue with Google to sign in.");
        } else {
            setAuthStatus("Choose how you intend to use UnGlitch before signing in.");
        }
    });

    if (!BACKEND_CONFIGURED) {
        setAuthStatus(
            "The Google button is ready, but sign-in will work after the FastAPI backend is deployed and connected."
        );
    } else {
        setAuthStatus("Choose an account type, then continue with Google.");
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseGoogleSignIn, { once: true });
} else {
    initialiseGoogleSignIn();
}

// The GIS script is async; retry while it finishes loading.
window.addEventListener("load", initialiseGoogleSignIn, { once: true });
/* =========================================
   SHARED HEADER LOGIN LINK
   The actual Google sign-in flow remains on profile.html.
========================================= */

(() => {
    function addHeaderLoginLink() {
        const header = document.querySelector("header.Header");
        if (!header) return;

        let link = document.getElementById("navLoginButton");

        if (!link) {
            link = document.createElement("a");
            link.id = "navLoginButton";
            link.href = "profile.html";
            link.className = "nav-login-button";
            link.textContent = "Log In";

            const navigation = header.querySelector(".NavigationBar");
            const menuButton = header.querySelector(".menu-button");

            if (navigation) {
                navigation.insertAdjacentElement("afterend", link);
            } else if (menuButton) {
                header.insertBefore(link, menuButton);
            } else {
                header.appendChild(link);
            }
        }

        // Keep the header action styled without replacing the project's stylesheet.
        if (!document.getElementById("unglitchHeaderLoginStyles")) {
            const style = document.createElement("style");
            style.id = "unglitchHeaderLoginStyles";
            style.textContent = `
                header.Header { gap: 12px; }
                header.Header > .logo-link { flex: 0 0 auto; }
                header.Header > .NavigationBar {
                    flex: 1 1 auto;
                    width: auto;
                    min-width: 0;
                }
                .nav-login-button {
                    display: inline-flex;
                    flex: 0 0 auto;
                    align-items: center;
                    justify-content: center;
                    min-height: 40px;
                    margin-left: auto;
                    padding: 0 16px;
                    border: 1px solid #477d5b;
                    border-radius: 9px;
                    background: #193126;
                    color: #a8dfb7 !important;
                    font-size: 15px;
                    font-weight: 700;
                    white-space: nowrap;
                    text-decoration: none !important;
                }
                .nav-login-button:hover { background: #234333; }
                .nav-login-button:focus-visible {
                    outline: 2px solid #8acba6;
                    outline-offset: 3px;
                }
                header.Header > .menu-button {
                    flex: 0 0 44px;
                    margin-left: 0;
                }
                @media (max-width: 768px) {
                    header.Header { gap: 8px; flex-wrap: nowrap; }
                    header.Header > .NavigationBar { min-width: 0; }
                    .nav-login-button {
                        min-height: 38px;
                        padding: 0 11px;
                        font-size: 13px;
                    }
                    header.Header > .menu-button { flex-basis: 42px; }
                }
                @media (max-width: 360px) {
                    .AppName { display: none; }
                    .nav-login-button { padding: 0 9px; }
                }
            `;
            document.head.appendChild(style);
        }

        let signedIn = false;
        try {
            const user = JSON.parse(localStorage.getItem("unglitch_user") || "null");
            const token = localStorage.getItem("unglitch_token");
            signedIn = Boolean(
                token && user &&
                (user.role === "consumer" || user.role === "shop")
            );
        } catch (error) {
            console.warn("Unable to read the saved UnGlitch account.", error);
        }

        link.textContent = signedIn ? "My Account" : "Log In";
        link.setAttribute(
            "aria-label",
            signedIn ? "Open your UnGlitch account" : "Log in to UnGlitch"
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", addHeaderLoginLink, { once: true });
    } else {
        addHeaderLoginLink();
    }
})();

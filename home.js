/* =========================================
   USER INFORMATION
========================================= */

// Retrieve the currently signed-in user's information.

function getCurrentUser() {

    const storedUser = localStorage.getItem("unglitch_user");

    if (!storedUser) {
        return null;
    }

    try {

        const user = JSON.parse(storedUser);

        // Only accept recognised account types.
        if (
            user.role !== "consumer" &&
            user.role !== "shop"
        ) {
            return null;
        }

        return user;

    } catch (error) {

        console.error("Unable to read user information:", error);

        return null;

    }

}


/* =========================================
   HTML DASHBOARD CONTAINER
========================================= */

const dashboard = document.getElementById("dashboard");

const currentUser = getCurrentUser();


/* =========================================
   STATISTICS CARD GENERATOR
========================================= */

function createStatCard(label, value, description) {

    return `
        <div class="stat-card">

            <div class="stat-label">
                ${label}
            </div>

            <div class="stat-value">
                ${value}
            </div>

            <div class="stat-description">
                ${description}
            </div>

        </div>
    `;

}


/* =========================================
   QUICK ACTION CARD GENERATOR
========================================= */

function createActionCard(icon, title, description, link) {

    return `
        <a href="${link}" class="action-card">

            <div class="action-icon">
                ${icon}
            </div>

            <h3>
                ${title}
            </h3>

            <p>
                ${description}
            </p>

        </a>
    `;

}


/* =========================================
   CONSUMER DASHBOARD
========================================= */

function renderConsumerDashboard(user) {

    const name = user?.name || "there";

    dashboard.innerHTML = `

        <section class="home-section welcome-section">

            <div>

                <div class="welcome-tag">
                    CONSUMER DASHBOARD
                </div>

                <h1>
                    Welcome back, ${name}!
                </h1>

                <p>
                    Every repair is an opportunity to reduce
                    electronic waste and make your devices last longer.
                </p>

            </div>

        </section>


        <section class="home-section">

            <h2 class="section-heading">
                Your Impact
            </h2>

            <div class="stats-grid">

                ${createStatCard(
                    "Devices Repaired",
                    "—",
                    "Your completed repairs will appear here."
                )}

                ${createStatCard(
                    "CO₂e Saved",
                    "—",
                    "Your estimated carbon savings will appear here."
                )}

                ${createStatCard(
                    "Community Contributions",
                    "—",
                    "Your discussions and helpful contributions."
                )}

            </div>

        </section>


        <section class="home-section">

            <h2 class="section-heading">
                Quick Actions
            </h2>

            <div class="actions-grid">

                ${createActionCard(
                    "🔧",
                    "Diagnose a Device",
                    "Understand your device issue and compare repair versus replacement.",
                    "repair.html"
                )}

                ${createActionCard(
                    "📍",
                    "Find a Repair Shop",
                    "Explore nearby repair providers and compare their services.",
                    "map.html"
                )}

                ${createActionCard(
                    "💬",
                    "Community Discussions",
                    "Ask questions, exchange advice and learn from other users.",
                    "community.html"
                )}

            </div>

        </section>


        <section class="home-section info-panel">

            <h3>
                Your Next Step
            </h3>

            <p>
                Have a device that isn't working properly?

                Start by using our Diagnostic & Carbon Estimator
                to understand your repair options before deciding
                whether to replace it.
            </p>

            <a href="repair.html" class="primary-button">
                Diagnose a Device
            </a>

        </section>

    `;

}


/* =========================================
   SHOP OWNER DASHBOARD
========================================= */

function renderShopDashboard(user) {

    const name = user?.name || "there";

    dashboard.innerHTML = `

        <section class="home-section welcome-section">

            <div>

                <div class="welcome-tag">
                    SHOP OWNER DASHBOARD
                </div>

                <h1>
                    Welcome back, ${name}!
                </h1>

                <p>
                    Manage your repair services, maintain your
                    shop information and connect with customers.
                </p>

            </div>

        </section>


        <section class="home-section">

            <h2 class="section-heading">
                Your Shop Overview
            </h2>

            <div class="stats-grid">

                ${createStatCard(
                    "Average Rating",
                    "—",
                    "Your customer rating will appear here."
                )}

                ${createStatCard(
                    "Customer Reviews",
                    "—",
                    "The number of submitted customer reviews."
                )}

                ${createStatCard(
                    "Listing Status",
                    "—",
                    "Your registration status will appear here."
                )}

            </div>

        </section>


        <section class="home-section">

            <h2 class="section-heading">
                Manage Your Business
            </h2>

            <div class="actions-grid">

                ${createActionCard(
                    "🏪",
                    "Manage Shop Profile",
                    "Update your shop name, address, supported devices and warranty.",
                    "profile.html"
                )}

                ${createActionCard(
                    "📍",
                    "View Your Listing",
                    "Explore your shop's location and how customers discover it.",
                    "map.html"
                )}

                ${createActionCard(
                    "💬",
                    "Community Discussions",
                    "Connect with customers and participate in repair discussions.",
                    "community.html"
                )}

            </div>

        </section>


        <section class="home-section info-panel">

            <h3>
                Improve Your Shop Profile
            </h3>

            <p>
                Keep your supported devices, contact information
                and warranty details accurate so customers can
                make informed decisions when selecting a repair provider.
            </p>

            <a href="profile.html" class="primary-button">
                Manage Shop Information
            </a>

        </section>

    `;

}


/* =========================================
   GUEST DASHBOARD
========================================= */

function renderGuestDashboard() {

    dashboard.innerHTML = `

        <section class="home-section welcome-section">

            <div>

                <div class="welcome-tag">
                    WELCOME TO UNGLITCH
                </div>

                <h1>
                    Repair More. Waste Less.
                </h1>

                <p>
                    Discover repair options, connect with local
                    repair providers and make more sustainable
                    decisions about your electronic devices.
                </p>

            </div>

        </section>


        <section class="home-section">

            <h2 class="section-heading">
                Explore UnGlitch
            </h2>

            <div class="actions-grid">

                ${createActionCard(
                    "🔧",
                    "Diagnose a Device",
                    "Explore repair options and estimated carbon savings.",
                    "repair.html"
                )}

                ${createActionCard(
                    "📍",
                    "Discover Repair Shops",
                    "Find repair providers and explore their services.",
                    "map.html"
                )}

                ${createActionCard(
                    "💬",
                    "Join the Community",
                    "Exchange repair knowledge and experiences.",
                    "community.html"
                )}

            </div>

        </section>

    `;

}


/* =========================================
   RENDER APPROPRIATE DASHBOARD
========================================= */

function renderDashboard(user) {

    if (!user) {

        renderGuestDashboard();

    }

    else if (user.role === "consumer") {

        renderConsumerDashboard(user);

    }

    else if (user.role === "shop") {

        renderShopDashboard(user);

    }

}


/* =========================================
   NAVIGATION MENU
========================================= */

const menuButton = document.getElementById("menuButton");

const siteMenu = document.getElementById("siteMenu");


menuButton.addEventListener("click", () => {

    const isExpanded = menuButton.getAttribute("aria-expanded") === "true";

    menuButton.setAttribute(
        "aria-expanded",
        String(!isExpanded)
    );

    siteMenu.hidden = isExpanded;

});


/* Close the menu when clicking elsewhere. */

document.addEventListener("click", (event) => {

    if (
        !siteMenu.contains(event.target) &&
        !menuButton.contains(event.target)
    ) {

        siteMenu.hidden = true;

        menuButton.setAttribute("aria-expanded", "false");

    }

});


/* Close the menu using Escape. */

document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {

        siteMenu.hidden = true;

        menuButton.setAttribute("aria-expanded", "false");

        menuButton.focus();

    }

});


/* =========================================
   INITIALISE HOMEPAGE
========================================= */

// Display the appropriate dashboard.

renderDashboard(currentUser);


// Hide the consumer-only Repair navigation link
// when a shop owner is signed in.

if (currentUser?.role === "shop") {

    document.querySelectorAll("[data-consumer-only]").forEach(link => {

        link.hidden = true;

    });

}
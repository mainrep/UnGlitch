/* =========================================
   PROFILE, SIGN-IN STATE AND SHOP LISTING
========================================= */

document.addEventListener("DOMContentLoaded", initialiseProfilePage, { once: true });

async function initialiseProfilePage() {
    const user = getCurrentUser();

    const signInSection = document.getElementById("signInSection");
    const accountSection = document.getElementById("accountSection");
    const consumerProfile = document.getElementById("consumerProfile");
    const shopProfile = document.getElementById("shopProfile");

    if (!user) {
        signInSection.hidden = false;
        accountSection.hidden = true;
        consumerProfile.hidden = true;
        shopProfile.hidden = true;
        return;
    }

    signInSection.hidden = true;
    accountSection.hidden = false;

    document.getElementById("profileHeading").textContent = `Welcome, ${user.name}`;
    document.getElementById("profileName").textContent = `Name: ${user.name}`;
    document.getElementById("profileEmail").textContent = `Email: ${user.email}`;
    document.getElementById("profileRole").textContent =
        user.role === "consumer" ? "Consumer" : "Repair Shop Owner";

    document.getElementById("logoutButton")?.addEventListener("click", logout);

    if (user.role === "consumer") {
        consumerProfile.hidden = false;
        shopProfile.hidden = true;
    } else {
        consumerProfile.hidden = true;
        shopProfile.hidden = false;
        await loadShopProfile();
    }
}

async function loadShopProfile() {
    const information = document.getElementById("shopInformation");
    const status = document.getElementById("shopStatus");
    const registrationForm = document.getElementById("shopRegistrationForm");

    information.replaceChildren();

    if (!window.UNGLITCH_CONFIG?.isBackendConfigured) {
        status.textContent = "Connect the deployed backend before loading or registering a shop.";
        registrationForm.hidden = true;
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/shops/me`, {
            headers: { "Authorization": `Bearer ${getAccessToken()}` }
        });
        const result = await response.json().catch(() => ({}));

        if (response.status === 404) {
            status.textContent = "You have not registered a repair shop yet.";
            registrationForm.hidden = false;
            return;
        }

        if (!response.ok) {
            throw new Error(result.detail || `Unable to load shop details (HTTP ${response.status}).`);
        }

        const details = [
            `Shop: ${result.name}`,
            `Address: ${result.address}`,
            `Warranty: ${result.warranty_days} days`,
            `Devices serviced: ${(result.devices || []).join(", ")}`,
            `Rating: ${result.average_rating ?? "Not rated yet"}`
        ];

        details.forEach(detail => {
            const paragraph = document.createElement("p");
            paragraph.textContent = detail;
            information.appendChild(paragraph);
        });

        status.textContent = "Your repair-shop listing is connected.";
        registrationForm.hidden = true;
    } catch (error) {
        console.error("Shop profile error:", error);
        status.textContent = error.message;
        registrationForm.hidden = true;
    }
}

const shopRegistrationForm = document.getElementById("shopRegistrationForm");

shopRegistrationForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const devices = Array.from(
        document.querySelectorAll("input[name='devices']:checked")
    ).map(input => input.value);

    if (devices.length === 0) {
        document.getElementById("shopStatus").textContent = "Select at least one supported device.";
        return;
    }

    const data = {
        name: document.getElementById("shopName").value.trim(),
        address: document.getElementById("shopAddress").value.trim(),
        devices,
        warranty_days: Number(document.getElementById("warrantyDays").value)
    };

    const button = shopRegistrationForm.querySelector("button[type='submit']");
    const status = document.getElementById("shopStatus");
    button.disabled = true;
    button.textContent = "Registering...";
    status.textContent = "Submitting shop details and finding the address...";

    try {
        const response = await fetch(`${API_BASE_URL}/shops`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAccessToken()}`
            },
            body: JSON.stringify(data)
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.detail || `Shop registration failed (HTTP ${response.status}).`);
        }

        status.textContent = "Your shop has been registered and will now appear on the map.";
        shopRegistrationForm.reset();
        await loadShopProfile();
    } catch (error) {
        console.error("Shop registration error:", error);
        status.textContent = error instanceof TypeError
            ? "Could not reach the backend. Check its URL and CORS configuration."
            : error.message;
    } finally {
        button.disabled = false;
        button.textContent = "Register Shop";
    }
});
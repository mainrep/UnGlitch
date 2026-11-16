/* =========================================
   ACCOUNT ACCESS
========================================= */

// Retrieve the saved session.

let storedSession = null;

try {
    storedSession = JSON.parse(
        localStorage.getItem("unglitch_user")
    );
} catch (error) {
    console.error("Unable to read account:", error);
}

// Support either a stored user or a complete login response.

const currentUser = storedSession?.user || storedSession;

const accessToken =
    localStorage.getItem("unglitch_token") ||
    storedSession?.access_token ||
    currentUser?.access_token ||
    null;


// Local preview mode.

const previewRole =
    new URLSearchParams(window.location.search).get("preview");

const isLocalhost =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost";

const isPreviewConsumer =
    isLocalhost && previewRole === "consumer";

const activeRole =
    isLocalhost && ["consumer", "shop"].includes(previewRole)
        ? previewRole
        : currentUser?.role;


// Restrict the Repair page to consumers.

const repairContent =
    document.getElementById("repairContent");

const accessNotice =
    document.getElementById("accessNotice");

if (activeRole === "consumer") {

    repairContent.hidden = false;

} else {

    accessNotice.hidden = false;

}


// Hide consumer-only navigation options.

if (activeRole !== "consumer") {

    document.querySelectorAll("[data-consumer-only]").forEach(link => {
        link.hidden = true;
    });

}


/* =========================================
   NAVIGATION MENU
========================================= */

const menuButton =
    document.getElementById("menuButton");

const siteMenu =
    document.getElementById("siteMenu");


if (menuButton && siteMenu) {

    menuButton.addEventListener("click", () => {

        const expanded =
            menuButton.getAttribute("aria-expanded") === "true";

        menuButton.setAttribute(
            "aria-expanded",
            String(!expanded)
        );

        siteMenu.hidden = expanded;

    });


    // Close menu when clicking elsewhere.

    document.addEventListener("click", event => {

        if (
            !siteMenu.contains(event.target) &&
            !menuButton.contains(event.target)
        ) {

            siteMenu.hidden = true;

            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    });


    // Close menu using Escape.

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            siteMenu.hidden = true;

            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );

            menuButton.focus();

        }

    });

}


/* =========================================
   DIAGNOSTIC FORM ELEMENTS
========================================= */

const diagnosticForm =
    document.getElementById("diagnosticForm");

const emptyState =
    document.getElementById("emptyState");

const diagnosticResult =
    document.getElementById("diagnosticResult");


/* =========================================
   FASTAPI CONNECTION
========================================= */

// Local development backend.
// Update this when deploying the application.

const API_BASE_URL =
    window.UNGLITCH_CONFIG.API_BASE_URL;

/* =========================================
   API REQUEST
========================================= */

async function apiRequest(endpoint, data) {

    const headers = {
        "Content-Type": "application/json"
    };


    const token = localStorage.getItem("unglitch_token");

    if (token) {

        headers["Authorization"] =
            `Bearer ${token}`;

    }


    // Local preview access only.
    if (
        activeRole === "consumer" &&
        isLocalhost &&
        !token
    ) {

        headers["X-UnGlitch-Preview-Role"] =
            "consumer";

    }


    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            method: "POST",
            headers,
            body: JSON.stringify(data)
        }
    );


    const result = await response.json();


    if (!response.ok) {

        throw new Error(
            result.detail || "Something went wrong."
        );

    }


    return result;

}


/* =========================================
   POPULATE RESULTS
========================================= */

function populateList(element, items) {

    element.replaceChildren();

    items.forEach(item => {

        const listItem = document.createElement("li");

        listItem.textContent = item;

        element.appendChild(listItem);

    });

}


/* =========================================
   DISPLAY DIAGNOSTIC RESULTS
========================================= */

function displayDiagnosticResults(result) {

    emptyState.hidden = true;

    diagnosticResult.hidden = false;


    document.getElementById("resultTitle").textContent =
        result.title;


    document.getElementById("resultSummary").textContent =
        result.summary;


    populateList(
        document.getElementById("possibleCauses"),
        result.possible_causes
    );


    populateList(
        document.getElementById("recommendedSteps"),
        result.recommended_steps
    );


    document.getElementById("professionalNote").textContent =
        result.warning;

}


/* =========================================
   DISPLAY ERROR
========================================= */

function displayDiagnosticError(message) {

    emptyState.hidden = true;

    diagnosticResult.hidden = false;

    document.getElementById("resultTitle").textContent =
        "Assessment unavailable";

    document.getElementById("resultSummary").textContent =
        message;

    document.getElementById("possibleCauses").replaceChildren();

    document.getElementById("recommendedSteps").replaceChildren();

    document.getElementById("professionalNote").textContent =
        "Please check your connection and try again.";

}


/* =========================================
   FORM SUBMISSION
========================================= */

diagnosticForm.addEventListener("submit", async event => {

    event.preventDefault();


    const deviceType =
        document.getElementById("deviceType").value;

    const model =
        document.getElementById("deviceModel").value.trim();

    const deviceAge =
        document.getElementById("deviceAge").value;

    const issueType =
        document.getElementById("issueType").value;

    const symptoms =
        document.getElementById("symptoms").value.trim();


    if (!deviceType || !issueType) {

        alert("Please select your device and its main problem.");

        return;

    }


    const button =
        diagnosticForm.querySelector("button[type='submit']");

    button.disabled = true;

    button.textContent = "Assessing...";


    try {

        const diagnosticData = {

            device_type: deviceType,

            model: model || null,

            device_age: deviceAge || null,

            issue_type: issueType,

            symptoms: symptoms || null

        };


        // Send the assessment to FastAPI.

        const result = await apiRequest(
            "/diagnostics/assess",
            diagnosticData
        );


        // Display the response returned by Python.

        displayDiagnosticResults(result);


    } catch (error) {

        console.error("UnGlitch diagnostic error:", error);

        displayDiagnosticError(error.message);

    } finally {

        button.disabled = false;

        button.textContent = "Assess My Device";

    }

});
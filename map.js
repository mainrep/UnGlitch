/* =========================================
   MAP CONFIGURATION
========================================= */

const API_BASE_URL =
    window.UNGLITCH_CONFIG.API_BASE_URL;

let map;
let shopMarkers = [];
let allShops = [];
let userMarker = null;


/* =========================================
   NAVIGATION MENU
========================================= */

const menuButton = document.getElementById("menuButton");
const siteMenu = document.getElementById("siteMenu");

menuButton.addEventListener("click", () => {

    const expanded =
        menuButton.getAttribute("aria-expanded") === "true";

    menuButton.setAttribute(
        "aria-expanded",
        String(!expanded)
    );

    siteMenu.hidden = expanded;

});


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


/* =========================================
   INITIALISE MAP
========================================= */

function initialiseMap() {

    map = L.map("map").setView(
        [19.0760, 72.8777],
        11
    );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution: "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);

}


/* =========================================
   LOAD REPAIR SHOPS
========================================= */

async function loadShops() {

    const status = document.getElementById("mapStatus");

    try {

        const response = await fetch(
            `${API_BASE_URL}/shops`
        );

        if (!response.ok) {
            throw new Error("Unable to retrieve repair shops.");
        }

        allShops = await response.json();

        renderShops(allShops);

        status.textContent =
            `${allShops.length} registered repair shop(s) found.`;

    } catch (error) {

        console.error(error);

        status.textContent = error.message;

    }

}


/* =========================================
   DISPLAY SHOP MARKERS AND LIST
========================================= */

function renderShops(shops) {

    shopMarkers.forEach(marker => map.removeLayer(marker));

    shopMarkers = [];

    const shopList = document.getElementById("shopList");

    shopList.replaceChildren();


    shops.forEach(shop => {

        if (
            typeof shop.lat !== "number" ||
            typeof shop.lng !== "number"
        ) {
            return;
        }


        const popup = `

            <strong>${escapeHTML(shop.name)}</strong>

            <br>

            ${escapeHTML(shop.address)}

            <br>

            Devices: ${escapeHTML(shop.devices.join(", "))}

            <br>

            Warranty: ${shop.warranty_days} days

            <br>

            Rating: ${shop.average_rating ?? "Not rated yet"}

        `;


        const marker = L.marker([
            shop.lat,
            shop.lng
        ]).addTo(map);

        marker.bindPopup(popup);

        shopMarkers.push(marker);


        const card = document.createElement("article");

        card.className = "shop-card";


        const heading = document.createElement("h3");

        heading.textContent = shop.name;


        const address = document.createElement("p");

        address.textContent = shop.address;


        const devices = document.createElement("p");

        devices.textContent =
            `Services: ${shop.devices.join(", ")}`;


        const warranty = document.createElement("p");

        warranty.textContent =
            `Warranty: ${shop.warranty_days} days`;


        const rating = document.createElement("p");

        rating.textContent =
            `Rating: ${shop.average_rating ?? "Not rated yet"}`;


        const viewButton = document.createElement("button");

        viewButton.className = "secondary-button";

        viewButton.textContent = "View on Map";

        viewButton.addEventListener("click", () => {

            map.setView(
                [shop.lat, shop.lng],
                15
            );

            marker.openPopup();

        });


        card.append(
            heading,
            address,
            devices,
            warranty,
            rating,
            viewButton
        );

        shopList.appendChild(card);

    });

}


/* =========================================
   FILTER SHOPS
========================================= */

function filterShops() {

    const search =
        document.getElementById("shopSearch")
            .value.trim().toLowerCase();

    const device =
        document.getElementById("deviceFilter").value;


    const filtered = allShops.filter(shop => {

        const matchesSearch =
            shop.name.toLowerCase().includes(search) ||
            shop.address.toLowerCase().includes(search);

        const matchesDevice =
            !device || shop.devices.includes(device);

        return matchesSearch && matchesDevice;

    });


    renderShops(filtered);

    document.getElementById("mapStatus").textContent =
        `${filtered.length} matching repair shop(s).`;

}


/* =========================================
   USER LOCATION
========================================= */

function locateUser() {

    const status = document.getElementById("mapStatus");

    if (!navigator.geolocation) {

        status.textContent =
            "Location services are not supported by this browser.";

        return;

    }


    status.textContent = "Finding your location...";


    navigator.geolocation.getCurrentPosition(

        position => {

            const latitude = position.coords.latitude;

            const longitude = position.coords.longitude;


            map.setView(
                [latitude, longitude],
                14
            );


            if (userMarker) {
                map.removeLayer(userMarker);
            }


            userMarker = L.marker([
                latitude,
                longitude
            ]).addTo(map);


            userMarker.bindPopup("Your approximate location.");

            status.textContent =
                "Your location has been found.";

        },

        () => {

            status.textContent =
                "Location permission was unavailable. You can still explore registered shops.";

        },

        {
            enableHighAccuracy: false,
            timeout: 10000
        }

    );

}


/* =========================================
   BASIC HTML ESCAPING
========================================= */

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

    })[character]);

}


/* =========================================
   EVENT LISTENERS
========================================= */

document.getElementById("shopSearch")
    .addEventListener("input", filterShops);

document.getElementById("deviceFilter")
    .addEventListener("change", filterShops);

document.getElementById("locateButton")
    .addEventListener("click", locateUser);


/* =========================================
   START
========================================= */

initialiseMap();

loadShops();
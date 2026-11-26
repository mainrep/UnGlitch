/* =========================================
   UNGLITCH REPAIR MAP
========================================= */

const API_BASE_URL = String(
    window.UNGLITCH_CONFIG?.API_BASE_URL || ""
).replace(/\/+$/, "");

const MAP_DEFAULT_CENTER = [19.0760, 72.8777]; // Mumbai
const MAP_DEFAULT_ZOOM = 11;

let map = null;
let shopMarkers = [];
let allShops = [];
let userMarker = null;
let userCoordinates = null;

const mapStatus = document.getElementById("mapStatus");
const shopList = document.getElementById("shopList");
const mapElement = document.getElementById("map");

function setMapStatus(message) {
    if (mapStatus) mapStatus.textContent = message;
}

function showShopListMessage(message) {
    if (!shopList) return;
    const note = document.createElement("p");
    note.className = "map-empty-state";
    note.textContent = message;
    shopList.replaceChildren(note);
}

/* =========================================
   LOAD LEAFLET WITH A CDN FALLBACK
========================================= */

const LEAFLET_CDNS = [
    {
        css: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css",
        js: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"
    },
    {
        css: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
        js: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    }
];

function loadStylesheet(url) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`link[data-leaflet-css="${url}"]`);
        if (existing?.dataset.loaded === "true") {
            resolve();
            return;
        }

        const link = existing || document.createElement("link");
        let finished = false;
        const timeoutId = window.setTimeout(() => {
            if (!finished) {
                finished = true;
                reject(new Error("Leaflet stylesheet request timed out."));
            }
        }, 8000);

        link.rel = "stylesheet";
        link.href = url;
        link.dataset.leafletCss = url;
        link.onload = () => {
            if (finished) return;
            finished = true;
            window.clearTimeout(timeoutId);
            link.dataset.loaded = "true";
            resolve();
        };
        link.onerror = () => {
            if (finished) return;
            finished = true;
            window.clearTimeout(timeoutId);
            reject(new Error("Leaflet stylesheet could not be loaded."));
        };

        if (!existing) document.head.appendChild(link);
    });
}

function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        let finished = false;
        const timeoutId = window.setTimeout(() => {
            if (!finished) {
                finished = true;
                script.remove();
                reject(new Error("Leaflet script request timed out."));
            }
        }, 8000);

        script.src = url;
        script.async = true;
        script.dataset.leafletScript = "true";
        script.onload = () => {
            if (finished) return;
            finished = true;
            window.clearTimeout(timeoutId);
            resolve();
        };
        script.onerror = () => {
            if (finished) return;
            finished = true;
            window.clearTimeout(timeoutId);
            reject(new Error("Leaflet JavaScript could not be loaded."));
        };
        document.head.appendChild(script);
    });
}

async function ensureLeafletLoaded() {
    if (window.L?.map && window.L?.tileLayer) return;

    const failures = [];

    for (const cdn of LEAFLET_CDNS) {
        try {
            await loadStylesheet(cdn.css);
            await loadScript(cdn.js);

            if (window.L?.map && window.L?.tileLayer) return;
            throw new Error("The Leaflet library loaded without its map functions.");
        } catch (error) {
            failures.push(error.message);
        }
    }

    throw new Error(
        `The map library could not be loaded. Check your internet connection and refresh. ${failures.join(" ")}`
    );
}

/* =========================================
   NAVIGATION MENU
========================================= */

const menuButton = document.getElementById("menuButton");
const siteMenu = document.getElementById("siteMenu");

if (menuButton && siteMenu) {
    menuButton.addEventListener("click", () => {
        const expanded = menuButton.getAttribute("aria-expanded") === "true";
        menuButton.setAttribute("aria-expanded", String(!expanded));
        siteMenu.hidden = expanded;
    });

    document.addEventListener("click", event => {
        if (!siteMenu.contains(event.target) && !menuButton.contains(event.target)) {
            siteMenu.hidden = true;
            menuButton.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !siteMenu.hidden) {
            siteMenu.hidden = true;
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.focus();
        }
    });
}

/* =========================================
   INITIALISE MAP
========================================= */

function initialiseMap() {
    if (!mapElement) {
        throw new Error("The map container was not found on this page.");
    }

    map = L.map(mapElement, {
        scrollWheelZoom: true
    }).setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);

    const tileLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
        }
    );

    tileLayer.on("tileerror", () => {
        setMapStatus("The map is ready, but some map tiles could not be loaded. Check your internet connection.");
    });

    tileLayer.addTo(map);

    if (L.control?.scale) {
        L.control.scale({ imperial: false }).addTo(map);
    }

    // Corrects Leaflet's dimensions after the page has finished laying out.
    window.setTimeout(() => map.invalidateSize(), 150);
}

/* =========================================
   SHOP DATA HELPERS
========================================= */

function normaliseDevices(devices) {
    if (Array.isArray(devices)) return devices.map(String);
    if (typeof devices === "string") {
        return devices.split(",").map(value => value.trim()).filter(Boolean);
    }
    return [];
}

function validCoordinates(shop) {
    const lat = Number(shop.lat);
    const lng = Number(shop.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) &&
        lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function distanceInKm(pointA, pointB) {
    const toRadians = degrees => degrees * Math.PI / 180;
    const earthRadiusKm = 6371;
    const dLat = toRadians(pointB.lat - pointA.lat);
    const dLng = toRadians(pointB.lng - pointA.lng);
    const lat1 = toRadians(pointA.lat);
    const lat2 = toRadians(pointB.lat);

    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

    return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function getVisibleShops() {
    const search = document.getElementById("shopSearch")?.value.trim().toLowerCase() || "";
    const device = document.getElementById("deviceFilter")?.value || "";

    const filtered = allShops.filter(shop => {
        const name = String(shop.name || "").toLowerCase();
        const address = String(shop.address || "").toLowerCase();
        const devices = normaliseDevices(shop.devices);

        return (name.includes(search) || address.includes(search)) &&
            (!device || devices.includes(device));
    });

    if (userCoordinates) {
        filtered.sort((a, b) => {
            if (!validCoordinates(a)) return 1;
            if (!validCoordinates(b)) return -1;

            return distanceInKm(userCoordinates, {
                lat: Number(a.lat),
                lng: Number(a.lng)
            }) - distanceInKm(userCoordinates, {
                lat: Number(b.lat),
                lng: Number(b.lng)
            });
        });
    }

    return filtered;
}

/* =========================================
   DISPLAY SHOP MARKERS AND LIST
========================================= */

function renderShops(shops) {
    if (!map || !shopList) return;

    shopMarkers.forEach(marker => map.removeLayer(marker));
    shopMarkers = [];
    shopList.replaceChildren();

    if (shops.length === 0) {
        const searchActive = Boolean(
            document.getElementById("shopSearch")?.value.trim() ||
            document.getElementById("deviceFilter")?.value
        );
        showShopListMessage(
            searchActive
                ? "No repair shops match your search or device filter."
                : "No repair shops have been registered yet. A shop owner can add a listing from the Profile page."
        );
        return;
    }

    const bounds = [];

    shops.forEach(shop => {
        const devices = normaliseDevices(shop.devices);
        const hasCoordinates = validCoordinates(shop);
        const lat = hasCoordinates ? Number(shop.lat) : null;
        const lng = hasCoordinates ? Number(shop.lng) : null;
        const ratingText = shop.average_rating == null
            ? "Not rated yet"
            : `${shop.average_rating} / 5 (${shop.rating_count || 0})`;

        let marker = null;

        if (hasCoordinates) {
            const popup = `
                <strong>${escapeHTML(shop.name || "Repair shop")}</strong><br>
                ${escapeHTML(shop.address || "Address not provided")}<br>
                Devices: ${escapeHTML(devices.join(", ") || "Not specified")}<br>
                Warranty: ${Number(shop.warranty_days) || 0} days<br>
                Rating: ${escapeHTML(ratingText)}
            `;

            marker = L.marker([lat, lng]).addTo(map);
            marker.bindPopup(popup);
            shopMarkers.push(marker);
            bounds.push([lat, lng]);
        }

        const card = document.createElement("article");
        card.className = "shop-card";

        const heading = document.createElement("h3");
        heading.textContent = shop.name || "Repair shop";

        const address = document.createElement("p");
        address.textContent = shop.address || "Address not provided";

        const deviceLine = document.createElement("p");
        deviceLine.textContent = `Services: ${devices.join(", ") || "Not specified"}`;

        const warranty = document.createElement("p");
        warranty.textContent = `Warranty: ${Number(shop.warranty_days) || 0} days`;

        const rating = document.createElement("p");
        rating.textContent = `Rating: ${ratingText}`;

        card.append(heading, address, deviceLine, warranty, rating);

        if (userCoordinates && hasCoordinates) {
            const distance = document.createElement("p");
            const km = distanceInKm(userCoordinates, {lat, lng});
            distance.textContent = `Approx. ${km.toFixed(1)} km away (straight-line distance)`;
            card.appendChild(distance);
        }

        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.className = "secondary-button";
        viewButton.textContent = "View on Map";
        viewButton.disabled = !hasCoordinates;
        viewButton.addEventListener("click", () => {
            if (!hasCoordinates || !marker) return;
            map.setView([lat, lng], 15);
            marker.openPopup();
        });
        card.appendChild(viewButton);
        shopList.appendChild(card);
    });

    if (!userCoordinates && bounds.length > 0) {
        if (bounds.length === 1) {
            map.setView(bounds[0], 13);
        } else {
            map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
        }
    }
}

/* =========================================
   LOAD REPAIR SHOPS FROM FASTAPI
========================================= */

async function loadShops() {
    const backendConfigured = API_BASE_URL &&
        !API_BASE_URL.includes("YOUR-BACKEND-HOST") &&
        /^https?:\/\//i.test(API_BASE_URL);

    if (!backendConfigured) {
        showShopListMessage(
            "Shop listings will appear here after the FastAPI backend is deployed and connected."
        );
        setMapStatus(
            "Map loaded. Repair-shop listings are not connected yet: set the deployed FastAPI URL in config.js."
        );
        return;
    }

    setMapStatus("Map loaded. Loading registered repair shops...");

    try {
        const response = await fetch(`${API_BASE_URL}/shops`, {
            method: "GET",
            headers: { "Accept": "application/json" },
            cache: "no-store"
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) {
            const detail = result?.detail || response.statusText || "Request failed";
            throw new Error(`Shop service returned ${response.status}: ${detail}`);
        }

        if (!Array.isArray(result)) {
            throw new Error("The shop service returned an unexpected response.");
        }

        allShops = result;
        renderShops(getVisibleShops());

        if (allShops.length === 0) {
            setMapStatus("Map loaded. No registered repair shops were found yet.");
        } else {
            setMapStatus(`${allShops.length} registered repair shop(s) loaded.`);
        }
    } catch (error) {
        console.error("UnGlitch map: unable to load shops:", error);
        showShopListMessage(
            "The interactive map is available, but shop listings could not be retrieved. Check the FastAPI server, its URL and CORS settings."
        );
        setMapStatus(error.message || "Unable to retrieve repair shops.");
    }
}

/* =========================================
   SEARCH AND DEVICE FILTERS
========================================= */

function filterShops() {
    const filtered = getVisibleShops();
    renderShops(filtered);

    if (allShops.length > 0) {
        setMapStatus(`${filtered.length} matching repair shop(s).`);
    }
}

/* =========================================
   USER LOCATION AND NEAREST-SHOP SORTING
========================================= */

function locateUser() {
    if (!navigator.geolocation) {
        setMapStatus("Location services are not supported by this browser.");
        return;
    }

    setMapStatus("Finding your location...");

    navigator.geolocation.getCurrentPosition(
        position => {
            userCoordinates = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            map.setView([userCoordinates.lat, userCoordinates.lng], 13);

            if (userMarker) map.removeLayer(userMarker);
            userMarker = L.marker([userCoordinates.lat, userCoordinates.lng]).addTo(map);
            userMarker.bindPopup("Your approximate location.");

            renderShops(getVisibleShops());
            setMapStatus(
                allShops.length
                    ? "Your location is shown. Repair shops are sorted by approximate straight-line distance."
                    : "Your location is shown. No registered repair shops are available yet."
            );
        },
        error => {
            const message = error.code === 1
                ? "Location permission was denied. You can still browse repair shops."
                : "Your location could not be determined. Check location permissions and try again.";
            setMapStatus(message);
        },
        {
            enableHighAccuracy: false,
            timeout: 12000,
            maximumAge: 60000
        }
    );
}

/* =========================================
   STARTUP
========================================= */

async function startMapPage() {
    setMapStatus("Loading interactive map...");

    try {
        await ensureLeafletLoaded();
        initialiseMap();
        await loadShops();
    } catch (error) {
        console.error("UnGlitch map initialisation error:", error);
        setMapStatus(error.message || "The map could not be initialised.");
        showShopListMessage("The map could not be initialised. Refresh the page or check your internet connection.");
    }

    document.getElementById("shopSearch")?.addEventListener("input", filterShops);
    document.getElementById("deviceFilter")?.addEventListener("change", filterShops);
    document.getElementById("locateButton")?.addEventListener("click", locateUser);
}

startMapPage();
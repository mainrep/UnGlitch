/* =========================================
   UNGLITCH FRONTEND CONFIGURATION
   Keep this file's variables inside an IIFE so
   they do not collide with API_BASE_URL and
   GOOGLE_CLIENT_ID declared by page scripts.
========================================= */

(() => {
    const LOCAL_API_URL = "http://127.0.0.1:8000";

    // Replace this with the exact HTTPS URL shown in your Render dashboard.
    const PRODUCTION_API_URL = "https://unglitch-api.onrender.com/";

    const isLocalDevelopment =
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost";

    const API_BASE_URL = isLocalDevelopment
        ? LOCAL_API_URL
        : PRODUCTION_API_URL;

    const GOOGLE_CLIENT_ID =
        "863730349111-esfr6n6glra8u7a9oeb6vdlifnugblca.apps.googleusercontent.com";

    const isBackendConfigured = Boolean(
        /^https:\/\//i.test(API_BASE_URL) &&
        !API_BASE_URL.includes("YOUR-RENDER-SERVICE")
    ) || Boolean(isLocalDevelopment && /^http:\/\//i.test(API_BASE_URL));

    window.UNGLITCH_CONFIG = {
        API_BASE_URL: API_BASE_URL.replace(/\/+$/, ""),
        GOOGLE_CLIENT_ID,
        isLocalDevelopment,
        isBackendConfigured
    };
})();
/* =========================================
   UNGLITCH CONFIGURATION
========================================= */

const LOCAL_API_URL = "http://127.0.0.1:8000";

// Replace this only after deploying the FastAPI backend.
const PRODUCTION_API_URL = "https://YOUR-BACKEND-HOST";

const isLocalDevelopment =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost";

const API_BASE_URL = isLocalDevelopment
    ? LOCAL_API_URL
    : PRODUCTION_API_URL;


// Public Google OAuth Client ID.
// This is intentionally used by the frontend.
const GOOGLE_CLIENT_ID =
    "863730349111-esfr6n6glra8u7a9oeb6vdlifnugblca.apps.googleusercontent.com";


window.UNGLITCH_CONFIG = {
    API_BASE_URL,
    GOOGLE_CLIENT_ID,
    isLocalDevelopment
};
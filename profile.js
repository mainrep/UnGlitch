/* =========================================
   PROFILE PAGE
========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    const user = getCurrentUser();

    const signInSection =
        document.getElementById("signInSection");

    const accountSection =
        document.getElementById("accountSection");

    const consumerProfile =
        document.getElementById("consumerProfile");

    const shopProfile =
        document.getElementById("shopProfile");


    if (!user) {

        signInSection.hidden = false;
        accountSection.hidden = true;

        return;

    }


    signInSection.hidden = true;
    accountSection.hidden = false;

    document.getElementById("profileHeading").textContent =
        `Welcome, ${user.name}`;

    document.getElementById("profileName").textContent =
        `Name: ${user.name}`;

    document.getElementById("profileEmail").textContent =
        `Email: ${user.email}`;

    document.getElementById("profileRole").textContent =
        user.role === "consumer"
            ? "Consumer"
            : "Repair Shop Owner";


    document.getElementById("logoutButton")
        .addEventListener("click", logout);


    if (user.role === "consumer") {

        consumerProfile.hidden = false;
        shopProfile.hidden = true;

    } else {

        consumerProfile.hidden = true;
        shopProfile.hidden = false;

        await loadShopProfile();

    }

});


/* =========================================
   LOAD SHOP INFORMATION
========================================= */

async function loadShopProfile() {

    const information =
        document.getElementById("shopInformation");

    const status =
        document.getElementById("shopStatus");

    const registrationForm =
        document.getElementById("shopRegistrationForm");

    try {

        const response = await fetch(
            `${API_BASE_URL}/shops/me`,
            {
                headers: {
                    "Authorization":
                        `Bearer ${getAccessToken()}`
                }
            }
        );


        if (response.status === 404) {

            status.textContent =
                "You have not registered a repair shop yet.";

            registrationForm.hidden = false;

            return;

        }


        if (!response.ok) {

            throw new Error(
                "Unable to retrieve shop information."
            );

        }


        const shop = await response.json();

        information.replaceChildren();

        const details = [

            `Shop: ${shop.name}`,

            `Address: ${shop.address}`,

            `Warranty: ${shop.warranty_days} days`,

            `Devices serviced: ${shop.devices.join(", ")}`,

            `Rating: ${shop.average_rating ?? "Not rated yet"}`

        ];


        details.forEach(detail => {

            const paragraph =
                document.createElement("p");

            paragraph.textContent = detail;

            information.appendChild(paragraph);

        });


        status.textContent =
            "Your shop listing is connected.";

        registrationForm.hidden = true;

    } catch (error) {

        console.error(error);

        status.textContent = error.message;

    }

}


/* =========================================
   REGISTER SHOP
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const form =
        document.getElementById("shopRegistrationForm");

    if (!form) return;

    form.addEventListener("submit", async event => {

        event.preventDefault();

        const devices = Array.from(
            document.querySelectorAll(
                "input[name='devices']:checked"
            )
        ).map(input => input.value);


        if (devices.length === 0) {

            alert("Select at least one supported device.");

            return;

        }


        const data = {

            name:
                document.getElementById("shopName").value.trim(),

            address:
                document.getElementById("shopAddress").value.trim(),

            devices: devices,

            warranty_days:
                Number(document.getElementById("warrantyDays").value)

        };


        const button =
            form.querySelector("button[type='submit']");

        button.disabled = true;
        button.textContent = "Registering...";


        try {

            const response = await fetch(
                `${API_BASE_URL}/shops`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization":
                            `Bearer ${getAccessToken()}`
                    },

                    body: JSON.stringify(data)
                }
            );


            const result = await response.json();

            if (!response.ok) {

                throw new Error(
                    result.detail || "Shop registration failed."
                );

            }


            alert("Your shop has been registered.");

            await loadShopProfile();

        } catch (error) {

            console.error(error);

            document.getElementById("shopStatus").textContent =
                error.message;

        } finally {

            button.disabled = false;
            button.textContent = "Register Shop";

        }

    });

});
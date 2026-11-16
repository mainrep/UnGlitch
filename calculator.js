/* =========================================
   DEVICE BENCHMARKS
========================================= */

// Provisional category-level assumptions.
// Verify these against the source data before
// presenting them as research-backed values.

const deviceBenchmarks = {

    phone: {
        name: "Smartphone",
        footprint: 50,
        typicalLifespan: 4
    },

    tablet: {
        name: "Tablet",
        footprint: 100,
        typicalLifespan: 5
    },

    laptop: {
        name: "Laptop",
        footprint: 200,
        typicalLifespan: 5
    }

};


/* =========================================
   NAVIGATION MENU
========================================= */

const menuButton =
    document.getElementById("menuButton");

const siteMenu =
    document.getElementById("siteMenu");


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
   CALCULATOR ELEMENTS
========================================= */

const calculatorForm =
    document.getElementById("calculatorForm");

const emptyState =
    document.getElementById("emptyState");

const calculatorResult =
    document.getElementById("calculatorResult");


/* =========================================
   CALCULATION
========================================= */

calculatorForm.addEventListener("submit", event => {

    event.preventDefault();


    const deviceType =
        document.getElementById("deviceType").value;

    const model =
        document.getElementById("deviceModel").value.trim();

    const repairCost =
        Number(document.getElementById("repairCost").value);

    const replacementCost =
        Number(document.getElementById("replacementCost").value);

    const extraYears =
        Number(document.getElementById("extraYears").value);

    const replacementLikelihood =
        Number(
            document.getElementById("replacementLikelihood").value
        );

    const scenarioType =
        document.getElementById("scenarioType").value;

    const deviceCount =
        Number(document.getElementById("deviceCount").value);


    const device = deviceBenchmarks[deviceType];


    if (!device) {

        alert("Please select a valid device.");

        return;

    }


    if (
        repairCost < 0 ||
        replacementCost <= 0 ||
        deviceCount < 1
    ) {

        alert("Please enter valid costs and device numbers.");

        return;

    }


    /* =====================================
       ESTIMATE AVOIDED EMISSIONS
    ===================================== */

    const lifespanFraction = Math.min(
        extraYears / device.typicalLifespan,
        1
    );


    const individualEstimate =
        device.footprint *
        replacementLikelihood *
        lifespanFraction;


    const groupEstimate =
        individualEstimate * deviceCount;


    /* =====================================
       FINANCIAL COMPARISON
    ===================================== */

    const costDifference =
        replacementCost - repairCost;


    /* =====================================
       DISPLAY RESULTS
    ===================================== */

    emptyState.hidden = true;

    calculatorResult.hidden = false;


    document.getElementById("carbonNumber").textContent =
        `≈ ${groupEstimate.toFixed(2)} kg CO₂e`;


    const modelDescription =
        model ? ` (${model})` : "";


    document.getElementById("resultExplanation").textContent =

        `For ${deviceCount} ${device.name.toLowerCase()} device(s)` +
        `${modelDescription}, the model estimates approximately ` +
        `${groupEstimate.toFixed(2)} kg CO₂e of potentially avoided ` +
        `manufacturing emissions under the selected scenario.`;


    /* =====================================
       FINANCIAL RESULT
    ===================================== */

    const financialResult =
        document.getElementById("financialResult");


    if (costDifference > 0) {

        financialResult.textContent =

            `The estimated repair cost is ₹${repairCost.toLocaleString("en-IN")}, ` +
            `compared with a replacement cost of ₹${replacementCost.toLocaleString("en-IN")}. ` +
            `Repairing would cost approximately ₹${costDifference.toLocaleString("en-IN")} less.`;

    } else if (costDifference < 0) {

        financialResult.textContent =

            `The estimated repair cost is higher than the replacement cost ` +
            `by approximately ₹${Math.abs(costDifference).toLocaleString("en-IN")}.`;

    } else {

        financialResult.textContent =
            "The estimated repair and replacement costs are equal.";

    }


    /* =====================================
       GROUP RESULT
    ===================================== */

    const groupNames = {

        individual: "Individual",

        household: "Household",

        school: "School or Community Group"

    };


    document.getElementById("groupResult").textContent =

        `${groupNames[scenarioType]} scenario: ` +
        `${deviceCount} device(s) could represent approximately ` +
        `${groupEstimate.toFixed(2)} kg CO₂e in potentially avoided ` +
        `manufacturing emissions under these assumptions.`;


    /* =====================================
       EXPLAIN CALCULATION
    ===================================== */

    document.getElementById("calculationExplanation").textContent =

        `The calculation uses an indicative ${device.footprint} kg CO₂e ` +
        `manufacturing-footprint benchmark for a ${device.name.toLowerCase()}, ` +
        `a typical lifespan assumption of ${device.typicalLifespan} years, ` +
        `an additional-use period of ${extraYears} years, and a ` +
        `${(replacementLikelihood * 100).toFixed(0)}% probability assumption ` +
        `that repair prevents replacement. The result is then multiplied ` +
        `by ${deviceCount} device(s).`;


    calculatorResult.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

});
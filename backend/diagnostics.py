import re

from backend.schemas import DiagnosticRequest


# =========================================
# BASE DIAGNOSTIC INFORMATION
# =========================================

GUIDANCE = {

    "battery": {
        "title": "Possible Battery Problem",

        "summary":
            "Your symptoms may indicate battery degradation or a problem with the device's power-management system.",

        "causes": [
            "Reduced battery capacity due to normal ageing.",
            "Excessive background application usage.",
            "A battery or power-management fault."
        ],

        "steps": [
            "Check your device's battery-health information, if available.",
            "Review applications consuming excessive power.",
            "Check whether the problem persists after restarting."
        ],

        "warning":
            "If the battery appears swollen, becomes unusually hot or produces an unusual smell, stop using and charging the device. Do not attempt to open it. Seek qualified repair assistance."
    },


    "charging": {
        "title": "Possible Charging Problem",

        "summary":
            "The problem may involve the charging cable, adapter, charging port or internal charging circuitry.",

        "causes": [
            "A damaged or incompatible charging cable.",
            "A faulty power adapter or power source.",
            "A damaged charging port or internal charging component."
        ],

        "steps": [
            "Check whether your charging cable and adapter are compatible and undamaged.",
            "Observe whether the issue occurs with another suitable power source.",
            "Have the charging port professionally inspected if the problem persists."
        ],

        "warning":
            "Do not use damaged charging equipment or insert objects into the charging port."
    },


    "display": {
        "title": "Possible Display Problem",

        "summary":
            "The issue may involve the display panel, its connections or the graphics software.",

        "causes": [
            "Display panel damage.",
            "A damaged internal display connection.",
            "A software or graphics-related problem."
        ],

        "steps": [
            "Restart the device if it is safe to do so.",
            "Check whether sounds and notifications still work.",
            "Back up important data if the device remains accessible."
        ],

        "warning":
            "Avoid applying pressure to a damaged display. Seek professional assistance."
    },


    "performance": {
        "title": "Possible Performance Problem",

        "summary":
            "Slow performance may be associated with software, available storage or ageing hardware.",

        "causes": [
            "Insufficient storage.",
            "Excessive background application activity.",
            "Outdated software or ageing components."
        ],

        "steps": [
            "Review available storage.",
            "Restart your device.",
            "Check for official operating-system updates.",
            "Review applications running in the background."
        ],

        "warning":
            "Persistent performance problems may require a professional assessment."
    },


    "connectivity": {
        "title": "Possible Connectivity Problem",

        "summary":
            "The issue may involve network settings, software or a connectivity component.",

        "causes": [
            "Unstable wireless connections.",
            "Incorrect network settings.",
            "A software or hardware connectivity fault."
        ],

        "steps": [
            "Restart your device and relevant network equipment.",
            "Check whether other devices can connect successfully.",
            "Check for official software updates."
        ],

        "warning":
            "A professional assessment may be necessary if multiple connections consistently fail."
    },


    "liquid": {
        "title": "Possible Liquid Damage",

        "summary":
            "Liquid exposure can affect several internal components, even if the device initially appears to work.",

        "causes": [
            "Moisture affecting electronic components.",
            "Corrosion developing internally.",
            "Damage to charging or power circuitry."
        ],

        "steps": [
            "Stop using the device.",
            "Disconnect it from its charger if safe to do so.",
            "Arrange a professional inspection."
        ],

        "warning":
            "Do not charge, heat or attempt to open a device exposed to liquid. Seek qualified repair assistance."
    },


    "physical": {
        "title": "Possible Physical Damage",

        "summary":
            "The reported issue may be associated with physical damage to the device or its components.",

        "causes": [
            "Impact damage from a fall.",
            "Damage to the display or casing.",
            "Damage to internal components."
        ],

        "steps": [
            "Avoid applying pressure to damaged areas.",
            "Back up important information if safe and possible.",
            "Arrange an assessment with a qualified repair provider."
        ],

        "warning":
            "Do not attempt to dismantle a physically damaged device."
    },


    "other": {
        "title": "Further Assessment Recommended",

        "summary":
            "More information is required to identify possible causes of the reported problem.",

        "causes": [
            "A software-related issue.",
            "A hardware malfunction.",
            "Several interacting problems."
        ],

        "steps": [
            "Record any error messages.",
            "Note when the problem occurs.",
            "Check for official software updates.",
            "Consult a qualified technician if the issue persists."
        ],

        "warning":
            "This preliminary assessment cannot replace a physical inspection."
    }

}


# =========================================
# DEVICE-SPECIFIC INFORMATION
# =========================================

DEVICE_CONTEXT = {

    "phone": "smartphone components",

    "tablet": "tablet hardware and power components",

    "laptop": "laptop hardware, power adapter and internal components"

}


# =========================================
# KEYWORD ANALYSIS
# =========================================

def contains_any(text, keywords):

    return any(
        keyword in text
        for keyword in keywords
    )


def analyse_symptoms(data):

    text = (data.symptoms or "").lower()

    observations = []
    additional_causes = []
    additional_steps = []

    if data.issue_type == "charging":

        if contains_any(text, ["slow", "long", "hours", "taking too long"]):

            observations.append(
                "You report unusually slow charging."
            )

            additional_causes.append(
                "The charging system may not be delivering power consistently."
            )

            additional_steps.append(
                "Note whether charging speed changes with a different compatible adapter."
            )

        if contains_any(text, ["disconnect", "loose", "intermittent"]):

            observations.append(
                "You report an inconsistent charging connection."
            )

            additional_causes.append(
                "An intermittent connection may involve the cable or charging port."
            )

    elif data.issue_type == "battery":

        if contains_any(text, ["drain", "dies quickly", "battery life"]):

            observations.append(
                "Your description suggests unusually rapid battery discharge."
            )

            additional_steps.append(
                "Compare battery consumption across different applications."
            )

        if contains_any(text, ["hot", "overheat", "swollen", "bulging"]):

            observations.append(
                "Your description includes a possible battery-safety concern."
            )

    elif data.issue_type == "display":

        if contains_any(text, ["flicker", "flickering", "lines"]):

            observations.append(
                "You report display irregularities such as flickering or lines."
            )

        if contains_any(text, ["black screen", "blank screen"]):

            observations.append(
                "You report that the display is blank or black."
            )

    elif data.issue_type == "performance":

        if contains_any(text, ["freeze", "freezing", "crash"]):

            observations.append(
                "You report freezing or unexpected application crashes."
            )

        if contains_any(text, ["slow", "lag", "lagging"]):

            observations.append(
                "You report noticeably slow device performance."
            )

    elif data.issue_type == "connectivity":

        if contains_any(text, ["wifi", "wi-fi"]):

            observations.append(
                "Your description specifically mentions Wi-Fi connectivity."
            )

        if contains_any(text, ["bluetooth"]):

            observations.append(
                "Your description specifically mentions Bluetooth connectivity."
            )

    return observations, additional_causes, additional_steps


# =========================================
# MAIN DIAGNOSTIC FUNCTION
# =========================================

def build_diagnostic(data: DiagnosticRequest):

    guidance = GUIDANCE[data.issue_type]

    causes = list(guidance["causes"])
    steps = list(guidance["steps"])

    observations, extra_causes, extra_steps = analyse_symptoms(data)

    causes.extend(extra_causes)
    steps.extend(extra_steps)

    device_context = DEVICE_CONTEXT[data.device_type]

    summary = guidance["summary"]

    summary += f" The assessment considers your {device_context}."

    # Consider the reported age.

    if data.device_age == "over4":

        causes.append(
            "Age-related component wear may also be relevant."
        )

        summary += (
            " Since the device is more than four years old, "
            "age-related wear is also worth considering."
        )

    elif data.device_age == "under1":

        summary += (
            " As the device is less than one year old, "
            "checking its warranty coverage may be worthwhile."
        )

        steps.append(
            "Check whether the device is covered by its manufacturer warranty."
        )

    # Incorporate the user's description.

    if observations:

        summary += " " + " ".join(observations)

    # Remove duplicate information.

    causes = list(dict.fromkeys(causes))
    steps = list(dict.fromkeys(steps))

    return {

        "title": guidance["title"],

        "summary": summary,

        "possible_causes": causes,

        "recommended_steps": steps,

        "warning": guidance["warning"],

        "assessment_method": (
            "Rule-based assessment using the selected issue, "
            "device category, reported age and symptom keywords."
        )

    }
# IoT Assessment Planner

An interactive, manager-ready workspace for scoping and executing enterprise IoT security assessments. It is tailored to connected devices deployed in corporate environments, including CCTV, biometric systems, access control, printers, meeting-room equipment, sensors, gateways, and building-management systems.

## Features

- Four engagement depths: passive, logical, radio/protocol, and hardware/firmware
- Fine-grained approval switches for invasive and disruptive techniques
- Client discovery questionnaire
- Editable asset inventory with CSV export
- 122 scope-aware assessment checks across 12 categories
- Rules of Engagement and readiness gate
- On-site runbook and equipment guidance
- Generated scope language and client pitch
- Local autosave, JSON import/export, and print/PDF support

## Run locally

No build step or dependencies are required.

```bash
python3 -m http.server 8765 --directory dist
```

Then open `http://localhost:8765`.

Assessment data is stored in the browser's local storage. Export the workspace as JSON before clearing browser data or moving to another computer.

## Methodology references

The planner draws on OWASP IoT Security Testing Guide structures, NIST IoT device cybersecurity capabilities, ETSI EN 303 645, and public professional service approaches from Payatu and Rapid7. Links and adaptation notes are included in the application's **Method & sources** section.

## Authorization

Use this planner only for systems and activities covered by explicit written authorization. Third-party cloud services, invasive hardware work, radio interaction, firmware modification, reset operations, and availability testing require clearly defined scope and operating conditions.

## Public website

The assessment planner is publicly available at:

https://parakrami.github.io/iot-assessment-planner/

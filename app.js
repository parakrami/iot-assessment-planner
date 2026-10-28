"use strict";

const STORAGE_KEY = "iot-assessment-planner-v1";
const viewTitles = {dashboard:"Assessment dashboard",scope:"Scope builder",discovery:"Client discovery",inventory:"Asset inventory",checklist:"Test checklist",prerequisites:"Prerequisites & Rules of Engagement",onsite:"On-site runbook",pitch:"Client pitch",references:"Method & sources"};

const levels = [
  {id:0,name:"Observe",title:"Passive & documentary",tag:"No device interaction",description:"Inventory, interviews, architecture, supplied evidence and passive observation. Suitable for fragile production environments and an initial discovery phase.",summary:"No packets transmitted to target devices; no radio injection; no device handling.",coverage:["Document and inventory review","Architecture and data-flow mapping","Passive network and radio observation","Vendor, support and lifecycle review"]},
  {id:1,name:"Logical",title:"Network & application",tag:"No physical touch",description:"Adds safe active discovery, configuration review, authenticated testing, segmentation validation, web, mobile, API and client-controlled cloud testing.",summary:"No enclosure opening, firmware extraction, debug-port access or active radio attacks.",coverage:["Level 0 coverage","Controlled network discovery","Credentialed configuration review","Web, mobile, API and tenant testing","Safe validation of access controls"]},
  {id:2,name:"Radio",title:"Wireless & protocol",tag:"Controlled RF work",description:"Adds protocol capture, pairing and commissioning review, authorized replay checks and controlled protocol robustness testing in a defined RF area.",summary:"No jamming or broad disconnection; no physical device opening unless separately enabled.",coverage:["Levels 0–1 coverage","Wi-Fi, BLE, Zigbee, NFC/RFID or relevant radio review","Pairing and onboarding validation","Controlled replay and protocol tests"]},
  {id:3,name:"Deep",title:"Hardware & firmware",tag:"Invasive lab work",description:"Adds enclosure opening, board inspection, firmware acquisition, UART/JTAG/SWD review and controlled attempts to reach privileged device functions on spare units.",summary:"Potentially destructive techniques remain separate and require explicit approval.",coverage:["Levels 0–2 coverage","Hardware teardown and board mapping","Firmware extraction and analysis","UART/JTAG/SWD testing","Boot, update and device-secret review"]}
];

const permissions = [
  {id:"documentary",name:"Documentation & inventory",description:"Architecture, versions, ownership, vendor and lifecycle evidence",min:0},
  {id:"passiveNetwork",name:"Passive network capture",description:"Observe approved traffic without transmitting to targets",min:0},
  {id:"onsiteWalk",name:"Visual site walkthrough",description:"Observe installations, cabinets and labels without handling devices",min:0},
  {id:"activeDiscovery",name:"Controlled active discovery",description:"Rate-limited host, port and service identification",min:1},
  {id:"configReview",name:"Credentialed configuration review",description:"Use client-provided accounts and exported configurations",min:1},
  {id:"appCloud",name:"Web, mobile, API & tenant",description:"Test client-authorized applications and cloud tenant functions",min:1},
  {id:"safeValidation",name:"Safe exploitability validation",description:"Controlled proof using test accounts and non-sensitive data",min:1},
  {id:"passiveRadio",name:"Passive RF observation",description:"Identify and capture authorized wireless technologies",min:1},
  {id:"activeRadio",name:"Active radio interaction",description:"Pairing, commissioning and controlled message interaction",min:2},
  {id:"replay",name:"Replay & impersonation checks",description:"Controlled validation in a bounded test area",min:2},
  {id:"protocolFuzz",name:"Protocol robustness / fuzzing",description:"Malformed input on a spare or recoverable target",min:2},
  {id:"firmwarePackage",name:"Provided firmware analysis",description:"Analyze vendor/client supplied update packages",min:2},
  {id:"physicalTouch",name:"Physical handling",description:"Handle, disconnect or move an approved test unit",min:3},
  {id:"openEnclosure",name:"Open enclosure & map PCB",description:"Disassemble an approved spare unit and identify components",min:3},
  {id:"firmwareExtraction",name:"Firmware extraction",description:"Acquire storage through approved hardware or software paths",min:3},
  {id:"uart",name:"UART / serial console",description:"Identify serial output, boot controls and console access",min:3},
  {id:"jtag",name:"JTAG / SWD debugging",description:"Assess production debug access and memory controls",min:3},
  {id:"rootShell",name:"Privileged shell attempt",description:"Attempt controlled root/admin access on a recoverable device",min:3},
  {id:"thirdPartyCloud",name:"Third-party vendor cloud",description:"Test vendor-operated infrastructure under separate authorization",manual:true},
  {id:"factoryReset",name:"Factory reset / ownership transfer",description:"Reset test unit and verify data and cloud-association removal",manual:true},
  {id:"firmwareReflash",name:"Modified firmware / reflash",description:"Write or boot modified software on an expendable unit",manual:true},
  {id:"availability",name:"Availability / DoS testing",description:"Resource exhaustion, reboot or service disruption scenarios",manual:true},
  {id:"chipOff",name:"Chip-off / destructive extraction",description:"Remove or alter components; device may be permanently damaged",manual:true},
  {id:"sideChannel",name:"Fault injection / side channel",description:"Glitching, power or electromagnetic analysis in a specialist lab",manual:true}
];

const discoverySections = [
  {title:"1. Business context and objective",hint:"Why the assessment exists",fields:[
    {id:"clientName",label:"Client / business unit",type:"text",help:"Legal entity and the group commissioning the work."},
    {id:"objective",label:"Primary security question",type:"textarea",full:true,help:"Example: Can a compromised CCTV or biometric device reach sensitive corporate systems?"},
    {id:"businessImpact",label:"Most important business impacts",type:"checks",full:true,options:["Confidential financial data","Employee/client personal data","Surveillance footage","Physical access","Trading/business availability","Regulatory exposure","Corporate network compromise","Reputation"]},
    {id:"sites",label:"Sites and locations",type:"textarea",help:"Head office, branches, data centre, shared building areas."},
    {id:"stakeholders",label:"Required stakeholders",type:"textarea",help:"Security, IT, network, facilities, physical security, procurement, vendors."},
    {id:"deadline",label:"Target dates / business blackout periods",type:"text"}
  ]},
  {title:"2. Device estate",hint:"What exists and who owns it",fields:[
    {id:"deviceTypes",label:"Device categories present",type:"checks",full:true,options:["CCTV / IP camera","NVR / DVR","Biometric attendance","Door / access control","Visitor kiosk","Printer / scanner","Smart TV / signage","Video conference","VoIP phone","HVAC / BMS","Fire / safety monitoring","UPS / power monitor","Environmental sensor","IoT gateway","Other"]},
    {id:"deviceCount",label:"Approximate quantity",type:"text"},
    {id:"uniqueModels",label:"Unique makes / models / revisions",type:"textarea"},
    {id:"inventoryQuality",label:"Current inventory quality",type:"select",options:["Unknown","Partial","Mostly complete","Verified and current"]},
    {id:"ownership",label:"Who owns the physical devices?",type:"textarea",help:"AMC, landlord, managed-service provider or another party."},
    {id:"operators",label:"Who administers and supports them?",type:"textarea"}
  ]},
  {title:"3. Architecture and connectivity",hint:"How components communicate",fields:[
    {id:"architecture",label:"Architecture and data-flow diagrams available?",type:"select",options:["Unknown","No","Partial","Yes"]},
    {id:"networks",label:"Networks, VLANs and IP ranges",type:"textarea",help:"Include management, IoT, corporate, guest and building networks."},
    {id:"connectivity",label:"Connectivity in use",type:"checks",full:true,options:["Ethernet","Wi-Fi 2.4 GHz","Wi-Fi 5/6 GHz","Bluetooth / BLE","Zigbee / Thread","NFC / RFID","LoRa / sub-GHz","Cellular","USB / serial","Proprietary radio","Offline / standalone"]},
    {id:"protocols",label:"Known protocols and services",type:"textarea",help:"HTTPS, SSH, SNMP, RTSP, ONVIF, MQTT, CoAP, BACnet, Modbus, SIP, vendor-specific."},
    {id:"internet",label:"Internet exposure and outbound destinations",type:"textarea"},
    {id:"criticalDependencies",label:"Safety or availability dependencies",type:"textarea",help:"Door control, fire alarms, power, HVAC or services that cannot be interrupted."}
  ]},
  {title:"4. Connected ecosystem",hint:"Apps, cloud, gateways and vendors",fields:[
    {id:"cloud",label:"Cloud or hosted services",type:"textarea",help:"Provider, region, tenant, URLs and data stored."},
    {id:"apps",label:"Companion web / mobile / desktop applications",type:"textarea",help:"Names, platforms, versions and distribution method."},
    {id:"apis",label:"APIs, message brokers and integrations",type:"textarea"},
    {id:"gateways",label:"Gateways, controllers or central servers",type:"textarea"},
    {id:"vendorRemote",label:"Vendor remote access and support path",type:"textarea",help:"VPN, jump host, always-on agent, shared account, remote desktop."},
    {id:"thirdPartyAuth",label:"Who can authorize vendor cloud testing?",type:"textarea"}
  ]},
  {title:"5. Identity, data and monitoring",hint:"Accounts, secrets and sensitive information",fields:[
    {id:"accounts",label:"Available test accounts and roles",type:"textarea",help:"Viewer, operator, administrator, vendor, mobile and API identities."},
    {id:"authModel",label:"Authentication and device identity model",type:"textarea",help:"Passwords, certificates, shared keys, SSO, MFA, per-device secrets."},
    {id:"dataTypes",label:"Data stored or transmitted",type:"textarea",help:"Video, biometrics, access logs, audio, location, employee identifiers, credentials."},
    {id:"retention",label:"Retention, privacy and deletion requirements",type:"textarea"},
    {id:"logging",label:"Logging, SIEM and alerting coverage",type:"textarea"},
    {id:"testData",label:"Test identities and non-sensitive data available?",type:"select",options:["Unknown","No","Partial","Yes"]}
  ]},
  {title:"6. Firmware, updates and lifecycle",hint:"Versions, recovery and vendor support",fields:[
    {id:"versions",label:"Hardware and firmware versions known?",type:"select",options:["Unknown","No","Partial","Yes"]},
    {id:"firmwareSource",label:"Can firmware/update packages be supplied?",type:"textarea"},
    {id:"updateProcess",label:"Update process and signing information",type:"textarea"},
    {id:"support",label:"Support periods, EOL dates and vendor advisories",type:"textarea"},
    {id:"recovery",label:"Backup, restore and recovery procedure",type:"textarea"},
    {id:"retirement",label:"Reset, ownership transfer and disposal process",type:"textarea"}
  ]},
  {title:"7. Authorization and operating conditions",hint:"What testers may safely do",fields:[
    {id:"environment",label:"Environment available",type:"checks",full:true,options:["Production","Staging","Isolated lab","Representative spare unit","Expendable unit","Vendor test tenant"]},
    {id:"spares",label:"Number of spare / identical units",type:"text"},
    {id:"maintenance",label:"Maintenance window and expected downtime",type:"textarea"},
    {id:"allowed",label:"Explicitly permitted techniques",type:"textarea",help:"Active scans, RF interaction, enclosure opening, extraction, reset, reflash, availability tests."},
    {id:"prohibited",label:"Prohibited techniques and protected systems",type:"textarea"},
    {id:"escalation",label:"Primary and backup escalation contacts",type:"textarea"},
    {id:"stopConditions",label:"Client-specific stop conditions",type:"textarea"},
    {id:"evidenceRules",label:"Evidence handling and photography restrictions",type:"textarea"}
  ]},
  {title:"8. Reporting and acceptance",hint:"What success looks like",fields:[
    {id:"audience",label:"Report audiences",type:"checks",full:true,options:["Executive management","Information security","IT/network","Facilities","Physical security","Procurement","Device vendor","Auditor/regulator"]},
    {id:"standards",label:"Required standards or mappings",type:"textarea",help:"OWASP ISTG, NIST IR 8259A, ETSI EN 303 645, internal policy, sector requirements."},
    {id:"severity",label:"Severity model",type:"select",options:["Agree during scoping","CVSS plus business context","Client risk matrix","Custom"]},
    {id:"deliverables",label:"Expected deliverables",type:"checks",full:true,options:["Executive report","Technical report","Verified inventory","Architecture map","Coverage matrix","Evidence pack","Remediation workshop","Retest letter","30/60/90 plan"]},
    {id:"retest",label:"Retest expectation and time window",type:"textarea"},
    {id:"acceptance",label:"Completion / acceptance criteria",type:"textarea"}
  ]}
];

const t=(id,name,method,evidence,permission="documentary",ref="")=>({id,name,method,evidence,permission,ref});
const testCategories = [
  {id:"GOV",name:"Governance, inventory & ownership",description:"Know what exists, why it matters and who can fix it.",tests:[
    t("GOV-01","Reconcile discovered devices with the asset register","Compare DHCP, ARP, switch, wireless-controller and management-platform records with the supplied inventory.","Device list with source, timestamp and reconciliation differences."),
    t("GOV-02","Record unique make, model, hardware revision and firmware","Treat materially different revisions or firmware as separate test populations.","Verified identity record and label/configuration evidence."),
    t("GOV-03","Assign business, technical and vendor owners","Identify the team responsible for use, administration, patching and remediation.","RACI or named ownership fields."),
    t("GOV-04","Classify business function and criticality","Record confidentiality, integrity, availability, privacy and physical-safety consequences.","Impact classification with rationale."),
    t("GOV-05","Identify unsupported or end-of-life devices","Validate support dates and available security updates with the vendor.","Vendor source and support/EOL status."),
    t("GOV-06","Identify unapproved or shadow IoT","Investigate connected devices without a known owner or approved business purpose.","Unknown-device exceptions and disposition."),
    t("GOV-07","Review procurement security requirements","Check whether contracts require unique credentials, updates, disclosure handling and support periods.","Contract/control gap summary."),
    t("GOV-08","Review vulnerability disclosure and vendor response path","Confirm how the AMC reports security issues and receives advisories.","Escalation route, SLA and contact evidence."),
    t("GOV-09","Confirm data classification and privacy ownership","Identify video, biometric, access, audio and employee data processed by each system.","Data inventory and accountable owner."),
    t("GOV-10","Define representative sampling","Select models, revisions, sites and configurations that cover the estate without implying untested devices were assessed.","Sampling rationale and explicit limitations.")
  ]},
  {id:"ARC",name:"Architecture & threat model",description:"Map components, trust boundaries and realistic attacker positions.",tests:[
    t("ARC-01","Create device and ecosystem component model","Map device, gateway, controller, app, API, cloud, identity provider and update service.","Component diagram and versioned scope."),
    t("ARC-02","Create data-flow and trust-boundary map","Document credentials, commands, telemetry and sensitive data crossing each boundary.","Data-flow diagram with protocols and trust assumptions."),
    t("ARC-03","Define attacker perspectives","Model remote unauthenticated, ordinary user, same-network, nearby radio, physical and compromised-device positions.","Attacker model linked to selected tests."),
    t("ARC-04","Identify crown-jewel paths","Trace whether devices can reach financial data, identity systems, surveillance, physical access or core infrastructure.","Attack-path narrative and required controls."),
    t("ARC-05","Identify shared dependencies and blast radius","Review shared credentials, brokers, management planes, certificates and update infrastructure.","Fleet-wide dependency and blast-radius list."),
    t("ARC-06","Review failure and offline modes","Determine behavior when internet, cloud, DNS, identity, power or a gateway becomes unavailable.","Expected vs observed failure behavior."),
    t("ARC-07","Review tenant and site separation design","Confirm whether offices, branches, vendors and customer tenants have defined security boundaries.","Boundary design and exceptions."),
    t("ARC-08","Document assumptions and untested components","Make every dependency, third-party exclusion and coverage limit visible.","Signed scope/limitation matrix.")
  ]},
  {id:"NET",name:"Network exposure & segmentation",description:"Determine what can reach devices and what a compromised device can reach.",tests:[
    t("NET-01","Passively identify addresses, names and protocols","Observe approved captures and infrastructure logs before active scanning.","Timestamped host/protocol map.","passiveNetwork"),
    t("NET-02","Identify external destinations and dependencies","Resolve normal device destinations, certificate endpoints, update hosts and vendor services.","Allowlist candidate and unexplained destinations.","passiveNetwork"),
    t("NET-03","Check for cleartext sensitive communication","Review whether credentials, tokens, personal data, video metadata or commands traverse in cleartext.","Sanitized packet evidence and affected flow.","passiveNetwork"),
    t("NET-04","Discover exposed TCP and UDP services","Perform rate-limited identification on approved ranges and compare with expected services.","Service matrix with timestamp and scan profile.","activeDiscovery"),
    t("NET-05","Review unnecessary and legacy services","Assess Telnet, FTP, unauthenticated HTTP, old SNMP and unused discovery protocols.","Service necessity and configuration evidence.","activeDiscovery"),
    t("NET-06","Review management-plane reachability","Validate which networks can access device, NVR, gateway and controller administration.","Source/destination/port test matrix.","activeDiscovery"),
    t("NET-07","Validate IoT-to-corporate segmentation","From an approved representative host, test only authorized paths toward user, server and management zones.","Permitted/blocked path evidence.","safeValidation"),
    t("NET-08","Validate east-west device isolation","Determine whether one device can directly discover or administer unrelated device groups.","Same-VLAN and cross-VLAN path results.","safeValidation"),
    t("NET-09","Review outbound internet restrictions","Compare observed and permitted egress with documented business need.","Firewall/flow review and excess destinations.","configReview"),
    t("NET-10","Check direct internet exposure","Validate public addresses, forwarded ports, remote management and vendor relay paths.","External exposure inventory and ownership.","activeDiscovery"),
    t("NET-11","Review DNS, NTP and certificate dependencies","Check approved resolvers, time sources and consequences of manipulation or outage.","Configuration and traffic evidence.","configReview"),
    t("NET-12","Review NAC and device admission controls","Assess device profiling, unauthorized port use and handling of replaced/spoofed devices.","NAC policy and controlled validation.","configReview"),
    t("NET-13","Review multicast and discovery exposure","Assess mDNS, SSDP, WS-Discovery, ONVIF or vendor discovery across boundaries.","Discovery scope and information exposure.","activeDiscovery"),
    t("NET-14","Confirm monitoring coverage for device traffic","Determine whether anomalous destinations, scans and management access are visible.","Monitoring use cases and test-event correlation.","configReview")
  ]},
  {id:"CFG",name:"Device configuration & management",description:"Review production hardening and administrative control.",tests:[
    t("CFG-01","Check default and initial credentials","Validate only approved default/known credentials using a controlled attempt.","Account tested, result and lockout observation.","safeValidation"),
    t("CFG-02","Review unnecessary features and interfaces","Compare enabled functions with operational need and secure baseline.","Configuration deviation list.","configReview"),
    t("CFG-03","Review secure management protocols","Validate protected administration, certificate use and removal of insecure alternatives.","Management protocol and TLS evidence.","configReview"),
    t("CFG-04","Review configuration change authorization","Confirm only intended roles can alter security, network, logging and update settings.","Role/action matrix.","configReview"),
    t("CFG-05","Review configuration backup security","Check confidentiality, integrity, secrets and restoration controls for exported backups.","Sanitized backup review and storage controls.","configReview"),
    t("CFG-06","Review secure baseline and drift","Compare sampled devices to the approved template and identify inconsistent hardening.","Baseline comparison and drift report.","configReview"),
    t("CFG-07","Review session timeout and reauthentication","Check management sessions, idle timeout and confirmation for sensitive actions.","Observed session behavior.","appCloud"),
    t("CFG-08","Review diagnostic and maintenance modes","Check whether service modes expose data, bypass controls or remain enabled in production.","Mode access and capability evidence.","configReview"),
    t("CFG-09","Review time, timezone and audit integrity","Confirm reliable timestamps and restricted ability to alter them.","Time-source and role evidence.","configReview"),
    t("CFG-10","Verify secure restoration procedure","Confirm the organization can recover approved settings without restoring compromised secrets.","Documented and, where permitted, observed recovery.","factoryReset")
  ]},
  {id:"IAM",name:"Identity, authentication & authorization",description:"Test human, service and device identities across the ecosystem.",tests:[
    t("IAM-01","Identify all human, service and device accounts","Map local accounts, cloud users, API clients, certificates and vendor identities.","Identity inventory and owner."),
    t("IAM-02","Review shared and fleet-wide credentials","Determine whether compromise of one device or site exposes others.","Reuse scope and blast-radius evidence.","configReview"),
    t("IAM-03","Review password and MFA controls","Assess policy, throttling, lockout, MFA and recovery for management services.","Control and safe validation results.","appCloud"),
    t("IAM-04","Test role separation","Verify viewer, operator, administrator and vendor actions on approved accounts.","Role/action authorization matrix.","appCloud"),
    t("IAM-05","Test object and device ownership checks","Check whether changing device, site or tenant identifiers exposes another object.","Sanitized cross-object validation.","appCloud"),
    t("IAM-06","Review provisioning and initial trust","Assess enrollment codes, QR tokens, bootstrap accounts and certificate issuance.","Provisioning flow and replay/expiry observations.","appCloud"),
    t("IAM-07","Review credential storage and distribution","Determine how passwords, keys and certificates reach devices and administrators.","Secret-flow diagram and storage controls.","documentary"),
    t("IAM-08","Review vendor joiner/mover/leaver controls","Confirm temporary access, named identities, approvals, expiry and revocation.","Vendor access samples and expiry evidence.","configReview"),
    t("IAM-09","Verify account and certificate revocation","Confirm disabled users/devices lose local, cloud and API access.","Revocation test and propagation time.","appCloud"),
    t("IAM-10","Review machine-to-machine authentication","Assess uniqueness, rotation, certificate validation and least privilege for device identities.","Device identity design and observed controls.","configReview")
  ]},
  {id:"DATA",name:"Data protection, privacy & logging",description:"Protect information at rest, in transit and through retirement.",tests:[
    t("DATA-01","Map sensitive data by component","Identify what is collected, stored, transmitted, displayed and exported.","Data-flow inventory and classification."),
    t("DATA-02","Review transport protection","Validate protocol versions, certificate validation and protected sensitive flows.","TLS/protocol observations and exceptions.","passiveNetwork"),
    t("DATA-03","Review local storage protection","Check device, SD card, controller and gateway storage controls where accessible.","Storage location and protection evidence.","physicalTouch"),
    t("DATA-04","Review cloud and management storage","Assess client-controlled tenant retention, export and access restrictions.","Tenant configuration evidence.","appCloud"),
    t("DATA-05","Review secret exposure in logs and interfaces","Check application, device and support logs for tokens, passwords, keys and personal data.","Sanitized log samples and affected fields.","configReview"),
    t("DATA-06","Review privacy minimization and purpose","Compare collected video, audio, biometric and employee data with stated need.","Data-purpose gap list."),
    t("DATA-07","Review retention and deletion behavior","Validate configured retention, administrative deletion and downstream copies.","Policy-to-configuration comparison.","configReview"),
    t("DATA-08","Review event logging quality","Check authentication, configuration, update, reset, export and security events.","Event coverage matrix.","configReview"),
    t("DATA-09","Validate central monitoring integration","Generate approved benign events and confirm collection, timestamps and context.","SIEM correlation evidence.","safeValidation"),
    t("DATA-10","Review evidence and support-bundle exposure","Check diagnostic exports and vendor support packages for excess information.","Sanitized bundle review.","configReview")
  ]},
  {id:"APP",name:"Web, mobile, API & cloud ecosystem",description:"Assess the interfaces that control or receive data from devices.",tests:[
    t("APP-01","Map applications, APIs and tenant endpoints","Inventory portals, mobile apps, desktop clients, APIs, brokers and integrations.","Endpoint/component map.","appCloud"),
    t("APP-02","Test authentication and account recovery","Assess login, SSO, MFA, reset and invitation flows using test identities.","Flow results and security controls.","appCloud"),
    t("APP-03","Test session and token lifecycle","Review expiry, logout, refresh, revocation and secure storage.","Token/session observations.","appCloud"),
    t("APP-04","Test horizontal and vertical authorization","Validate user, site, device and administrative boundaries.","Role/object authorization matrix.","appCloud"),
    t("APP-05","Test device registration and ownership transfer","Assess claim, re-claim, invitation, deletion and reassignment flows.","Lifecycle flow results.","appCloud"),
    t("APP-06","Review mobile local storage and backups","Check client-owned test devices for exposed credentials, tokens and sensitive data.","Sanitized storage evidence.","appCloud"),
    t("APP-07","Review client-side trust and certificate validation","Assess whether the app validates the intended service and handles network errors safely.","Observed validation behavior.","appCloud"),
    t("APP-08","Test API input validation and business logic","Use safe test data to assess unexpected fields, state changes and workflow bypass.","Request/response evidence and impact.","appCloud"),
    t("APP-09","Review message broker authorization","Assess client-controlled MQTT or equivalent identities, topic rights and tenant separation.","Identity/topic permission matrix.","appCloud"),
    t("APP-10","Review secrets embedded in client applications","Determine whether exposed values grant unintended access or fleet-wide capability.","Secret purpose, scope and exploitability.","appCloud"),
    t("APP-11","Review third-party integrations and webhooks","Assess tokens, callback validation, least privilege and revocation.","Integration permission and secret lifecycle.","appCloud"),
    t("APP-12","Review cloud audit and administrative controls","Check privileged roles, alerts, exports, API keys and security configuration.","Tenant control review.","appCloud")
  ]},
  {id:"RAD",name:"Wireless & radio interfaces",description:"Assess discovery, pairing, message protection and radio trust within an approved area.",tests:[
    t("RAD-01","Inventory radio technologies and frequencies","Identify Wi-Fi, BLE, Zigbee/Thread, NFC/RFID, cellular, sub-GHz and proprietary links.","Radio/interface inventory linked to device models.","passiveRadio"),
    t("RAD-02","Map identifiers and information leakage","Observe broadcast names, addresses, service advertisements and implementation details.","Sanitized discovery evidence.","passiveRadio"),
    t("RAD-03","Review wireless network placement","Confirm IoT devices use intended SSIDs, authentication and network segments.","SSID/VLAN/device mapping.","configReview"),
    t("RAD-04","Review shared wireless credentials","Determine scope, rotation and blast radius of shared keys or enrollment material.","Credential model and affected population.","configReview"),
    t("RAD-05","Assess pairing and commissioning controls","Validate physical presence, user confirmation, authorization, time limits and error handling.","Pairing-flow observations.","activeRadio"),
    t("RAD-06","Assess re-pairing and ownership state","Check whether an already-owned or retired device can be claimed without proper release.","Controlled lifecycle result.","activeRadio"),
    t("RAD-07","Review wireless encryption and integrity","Assess protocol security mode, key establishment and protected sensitive messages.","Protocol configuration and capture analysis.","passiveRadio"),
    t("RAD-08","Test command and data authorization","Verify that connection or pairing alone does not grant unintended commands or records.","Authorized/unauthorized action matrix.","activeRadio"),
    t("RAD-09","Test replay and freshness controls","Within a bounded test setup, validate whether captured security-relevant messages are accepted again.","Controlled replay result and impact.","replay"),
    t("RAD-10","Review impersonation and identity binding","Assess whether devices, gateways or readers authenticate the intended peer.","Identity-binding and impersonation result.","replay"),
    t("RAD-11","Review protocol input handling","On a spare/recoverable unit, test selected malformed fields and state transitions.","Input set, observed behavior and recovery.","protocolFuzz"),
    t("RAD-12","Validate radio test containment","Confirm location, channel, power, target identifiers and stop conditions prevent third-party impact.","RF containment record and authorization.","activeRadio")
  ]},
  {id:"FW",name:"Firmware, software & update mechanism",description:"Analyze device software, dependencies, secrets, boot and update trust.",tests:[
    t("FW-01","Acquire authorized firmware package","Obtain vendor/client supplied update image and record provenance and hash.","Package source, version and cryptographic hash.","firmwarePackage","OWASP ISTG-FW"),
    t("FW-02","Identify format, architecture and filesystem","Determine package structure, processor architecture, OS/RTOS and embedded filesystems.","Extraction/identification notes.","firmwarePackage","OWASP ISTG-FW-INFO"),
    t("FW-03","Inventory software components and versions","Identify libraries, services, kernels, packages and third-party components.","Component/version list with confidence.","firmwarePackage","OWASP ISTG-FW-CONF"),
    t("FW-04","Assess known-vulnerability applicability","Research identified components and validate whether configurations or backports affect exposure.","Applicability analysis, not scanner output alone.","firmwarePackage","OWASP ISTG-FW-CONF-001"),
    t("FW-05","Identify unnecessary software and services","Compare included functionality with the device’s intended operation.","Unnecessary component list and attack surface.","firmwarePackage","OWASP ISTG-FW-CONF-002"),
    t("FW-06","Search for hardcoded and exposed secrets","Review credentials, private keys, certificates, tokens and provisioning material; establish actual authority.","Secret type, uniqueness, scope and validated impact.","firmwarePackage","OWASP ISTG-FW-SCRT"),
    t("FW-07","Review configurations and startup behavior","Inspect services, permissions, startup scripts, debug flags and default configuration.","Configuration findings and execution context.","firmwarePackage"),
    t("FW-08","Review binary hardening","Assess relevant binaries for available compiler and platform protections.","Binary sample and observed protections.","firmwarePackage","OWASP ISTG-FW-INFO-004"),
    t("FW-09","Review cryptographic implementation choices","Identify weak/deprecated algorithms, modes, key handling or custom cryptography.","Algorithm/use-case assessment.","firmwarePackage","OWASP ISTG-FW-CRYPT"),
    t("FW-10","Review update transport and authorization","Determine who may initiate updates and how packages are obtained.","Update flow and actor/permission model.","firmwarePackage","OWASP ISTG-FW[UPDT]"),
    t("FW-11","Validate update signature enforcement","On a recoverable unit, determine whether authenticity and integrity are enforced by the device.","Accepted/rejected controlled package result.","firmwareReflash","OWASP ISTG-FW[UPDT]-CRYPT"),
    t("FW-12","Review rollback protection","Assess whether an older vulnerable version can be installed where rollback should be prevented.","Version-policy and controlled result.","firmwareReflash","OWASP ISTG-FW[UPDT]-LOGIC-001"),
    t("FW-13","Review secure boot enforcement","Assess the chain of trust and whether unauthorized software is rejected at startup.","Boot-chain design and controlled evidence.","firmwareReflash","OWASP ISTG-FW[INST]-CRYPT-001"),
    t("FW-14","Assess extracted installed firmware","Compare device-extracted content with packages and check runtime data, overlays and per-device secrets.","Acquisition path, hash and differential findings.","firmwareExtraction")
  ]},
  {id:"HW",name:"Hardware & internal interfaces",description:"Inspect the physical attack surface on approved spare or expendable units.",tests:[
    t("HW-01","Document enclosure and tamper controls","Inspect access path, seals, fasteners and evidence of opening.","Photographs where permitted and tamper assessment.","physicalTouch"),
    t("HW-02","Create board and component map","Identify SoC/MCU, memory, secure element, radio, debug headers and buses.","Annotated board images and component references.","openEnclosure"),
    t("HW-03","Identify exposed physical ports","Review USB, SD, Ethernet, console, maintenance and expansion interfaces.","Port inventory and accessible functions.","physicalTouch","OWASP ISTG-PHY"),
    t("HW-04","Identify UART safely","Confirm ground and logic levels before capture; inspect boot/runtime output.","Pinout, voltage, baud and captured output summary.","uart","OWASP ISTG-INT[UART]"),
    t("HW-05","Review UART information disclosure","Check boot and runtime output for credentials, keys, addresses, configuration and implementation details.","Sanitized serial evidence and impact.","uart","OWASP ISTG-INT[UART]-INFO"),
    t("HW-06","Review serial console authentication","Assess whether UART exposes a console, boot interruption or privileged functions without intended controls.","Access state and capability evidence.","uart","OWASP ISTG-INT[UART]-AUTHZ"),
    t("HW-07","Identify JTAG/SWD and production state","Map test points and determine whether debug access is disabled, locked or authenticated.","Interface identification and access result.","jtag"),
    t("HW-08","Assess debug memory and execution access","On an authorized unit, determine whether debug permits reading memory or controlling execution.","Access level and protected-region result.","jtag"),
    t("HW-09","Review external memory protection","Identify SPI flash, EEPROM, eMMC or removable media and associated protection.","Memory map and protection controls.","firmwareExtraction","OWASP ISTG-MEM"),
    t("HW-10","Capture relevant internal bus communication","Where justified, observe I²C/SPI or related buses for sensitive data and trust assumptions.","Bus, signals and sanitized message analysis.","firmwareExtraction","OWASP ISTG-INT[I2C]"),
    t("HW-11","Attempt approved privileged device access","Use the least invasive authorized path to establish whether administrative/root access is possible.","Starting position, access gained and boundaries.","rootShell"),
    t("HW-12","Assess device cloning and secret uniqueness","Determine whether extracted identity material enables cloning or access to other units.","Controlled single-device/fleet impact analysis.","firmwareExtraction"),
    t("HW-13","Assess advanced physical resistance","Only in a specialist lab, evaluate approved fault, power or electromagnetic scenarios.","Lab plan, calibration, result and damage record.","sideChannel")
  ]},
  {id:"LIFE",name:"Lifecycle, resilience & physical operations",description:"Review deployment, reset, recovery, retirement and operational safety.",tests:[
    t("LIFE-01","Review secure installation and commissioning","Check initial passwords, certificates, network placement and installer access.","Commissioning procedure and sampled state."),
    t("LIFE-02","Review physical placement and cabinet protection","Identify reachable ports, reset controls, removable media and exposed network sockets.","Location-specific physical observations.","onsiteWalk"),
    t("LIFE-03","Review backup and recovery readiness","Confirm configuration backup, replacement stock, recovery time and responsible team.","Recovery procedure and evidence of validation."),
    t("LIFE-04","Test factory reset data removal","On an approved unit, verify local secrets, logs, user data and configuration are removed.","Before/after data and configuration comparison.","factoryReset"),
    t("LIFE-05","Test cloud unlink and ownership transfer","Verify previous accounts, tokens and sessions lose access after transfer or retirement.","Previous/new owner access result.","factoryReset"),
    t("LIFE-06","Review loss, theft and revocation response","Confirm device identities and access can be rapidly disabled.","Revocation workflow and responsibility."),
    t("LIFE-07","Review update and vulnerability SLAs","Check how advisories are triaged, tested, approved and deployed across sites.","Patch workflow and sampled timelines."),
    t("LIFE-08","Review secure disposal","Confirm storage destruction, reset, certificate revocation and inventory removal.","Disposal procedure and sampled record."),
    t("LIFE-09","Assess safe failure behavior","With explicit approval, observe recovery from selected dependency loss or restart scenarios.","Scenario, observed state and recovery time.","availability"),
    t("LIFE-10","Assess resource exhaustion and availability","Only in an isolated/recoverable environment, validate agreed availability hypotheses and stop thresholds.","Load profile, threshold, impact and recovery.","availability")
  ]},
  {id:"CLOSE",name:"Evidence, reporting & closure",description:"Make the engagement reproducible, useful and safely reversible.",tests:[
    t("CLOSE-01","Maintain timestamped activity log","Record source host, operator, target, technique, start/stop and notable changes.","Complete activity log."),
    t("CLOSE-02","Protect evidence and client secrets","Use approved encrypted storage, minimize data and follow photography/export restrictions.","Evidence register and handling record."),
    t("CLOSE-03","Record exact affected population","State model, revision, firmware, site, configuration and evidence confidence.","Affected-asset statement per finding."),
    t("CLOSE-04","Separate observed, verified and inferred issues","Document validation depth and avoid overstating version-only candidates.","Finding confidence and validation labels."),
    t("CLOSE-05","Link technical behavior to business impact","Describe realistic attacker position, prerequisites, consequence and blast radius.","Risk narrative and owner."),
    t("CLOSE-06","Restore changes and verify service health","Remove test accounts/artifacts, restore agreed settings and confirm operation with the client.","Change/cleanup log and client acknowledgment."),
    t("CLOSE-07","Deliver coverage and limitation matrix","List tested, passed, finding, N/A, not tested and out-of-scope items.","Coverage appendix with reasons."),
    t("CLOSE-08","Retest remediation and record residual risk","Repeat the minimum necessary evidence path and document remaining exposure.","Retest result and closure status.")
  ]}
];

const prerequisites = [
  {category:"Authorization",items:[
    {id:"auth-letter",name:"Signed authorization / Rules of Engagement",detail:"Legal entities, locations, dates, targets and permitted activities.",required:true},
    {id:"target-list",name:"Exact target list",detail:"IP ranges, device models, serials, tenants, apps, APIs and radio identifiers.",required:true},
    {id:"ownership",name:"Ownership and third-party authority confirmed",detail:"AMC, landlord, integrator and vendor-controlled components separated.",required:true},
    {id:"contacts",name:"Primary and backup escalation contacts",detail:"Reachable throughout the active test window.",required:true},
    {id:"window",name:"Testing window and blackout periods",detail:"Business-critical periods and change freezes recorded.",required:true}
  ]},
  {category:"Safety & recovery",items:[
    {id:"stop",name:"Stop conditions agreed",detail:"Unexpected outage, safety alarm, door-control effect, third-party traffic or data exposure.",required:true},
    {id:"backup",name:"Backup and recovery procedure verified",detail:"Named operator can restore configuration or replace a failed unit.",required:true,permission:"safeValidation"},
    {id:"spare",name:"Representative spare devices available",detail:"Prefer two identical units: reference and invasive target.",required:true,permission:"physicalTouch"},
    {id:"lab",name:"Isolated test network / RF area",detail:"Controlled addressing, logging and containment for active tests.",required:true,permission:"activeRadio"},
    {id:"safety-owner",name:"Facilities/safety owner present or on call",detail:"Required for access control, fire, HVAC, power or building systems.",required:true,permission:"physicalTouch"}
  ]},
  {category:"Technical inputs",items:[
    {id:"inventory",name:"Device inventory and versions",detail:"Make, model, hardware revision, firmware, quantity and location.",required:false},
    {id:"diagrams",name:"Architecture and data-flow diagrams",detail:"Networks, gateways, applications, cloud and vendor paths.",required:false},
    {id:"accounts",name:"Test accounts for each relevant role",detail:"Viewer, operator, admin, vendor, API and mobile identities.",required:true,permission:"appCloud"},
    {id:"firmware",name:"Firmware/update packages and release notes",detail:"Provenance and hashes recorded on receipt.",required:true,permission:"firmwarePackage"},
    {id:"documentation",name:"Configuration and recovery documentation",detail:"Secure baseline, update, reset and replacement procedures.",required:false}
  ]},
  {category:"Evidence & logistics",items:[
    {id:"evidence",name:"Evidence handling rules",detail:"Encryption, retention, screenshots/photos and personal-data minimization.",required:true},
    {id:"activity",name:"Activity logging template",detail:"Operator, target, technique, timestamps, changes and cleanup.",required:true},
    {id:"test-data",name:"Non-sensitive test data and identities",detail:"Avoid using real employee, client or financial information.",required:true,permission:"safeValidation"},
    {id:"access",name:"Site access, escort and workspace arranged",detail:"Badges, cabinet keys, power, network port and photography rules.",required:false},
    {id:"vendor",name:"Vendor support contact available",detail:"Useful for fragile, managed or safety-related equipment.",required:false}
  ]}
];

const onsiteSteps = [
  {title:"Kick-off and safety brief",description:"Reconfirm the day’s targets, permissions, change freeze, contacts and stop conditions.",items:["Record tester source addresses and equipment","Confirm prohibited systems and shared-building boundaries","Open an activity log before any observation","Verify recovery owner is reachable"]},
  {title:"Physical walkthrough",description:"Create a location-aware inventory with the system owners before interacting with equipment.",items:["Photograph labels only when permitted","Record model, revision, firmware and connectivity","Identify cabinets, exposed ports and reset controls","Mark devices whose interruption could affect safety or access"]},
  {title:"Passive baseline",description:"Understand normal behavior first so active results can be interpreted safely.",items:["Review DHCP, ARP, DNS, switch and controller records","Capture only approved segments and radio space","Map destinations, protocols and normal timing","Flag unknown devices and third-party communications"]},
  {title:"Controlled discovery",description:"Use rate-limited checks against the approved list and compare results with expectations.",items:["Start with a small representative sample","Identify services without aggressive scripts","Pause on latency, reboot or operational warnings","Keep source, target and timestamp evidence"]},
  {title:"Credentialed and ecosystem review",description:"Use supplied accounts to inspect configuration, roles, logs, apps, APIs and client-controlled cloud services.",items:["Avoid unnecessary production changes","Use test identities and test data","Record role and device ownership boundaries","Verify vendor remote-access paths"]},
  {title:"Radio or deep-device work",description:"Proceed only when the corresponding switches, environment and prerequisites are explicitly satisfied.",items:["Confirm RF containment and target identifiers","Move invasive work to spare units","Identify voltage and ground before connections","Hash acquired firmware and preserve provenance"]},
  {title:"Cleanup and health check",description:"Return the environment to the agreed state and have the client confirm service health.",items:["Remove test accounts, pairings, files and certificates","Restore changed configuration","Check critical device functions and monitoring","Provide a same-day change and exception list"]},
  {title:"Read-out and next actions",description:"Escalate critical issues promptly, then agree evidence needs, owners and retest expectations.",items:["Explain attacker position and business consequence","Separate confirmed findings from candidates","Assign IT, facilities, vendor or manufacturer owner","Capture untested areas and residual risk"]}
];

const kit = [
  {name:"Core field kit",detail:"Testing laptop, Ethernet/USB adapters, isolated router, approved Wi-Fi adapter, encrypted evidence storage."},
  {name:"Existing tools",detail:"Flipper Zero, Wi-Fi board, ESP32, Arduino and multimeter for supported protocols and controlled lab work."},
  {name:"Hardware basics",detail:"Selectable-level USB–TTL adapter, logic analyzer, fine probes/clips, ESD mat, magnification and opening tools."},
  {name:"Deep hardware",detail:"Debugger/programmer selected after identifying MCU, memory package, interface and logic voltage."},
  {name:"Radio-specific",detail:"Protocol sniffer or SDR selected only after Wi-Fi/BLE/Zigbee/NFC/sub-GHz requirements are known."},
  {name:"Safety & recovery",detail:"Spare device, known-good power supply, backups, labels and client recovery contact."}
];

const packages = [
  {number:"01",name:"Discovery & risk review",recommended:true,description:"Best first engagement when the device estate or ownership is unclear.",items:["Inventory reconciliation","Architecture and data-flow map","Exposure and support review","Prioritized next-step scope"]},
  {number:"02",name:"Enterprise IoT assessment",description:"Adds safe validation across deployed network, configuration, identity and connected applications.",items:["Segmentation testing","Configuration and account review","Web/mobile/API tenant testing","Controlled proof and retest"]},
  {number:"03",name:"Deep device assessment",description:"Selected high-risk models are tested in a lab with spare or expendable units.",items:["Radio protocol testing","Firmware acquisition and analysis","UART/JTAG/SWD review","Boot, update and secret testing"]}
];

const sources = [
  {name:"OWASP IoT Security Testing Guide",url:"https://owasp.org/www-project-iot-security-testing-guide/",note:"Device and attacker models; hierarchical tests for processors, memory, firmware, data exchange, internal, physical, wireless and user interfaces."},
  {name:"OWASP ISTG checklist repository",url:"https://github.com/OWASP/owasp-istg",note:"Reference test identifiers and completion-oriented checklist structure."},
  {name:"NIST IoT technical capabilities catalog",url:"https://pages.nist.gov/IoT-Device-Cybersecurity-Requirement-Catalogs/technical/",note:"Device identification, configuration, data protection, interface access, updates, security state and device security."},
  {name:"NIST IR 8259A",url:"https://csrc.nist.gov/pubs/ir/8259/a/final",note:"Core baseline and guidance to profile capabilities for a specific risk context."},
  {name:"ETSI EN 303 645",url:"https://www.etsi.org/deliver/etsi_en/303600_303699/303645/03.01.03_60/en_303645v030103p.pdf",note:"Baseline provisions covering credentials, vulnerability handling, updates, data, interfaces, integrity, telemetry and deletion."},
  {name:"Payatu IoT Security Assessment",url:"https://payatu.ai/iot-security-testing",note:"Public chip-to-cloud service approach spanning hardware, firmware, wireless, applications, APIs and update mechanisms."},
  {name:"Payatu IoT Security datasheet",url:"https://payatu.com/wp-content/uploads/2023/03/IoT-Security-Assessments-Datasheet.pdf",note:"Public scope, engagement attributes, reconnaissance, documentation, reporting and retest model."},
  {name:"Rapid7 IoT Security service brief",url:"https://www.rapid7.com/globalassets/_pdfs/product-and-service-briefs/rapid7-iot-security-service-brief.pdf",note:"Professional service coverage across mobile, cloud APIs, protocols, embedded hardware, firmware and updates."}
];

const allTests = testCategories.flatMap(category=>category.tests.map(test=>({...test,category:category.id,categoryName:category.name})));
const defaultPermissions = level => Object.fromEntries(permissions.map(p=>[p.id,p.manual?false:level>=p.min]));
const freshState = () => ({level:1,permissions:defaultPermissions(1),discovery:{},inventory:[],checklist:{},prerequisites:{},scopeText:"",pitchText:"",updatedAt:new Date().toISOString()});
let state = loadState();

function loadState(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(!saved) return freshState();
    const base=freshState();
    return {...base,...saved,permissions:{...base.permissions,...saved.permissions},discovery:saved.discovery||{},inventory:Array.isArray(saved.inventory)?saved.inventory:[],checklist:saved.checklist||{},prerequisites:saved.prerequisites||{}};
  }catch(error){return freshState()}
}
function saveState(){state.updatedAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));const label=document.getElementById("save-label");if(label){label.textContent="Saved locally";setTimeout(()=>label.textContent="Saved locally",600)}}
function esc(value=""){return String(value).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))}
function toast(message){const el=document.getElementById("toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2200)}
function download(name,content,type="application/json"){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function copyText(id){const el=document.getElementById(id);const text="value" in el?el.value:el.textContent;navigator.clipboard.writeText(text).then(()=>toast("Copied to clipboard")).catch(()=>toast("Copy failed — select the text manually"))}
function isPermissionOn(id){return Boolean(state.permissions[id])}
function testInScope(test){return isPermissionOn(test.permission)}
function testRecord(id){if(!state.checklist[id])state.checklist[id]={selected:true,status:"Not started",notes:"",evidence:""};return state.checklist[id]}
function applicablePrereqs(){return prerequisites.flatMap(group=>group.items).filter(item=>!item.permission||isPermissionOn(item.permission))}

function navigate(view){
  document.querySelectorAll(".view").forEach(el=>el.classList.toggle("active",el.id===`view-${view}`));
  document.querySelectorAll(".nav-item").forEach(el=>el.classList.toggle("active",el.dataset.view===view));
  document.getElementById("view-title").textContent=viewTitles[view];
  document.querySelector(".sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
  if(view==="checklist")renderChecklist();
}

function renderLevels(){
  const grid=document.getElementById("level-grid");
  grid.innerHTML=levels.map(level=>`<button class="level-card ${state.level===level.id?"active":""}" data-level="${level.id}"><span class="level-index">0${level.id}</span><h3>${level.title}</h3><p>${level.description}</p><small>${level.tag}</small></button>`).join("");
  document.getElementById("current-level-label").textContent=`Level ${state.level} · ${levels[state.level].name}`;
}
function renderPermissions(){
  document.getElementById("permission-grid").innerHTML=permissions.map(p=>`<label class="permission-item"><span class="switch"><input type="checkbox" data-permission="${p.id}" ${isPermissionOn(p.id)?"checked":""}><span></span></span><span><strong>${p.name}${p.manual?' <em class="required-mark">SPECIAL</em>':''}</strong><small>${p.description}</small></span></label>`).join("");
}
function buildScopeText(){
  const level=levels[state.level];
  const included=permissions.filter(p=>isPermissionOn(p.id)).map(p=>p.name);
  const excluded=permissions.filter(p=>!isPermissionOn(p.id)).map(p=>p.name);
  return `ENTERPRISE IoT SECURITY ASSESSMENT — PROPOSED SCOPE\n\nAssessment depth: Level ${level.id} — ${level.title}\n\nObjective\nAssess whether connected devices deployed in the AMC environment, and the systems that support them, can expose sensitive information, permit unauthorized control, or create a path into corporate or physical-security systems.\n\nIncluded activities\n${included.map(x=>`• ${x}`).join("\n")}\n\nExcluded or separately authorized activities\n${excluded.map(x=>`• ${x}`).join("\n")}\n\nOperating conditions\nTesting is limited to the written target list, locations, dates and identities in the Rules of Engagement. Potentially disruptive activity will use approved spare or recoverable units and agreed maintenance windows. Testing will stop on unexpected service degradation, safety impact, third-party traffic, out-of-scope access or exposure of live sensitive data. Third-party vendor infrastructure is excluded unless that party provides explicit authorization.\n\nDeliverables\nVerified asset and exposure observations; component and communication map; coverage matrix; risk-ranked findings with evidence, business impact and remediation ownership; cleanup record; and retest results where contracted.`;
}
function renderScopeOutput(){
  const included=permissions.filter(p=>isPermissionOn(p.id));
  const excluded=permissions.filter(p=>!isPermissionOn(p.id));
  document.getElementById("included-list").innerHTML=included.map(p=>`<li>${p.name}</li>`).join("");
  document.getElementById("excluded-list").innerHTML=excluded.map(p=>`<li>${p.name}</li>`).join("");
  if(!state.scopeText||state.scopeText.startsWith("ENTERPRISE IoT SECURITY ASSESSMENT")) state.scopeText=buildScopeText();
  document.getElementById("scope-text").value=state.scopeText;
  document.getElementById("dashboard-level").textContent=`Level ${state.level} · ${levels[state.level].title}`;
  document.getElementById("dashboard-touch").textContent=isPermissionOn("physicalTouch")?"Physical handling enabled":"No physical touch";
  const pct=Math.round(permissions.filter(p=>isPermissionOn(p.id)).length/permissions.length*100);
  document.getElementById("coverage-progress").style.width=`${pct}%`;
  document.getElementById("coverage-copy").textContent=`${permissions.filter(p=>isPermissionOn(p.id)).length} of ${permissions.length} technique groups are enabled. ${levels[state.level].summary}`;
  const key=["activeDiscovery","appCloud","activeRadio","openEnclosure","firmwareExtraction","rootShell"];
  document.getElementById("dashboard-boundaries").innerHTML=key.map(id=>{const p=permissions.find(x=>x.id===id);return `<div class="boundary-chip ${isPermissionOn(id)?"in":"out"}"><strong>${isPermissionOn(id)?"Included":"Excluded"}</strong>${p.name}</div>`}).join("");
}
function setLevel(level){
  state.level=level;state.permissions=defaultPermissions(level);state.scopeText="";
  allTests.forEach(test=>{const rec=testRecord(test.id);rec.selected=testInScope(test);if(!rec.selected&&rec.status==="Not started")rec.notes=""});
  saveState();renderAll();toast(`Scope changed to Level ${level}`);
}

function renderDiscovery(){
  const form=document.getElementById("discovery-form");
  form.innerHTML=discoverySections.map((section,index)=>`<section class="question-section"><button type="button" aria-expanded="true"><span><strong>${section.title}</strong><br><span>${section.hint}</span></span><span>−</span></button><div class="question-body">${section.fields.map(field=>renderDiscoveryField(field)).join("")}</div></section>`).join("");
  updateDiscoveryProgress();
}
function renderDiscoveryField(field){
  const value=state.discovery[field.id]??(field.type==="checks"?[]:"");
  let control="";
  if(field.type==="textarea")control=`<textarea data-discovery="${field.id}">${esc(value)}</textarea>`;
  else if(field.type==="select")control=`<select data-discovery="${field.id}"><option value="">Select…</option>${field.options.map(o=>`<option ${value===o?"selected":""}>${o}</option>`).join("")}</select>`;
  else if(field.type==="checks")control=`<div class="check-options">${field.options.map(o=>`<label><input type="checkbox" data-discovery-check="${field.id}" value="${esc(o)}" ${Array.isArray(value)&&value.includes(o)?"checked":""}>${o}</label>`).join("")}</div>`;
  else control=`<input type="${field.type}" data-discovery="${field.id}" value="${esc(value)}">`;
  return `<div class="question-field ${field.full?"full":""}"><label>${field.label}</label>${control}${field.help?`<small>${field.help}</small>`:""}</div>`;
}
function updateDiscoveryProgress(){
  const fields=discoverySections.flatMap(s=>s.fields);const done=fields.filter(f=>{const v=state.discovery[f.id];return Array.isArray(v)?v.length>0:Boolean(String(v||"").trim())}).length;
  document.getElementById("discovery-percent").textContent=`${Math.round(done/fields.length*100)}%`;
}

function blankAsset(){return {id:`IOT-${String(state.inventory.length+1).padStart(3,"0")}`,device:"",versions:"",location:"",connectivity:"",ecosystem:"",owner:"",criticality:"Medium",notes:""}}
function renderInventory(){
  const body=document.getElementById("inventory-body");
  body.innerHTML=state.inventory.map((a,i)=>`<tr data-asset-row="${i}"><td><input data-asset="id" value="${esc(a.id)}"></td><td><textarea data-asset="device" placeholder="Type · maker · model">${esc(a.device)}</textarea></td><td><textarea data-asset="versions" placeholder="HW rev · firmware">${esc(a.versions)}</textarea></td><td><textarea data-asset="location" placeholder="Site · room · VLAN/IP">${esc(a.location)}</textarea></td><td><textarea data-asset="connectivity" placeholder="Ethernet · Wi-Fi · BLE…">${esc(a.connectivity)}</textarea></td><td><textarea data-asset="ecosystem" placeholder="Cloud · app · API · gateway">${esc(a.ecosystem)}</textarea></td><td><textarea data-asset="owner" placeholder="Business · admin · vendor">${esc(a.owner)}</textarea></td><td><select data-asset="criticality">${["Low","Medium","High","Critical"].map(v=>`<option ${a.criticality===v?"selected":""}>${v}</option>`).join("")}</select></td><td><textarea data-asset="notes" placeholder="Support/EOL · data · recovery">${esc(a.notes)}</textarea></td><td><button class="icon-button" data-delete-asset="${i}" aria-label="Delete asset">×</button></td></tr>`).join("");
  document.getElementById("inventory-empty").style.display=state.inventory.length?"none":"block";
  document.querySelector(".table-wrap").style.display=state.inventory.length?"block":"none";
  document.getElementById("metric-assets").textContent=state.inventory.length;
}
function addAsset(seed=false){
  state.inventory.push(seed?{id:`IOT-${String(state.inventory.length+1).padStart(3,"0")}`,device:"IP Camera · Example vendor · Model X",versions:"HW rev A · FW 3.2.1",location:"Head Office · Floor 3 · IoT VLAN 120 · 10.20.x.x",connectivity:"Ethernet · RTSP · HTTPS · ONVIF",ecosystem:"NVR · web admin · vendor relay cloud",owner:"Facilities · IT Network · Integrator ABC",criticality:"High",notes:"Example only — replace with verified data · Support date unknown"}:blankAsset());saveState();renderInventory();toast("Asset row added")
}
function exportInventory(){
  const headers=["Asset ID","Device / model","HW / FW version","Location / network","Connectivity","Ecosystem","Owner / vendor","Criticality","Support / notes"];
  const keys=["id","device","versions","location","connectivity","ecosystem","owner","criticality","notes"];
  const quote=v=>`"${String(v||"").replace(/"/g,'""')}"`;
  const csv=[headers.map(quote).join(","),...state.inventory.map(a=>keys.map(k=>quote(a[k])).join(","))].join("\n");download("iot-asset-inventory.csv",csv,"text/csv");
}

function renderChecklist(){
  const categoryFilter=document.getElementById("category-filter");
  if(categoryFilter.options.length===1)testCategories.forEach(c=>categoryFilter.add(new Option(`${c.id} · ${c.name}`,c.id)));
  const search=document.getElementById("checklist-search").value.toLowerCase().trim();
  const category=categoryFilter.value;const status=document.getElementById("status-filter").value;const showOut=document.getElementById("show-out-scope").checked;
  const groups=testCategories.map(group=>{
    const visible=group.tests.filter(test=>{
      const rec=testRecord(test.id);const inScope=testInScope(test);
      const hay=`${test.id} ${test.name} ${test.method} ${test.evidence} ${group.name}`.toLowerCase();
      return (category==="all"||category===group.id)&&(status==="all"||rec.status===status)&&(!search||hay.includes(search))&&(showOut||inScope);
    });
    if(!visible.length)return "";
    const scoped=group.tests.filter(testInScope);const completed=scoped.filter(test=>["Pass","Finding","N/A"].includes(testRecord(test.id).status)).length;
    return `<section class="checklist-group"><button class="group-head" data-toggle-group="${group.id}"><span class="group-code">${group.id}</span><span><strong>${group.name}</strong><br><small>${group.description}</small></span><span class="group-progress">${completed}/${scoped.length} complete</span></button><div class="group-body" data-group-body="${group.id}">${visible.map(test=>renderTest(test)).join("")}</div></section>`;
  }).join("");
  document.getElementById("checklist-groups").innerHTML=groups||`<div class="empty-state"><strong>No matching tests</strong><p>Change the filter or display out-of-scope checks.</p></div>`;
  updateMetrics();
}
function renderTest(test){
  const rec=testRecord(test.id);const inScope=testInScope(test);const selected=inScope&&rec.selected;
  return `<div class="test-row ${inScope?"":"out-scope"}" data-test-row="${test.id}"><input class="test-select" type="checkbox" data-test-select="${test.id}" ${selected?"checked":""} ${inScope?"":"disabled"} aria-label="Select ${test.id}"><span class="test-id">${test.id}</span><div class="test-main"><strong>${test.name}</strong><small>${test.ref||test.categoryName}</small></div><select class="test-status status-${rec.status.replaceAll(" ","-")}" data-test-status="${test.id}" ${inScope?"":"disabled"}>${["Not started","In progress","Pass","Finding","N/A"].map(s=>`<option ${rec.status===s?"selected":""}>${s}</option>`).join("")}</select><span class="test-level">${inScope?permissions.find(p=>p.id===test.permission)?.name:"Out of scope"}</span><button class="detail-button" data-test-detail="${test.id}" aria-label="Show test detail">⌄</button><div class="test-detail"><div><label>Method / objective</label><p>${test.method}</p><label>Expected evidence</label><p>${test.evidence}</p></div><label>Assessor notes<textarea data-test-notes="${test.id}" placeholder="Observation, target, evidence reference and limitation…">${esc(rec.notes)}</textarea></label></div></div>`;
}
function updateMetrics(){
  const scoped=allTests.filter(testInScope);const selected=scoped.filter(test=>testRecord(test.id).selected);const completed=selected.filter(test=>["Pass","Finding","N/A"].includes(testRecord(test.id).status));const findings=selected.filter(test=>testRecord(test.id).status==="Finding");
  document.getElementById("metric-selected").textContent=selected.length;document.getElementById("metric-total").textContent=`of ${allTests.length} available`;
  document.getElementById("metric-complete").textContent=completed.length;document.getElementById("metric-findings").textContent=findings.length;
  document.getElementById("checklist-percent").textContent=`${selected.length?Math.round(completed.length/selected.length*100):0}%`;
}

function renderPrerequisites(){
  document.getElementById("prereq-grid").innerHTML=prerequisites.map(group=>{const items=group.items.filter(item=>!item.permission||isPermissionOn(item.permission));if(!items.length)return "";return `<section class="prereq-card"><h3>${group.category}</h3>${items.map(item=>`<label class="prereq-item"><input type="checkbox" data-prereq="${item.id}" ${state.prerequisites[item.id]?"checked":""}><span><strong>${item.name} ${item.required?'<span class="required-mark">REQUIRED</span>':''}</strong><small>${item.detail}</small></span></label>`).join("")}</section>`}).join("");
  const triggers=["Unexpected reboot, latency or loss of a production function","Any effect on doors, alarms, power, HVAC or life-safety systems","Traffic or identifiers belonging to an out-of-scope third party","Access to live financial, biometric or personal data beyond the approved proof","Evidence that an active technique is propagating beyond the target","Recovery contact becomes unavailable during a risky activity"];
  document.getElementById("stop-grid").innerHTML=triggers.map(x=>`<div>${x}</div>`).join("");updateReadiness();
}
function updateReadiness(){
  const applicable=applicablePrereqs();const checked=applicable.filter(i=>state.prerequisites[i.id]).length;const required=applicable.filter(i=>i.required);const ready=required.every(i=>state.prerequisites[i.id]);const pct=applicable.length?Math.round(checked/applicable.length*100):0;
  document.getElementById("readiness-percent").textContent=`${pct}%`;
  const banner=document.getElementById("gate-banner");banner.classList.toggle("ready",ready);banner.innerHTML=ready?`<span>READY</span><div><strong>Mandatory controls are satisfied</strong><p>Continue to monitor scope and stop conditions throughout testing.</p></div>`:`<span>HOLD</span><div><strong>${required.filter(i=>!state.prerequisites[i.id]).length} mandatory control(s) incomplete</strong><p>Resolve them before active testing.</p></div>`;
}

function renderOnsite(){
  document.getElementById("onsite-timeline").innerHTML=onsiteSteps.map((step,i)=>`<article class="timeline-step"><span>${String(i+1).padStart(2,"0")}</span><h3>${step.title}</h3><p>${step.description}</p><ul>${step.items.map(x=>`<li>${x}</li>`).join("")}</ul></article>`).join("");
  document.getElementById("kit-grid").innerHTML=kit.map(x=>`<div class="kit-item"><strong>${x.name}</strong><small>${x.detail}</small></div>`).join("");
}
function defaultLongPitch(){return `We propose an Enterprise IoT Security Assessment for connected devices operating across the AMC’s offices and supporting facilities. The assessment will determine what devices exist, whether unauthorized people can control them or access their data, and whether a compromised device can provide a path to confidential information, surveillance, physical-access systems or the corporate network.\n\nWe will begin with discovery and architecture mapping, then apply the agreed Level ${state.level} testing depth: ${levels[state.level].title}. The current scope includes ${permissions.filter(p=>isPermissionOn(p.id)).map(p=>p.name.toLowerCase()).join(", ")}.\n\nTesting will use representative devices and client-approved networks, identities, applications and tenants. Potentially disruptive or invasive techniques will only be performed when individually authorized, within an agreed maintenance window, and on spare or recoverable equipment. Third-party vendor infrastructure will remain excluded unless the relevant owner authorizes it.\n\nThe client will receive a verified inventory, ecosystem and communication map, coverage matrix, evidence-backed findings ranked by business impact, remediation ownership, a prioritized 30/60/90-day improvement plan and verification of agreed fixes.`}
function renderPitch(){
  const short="We assess the full connected-device chain—from the office network and device configuration to radio links, management applications and cloud services—to determine whether one weak device can expose sensitive AMC data, surveillance, physical access or corporate systems.";
  document.getElementById("short-pitch").textContent=short;
  if(!state.pitchText||state.pitchText.startsWith("We propose an Enterprise IoT"))state.pitchText=defaultLongPitch();document.getElementById("long-pitch").value=state.pitchText;
  document.getElementById("package-grid").innerHTML=packages.map(p=>`<article class="package-card ${p.recommended?"recommended":""}"><span class="package-number">${p.number}</span>${p.recommended?'<span class="badge">Recommended first</span>':''}<h3>${p.name}</h3><p>${p.description}</p><ul>${p.items.map(x=>`<li>${x}</li>`).join("")}</ul></article>`).join("");
  const items=["Executive summary|Business consequences, priority decisions and residual risk","Verified inventory|Models, revisions, firmware, location, ownership and support status","Architecture map|Devices, networks, apps, cloud, vendors and trust boundaries","Coverage matrix|Tested, pass, finding, N/A, not tested and out of scope","Technical findings|Evidence, prerequisites, impact, affected population and remediation","Segmentation analysis|Permitted paths, excessive reachability and target network design","Owner matrix|Remediation assigned to IT, facilities, vendor or manufacturer","30/60/90 plan|Sequenced containment, hardening and lifecycle improvements","Retest record|Verified fixes, open issues and accepted residual risk"];
  document.getElementById("deliverables-grid").innerHTML=items.map(x=>{const [a,b]=x.split("|");return `<div class="deliverable-item"><strong>${a}</strong><small>${b}</small></div>`}).join("");
}
function renderSources(){document.getElementById("source-list").innerHTML=sources.map(s=>`<div class="source-row"><strong>${s.name}</strong><p>${s.note}</p><a href="${s.url}" target="_blank" rel="noreferrer">Open source ↗</a></div>`).join("")}
function renderAll(){renderLevels();renderPermissions();renderScopeOutput();renderDiscovery();renderInventory();renderChecklist();renderPrerequisites();renderOnsite();renderPitch();renderSources();updateMetrics()}

document.addEventListener("click",event=>{
  const nav=event.target.closest("[data-view]");if(nav){navigate(nav.dataset.view);return}
  const jump=event.target.closest("[data-jump]");if(jump){navigate(jump.dataset.jump);return}
  if(event.target.closest("#menu-button")){document.querySelector(".sidebar").classList.toggle("open");return}
  const level=event.target.closest("[data-level]");if(level){setLevel(Number(level.dataset.level));return}
  const copy=event.target.closest("[data-copy]");if(copy){copyText(copy.dataset.copy);return}
  const sectionToggle=event.target.closest(".question-section>button");if(sectionToggle){const body=sectionToggle.nextElementSibling;const hidden=body.style.display==="none";body.style.display=hidden?"grid":"none";sectionToggle.lastElementChild.textContent=hidden?"−":"+";sectionToggle.setAttribute("aria-expanded",hidden);return}
  if(event.target.closest("#add-asset")||event.target.closest("[data-add-asset]")){addAsset();return}
  if(event.target.closest("#seed-inventory")){addAsset(true);return}
  const del=event.target.closest("[data-delete-asset]");if(del){state.inventory.splice(Number(del.dataset.deleteAsset),1);saveState();renderInventory();return}
  const detail=event.target.closest("[data-test-detail]");if(detail){document.querySelector(`[data-test-row="${detail.dataset.testDetail}"]`).classList.toggle("open");return}
  const group=event.target.closest("[data-toggle-group]");if(group){const body=document.querySelector(`[data-group-body="${group.dataset.toggleGroup}"]`);body.style.display=body.style.display==="none"?"block":"none";return}
  if(event.target.closest("#clear-filters")){document.getElementById("checklist-search").value="";document.getElementById("category-filter").value="all";document.getElementById("status-filter").value="all";document.getElementById("show-out-scope").checked=false;renderChecklist();return}
  if(event.target.closest("#inventory-csv")){exportInventory();return}
  if(event.target.closest("#print-button")){window.print();return}
  if(event.target.closest("#export-button")){download(`iot-assessment-workspace-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2));toast("Workspace exported");return}
  if(event.target.closest("#reset-all")){if(confirm("Reset the complete local assessment workspace? Export first if you need a backup.")){state=freshState();saveState();renderAll();navigate("dashboard");toast("Workspace reset")}return}
});

document.addEventListener("change",event=>{
  const permission=event.target.dataset.permission;if(permission){state.permissions[permission]=event.target.checked;state.scopeText="";allTests.filter(t=>t.permission===permission).forEach(t=>{testRecord(t.id).selected=event.target.checked});saveState();renderScopeOutput();renderChecklist();renderPrerequisites();renderPitch();return}
  const discovery=event.target.dataset.discovery;if(discovery){state.discovery[discovery]=event.target.value;saveState();updateDiscoveryProgress();return}
  const check=event.target.dataset.discoveryCheck;if(check){const selected=[...document.querySelectorAll(`[data-discovery-check="${check}"]:checked`)].map(x=>x.value);state.discovery[check]=selected;saveState();updateDiscoveryProgress();return}
  const assetField=event.target.dataset.asset;if(assetField){const row=Number(event.target.closest("[data-asset-row]").dataset.assetRow);state.inventory[row][assetField]=event.target.value;saveState();return}
  const selectId=event.target.dataset.testSelect;if(selectId){testRecord(selectId).selected=event.target.checked;saveState();updateMetrics();return}
  const statusId=event.target.dataset.testStatus;if(statusId){testRecord(statusId).status=event.target.value;saveState();renderChecklist();return}
  const prereq=event.target.dataset.prereq;if(prereq){state.prerequisites[prereq]=event.target.checked;saveState();updateReadiness();return}
  if(["category-filter","status-filter","show-out-scope"].includes(event.target.id)){renderChecklist();return}
  if(event.target.id==="import-file"){
    const file=event.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const imported=JSON.parse(reader.result);if(typeof imported!=="object"||!imported.permissions)throw new Error("Invalid");state={...freshState(),...imported};saveState();renderAll();toast("Workspace imported")}catch(error){toast("Could not import this file")}};reader.readAsText(file);
  }
});
document.addEventListener("input",event=>{
  if(event.target.id==="checklist-search"){renderChecklist();return}
  const notes=event.target.dataset.testNotes;if(notes){testRecord(notes).notes=event.target.value;saveState();return}
  if(event.target.id==="scope-text"){state.scopeText=event.target.value;saveState();return}
  if(event.target.id==="long-pitch"){state.pitchText=event.target.value;saveState();return}
});

renderAll();

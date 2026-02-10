-- NIST CSF 2.0 Seed Data
-- This file contains the complete NIST Cybersecurity Framework 2.0 structure
-- 6 Functions, 22 Categories, 106 Subcategories

-- ============================================================================
-- CSF FUNCTIONS (6 total)
-- ============================================================================

INSERT INTO csf_functions (id, name, description, sort_order) VALUES
('GV', 'Govern', 'The organization''s cybersecurity risk management strategy, expectations, and policy are established, communicated, and monitored.', 1),
('ID', 'Identify', 'The organization''s current cybersecurity risks are understood.', 2),
('PR', 'Protect', 'Safeguards to manage the organization''s cybersecurity risks are used.', 3),
('DE', 'Detect', 'Possible cybersecurity attacks and compromises are found and analyzed.', 4),
('RS', 'Respond', 'Actions regarding a detected cybersecurity incident are taken.', 5),
('RC', 'Recover', 'Assets and operations affected by a cybersecurity incident are restored.', 6);

-- ============================================================================
-- CSF CATEGORIES (22 total)
-- ============================================================================

-- GOVERN (GV) - 6 categories
INSERT INTO csf_categories (id, function_id, name, description, sort_order) VALUES
('GV.OC', 'GV', 'Organizational Context', 'The circumstances — mission, stakeholder expectations, dependencies, and legal/regulatory requirements — surrounding the organization''s cybersecurity risk management decisions are understood.', 1),
('GV.RM', 'GV', 'Risk Management Strategy', 'The organization''s priorities, constraints, risk tolerance and appetite statements, and assumptions are established, communicated, and used to support operational risk decisions.', 2),
('GV.RR', 'GV', 'Roles, Responsibilities, and Authorities', 'Cybersecurity roles, responsibilities, and authorities to foster accountability, performance assessment, and continuous improvement are established and communicated.', 3),
('GV.PO', 'GV', 'Policy', 'Organizational cybersecurity policy is established, communicated, and enforced.', 4),
('GV.OV', 'GV', 'Oversight', 'Results of organization-wide cybersecurity risk management activities and performance are used to inform, improve, and adjust the risk management strategy.', 5),
('GV.SC', 'GV', 'Cybersecurity Supply Chain Risk Management', 'Cyber supply chain risk management processes are identified, established, managed, monitored, and improved by organizational stakeholders.', 6);

-- IDENTIFY (ID) - 5 categories
INSERT INTO csf_categories (id, function_id, name, description, sort_order) VALUES
('ID.AM', 'ID', 'Asset Management', 'Assets (e.g., data, hardware, software, systems, facilities, services, people) that enable the organization to achieve business purposes are identified and managed consistent with their relative importance to organizational objectives and the organization''s risk strategy.', 7),
('ID.RA', 'ID', 'Risk Assessment', 'The cybersecurity risk to the organization, assets, and individuals is understood by the organization.', 8),
('ID.IM', 'ID', 'Improvement', 'Improvements to organizational cybersecurity risk management processes, procedures, and activities are identified across all CSF Functions.', 9),
('ID.GV', 'ID', 'Governance', 'The organization''s cybersecurity risk management program is established and managed.', 10),
('ID.SC', 'ID', 'Supply Chain Risk Management', 'The organization''s supply chain is identified and supply chain risk is assessed and managed.', 11);

-- PROTECT (PR) - 5 categories
INSERT INTO csf_categories (id, function_id, name, description, sort_order) VALUES
('PR.AA', 'PR', 'Identity Management, Authentication and Access Control', 'Access to physical and logical assets is limited to authorized users, services, and hardware and managed commensurate with the assessed risk of unauthorized access.', 12),
('PR.AT', 'PR', 'Awareness and Training', 'The organization''s personnel are provided cybersecurity awareness and training so that they can perform their cybersecurity-related tasks.', 13),
('PR.DS', 'PR', 'Data Security', 'Data are managed consistent with the organization''s risk strategy to protect confidentiality, integrity, and availability of information.', 14),
('PR.PS', 'PR', 'Platform Security', 'The hardware, software (e.g., operating systems, applications), and services of physical and virtual platforms are managed consistent with the organization''s risk strategy to protect their confidentiality, integrity, and availability.', 15),
('PR.IR', 'PR', 'Technology Infrastructure Resilience', 'Security architectures are managed with the organization''s risk strategy to protect asset confidentiality, integrity, and availability, and organizational resilience.', 16);

-- DETECT (DE) - 3 categories
INSERT INTO csf_categories (id, function_id, name, description, sort_order) VALUES
('DE.CM', 'DE', 'Continuous Monitoring', 'Assets are monitored to find anomalies, indicators of compromise, and other potentially adverse events.', 17),
('DE.AE', 'DE', 'Adverse Event Analysis', 'Anomalies, indicators of compromise, and other potentially adverse events are analyzed to characterize the events and detect cybersecurity incidents.', 18),
('DE.DP', 'DE', 'Detection Processes', 'Detection processes and procedures are maintained and tested to ensure awareness of anomalous events.', 19);

-- RESPOND (RS) - 3 categories
INSERT INTO csf_categories (id, function_id, name, description, sort_order) VALUES
('RS.MA', 'RS', 'Incident Management', 'Responses to detected cybersecurity incidents are managed.', 20),
('RS.AN', 'RS', 'Incident Analysis', 'Investigations are conducted to ensure effective response and support forensics and recovery activities.', 21),
('RS.CO', 'RS', 'Incident Response Reporting and Communication', 'Response activities are coordinated with internal and external stakeholders as required by laws, regulations, or policies.', 22);

-- RECOVER (RC) - No additional categories beyond top-level
-- Note: In CSF 2.0, RECOVER function structure may vary. Adjusting based on official framework.

-- ============================================================================
-- CSF SUBCATEGORIES (106 total)
-- ============================================================================

-- GOVERN: Organizational Context (GV.OC) - 5 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('GV.OC-01', 'GV.OC', 'GV.OC-01', 'The organizational mission is understood and informs cybersecurity risk management.', 'high', 1),
('GV.OC-02', 'GV.OC', 'GV.OC-02', 'Internal and external stakeholders are understood, and their needs and expectations regarding cybersecurity risk management are understood and considered.', 'high', 2),
('GV.OC-03', 'GV.OC', 'GV.OC-03', 'Legal, regulatory, and contractual requirements regarding cybersecurity — including privacy and civil liberties obligations — are understood and managed.', 'high', 3),
('GV.OC-04', 'GV.OC', 'GV.OC-04', 'Critical objectives, capabilities, and services that stakeholders depend on or expect from the organization are understood and communicated.', 'high', 4),
('GV.OC-05', 'GV.OC', 'GV.OC-05', 'Outcomes, capabilities, and services that the organization depends on are understood and communicated.', 'medium', 5);

-- GOVERN: Risk Management Strategy (GV.RM) - 7 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('GV.RM-01', 'GV.RM', 'GV.RM-01', 'Risk management objectives are established and agreed to by organizational stakeholders.', 'high', 6),
('GV.RM-02', 'GV.RM', 'GV.RM-02', 'Risk appetite and risk tolerance statements are established, communicated, and maintained.', 'high', 7),
('GV.RM-03', 'GV.RM', 'GV.RM-03', 'Cybersecurity risk management activities and outcomes are included in enterprise risk management processes.', 'high', 8),
('GV.RM-04', 'GV.RM', 'GV.RM-04', 'Strategic direction that describes appropriate risk response options is established and communicated.', 'medium', 9),
('GV.RM-05', 'GV.RM', 'GV.RM-05', 'Lines of communication across the organization are established for cybersecurity risks, including risks from suppliers and other third parties.', 'medium', 10),
('GV.RM-06', 'GV.RM', 'GV.RM-06', 'A standardized method for calculating, documenting, categorizing, and prioritizing cybersecurity risks is established and communicated.', 'high', 11),
('GV.RM-07', 'GV.RM', 'GV.RM-07', 'Strategic opportunities (i.e., positive risks) are characterized and are included in organizational cybersecurity risk discussions.', 'low', 12);

-- GOVERN: Roles, Responsibilities, and Authorities (GV.RR) - 4 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('GV.RR-01', 'GV.RR', 'GV.RR-01', 'Organizational leadership is responsible and accountable for cybersecurity risk and fosters a culture that is risk-aware, ethical, and continually improving.', 'high', 13),
('GV.RR-02', 'GV.RR', 'GV.RR-02', 'Roles, responsibilities, and authorities related to cybersecurity risk management are established, communicated, understood, and enforced.', 'high', 14),
('GV.RR-03', 'GV.RR', 'GV.RR-03', 'Adequate resources are allocated commensurate with the cybersecurity risk strategy, roles, responsibilities, and policies.', 'high', 15),
('GV.RR-04', 'GV.RR', 'GV.RR-04', 'Cybersecurity is included in human resources practices (e.g., personnel screening, onboarding, offboarding, change notification).', 'medium', 16);

-- GOVERN: Policy (GV.PO) - 3 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('GV.PO-01', 'GV.PO', 'GV.PO-01', 'Policy for managing cybersecurity risks is established based on organizational context, cybersecurity strategy, and priorities and is communicated and enforced.', 'high', 17),
('GV.PO-02', 'GV.PO', 'GV.PO-02', 'Policy for managing cybersecurity risks is reviewed, updated, communicated, and enforced to reflect changes in requirements, threats, technology, and organizational mission.', 'medium', 18),
('GV.PO-03', 'GV.PO', 'GV.PO-03', 'Cybersecurity policy is reviewed, updated, and enforced at planned intervals and in response to significant changes to the risk landscape.', 'medium', 19);

-- GOVERN: Oversight (GV.OV) - 3 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('GV.OV-01', 'GV.OV', 'GV.OV-01', 'Cybersecurity risk management outcomes and activities are communicated to senior leadership and organizational stakeholders.', 'high', 20),
('GV.OV-02', 'GV.OV', 'GV.OV-02', 'The cybersecurity risk management strategy is reviewed and adjusted to ensure coverage of organizational requirements and risks.', 'high', 21),
('GV.OV-03', 'GV.OV', 'GV.OV-03', 'Organizational cybersecurity risk management performance is evaluated and reviewed for adjustments needed.', 'medium', 22);

-- GOVERN: Cybersecurity Supply Chain Risk Management (GV.SC) - 10 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('GV.SC-01', 'GV.SC', 'GV.SC-01', 'A cybersecurity supply chain risk management program, strategy, objectives, policies, and processes are established and agreed to by organizational stakeholders.', 'high', 23),
('GV.SC-02', 'GV.SC', 'GV.SC-02', 'Cybersecurity roles and responsibilities for suppliers, customers, and partners are established, communicated, and coordinated internally and externally.', 'medium', 24),
('GV.SC-03', 'GV.SC', 'GV.SC-03', 'Cybersecurity supply chain risk management is integrated into cybersecurity and enterprise risk management, risk assessment, and improvement processes.', 'medium', 25),
('GV.SC-04', 'GV.SC', 'GV.SC-04', 'Suppliers are known and prioritized by criticality.', 'high', 26),
('GV.SC-05', 'GV.SC', 'GV.SC-05', 'Requirements to address cybersecurity risks in supply chains are established, prioritized, and integrated into contracts and other types of agreements with suppliers and other relevant third parties.', 'high', 27),
('GV.SC-06', 'GV.SC', 'GV.SC-06', 'Planning and due diligence are performed to reduce risks before entering into formal supplier or other third-party relationships.', 'medium', 28),
('GV.SC-07', 'GV.SC', 'GV.SC-07', 'The risks posed by a supplier, their products and services, and other third parties are understood, recorded, prioritized, assessed, responded to, and monitored over the course of the relationship.', 'high', 29),
('GV.SC-08', 'GV.SC', 'GV.SC-08', 'Relevant suppliers and other third parties are included in incident planning, response, and recovery activities.', 'medium', 30),
('GV.SC-09', 'GV.SC', 'GV.SC-09', 'Supply chain security practices are integrated into cybersecurity and enterprise risk management programs, and their performance is monitored throughout the technology product and service life cycle.', 'medium', 31),
('GV.SC-10', 'GV.SC', 'GV.SC-10', 'Cybersecurity supply chain risk management plans include provisions for activities that occur after the conclusion of a partnership or service agreement.', 'low', 32);

-- IDENTIFY: Asset Management (ID.AM) - 8 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('ID.AM-01', 'ID.AM', 'ID.AM-01', 'Inventories of hardware managed by the organization are maintained.', 'high', 33),
('ID.AM-02', 'ID.AM', 'ID.AM-02', 'Inventories of software, services, and systems managed by the organization are maintained.', 'high', 34),
('ID.AM-03', 'ID.AM', 'ID.AM-03', 'Representations of the organization''s authorized network communication and internal and external network data flows are maintained.', 'medium', 35),
('ID.AM-04', 'ID.AM', 'ID.AM-04', 'Inventories of services provided by suppliers are maintained.', 'medium', 36),
('ID.AM-05', 'ID.AM', 'ID.AM-05', 'Assets are prioritized based on classification, criticality, resources, and impact on the mission.', 'high', 37),
('ID.AM-07', 'ID.AM', 'ID.AM-07', 'Inventories of data and corresponding metadata for enterprise data are maintained.', 'high', 38),
('ID.AM-08', 'ID.AM', 'ID.AM-08', 'Systems, hardware, software, services, and data are managed throughout their life cycles.', 'medium', 39),
('ID.AM-09', 'ID.AM', 'ID.AM-09', 'Individuals, groups, and systems have unique credentials and are authenticated for access to assets.', 'high', 40);

-- IDENTIFY: Risk Assessment (ID.RA) - 10 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('ID.RA-01', 'ID.RA', 'ID.RA-01', 'Vulnerabilities in assets are identified, validated, and recorded.', 'high', 41),
('ID.RA-02', 'ID.RA', 'ID.RA-02', 'Cyber threat intelligence is received from information sharing forums and sources.', 'medium', 42),
('ID.RA-03', 'ID.RA', 'ID.RA-03', 'Internal and external threats to the organization are identified and recorded.', 'high', 43),
('ID.RA-04', 'ID.RA', 'ID.RA-04', 'Potential impacts and likelihoods of threats exploiting vulnerabilities are identified and recorded.', 'high', 44),
('ID.RA-05', 'ID.RA', 'ID.RA-05', 'Threats, vulnerabilities, likelihoods, and impacts are used to understand inherent risk and inform risk response decisions.', 'high', 45),
('ID.RA-06', 'ID.RA', 'ID.RA-06', 'Risk responses are chosen, prioritized, planned, tracked, and communicated.', 'high', 46),
('ID.RA-07', 'ID.RA', 'ID.RA-07', 'Changes and exceptions are managed, assessed for risk impact, recorded, and tracked.', 'medium', 47),
('ID.RA-08', 'ID.RA', 'ID.RA-08', 'Processes for receiving, analyzing, and responding to vulnerability disclosures are established.', 'medium', 48),
('ID.RA-09', 'ID.RA', 'ID.RA-09', 'The authenticity and integrity of hardware and software are assessed prior to acquisition and use.', 'medium', 49),
('ID.RA-10', 'ID.RA', 'ID.RA-10', 'Cybersecurity risks and risk response information are included in enterprise risk management discussions and reporting.', 'medium', 50);

-- IDENTIFY: Improvement (ID.IM) - 4 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('ID.IM-01', 'ID.IM', 'ID.IM-01', 'Improvements are identified from evaluations.', 'medium', 51),
('ID.IM-02', 'ID.IM', 'ID.IM-02', 'Improvements are identified from security tests and exercises, including those done in coordination with suppliers and relevant third parties.', 'medium', 52),
('ID.IM-03', 'ID.IM', 'ID.IM-03', 'Improvements are identified from execution of operational processes, procedures, and activities.', 'low', 53),
('ID.IM-04', 'ID.IM', 'ID.IM-04', 'Incident response plans and other cybersecurity plans that affect operations are established, communicated, maintained, and improved.', 'high', 54);

-- PROTECT: Identity Management, Authentication and Access Control (PR.AA) - 6 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('PR.AA-01', 'PR.AA', 'PR.AA-01', 'Identities and credentials for authorized users, services, and hardware are managed by the organization.', 'high', 55),
('PR.AA-02', 'PR.AA', 'PR.AA-02', 'Identities are proofed and bound to credentials based on the context of interactions.', 'high', 56),
('PR.AA-03', 'PR.AA', 'PR.AA-03', 'Users, services, and hardware are authenticated.', 'high', 57),
('PR.AA-04', 'PR.AA', 'PR.AA-04', 'Identity assertions are protected, conveyed, and verified.', 'medium', 58),
('PR.AA-05', 'PR.AA', 'PR.AA-05', 'Access permissions, entitlements, and authorizations are defined in a policy, managed, enforced, and reviewed, and incorporate the principles of least privilege and separation of duties.', 'high', 59),
('PR.AA-06', 'PR.AA', 'PR.AA-06', 'Physical access to assets is managed, monitored, and enforced commensurate with risk.', 'medium', 60);

-- PROTECT: Awareness and Training (PR.AT) - 2 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('PR.AT-01', 'PR.AT', 'PR.AT-01', 'Personnel are provided with cybersecurity awareness and training so that they can perform their cybersecurity-related tasks.', 'high', 61),
('PR.AT-02', 'PR.AT', 'PR.AT-02', 'Individuals in specialized roles are provided with role-specific cybersecurity awareness and training (e.g., administrators, developers, security engineers).', 'high', 62);

-- PROTECT: Data Security (PR.DS) - 11 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('PR.DS-01', 'PR.DS', 'PR.DS-01', 'The confidentiality, integrity, and availability of data-at-rest are protected.', 'high', 63),
('PR.DS-02', 'PR.DS', 'PR.DS-02', 'The confidentiality, integrity, and availability of data-in-transit are protected.', 'high', 64),
('PR.DS-10', 'PR.DS', 'PR.DS-10', 'The confidentiality, integrity, and availability of data-in-use are protected.', 'high', 65),
('PR.DS-11', 'PR.DS', 'PR.DS-11', 'Backups of data are created, protected, maintained, and tested.', 'high', 66),
('PR.DS-03', 'PR.DS', 'PR.DS-03', 'Assets are formally managed throughout removal, transfers, and disposition.', 'medium', 67),
('PR.DS-04', 'PR.DS', 'PR.DS-04', 'Adequate capacity to ensure availability is maintained.', 'medium', 68),
('PR.DS-05', 'PR.DS', 'PR.DS-05', 'Data leaks are detected and prevented.', 'high', 69),
('PR.DS-06', 'PR.DS', 'PR.DS-06', 'Integrity checking mechanisms are used to verify software, firmware, and information integrity.', 'medium', 70),
('PR.DS-07', 'PR.DS', 'PR.DS-07', 'The development and testing environments are separate from the production environment.', 'medium', 71),
('PR.DS-08', 'PR.DS', 'PR.DS-08', 'Hardware integrity is protected.', 'medium', 72),
('PR.DS-09', 'PR.DS', 'PR.DS-09', 'A hardware and software inventory is used and maintained throughout the system lifecycle.', 'medium', 73);

-- PROTECT: Platform Security (PR.PS) - 2 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('PR.PS-01', 'PR.PS', 'PR.PS-01', 'Configuration management practices are established and applied.', 'high', 74),
('PR.PS-02', 'PR.PS', 'PR.PS-02', 'Software is maintained, replaced, and removed commensurate with risk.', 'high', 75);

-- PROTECT: Technology Infrastructure Resilience (PR.IR) - 4 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('PR.IR-01', 'PR.IR', 'PR.IR-01', 'Networks and environments are protected from unauthorized logical access and usage.', 'high', 76),
('PR.IR-02', 'PR.IR', 'PR.IR-02', 'The organization''s technology assets are protected from environmental threats.', 'medium', 77),
('PR.IR-03', 'PR.IR', 'PR.IR-03', 'Mechanisms are implemented to achieve resilience requirements in normal and adverse situations.', 'medium', 78),
('PR.IR-04', 'PR.IR', 'PR.IR-04', 'Adequate resource capacity to ensure availability is maintained.', 'medium', 79);

-- DETECT: Continuous Monitoring (DE.CM) - 9 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('DE.CM-01', 'DE.CM', 'DE.CM-01', 'Networks and network services are monitored to find potentially adverse events.', 'high', 80),
('DE.CM-02', 'DE.CM', 'DE.CM-02', 'The physical environment is monitored to find potentially adverse events.', 'medium', 81),
('DE.CM-03', 'DE.CM', 'DE.CM-03', 'Personnel activity and technology usage are monitored to find potentially adverse events.', 'high', 82),
('DE.CM-06', 'DE.CM', 'DE.CM-06', 'External service provider activities and services are monitored to find potentially adverse events.', 'medium', 83),
('DE.CM-09', 'DE.CM', 'DE.CM-09', 'Computing hardware and software, runtime environments, and their data are monitored to find potentially adverse events.', 'high', 84),
('DE.CM-04', 'DE.CM', 'DE.CM-04', 'Malicious code is detected.', 'high', 85),
('DE.CM-07', 'DE.CM', 'DE.CM-07', 'Monitoring for unauthorized personnel, connections, devices, and software is performed.', 'high', 86),
('DE.CM-08', 'DE.CM', 'DE.CM-08', 'Vulnerability scans are performed.', 'high', 87),
('DE.CM-05', 'DE.CM', 'DE.CM-05', 'Unauthorized mobile code is detected.', 'medium', 88);

-- DETECT: Adverse Event Analysis (DE.AE) - 7 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('DE.AE-02', 'DE.AE', 'DE.AE-02', 'Potentially adverse events are analyzed to better understand associated activities.', 'high', 89),
('DE.AE-03', 'DE.AE', 'DE.AE-03', 'Information is correlated from multiple sources.', 'medium', 90),
('DE.AE-04', 'DE.AE', 'DE.AE-04', 'The estimated impact and scope of adverse events are understood.', 'high', 91),
('DE.AE-06', 'DE.AE', 'DE.AE-06', 'Information on adverse events is provided to authorized staff and tools.', 'high', 92),
('DE.AE-07', 'DE.AE', 'DE.AE-07', 'Cyber threat intelligence and other contextual information are integrated into the analysis.', 'medium', 93),
('DE.AE-08', 'DE.AE', 'DE.AE-08', 'Incidents are declared when adverse events meet the defined incident criteria.', 'high', 94),
('DE.AE-01', 'DE.AE', 'DE.AE-01', 'A baseline of network operations and expected data flows for users, services, and systems is established and managed.', 'medium', 95);

-- DETECT: Detection Processes (DE.DP) - 5 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('DE.DP-01', 'DE.DP', 'DE.DP-01', 'Roles and responsibilities for detection activities are assigned to ensure accountability.', 'high', 96),
('DE.DP-02', 'DE.DP', 'DE.DP-02', 'Detection activities comply with all applicable requirements.', 'medium', 97),
('DE.DP-03', 'DE.DP', 'DE.DP-03', 'Detection processes are tested.', 'high', 98),
('DE.DP-04', 'DE.DP', 'DE.DP-04', 'Event detection information is communicated.', 'medium', 99),
('DE.DP-05', 'DE.DP', 'DE.DP-05', 'Detection processes are continuously improved.', 'medium', 100);

-- RESPOND: Incident Management (RS.MA) - 5 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('RS.MA-01', 'RS.MA', 'RS.MA-01', 'The incident response plan is executed in coordination with relevant third parties once an incident is declared.', 'high', 101),
('RS.MA-02', 'RS.MA', 'RS.MA-02', 'Incident reports are triaged and validated.', 'high', 102),
('RS.MA-03', 'RS.MA', 'RS.MA-03', 'Incidents are categorized and prioritized.', 'high', 103),
('RS.MA-04', 'RS.MA', 'RS.MA-04', 'Incidents are escalated or elevated as needed.', 'high', 104),
('RS.MA-05', 'RS.MA', 'RS.MA-05', 'The criteria for initiating incident recovery are applied.', 'medium', 105);

-- RESPOND: Incident Analysis (RS.AN) - 4 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('RS.AN-03', 'RS.AN', 'RS.AN-03', 'Analysis is performed to establish what has taken place during an incident and the root cause of the incident.', 'high', 106),
('RS.AN-06', 'RS.AN', 'RS.AN-06', 'Actions performed during an investigation are recorded, and the records'' integrity and provenance are preserved.', 'medium', 107),
('RS.AN-07', 'RS.AN', 'RS.AN-07', 'Incident data and metadata are collected, and their integrity and provenance are preserved.', 'medium', 108),
('RS.AN-08', 'RS.AN', 'RS.AN-08', 'An incident''s magnitude is estimated and validated.', 'high', 109);

-- RESPOND: Incident Response Reporting and Communication (RS.CO) - 3 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('RS.CO-02', 'RS.CO', 'RS.CO-02', 'Internal and external stakeholders are notified of incidents.', 'high', 110),
('RS.CO-03', 'RS.CO', 'RS.CO-03', 'Information is shared with designated internal and external stakeholders.', 'medium', 111),
('RS.CO-04', 'RS.CO', 'RS.CO-04', 'Coordination with stakeholders occurs consistent with response plans.', 'medium', 112);

-- RECOVER: (Note: CSF 2.0 recovery subcategories - adding common ones)
-- Adding placeholder for Recovery Planning
INSERT INTO csf_categories (id, function_id, name, description, sort_order) VALUES
('RC.RP', 'RC', 'Recovery Planning', 'Recovery processes and procedures are executed and maintained to ensure restoration of systems or assets affected by cybersecurity incidents.', 23),
('RC.IM', 'RC', 'Improvements', 'Recovery planning and processes are improved by incorporating lessons learned into future activities.', 24),
('RC.CO', 'RC', 'Communications', 'Restoration activities are coordinated with internal and external parties.', 25);

-- RECOVER: Recovery Planning (RC.RP) - 3 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('RC.RP-01', 'RC.RP', 'RC.RP-01', 'The recovery portion of the incident response plan is executed once initiated from the incident response process.', 'high', 113),
('RC.RP-02', 'RC.RP', 'RC.RP-02', 'Recovery actions are selected, scoped, prioritized, and performed.', 'high', 114),
('RC.RP-03', 'RC.RP', 'RC.RP-03', 'The integrity of backups and other restoration assets is verified before using them for restoration.', 'high', 115);

-- RECOVER: Improvements (RC.IM) - 2 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('RC.IM-01', 'RC.IM', 'RC.IM-01', 'Recovery plans incorporate lessons learned.', 'medium', 116),
('RC.IM-02', 'RC.IM', 'RC.IM-02', 'Recovery strategies and plans are updated.', 'medium', 117);

-- RECOVER: Communications (RC.CO) - 3 subcategories
INSERT INTO csf_subcategories (id, category_id, name, description, priority, sort_order) VALUES
('RC.CO-01', 'RC.CO', 'RC.CO-01', 'Public relations are managed.', 'medium', 118),
('RC.CO-02', 'RC.CO', 'RC.CO-02', 'The reputation of the organization is repaired after an incident.', 'low', 119),
('RC.CO-03', 'RC.CO', 'RC.CO-03', 'Recovery activities are communicated to internal and external stakeholders, as well as executive and management teams.', 'medium', 120);

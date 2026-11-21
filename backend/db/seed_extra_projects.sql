-- NEXORA — Seed Data: EVC Electrics + Reliance Industries
-- Run AFTER seed.sql in the Supabase SQL Editor
-- Two additional showcase projects with realistic meeting histories,
-- decisions, tasks, and conflicts to demonstrate cross-meeting memory.

-- ═══════════════════════════════════════════════════════════════════
-- PROJECT 2: EVC Electrics — EV Charging Network Platform
-- ═══════════════════════════════════════════════════════════════════

-- Team Members (EVC-specific, no email clash with Alpha)
INSERT INTO users (id, email, name, role) VALUES
    ('00000000-0000-0000-0001-000000000001', 'vikram@evc.in',    'Vikram Mehta',    'admin'),
    ('00000000-0000-0000-0001-000000000002', 'divya@evc.in',     'Divya Kapoor',    'member'),
    ('00000000-0000-0000-0001-000000000003', 'rohan@evc.in',     'Rohan Das',       'member'),
    ('00000000-0000-0000-0001-000000000004', 'meera@evc.in',     'Meera Pillai',    'member'),
    ('00000000-0000-0000-0001-000000000005', 'karan@evc.in',     'Karan Joshi',     'member')
ON CONFLICT (email) DO NOTHING;

-- Project
INSERT INTO projects (id, name, description, status, health, completion_percentage, requirements, technology_stack, created_by) VALUES
(
    'aaaaaaaa-0000-0000-0001-000000000001',
    'EVC Electrics — Charging Network Platform',
    'Build a real-time EV charging station management platform with live occupancy tracking, payment processing, and driver mobile app.',
    'active',
    'on_track',
    58,
    'Real-time station occupancy via IoT sensors. Payment processing (Stripe). Driver mobile app (React Native). Fleet management dashboard. Uptime SLA 99.5%.',
    '["React Native", "Node.js", "PostgreSQL", "Redis", "Stripe", "MQTT", "AWS"]',
    '00000000-0000-0000-0001-000000000001'
)
ON CONFLICT DO NOTHING;

-- Project Members
INSERT INTO project_members (id, project_id, user_id, name, email, role) VALUES
    ('bbbbbbbb-0000-0000-0001-000000000001', 'aaaaaaaa-0000-0000-0001-000000000001', '00000000-0000-0000-0001-000000000001', 'Vikram Mehta',  'vikram@evc.in',  'pm'),
    ('bbbbbbbb-0000-0000-0001-000000000002', 'aaaaaaaa-0000-0000-0001-000000000001', '00000000-0000-0000-0001-000000000002', 'Divya Kapoor', 'divya@evc.in',  'developer'),
    ('bbbbbbbb-0000-0000-0001-000000000003', 'aaaaaaaa-0000-0000-0001-000000000001', '00000000-0000-0000-0001-000000000003', 'Rohan Das',    'rohan@evc.in',  'developer'),
    ('bbbbbbbb-0000-0000-0001-000000000004', 'aaaaaaaa-0000-0000-0001-000000000001', '00000000-0000-0000-0001-000000000004', 'Meera Pillai', 'meera@evc.in',  'designer'),
    ('bbbbbbbb-0000-0000-0001-000000000005', 'aaaaaaaa-0000-0000-0001-000000000001', '00000000-0000-0000-0001-000000000005', 'Karan Joshi',  'karan@evc.in',  'qa')
ON CONFLICT DO NOTHING;

-- ── EVC Meeting 1 — Project Kickoff ────────────────────────────────
INSERT INTO meetings (id, project_id, title, meeting_type, meeting_date, duration_mins, status, participants, transcript, summary) VALUES
(
    'cccccccc-0000-0000-0001-000000000001',
    'aaaaaaaa-0000-0000-0001-000000000001',
    'Project Kickoff — Architecture Decisions',
    'sprint_planning',
    '2024-11-04 09:00:00+00',
    55,
    'analyzed',
    '["Vikram Mehta", "Divya Kapoor", "Rohan Das", "Meera Pillai", "Karan Joshi"]',
    'Vikram: Welcome to the EVC platform kickoff. We have three months to deliver a working MVP. Let me walk through what we need to build: real-time station occupancy, driver app, payment processing, and fleet dashboard. Let''s start with the architecture decisions.

Rohan: I''ve been thinking about the backend. For real-time IoT data from the charging stations, we need something that can handle high throughput and low latency. I recommend using Firebase Realtime Database for the IoT data stream — it has built-in WebSocket support and scales well.

Divya: I agree with Rohan on the real-time requirement. Firebase sounds like a good fit. For the payment side, I suggest we use Razorpay — it''s well-supported in India and has a solid SDK.

Vikram: Okay. Firebase for the IoT data layer, Razorpay for payments. Rohan, you''ll own the backend?

Rohan: Yes. I can have the Firebase setup and basic station data pipeline done in two weeks.

Meera: I''ll handle the mobile app design and React Native implementation. I want to establish the design system this week so Divya can start the web dashboard in parallel.

Vikram: Good. Karan, QA planning?

Karan: I''ll set up the testing framework. For mobile I recommend Detox, for the API Supertest. I need the first API endpoints within two weeks to start integration tests.

Vikram: Agreed. So our decisions: Firebase for IoT backend, Razorpay for payments, Rohan leads backend, Meera leads mobile. Deadlines: basic station pipeline in two weeks, design system by Friday.',
    'Project kickoff established core architecture: Firebase Realtime Database for IoT data layer, Razorpay for payment processing. Rohan Das assigned as backend lead with two-week deadline for station data pipeline. Meera Pillai leading mobile app and design system. Divya Kapoor on web dashboard. Karan Joshi setting up testing framework. All team roles confirmed and initial deadlines set.'
)
ON CONFLICT DO NOTHING;

-- EVC Decisions Meeting 1
INSERT INTO decisions (id, project_id, meeting_id, title, description, category, status, evidence, confidence) VALUES
(
    'dddddddd-0000-0000-0001-000000000001',
    'aaaaaaaa-0000-0000-0001-000000000001',
    'cccccccc-0000-0000-0001-000000000001',
    'Firebase Realtime Database for IoT data layer',
    'Team decided to use Firebase for real-time station data due to built-in WebSocket support and scalability.',
    'technical',
    'approved',
    '[{"speaker": "Rohan Das", "quote": "I recommend using Firebase Realtime Database for the IoT data stream — it has built-in WebSocket support and scales well"}]',
    0.93
),
(
    'dddddddd-0000-0000-0001-000000000002',
    'aaaaaaaa-0000-0000-0001-000000000001',
    'cccccccc-0000-0000-0001-000000000001',
    'Razorpay selected for payment processing',
    'Razorpay chosen for Indian market support and solid SDK.',
    'technical',
    'approved',
    '[{"speaker": "Divya Kapoor", "quote": "I suggest we use Razorpay — it''s well-supported in India and has a solid SDK"}]',
    0.91
)
ON CONFLICT DO NOTHING;

-- EVC Tasks Meeting 1
INSERT INTO tasks (id, project_id, meeting_id, title, assigned_to_name, priority, status, due_date) VALUES
(
    'eeeeeeee-0000-0000-0001-000000000001',
    'aaaaaaaa-0000-0000-0001-000000000001',
    'cccccccc-0000-0000-0001-000000000001',
    'Set up Firebase and station data pipeline',
    'Rohan Das',
    'high',
    'completed',
    '2026-11-18'
),
(
    'eeeeeeee-0000-0000-0001-000000000002',
    'aaaaaaaa-0000-0000-0001-000000000001',
    'cccccccc-0000-0000-0001-000000000001',
    'Create mobile app design system',
    'Meera Pillai',
    'high',
    'completed',
    '2026-11-15'
)
ON CONFLICT DO NOTHING;

-- ── EVC Meeting 2 — Infrastructure Review ──────────────────────────
INSERT INTO meetings (id, project_id, title, meeting_type, meeting_date, duration_mins, status, participants, transcript, summary) VALUES
(
    'cccccccc-0000-0000-0001-000000000002',
    'aaaaaaaa-0000-0000-0001-000000000001',
    'Infrastructure & Payments Review',
    'technical_review',
    '2024-11-13 14:00:00+00',
    50,
    'analyzed',
    '["Vikram Mehta", "Divya Kapoor", "Rohan Das", "Karan Joshi"]',
    'Vikram: Two-week check on infrastructure. Rohan, Firebase setup done?

Rohan: Done and working. Station data is flowing. But I ran into a problem. Firebase has 1MB document size limits and when we start storing historical charging session data, we''ll hit it fast. Also the query capabilities are really limited — no complex filtering, no aggregations. For the fleet dashboard that Divya is building, we need proper SQL queries.

Divya: Yes, I''ve been trying to build the fleet dashboard and the Firebase query limitations are killing me. I can''t do things like "show all sessions above 50kWh" or aggregate by station. We need a proper database.

Rohan: I think we need to switch the persistent storage layer to PostgreSQL. Keep Firebase only for real-time event streaming, and sync important data to PostgreSQL within a few seconds. Best of both worlds.

Vikram: That''s a significant architecture change. What''s the impact?

Rohan: One week to set up PostgreSQL and build the sync pipeline. It''s worth it — the fleet dashboard will be much more powerful.

Vikram: Okay. We''re adding PostgreSQL as our persistent storage layer. Firebase stays for real-time events only. Rohan owns this. One week.

Divya: Also — payment issue. Razorpay''s international payments are more complex than we expected. Several of our fleet customers are based in UAE and Singapore. Razorpay only works for Indian cards without a lot of additional setup. I think we should switch to Stripe — it handles international payments natively.

Vikram: Stripe for payments. Divya, you own the payment integration now. How long?

Divya: About 5 days to swap out the SDK and update the checkout flows.

Vikram: Okay, so two new decisions: PostgreSQL added as persistent layer, Stripe replaces Razorpay. NEXORA will flag these as conflicts with our kickoff decisions.',
    'Infrastructure review surfaced two significant architecture changes. Firebase query limitations blocking fleet dashboard development — PostgreSQL added as persistent storage layer alongside Firebase (which stays for real-time events only). Rohan owns PostgreSQL setup, one-week deadline. Razorpay replaced by Stripe due to international payment requirements for UAE/Singapore fleet customers. Divya owns payment migration, 5-day deadline. NEXORA detected 2 conflicts with kickoff decisions.'
)
ON CONFLICT DO NOTHING;

-- EVC Decisions Meeting 2
INSERT INTO decisions (id, project_id, meeting_id, title, description, category, status, evidence, confidence) VALUES
(
    'dddddddd-0000-0000-0001-000000000003',
    'aaaaaaaa-0000-0000-0001-000000000001',
    'cccccccc-0000-0000-0001-000000000002',
    'Add PostgreSQL for persistent storage alongside Firebase',
    'Firebase kept for real-time events; PostgreSQL added for historical data and complex queries needed by fleet dashboard.',
    'architecture',
    'approved',
    '[{"speaker": "Rohan Das", "quote": "I think we need to switch the persistent storage layer to PostgreSQL. Keep Firebase only for real-time event streaming"}, {"speaker": "Vikram Mehta", "quote": "We''re adding PostgreSQL as our persistent storage layer"}]',
    0.96
),
(
    'dddddddd-0000-0000-0001-000000000004',
    'aaaaaaaa-0000-0000-0001-000000000001',
    'cccccccc-0000-0000-0001-000000000002',
    'Replace Razorpay with Stripe for international payments',
    'Stripe selected to handle UAE and Singapore fleet customers — Razorpay lacks adequate international support.',
    'technical',
    'approved',
    '[{"speaker": "Divya Kapoor", "quote": "I think we should switch to Stripe — it handles international payments natively"}, {"speaker": "Vikram Mehta", "quote": "Stripe for payments"}]',
    0.94
)
ON CONFLICT DO NOTHING;

-- EVC Conflicts
INSERT INTO conflicts (id, project_id, meeting_id, category, title, previous_state, new_state, evidence, severity, confidence, ai_explanation, recommendation, status) VALUES
(
    'ffffffff-0000-0000-0001-000000000001',
    'aaaaaaaa-0000-0000-0001-000000000001',
    'cccccccc-0000-0000-0001-000000000002',
    'technical_decision',
    'Backend storage changed: Firebase-only → Firebase + PostgreSQL',
    '{"description": "Firebase Realtime Database selected as the IoT data layer", "meeting": "Project Kickoff", "meeting_date": "2024-11-04"}',
    '{"description": "PostgreSQL added as persistent storage; Firebase kept for real-time events only", "meeting": "Infrastructure Review", "meeting_date": "2024-11-13"}',
    '[{"source": "historical", "speaker": "Rohan Das", "quote": "I recommend using Firebase Realtime Database for the IoT data stream"}, {"source": "new", "speaker": "Rohan Das", "quote": "I think we need to switch the persistent storage layer to PostgreSQL"}]',
    'medium',
    0.88,
    'Kickoff decided Firebase as the sole data layer. Infrastructure review found Firebase query limitations unworkable for fleet analytics and proposes adding PostgreSQL as persistent storage. This extends the original architecture rather than fully replacing it, but is a material change to the approved tech stack.',
    '{"action": "Approve hybrid architecture: Firebase for real-time events, PostgreSQL for persistent data", "reason": "Firebase query limitations confirmed by both Rohan and Divya through direct implementation experience.", "confidence": 0.9}',
    'resolved'
),
(
    'ffffffff-0000-0000-0001-000000000002',
    'aaaaaaaa-0000-0000-0001-000000000001',
    'cccccccc-0000-0000-0001-000000000002',
    'technical_decision',
    'Payment provider changed: Razorpay → Stripe',
    '{"description": "Razorpay selected for payment processing", "meeting": "Project Kickoff", "meeting_date": "2024-11-04"}',
    '{"description": "Stripe replaces Razorpay for international payment support", "meeting": "Infrastructure Review", "meeting_date": "2024-11-13"}',
    '[{"source": "historical", "speaker": "Divya Kapoor", "quote": "I suggest we use Razorpay"}, {"source": "new", "speaker": "Divya Kapoor", "quote": "I think we should switch to Stripe — it handles international payments natively"}]',
    'low',
    0.95,
    'Razorpay was selected at kickoff for Indian market support. Infrastructure review found it inadequate for international fleet customers in UAE and Singapore. Stripe replaces it. This is a direct contradiction of the kickoff decision and requires formal approval, but the reason is clear and unambiguous.',
    '{"action": "Approve Stripe as payment provider and supersede Razorpay decision", "reason": "International customer requirement not known at kickoff — legitimate change.", "confidence": 0.93}',
    'resolved'
)
ON CONFLICT DO NOTHING;

-- EVC Meeting 3 — Sprint 3 Review
INSERT INTO meetings (id, project_id, title, meeting_type, meeting_date, duration_mins, status, participants, transcript, summary) VALUES
(
    'cccccccc-0000-0000-0001-000000000003',
    'aaaaaaaa-0000-0000-0001-000000000001',
    'Sprint 3 Review — MVP Feature Complete',
    'retrospective',
    '2024-11-20 15:00:00+00',
    45,
    'analyzed',
    '["Vikram Mehta", "Divya Kapoor", "Rohan Das", "Meera Pillai", "Karan Joshi"]',
    'Vikram: Sprint 3 wrap. We''re at 58% overall. MVP features are defined — let''s check status.

Divya: Stripe integration is done. Payment flows are working for both Indian and international cards. I tested with UAE and Singapore test cards — all good.

Rohan: PostgreSQL sync pipeline is live. Firebase events are syncing within 2 seconds. Fleet dashboard queries are running fast. I added a caching layer with Redis for the frequently-accessed station data.

Meera: Mobile app is at 70%. Authentication, station map, and charging session screens are done. The payment screen is next. I''m targeting feature complete by end of next week.

Karan: 34 of 50 test cases passing. The failing ones are mostly around edge cases in the MQTT event handling. Rohan, I need your help on the IoT side this week.

Rohan: Sure. I''ll pair with you on the MQTT tests tomorrow.

Vikram: What''s the biggest remaining risk?

Meera: The payment screen in mobile is complex. It has to handle pending, success, failure, and timeout states for the charging session. I might need Divya''s help on the Stripe SDK integration in React Native.

Divya: I can support Meera. I''ve already done the web integration, React Native should be similar.

Vikram: Good. Target: mobile payment screen done by next Friday, full test coverage by following Friday, beta launch two weeks from today.',
    'Sprint 3 retrospective confirmed MVP progress at 58%. Stripe payment integration complete and tested internationally. PostgreSQL + Redis architecture live with sub-2s sync. Mobile app 70% complete — authentication, station map, and session screens done. 34/50 tests passing. Mobile payment screen identified as main risk — Divya supporting Meera on Stripe React Native integration. Beta launch target: two weeks out.'
)
ON CONFLICT DO NOTHING;

-- EVC Tasks (ongoing)
INSERT INTO tasks (id, project_id, meeting_id, title, assigned_to_name, priority, status, due_date) VALUES
(
    'eeeeeeee-0000-0000-0001-000000000003',
    'aaaaaaaa-0000-0000-0001-000000000001',
    'cccccccc-0000-0000-0001-000000000003',
    'Build mobile payment screen (charging session flow)',
    'Meera Pillai',
    'critical',
    'in_progress',
    '2026-12-05'
),
(
    'eeeeeeee-0000-0000-0001-000000000004',
    'aaaaaaaa-0000-0000-0001-000000000001',
    'cccccccc-0000-0000-0001-000000000003',
    'Fix MQTT edge case tests',
    'Karan Joshi',
    'high',
    'in_progress',
    '2026-11-29'
),
(
    'eeeeeeee-0000-0000-0001-000000000005',
    'aaaaaaaa-0000-0000-0001-000000000001',
    'cccccccc-0000-0000-0001-000000000003',
    'Beta launch preparation and staging deploy',
    'Rohan Das',
    'high',
    'todo',
    '2026-12-10'
)
ON CONFLICT DO NOTHING;

-- EVC Project State
INSERT INTO project_state (project_id, state_key, state_value, state_category, source_meeting_id) VALUES
(
    'aaaaaaaa-0000-0000-0001-000000000001',
    'realtime_data_layer',
    'Firebase Realtime Database',
    'technical',
    'cccccccc-0000-0000-0001-000000000001'
),
(
    'aaaaaaaa-0000-0000-0001-000000000001',
    'persistent_data_layer',
    'PostgreSQL + Redis cache',
    'technical',
    'cccccccc-0000-0000-0001-000000000002'
),
(
    'aaaaaaaa-0000-0000-0001-000000000001',
    'payment_provider',
    'Stripe',
    'technical',
    'cccccccc-0000-0000-0001-000000000002'
),
(
    'aaaaaaaa-0000-0000-0001-000000000001',
    'backend_lead',
    'Rohan Das',
    'personnel',
    'cccccccc-0000-0000-0001-000000000001'
),
(
    'aaaaaaaa-0000-0000-0001-000000000001',
    'mobile_app_lead',
    'Meera Pillai',
    'personnel',
    'cccccccc-0000-0000-0001-000000000001'
),
(
    'aaaaaaaa-0000-0000-0001-000000000001',
    'beta_launch_target',
    '2026-12-10',
    'timeline',
    'cccccccc-0000-0000-0001-000000000003'
)
ON CONFLICT (project_id, state_key) DO UPDATE SET
    state_value = EXCLUDED.state_value,
    source_meeting_id = EXCLUDED.source_meeting_id,
    updated_at = NOW();

-- EVC Activity Log
INSERT INTO activity_logs (project_id, meeting_id, actor_name, action, entity_type, summary) VALUES
    ('aaaaaaaa-0000-0000-0001-000000000001', 'cccccccc-0000-0000-0001-000000000001', 'Vikram Mehta', 'meeting_analyzed', 'meeting', 'Kickoff analyzed — Firebase and Razorpay decisions, roles assigned'),
    ('aaaaaaaa-0000-0000-0001-000000000001', 'cccccccc-0000-0000-0001-000000000002', 'Vikram Mehta', 'meeting_analyzed', 'meeting', 'Infrastructure review — 2 conflicts detected: storage and payment provider changes'),
    ('aaaaaaaa-0000-0000-0001-000000000001', 'cccccccc-0000-0000-0001-000000000002', 'Vikram Mehta', 'conflict_resolved', 'conflict', 'Firebase + PostgreSQL hybrid architecture approved'),
    ('aaaaaaaa-0000-0000-0001-000000000001', 'cccccccc-0000-0000-0001-000000000002', 'Vikram Mehta', 'conflict_resolved', 'conflict', 'Stripe replaces Razorpay — international payment requirement confirmed'),
    ('aaaaaaaa-0000-0000-0001-000000000001', 'cccccccc-0000-0000-0001-000000000003', 'Vikram Mehta', 'meeting_analyzed', 'meeting', 'Sprint 3 review — 58% complete, mobile payment screen is main risk');


-- ═══════════════════════════════════════════════════════════════════
-- PROJECT 3: Reliance Industries — Internal HR Analytics Platform
-- ═══════════════════════════════════════════════════════════════════

-- Team Members
INSERT INTO users (id, email, name, role) VALUES
    ('00000000-0000-0000-0002-000000000001', 'anjali@ril.com',   'Anjali Bose',     'admin'),
    ('00000000-0000-0000-0002-000000000002', 'suresh@ril.com',   'Suresh Kulkarni', 'member'),
    ('00000000-0000-0000-0002-000000000003', 'nisha@ril.com',    'Nisha Agarwal',   'member'),
    ('00000000-0000-0000-0002-000000000004', 'deepak@ril.com',   'Deepak Reddy',    'member'),
    ('00000000-0000-0000-0002-000000000005', 'pooja@ril.com',    'Pooja Iyer',      'member'),
    ('00000000-0000-0000-0002-000000000006', 'sameer@ril.com',   'Sameer Khan',     'member')
ON CONFLICT (email) DO NOTHING;

-- Project
INSERT INTO projects (id, name, description, status, health, completion_percentage, requirements, technology_stack, created_by) VALUES
(
    'aaaaaaaa-0000-0000-0002-000000000001',
    'Reliance Industries — HR Analytics Platform',
    'Internal platform to aggregate HR data across 50,000+ employees, provide attrition prediction, workforce planning dashboards, and automated payroll anomaly detection.',
    'active',
    'at_risk',
    42,
    'Real-time HR data from 12 source systems. ML-based attrition prediction (target: 85% accuracy). Payroll anomaly alerts. Executive dashboard. Full audit trail for compliance. Data residency: India only.',
    '["Python", "FastAPI", "Apache Spark", "PostgreSQL", "Power BI", "scikit-learn", "Azure"]',
    '00000000-0000-0000-0002-000000000001'
)
ON CONFLICT DO NOTHING;

-- Project Members
INSERT INTO project_members (id, project_id, user_id, name, email, role) VALUES
    ('bbbbbbbb-0000-0000-0002-000000000001', 'aaaaaaaa-0000-0000-0002-000000000001', '00000000-0000-0000-0002-000000000001', 'Anjali Bose',      'anjali@ril.com',  'pm'),
    ('bbbbbbbb-0000-0000-0002-000000000002', 'aaaaaaaa-0000-0000-0002-000000000001', '00000000-0000-0000-0002-000000000002', 'Suresh Kulkarni', 'suresh@ril.com', 'developer'),
    ('bbbbbbbb-0000-0000-0002-000000000003', 'aaaaaaaa-0000-0000-0002-000000000001', '00000000-0000-0000-0002-000000000003', 'Nisha Agarwal',   'nisha@ril.com',  'data_engineer'),
    ('bbbbbbbb-0000-0000-0002-000000000004', 'aaaaaaaa-0000-0000-0002-000000000001', '00000000-0000-0000-0002-000000000004', 'Deepak Reddy',    'deepak@ril.com', 'ml_engineer'),
    ('bbbbbbbb-0000-0000-0002-000000000005', 'aaaaaaaa-0000-0000-0002-000000000001', '00000000-0000-0000-0002-000000000005', 'Pooja Iyer',      'pooja@ril.com',  'analyst'),
    ('bbbbbbbb-0000-0000-0002-000000000006', 'aaaaaaaa-0000-0000-0002-000000000001', '00000000-0000-0000-0002-000000000006', 'Sameer Khan',     'sameer@ril.com', 'qa')
ON CONFLICT DO NOTHING;

-- ── Reliance Meeting 1 — Discovery & Architecture ───────────────────
INSERT INTO meetings (id, project_id, title, meeting_type, meeting_date, duration_mins, status, participants, transcript, summary) VALUES
(
    'cccccccc-0000-0000-0002-000000000001',
    'aaaaaaaa-0000-0000-0002-000000000001',
    'Discovery & Architecture Planning',
    'sprint_planning',
    '2024-11-01 10:00:00+00',
    70,
    'analyzed',
    '["Anjali Bose", "Suresh Kulkarni", "Nisha Agarwal", "Deepak Reddy", "Pooja Iyer", "Sameer Khan"]',
    'Anjali: Welcome everyone. This project is critical — the CHRO wants HR analytics live by Q1. We''re dealing with 50,000 employees across 12 source systems. Let''s agree on architecture today.

Suresh: For the data ingestion layer I recommend Apache Kafka. We need to handle real-time data from 12 systems — SAP HR, Workday, local payroll systems. Kafka handles high throughput and we can replay events if needed.

Nisha: Agreed on Kafka. For storage, I suggest we use a data lake on Azure Data Lake Storage Gen2 — it''s cost-effective for the volume we''re dealing with and integrates well with Spark for processing.

Deepak: For the ML model, I''ve done analysis on the available features. We have good predictors for attrition: tenure, performance ratings, manager tenure, leave patterns. I think we can hit 85% accuracy with a gradient boosting model. I''ll start with XGBoost.

Pooja: For the dashboards, management has asked for Power BI. It''s the company standard and the CHRO''s team is already using it. We should use Power BI for all the executive views.

Anjali: Okay. So: Kafka for ingestion, Azure Data Lake for storage, XGBoost for ML, Power BI for dashboards. Suresh, you own data infrastructure. Nisha, you own the data pipeline. Deepak, ML model. Pooja, dashboards. First milestone: data ingestion pipeline live in 3 weeks.

Sameer: I''ll need API contracts by end of week 2 to start QA planning.

Anjali: Noted. Let''s make sure the team delivers API specs to Sameer by November 15th.',
    'Architecture decisions finalized for Reliance HR Analytics Platform. Apache Kafka selected for data ingestion from 12 source systems. Azure Data Lake Storage Gen2 for data storage. XGBoost gradient boosting for attrition prediction ML model (85% accuracy target). Power BI for executive dashboards. Roles assigned: Suresh (data infrastructure), Nisha (data pipeline), Deepak (ML), Pooja (dashboards). First milestone: ingestion pipeline live in 3 weeks.'
)
ON CONFLICT DO NOTHING;

-- Reliance Decisions Meeting 1
INSERT INTO decisions (id, project_id, meeting_id, title, description, category, status, evidence, confidence) VALUES
(
    'dddddddd-0000-0000-0002-000000000001',
    'aaaaaaaa-0000-0000-0002-000000000001',
    'cccccccc-0000-0000-0002-000000000001',
    'Apache Kafka for data ingestion layer',
    'Kafka selected to handle real-time event streaming from 12 HR source systems.',
    'architecture',
    'approved',
    '[{"speaker": "Suresh Kulkarni", "quote": "For the data ingestion layer I recommend Apache Kafka. We need to handle real-time data from 12 systems"}, {"speaker": "Anjali Bose", "quote": "Kafka for ingestion"}]',
    0.97
),
(
    'dddddddd-0000-0000-0002-000000000002',
    'aaaaaaaa-0000-0000-0002-000000000001',
    'cccccccc-0000-0000-0002-000000000001',
    'Azure Data Lake Storage Gen2 for data storage',
    'Azure ADLS Gen2 selected for cost-effective storage of large HR dataset with Spark integration.',
    'architecture',
    'approved',
    '[{"speaker": "Nisha Agarwal", "quote": "I suggest we use a data lake on Azure Data Lake Storage Gen2 — it''s cost-effective for the volume and integrates well with Spark"}, {"speaker": "Anjali Bose", "quote": "Azure Data Lake for storage"}]',
    0.94
),
(
    'dddddddd-0000-0000-0002-000000000003',
    'aaaaaaaa-0000-0000-0002-000000000001',
    'cccccccc-0000-0000-0002-000000000001',
    'XGBoost gradient boosting for attrition prediction model',
    'XGBoost selected with target 85% accuracy using tenure, performance, manager, and leave pattern features.',
    'technical',
    'approved',
    '[{"speaker": "Deepak Reddy", "quote": "I think we can hit 85% accuracy with a gradient boosting model. I''ll start with XGBoost"}]',
    0.9
)
ON CONFLICT DO NOTHING;

-- Reliance Tasks Meeting 1
INSERT INTO tasks (id, project_id, meeting_id, title, assigned_to_name, priority, status, due_date) VALUES
(
    'eeeeeeee-0000-0000-0002-000000000001',
    'aaaaaaaa-0000-0000-0002-000000000001',
    'cccccccc-0000-0000-0002-000000000001',
    'Set up Kafka cluster and 12-system ingestion connectors',
    'Suresh Kulkarni',
    'critical',
    'completed',
    '2026-11-22'
),
(
    'eeeeeeee-0000-0000-0002-000000000002',
    'aaaaaaaa-0000-0000-0002-000000000001',
    'cccccccc-0000-0000-0002-000000000001',
    'Design Azure Data Lake schema and Spark pipeline',
    'Nisha Agarwal',
    'high',
    'in_progress',
    '2026-11-29'
),
(
    'eeeeeeee-0000-0000-0002-000000000003',
    'aaaaaaaa-0000-0000-0002-000000000001',
    'cccccccc-0000-0000-0002-000000000001',
    'Train initial XGBoost model on historical attrition data',
    'Deepak Reddy',
    'high',
    'in_progress',
    '2026-12-06'
)
ON CONFLICT DO NOTHING;

-- ── Reliance Meeting 2 — ML Accuracy Review ─────────────────────────
INSERT INTO meetings (id, project_id, title, meeting_type, meeting_date, duration_mins, status, participants, transcript, summary) VALUES
(
    'cccccccc-0000-0000-0002-000000000002',
    'aaaaaaaa-0000-0000-0002-000000000001',
    'ML Model Review — Accuracy Concerns',
    'technical_review',
    '2024-11-15 14:00:00+00',
    55,
    'analyzed',
    '["Anjali Bose", "Suresh Kulkarni", "Nisha Agarwal", "Deepak Reddy", "Pooja Iyer"]',
    'Anjali: Mid-sprint ML check. Deepak, XGBoost training results?

Deepak: I have results but they''re not what we hoped. On the historical dataset I''m getting 76% accuracy — well below our 85% target. I''ve done extensive feature engineering and hyperparameter tuning. The fundamental issue is our dataset is imbalanced: only 8% of employees left in the training period. XGBoost is struggling with the class imbalance.

Anjali: What are the options?

Deepak: There are two paths. Option 1: keep XGBoost but apply SMOTE oversampling and class weighting — might get to 80-82%, probably not 85%. Option 2: switch to a neural network approach using PyTorch — specifically a transformer-based model that can handle the sequential nature of the HR data better. I think this can hit 87-88% but it''s a 3-week build, not 1 week.

Anjali: The CHRO specifically asked for 85%. We need to meet that target.

Suresh: What about interpretability? The CHRO''s team will want to understand why someone is flagged as attrition risk. Neural networks are black boxes.

Deepak: Good point. I can add SHAP explanations to either model. It''s more work with the neural network but it''s doable.

Nisha: Data pipeline is contributing too — I''ve noticed some of the SAP HR connector data has quality issues. If we can clean the input data better, the accuracy should improve regardless of which model.

Anjali: Okay. This is a hard call. We''re switching the ML model to PyTorch transformer. 85% is non-negotiable. Deepak, timeline?

Deepak: If Nisha can fix the data quality issues by next Wednesday, I can have the PyTorch model training done by November 29th. First results available December 1st.

Anjali: Deepak owns the ML model change. Nisha, data quality by Wednesday is a hard deadline.',
    'ML review revealed XGBoost reaching only 76% accuracy vs 85% target due to class imbalance (8% attrition rate). Decision made to switch from XGBoost to PyTorch transformer model — better suited for sequential HR data patterns and expected to reach 87-88% accuracy. NEXORA detected conflict with original XGBoost decision. Nisha''s data quality improvements required by Wednesday to unblock model training. Deepak targeting initial PyTorch results by December 1st.'
)
ON CONFLICT DO NOTHING;

-- Reliance Decisions Meeting 2
INSERT INTO decisions (id, project_id, meeting_id, title, description, category, status, evidence, confidence) VALUES
(
    'dddddddd-0000-0000-0002-000000000004',
    'aaaaaaaa-0000-0000-0002-000000000001',
    'cccccccc-0000-0000-0002-000000000002',
    'Switch from XGBoost to PyTorch transformer for attrition model',
    'XGBoost only reached 76% accuracy. PyTorch transformer selected to meet 85% accuracy target — expected 87-88%.',
    'technical',
    'proposed',
    '[{"speaker": "Anjali Bose", "quote": "We''re switching the ML model to PyTorch transformer. 85% is non-negotiable."}, {"speaker": "Deepak Reddy", "quote": "Option 2: switch to a neural network approach using PyTorch — transformer-based model... I think this can hit 87-88%"}]',
    0.95
)
ON CONFLICT DO NOTHING;

-- Reliance Conflict — ML model change
INSERT INTO conflicts (id, project_id, meeting_id, category, title, previous_state, new_state, evidence, severity, confidence, ai_explanation, recommendation, status) VALUES
(
    'ffffffff-0000-0000-0002-000000000001',
    'aaaaaaaa-0000-0000-0002-000000000001',
    'cccccccc-0000-0000-0002-000000000002',
    'technical_decision',
    'ML model changed: XGBoost → PyTorch Transformer',
    '{"description": "XGBoost gradient boosting selected for attrition prediction", "meeting": "Discovery & Architecture Planning", "accuracy_target": "85%", "meeting_date": "2024-11-01"}',
    '{"description": "PyTorch transformer proposed to replace XGBoost due to accuracy shortfall", "meeting": "ML Model Review", "current_xgboost_accuracy": "76%", "expected_accuracy": "87-88%", "meeting_date": "2024-11-15"}',
    '[{"source": "historical", "speaker": "Deepak Reddy", "quote": "I''ll start with XGBoost"}, {"source": "new", "speaker": "Anjali Bose", "quote": "We''re switching the ML model to PyTorch transformer. 85% is non-negotiable."}, {"source": "new", "speaker": "Deepak Reddy", "quote": "XGBoost is struggling with the class imbalance"}]',
    'high',
    0.96,
    'The original architecture decision specified XGBoost as the attrition prediction model. The ML review showed it only achieves 76% accuracy — 9 points below the 85% non-negotiable target. The team proposes switching to a PyTorch transformer model (expected 87-88% accuracy) at the cost of 3 additional weeks of development time. This is a direct contradiction of the original technical decision and the core ML component of the platform.',
    '{"action": "Approve PyTorch transformer replacement for XGBoost", "reason": "Accuracy target is a hard business requirement. 76% is unacceptable for HR attrition decisions at this scale. 3-week delay is justified.", "alternatives": ["Optimize XGBoost with SMOTE (may reach 80-82%)", "Hybrid approach: XGBoost for initial release, PyTorch in v2"], "confidence": 0.91}',
    'open'
)
ON CONFLICT DO NOTHING;

-- Reliance Meeting 3 — Data & Dashboard Review
INSERT INTO meetings (id, project_id, title, meeting_type, meeting_date, duration_mins, status, participants, transcript, summary) VALUES
(
    'cccccccc-0000-0000-0002-000000000003',
    'aaaaaaaa-0000-0000-0002-000000000001',
    'Data Pipeline & Dashboard Review',
    'technical_review',
    '2024-11-19 11:00:00+00',
    50,
    'analyzed',
    '["Anjali Bose", "Nisha Agarwal", "Deepak Reddy", "Pooja Iyer", "Sameer Khan"]',
    'Anjali: Data and dashboard review. Nisha, data quality status?

Nisha: SAP HR connector issues resolved. 11 out of 12 source systems are flowing cleanly. The 12th system — legacy payroll from one of the subsidiary offices — has schema inconsistencies. I''ve built a transformation layer to normalize it. 97.3% data completeness now. Deepak should be unblocked.

Deepak: Confirmed — I started PyTorch training this morning with the clean data. Early results after 20 epochs look promising. I''m seeing accuracy trending toward 83% already with a lot of room left for hyperparameter tuning.

Pooja: I need to flag a dashboard concern. I''ve been building the Power BI reports but HR leadership came back with a request: they want the attrition predictions embedded directly in the HR system (Workday) rather than a separate Power BI dashboard. They want managers to see risk scores inside their existing tools, not log in to another system.

Anjali: That''s a significant change. Pooja, what does that mean technically?

Pooja: It means instead of Power BI, we build an API that Workday can call to get prediction scores. We''d need a REST API layer on top of the ML model. The visualization in Workday is limited but HR leadership prefers the workflow.

Suresh: This is actually simpler for us on the infrastructure side — we were already building the FastAPI layer.

Anjali: I''m going to escalate this to the CHRO before we decide. We spent 3 weeks on Power BI. But if that''s what HR wants, that''s what we build. I''ll have an answer by Thursday.

Sameer: I need to flag a testing concern — if we switch to Workday API integration, my entire test plan has to be rewritten. I''ve been writing Power BI validation scripts for 2 weeks.',
    'Data pipeline review: 97.3% data completeness achieved, all 12 source systems flowing. PyTorch model training started — early results showing 83% accuracy trending upward. Critical conflict flagged: HR leadership requesting Workday API integration instead of Power BI dashboards. Anjali escalating to CHRO — decision by Thursday. Sameer flagged QA impact (2 weeks of Power BI tests would be voided). Conflict open pending executive decision.'
)
ON CONFLICT DO NOTHING;

-- Reliance Conflict — dashboard platform change (open — pending CHRO decision)
INSERT INTO conflicts (id, project_id, meeting_id, category, title, previous_state, new_state, evidence, severity, confidence, ai_explanation, recommendation, status) VALUES
(
    'ffffffff-0000-0000-0002-000000000002',
    'aaaaaaaa-0000-0000-0002-000000000001',
    'cccccccc-0000-0000-0002-000000000003',
    'technical_decision',
    'Dashboard delivery changed: Power BI → Workday API integration',
    '{"description": "Power BI selected as executive dashboard platform — company standard, CHRO team already using it", "meeting": "Discovery & Architecture Planning", "meeting_date": "2024-11-01"}',
    '{"description": "HR leadership requests predictions embedded in Workday via REST API instead of separate Power BI dashboard", "meeting": "Data Pipeline Review", "meeting_date": "2024-11-19", "requested_by": "HR Leadership"}',
    '[{"source": "historical", "speaker": "Pooja Iyer", "quote": "management has asked for Power BI. It''s the company standard"}, {"source": "new", "speaker": "Pooja Iyer", "quote": "HR leadership came back with a request: they want the attrition predictions embedded directly in Workday"}, {"source": "new", "speaker": "Sameer Khan", "quote": "if we switch to Workday API integration, my entire test plan has to be rewritten"}]',
    'critical',
    0.98,
    'Power BI was explicitly approved at the discovery meeting as the company standard executive dashboard. HR leadership has now requested Workday API integration instead — directly contradicting the original decision. Impact is severe: 3 weeks of Power BI development work and 2 weeks of QA test scripts are at risk. This conflict is pending a CHRO-level decision before it can be resolved.',
    '{"action": "Escalate to CHRO immediately — do not proceed with either direction until decision confirmed", "reason": "High-impact change with significant sunk cost (5+ person-weeks). Cannot be resolved at team level.", "alternatives": ["Keep Power BI (approved path, work already done)", "Switch to Workday API (new stakeholder request, requires rewrite)", "Deliver both (Power BI for CHRO, Workday API for managers — highest cost but satisfies both)"], "confidence": 0.95}',
    'open'
)
ON CONFLICT DO NOTHING;

-- Reliance Tasks (ongoing)
INSERT INTO tasks (id, project_id, meeting_id, title, assigned_to_name, priority, status, due_date) VALUES
(
    'eeeeeeee-0000-0000-0002-000000000004',
    'aaaaaaaa-0000-0000-0002-000000000001',
    'cccccccc-0000-0000-0002-000000000002',
    'Train PyTorch transformer attrition model',
    'Deepak Reddy',
    'critical',
    'in_progress',
    '2026-12-01'
),
(
    'eeeeeeee-0000-0000-0002-000000000005',
    'aaaaaaaa-0000-0000-0002-000000000001',
    'cccccccc-0000-0000-0002-000000000002',
    'Fix SAP HR connector data quality issues',
    'Nisha Agarwal',
    'high',
    'completed',
    '2026-11-22'
),
(
    'eeeeeeee-0000-0000-0002-000000000006',
    'aaaaaaaa-0000-0000-0002-000000000001',
    'cccccccc-0000-0000-0002-000000000003',
    'Escalate Power BI vs Workday decision to CHRO',
    'Anjali Bose',
    'critical',
    'in_progress',
    '2026-11-28'
),
(
    'eeeeeeee-0000-0000-0002-000000000007',
    'aaaaaaaa-0000-0000-0002-000000000001',
    'cccccccc-0000-0000-0002-000000000003',
    'Build FastAPI prediction score endpoint (unblocked either way)',
    'Suresh Kulkarni',
    'high',
    'in_progress',
    '2026-12-05'
)
ON CONFLICT DO NOTHING;

-- Reliance Project State
INSERT INTO project_state (project_id, state_key, state_value, state_category, source_meeting_id) VALUES
(
    'aaaaaaaa-0000-0000-0002-000000000001',
    'data_ingestion_layer',
    'Apache Kafka',
    'technical',
    'cccccccc-0000-0000-0002-000000000001'
),
(
    'aaaaaaaa-0000-0000-0002-000000000001',
    'data_storage',
    'Azure Data Lake Storage Gen2',
    'technical',
    'cccccccc-0000-0000-0002-000000000001'
),
(
    'aaaaaaaa-0000-0000-0002-000000000001',
    'ml_model',
    'PyTorch Transformer (replacing XGBoost — accuracy target)',
    'technical',
    'cccccccc-0000-0000-0002-000000000002'
),
(
    'aaaaaaaa-0000-0000-0002-000000000001',
    'ml_accuracy_target',
    '85% minimum (expected 87-88% with PyTorch)',
    'technical',
    'cccccccc-0000-0000-0002-000000000002'
),
(
    'aaaaaaaa-0000-0000-0002-000000000001',
    'dashboard_decision',
    'PENDING — Power BI vs Workday API (CHRO decision required)',
    'technical',
    'cccccccc-0000-0000-0002-000000000003'
),
(
    'aaaaaaaa-0000-0000-0002-000000000001',
    'data_infrastructure_lead',
    'Suresh Kulkarni',
    'personnel',
    'cccccccc-0000-0000-0002-000000000001'
),
(
    'aaaaaaaa-0000-0000-0002-000000000001',
    'ml_lead',
    'Deepak Reddy',
    'personnel',
    'cccccccc-0000-0000-0002-000000000001'
)
ON CONFLICT (project_id, state_key) DO UPDATE SET
    state_value = EXCLUDED.state_value,
    source_meeting_id = EXCLUDED.source_meeting_id,
    updated_at = NOW();

-- Reliance Activity Log
INSERT INTO activity_logs (project_id, meeting_id, actor_name, action, entity_type, summary) VALUES
    ('aaaaaaaa-0000-0000-0002-000000000001', 'cccccccc-0000-0000-0002-000000000001', 'Anjali Bose', 'meeting_analyzed', 'meeting', 'Architecture meeting analyzed — Kafka, Azure ADLS, XGBoost, Power BI decisions'),
    ('aaaaaaaa-0000-0000-0002-000000000001', 'cccccccc-0000-0000-0002-000000000002', 'Anjali Bose', 'meeting_analyzed', 'meeting', 'ML review analyzed — 1 conflict: XGBoost → PyTorch due to accuracy shortfall'),
    ('aaaaaaaa-0000-0000-0002-000000000001', 'cccccccc-0000-0000-0002-000000000003', 'Anjali Bose', 'meeting_analyzed', 'meeting', 'Data review analyzed — 1 critical conflict: Power BI vs Workday integration, CHRO decision pending');

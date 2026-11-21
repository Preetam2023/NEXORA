-- NEXORA — Seed Data: Project Alpha Demo
-- Run AFTER schema.sql in the Supabase SQL Editor
-- This creates the full 3-meeting workflow that judges will see in the demo.
-- Owner: Saikat (SEED task)

-- ─────────────────────────────────────────────
-- Users / Team Members
-- ─────────────────────────────────────────────
INSERT INTO users (id, email, name, role) VALUES
    ('00000000-0000-0000-0000-000000000001', 'rahul@acme.com',    'Rahul Sharma',  'admin'),
    ('00000000-0000-0000-0000-000000000002', 'arjun@acme.com',    'Arjun Verma',   'member'),
    ('00000000-0000-0000-0000-000000000003', 'sanchita@acme.com', 'Sanchita Rao',  'member'),
    ('00000000-0000-0000-0000-000000000004', 'priya@acme.com',    'Priya Nair',    'member'),
    ('00000000-0000-0000-0000-000000000005', 'neha@acme.com',     'Neha Joshi',    'member'),
    ('00000000-0000-0000-0000-000000000006', 'aman@acme.com',     'Aman Singh',    'member')
ON CONFLICT (email) DO NOTHING;

-- ─────────────────────────────────────────────
-- Project
-- ─────────────────────────────────────────────
INSERT INTO projects (id, name, description, status, health, completion_percentage, requirements, technology_stack, created_by) VALUES
(
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Project Alpha — Backend Modernization',
    'Migrate legacy monolith backend to a modern microservices architecture with improved data storage and API layer.',
    'active',
    'at_risk',
    35,
    'Migrate existing MongoDB-based backend to a production-grade database. Build RESTful API with authentication. Ensure zero-downtime deployment. Full test coverage before launch.',
    '["Python", "FastAPI", "PostgreSQL", "Docker", "GitHub Actions"]',
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- Project Members (denormalised for display)
-- ─────────────────────────────────────────────
INSERT INTO project_members (id, project_id, user_id, name, email, role) VALUES
    ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Rahul Sharma',  'rahul@acme.com',    'pm'),
    ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Arjun Verma',   'arjun@acme.com',    'developer'),
    ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Sanchita Rao',  'sanchita@acme.com', 'developer'),
    ('bbbbbbbb-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'Priya Nair',    'priya@acme.com',    'developer'),
    ('bbbbbbbb-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Neha Joshi',    'neha@acme.com',     'qa'),
    ('bbbbbbbb-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'Aman Singh',    'aman@acme.com',     'developer')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- Meeting 1 — Monday Sprint Planning
-- ─────────────────────────────────────────────
INSERT INTO meetings (id, project_id, title, meeting_type, meeting_date, duration_mins, status, participants, transcript) VALUES
(
    'cccccccc-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Sprint Planning — Week 1',
    'sprint_planning',
    '2024-11-18 10:00:00+00',
    45,
    'analyzed',
    '["Rahul Sharma", "Arjun Verma", "Sanchita Rao", "Priya Nair", "Neha Joshi", "Aman Singh"]',
    'Rahul: Good morning everyone. Let''s kick off the sprint planning for the backend modernization project. We have a lot to cover today. The main goal this sprint is to get our data storage layer decided and start the initial API work.

Arjun: I''ve been looking at our options for the database. I think we should go with MongoDB. It''s flexible, we can iterate fast with schema-less design, and our existing data is already in a format that maps well to documents. I can have the initial setup done by Friday.

Rahul: That sounds reasonable. Does everyone agree with MongoDB as our database choice?

Sanchita: I''m okay with it for now. I''ve worked with MongoDB before. Though I do have some reservations about the transaction requirements we might run into later.

Priya: I''m fine with MongoDB. As long as Arjun sets up the connection layer cleanly, I can start building the API integration on top of it. Rahul, what''s the deadline for the initial API endpoints?

Rahul: We need the first API endpoints ready by Friday — that''s the demo for the investors. Priya, can you commit to having at least the user authentication and core data endpoints done by then?

Priya: Yes, I can do that. I''ll work in parallel with Arjun''s DB setup.

Rahul: Perfect. So to summarize — we are going with MongoDB as our database technology. Arjun, you''re the database implementation lead, deadline Friday. Priya, you''re handling the API integration layer, also deadline Friday. Neha, can you start writing test cases once Priya has the first endpoints up?

Neha: Sure, I''ll have the test suite ready within a day of Priya''s endpoints being up.

Aman: What about the frontend integration? Should I start building the UI components now?

Rahul: Yes Aman, start with the basic dashboard components. We''ll integrate with the real API once it''s ready. Good meeting everyone, let''s get to work.'
)
ON CONFLICT DO NOTHING;

-- Decisions from Meeting 1
INSERT INTO decisions (id, project_id, meeting_id, title, description, category, status, evidence, confidence) VALUES
(
    'dddddddd-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000001',
    'MongoDB selected as database technology',
    'Team agreed to use MongoDB as the primary database due to flexible schema-less design and fast iteration speed.',
    'technical',
    'approved',
    '[{"speaker": "Rahul Sharma", "quote": "we are going with MongoDB as our database technology"}, {"speaker": "Arjun Verma", "quote": "I think we should go with MongoDB. It''s flexible, we can iterate fast with schema-less design"}]',
    0.95
),
(
    'dddddddd-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000001',
    'API integration deadline set to Friday',
    'Priya Nair committed to delivering user authentication and core data endpoints by Friday for investor demo.',
    'timeline',
    'approved',
    '[{"speaker": "Rahul Sharma", "quote": "We need the first API endpoints ready by Friday — that''s the demo for the investors"}, {"speaker": "Priya Nair", "quote": "Yes, I can do that"}]',
    0.98
)
ON CONFLICT DO NOTHING;

-- Tasks from Meeting 1
INSERT INTO tasks (id, project_id, meeting_id, title, assigned_to_name, assigned_to_id, priority, status, due_date, evidence) VALUES
(
    'eeeeeeee-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000001',
    'Set up MongoDB database and connection layer',
    'Arjun Verma',
    'bbbbbbbb-0000-0000-0000-000000000002',
    'high',
    'in_progress',
    '2024-11-22',
    '[{"speaker": "Rahul Sharma", "quote": "Arjun, you''re the database implementation lead, deadline Friday"}]'
),
(
    'eeeeeeee-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000001',
    'Build user authentication and core API endpoints',
    'Priya Nair',
    'bbbbbbbb-0000-0000-0000-000000000004',
    'high',
    'in_progress',
    '2024-11-22',
    '[{"speaker": "Rahul Sharma", "quote": "Priya, you''re handling the API integration layer, also deadline Friday"}]'
),
(
    'eeeeeeee-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000001',
    'Write API test suite',
    'Neha Joshi',
    'bbbbbbbb-0000-0000-0000-000000000005',
    'medium',
    'todo',
    '2024-11-23',
    '[{"speaker": "Neha Joshi", "quote": "Sure, I''ll have the test suite ready within a day of Priya''s endpoints being up"}]'
)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- Meeting 2 — Wednesday Technical Review
-- (This is where NEXORA detects the conflicts)
-- ─────────────────────────────────────────────
INSERT INTO meetings (id, project_id, title, meeting_type, meeting_date, duration_mins, status, participants, transcript) VALUES
(
    'cccccccc-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Technical Architecture Review',
    'technical_review',
    '2024-11-20 14:00:00+00',
    60,
    'analyzed',
    '["Rahul Sharma", "Arjun Verma", "Sanchita Rao", "Priya Nair"]',
    'Rahul: Okay team, mid-week check-in on the technical architecture. Arjun, how''s the MongoDB setup going?

Arjun: Honestly, I''ve been running into some issues. The document model is fine for simple data, but when I started modeling the user relationships and transaction history, I''m hitting some real limitations. The joins are getting complicated and there''s no native transaction support across collections.

Sanchita: I had raised this concern on Monday. I''ve actually been doing some research on this. I think we should seriously consider switching to PostgreSQL. It has native JSONB support so we don''t lose schema flexibility, but we get proper ACID transactions, foreign keys, and much better query performance for relational data.

Rahul: That''s a significant change. Arjun, what do you think?

Arjun: I hate to admit it but Sanchita is right. I''ve been fighting the MongoDB limitations for two days. PostgreSQL would actually be a better fit for our data model. We''d lose some time now but save a lot of pain later.

Rahul: Priya, how does this affect your API work?

Priya: It''s a moderate impact. I''ve been building against the MongoDB client. Switching to PostgreSQL means I need to rework the data access layer. I''d say I need an extra 2-3 days minimum.

Sanchita: I can take over the database implementation. I''ve worked extensively with PostgreSQL and I know the migration path. This would actually be more efficient than Arjun relearning it.

Rahul: This is a big decision. But if the technical team is aligned that PostgreSQL is the right choice, let''s make the call now rather than later. So our decision is: we are moving to PostgreSQL as our database. Sanchita, you are now the database implementation lead. Arjun, please support Sanchita on the data modeling.

Arjun: Makes sense. I''ll focus on the API layer instead and help Priya.

Rahul: Priya, given the extra work, what''s a realistic deadline for the API endpoints?

Priya: If Sanchita can have the PostgreSQL schema ready by Thursday, I can have the core endpoints done by Monday.

Rahul: Okay, API deadline is extended to Monday. Let''s make sure we have the investor demo material ready separately — we can demo with mock data for now. Agreed?

Everyone: Agreed.'
)
ON CONFLICT DO NOTHING;

-- Decisions from Meeting 2 (initially proposed — NEXORA detects conflicts with Meeting 1)
INSERT INTO decisions (id, project_id, meeting_id, title, description, category, status, evidence, confidence) VALUES
(
    'dddddddd-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000002',
    'Switch from MongoDB to PostgreSQL',
    'Team agreed to replace MongoDB with PostgreSQL due to transaction requirements and relational data complexity.',
    'technical',
    'proposed',
    '[{"speaker": "Rahul Sharma", "quote": "our decision is: we are moving to PostgreSQL as our database"}, {"speaker": "Sanchita Rao", "quote": "I think we should seriously consider switching to PostgreSQL"}]',
    0.97
),
(
    'dddddddd-0000-0000-0000-000000000004',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000002',
    'API deadline extended to Monday',
    'Due to database switch, Priya Nair''s API endpoint deadline extended from Friday to Monday.',
    'timeline',
    'proposed',
    '[{"speaker": "Rahul Sharma", "quote": "API deadline is extended to Monday"}, {"speaker": "Priya Nair", "quote": "If Sanchita can have the PostgreSQL schema ready by Thursday, I can have the core endpoints done by Monday"}]',
    0.99
)
ON CONFLICT DO NOTHING;

-- Conflicts detected by NEXORA between Meeting 1 and Meeting 2
INSERT INTO conflicts (id, project_id, meeting_id, category, title, previous_state, new_state, evidence, severity, confidence, ai_explanation, recommendation, status) VALUES
(
    'ffffffff-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000002',
    'technical_decision',
    'Database technology changed: MongoDB → PostgreSQL',
    '{"description": "MongoDB selected as database technology", "meeting": "Sprint Planning — Week 1", "meeting_date": "2024-11-18", "decided_by": "Rahul Sharma"}',
    '{"description": "PostgreSQL proposed as replacement database", "meeting": "Technical Architecture Review", "meeting_date": "2024-11-20", "proposed_by": "Sanchita Rao"}',
    '[{"source": "historical", "speaker": "Rahul Sharma", "quote": "we are going with MongoDB as our database technology"}, {"source": "new", "speaker": "Rahul Sharma", "quote": "our decision is: we are moving to PostgreSQL as our database"}]',
    'high',
    0.97,
    'The team approved MongoDB in Monday''s sprint planning as the primary database. Wednesday''s technical review proposes replacing it with PostgreSQL, citing transaction limitations and relational data complexity. This is a direct contradiction of the previous approved decision and requires explicit approval.',
    '{"action": "Approve the switch to PostgreSQL and supersede the MongoDB decision", "reason": "Technical team is aligned on PostgreSQL''s superiority for this use case. Catching this now saves significant rework later.", "alternatives": ["Keep MongoDB and work around the limitations", "Hybrid approach: PostgreSQL for transactional data, MongoDB for documents"], "pros": ["ACID transactions", "Better query performance", "Native relational integrity"], "cons": ["2-3 days of rework on API layer", "Learning curve for team members unfamiliar with PostgreSQL"], "confidence": 0.92}',
    'open'
),
(
    'ffffffff-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000002',
    'responsibility',
    'Database ownership transferred: Arjun → Sanchita',
    '{"description": "Arjun Verma assigned as database implementation lead", "meeting": "Sprint Planning — Week 1", "meeting_date": "2024-11-18"}',
    '{"description": "Sanchita Rao proposed to take over database implementation", "meeting": "Technical Architecture Review", "meeting_date": "2024-11-20"}',
    '[{"source": "historical", "speaker": "Rahul Sharma", "quote": "Arjun, you''re the database implementation lead, deadline Friday"}, {"source": "new", "speaker": "Sanchita Rao", "quote": "I can take over the database implementation"}, {"source": "new", "speaker": "Rahul Sharma", "quote": "Sanchita, you are now the database implementation lead"}]',
    'medium',
    0.95,
    'Arjun Verma was assigned as database implementation lead in Monday''s meeting. Wednesday''s meeting proposes transferring this responsibility to Sanchita Rao, who has PostgreSQL expertise. This is an ownership change that should be formally acknowledged and task records updated.',
    '{"action": "Transfer database ownership to Sanchita Rao and update task assignments", "reason": "Sanchita has deeper PostgreSQL expertise and volunteered for the role. Arjun will contribute to API layer instead.", "alternatives": ["Keep Arjun as lead with Sanchita as advisor", "Shared ownership between Arjun and Sanchita"], "pros": ["Better expertise match", "Cleaner accountability"], "cons": ["Arjun loses visibility into database layer he started"], "confidence": 0.88}',
    'open'
)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- Meeting 3 — Friday Sprint Review
-- (Formally approves the changes)
-- ─────────────────────────────────────────────
INSERT INTO meetings (id, project_id, title, meeting_type, meeting_date, duration_mins, status, participants, transcript) VALUES
(
    'cccccccc-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Sprint Review & Retrospective',
    'retrospective',
    '2024-11-22 16:00:00+00',
    50,
    'analyzed',
    '["Rahul Sharma", "Arjun Verma", "Sanchita Rao", "Priya Nair", "Neha Joshi", "Aman Singh"]',
    'Rahul: End of week review. Let''s go through what happened and confirm our decisions for next week. Sanchita, update on the PostgreSQL migration?

Sanchita: Great progress. I''ve completed the schema design and the core tables are set up. PostgreSQL is officially our database — it''s not going back. The schema has all the relationships properly modeled with foreign keys and I''ve added indexes for the query patterns we need. Performance looks really good in testing.

Rahul: Excellent. So PostgreSQL is formally confirmed and approved as our production database. This supersedes the MongoDB decision from Monday.

Sanchita: Correct. And just to be clear for everyone''s records — I am the database implementation owner going forward. Arjun has been great in helping with the data modeling but the database layer is my responsibility now.

Arjun: Confirmed. I''ve shifted my focus to supporting Priya on the API layer. We''ve made good progress there.

Priya: Yes, the data access layer refactoring is about 60% done. It''s more work than expected because the ORM mappings are complex. I''m not going to make the original Friday deadline, but I''m confident I can deliver the core endpoints by Monday as we agreed in Wednesday''s meeting.

Rahul: Monday deadline for API endpoints is confirmed. Neha, any concerns on the QA side?

Neha: Once Priya''s endpoints are up Monday, I can have basic test coverage done by Tuesday. The full test suite will take until Wednesday though, given the scope change.

Rahul: That works. Aman, what about the frontend?

Aman: I''ve got the dashboard components built with mock data. Ready to wire up once Priya''s API is live Monday.

Rahul: Good. So to summarize this week: PostgreSQL approved and live, Sanchita is DB lead, API deadline is Monday, QA starts Tuesday. Any remaining risks?

Priya: The API migration is still incomplete. If we hit unexpected issues with the ORM layer over the weekend, Monday could slip.

Neha: Also the test coverage for the new schema isn''t started yet. That''s a risk if we''re doing investor demo next week.

Rahul: Noted. Let''s make sure Priya and Sanchita connect over the weekend if anything comes up. Good sprint everyone.'
)
ON CONFLICT DO NOTHING;

-- Decisions from Meeting 3 (formally approved)
INSERT INTO decisions (id, project_id, meeting_id, title, description, category, status, evidence, confidence) VALUES
(
    'dddddddd-0000-0000-0000-000000000005',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000003',
    'PostgreSQL formally confirmed as production database',
    'PostgreSQL officially approved and supersedes the MongoDB decision from Monday''s sprint planning.',
    'technical',
    'approved',
    '[{"speaker": "Rahul Sharma", "quote": "PostgreSQL is formally confirmed and approved as our production database. This supersedes the MongoDB decision from Monday"}, {"speaker": "Sanchita Rao", "quote": "PostgreSQL is officially our database — it''s not going back"}]',
    0.99
),
(
    'dddddddd-0000-0000-0000-000000000006',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000003',
    'Sanchita confirmed as database implementation owner',
    'Sanchita Rao formally confirmed as the sole database implementation owner, superseding Arjun''s original assignment.',
    'operational',
    'approved',
    '[{"speaker": "Sanchita Rao", "quote": "I am the database implementation owner going forward... the database layer is my responsibility now"}, {"speaker": "Arjun Verma", "quote": "Confirmed. I''ve shifted my focus to supporting Priya on the API layer"}]',
    0.99
)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- Project State (current truth after all 3 meetings)
-- ─────────────────────────────────────────────
INSERT INTO project_state (project_id, state_key, state_value, state_category, source_meeting_id, source_decision_id) VALUES
(
    'aaaaaaaa-0000-0000-0000-000000000001',
    'database_technology',
    'PostgreSQL',
    'technical',
    'cccccccc-0000-0000-0000-000000000003',
    'dddddddd-0000-0000-0000-000000000005'
),
(
    'aaaaaaaa-0000-0000-0000-000000000001',
    'database_implementation_owner',
    'Sanchita Rao',
    'personnel',
    'cccccccc-0000-0000-0000-000000000003',
    'dddddddd-0000-0000-0000-000000000006'
),
(
    'aaaaaaaa-0000-0000-0000-000000000001',
    'api_integration_owner',
    'Priya Nair',
    'personnel',
    'cccccccc-0000-0000-0000-000000000001',
    'dddddddd-0000-0000-0000-000000000002'
),
(
    'aaaaaaaa-0000-0000-0000-000000000001',
    'api_deadline',
    '2024-11-25',
    'timeline',
    'cccccccc-0000-0000-0000-000000000003',
    'dddddddd-0000-0000-0000-000000000004'
),
(
    'aaaaaaaa-0000-0000-0000-000000000001',
    'previous_database_technology',
    'MongoDB (superseded)',
    'technical',
    'cccccccc-0000-0000-0000-000000000001',
    'dddddddd-0000-0000-0000-000000000001'
)
ON CONFLICT (project_id, state_key) DO UPDATE SET
    state_value = EXCLUDED.state_value,
    source_meeting_id = EXCLUDED.source_meeting_id,
    source_decision_id = EXCLUDED.source_decision_id,
    updated_at = NOW();

-- ─────────────────────────────────────────────
-- Activity Log (key events)
-- ─────────────────────────────────────────────
INSERT INTO activity_logs (project_id, meeting_id, actor_name, action, entity_type, summary) VALUES
    ('aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Rahul Sharma', 'meeting_analyzed', 'meeting', 'Sprint Planning analyzed — MongoDB decision, tasks assigned to Arjun and Priya'),
    ('aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000002', 'Rahul Sharma', 'meeting_analyzed', 'meeting', 'Technical Review analyzed — 2 conflicts detected: DB tech change, ownership change'),
    ('aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000003', 'Rahul Sharma', 'meeting_analyzed', 'meeting', 'Sprint Review analyzed — PostgreSQL formally approved, conflicts resolved'),
    ('aaaaaaaa-0000-0000-0000-000000000001', NULL, 'Rahul Sharma', 'conflict_resolved', 'conflict', 'Database technology conflict resolved — PostgreSQL approved'),
    ('aaaaaaaa-0000-0000-0000-000000000001', NULL, 'Rahul Sharma', 'conflict_resolved', 'conflict', 'Ownership conflict resolved — Sanchita confirmed as DB lead');

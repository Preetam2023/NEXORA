# NEXORA TRANSCRIPT ANALYSIS TEST
# 
# Project: Project Alpha — Backend Modernization (aaaaaaaa-0000-0000-0000-000000000001)
#
# WHAT THIS TESTS:
# 1. Meeting analyst extracts: summary, decisions, tasks (with due dates), participants
# 2. Conflict detection: this transcript says "Redis" as caching — no prior decision on cache
#    so no conflict expected (clean extraction)
# 3. Task extraction with deadline: "deploy to production by December 15" — should extract due_date = 2026-12-15
# 4. After analysis: approve decisions → status changes from proposed → approved
# 5. After analysis: approve tasks → status changes from proposed → todo (active, appears in Risk Radar)
#
# HOW TO USE:
# 1. Go to Project Workspace → Meetings tab → Add Meeting
# 2. Title: "Week 3 Deployment Sprint Planning"
# 3. Type: Sprint Planning
# 4. Date: 2026-11-21 (today)
# 5. Paste the transcript below into the text area
# 6. Click "Analyze Meeting"
# 7. Watch SSE progress bar
# 8. When analysis completes, review the approve/reject panel
# 9. Approve one decision and one task — verify they disappear from "proposed" in Decisions tab
# 10. Check Tasks tab — approved task should appear as "todo"
#
# TO REVERT AFTER TESTING:
# Run this in Supabase SQL Editor:
#   DELETE FROM decisions WHERE meeting_id IN (SELECT id FROM meetings WHERE title = 'Week 3 Deployment Sprint Planning' AND project_id = 'aaaaaaaa-0000-0000-0000-000000000001');
#   DELETE FROM tasks WHERE meeting_id IN (SELECT id FROM meetings WHERE title = 'Week 3 Deployment Sprint Planning' AND project_id = 'aaaaaaaa-0000-0000-0000-000000000001');
#   DELETE FROM conflicts WHERE meeting_id IN (SELECT id FROM meetings WHERE title = 'Week 3 Deployment Sprint Planning' AND project_id = 'aaaaaaaa-0000-0000-0000-000000000001');
#   DELETE FROM meetings WHERE title = 'Week 3 Deployment Sprint Planning' AND project_id = 'aaaaaaaa-0000-0000-0000-000000000001';

---TRANSCRIPT BELOW (paste from here)---

Rahul: Good morning everyone. Week 3 planning. We''re in the final stretch before the production launch. Let''s lock down the deployment plan and assign responsibilities clearly.

Priya: Great timing. The API endpoints are all complete and passing Neha''s tests. I want to flag one thing before we start: we still don''t have a caching strategy. With the full 50,000-employee dataset, the query endpoints are going to be slow without caching.

Sanchita: I''ve been thinking about this too. I recommend we add Redis as an in-memory cache layer in front of PostgreSQL for the most frequent queries. Things like user lookups and project summaries can be cached with a 5-minute TTL. It''ll take me about 2 days to set up.

Rahul: Redis for caching — that makes sense. Sanchita, you own that. When can it be ready?

Sanchita: I can have Redis live by November 25th. That''s before the production deploy window.

Rahul: Good. Let''s formally decide: we''re adding Redis as the caching layer for the backend. Sanchita owns the implementation, deadline November 25th.

Arjun: I want to raise the deployment pipeline. We''ve never done a production deploy end-to-end. I think we should do a dry run this week — deploy the full stack to a staging environment that mirrors production. If anything breaks, we have time to fix it.

Rahul: Agreed. Full staging deploy is a blocker for production. Arjun, can you own the staging deploy?

Arjun: Yes. I''ll have the staging environment up by November 27th. That gives us the weekend to find issues before the production deploy.

Rahul: What''s our production deploy target?

Priya: I''d say December 15th is realistic. That gives us two weeks after the staging deploy to fix any issues and do a proper QA cycle.

Neha: I need that time too. My full regression suite isn''t done yet. I''m targeting December 10th for full test coverage. December 15th for production gives me 5 days buffer which is tight but workable.

Rahul: Okay. Production deploy is December 15th. That''s a hard deadline — investors are expecting a live demo on December 17th. Everyone needs to treat December 15th as non-negotiable.

Aman: Frontend is fully integrated with the real API now. I''ll spend this week on performance optimization and mobile responsiveness. I''ll have the final frontend build ready by December 12th to give Priya time to integrate before the deploy.

Rahul: Good. Let me summarize our decisions and tasks for today. First decision: we''re adding Redis as a caching layer, owned by Sanchita, done by November 25th. Second decision: production deploy target is December 15th — firm deadline for the investor demo. 

Sanchita, Redis live November 25th. Arjun, staging deploy by November 27th. Neha, full test coverage by December 10th. Aman, final frontend build by December 12th. Priya, production deploy lead on December 15th.

Any blockers?

Priya: One concern: if the Redis integration surfaces unexpected cache invalidation issues, it could delay the staging deploy. Sanchita and I should sync after her Redis setup is done.

Sanchita: Agreed. I''ll ping Priya as soon as Redis is live and we can do an integration test together.

Rahul: Good. That''s it. December 15th. Everyone knows what they need to do.

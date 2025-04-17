# Glow

> Lets use React Js for fronted and Node Js for backend

Stanley: Authentication & Social Media Integration
(Focus: user accounts and importing external content)*
User Signup/Login:
Basic registration, login, authentication flow (email/password, basic profile).
Social Media Account Linking:
Youtube/Instagram/TikTok OAuth integration (user permission flows clearly handled).
Pull latest posts, captions, likes, and engagement stats into structured database entries.
Create simple API endpoints for others to easily query user content.
Output by end of week:
 Fully functional user auth, social accounts linked, accessible social content via clear REST API endpoints.



Arman: Reflection/Journaling Module & Prompt Generation
(Focus: daily/weekly reflection prompts, journaling UI)*
Prompt/Reflection System:
Develop lightweight journaling UI: daily text-based reflections, micro-check-ins, quick mood/status updates, what next type.
Automated daily prompts/questions: stored in DB, easily customizable from admin/backend.
Reflection data storage, basic tagging/categorization.
Assumption:
 You’ll simulate social media data access via mock API calls or placeholder data provided by Team Member 1.
Output by end of week:
 Fully working reflection module: Users can log and retrieve reflections. Ready to integrate real social data from Team Member 1.





 Daisy: AI Processing (Content Tagging & Interest Identification)
(Focus: NLP, content analysis, automatic tagging)*
Basic NLP & Tagging Engine:
Process provided posts/reflections content to detect keywords, interests, sentiments (e.g., identify repeated topics, emotions, patterns).
Develop simple REST API endpoints: Given content, return meaningful tags, interests, and a basic sentiment profile.
Assumption:
 You’ll test initially with placeholder social data and reflections (sample text, mock JSON data).
Output by end of week:
 AI-based tagging engine as REST API ready to connect seamlessly with Team Member 1’s API (content) and Team Member 2’s reflections.





 Sylvia: Mentor Matching & Basic Interaction System
(Focus: Mentor profiles, matching logic, interaction setup)*
Mentor Profiles:
Develop database structure for mentor info (bio, tags, interests, quick intro).
Populate database with initial demo mentor data.
Matching Algorithm:
Basic mentor-matching logic based on tags/interests provided by AI endpoints (Team Member 3).
Simple endpoints to serve matched mentors given user profile tags/interests.
Interaction UI:
Minimal mentor-mentee interaction interface (simple messaging or link to external video meetings).
Assumption:
 You’ll start with manually entered demo data for mentors and tags/interests. Easily integrate with Team Member 3’s tag API later.
Output by end of week:
 Fully functioning mentor profiles, matching logic, and minimal mentor-mentee interaction UI.

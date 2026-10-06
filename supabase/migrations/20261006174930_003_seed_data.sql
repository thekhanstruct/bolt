/*
# Seed Data — Demo Organizations, Users, and Content

## Overview
Populates the database with two demo organizations and representative users,
pages, announcements, and documents for each.

## Demo Organizations
1. Northstar School District (slug: northstar)
2. Riverside Community Services (slug: riverside)

## Demo Users (password for all: Demo1234!)
- superadmin@communityhub.com — super_admin (both orgs)
- admin@northstar.edu — org_admin (Northstar)
- editor@northstar.edu — editor (Northstar)
- viewer@northstar.edu — viewer (Northstar)
- admin@riverside.org — org_admin (Riverside)
- editor@riverside.org — editor (Riverside)
- viewer@riverside.org — viewer (Riverside)

## Content
- 4 pages per org (mix of published/draft)
- 3 announcements per org (normal/important/emergency)
- 2 documents per org (metadata only — files not uploaded)
- Audit log entries for initial actions

## Notes
1. Passwords are bcrypt-hashed via crypt() from pgcrypto
2. Email confirmation is disabled — confirmed_at is set
3. Profiles are auto-created by the handle_new_user trigger
4. This migration is idempotent — uses ON CONFLICT DO NOTHING / WHERE NOT EXISTS
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- ORGANIZATIONS
-- ============================================

INSERT INTO public.organizations (id, name, slug, description, primary_color, secondary_color, website_url)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Northstar School District', 'northstar',
   'Serving the educational needs of our community with excellence and equity.',
   '#1e40af', '#0f172a', 'https://northstar.example.edu')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.organizations (id, name, slug, description, primary_color, secondary_color, website_url)
VALUES
  ('b2222222-2222-2222-2222-222222222222', 'Riverside Community Services', 'riverside',
   'Building a stronger community through services, programs, and partnerships.',
   '#0d9488', '#1e293b', 'https://riverside.example.org')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- AUTH USERS (password: Demo1234!)
-- UUIDs: valid hex (0-9, a-f) only
-- ============================================

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
SELECT 'c3333333-3333-3333-3333-333333333333', 'superadmin@communityhub.com',
  crypt('Demo1234!', gen_salt('bf')), now(), now(), now(),
  '{}'::jsonb, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@communityhub.com');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
SELECT 'd4444444-4444-4444-4444-444444444444', 'admin@northstar.edu',
  crypt('Demo1234!', gen_salt('bf')), now(), now(), now(),
  '{}'::jsonb, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@northstar.edu');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
SELECT 'e5555555-5555-5555-5555-555555555555', 'editor@northstar.edu',
  crypt('Demo1234!', gen_salt('bf')), now(), now(), now(),
  '{}'::jsonb, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'editor@northstar.edu');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
SELECT 'f6666666-6666-6666-6666-666666666666', 'viewer@northstar.edu',
  crypt('Demo1234!', gen_salt('bf')), now(), now(), now(),
  '{}'::jsonb, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'viewer@northstar.edu');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
SELECT 'a1a1a1a1-1111-1111-1111-111111111111', 'admin@riverside.org',
  crypt('Demo1234!', gen_salt('bf')), now(), now(), now(),
  '{}'::jsonb, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@riverside.org');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
SELECT 'a2a2a2a2-2222-2222-2222-222222222222', 'editor@riverside.org',
  crypt('Demo1234!', gen_salt('bf')), now(), now(), now(),
  '{}'::jsonb, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'editor@riverside.org');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
SELECT 'a3a3a3a3-3333-3333-3333-333333333333', 'viewer@riverside.org',
  crypt('Demo1234!', gen_salt('bf')), now(), now(), now(),
  '{}'::jsonb, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'viewer@riverside.org');

-- Ensure profiles exist
INSERT INTO public.profiles (id, display_name)
SELECT 'c3333333-3333-3333-3333-333333333333', 'Super Admin'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'c3333333-3333-3333-3333-333333333333');

INSERT INTO public.profiles (id, display_name)
SELECT 'd4444444-4444-4444-4444-444444444444', 'Sarah Mitchell'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'd4444444-4444-4444-4444-444444444444');

INSERT INTO public.profiles (id, display_name)
SELECT 'e5555555-5555-5555-5555-555555555555', 'James Chen'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'e5555555-5555-5555-5555-555555555555');

INSERT INTO public.profiles (id, display_name)
SELECT 'f6666666-6666-6666-6666-666666666666', 'Maria Rodriguez'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'f6666666-6666-6666-6666-666666666666');

INSERT INTO public.profiles (id, display_name)
SELECT 'a1a1a1a1-1111-1111-1111-111111111111', 'David Thompson'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'a1a1a1a1-1111-1111-1111-111111111111');

INSERT INTO public.profiles (id, display_name)
SELECT 'a2a2a2a2-2222-2222-2222-222222222222', 'Lisa Park'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'a2a2a2a2-2222-2222-2222-222222222222');

INSERT INTO public.profiles (id, display_name)
SELECT 'a3a3a3a3-3333-3333-3333-333333333333', 'Robert Wilson'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'a3a3a3a3-3333-3333-3333-333333333333');

-- ============================================
-- ORGANIZATION MEMBERSHIPS
-- ============================================

INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', 'super_admin'),
  ('b2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', 'super_admin')
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'd4444444-4444-4444-4444-444444444444', 'org_admin'),
  ('a1111111-1111-1111-1111-111111111111', 'e5555555-5555-5555-5555-555555555555', 'editor'),
  ('a1111111-1111-1111-1111-111111111111', 'f6666666-6666-6666-6666-666666666666', 'viewer')
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES
  ('b2222222-2222-2222-2222-222222222222', 'a1a1a1a1-1111-1111-1111-111111111111', 'org_admin'),
  ('b2222222-2222-2222-2222-222222222222', 'a2a2a2a2-2222-2222-2222-222222222222', 'editor'),
  ('b2222222-2222-2222-2222-222222222222', 'a3a3a3a3-3333-3333-3333-333333333333', 'viewer')
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- ============================================
-- PAGES — Northstar
-- ============================================

INSERT INTO public.pages (organization_id, title, slug, summary, body, status, author_id, published_at)
VALUES
  ('a1111111-1111-1111-1111-111111111111',
   'Welcome to Northstar School District',
   'welcome',
   'Learn about our mission, values, and commitment to educational excellence.',
   '## Our Mission\n\nAt Northstar School District, we believe every child deserves access to world-class education. Our dedicated teachers and staff work tirelessly to create learning environments that inspire curiosity, foster creativity, and build character.\n\n## Our Values\n\n- **Excellence**: We hold ourselves to the highest standards in everything we do.\n- **Equity**: We ensure every student has the resources they need to succeed.\n- **Community**: We partner with families and community organizations to support student growth.\n- **Innovation**: We embrace new approaches to teaching and learning.\n\n## Our Schools\n\nNorthstar operates 12 schools across the district, serving over 8,500 students from kindergarten through 12th grade. Our campuses feature modern facilities, technology-integrated classrooms, and safe, welcoming environments.',
   'published', 'd4444444-4444-4444-4444-444444444444', now() - interval '30 days')
ON CONFLICT (organization_id, slug) DO NOTHING;

INSERT INTO public.pages (organization_id, title, slug, summary, body, status, author_id, published_at)
VALUES
  ('a1111111-1111-1111-1111-111111111111',
   'Enrollment Information',
   'enrollment',
   'Everything you need to know about enrolling your child in Northstar schools.',
   '## Enrollment for 2026-2027 School Year\n\nEnrollment for the upcoming school year opens on **January 15, 2027**. We accept applications for all grade levels.\n\n### Required Documents\n\n1. Proof of residency (utility bill or lease agreement)\n2. Child''s birth certificate\n3. Immunization records\n4. Previous school transcripts (if applicable)\n\n### How to Apply\n\nApplications can be submitted online through our parent portal or in person at any school office. For questions, contact our enrollment office at (555) 123-4567.',
   'published', 'e5555555-5555-5555-5555-555555555555', now() - interval '15 days')
ON CONFLICT (organization_id, slug) DO NOTHING;

INSERT INTO public.pages (organization_id, title, slug, summary, body, status, author_id, published_at)
VALUES
  ('a1111111-1111-1111-1111-111111111111',
   'School Calendar 2026-2027',
   'calendar',
   'Important dates for the upcoming school year including holidays and events.',
   '## Key Dates\n\n| Date | Event |\n|------|-------|\n| Aug 25 | First Day of School |\n| Sep 5 | Labor Day (No School) |\n| Nov 11 | Veterans Day (No School) |\n| Nov 24-25 | Thanksgiving Break |\n| Dec 19 - Jan 2 | Winter Break |\n| Jan 16 | MLK Day (No School) |\n| Feb 20 | Presidents Day (No School) |\n| Mar 27-31 | Spring Break |\n| Jun 9 | Last Day of School |\n\n### Early Release Days\n\nEvery Wednesday is an early release day with dismissal at 1:30 PM for teacher professional development.',
   'published', 'd4444444-4444-4444-4444-444444444444', now() - interval '10 days')
ON CONFLICT (organization_id, slug) DO NOTHING;

INSERT INTO public.pages (organization_id, title, slug, summary, body, status, author_id, published_at)
VALUES
  ('a1111111-1111-1111-1111-111111111111',
   'New STEM Program Proposal',
   'stem-program-proposal',
   'Draft proposal for the new district-wide STEM initiative.',
   '## STEM Program Proposal (DRAFT)\n\n### Overview\n\nThis proposal outlines a comprehensive STEM (Science, Technology, Engineering, Mathematics) program to be implemented across all Northstar schools beginning Fall 2027.\n\n### Budget\n\n- Equipment and lab materials: $450,000\n- Teacher training: $120,000\n- Software licenses: $85,000\n- **Total**: $655,000\n\n### Next Steps\n\n1. Board review and approval (November 2026)\n2. Curriculum development (December 2026 - March 2027)\n3. Teacher training (April - June 2027)\n4. Program launch (August 2027)\n\n*This document is a draft and subject to change pending board approval.*',
   'draft', 'e5555555-5555-5555-5555-555555555555', NULL)
ON CONFLICT (organization_id, slug) DO NOTHING;

-- ============================================
-- PAGES — Riverside
-- ============================================

INSERT INTO public.pages (organization_id, title, slug, summary, body, status, author_id, published_at)
VALUES
  ('b2222222-2222-2222-2222-222222222222',
   'About Riverside Community Services',
   'about',
   'Learn about our mission to strengthen the Riverside community.',
   '## Who We Are\n\nRiverside Community Services is a nonprofit organization dedicated to building a stronger, more connected community. For over 25 years, we have provided essential services, programs, and resources to residents of all ages.\n\n## What We Do\n\n- **Youth Programs**: After-school tutoring, mentoring, and recreational activities.\n- **Senior Services**: Transportation, meal delivery, and social events.\n- **Food Assistance**: Weekly food pantry and emergency food support.\n- **Job Training**: Workforce development and career counseling.\n- **Community Events**: Festivals, workshops, and neighborhood gatherings.\n\n## Get Involved\n\nWe rely on volunteers and donors to keep our programs running. Visit our volunteer page or call us at (555) 987-6543 to learn how you can help.',
   'published', 'a1a1a1a1-1111-1111-1111-111111111111', now() - interval '45 days')
ON CONFLICT (organization_id, slug) DO NOTHING;

INSERT INTO public.pages (organization_id, title, slug, summary, body, status, author_id, published_at)
VALUES
  ('b2222222-2222-2222-2222-222222222222',
   'Volunteer Opportunities',
   'volunteer',
   'Find the perfect way to give back to your community.',
   '## Current Volunteer Needs\n\n### Food Pantry Volunteers\nHelp sort, pack, and distribute food to families in need. Shifts available Tuesday and Thursday mornings.\n\n### Youth Mentors\nSpend 2 hours per week mentoring a young person in our after-school program. Training provided.\n\n### Event Volunteers\nHelp set up, manage, and clean up at our community events throughout the year.\n\n### How to Apply\n\n1. Fill out our online volunteer application\n2. Complete a brief background check\n3. Attend a 1-hour orientation session\n4. Start making a difference!\n\nFor more information, email volunteer@riverside.example.org or call (555) 987-6543.',
   'published', 'a2a2a2a2-2222-2222-2222-222222222222', now() - interval '20 days')
ON CONFLICT (organization_id, slug) DO NOTHING;

INSERT INTO public.pages (organization_id, title, slug, summary, body, status, author_id, published_at)
VALUES
  ('b2222222-2222-2222-2222-222222222222',
   'Annual Report 2025',
   'annual-report-2025',
   'Our yearly impact report showing how we served the community.',
   '## 2025 Impact Report\n\n### By the Numbers\n\n- 12,500 meals served through our food pantry\n- 340 youth participated in after-school programs\n- 180 seniors received regular transportation services\n- 95 community members completed job training\n- 28 community events hosted\n\n### Financial Summary\n\n- Total Revenue: $1.2M\n  - Individual donations: $420K\n  - Grants: $580K\n  - Program fees: $200K\n- Total Expenses: $1.1M\n  - Programs: $850K\n  - Administration: $180K\n  - Fundraising: $70K\n\n### Looking Ahead\n\nIn 2026, we plan to expand our food pantry to twice weekly, launch a new mental health support program, and increase our youth mentoring capacity by 50%.',
   'published', 'a1a1a1a1-1111-1111-1111-111111111111', now() - interval '60 days')
ON CONFLICT (organization_id, slug) DO NOTHING;

INSERT INTO public.pages (organization_id, title, slug, summary, body, status, author_id, published_at)
VALUES
  ('b2222222-2222-2222-2222-222222222222',
   'New Mental Health Program Draft',
   'mental-health-program',
   'Draft outline for the new mental health support initiative.',
   '## Mental Health Support Program (DRAFT)\n\n### Vision\n\nProvide accessible mental health resources to all community members, reducing stigma and improving wellbeing.\n\n### Proposed Services\n\n1. **Counseling Services**: Free individual and group counseling sessions\n2. **Crisis Support**: 24/7 hotline and in-person crisis intervention\n3. **Workshops**: Monthly mental health education workshops\n4. **Youth Program**: School-based mental health support\n\n### Partnerships\n\n- Riverside Health Center\n- County Mental Health Department\n- Local faith communities\n\n### Budget Estimate\n\n- Year 1: $320,000\n- Year 2: $280,000\n- Year 3: $250,000',
   'draft', 'a2a2a2a2-2222-2222-2222-222222222222', NULL)
ON CONFLICT (organization_id, slug) DO NOTHING;

-- ============================================
-- ANNOUNCEMENTS — Northstar
-- ============================================

INSERT INTO public.announcements (organization_id, title, message, priority, publish_date, expiration_date, audience, status, author_id)
VALUES
  ('a1111111-1111-1111-1111-111111111111',
   'School Closure Due to Weather',
   'All Northstar schools will be closed on Friday, October 10 due to severe weather conditions. All after-school activities are also cancelled. Classes will resume on Monday, October 13.',
   'emergency', now() - interval '2 days', now() + interval '5 days', 'public', 'published',
   'd4444444-4444-4444-4444-444444444444'),
  ('a1111111-1111-1111-1111-111111111111',
   'Parent-Teacher Conferences Sign-Up Now Open',
   'Fall parent-teacher conferences will be held November 18-22. Sign-up slots are now available through the parent portal. We encourage all parents to schedule a meeting with their child''s teachers.',
   'important', now() - interval '5 days', NULL, 'public', 'published',
   'e5555555-5555-5555-5555-555555555555'),
  ('a1111111-1111-1111-1111-111111111111',
   'New Bus Route Added for Maple Street',
   'Starting Monday, October 13, a new bus route will serve the Maple Street area. Pick-up time is 7:45 AM. Please check the transportation page for the full updated schedule.',
   'normal', now() - interval '10 days', NULL, 'public', 'published',
   'd4444444-4444-4444-4444-444444444444')
ON CONFLICT DO NOTHING;

-- ============================================
-- ANNOUNCEMENTS — Riverside
-- ============================================

INSERT INTO public.announcements (organization_id, title, message, priority, publish_date, expiration_date, audience, status, author_id)
VALUES
  ('b2222222-2222-2222-2222-222222222222',
   'Emergency Food Drive This Weekend',
   'Our food pantry supplies are critically low. We are hosting an emergency food drive this Saturday and Sunday from 9 AM to 3 PM at the Riverside Community Center. Most needed items: canned vegetables, rice, pasta, peanut butter, and cereal.',
   'emergency', now() - interval '1 day', now() + interval '7 days', 'public', 'published',
   'a1a1a1a1-1111-1111-1111-111111111111'),
  ('b2222222-2222-2222-2222-222222222222',
   'Job Fair Scheduled for November 15',
   'Riverside Community Services is hosting a community job fair on November 15 from 10 AM to 2 PM. Over 30 local employers will be in attendance. Bring copies of your resume. Free professional headshots will be available. For more information, call our career center.',
   'important', now() - interval '7 days', NULL, 'public', 'published',
   'a2a2a2a2-2222-2222-2222-222222222222'),
  ('b2222222-2222-2222-2222-222222222222',
   'Holiday Food Basket Sign-Up',
   'Families in need can sign up for a free holiday food basket. Baskets include a complete holiday meal with all the trimmings. Sign up by November 20 at our front desk or by calling (555) 987-6543.',
   'normal', now() - interval '12 days', NULL, 'public', 'published',
   'a1a1a1a1-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- ============================================
-- DOCUMENTS — Northstar (metadata only)
-- ============================================

INSERT INTO public.documents (organization_id, title, description, category, file_path, file_name, file_size, file_type, is_public, uploaded_by)
VALUES
  ('a1111111-1111-1111-1111-111111111111',
   '2025-2026 Student Handbook',
   'Complete guide to school policies, procedures, and student rights.',
   'Policies', 'northstar/student-handbook-2025.pdf', 'student-handbook-2025.pdf',
   2400000, 'application/pdf', true, 'd4444444-4444-4444-4444-444444444444'),
  ('a1111111-1111-1111-1111-111111111111',
   'District Budget FY2026',
   'Annual district budget with detailed expenditure breakdowns.',
   'Financial', 'northstar/budget-fy2026.pdf', 'budget-fy2026.pdf',
   1800000, 'application/pdf', true, 'd4444444-4444-4444-4444-444444444444')
ON CONFLICT DO NOTHING;

-- ============================================
-- DOCUMENTS — Riverside (metadata only)
-- ============================================

INSERT INTO public.documents (organization_id, title, description, category, file_path, file_name, file_size, file_type, is_public, uploaded_by)
VALUES
  ('b2222222-2222-2222-2222-222222222222',
   'Volunteer Handbook',
   'Everything volunteers need to know about working with Riverside Community Services.',
   'Programs', 'riverside/volunteer-handbook.pdf', 'volunteer-handbook.pdf',
   1200000, 'application/pdf', true, 'a1a1a1a1-1111-1111-1111-111111111111'),
  ('b2222222-2222-2222-2222-222222222222',
   '2025 Annual Impact Report',
   'Full report on programs, services, and financial information for 2025.',
   'Reports', 'riverside/impact-report-2025.pdf', 'impact-report-2025.pdf',
   3100000, 'application/pdf', true, 'a1a1a1a1-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- ============================================
-- AUDIT LOGS — Initial seed entries
-- ============================================

INSERT INTO public.audit_logs (user_id, organization_id, action, resource, metadata)
VALUES
  ('d4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', 'user.login', 'auth', '{}'::jsonb),
  ('e5555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111', 'page.created', 'page', '{"title": "Welcome to Northstar School District"}'::jsonb),
  ('d4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', 'page.published', 'page', '{"title": "School Calendar 2026-2027"}'::jsonb),
  ('d4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', 'announcement.created', 'announcement', '{"title": "School Closure Due to Weather"}'::jsonb),
  ('d4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', 'document.uploaded', 'document', '{"title": "2025-2026 Student Handbook"}'::jsonb),
  ('a1a1a1a1-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'user.login', 'auth', '{}'::jsonb),
  ('a2a2a2a2-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'page.created', 'page', '{"title": "Volunteer Opportunities"}'::jsonb),
  ('a1a1a1a1-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'document.uploaded', 'document', '{"title": "Volunteer Handbook"}'::jsonb)
ON CONFLICT DO NOTHING;
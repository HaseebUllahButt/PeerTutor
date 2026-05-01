1. Introduction
1.1 Purpose
This Software Requirements Specification (SRS) documents the complete set of requirements for PeerTutor, a web-based peer-to-peer tutoring platform developed as part of the SEECS, NUST Software Engineering course. The document is intended for the development team, project supervisors, and any other stakeholders involved in the evaluation or implementation of the system. It establishes the functional scope, non-functional constraints, stakeholder definitions, and architectural models that will guide development throughout the semester.
1.2 Project Overview
PeerTutor is a full-stack web application that connects university students seeking academic help with senior peers who are willing to provide tutoring at affordable, student-friendly rates. The platform replaces the fragmented, informal tutoring arrangements currently managed through WhatsApp groups, phone calls, and word of mouth, replacing them with a structured, discoverable, and accountable system built specifically for the university environment.
The system serves three distinct user roles: Students who need help, Tutors who offer it, and Administrators who oversee the platform. Core capabilities include tutor profile creation and discovery, calendar-based session booking, real-time in-app messaging, a post-session ratings and reviews system, and an administrative dashboard for platform management.
1.3 Scope
PeerTutor is scoped to serve students within a single university environment in its first release. The platform does not aim to compete with global tutoring services but focuses on intra-university peer learning, which is inherently more affordable, contextually relevant, and academically aligned. The system encompasses:
    • User registration, authentication, and role-based access control
    • Tutor profile management including subjects, rates, qualifications, and availability
    • A smart search and filter interface for student-side tutor discovery
    • A calendar-integrated session booking and scheduling system
    • Real-time in-app messaging between students and tutors
    • A verified post-session ratings and reviews system
    • An administrative dashboard for user management, reporting, and moderation

2. Overall Description
2.1 Problem Statement
University students at SEECS, NUST regularly encounter knowledge gaps in their coursework that lectures and office hours fail to address. The existing mechanisms for peer tutoring are informal, unreliable, and poorly structured. Ethnographic observation during Sprint 1 documented five distinct pain points:
    • Discovery is scattered: students search WhatsApp groups manually, receive vague recommendations, and frequently fail to find any tutor at all within a reasonable time frame.
    • Scheduling is inefficient: a simple session booking often requires 10 or more messages exchanged over half an hour, with no written confirmation and a high risk of no-shows.
    • Quality is opaque: students make tutoring decisions based entirely on hearsay, with no ratings, reviews, or verified track records available for any peer tutor.
    • Communication is disorganized: pre-session notes and agreements are buried in general WhatsApp threads alongside unrelated content, leading to sessions where neither party knows what will be covered.
    • Accountability is absent: students who pay in advance and get cancelled on have no reporting mechanism, no refund channel, and no recourse whatsoever.

The survey of 78 respondents confirmed these findings quantitatively. Reliability (44.9%), scheduling difficulty (43.6%), cost (42.3%), and the absence of a dedicated platform (39.7%) were cited as the top barriers to finding a tutor. Payment, trust, and communication were each selected as pain points by 51.3% of respondents. PeerTutor is designed to address all of these problems within a single, cohesive platform.

2.2 Product Perspective
PeerTutor is a standalone web application targeting the intra-university tutoring market. It does not depend on or integrate with existing university systems in its initial release. The platform is positioned as an alternative to global services such as Chegg, Tutor.com, and Wyzant, which are either too expensive, too generalized, or not designed for campus-specific peer learning. PeerTutor's primary differentiators are its focus on verified peer tutors from the same institution, its transparent rating system, and its structured booking and communication flows.

2.3 Product Functions Summary

#	Feature	Description
1	User Authentication	Secure registration and login with role-based access for Students, Tutors, and Admins. JWT-based session management.
2	Tutor Profile Management	Tutors create profiles listing subjects, hourly rates, qualifications, and real-time availability calendars.
3	Smart Search and Filter	Students search and filter tutors by rating, availability, price, subject, and qualification.
4	Session Booking	Calendar-integrated booking with advance scheduling and instant booking modes, automated reminders.
5	In-App Messaging	Real-time chat tied to individual bookings for structured, session-specific communication.
6	Ratings and Reviews	Verified post-session star ratings and written reviews displayed on tutor profiles.
7	Admin Dashboard	User management, content moderation, dispute resolution, and platform analytics.

2.4 User Classes and Characteristics

User Class	Description	Key Characteristics
Student	University students seeking academic help in specific subjects.	Primarily 3rd year (78.2% of survey)
Uses laptop as primary device
Checks ratings before every booking (64.1%)
Prefers advance calendar booking (57.7%)
Tutor	Senior students offering tutoring in subjects they have completed.	Dual-role users are 48.7% of respondents
Sets own hourly rate and availability
Builds reputation through ratings over time
Accountable via verified profile and session records
Administrator	Platform operators responsible for governance and health of the system.	Manages user accounts and moderation
Handles dispute resolution
Monitors analytics and usage trends
Enforces Code of Conduct


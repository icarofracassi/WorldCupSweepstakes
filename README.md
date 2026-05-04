# 🏆 World Cup Sweepstakes: A Full-Stack Predictive Engine

**A sophisticated sports-tracking platform that bridges real-time external data with complex user-state management.**

[Live Demo Link] | [System Architecture Diagram]

## 🎯 The Pitch
Most portfolio projects are isolated CRUD apps. **World Cup Sweepstakes** is different. It is a data-integrated ecosystem that synchronizes external sports telemetry with a custom-built prediction engine. This project exercised my ability to build a high-performance, type-safe environment where data consistency and user experience are paramount.

Building this wasn't just about "making a site"; it was about solving the engineering challenge of **mapping volatile external data to a rigid internal business logic.**

---

## 🏗️ Technical Architecture & Skill Synthesis

While building this, I moved beyond basic tutorials and mastered the following professional patterns:

### 1. The "Type-Safe" Full-Stack
By utilizing **TypeScript** from the database layer (**Prisma**) to the UI components (**Shadcn/ui**), I achieved a "Zero-Guesswork" environment. 
*   **What I learned:** How to share types across the stack to prevent runtime errors and how to leverage Prisma’s auto-generated types to ensure database queries never break the frontend.

### 2. High-Frequency Data Synchronization
Integrating the `football-data.org` API required more than a simple `fetch`.
*   **The Challenge:** Handling external API rate limits and transforming complex nested JSON into a flat, performant schema for my users.
*   **What I learned:** I implemented a robust service layer to handle external requests, data normalization, and error-handling strategies for when third-party services go down.

### 3. State Management & Asynchronous UI
Using **TanStack Query (React Query)** was a strategic choice to handle server-state.
*   **The Challenge:** Ensuring that when a user predicts a score, the UI reflects the change immediately without a full page reload or "stale" data.
*   **What I learned:** I mastered **Optimistic Updates**—updating the UI immediately upon user action and rolling back silently if the server request fails. This creates a "native app" feel.

### 4. Component Architecture & UX Motion
I used **Tailwind CSS**, **Shadcn/ui**, and **Framer Motion** to bridge the gap between "functional" and "professional."
*   **What I learned:** How to build accessible, reusable UI components and how to use motion (animation) not as decoration, but as a functional cue to guide the user through the prediction flow.

---

## 🚀 Key Engineering Challenges Overcome

### The "Leaderboard Logic" Problem
**Problem:** Calculating real-time rankings for hundreds of users based on fluctuating match results is computationally expensive if done incorrectly.
**Solution:** I developed a scoring algorithm that triggers on match completion, calculating points based on "Exact Score" vs. "Correct Outcome" logic. This exercised my ability to write clean, algorithmic logic separate from the UI.

### Circular Dependency Management
**Problem:** Managing relationships between Users, Leagues, Matches, and Predictions can quickly become a "spaghetti" of dependencies.
**Solution:** I implemented a modular backend structure, separating concerns into Services, Controllers, and Routes. This made the codebase scalable and much easier to debug.

---

## 🛠️ Tech Stack Breakdown

*   **Frontend:** React, Next.js, Tailwind CSS, Framer Motion
*   **State Management:** TanStack Query (React Query)
*   **Backend & DB:** Node.js, Prisma ORM, PostgreSQL
*   **UI Library:** Shadcn/UI (Radix UI)
*   **External Integration:** RESTful Football Data API

---

## 💡 What This Project Says About Me
I don't just write code; I build systems. This project proves I am comfortable:
1.  **Reading and implementing complex documentation.**
2.  **Architecting database schemas** that reflect real-world relationships.
3.  **Prioritizing the end-user experience** through performance optimization and polished design.
4.  **Learning and adopting industry-standard tools** (like Prisma and TanStack) to solve modern web problems.

---

### 📬 Let's Connect
If you're looking for a developer who understands the "why" behind the "how," I’d love to discuss this project further.

**[Your LinkedIn Profile]** | **[Your Portfolio Website]**

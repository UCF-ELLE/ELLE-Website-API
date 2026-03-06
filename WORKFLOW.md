# Tito Development Workflow & Feature Branch Rules

This document defines the Git workflow for the **Talking With Tito** project.  
Following these rules ensures that our team of developers can collaborate efficiently while keeping the `main` branch stable and deployable.

For the most part, git switch = git checkout

---

# Core Principles

- The `main` branch must **always remain stable and deployable**
- No developer should **commit directly to `main`**
- All changes must go through a **Pull Request**
- Every task should have **its own feature branch**
- Pull Requests must be **reviewed before merging**
- Always `git push -u origin <branch-name>` early so your branch is visible to the team. 

---
# Summary in Bullet Points
## Merging Rules

Once the PR is approved:

1. Merge into `main`
2. Delete the feature branch
3. Update your local repository

Update local repo:


git switch main
git pull origin main


---

## Security Rules

Never commit:

- `.env` files
- API keys
- passwords
- tokens
- private keys

Update secrets into .gitignore

---

## Standard Workflow Summary

Typical workflow for development:

1. SSH into the server
2. Pull latest `main`
3. Create a feature branch
4. Implement the feature
5. Commit changes
6. Push the branch
7. Open a Pull Request
8. Get approval from a teammate
9. Merge into `main`
10. Delete the branch
11. Pull updated `main`

---

## Non-Negotiable Rules

For the Tito development team:

1. Never commit directly to `main`
2. Every task must use a feature branch
3. All changes require a Pull Request
4. At least one approval before merging
5. Keep PRs small and focused
6. Update your branch with `main` regularly
7. Delete branches after merging
8. Never commit secrets
9. Resolve your own merge conflicts
10. `main` must always remain deployable

---

# Goal

Following this workflow allows our team to:

- Avoid merge conflicts
- Maintain clean project history
- Improve collaboration
- Keep production stable


# More Detailed Info:

## Branch Structure

### Main Branch

`main` is the production-ready branch.

Rules:

- Never commit directly to `main`
- Only merge via Pull Requests
- Code in `main` should ALWAYS run and deploy correctly
- Create all feature branches from main (technically sub-branches are a thing, but i see us messing that up at some point)

---

## Feature Branch Rules

## 1. One Task Per Branch

Every feature, bug fix, or refactor should have its own branch.

Note - it's okay to create branches for tiny changes, NEVER commit to main.

Note 2 - if a task is large, break it up in steps, and create a branch for each step. 

Note 3 - After merging, pls delete the branch. 

Examples:


- feature/chat-ui
- feature/student-progress
- fix/audio-recording-bug
- refactor/auth-service
- docs/setup-instructions 
- express/variable-changes 


**Do not** mix unrelated work in the same branch.

---

## 2. Branch Naming Convention

Branch format:


type/short-description


Allowed types:

- `feature/`
- `fix/`
- `hotfix/`
- `refactor/` 
- `docs/`
- `test/`

Rules:

- Use lowercase
- Use hyphens instead of spaces
- Keep names short but descriptive

---

## 3. Always Branch From Updated Main

Before creating a new branch:


git switch main
git pull origin main
git switch -b feature/your-feature-name


This ensures your branch starts from the latest code.

---

## 4. Keep Branches Small

Branches should represent **one focused piece of work**.

Good examples:

- One UI component
- One API route
- One bug fix

This is flexible if work is related, but avoid very large branches that combine multiple features.

---

## 5. Commit Clearly and Often

Make meaningful commits with clear messages.

ESPECIALLY for larger branches, commit every new function, every finished styled component, every API endpoint, etc. 

Example:


git commit -m "Add student progress API endpoint"
git commit -m "Fix audio playback bug"
git commit -m "Refactor lesson validation logic"


Avoid vague commit messages like:


update
fix stuff
final commit

or i will hunt you

---

## 6. Push Branches Early

Push your branch to GitHub early and regularly.


git push -u origin feature/chat-ui


Benefits:

- Creates a backup of your work
- Allows teammates to see progress
- Makes collaboration easier

**Everybody** has access to your branch's latest push.

When pushing in your branch, the option of creating a pull request appears on the git GUI. 

---

## 7. Pull Latest Main Into Your Branch

If `main` changes while you are working, update your branch:


- git switch main
- git pull origin main
- git switch feature/chat-ui
- git merge main


This prevents large merge conflicts later.

---

## 8. Resolve Your Own Merge Conflicts

The developer who owns the branch is responsible for resolving conflicts.

Sometimes another person edits the same spot of the file that you edited. 
You can chose which version to keep on the github UI. 

After resolving conflicts:

- Test the code again
- Commit the resolved changes
- Push the updated branch
- Open pull request if finished
---

# Pull Request Rules

## 1. Open a Pull Request

Your PR should include:

- A clear title
- A short explanation of what the change does

Example description:


Adds chat UI component for student conversation page.
Includes message rendering and basic styling.


---

## 2. Code Review Requirement

Before merging:

- At least **one other developer must review the PR**, preferably your backend/frontend partner
- Code should run perfectly

---

## 3. Never Merge Your Own PR ... unless

This maintains code quality, but if your change is literally the smallest thing, its ok. 

---

## 4. Keep Pull Requests Small

Smaller PRs are easier to review and safer to merge.

If a feature is large, break it into multiple smaller PRs.
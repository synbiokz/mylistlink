# Git + GitHub Setup for `C:\Dev\Apps\listlink`

- [ ] **Go to the project root**  
  `C:\Dev\Apps\listlink`

- [ ] **Check if Git is already initialized**  
  `git rev-parse --is-inside-work-tree`  
  - If `true`, skip to "Stage and commit".  
  - Otherwise, continue.

- [ ] **Initialize Git with a main branch**  
  - `git init -b main`  
  - If `-b` fails:  
    - `git init`  
    - `git branch -M main`

- [ ] **Create `.gitignore` file** with rules for:  
  - `node_modules/`  
  - `.next/`, `.turbo/`, `dist/`, `build/`  
  - `.env` files (except `.env.example`)  
  - `prisma/*.db*` (keep migrations)  
  - `.vscode/`, `.idea/`, `.DS_Store`, `Thumbs.db`

- [ ] **Preview tracked files**  
  - `git add -n .`  
  - `git status -s`

- [ ] **Stage and commit the project**  
  - `git add .`  
  - `git commit -m "chore: initial commit of existing project"`

- [ ] **Configure author for this repo**  
  - `git config user.name "Your Name"`  
  - `git config user.email "your.email@example.com"`

- [ ] **Create a new empty repo on GitHub**  
  - Name: `listlink`  
  - Do **not** add README, `.gitignore`, or license.

- [ ] **Connect local repo to GitHub**  
  - HTTPS:  
    `git remote add origin https://github.com/<username>/listlink.git`  
  - SSH:  
    `git remote add origin git@github.com:<username>/listlink.git`  
  - Verify:  
    `git remote -v`

- [ ] **Push the main branch**  
  - `git push -u origin main`

- [ ] **Create and push a dev branch**  
  - `git checkout -b dev`  
  - `git push -u origin dev`

- [ ] **Feature workflow**  
  - From dev:  
    - `git checkout -b feat/some-change`  
    - Work, commit, push:  
      `git push -u origin feat/some-change`  
  - Merge back into dev:  
    - `git checkout dev`  
    - `git merge --ff-only feat/some-change`  
    - `git push`  
  - Merge dev into main when ready:  
    - `git checkout main`  
    - `git merge --ff-only dev`  
    - `git push`

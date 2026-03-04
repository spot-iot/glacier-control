# Git Workflow Guide

## Repository
- **GitHub**: https://github.com/spot-iot/glacier-control.git
- **Main Branch**: `main`

## Common Commands

### Check Status
```bash
git status
```

### Stage Changes
```bash
# Stage all changes
git add .

# Stage specific file
git add path/to/file
```

### Commit Changes
```bash
git commit -m "Description of changes"
```

### Push to GitHub
```bash
git push
```

### Pull Latest Changes
```bash
git pull
```

### Create New Branch
```bash
git checkout -b feature/your-feature-name
```

### Switch Branches
```bash
git checkout main
git checkout feature/your-feature-name
```

### View Commit History
```bash
git log --oneline
```

## Typical Workflow

1. **Make changes** to your code
2. **Check status**: `git status`
3. **Stage changes**: `git add .`
4. **Commit**: `git commit -m "Description"`
5. **Push**: `git push`

## Important Notes

- **Never commit** `.env` files (already in .gitignore)
- **Never commit** `node_modules` (already in .gitignore)
- Always write clear commit messages
- Push regularly to backup your work

## Vercel Integration

If you've connected this repo to Vercel:
- Every push to `main` will trigger a deployment
- Pull requests can create preview deployments

## Branch Strategy (Optional)

For larger features, consider:
- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: Feature branches

For now, working directly on `main` is fine for a single-developer project.

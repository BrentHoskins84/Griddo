# Fundwell Deployment Guide

## Environments

| Environment | Branch    | URL                          | Purpose                   |
| ----------- | --------- | ---------------------------- | ------------------------- |
| Production  | `main`    | https://fundwell.vercel.app    | Live site                 |
| Staging     | `staging` | Preview URL (auto-generated) | Testing before production |

---

## Git Workflow

```
main (production)
  └── staging (testing)
        └── feature branches
```

### Development Flow

1. **Create feature branch from `staging`**

```bash
   git checkout staging
   git pull origin staging
   git checkout -b feature/your-feature-name
```

2. **Make changes and commit**

```bash
   git add .
   git commit -m "feat: description of changes"
```

3. **Push and create PR to `staging`**

```bash
   git push origin feature/your-feature-name
```

- Create PR: `feature/your-feature-name` → `staging`
- CI runs automatically (lint + build)
- CodeRabbit reviews the PR

4. **Merge to `staging`**

   - After CI passes and review is complete
   - Vercel creates preview deployment
   - Test on staging URL

5. **Promote to production**
   - Create PR: `staging` → `main`
   - After merge, Vercel deploys to production

---

## CI/CD Pipeline

### GitHub Actions (`.github/workflows/ci.yml`)

Runs on:

- Push to `staging`
- PRs to `main` or `staging`

Checks:

- `bun install` - Install dependencies
- `bun run lint` - ESLint
- `bun run build` - TypeScript + Next.js build

### Vercel

- **Production**: Deploys on push to `main`
- **Preview**: Deploys on push to `staging`
- Other branches are ignored (configured in Vercel settings)

### CodeRabbit

- Automatically reviews all PRs
- Provides AI-powered code suggestions

---

## Environment Variables

### Required Secrets (GitHub Actions)

| Secret                          | Description               |
| ------------------------------- | ------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key    |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key |
| `RESEND_API_KEY`                | Resend email API key      |

### Vercel Environment Variables

Same as above, plus:

| Variable                             | Description                                |
| ------------------------------------ | ------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`               | Production URL (https://fundwell.vercel.app) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key                          |
| `STRIPE_SECRET_KEY`                  | Stripe secret key                          |
| `STRIPE_WEBHOOK_SECRET`              | Stripe webhook signing secret              |

---

## Quick Commands

### Start development

```bash
bun dev
```

### Run linter

```bash
bun run lint
```

### Build locally

```bash
bun run build
```

### Sync staging with main

```bash
git checkout staging
git pull origin main
git push origin staging
```

---

## Troubleshooting

### Build fails on Vercel

1. Check environment variables are set
2. Run `bun run build` locally to see errors
3. Check Vercel deployment logs

### CI fails on GitHub

1. Check Actions tab for error details
2. Ensure GitHub secrets are set correctly
3. Run `bun run lint` and `bun run build` locally

### CodeRabbit not reviewing

1. Check CodeRabbit is installed on the repo
2. Verify PR is targeting `main` or `staging`

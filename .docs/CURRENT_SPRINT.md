# Current Sprint: Project Setup & Branding

## Completed

- [x] Template cloned
- [x] Dependencies installed
- [x] Environment configured

## In Progress

- [ ] Update Tailwind config with Griddo colors
- [ ] Update landing page copy and branding
- [ ] Add contest database migration

## Next Up

- [ ] Contest creation form
- [ ] Dashboard layout

## Key Files to Modify

- `tailwind.config.ts` - Add brand colors
- `src/app/(marketing)/page.tsx` - Landing page
- `src/app/layout.tsx` - Metadata, fonts
- `supabase/migrations/` - Add contests migration

```

---

## 4. Don't Overwhelm Cursor

When chatting with Cursor:

**DO:**
- Ask for one thing at a time
- Reference specific files: "Update `tailwind.config.ts` to add Griddo brand colors"
- Point to the docs: "Following the color scheme in `.cursorrules`, update the landing page"

**DON'T:**
- Paste entire planning docs into chat
- Ask it to "build the whole app"
- Give vague instructions like "make it look good"

---

## 5. Suggested First Prompts for Cursor

Once you have everything set up, try these prompts in order:

**Prompt 1 - Colors:**
```

Update tailwind.config.ts to add Griddo brand colors as defined in .cursorrules. Add a "griddo" color palette with primary, secondary, accent, background, surface, and text colors.

```

**Prompt 2 - Landing Page:**
```

Update src/app/(marketing)/page.tsx to be a landing page for Griddo - a game day squares fundraiser platform. Use the Griddo brand colors. Include:

- Hero section with tagline "Host your game day fundraiser"
- 3-step "How it works" section
- Features grid
- CTA button to sign up

```

**Prompt 3 - Database Migration:**
```

Create a new Supabase migration file in supabase/migrations/ for the Griddo contests feature. Reference `/.docs/TEMPLATE_ADAPTATION.md` for the full schema including contests, squares, payment_options, and scores tables with RLS policies.

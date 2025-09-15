Adapter Boundary — UI/Auth (Reference)

Purpose: keep UI provider/DB agnostic by isolating auth calls and contracts.

Key Files
- apps/web/src/services/types.ts — AuthService interface (getSession, signIn, signOut)
- apps/web/src/services/apiAdapter.ts — Implementation using next-auth/react (dynamic import)
- apps/web/src/types/contracts.ts — Session and response shapes used in UI

Usage in UI
- NavBar and Sign-in page call getServices().auth.* only; no direct NextAuth or DB usage.
- Switching to Supabase: provide a new adapter implementing AuthService with identical signatures — no UI changes required.

Events & Cache
- useMe(): refetchOnMount "always", refetch on focus, staleTime 0 for instant header updates after sign-in/out.


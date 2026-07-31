/*
 * Demo build switch (VITE_DEMO=1, see vite.config.ts / api/client.ts).
 * A demo deploy keeps the mock layer alive in a production bundle and pre-fills
 * the sign-in form, so a visitor lands in the admin without hunting for
 * credentials. Regular builds leave the flag unset and behave normally.
 */

export const IS_DEMO = import.meta.env.VITE_DEMO === "1";

/** Seeded account from the mock fixtures (api/mock/data.ts). */
export const DEMO_CREDENTIALS = {
  email: "admin@demo.test",
  password: "password",
} as const;

import type {
  FaqEntry,
  GalleryCategory,
  GalleryPhoto,
  TeamMember,
  TimelineEvent,
} from "../types";

/*
 * Fixtures for the W1 utility pages (team directory, activity timeline, FAQ).
 * Deterministic, self-contained demo data — a real backend replaces this layer
 * without touching the screens.
 */

const AVATAR_COLORS = [
  "#bfdbfe",
  "#bbf7d0",
  "#fde68a",
  "#fecaca",
  "#ddd6fe",
  "#a5f3fc",
  "#fbcfe8",
  "#c7d2fe",
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const TEAM: Array<Omit<TeamMember, "initials">> = [
  {
    id: 1,
    name: "Anna Adminson",
    title: "Head of Operations",
    department: "management",
    email: "anna@example.com",
    color: AVATAR_COLORS[0],
    socials: { twitter: "#", linkedin: "#" },
  },
  {
    id: 2,
    name: "Evan Editor",
    title: "Content Lead",
    department: "marketing",
    email: "evan@example.com",
    color: AVATAR_COLORS[1],
    socials: { twitter: "#", dribbble: "#" },
  },
  {
    id: 3,
    name: "Mia Chen",
    title: "Senior Product Designer",
    department: "design",
    email: "mia@example.com",
    color: AVATAR_COLORS[2],
    socials: { dribbble: "#", linkedin: "#" },
  },
  {
    id: 4,
    name: "Liam Novak",
    title: "Frontend Engineer",
    department: "engineering",
    email: "liam@example.com",
    color: AVATAR_COLORS[3],
    socials: { github: "#", twitter: "#" },
  },
  {
    id: 5,
    name: "Sofia Rossi",
    title: "Backend Engineer",
    department: "engineering",
    email: "sofia@example.com",
    color: AVATAR_COLORS[4],
    socials: { github: "#", linkedin: "#" },
  },
  {
    id: 6,
    name: "Noah Kim",
    title: "Growth Marketer",
    department: "marketing",
    email: "noah@example.com",
    color: AVATAR_COLORS[5],
    socials: { twitter: "#", linkedin: "#" },
  },
  {
    id: 7,
    name: "Emma Wright",
    title: "UX Researcher",
    department: "design",
    email: "emma@example.com",
    color: AVATAR_COLORS[6],
    socials: { dribbble: "#" },
  },
  {
    id: 8,
    name: "Lucas Silva",
    title: "Support Specialist",
    department: "support",
    email: "lucas@example.com",
    color: AVATAR_COLORS[7],
    socials: { twitter: "#" },
  },
  {
    id: 9,
    name: "Olivia Brown",
    title: "Product Manager",
    department: "management",
    email: "olivia@example.com",
    color: AVATAR_COLORS[0],
    socials: { linkedin: "#", twitter: "#" },
  },
  {
    id: 10,
    name: "Ethan Müller",
    title: "DevOps Engineer",
    department: "engineering",
    email: "ethan@example.com",
    color: AVATAR_COLORS[1],
    socials: { github: "#" },
  },
  {
    id: 11,
    name: "Ava Dubois",
    title: "Brand Designer",
    department: "design",
    email: "ava@example.com",
    color: AVATAR_COLORS[2],
    socials: { dribbble: "#", linkedin: "#" },
  },
  {
    id: 12,
    name: "Marco Bianchi",
    title: "Support Lead",
    department: "support",
    email: "marco@example.com",
    color: AVATAR_COLORS[3],
    socials: { twitter: "#", linkedin: "#" },
  },
];

export function listTeam(): TeamMember[] {
  return TEAM.map((member) => ({ ...member, initials: initials(member.name) }));
}

const TIMELINE: TimelineEvent[] = [
  {
    id: 1,
    date: "2026-07-08T14:20:00Z",
    title: "Version 3.4 released",
    description:
      "Theme customizer, density controls and RTL polish shipped to production.",
    category: "release",
    actor: "Anna Adminson",
  },
  {
    id: 2,
    date: "2026-07-08T10:05:00Z",
    title: "Design review",
    description: "Sign-off on the new auth cover layouts and blog templates.",
    category: "meeting",
    actor: "Mia Chen",
  },
  {
    id: 3,
    date: "2026-07-07T16:40:00Z",
    title: "Customer milestone",
    description: "Crossed 10,000 managed screens across all tenants.",
    category: "update",
    actor: null,
  },
  {
    id: 4,
    date: "2026-07-07T09:15:00Z",
    title: "Incident resolved",
    description: "Search indexing lag cleared after a queue tuning pass.",
    category: "note",
    actor: "Ethan Müller",
  },
  {
    id: 5,
    date: "2026-07-05T13:00:00Z",
    title: "Onboarding revamp",
    description:
      "New starter template and empty states rolled out to every workspace.",
    category: "update",
    actor: "Olivia Brown",
  },
  {
    id: 6,
    date: "2026-07-05T08:30:00Z",
    title: "Team offsite",
    description:
      "Quarterly planning wrapped with the roadmap for the next wave.",
    category: "meeting",
    actor: "Anna Adminson",
  },
  {
    id: 7,
    date: "2026-07-02T17:25:00Z",
    title: "Version 3.3 released",
    description:
      "Kanban board, file manager and analytics dashboards went live.",
    category: "release",
    actor: "Liam Novak",
  },
  {
    id: 8,
    date: "2026-07-01T11:10:00Z",
    title: "Accessibility audit",
    description: "Full WCAG 2.2 AA sweep across the component library.",
    category: "note",
    actor: "Emma Wright",
  },
];

export function listTimeline(): TimelineEvent[] {
  return TIMELINE;
}

const FAQ: FaqEntry[] = [
  {
    id: 1,
    category: "general",
    question: "What is Universal CMS?",
    answer:
      "Universal CMS is an accessible, fast admin template for managing content, commerce and teams from one place.",
  },
  {
    id: 2,
    category: "general",
    question: "Which browsers are supported?",
    answer:
      "The latest two versions of Chrome, Firefox, Safari and Edge are fully supported.",
  },
  {
    id: 3,
    category: "general",
    question: "Is there a dark mode?",
    answer:
      "Yes. Every screen ships complete light and dark themes plus three appearance styles.",
  },
  {
    id: 4,
    category: "billing",
    question: "How does billing work?",
    answer:
      "Plans are billed monthly or annually. You can switch or cancel at any time from the billing settings.",
  },
  {
    id: 5,
    category: "billing",
    question: "Can I get a refund?",
    answer:
      "We offer a 14-day money-back guarantee on all new subscriptions, no questions asked.",
  },
  {
    id: 6,
    category: "billing",
    question: "Do you offer team discounts?",
    answer:
      "Teams of ten or more receive volume pricing. Contact sales for a tailored quote.",
  },
  {
    id: 7,
    category: "account",
    question: "How do I reset my password?",
    answer:
      "Use the “Forgot password” link on the sign-in screen and follow the emailed instructions.",
  },
  {
    id: 8,
    category: "account",
    question: "How do I enable two-factor authentication?",
    answer:
      "Open your profile security settings and follow the enrollment steps to add an authenticator app.",
  },
  {
    id: 9,
    category: "security",
    question: "Where is my data stored?",
    answer:
      "Data is stored in encrypted regional data centres with daily backups.",
  },
  {
    id: 10,
    category: "security",
    question: "Are you GDPR compliant?",
    answer:
      "Yes. We provide data-processing agreements and full export and deletion tooling.",
  },
];

export function listFaq(): FaqEntry[] {
  return FAQ;
}

const GALLERY_PALETTES: Record<GalleryCategory, [string, string]> = {
  nature: ["#059669", "#a3e635"],
  city: ["#0ea5e9", "#6366f1"],
  abstract: ["#f43f5e", "#f59e0b"],
  people: ["#8b5cf6", "#ec4899"],
};

const GALLERY_RATIOS = [1, 1.4, 0.75, 1.2, 0.85, 1.6];

const GALLERY_CATEGORIES: GalleryCategory[] = [
  "nature",
  "city",
  "abstract",
  "people",
];

const GALLERY: GalleryPhoto[] = Array.from({ length: 16 }, (_, index) => {
  const category = GALLERY_CATEGORIES[index % GALLERY_CATEGORIES.length];
  const [from, to] = GALLERY_PALETTES[category];
  return {
    id: index + 1,
    category,
    from,
    to,
    ratio: GALLERY_RATIOS[index % GALLERY_RATIOS.length],
  };
});

export function listGallery(): GalleryPhoto[] {
  return GALLERY;
}

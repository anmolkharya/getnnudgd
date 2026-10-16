import { brand } from "./brand";

// Typed content for the landing page. Every section reads from this file.
// Business numbers (response window, tranche count, prices, credit costs) are
// owned by app_config. Anything that mentions one is a placeholder here.

// ---------------------------------------------------------------------------
// Shared types and key unions
// ---------------------------------------------------------------------------

export type LinkTarget = "anchor" | "route" | "external" | "mailto";
export type FeedTone = "green" | "orange" | "indigo" | "neutral";

export const sectionIds = [
  "how-it-works",
  "resume",
  "insiders",
  "requests",
  "rewards",
  "whatsapp",
  "faq",
] as const;
export type SectionId = (typeof sectionIds)[number];

export const heroImageKeys = [
  "hero-resume",
  "hero-find-insider",
  "hero-request",
  "hero-vouch",
  "hero-rewards",
  "hero-whatsapp",
] as const;
export type HeroImageKey = (typeof heroImageKeys)[number];

export const featureImageKeys = [
  "feature-resume",
  "feature-insiders",
  "feature-requests",
  "feature-rewards",
  "feature-whatsapp",
] as const;
export type FeatureImageKey = (typeof featureImageKeys)[number];

export const mockKeys = [
  "mock-resume",
  "mock-insiders",
  "mock-requests",
  "mock-rewards",
  "mock-whatsapp",
] as const;
export type MockKey = (typeof mockKeys)[number];

export const logoKeys = [
  "logo-razorpay",
  "logo-phonepe",
  "logo-zerodha",
  "logo-freshworks",
  "logo-groww",
  "logo-zomato",
  "logo-swiggy",
  "logo-cred",
  "logo-flipkart",
  "logo-meesho",
] as const;
export type LogoKey = (typeof logoKeys)[number];

// Sections whose content is placeholder data and must be confirmed before launch.
export const PLACEHOLDER_SECTIONS = [
  "counter",
  "logos",
  "bento.liveFeed",
  "bento.stats",
  "network",
] as const;
export type PlaceholderSection = (typeof PLACEHOLDER_SECTIONS)[number];

export interface LinkItem {
  readonly label: string;
  readonly href: string;
  readonly target: LinkTarget;
}

export interface DropdownItem {
  readonly number: string;
  readonly name: string;
  readonly oneLiner: string;
  readonly href: string;
  readonly target: LinkTarget;
}

export type NavLink =
  | {
      readonly kind: "dropdown";
      readonly label: string;
      readonly href: string;
      readonly target: LinkTarget;
      readonly items: readonly DropdownItem[];
    }
  | {
      readonly kind: "link";
      readonly label: string;
      readonly href: string;
      readonly target: LinkTarget;
    };

export interface NavConfig {
  readonly links: readonly NavLink[];
  readonly cta: LinkItem;
}

export interface WordmarkConfig {
  readonly text: string;
  /** Part of `text` shown in the brand colour. */
  readonly highlight: string;
}

export interface HeroSlideConfig {
  readonly id: string;
  readonly number: string;
  readonly label: string;
  readonly title: string;
  readonly imageKey: HeroImageKey;
  readonly href: string;
  readonly target: LinkTarget;
}

export interface LogoItem {
  readonly name: string;
  readonly logoKey: LogoKey;
}

export interface LogosConfig {
  readonly heading: string;
  readonly disclaimer: string;
  readonly placeholder: boolean;
  readonly items: readonly LogoItem[];
}

export interface FeatureCardConfig {
  readonly title: string;
  readonly body: string;
  readonly cta: LinkItem;
  readonly imageKey: FeatureImageKey;
  readonly mockKey: MockKey;
}

export interface FeaturesConfig {
  readonly heading: string;
  /** Part of `heading` shown in the brand colour. */
  readonly headingHighlight: string;
  readonly sub: string;
  readonly cta: LinkItem;
  readonly cards: readonly FeatureCardConfig[];
}

export interface FeedRowConfig {
  readonly label: string;
  readonly detail: string;
  readonly tone: FeedTone;
}

export interface LiveFeedConfig {
  readonly title: string;
  readonly body: string;
  readonly placeholder: boolean;
  readonly rows: readonly FeedRowConfig[];
}

export interface StatItem {
  readonly value: number;
  readonly suffix: string;
  readonly label: string;
}

export interface StatsConfig {
  readonly title: string;
  readonly body: string;
  readonly placeholder: boolean;
  readonly items: readonly StatItem[];
}

export interface PurposeBuiltConfig {
  readonly title: string;
  readonly body: string;
  readonly phrases: readonly string[];
}

export interface TitleBody {
  readonly title: string;
  readonly body: string;
}

export interface BentoConfig {
  readonly headingSans: string;
  readonly headingSerif: string;
  readonly sub: string;
  readonly liveFeed: LiveFeedConfig;
  readonly stats: StatsConfig;
  readonly purposeBuilt: PurposeBuiltConfig;
  readonly evolve: TitleBody;
  readonly chip: TitleBody;
}

export interface CounterConfig {
  readonly statement: string;
  readonly value: number;
  readonly from: number;
  readonly caption: string;
  readonly placeholder: boolean;
}

export interface FaqItemConfig {
  readonly q: string;
  readonly a: string;
  readonly needsLegalReview?: boolean;
}

export interface FaqConfig {
  readonly headingSans: string;
  readonly headingSerif: string;
  readonly sub: string;
  readonly contact: {
    readonly title: string;
    readonly body: string;
    readonly cta: LinkItem;
  };
  readonly items: readonly FaqItemConfig[];
}

export interface FooterLink {
  readonly label: string;
  readonly href: string;
  readonly target: LinkTarget;
}

export interface FooterColumn {
  readonly title: string;
  readonly links: readonly FooterLink[];
}

export interface FooterConfig {
  readonly headingSerif: string;
  readonly headingSans: string;
  readonly sub: string;
  readonly cta: LinkItem;
  readonly columns: readonly FooterColumn[];
  readonly wordmark: string;
}

export const networkFields = ["Product", "Engineering", "Design", "Data", "Marketing"] as const;
export type NetworkField = (typeof networkFields)[number];

export interface NetworkCompany {
  readonly id: string;
  readonly name: string;
  /** Which logo from the asset manifest the node shows. */
  readonly logoKey: LogoKey;
}

export type AvatarHair = "short" | "long" | "bun" | "curly";

/** How an illustrated face avatar is drawn. Indexes point into fixed palettes. */
export interface AvatarLook {
  readonly skin: 0 | 1 | 2 | 3 | 4;
  readonly hair: AvatarHair;
  readonly glasses?: boolean;
}

export interface NetworkPerson {
  readonly id: string;
  /** Sample first name and initial. These are illustrative, not real Insiders. */
  readonly name: string;
  readonly role: string;
  readonly years: number;
  readonly field: NetworkField;
  readonly companyId: string;
  /** Sample role-match percentage, 0 to 100. */
  readonly match: number;
  readonly look: AvatarLook;
}

export interface NetworkConfig {
  readonly headingSans: string;
  readonly headingSerif: string;
  readonly sub: string;
  readonly placeholder: boolean;
  readonly filterHeading: string;
  readonly allLabel: string;
  readonly fields: readonly NetworkField[];
  readonly mapLabel: string;
  /** Label under the centre node, which stands for the person looking. */
  readonly seekerLabel: string;
  readonly disclaimer: string;
  readonly matchLabel: string;
  readonly yearsLabel: string;
  readonly companies: readonly NetworkCompany[];
  readonly people: readonly NetworkPerson[];
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export const nav = {
  links: [
    {
      kind: "dropdown",
      label: "How it works",
      href: "#how-it-works",
      target: "anchor",
      items: [
        {
          number: "01",
          name: "Resume tailoring",
          oneLiner: "A free, ATS-friendly resume for every job post.",
          href: "#resume",
          target: "anchor",
        },
        {
          number: "02",
          name: "Find an Insider",
          oneLiner: "Find the people who already work at your target company.",
          href: "#insiders",
          target: "anchor",
        },
        {
          number: "03",
          name: "Insider Requests",
          oneLiner: "Ask a verified Insider to submit you internally.",
          href: "#requests",
          target: "anchor",
        },
        {
          number: "04",
          name: "Insider Rewards",
          oneLiner: "Insiders earn points once a vouch is verified.",
          href: "#rewards",
          target: "anchor",
        },
        {
          number: "05",
          name: "Start on WhatsApp",
          oneLiner: "Begin the whole flow in the chat you already use.",
          href: "#whatsapp",
          target: "anchor",
        },
        {
          number: "06",
          name: "For Insiders",
          oneLiner: "Verify your company email and start earning points.",
          href: "/for-insiders",
          target: "route",
        },
      ],
    },
    { kind: "link", label: "For Insiders", href: "/for-insiders", target: "route" },
    { kind: "link", label: "FAQ", href: "#faq", target: "anchor" },
  ],
  cta: { label: brand.ctaGetVouched, href: "/login", target: "route" },
} as const satisfies NavConfig;

export const wordmark = {
  text: `${brand.ctaGetVouched}.`,
  highlight: `${brand.ctaGetVouched.replace(/^Get\s+/, "")}.`,
} as const satisfies WordmarkConfig;

export const heroSlides = [
  {
    id: "slide-resume",
    number: "01",
    label: "Resume",
    title: "A resume tailored to every job.",
    imageKey: "hero-resume",
    href: "/login",
    target: "route",
  },
  {
    id: "slide-find-insider",
    number: "02",
    label: "Find an Insider",
    title: "Find the Insider inside.",
    imageKey: "hero-find-insider",
    href: "/login",
    target: "route",
  },
  {
    id: "slide-request",
    number: "03",
    label: "Insider Request",
    title: "Send a request that gets read.",
    imageKey: "hero-request",
    href: "/login",
    target: "route",
  },
  {
    id: "slide-vouch",
    number: "04",
    label: "Vouch",
    title: "Get vouched in, not ghosted.",
    imageKey: "hero-vouch",
    href: "/for-insiders",
    target: "route",
  },
  {
    id: "slide-rewards",
    number: "05",
    label: "Rewards",
    title: "Earn points for every verified vouch.",
    imageKey: "hero-rewards",
    href: "/for-insiders",
    target: "route",
  },
  {
    id: "slide-whatsapp",
    number: "06",
    label: "WhatsApp",
    title: "Start the whole thing on WhatsApp.",
    imageKey: "hero-whatsapp",
    href: "/login",
    target: "route",
  },
] as const satisfies readonly HeroSlideConfig[];

export const logos = {
  heading: "Insiders work at",
  disclaimer: `Logos are trademarks of their respective owners. ${brand.name} is not affiliated with or endorsed by these companies.`,
  placeholder: true, // placeholder: founder to confirm before launch
  items: [
    { name: "Razorpay", logoKey: "logo-razorpay" },
    { name: "PhonePe", logoKey: "logo-phonepe" },
    { name: "Zerodha", logoKey: "logo-zerodha" },
    { name: "Freshworks", logoKey: "logo-freshworks" },
    { name: "Groww", logoKey: "logo-groww" },
    { name: "Zomato", logoKey: "logo-zomato" },
    { name: "Swiggy", logoKey: "logo-swiggy" },
    { name: "CRED", logoKey: "logo-cred" },
    { name: "Flipkart", logoKey: "logo-flipkart" },
    { name: "Meesho", logoKey: "logo-meesho" },
  ],
} as const satisfies LogosConfig;

export const features = {
  heading: "Everything you need to get vouched in",
  headingHighlight: "vouched in",
  sub: "Tailor your resume, find an Insider at the company you want, and send a request that an Insider can act on.",
  cta: { label: brand.ctaGetVouched, href: "/login", target: "route" },
  cards: [
    {
      title: "A resume built for the job",
      body: "Paste a job post and get an ATS-friendly resume tailored to it. Your resume goes only to the Insider you ask, and through them to that company's hiring process.",
      cta: { label: "Explore", href: "#resume", target: "anchor" },
      imageKey: "feature-resume",
      mockKey: "mock-resume",
    },
    {
      title: "Find the Insider",
      body: "See which verified Insiders work at your target company, and what their role is.",
      cta: { label: "Explore", href: "#insiders", target: "anchor" },
      imageKey: "feature-insiders",
      mockKey: "mock-insiders",
    },
    {
      title: "Send an Insider Request",
      body: "Spend credits to ask an Insider to review your profile. They accept or decline within the response window.",
      cta: { label: "Explore", href: "#requests", target: "anchor" },
      imageKey: "feature-requests",
      mockKey: "mock-requests",
    },
    {
      title: "Points for every vouch",
      body: "Insiders earn points once the proof of their vouch is verified. Points can be redeemed for gift cards.",
      cta: { label: "Explore", href: "#rewards", target: "anchor" },
      imageKey: "feature-rewards",
      mockKey: "mock-rewards",
    },
    {
      title: "Start on WhatsApp",
      body: "Share a job post in chat and follow every step from the same thread. No new app to learn.",
      cta: { label: "Explore", href: "#whatsapp", target: "anchor" },
      imageKey: "feature-whatsapp",
      mockKey: "mock-whatsapp",
    },
  ],
} as const satisfies FeaturesConfig;

export const bento = {
  headingSans: "Everything we built",
  headingSerif: "fixes the hiring backdoor",
  sub: "Sifarish was always the shortcut. We made the process visible, fair and traceable.",
  liveFeed: {
    title: "How a request moves",
    body: "An example of the steps every Insider Request goes through.",
    placeholder: true, // placeholder: example rows, not live data
    rows: [
      { label: "INSIDER ACCEPTED", detail: "SDE-2 AT A FINTECH, BENGALURU", tone: "green" },
      { label: "REQUEST SENT", detail: "DATA ANALYST AT AN EDTECH, HYDERABAD", tone: "neutral" },
      { label: "INSIDER REVIEWING", detail: "SENIOR ANALYST AT A BROKING FIRM, MUMBAI", tone: "orange" },
      { label: "VOUCH SUBMITTED", detail: "PRODUCT MANAGER AT A QUICK-COMMERCE APP, GURUGRAM", tone: "indigo" },
      { label: "PROOF UPLOADED", detail: "BACKEND ENGINEER AT A PAYMENTS COMPANY, PUNE", tone: "green" },
      { label: "POINTS CREDITED", detail: "AFTER THE PROOF WAS VERIFIED", tone: "indigo" },
      { label: "REQUEST DECLINED", detail: "UX DESIGNER AT A SAAS COMPANY, DELHI NCR", tone: "neutral" },
      { label: "SEEKER MATCHED", detail: "MARKETING LEAD AT A D2C BRAND, MUMBAI", tone: "green" },
    ],
  },
  stats: {
    title: "The network so far",
    body: "Seekers, Insiders and vouches across companies in India.",
    placeholder: true, // placeholder: real values come from app_config
    items: [
      { value: 25000, suffix: "+", label: "Seekers in the network" },
      { value: 1200, suffix: "+", label: "Verified Insiders" },
      { value: 300, suffix: "+", label: "Companies with an Insider" },
    ],
  },
  purposeBuilt: {
    title: "Purpose-built for India",
    body: "Built for the way hiring already works here, in the chats and companies you know.",
    phrases: [
      "Find an Insider at a fintech in Bengaluru...",
      "Send an Insider Request to a product team in Pune...",
      "Get vouched in for a role you have been eyeing...",
      "Earn points when a verified vouch lands...",
    ],
  },
  evolve: {
    title: "Track every request in one place",
    body: "See each Insider Request you send, from the first reply to the final vouch.",
  },
  chip: {
    title: "Your resume, your call",
    body: "Your resume goes only to the Insider you ask, and through them to that company's hiring process.",
  },
} as const satisfies BentoConfig;

export const network = {
  headingSans: "Explore a universe of",
  headingSerif: "opportunities.",
  sub: "Real people. Real insights. Real opportunities.",
  placeholder: true, // placeholder: sample people at example companies, not live Insiders
  filterHeading: "Explore by field",
  allLabel: "All companies",
  fields: networkFields,
  mapLabel:
    "An illustrated map with you in the centre, companies around you, and the sample Insiders who work at each.",
  seekerLabel: "You",
  disclaimer: `Sample profiles shown for illustration. Logos are trademarks of their respective owners. ${brand.name} is not affiliated with or endorsed by these companies.`,
  matchLabel: "role match",
  yearsLabel: "years",
  // Alternates companies that have a logo file with ones shown as a wordmark.
  companies: [
    { id: "razorpay", name: "Razorpay", logoKey: "logo-razorpay" },
    { id: "swiggy", name: "Swiggy", logoKey: "logo-swiggy" },
    { id: "phonepe", name: "PhonePe", logoKey: "logo-phonepe" },
    { id: "zomato", name: "Zomato", logoKey: "logo-zomato" },
    { id: "zerodha", name: "Zerodha", logoKey: "logo-zerodha" },
    { id: "groww", name: "Groww", logoKey: "logo-groww" },
    { id: "freshworks", name: "Freshworks", logoKey: "logo-freshworks" },
  ],
  people: [
    { id: "priya", name: "Priya S.", role: "Senior PM", years: 5, field: "Product", companyId: "razorpay", match: 91, look: { skin: 1, hair: "long" } },
    { id: "arjun", name: "Arjun M.", role: "SDE-2", years: 4, field: "Engineering", companyId: "razorpay", match: 86, look: { skin: 2, hair: "short", glasses: true } },
    { id: "neha", name: "Neha K.", role: "Product Designer", years: 6, field: "Design", companyId: "phonepe", match: 88, look: { skin: 0, hair: "bun" } },
    { id: "rohan", name: "Rohan P.", role: "Backend Engineer", years: 3, field: "Engineering", companyId: "phonepe", match: 84, look: { skin: 3, hair: "short" } },
    { id: "ananya", name: "Ananya R.", role: "Data Analyst", years: 4, field: "Data", companyId: "zomato", match: 90, look: { skin: 2, hair: "curly" } },
    { id: "vikram", name: "Vikram T.", role: "Growth Lead", years: 7, field: "Marketing", companyId: "zomato", match: 79, look: { skin: 1, hair: "short", glasses: true } },
    { id: "isha", name: "Isha G.", role: "Product Manager", years: 5, field: "Product", companyId: "zerodha", match: 87, look: { skin: 0, hair: "long", glasses: true } },
    { id: "karan", name: "Karan D.", role: "Staff Engineer", years: 9, field: "Engineering", companyId: "zerodha", match: 82, look: { skin: 3, hair: "short" } },
    { id: "meera", name: "Meera N.", role: "UX Researcher", years: 4, field: "Design", companyId: "groww", match: 85, look: { skin: 2, hair: "bun", glasses: true } },
    { id: "sahil", name: "Sahil B.", role: "Data Scientist", years: 6, field: "Data", companyId: "freshworks", match: 89, look: { skin: 4, hair: "curly" } },
    { id: "divya", name: "Divya L.", role: "Brand Manager", years: 5, field: "Marketing", companyId: "swiggy", match: 80, look: { skin: 1, hair: "long" } },
    { id: "aman", name: "Aman J.", role: "Associate PM", years: 3, field: "Product", companyId: "swiggy", match: 83, look: { skin: 3, hair: "short", glasses: true } },
  ],
} as const satisfies NetworkConfig;

export const counter = {
  statement: "Already on the list",
  value: 25000,
  from: 24000,
  caption: "Seekers and Insiders on the waitlist so far.",
  placeholder: true, // placeholder: real value comes from app_config
} as const satisfies CounterConfig;

export const faq = {
  headingSans: "Frequently",
  headingSerif: "asked questions",
  sub: "Short answers to what people ask first.",
  contact: {
    title: "Still have questions?",
    body: "Write to us and a real person will reply.",
    cta: { label: "Email us", href: `mailto:hello@${brand.domain}`, target: "mailto" },
  },
  items: [
    {
      q: "Is it free to start?",
      a: "Yes. Creating an account and generating your first tailored resume is free. Insider Requests use credits, which you buy separately.",
    },
    {
      q: "How are Insiders verified?",
      a: "Insiders sign up with their work email at the company they are part of. We check that the email domain matches the company before an Insider can accept any request.",
    },
    {
      q: "What are credits, and what if an Insider declines or does not respond?",
      a: "Credits are what you spend to send an Insider Request. If the Insider declines, or does not respond within the response window, the credits for that request are refunded to your balance as per our refund policy.",
    },
    {
      q: "How do Insiders earn points?",
      a: "Insiders earn points once the proof of their vouch is verified. Points are released in stages and can be redeemed for gift cards.",
    },
    // Legal review: the Insider submits the resume into the company's hiring process.
    {
      q: "Who can see my resume?",
      a: "Your resume goes only to the Insider you ask, and through them to that company's hiring process.",
      needsLegalReview: true,
    },
    {
      q: "How does WhatsApp work?",
      a: "Start on WhatsApp, share the job post you want, and we reply with your tailored resume. You can follow each Insider Request from the same chat.",
    },
    {
      q: "What does vouch mean?",
      a: "A vouch is when an Insider submits you internally for the role. It is their recommendation on your behalf, made through the company's own hiring process.",
    },
  ],
} as const satisfies FaqConfig;

export const footer = {
  headingSerif: "Your next role",
  headingSans: "Starts here.",
  sub: "Get a tailored resume, find an Insider, and get vouched in.",
  cta: { label: brand.ctaGetVouched, href: "/login", target: "route" },
  columns: [
    {
      title: "Product",
      links: [
        { label: "Resume tailoring", href: "#resume", target: "anchor" },
        { label: "Find an Insider", href: "#insiders", target: "anchor" },
        { label: "Insider Requests", href: "#requests", target: "anchor" },
        { label: "Insider Rewards", href: "#rewards", target: "anchor" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "For Insiders", href: "/for-insiders", target: "route" },
        { label: "FAQ", href: "#faq", target: "anchor" },
        { label: "LinkedIn", href: brand.social.linkedin, target: "external" },
        { label: "Instagram", href: brand.social.instagram, target: "external" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "/privacy", target: "route" },
        { label: "Terms", href: "/terms", target: "route" },
      ],
    },
  ],
  wordmark: brand.name,
} as const satisfies FooterConfig;

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

export type NavDropdownItem = Extract<NavLink, { kind: "dropdown" }>["items"][number];
export type HeroSlide = (typeof heroSlides)[number];
export type FeatureCard = (typeof features.cards)[number];
export type FeedRow = (typeof bento.liveFeed.rows)[number];
export type FaqItem = (typeof faq.items)[number];
export type FooterColumnConfig = (typeof footer.columns)[number];

import { brand } from "./brand";

// Typed content for the landing page. Every section reads from this file.
// Business numbers (response window, tranche count, prices, credit costs) are
// owned by app_config. Anything that mentions one is a placeholder here.

export const nav = {
  links: [
    {
      label: "How it works",
      href: "#how-it-works",
      items: [
        {
          number: "01",
          name: "Resume tailoring",
          oneLiner: "A free, ATS-friendly resume for every job post.",
          href: "#resume",
        },
        {
          number: "02",
          name: "Find an Insider",
          oneLiner: "Find the people who already work at your target company.",
          href: "#insiders",
        },
        {
          number: "03",
          name: "Insider Requests",
          oneLiner: "Ask a verified Insider to submit you internally.",
          href: "#requests",
        },
        {
          number: "04",
          name: "Insider Rewards",
          oneLiner: "Insiders earn points for every vouch that lands.",
          href: "#rewards",
        },
        {
          number: "05",
          name: "Start on WhatsApp",
          oneLiner: "Begin the whole flow in the chat you already use.",
          href: "#whatsapp",
        },
        {
          number: "06",
          name: "For Insiders",
          oneLiner: "Verify your company email and start earning points.",
          href: "/for-insiders",
        },
      ],
    },
    { label: "For Insiders", href: "/for-insiders" },
    { label: "FAQ", href: "#faq" },
  ],
  cta: { label: brand.ctaGetVouched, href: "/login" },
} as const;

export const wordmark = {
  text: `${brand.ctaGetVouched}.`,
} as const;

export const heroSlides = [
  {
    id: "resume",
    number: "01",
    label: "Resume",
    title: "A resume tailored to every job.",
    imageKey: "hero-resume",
    href: "/login",
  },
  {
    id: "find-insider",
    number: "02",
    label: "Find an Insider",
    title: "Find the Insider inside.",
    imageKey: "hero-find-insider",
    href: "/login",
  },
  {
    id: "request",
    number: "03",
    label: "Insider Request",
    title: "Send a request that gets read.",
    imageKey: "hero-request",
    href: "/login",
  },
  {
    id: "vouch",
    number: "04",
    label: "Vouch",
    title: "Get vouched in, not ghosted.",
    imageKey: "hero-vouch",
    href: "/for-insiders",
  },
  {
    id: "rewards",
    number: "05",
    label: "Rewards",
    title: "Earn points for every vouch.",
    imageKey: "hero-rewards",
    href: "/for-insiders",
  },
  {
    id: "whatsapp",
    number: "06",
    label: "WhatsApp",
    title: "Start the whole thing on WhatsApp.",
    imageKey: "hero-whatsapp",
    href: "/login",
  },
] as const;

export const logos = {
  heading: "Insiders work at",
  disclaimer: `Logos are trademarks of their respective owners. ${brand.name} is not affiliated with or endorsed by these companies.`,
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
} as const;

export const features = {
  heading: "Everything you need to get vouched in",
  sub: "Tailor your resume, find an Insider at the company you want, and send a request that an Insider can act on.",
  cta: { label: brand.ctaGetVouched, href: "/login" },
  cards: [
    {
      title: "A resume built for the job",
      body: "Paste a job post and get an ATS-friendly resume tailored to it. The first one is free.",
      cta: { label: "Explore", href: "#resume" },
      imageKey: "feature-resume",
      mockKey: "mock-resume",
    },
    {
      title: "Find the Insider",
      body: "See which verified Insiders work at your target company, and what their role is.",
      cta: { label: "Explore", href: "#insiders" },
      imageKey: "feature-insiders",
      mockKey: "mock-insiders",
    },
    {
      title: "Send an Insider Request",
      body: "Spend credits to ask an Insider to review your profile. They accept or decline within the response window.",
      cta: { label: "Explore", href: "#requests" },
      imageKey: "feature-requests",
      mockKey: "mock-requests",
    },
    {
      title: "Points for every vouch",
      body: "Insiders earn points when they submit a Seeker internally and upload proof. Points can be redeemed for gift cards.",
      cta: { label: "Explore", href: "#rewards" },
      imageKey: "feature-rewards",
      mockKey: "mock-rewards",
    },
    {
      title: "Start on WhatsApp",
      body: "Share a job post in chat and follow every step from the same thread. No new app to learn.",
      cta: { label: "Explore", href: "#whatsapp" },
      imageKey: "feature-whatsapp",
      mockKey: "mock-whatsapp",
    },
  ],
} as const;

export const bento = {
  headingSans: "Everything we built",
  headingSerif: "fixes the hiring backdoor",
  sub: "Sifarish was always the shortcut. We made the process visible, fair and traceable.",
  liveFeed: {
    title: "Live activity",
    body: "Every Insider Request moves through clear states, so you always know where yours stands.",
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
    placeholder: true,
    // placeholder: real values come from app_config
    items: [
      { value: "25K+", label: "Seekers in the network" },
      { value: "1.2K+", label: "Verified Insiders" },
      { value: "300+", label: "Companies with an Insider" },
    ],
  },
  purposeBuilt: {
    title: "Purpose-built for India",
    body: "Built for the way hiring already works here, in the chats and companies you know.",
    phrases: [
      "Find an Insider at Razorpay...",
      "Send an Insider Request to a PhonePe engineer...",
      "Get vouched in for a Zerodha role...",
      "Earn points when your vouch lands...",
    ],
  },
  evolve: {
    title: "Gets sharper with every request",
    body: "Each accepted request and each piece of proof helps us match Seekers with the right Insiders faster.",
  },
  chip: {
    title: "Your resume, your call",
    body: "Your tailored resume is shared only with the Insider you ask. You decide what goes out.",
  },
} as const;

export const counter = {
  statement: "Vouches made so far",
  value: 25000,
  from: 24000,
  caption: "Live count from the Insider network.",
  placeholder: true, // placeholder: real value comes from app_config
} as const;

export const faq = {
  headingSans: "Frequently",
  headingSerif: "asked questions",
  sub: "Short answers to what people ask first.",
  contact: {
    title: "Still have questions?",
    body: "Write to us and a real person will reply.",
    cta: { label: "Email us", href: `mailto:hello@${brand.domain}` },
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
      a: "Credits are what you spend to send an Insider Request. If the Insider declines, or does not respond within the response window, the credits for that request come back to your balance.",
    },
    {
      q: "How do Insiders earn points?",
      a: "Insiders earn points when they submit a Seeker internally and then upload proof of the submission. Points are released in stages and can be redeemed for gift cards.",
    },
    // confirm wording with legal before launch
    {
      q: "Who can see my resume?",
      a: "Only the Insider you send a request to sees your tailored resume for that job. Your resume is not shared with anyone else.",
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
} as const;

export const footer = {
  headingSerif: "Your next role",
  headingSans: "Starts here.",
  sub: "Get a tailored resume, find an Insider, and get vouched in.",
  cta: { label: brand.ctaGetVouched, href: "/login" },
  columns: [
    {
      title: "Product",
      links: [
        { label: "Resume tailoring", href: "#resume" },
        { label: "Find an Insider", href: "#insiders" },
        { label: "Insider Requests", href: "#requests" },
        { label: "Insider Rewards", href: "#rewards" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "For Insiders", href: "/for-insiders" },
        { label: "FAQ", href: "#faq" },
        { label: "LinkedIn", href: brand.social.linkedin },
        { label: "Instagram", href: brand.social.instagram },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
    },
  ],
  wordmark: brand.name,
} as const;

export type Nav = typeof nav;
export type NavLink = Nav["links"][number];
export type NavDropdownItem = Nav["links"][0]["items"][number];
export type Wordmark = typeof wordmark;
export type HeroSlide = (typeof heroSlides)[number];
export type Logos = typeof logos;
export type Features = typeof features;
export type FeatureCard = Features["cards"][number];
export type Bento = typeof bento;
export type FeedRow = Bento["liveFeed"]["rows"][number];
export type FeedTone = FeedRow["tone"];
export type Counter = typeof counter;
export type Faq = typeof faq;
export type FaqItem = Faq["items"][number];
export type Footer = typeof footer;

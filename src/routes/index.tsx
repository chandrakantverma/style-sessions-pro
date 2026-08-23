import { createFileRoute, Link } from "@tanstack/react-router";
import { Scissors, Clock, CalendarCheck, ArrowRight, Star, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerRole } from "@/hooks/useOwnerRole";
import heroImage from "@/assets/hero-barbershop.jpg";
import fadeImage from "@/assets/style-fade.jpg";
import beardImage from "@/assets/style-beard.jpg";
import groomingImage from "@/assets/style-grooming.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bladeroom — Book Men's Fades, Beards & Grooming" },
      {
        name: "description",
        content:
          "Bladeroom is a men-only barbershop booking app: pick a hairstyle or grooming theme, choose your chair, and lock a slot in seconds.",
      },
      { property: "og:title", content: "Bladeroom — Book Men's Fades, Beards & Grooming" },
      {
        property: "og:description",
        content: "Men-only barbershop booking with hairstyle and grooming themes.",
      },
    ],
  }),
  component: Home,
});

const THEMES = [
  {
    image: fadeImage,
    overline: "Hairstyle",
    title: "Fades & Crops",
    copy: "Skin fades, textured crops, pompadours and scissor work built around your head shape.",
    tag: "Most booked",
  },
  {
    image: beardImage,
    overline: "Beard & Shave",
    title: "Straight Razor",
    copy: "Hot towel beard sculpts, two-pass wet shaves and weekly line-up upkeep.",
    tag: null,
  },
  {
    image: groomingImage,
    overline: "Beauty",
    title: "Men's Grooming",
    copy: "Charcoal detox facials, grey blending and champi head massage between cuts.",
    tag: null,
  },
];

const STEPS = [
  {
    Icon: Scissors,
    step: "01",
    title: "Choose a service",
    copy: "Every shop lists real prices and durations up front. No surprises at the chair.",
  },
  {
    Icon: Clock,
    step: "02",
    title: "Pick your slot",
    copy: "See live availability, pick a date and time that works, add notes for your barber.",
  },
  {
    Icon: CalendarCheck,
    step: "03",
    title: "Show up & sit down",
    copy: "Walk in knowing your chair is ready. Track, reschedule or cancel any time.",
  },
];

const OWNER_FEATURES = [
  {
    Icon: Zap,
    title: "Live booking dashboard",
    copy: "Approve, reschedule or cancel appointments in one tap. No spreadsheets.",
  },
  {
    Icon: Shield,
    title: "Availability controls",
    copy: "Set your weekly hours, block holidays, and customers only see real open slots.",
  },
  {
    Icon: Star,
    title: "Themed service menus",
    copy: "Organise your menu by Hairstyle, Beard, Grooming and Combo — customers know exactly what they're booking.",
  },
];

function Home() {
  const { user } = useAuth();
  const { isOwner } = useOwnerRole();

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <img
          src={heroImage}
          alt="Dark barbershop interior with a leather chair and straight razor"
          width={1600}
          height={1104}
          className="absolute inset-0 size-full object-cover opacity-45"
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-steel)" }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:py-36">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary">
            Men only · appointment first
          </span>
          <h1 className="mt-5 max-w-2xl text-5xl leading-[0.92] sm:text-7xl">
            Sharp cuts.
            <br />
            <span className="ember-text">Zero waiting room.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base text-muted-foreground">
            Browse hairstyle and grooming themes, pick the chair you trust, and lock your slot.
            Barbershop owners run their whole book on one simple monthly plan.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            {user && isOwner ? (
              // Owner CTA
              <Button asChild size="lg">
                <Link to="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            ) : (
              // Customer / guest CTAs
              <>
                <Button asChild size="lg">
                  <Link to="/shops">
                    Book a chair <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/styles">See the styles</Link>
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <dl className="mt-16 grid max-w-xl grid-cols-3 gap-6 border-t border-border pt-6">
            {[
              ["40s", "To book a slot"],
              ["3", "Themed menus"],
              ["₹499", "Per shop / month"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="display text-3xl text-primary">{value}</dt>
                <dd className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Themes ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex items-end justify-between">
          <div>
            <p className="overline">Themes</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">Pick your look, not a queue</h2>
          </div>
          <Button asChild variant="ghost" size="sm" className="hidden md:flex">
            <Link to="/styles">
              All themes <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {THEMES.map((theme) => (
            <Link
              key={theme.title}
              to="/shops"
              className="group panel relative overflow-hidden rounded-lg"
            >
              {theme.tag && (
                <span className="absolute right-4 top-4 z-10 rounded-full bg-primary px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary-foreground">
                  {theme.tag}
                </span>
              )}
              <img
                src={theme.image}
                alt={theme.title}
                loading="lazy"
                width={800}
                height={1000}
                className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="p-6">
                <p className="overline">{theme.overline}</p>
                <h3 className="mt-2 text-2xl">{theme.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{theme.copy}</p>
                <p className="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  Browse shops <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </p>
              </div>
            </Link>
          ))}
        </div>
        <Button asChild variant="outline" size="sm" className="mt-6 md:hidden">
          <Link to="/styles">
            See all themes <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="overline text-center">How it works</p>
          <h2 className="mt-3 text-center text-4xl sm:text-5xl">Booked in under a minute</h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map(({ Icon, step, title, copy }) => (
              <div key={title} className="relative">
                <div className="flex size-11 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <Icon className="size-5" />
                </div>
                <p className="mt-5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Step {step}
                </p>
                <h3 className="mt-2 text-2xl">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { quote: "Booked my regular fade in 30 seconds. Never going back to walk-ins.", name: "Arjun M.", role: "Regular customer" },
            { quote: "My shop went from WhatsApp chaos to a proper dashboard overnight.", name: "Ravi K.", role: "Shop owner, Mumbai" },
            { quote: "I love knowing exactly what I'm getting — price, duration, everything upfront.", name: "Karan S.", role: "Customer" },
          ].map((t) => (
            <div key={t.name} className="panel rounded-lg p-6">
              <div className="flex gap-0.5 text-primary">
                {[0,1,2,3,4].map((i) => <Star key={i} className="size-3.5 fill-current" />)}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">"{t.quote}"</p>
              <div className="mt-4">
                <p className="text-sm font-bold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Owner CTA ────────────────────────────────────────────────── */}
      {!isOwner && (
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="panel rounded-lg p-8 sm:p-12">
            <p className="overline">For shop owners</p>
            <h2 className="mt-3 max-w-lg text-4xl sm:text-5xl">
              Run your book for ₹499 a month
            </h2>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground">
              Publish your shop, build a themed service menu, and manage every appointment from one
              dashboard. Your customers book online — you focus on the cut.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {OWNER_FEATURES.map(({ Icon, title, copy }) => (
                <div key={title} className="flex gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{copy}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/pricing">
                  See owner plans <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">Start free trial</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Scissors, Clock, CalendarCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  },
  {
    image: beardImage,
    overline: "Beard & Shave",
    title: "Straight Razor",
    copy: "Hot towel beard sculpts, two-pass wet shaves and weekly line-up upkeep.",
  },
  {
    image: groomingImage,
    overline: "Beauty",
    title: "Men's Grooming",
    copy: "Charcoal detox facials, grey blending and champi head massage between cuts.",
  },
];

function Home() {
  return (
    <div>
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
        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
          <p className="overline">Men only · appointment first</p>
          <h1 className="mt-5 max-w-2xl text-5xl leading-[0.92] sm:text-7xl">
            Sharp cuts.
            <br />
            <span className="ember-text">Zero waiting room.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base text-muted-foreground">
            Browse hairstyle and grooming themes, pick the chair you trust, and lock your slot.
            Barbershop owners run the whole book on one monthly plan.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/shops">
                Book a chair <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/styles">See the styles</Link>
            </Button>
          </div>
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

      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="overline">Themes</p>
        <h2 className="mt-3 text-4xl sm:text-5xl">Pick your look, not a queue</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {THEMES.map((theme) => (
            <Link
              key={theme.title}
              to="/styles"
              className="group panel relative overflow-hidden rounded-lg"
            >
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
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-3">
          {[
            [Scissors, "Choose a service", "Every shop lists real prices and durations up front."],
            [Clock, "Lock a time", "Pick a date and slot, add notes for your barber."],
            [CalendarCheck, "Show up", "Track and cancel bookings from your account."],
          ].map(([Icon, title, copy], i) => {
            const IconCmp = Icon as typeof Scissors;
            return (
              <div key={title as string}>
                <div className="flex size-11 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <IconCmp className="size-5" />
                </div>
                <p className="mt-5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Step {i + 1}
                </p>
                <h3 className="mt-2 text-2xl">{title as string}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{copy as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="panel rounded-lg p-8 sm:p-12">
          <p className="overline">For shop owners</p>
          <h2 className="mt-3 max-w-lg text-4xl sm:text-5xl">
            Run your book for ₹499 a month
          </h2>
          <p className="mt-4 max-w-lg text-sm text-muted-foreground">
            Publish your shop, build a themed service menu, and manage every appointment from one
            dashboard. Two weeks free, cancel whenever.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/pricing">
              See owner plans <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

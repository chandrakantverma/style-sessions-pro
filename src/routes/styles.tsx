import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import fadeImage from "@/assets/style-fade.jpg";
import beardImage from "@/assets/style-beard.jpg";
import groomingImage from "@/assets/style-grooming.jpg";

export const Route = createFileRoute("/styles")({
  head: () => ({
    meta: [
      { title: "Men's Hairstyle & Grooming Themes — Bladeroom" },
      {
        name: "description",
        content:
          "Fades, crops, pompadours, straight razor shaves, beard sculpts and men's beauty treatments — browse every Bladeroom theme before you book.",
      },
      { property: "og:title", content: "Men's Hairstyle & Grooming Themes — Bladeroom" },
      {
        property: "og:description",
        content: "Browse hairstyle, beard and men's beauty themes on Bladeroom.",
      },
    ],
  }),
  component: StylesPage,
});

const THEMES = [
  {
    image: fadeImage,
    overline: "Hairstyle",
    title: "Fades & Tapers",
    items: ["Skin fade", "Mid taper", "Burst fade", "Line-up & edge work"],
  },
  {
    image: groomingImage,
    overline: "Hairstyle",
    title: "Classic & Textured",
    items: ["Pompadour", "Textured crop", "Executive scissor cut", "Buzz cut"],
  },
  {
    image: beardImage,
    overline: "Beard & Shave",
    title: "Razor Work",
    items: ["Hot towel beard sculpt", "Two-pass wet shave", "Moustache shaping", "Beard oil finish"],
  },
  {
    image: groomingImage,
    overline: "Beauty",
    title: "Men's Skin & Care",
    items: ["Charcoal detox facial", "Grey blending", "Champi head massage", "Under-eye de-tan"],
  },
];

function StylesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="overline">Themes</p>
      <h1 className="mt-3 text-5xl sm:text-6xl">Hairstyle &amp; beauty menus</h1>
      <p className="mt-4 max-w-xl text-sm text-muted-foreground">
        Every shop on Bladeroom organises its menu into these themes, so you know exactly what
        you&apos;re booking before you sit down.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {THEMES.map((theme) => (
          <article key={theme.title} className="panel overflow-hidden rounded-lg">
            <img
              src={theme.image}
              alt={theme.title}
              loading="lazy"
              width={800}
              height={1000}
              className="h-64 w-full object-cover"
            />
            <div className="p-6">
              <p className="overline">{theme.overline}</p>
              <h2 className="mt-2 text-3xl">{theme.title}</h2>
              <ul className="mt-4 space-y-2">
                {theme.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                  >
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-12">
        <Button asChild size="lg">
          <Link to="/shops">Find a shop near you</Link>
        </Button>
      </div>
    </div>
  );
}

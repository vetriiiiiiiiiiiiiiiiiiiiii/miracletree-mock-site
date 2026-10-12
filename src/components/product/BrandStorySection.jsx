/**
 * The sub-brand's story, on the page where its product is sold — set as
 * Dawn's rich-text section on the secondary background.
 */
export function BrandStorySection({ story }) {
  if (!story) return null;

  return (
    <section id="brand-story" className="dawn-bg-2 dawn-section mt-9">
      <div className="page-width">
        <div className="mx-auto max-w-[45rem] py-6 text-center md:py-10">
          <p className="caption-uc">
            {story.brand} · {story.tagline}
          </p>
          <h2 className="h1 mt-4">{story.lede}</h2>
          <div className="mt-6 space-y-4 text-left md:text-center">
            {story.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
          <blockquote className="mt-8">
            <p className="h3 italic">&ldquo;{story.line}&rdquo;</p>
            <footer className="caption-uc mt-3">MiracleTree Life Science</footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

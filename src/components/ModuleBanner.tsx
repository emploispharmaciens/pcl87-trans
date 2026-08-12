export function ModuleBanner({
  title,
  subtitle,
  icon = "bi-chat-square-text",
}: {
  title: string;
  subtitle: string;
  icon?: string;
}) {
  return (
    <div className="module-banner w-full px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="flex items-center gap-3 text-2xl sm:text-3xl">
          <i className={`bi ${icon}`} aria-hidden="true" />
          {title}
        </h1>
        <p className="mt-1 text-sm opacity-75 sm:text-base">{subtitle}</p>
      </div>
    </div>
  );
}

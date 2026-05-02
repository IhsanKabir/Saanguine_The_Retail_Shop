/**
 * Renders an inline `<script type="application/ld+json">` for SEO structured data.
 * Server component — safe to use inside any page or layout. Pass any JSON-LD
 * shape (Organization, Product, BreadcrumbList, etc.) as `data`.
 */
type Props = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export default function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

import { Helmet } from 'react-helmet-async';
import { SEOMetadata, getOpenGraphTags, getTwitterCardTags, getStructuredData } from '../lib/seo';

interface SEOHeadProps {
  seo: SEOMetadata;
}

export default function SEOHead({ seo }: SEOHeadProps) {
  const ogTags = getOpenGraphTags(seo);
  const twitterTags = getTwitterCardTags(seo);
  const structuredData = getStructuredData(seo);

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{seo.title}</title>
      <meta name="title" content={seo.title} />
      <meta name="description" content={seo.description} />
      {seo.keywords && (
        <meta name="keywords" content={seo.keywords.join(', ')} />
      )}

      {/* Canonical URL */}
      {seo.url && <link rel="canonical" href={seo.url} />}

      {/* Open Graph Tags */}
      <meta property="og:type" content={ogTags['og:type']} />
      <meta property="og:title" content={ogTags['og:title']} />
      <meta property="og:description" content={ogTags['og:description']} />
      {seo.image && <meta property="og:image" content={seo.image} />}
      {seo.url && <meta property="og:url" content={seo.url} />}
      <meta property="og:site_name" content={ogTags['og:site_name']} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterTags['twitter:card']} />
      <meta name="twitter:title" content={twitterTags['twitter:title']} />
      <meta name="twitter:description" content={twitterTags['twitter:description']} />
      {seo.image && <meta name="twitter:image" content={seo.image} />}
      {seo.url && <meta name="twitter:url" content={seo.url} />}

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

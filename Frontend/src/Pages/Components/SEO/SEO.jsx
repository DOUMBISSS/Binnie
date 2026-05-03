import { Helmet } from "react-helmet-async";

const SEO = ({ 
  title, 
  description, 
  canonicalUrl, 
  image, 
  type = "website", 
  publishedTime, 
  author = "Binnie's English Training",
  siteName = "Binnie's English Training",
  twitterCard = "summary_large_image"
}) => {
  const siteUrl = "https://www.bet-formation.com"; // À adapter
  const fullUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;
  const defaultImage = `${siteUrl}/assets/images/og-default.jpg`;

  return (
    <Helmet>
      {/* Balises de base */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />
      <meta name="author" content={author} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || defaultImage} />

      {/* Article (si applicable) */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
    </Helmet>
  );
};

export default SEO;
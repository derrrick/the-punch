import {
  Html,
  Head,
  Body,
  Container,
  Preview,
} from "@react-email/components";
import {
  EmailHeader,
  EmailFooter,
  FoundryFeature,
  QuickLinks,
  IntroText,
} from "./components";

// Types for newsletter data
export interface FeaturedFoundry {
  id: string;
  name: string;
  slug: string;
  location: string;
  description: string;
  typefaces: string[];
  imageUrl?: string;
  url: string;
  styleTags: string[];
}

export interface QuickLinkItem {
  title: string;
  url: string;
  description?: string;
}

export interface NewsletterData {
  issueNumber: string;
  subject: string;
  introHeadline?: string;
  introBody: string;
  featuredFoundries: FeaturedFoundry[];
  quickLinks?: {
    title: string;
    links: QuickLinkItem[];
  };
  unsubscribeUrl: string;
}

type ThePunchWeeklyProps = NewsletterData;

export default function ThePunchWeekly({
  issueNumber,
  subject,
  introHeadline,
  introBody,
  featuredFoundries,
  quickLinks,
  unsubscribeUrl,
}: ThePunchWeeklyProps) {
  return (
    <Html>
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <style>
          {`
            @media only screen and (max-width: 600px) {
              .container {
                width: 100% !important;
                max-width: 100% !important;
                padding: 20px !important;
              }
            }
          `}
        </style>
      </Head>
      <Preview>{subject}</Preview>
      <Body
        style={{
          backgroundColor: "#fafafa",
          margin: 0,
          padding: "40px 20px",
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <Container
          className="container"
          style={{
            backgroundColor: "#ffffff",
            maxWidth: "600px",
            margin: "0 auto",
            padding: "40px",
            borderRadius: "8px",
          }}
        >
          <EmailHeader issueNumber={issueNumber} />

          <IntroText headline={introHeadline} body={introBody} />

          {/* Featured Foundries */}
          {featuredFoundries.map((foundry) => (
            <FoundryFeature
              key={foundry.id}
              name={foundry.name}
              location={foundry.location}
              description={foundry.description}
              typefaces={foundry.typefaces}
              imageUrl={foundry.imageUrl}
              foundryUrl={foundry.url}
              styleTags={foundry.styleTags}
            />
          ))}

          {/* Quick Links Section */}
          {quickLinks && quickLinks.links.length > 0 && (
            <QuickLinks title={quickLinks.title} links={quickLinks.links} />
          )}

          <EmailFooter unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  );
}

// Default props for preview
ThePunchWeekly.defaultProps = {
  issueNumber: "01",
  subject: "The Punch Weekly — Swiss Typography Spotlight",
  introHeadline: "This week: Swiss precision meets contemporary expression",
  introBody:
    "We've been exploring the new wave of Swiss type designers who are reinterpreting the clean, grid-based tradition for the digital age. From revivalist grotesks to experimental variable fonts, these foundries honor their heritage while pushing boundaries.",
  featuredFoundries: [
    {
      id: "1",
      name: "Grilli Type",
      slug: "grilli-type",
      location: "Lucerne, Switzerland",
      description:
        "Grilli Type has established itself as one of the most influential independent foundries of the past decade. Their GT America seamlessly bridges the gap between grotesque and geometric sans-serifs, while GT Super brings warmth to the serif category with its sharp, calligraphic details.",
      typefaces: ["GT America", "GT Super", "GT Alpina", "GT Walsheim"],
      imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=300&fit=crop",
      url: "https://thepunch.studio/foundry/grilli-type",
      styleTags: ["Swiss", "Grotesk", "Contemporary"],
    },
    {
      id: "2",
      name: "Optimo",
      slug: "optimo",
      location: "Geneva, Switzerland",
      description:
        "Optimo's approach to type design is deeply rooted in Swiss graphic design history, yet never feels retro. Their typefaces like Theinhardt and Plain speak a clear, functional language while offering surprising nuances that reveal themselves at larger sizes.",
      typefaces: ["Theinhardt", "Plain", "Lineal", "Cargo"],
      imageUrl: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&h=300&fit=crop",
      url: "https://thepunch.studio/foundry/optimo",
      styleTags: ["Swiss", "Modernist", "Clean"],
    },
  ],
  quickLinks: {
    title: "More to Explore",
    links: [
      {
        title: "The Complete Guide to Swiss Typography",
        url: "https://thepunch.studio/guide/swiss-typography",
        description: "From Müller-Brockmann to the present day",
      },
      {
        title: "Variable Fonts Database",
        url: "https://thepunch.studio/variable-fonts",
        description: "Discover the latest in responsive type",
      },
      {
        title: "Submit Your Foundry",
        url: "https://thepunch.studio/submit",
        description: "Join our growing directory",
      },
    ],
  },
  unsubscribeUrl: "{{unsubscribe_url}}",
};

import { Text, Section, Row, Column, Link, Img } from "@react-email/components";

interface FoundryFeatureProps {
  name: string;
  location: string;
  description: string;
  typefaces: string[];
  imageUrl?: string;
  foundryUrl: string;
  styleTags?: string[];
}

export function FoundryFeature({
  name,
  location,
  description,
  typefaces,
  imageUrl,
  foundryUrl,
  styleTags = [],
}: FoundryFeatureProps) {
  return (
    <Section style={{ marginBottom: "40px" }}>
      {/* Image */}
      {imageUrl && (
        <Row>
          <Column>
            <Link href={foundryUrl} style={{ textDecoration: "none" }}>
              <Img
                src={imageUrl}
                alt={`${name} featured work`}
                width="100%"
                style={{
                  borderRadius: "4px",
                  marginBottom: "20px",
                  display: "block",
                }}
              />
            </Link>
          </Column>
        </Row>
      )}

      {/* Style Tags */}
      {styleTags.length > 0 && (
        <Row>
          <Column>
            <table cellPadding="0" cellSpacing="0" style={{ marginBottom: "12px" }}>
              <tr>
                {styleTags.slice(0, 3).map((tag) => (
                  <td
                    key={tag}
                    style={{
                      padding: "4px 10px",
                      backgroundColor: "#f5f5f5",
                      borderRadius: "12px",
                      marginRight: "6px",
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#525252",
                    }}
                  >
                    {tag}
                  </td>
                ))}
              </tr>
            </table>
          </Column>
        </Row>
      )}

      {/* Foundry Name */}
      <Row>
        <Column>
          <Link
            href={foundryUrl}
            style={{
              textDecoration: "none",
              color: "#171717",
            }}
          >
            <Text
              style={{
                fontSize: "24px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: "0 0 4px 0",
                lineHeight: 1.2,
              }}
            >
              {name}
            </Text>
          </Link>
        </Column>
      </Row>

      {/* Location */}
      <Row>
        <Column>
          <Text
            style={{
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#737373",
              margin: "0 0 16px 0",
            }}
          >
            {location}
          </Text>
        </Column>
      </Row>

      {/* Description */}
      <Row>
        <Column>
          <Text
            style={{
              fontSize: "15px",
              lineHeight: 1.6,
              color: "#404040",
              margin: "0 0 16px 0",
            }}
          >
            {description}
          </Text>
        </Column>
      </Row>

      {/* Notable Typefaces */}
      {typefaces.length > 0 && (
        <Row>
          <Column>
            <table cellPadding="0" cellSpacing="0" style={{ marginBottom: "20px" }}>
              <tr>
                <td>
                  <Text
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#a3a3a3",
                      margin: "0 8px 0 0",
                      display: "inline",
                    }}
                  >
                    Notable:
                  </Text>
                </td>
                <td>
                  <Text
                    style={{
                      fontSize: "14px",
                      fontStyle: "italic",
                      color: "#525252",
                      margin: 0,
                    }}
                  >
                    {typefaces.slice(0, 4).join(" · ")}
                  </Text>
                </td>
              </tr>
            </table>
          </Column>
        </Row>
      )}

      {/* CTA Button */}
      <Row>
        <Column>
          <table cellPadding="0" cellSpacing="0">
            <tr>
              <td
                style={{
                  backgroundColor: "#171717",
                  borderRadius: "4px",
                }}
              >
                <Link
                  href={foundryUrl}
                  style={{
                    display: "inline-block",
                    padding: "12px 24px",
                    color: "#ffffff",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  Explore Foundry
                </Link>
              </td>
            </tr>
          </table>
        </Column>
      </Row>
    </Section>
  );
}

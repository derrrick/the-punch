import { Text, Section, Link } from "@react-email/components";

interface QuickLink {
  title: string;
  url: string;
  description?: string;
}

interface QuickLinksProps {
  title: string;
  links: QuickLink[];
}

export function QuickLinks({ title, links }: QuickLinksProps) {
  return (
    <Section style={{ marginBottom: "40px" }}>
      {/* Section Header */}
      <table cellPadding="0" cellSpacing="0" width="100%" style={{ borderBottom: "1px solid #e5e5e5", marginBottom: "20px" }}>
        <tr>
          <td style={{ paddingBottom: "12px" }}>
            <Text
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#737373",
                margin: 0,
                fontWeight: 500,
              }}
            >
              {title}
            </Text>
          </td>
        </tr>
      </table>

      {/* Links List */}
      {links.map((link, index) => (
        <table
          key={index}
          cellPadding="0"
          cellSpacing="0"
          width="100%"
          style={{
            marginBottom: index < links.length - 1 ? "16px" : 0,
            paddingBottom: index < links.length - 1 ? "16px" : 0,
            borderBottom: index < links.length - 1 ? "1px solid #f0f0f0" : "none",
          }}
        >
          <tr>
            <td>
              <Link
                href={link.url}
                style={{
                  textDecoration: "none",
                  color: "#171717",
                  display: "block",
                }}
              >
                <Text
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    margin: "0 0 4px 0",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {link.title}
                </Text>
                {link.description && (
                  <Text
                    style={{
                      fontSize: "13px",
                      color: "#737373",
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {link.description}
                  </Text>
                )}
              </Link>
            </td>
            <td style={{ width: "24px", textAlign: "right", verticalAlign: "middle" }}>
              <Text
                style={{
                  fontSize: "18px",
                  color: "#a3a3a3",
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                →
              </Text>
            </td>
          </tr>
        </table>
      ))}
    </Section>
  );
}

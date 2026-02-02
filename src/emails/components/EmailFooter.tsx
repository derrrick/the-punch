import { Text, Section, Row, Column, Link } from "@react-email/components";

interface EmailFooterProps {
  unsubscribeUrl?: string;
}

export function EmailFooter({ unsubscribeUrl = "#" }: EmailFooterProps) {
  return (
    <Section style={{ marginTop: "48px" }}>
      {/* Divider */}
      <table cellPadding="0" cellSpacing="0" width="100%" style={{ borderTop: "1px solid #e5e5e5", marginBottom: "32px" }}>
        <tr><td></td></tr>
      </table>

      <Row>
        <Column>
          {/* Brand */}
          <Text
            style={{
              fontSize: "18px",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              margin: "0 0 8px 0",
              color: "#171717",
            }}
          >
            The Punch
          </Text>
          <Text
            style={{
              fontSize: "13px",
              color: "#737373",
              margin: "0 0 24px 0",
              lineHeight: 1.5,
            }}
          >
            A curated directory of independent type foundries.
            <br />
            Discover the designers behind your favorite fonts.
          </Text>

          {/* Links */}
          <table cellPadding="0" cellSpacing="0" style={{ marginBottom: "24px" }}>
            <tr>
              <td style={{ paddingRight: "16px" }}>
                <Link
                  href="https://thepunch.studio"
                  style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#171717",
                    textDecoration: "none",
                  }}
                >
                  Visit Directory
                </Link>
              </td>
              <td style={{ paddingRight: "16px" }}>
                <Link
                  href="https://thepunch.studio/submit"
                  style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#171717",
                    textDecoration: "none",
                  }}
                >
                  Submit Foundry
                </Link>
              </td>
            </tr>
          </table>

          {/* Unsubscribe */}
          <Text
            style={{
              fontSize: "11px",
              color: "#a3a3a3",
              margin: "0 0 8px 0",
              lineHeight: 1.5,
            }}
          >
            You received this because you subscribed to The Punch Weekly.
            <br />
            <Link
              href={unsubscribeUrl}
              style={{
                color: "#737373",
                textDecoration: "underline",
              }}
            >
              Unsubscribe
            </Link>
            {" "}&middot;{" "}
            <Link
              href="https://thepunch.studio"
              style={{
                color: "#737373",
                textDecoration: "underline",
              }}
            >
              View in browser
            </Link>
          </Text>

          {/* Address */}
          <Text
            style={{
              fontSize: "11px",
              color: "#a3a3a3",
              margin: 0,
            }}
          >
            © {new Date().getFullYear()} The Punch
          </Text>
        </Column>
      </Row>
    </Section>
  );
}

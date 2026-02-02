import { Text, Section, Row, Column } from "@react-email/components";

interface EmailHeaderProps {
  issueNumber?: string;
  date?: string;
}

export function EmailHeader({ issueNumber = "01", date }: EmailHeaderProps) {
  const formattedDate = date || new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Section style={{ marginBottom: "32px" }}>
      <Row>
        <Column>
          {/* Logo / Title */}
          <Text
            style={{
              fontSize: "32px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: "0 0 8px 0",
              color: "#171717",
              lineHeight: 1.1,
            }}
          >
            The Punch
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: "#525252",
              margin: "0 0 24px 0",
              letterSpacing: "0.02em",
            }}
          >
            Typography, organized by who made it
          </Text>

          {/* Issue & Date Bar */}
          <table cellPadding="0" cellSpacing="0" width="100%" style={{ borderTop: "1px solid #e5e5e5", borderBottom: "1px solid #e5e5e5" }}>
            <tr>
              <td style={{ padding: "12px 0" }}>
                <table cellPadding="0" cellSpacing="0" width="100%">
                  <tr>
                    <td style={{ width: "50%" }}>
                      <Text
                        style={{
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.15em",
                          color: "#737373",
                          margin: 0,
                        }}
                      >
                        Weekly Issue {issueNumber}
                      </Text>
                    </td>
                    <td style={{ width: "50%", textAlign: "right" }}>
                      <Text
                        style={{
                          fontSize: "12px",
                          color: "#737373",
                          margin: 0,
                        }}
                      >
                        {formattedDate}
                      </Text>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </Column>
      </Row>
    </Section>
  );
}

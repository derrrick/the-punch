import { Text, Section, Row, Column } from "@react-email/components";

interface IntroTextProps {
  headline?: string;
  body: string;
}

export function IntroText({ headline, body }: IntroTextProps) {
  return (
    <Section style={{ marginBottom: "40px" }}>
      <Row>
        <Column>
          {headline && (
            <Text
              style={{
                fontSize: "20px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: "0 0 16px 0",
                lineHeight: 1.3,
                color: "#171717",
              }}
            >
              {headline}
            </Text>
          )}
          <Text
            style={{
              fontSize: "15px",
              lineHeight: 1.7,
              color: "#404040",
              margin: 0,
            }}
          >
            {body}
          </Text>
        </Column>
      </Row>
    </Section>
  );
}

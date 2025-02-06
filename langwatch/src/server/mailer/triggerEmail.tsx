import { Column, Link, Row, Section } from "@react-email/components";
import { Container } from "@react-email/container";
import { Heading } from "@react-email/heading";
import { Html } from "@react-email/html";
import { Img } from "@react-email/img";
import { render } from "@react-email/render";
import { sendEmail } from "./emailSender";

import { env } from "../../env.mjs";
import type { AlertType } from "@prisma/client";

interface TriggerData {
  traceId: string;
}

export const sendTriggerEmail = async ({
  triggerEmails,
  triggerData,
  triggerName,
  projectSlug,
  triggerType,
  triggerMessage,
}: {
  triggerEmails: string[];
  triggerData: TriggerData[];
  triggerName: string;
  projectSlug: string;
  triggerType: AlertType | null;
  triggerMessage: string;
}) => {
  const emailHtml = render(
    <Html lang="en" dir="ltr">
      <Container
        style={{
          border: "1px solid #F2F4F8",
          borderRadius: "10px",
          padding: "24px",
          paddingBottom: "12px",
        }}
      >
        <Img
          src="https://app.langwatch.ai/images/logo-icon.png"
          alt="LangWatch Logo"
          width="36"
        />
        <Heading as="h1">
          {triggerType ? `(${triggerType}) ` : ""}LangWatch Trigger
        </Heading>
        <Heading as="h3">{triggerName}</Heading>
        <p>
          This is an automated email generated by your configured triggers.
          Below, you will find the messages that initiated this action.
        </p>
        {triggerMessage && <p>{triggerMessage}</p>}
        <TriggerTable triggerData={triggerData} projectSlug={projectSlug} />
      </Container>
    </Html>
  );

  await sendEmail({
    to: triggerEmails,
    subject: `${
      triggerType ? `(${triggerType}) ` : ""
    }Trigger - ${triggerName}`,
    html: emailHtml,
  });
};

const TriggerTable = ({
  triggerData,
  projectSlug,
}: {
  triggerData: TriggerData[];
  projectSlug: string;
}) => {
  return (
    <Section>
      {triggerData.slice(0, 10).map((data, index) => (
        <Row key={index}>
          <Column>
            <Link
              href={`${env.BASE_HOST}/${projectSlug}/messages/${data.traceId}`}
            >
              {data.traceId}
            </Link>
          </Column>
        </Row>
      ))}
    </Section>
  );
};

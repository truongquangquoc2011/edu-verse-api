import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import * as React from 'react'

interface OTPEmailProps {
  code: string
  title: string
}

export default function OTPEmail({ code, title }: OTPEmailProps) {
  return (
    <Html>
      <Head>
        <title>{title}</title>
      </Head>
      <Body style={main}>
        <Preview>Mã xác thực từ nền tảng học trực tuyến Elearning</Preview>
        <Container style={container}>
          <Section style={coverSection}>
            <Section style={headerSection}>
              <Text style={brandText}>Elearning - Nền tảng học trực tuyến</Text>
            </Section>
            <Section style={contentSection}>
              <Heading style={h1}>📚 Xác thực địa chỉ email của bạn</Heading>
              <Text style={mainText}>
                Cảm ơn bạn đã đăng ký học tập trên hệ thống Elearning! Vui lòng nhập mã xác thực bên dưới để hoàn tất quá trình đăng ký và bắt đầu học ngay.
              </Text>
              <Section style={codeContainer}>
                <Text style={codeText}>{code}</Text>
              </Section>
              <Text style={validityText}>🔐 Mã xác thực có hiệu lực trong 10 phút</Text>
            </Section>
            <Hr style={divider} />
            <Section style={footerSection}>
              <Text style={footerText}>
                © Elearning.vn. Giúp bạn tiếp cận kiến thức dễ dàng mọi lúc, mọi nơi. Học tập không giới hạn!
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// OTPEmail.PreviewProps = {
//   code: '596853',
//   title: 'MovieStream - Xác thực Email',
// } satisfies OTPEmailProps

const main = {
  backgroundColor: '#f5f5f5',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  padding: '20px',
  margin: '0 auto',
  maxWidth: '480px',
}

const coverSection = {
  backgroundColor: '#ffffff',
  borderRadius: '4px',
  border: '1px solid #e0e0e0',
  overflow: 'hidden',
}

const headerSection = {
  backgroundColor: '#000000',
  padding: '20px',
  textAlign: 'center' as const,
}

const brandText = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0',
  letterSpacing: '0.5px',
}

const contentSection = {
  padding: '25px',
  textAlign: 'center' as const,
}

const h1 = {
  color: '#000000',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 12px 0',
}

const mainText = {
  color: '#333333',
  fontSize: '14px',
  margin: '0 0 20px 0',
  lineHeight: '1.4',
}

const codeContainer = {
  backgroundColor: '#f8f8f8',
  border: '2px solid #000000',
  borderRadius: '4px',
  padding: '15px',
  margin: '15px 0',
}

const codeText = {
  color: '#000000',
  fontWeight: 'bold',
  fontSize: '32px',
  margin: '0',
  textAlign: 'center' as const,
  letterSpacing: '3px',
  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
}

const validityText = {
  color: '#666666',
  fontSize: '12px',
  margin: '10px 0 0 0',
}

const footerSection = {
  padding: '15px 25px',
  backgroundColor: '#f8f8f8',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#666666',
  fontSize: '12px',
  margin: '0',
}

const divider = {
  borderColor: '#e0e0e0',
  margin: '0',
}

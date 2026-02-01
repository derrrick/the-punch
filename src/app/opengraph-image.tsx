import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'edge';
export const alt = 'The Punch — A curated directory of independent type foundries';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  // Read the logo SVG file
  const logoSvg = readFileSync(join(process.cwd(), 'public', 'logo.svg'), 'utf8');
  
  // Convert SVG to data URL
  const logoDataUrl = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoDataUrl}
          alt="The Punch"
          style={{
            width: '50%',
            height: 'auto',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}

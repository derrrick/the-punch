import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'The Punch — A curated directory of independent type foundries';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Logo SVG embedded as data URL
const logoDataUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDk0IiBoZWlnaHQ9Ijg2IiB2aWV3Qm94PSIwIDAgNDk0IDg2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZyBjbGlwLXBhdGg9InVybCgjY2xpcDBfODVfMzYpIj4KPHJlY3Qgd2lkdGg9Ijg2IiBoZWlnaHQ9Ijg2IiBmaWxsPSIjMTcxNzE3Ii8+CjxyZWN0IHg9IjEwMiIgd2lkdGg9Ijg2IiBoZWlnaHQ9Ijg2IiBmaWxsPSIjMTcxNzE3Ii8+CjxyZWN0IHg9IjIwNCIgd2lkdGg9Ijg2IiBoZWlnaHQ9Ijg2IiBmaWxsPSIjMTcxNzE3Ii8+CjxyZWN0IHg9IjMwNiIgd2lkdGg9Ijg2IiBoZWlnaHQ9Ijg2IiBmaWxsPSIjMTcxNzE3Ii8+CjxyZWN0IHg9IjQwOCIgd2lkdGg9Ijg2IiBoZWlnaHQ9Ijg2IiBmaWxsPSIjMTcxNzE3Ii8+CjxwYXRoIGQ9Ik0yNS43NTIgNjdWMTYuNkg0Ni40ODhDNDkuNjU2IDE2LjYgNTIuNDQgMTcuMjQ4IDU0Ljg0IDE4LjU0NEM1Ny4yODggMTkuNzkyIDU5LjE4NCAyMS41NjggNjAuNTI4IDIzLjg3MkM2MS45MiAyNi4xNzYgNjIuNjE2IDI4LjkxMiA2Mi42MTYgMzIuMDhWMzMuMDg4QzYyLjYxNiAzNi4yMDggNjEuODk2IDM4Ljk0NCA2MC40NTYgNDEuMjk2QzU5LjA2NCA0My42IDU3LjE0NCA0NS40IDU0LjY5NiA0Ni42OTZDNTIuMjk2IDQ3Ljk0NCA0OS41NiA0OC41NjggNDYuNDg4IDQ4LjU2OEgzNS4yNTZWNjdIMjUuNzUyWk0zNS4yNTYgMzkuOTI4SDQ1LjU1MkM0Ny44MDggMzkuOTI4IDQ5LjYzMiAzOS4zMDQgNTEuMDI0IDM4LjA1NkM1Mi40MTYgMzYuODA4IDUzLjExMiAzNS4xMDQgNTMuMTEyIDMyLjk0NFYzMi4yMjRDNTMuMTEyIDMwLjA2NCA1Mi40MTYgMjguMzYgNTEuMDI0IDI3LjExMkM0OS42MzIgMjUuODY0IDQ3LjgwOCAyNS4yNCA0NS41NTIgMjUuMjRIMzUuMjU2VjM5LjkyOFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNDQuMTkyIDY4LjAwOEMxNDAuMDY0IDY4LjAwOCAxMzYuNTEyIDY3LjI2NCAxMzMuNTM2IDY1Ljc3NkMxMzAuNjA4IDY0LjI0IDEyOC4zNTIgNjIuMDggMTI2Ljc2OCA1OS4yOTZDMTI1LjIzMiA1Ni40NjQgMTI0LjQ2NCA1My4xMjggMTI0LjQ2NCA0OS4yODhWMTYuNkgxMzMuOTY4VjQ5LjU3NkMxMzMuOTY4IDUyLjY0OCAxMzQuODMyIDU1LjA3MiAxMzYuNTYgNTYuODQ4QzEzOC4zMzYgNTguNjI0IDE0MC44OCA1OS41MTIgMTQ0LjE5MiA1OS41MTJDMTQ3LjUwNCA1OS41MTIgMTUwLjAyNCA1OC42MjQgMTUxLjc1MiA1Ni44NDhDMTUzLjUyOCA1NS4wNzIgMTU0LjQxNiA1Mi42NDggMTU0LjQxNiA0OS41NzZWMTYuNkgxNjMuOTJWNDkuMjg4QzE2My45MiA1My4xMjggMTYzLjEyOCA1Ni40NjQgMTYxLjU0NCA1OS4yOTZDMTYwLjAwOCA2Mi4wOCAxNTcuNzUyIDY0LjI0IDE1NC43NzYgNjUuNzc2QzE1MS44NDggNjcuMjY0IDE0OC4zMiA2OC4wMDggMTQ0LjE5MiA2OC4wMDhaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjI2Ljc1MiA2N1YxNi42SDI0NC44MjRMMjU0LjgzMiA2MC41MkgyNTYuMTI4VjE2LjZIMjY1LjQ4OFY2N0gyNDcuNDE2TDIzNy40MDggMjMuMDhIMjM2LjExMlY2N0gyMjYuNzUyWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTM0Ny45MDQgNjguMDA4QzM0MS42NjQgNjguMDA4IDMzNi43MiA2Ni4yOCAzMzMuMDcyIDYyLjgyNEMzMjkuNDI0IDU5LjMyIDMyNy42IDU0LjMyOCAzMjcuNiA0Ny44NDhWMzUuNzUyQzMyNy42IDI5LjI3MiAzMjkuNDI0IDI0LjMwNCAzMzMuMDcyIDIwLjg0OEMzMzYuNzIgMTcuMzQ0IDM0MS42NjQgMTUuNTkyIDM0Ny45MDQgMTUuNTkyQzM1NC4wOTYgMTUuNTkyIDM1OC44NzIgMTcuMjk2IDM2Mi4yMzIgMjAuNzA0QzM2NS42NCAyNC4wNjQgMzY3LjM0NCAyOC42OTYgMzY3LjM0NCAzNC42VjM1LjAzMkgzNTcuOTg0VjM0LjMxMkMzNTcuOTg0IDMxLjMzNiAzNTcuMTQ0IDI4Ljg4OCAzNTUuNDY0IDI2Ljk2OEMzNTMuODMyIDI1LjA0OCAzNTEuMzEyIDI0LjA4OCAzNDcuOTA0IDI0LjA4OEMzNDQuNTQ0IDI0LjA4OCAzNDEuOTA0IDI1LjEyIDMzOS45ODQgMjcuMTg0QzMzOC4wNjQgMjkuMjQ4IDMzNy4xMDQgMzIuMDU2IDMzNy4xMDQgMzUuNjA4VjQ3Ljk5MkMzMzcuMTA0IDUxLjQ5NiAzMzguMDY0IDU0LjMwNCAzMzkuOTg0IDU2LjQxNkMzNDEuOTA0IDU4LjQ4IDM0NC41NDQgNTkuNTEyIDM0Ny45MDQgNTkuNTEyQzM1MS4zMTIgNTkuNTEyIDM1My44MzIgNTguNTUyIDM1NS40NjQgNTYuNjMyQzM1Ny4xNDQgNTQuNjY0IDM1Ny45ODQgNTIuMjE2IDM1Ny45ODQgNDkuMjg4VjQ3Ljk5MkgzNjcuMzQ0VjQ5QzM2Ny4zNDQgNTQuOTA0IDM2NS42NCA1OS41NiAzNjIuMjMyIDYyLjk2OEMzNTguODcyIDY2LjMyOCAzNTQuMDk2IDY4LjAwOCAzNDcuOTA0IDY4LjAwOFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik00MzAuNzUyIDY3VjE2LjZINDQwLjI1NlYzNy40MDhINDU4Ljk3NlYxNi42SDQ2OC40OFY2N0g0NTguOTc2VjQ2LjA0OEg0NDAuMjU2VjY3SDQzMC43NTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzg1XzM2Ij4KPHJlY3Qgd2lkdGg9IjQ5NCIgaGVpZ2h0PSI4NiIgZmlsbD0id2hpdGUiLz4KPC9jbGlwUGF0aD4KPC9kZWZzPgo8L3N2Zz4K';

export default async function Image() {
  // Fetch the Camelot Typefaces screenshot
  const imageUrl = 'https://thepunch.studio/og-camelot.jpg';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Background screenshot */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Camelot Typefaces"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* Dark overlay for better logo visibility */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '40px',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoDataUrl}
            alt="The Punch"
            style={{
              height: '48px',
              width: 'auto',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

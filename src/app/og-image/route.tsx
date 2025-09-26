import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          color: 'white',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          padding: '50px 80px',
          textAlign: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ 
          fontSize: 72, 
          fontWeight: 'bold', 
          marginBottom: 20,
          background: 'linear-gradient(45deg, #fff, #e0f2fe)',
          backgroundClip: 'text',
          color: 'transparent',
        }}>
          💧 Water Quality Reporter
        </div>
        <div style={{ 
          fontSize: 36, 
          color: '#e1f5fe',
          textAlign: 'center',
          lineHeight: 1.4,
        }}>
          Workspace for transforming<br />
          water quality reports into SQL scripts
        </div>
        <div style={{ 
          fontSize: 24, 
          color: '#b3e5fc',
          marginTop: 30,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}>
          📄 PDF Reports → 🔄 Parse Data → 💾 SQL Scripts
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}

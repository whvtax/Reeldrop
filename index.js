import { useState } from 'react';
import Head from 'next/head';

function detectPlatform(url) {
  if (!url) return null;
  try {
    const h = new URL(url).hostname;
    if (h.includes('instagram.com')) return 'instagram';
    if (h.includes('tiktok.com') || h.includes('vm.tiktok.com')) return 'tiktok';
  } catch {}
  return null;
}

const PLATFORM_LABELS = { instagram: 'Instagram', tiktok: 'TikTok' };

export default function Home() {
  const [url, setUrl]       = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  const platform = detectPlatform(url);

  async function submit() {
    if (!url.trim() || status === 'loading') return;
    setStatus('loading');
    setResult(null);
    setErrMsg('');
    try {
      const res  = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה');
      setResult(data);
      setStatus('done');
    } catch (e) {
      setErrMsg(e.message);
      setStatus('error');
    }
  }

  function reset() {
    setUrl('');
    setStatus('idle');
    setResult(null);
    setErrMsg('');
  }

  return (
    <>
      <Head>
        <title>SnapLoad</title>
        <meta name="description" content="Download videos from Instagram and TikTok for free" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="wrap">

        {/* ── Header ── */}
        <header>
          <span className="logo">SnapLoad</span>
        </header>

        {/* ── Main ── */}
        <main>
          <section className="hero">
            <h1>Download videos<br />in one click</h1>
            <p>Instagram · TikTok</p>
          </section>

          {/* Input */}
          <div className="box">
            <div className={`row ${platform ? 'tagged' : ''}`}>
              {platform && (
                <span className="tag">{PLATFORM_LABELS[platform]}</span>
              )}
              <input
                type="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setStatus('idle'); setResult(null); setErrMsg(''); }}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="Paste an Instagram or TikTok link..."
                dir="ltr"
                autoComplete="off"
                spellCheck={false}
              />
              {url && (
                <button className="clear" onClick={reset} title="נקה">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>

            <button
              className="btn"
              onClick={submit}
              disabled={!url.trim() || !platform || status === 'loading'}
            >
              {status === 'loading' ? <span className="spin" /> : 'Download'}
            </button>

            {!platform && url.trim() && (
              <p className="hint">Only Instagram and TikTok are supported</p>
            )}
          </div>

          {/* Error */}
          {status === 'error' && (
            <div className="notice error">
              {errMsg || 'Could not process this link. Make sure it is public and valid.'}
            </div>
          )}

          {/* Result */}
          {status === 'done' && result && (
            <div className="result">
              {result.thumbnail && (
                <img className="thumb" src={result.thumbnail} alt="" />
              )}
              {result.title && (
                <p className="rtitle">{result.title}</p>
              )}
              <div className="links">
                {result.downloads.map((dl, i) => (
                  <a
                    key={i}
                    href={dl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dl"
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M7.5 1v9M3.5 6.5l4 4 4-4M2 13h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {dl.quality || dl.label || 'Download file'}
                  </a>
                ))}
              </div>
              <button className="again" onClick={reset}>Download another</button>
            </div>
          )}
        </main>

        {/* ── Footer ── */}
        <footer>
          <p>Personal use only · No data stored</p>
        </footer>
      </div>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          max-width: 520px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* Header */
        header {
          padding: 28px 0 0;
        }
        .logo {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.3px;
          color: #111;
        }

        /* Main */
        main {
          flex: 1;
          padding: 80px 0 60px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* Hero */
        .hero { text-align: left; }
        h1 {
          font-size: clamp(28px, 7vw, 40px);
          font-weight: 300;
          line-height: 1.25;
          letter-spacing: -1px;
          color: #111;
          margin-bottom: 10px;
        }
        .hero p {
          font-size: 13px;
          color: #bbb;
          letter-spacing: 0.5px;
        }

        /* Box */
        .box {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .row {
          display: flex;
          align-items: center;
          border: 1px solid #e0e0e0;
          border-radius: var(--radius);
          background: #fff;
          transition: border-color 0.15s;
          overflow: hidden;
        }
        .row:focus-within {
          border-color: #111;
        }

        .tag {
          font-size: 11px;
          font-weight: 500;
          color: #888;
          padding: 0 12px;
          border-left: 1px solid #e8e8e8;
          white-space: nowrap;
          height: 100%;
          display: flex;
          align-items: center;
          background: #fafafa;
        }

        input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: #111;
          padding: 14px 14px;
          background: transparent;
          direction: rtl;
          min-width: 0;
        }
        input::placeholder { color: #bbb; }

        .clear {
          background: none;
          border: none;
          cursor: pointer;
          color: #ccc;
          padding: 0 12px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .clear:hover { color: #888; }

        .btn {
          padding: 14px;
          background: #111;
          color: #fff;
          border: none;
          border-radius: var(--radius);
          font-size: 14px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: background 0.15s, opacity 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
        }
        .btn:hover:not(:disabled) { background: #222; }
        .btn:disabled { opacity: 0.3; cursor: default; }

        .hint {
          font-size: 12px;
          color: #bbb;
          text-align: center;
        }

        .spin {
          width: 18px; height: 18px;
          border: 1.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Notice */
        .notice {
          padding: 14px 16px;
          border-radius: var(--radius);
          font-size: 13px;
        }
        .error {
          background: #fff5f5;
          border: 1px solid #ffd0d0;
          color: #c00;
        }

        /* Result */
        .result {
          border: 1px solid #e8e8e8;
          border-radius: var(--radius);
          overflow: hidden;
          animation: up 0.25s ease;
        }
        @keyframes up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .thumb {
          width: 100%;
          max-height: 240px;
          object-fit: cover;
          display: block;
          background: #f5f5f5;
        }

        .rtitle {
          padding: 14px 16px 0;
          font-size: 13px;
          color: #555;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .links {
          padding: 14px 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .dl {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          background: #111;
          color: #fff;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          transition: background 0.15s;
        }
        .dl:hover { background: #333; }

        .again {
          display: block;
          width: 100%;
          padding: 12px;
          background: none;
          border: none;
          border-top: 1px solid #f0f0f0;
          color: #999;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: color 0.15s;
        }
        .again:hover { color: #111; }

        /* Footer */
        footer {
          padding: 20px 0 28px;
          border-top: 1px solid #f0f0f0;
        }
        footer p {
          font-size: 12px;
          color: #ccc;
          text-align: center;
        }

        @media (max-width: 400px) {
          h1 { font-size: 26px; }
        }
      `}</style>
    </>
  );
}

/**
 * POST /api/download
 * Body: { url: string }
 *
 * Uses the Cobalt open-source API — completely free, no API key needed.
 * GitHub: https://github.com/imputnet/cobalt
 */

const COBALT_INSTANCES = [
  'https://api.cobalt.tools',
  'https://cobalt.meowing.de',
  'https://cobalt-api.nik.navy',
];

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body ?? {};
  if (!url || typeof url !== 'string')
    return res.status(400).json({ error: 'Missing URL' });

  let platform = '';
  try {
    const h = new URL(url).hostname;
    if (h.includes('instagram.com')) platform = 'Instagram';
    else if (h.includes('tiktok.com') || h.includes('vm.tiktok.com')) platform = 'TikTok';
  } catch {}

  if (!platform)
    return res.status(400).json({ error: 'Only Instagram and TikTok are supported' });

  let lastError = null;

  for (const instance of COBALT_INSTANCES) {
    try {
      const upstream = await fetch(`${instance}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          url,
          videoQuality: '1080',
          filenameStyle: 'pretty',
          downloadMode: 'auto',
        }),
        signal: AbortSignal.timeout(10000),
      });

      const data = await upstream.json();

      if (data.status === 'error') {
        lastError = data.error?.code ?? 'Could not process this link.';
        continue;
      }

      const downloads = [];

      if (data.status === 'tunnel' || data.status === 'redirect') {
        downloads.push({ url: data.url, quality: 'Download' });
      } else if (data.status === 'picker' && Array.isArray(data.picker)) {
        data.picker.forEach((item, i) => {
          if (item.url) {
            downloads.push({
              url: item.url,
              quality: item.type === 'photo' ? `Photo ${i + 1}` : `Video ${i + 1}`,
            });
          }
        });
        if (data.audio) {
          downloads.push({ url: data.audio, quality: 'Audio' });
        }
      }

      if (downloads.length === 0) {
        lastError = 'No downloadable content found.';
        continue;
      }

      return res.status(200).json({ platform, title: '', thumbnail: '', downloads });

    } catch (err) {
      lastError = err.message;
    }
  }

  return res.status(400).json({
    error: lastError ?? 'Could not process this link. Make sure it is public and valid.',
  });
}

// api/proxy.js
export default async function handler(req, res) {
  const url = req.query.url;
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Access-Control-Allow-Origin', '*'); // now your frontend can fetch
  res.send(Buffer.from(buffer));
}

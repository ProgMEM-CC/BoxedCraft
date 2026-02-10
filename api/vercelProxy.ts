// api/proxy.js
// export default async function handler(req, res) {
//   const url = req.query.url;
//   const response = await fetch(url);
//   const buffer = await response.arrayBuffer();

//   res.setHeader('Content-Type', 'application/octet-stream');
//   res.setHeader('Access-Control-Allow-Origin', '*'); // now your frontend can fetch
//   res.send(Buffer.from(buffer));
// }

export default async function handler(req, res) {
	const url = req.query.url;

	const upstream = await fetch(url);

	// Forward status
	res.status(upstream.status);

	// Forward important headers
	const contentLength = upstream.headers.get('content-length');
	if (contentLength) {
		res.setHeader('Content-Length', contentLength);
	}

	const contentType = upstream.headers.get('content-type');
	if (contentType) {
		res.setHeader('Content-Type', contentType);
	}

	res.setHeader('Access-Control-Allow-Origin', '*');

	// STREAM the body instead of buffering
	if (upstream.body) {
		upstream.body.pipe(res);
	} else {
		res.end();
	}
}

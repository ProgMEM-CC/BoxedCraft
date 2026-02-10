// api/proxy.js
// export default async function handler(req, res) {
//   const url = req.query.url;
//   const response = await fetch(url);
//   const buffer = await response.arrayBuffer();

//   res.setHeader('Content-Type', 'application/octet-stream');
//   res.setHeader('Access-Control-Allow-Origin', '*'); // now your frontend can fetch
//   res.send(Buffer.from(buffer));
// }

export const config = {
	runtime: 'nodejs',
};

export default async function handler(req, res) {
	const url = req.query.url;

	if (!url) {
		res.status(400).send('Missing url');
		return;
	}

	const upstream = await fetch(url);

	res.status(upstream.status);

	const contentLength = upstream.headers.get('content-length');
	if (contentLength) {
		res.setHeader('Content-Length', contentLength);
	}

	const contentType = upstream.headers.get('content-type');
	if (contentType) {
		res.setHeader('Content-Type', contentType);
	}

	res.setHeader('Access-Control-Allow-Origin', '*');

	if (!upstream.body) {
		res.end();
		return;
	}

	upstream.body.pipe(res);
}

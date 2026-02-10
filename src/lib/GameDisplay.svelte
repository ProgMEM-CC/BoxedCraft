<script lang="ts">
	import { onMount } from 'svelte';
	import { tryPlausible, showElement, hideElement, formatTime } from './utilities';
	import PageControls from './PageControls.svelte';
	import spinnerWhite from '$lib/assets/loading-spinner-white.svg';
	import ghGIF from '$lib/assets/rate-us-on-gh.gif';
	const pathJarMinecraft = '/files/client_1.2.5.jar';
	const urlJsonMinecraftClient = 
		"https://piston-meta.mojang.com/v1/packages/715ccf3330885e75b205124f09f8712542cbe7e0/1.20.1.json";

	const proxy = "api.cors.lol/?url=";
	const FORCE_LOCAL = false;
	let loading: HTMLDivElement;
	let display: HTMLDivElement;
	let intro: HTMLDivElement;
	let progressBar: HTMLProgressElement;
	let timeoutInfo: HTMLDivElement;
	let timer: HTMLDivElement;
	let usernameInput: HTMLInputElement;

	async function startCheerpJ() {
		await cheerpjInit({
			version: 8,
			javaProperties: ['java.library.path=/app/lwjgl/libraries/'],
			libraries: { 'libGL.so.1': '/app/lwjgl/libraries/gl4es.wasm' },
			enableX11: true,
			preloadResources: {
				'/files/libraries/net/sf/jopt-simple/jopt-simple/4.6/jopt-simple-4.6.jar': [0, 131072],
				'/lt/8/jre/lib/rt.jar': [
					0, 131072, 1310720, 1572864, 4456448, 4849664, 5111808, 5505024, 7995392, 8126464,
					9699328, 9830400, 9961472, 11534336, 11665408, 12189696, 12320768, 12582912, 13238272,
					13369344, 15073280, 15335424, 15466496, 15597568, 15990784, 16121856, 16252928, 16384000,
					16777216, 16908288, 17039360, 17563648, 17694720, 17825792, 17956864, 18087936, 18219008,
					18612224, 18743296, 18874368, 19005440, 19136512, 19398656, 19791872, 20054016, 20709376,
					20840448, 21757952, 21889024, 26869760
				],
				'/lt/etc/users': [0, 131072],
				'/lt/etc/localtime': [],
				'/lt/8/jre/lib/cheerpj-awt.jar': [0, 131072],
				'/lt/8/lib/ext/meta-index': [0, 131072],
				'/lt/8/lib/ext': [],
				'/lt/8/lib/ext/index.list': [],
				'/lt/8/lib/ext/localedata.jar': [],
				'/lt/8/jre/lib/jsse.jar': [0, 131072, 786432, 917504],
				'/lt/8/jre/lib/jce.jar': [0, 131072],
				'/lt/8/jre/lib/charsets.jar': [0, 131072, 1703936, 1835008],
				'/lt/8/jre/lib/resources.jar': [0, 131072, 917504, 1179648],
				'/lt/8/jre/lib/javaws.jar': [0, 131072, 1441792, 1703936],
				'/lt/8/lib/ext/sunjce_provider.jar': [],
				'/lt/8/lib/security/java.security': [0, 131072],
				'/lt/8/jre/lib/meta-index': [0, 131072],
				'/lt/8/jre/lib': [],
				'/lt/8/lib/accessibility.properties': [],
				'/lt/8/lib/fonts/LucidaSansRegular.ttf': [],
				'/lt/8/lib/currency.data': [0, 131072],
				'/lt/8/lib/currency.properties': [],
				'/lt/libraries/libGLESv2.so.1': [0, 262144],
				'/lt/libraries/libEGL.so.1': [0, 262144],
				'/lt/8/lib/fonts/badfonts.txt': [],
				'/lt/8/lib/fonts': [],
				'/lt/etc/hosts': [],
				'/lt/etc/resolv.conf': [0, 131072],
				'/lt/8/lib/fonts/fallback': [],
				'/lt/fc/fonts/fonts.conf': [0, 131072],
				'/lt/fc/ttf': [],
				'/lt/fc/cache/e21edda6a7db77f35ca341e0c3cb2a22-le32d8.cache-7': [0, 131072],
				'/lt/fc/ttf/LiberationSans-Regular.ttf': [0, 131072, 262144, 393216],
				'/lt/8/lib/jaxp.properties': [],
				'/lt/etc/timezone': [],
				'/lt/8/lib/tzdb.dat': [0, 131072]
			}
		});
		await cheerpjCreateDisplay(-1, -1, display);

		hideElement(loading);
		showElement(intro);
	}
	async function loadClientJson(url: string){
		const res = await fetch(url);
		const data = await res.json();
		return data;
	}

	async function startGame() {
		hideElement(intro);
		showElement(progressBar);
		// Test Proxy requirement
		var proxyRequired = false;
		var localProxy = false;
		try {
			await fetch("https://libraries.minecraft.net/com/mojang/netty/1.6/netty-1.6.jar");
		}
		catch (e) {
			proxyRequired = true;
			try {
				await fetch(`https://${proxy}https://libraries.minecraft.net/com/mojang/netty/1.6/netty-1.6.jar`);
			}
			catch (e) {
				localProxy = true;			
			}
		}
		const clientJsonData = await loadClientJson(urlJsonMinecraftClient); // Load Client JSON Data
		const urlDownloadMinecraft = clientJsonData.downloads.client.url; // Get Minecraft Jar URL
		const versionID = clientJsonData.id; // Get Version ID
		console.log(`Starting Minecraft version: ${versionID}`);
		await downloadLibFileCheerpj(urlDownloadMinecraft, pathJarMinecraft); // Download Minecraft Jar
		var pathJarLibs = ``;
		pathJarLibs += pathJarMinecraft;
		// Download Libs and Appends Libs to pathJarLibs
		for (const lib of clientJsonData.libraries) {
			if (lib.downloads.artifact){
				if (proxyRequired) {
					if(localProxy || FORCE_LOCAL) {
						lib.downloads.artifact.url = `/api/vercelProxy?url=${encodeURIComponent(lib.downloads.artifact.url)}`;
					}
					else
					{
						//lib.downloads.artifact.url = `https://${proxy}${encodeURIComponent(lib.downloads.artifact.url)}`;
						lib.downloads.artifact.url = `/api/vercelProxy?url=${encodeURIComponent(lib.downloads.artifact.url)}`;
					}
				}
				const urlLib = lib.downloads.artifact.url;
				const fileName = lib.downloads.artifact.path.split('/').pop();
				const pathLib = `/files/${fileName}`;


				await downloadLibFileCheerpj(urlLib, pathLib);
				console.log(`Downloaded: ${urlLib}`);
				pathJarLibs += `:${pathLib}`;
				console.log(`Added to classpath: ${pathLib}`);
				console.log(`Current classpath: ${pathJarLibs}`);
			}
		}
		hideElement(progressBar);
		showElement(display);
		console.log(pathJarLibs);
		tryPlausible('Play');
		await cheerpjRunMain(
			'net.minecraft.client.main.Main', 
			pathJarLibs,
			[
				'--username', usernameInput.value,
				'--version', String(versionID),
				'--versionType', 'release',
				'--gameDir', '/files/',
				'--assetsDir', '/files/assets/',
				'--assetIndex', clientJsonData.assets,
				'--uuid', '00000000-0000-0000-0000-000000000000',
				'--accessToken', 'OFFLINE',
				'--userType', 'offline',
			]
		);
	}





	async function downloadLibFileCheerpj(url: string, path: string) {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch ${url} (${response.status})`);
		}
		const reader = response.body.getReader();
		const chunks: Uint8Array[] = [];
		let received = 0;

		// Optional: total size for progress bar
		const contentLength = +response.headers.get('Content-Length') || 0;
		if (contentLength) {
			progressBar.max = contentLength;
		}

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
			received += value.length;

			if (contentLength) progressBar.value = received;
		}

		// Concatenate all chunks into a single Uint8Array
		const bytes = new Uint8Array(received);
		let offset = 0;
		for (const chunk of chunks) {
			bytes.set(chunk, offset);
			offset += chunk.length;
		}

		// Guard: verify this looks like a JAR/ZIP (starts with "PK")
		if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
			throw new Error(`Invalid JAR content for ${url}`);
		}

		// Write to CheerpJ filesystem
		return new Promise((resolve, reject) => {
			var fds = [];
			console.log(`Attempting to open path: ${path}`);
			cheerpOSOpen(fds, path, 'w', (fd) => {
				console.log(`cheerpOSOpen returned fd: ${fd} for path: ${path}`);
				if (fd < 0) {
					reject(new Error(`Failed to open ${path} (fd=${fd})`));
					return;
				}
				cheerpOSWrite(fds, fd, bytes, 0, bytes.length, (w) => {
					if (w < 0) {
						reject(new Error(`Failed to write ${path} (w=${w})`));
						return;
					}
					cheerpOSClose(fds, fd, resolve);
				});
			});
		});
	}

	async function downloadLibFileCheerpjOLDAPI(url: string,path: string) {
		const response = await fetch(url);
		const reader = response.body.getReader();
		const contentLength = +response.headers.get('Content-Length');

		const bytes = new Uint8Array(contentLength);
		progressBar.value = 0;
		progressBar.max = contentLength;

		let pos = 0;
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			bytes.set(value, pos);
			pos += value.length;
			progressBar.value = pos;
			progressBar.max = contentLength;
		}

		// Write to CheerpJ filesystem
		return new Promise((resolve, reject) => {
			var fds = [];
			cheerpOSOpen(fds, path, 'w', (fd) => {
				cheerpOSWrite(fds, fd, bytes, 0, bytes.length, (w) => {
					cheerpOSClose(fds, fd, resolve);
				});
			});
		});
	}



	onMount(async () => {
		loading = document.getElementById('loading');
		display = document.getElementById('display');
		intro = document.getElementById('intro');
		progressBar = document.getElementById('progress-bar');
		timeoutInfo = document.getElementById('timeout-info');
		timer = document.getElementById('timeout-timer');
		usernameInput = document.getElementById('usernameInput');
		startCheerpJ();
	});
</script>

<div class="game-container">
	<div id="loading" class="loading-container">
		<img src={spinnerWhite} class="spinner" alt="Loading" />
		<p class="text-center">Loading CheerpJ ...</p>
	</div>
	<div id="intro" class="intro">
		<p>This is real Minecraft JAVA unmodified in the browser.</p>

		<p>Clicking the button below will download the client and libs from mojang.com.</p>
		<input type="text" placeholder="Enter your UserName" id="usernameInput" />
		<button on:click={startGame}>Play!</button>

	</div>
	<progress id="progress-bar"></progress>
	<div id="display" class="display"></div>
	<PageControls />
</div>

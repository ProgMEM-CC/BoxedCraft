<script lang="ts">
	import { onMount } from 'svelte';
	import { tryPlausible, showElement, hideElement, formatTime } from './utilities';
	import PageControls from './PageControls.svelte';
	import spinnerWhite from '$lib/assets/loading-spinner-white.svg';
	import ghGIF from '$lib/assets/rate-us-on-gh.gif';
	const pathJarMinecraft = '/files/client_1.2.5.jar';
	const urlJsonMinecraftClient = 
		"https://piston-meta.mojang.com/v1/packages/856d9bec08b0d567de39f46efaf4b76066b53059/1.8.9.json";

	const proxy = "https://proxy.corsfix.com/?";
	let loading: HTMLDivElement;
	let display: HTMLDivElement;
	let intro: HTMLDivElement;
	let progressBar: HTMLProgressElement;
	let timeoutInfo: HTMLDivElement;
	let timer: HTMLDivElement;

	async function startCheerpJ() {
		await cheerpjInit({
			version: 8,
			javaProperties: ['java.library.path=/app/lwjgl/libraries/'],
			libraries: { 'libGL.so.1': '/app/lwjgl/libraries/gl4es.wasm' },
			enableX11: true,
			preloadResources: {
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
		try {
			await fetch("https://libraries.minecraft.net/com/mojang/netty/1.6/netty-1.6.jar");
		}
		catch (e) {
			proxyRequired = true;
		}
		const clientJsonData = await loadClientJson(urlJsonMinecraftClient); // Load Client JSON Data
		const urlDownloadMinecraft = clientJsonData.downloads.client.url; // Get Minecraft Jar URL
		await downloadLibFileCheerpj(urlDownloadMinecraft, pathJarMinecraft); // Download Minecraft Jar
		var pathJarLibs = ``;
		// Download Libs and Appends Libs to pathJarLibs
		for (const lib of clientJsonData.libraries) {
			if (lib.downloads.artifact){
				if (proxyRequired) {
					lib.downloads.artifact.url = `https://${proxy}${encodeURIComponent(lib.downloads.artifact.url)}`;
				}
				const urlLib = lib.downloads.artifact.url;
				const pathLib = `/files/libraries/${lib.downloads.artifact.path}`;

				await downloadLibFileCheerpj(urlLib, pathLib);
				pathJarLibs += `${pathLib}:`;
			}
		}
		hideElement(progressBar);
		showElement(display);
		pathJarLibs += pathJarMinecraft;
		tryPlausible('Play');
		await cheerpjRunMain('net.minecraft.client.main.Main', pathJarLibs);
	}

	async function downloadLibFileCheerpj(url: string,path: string) {
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
		<button on:click={startGame}>Play!</button>

	</div>
	<progress id="progress-bar"></progress>
	<div id="display" class="display"></div>
	<PageControls />
</div>

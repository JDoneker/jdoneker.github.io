// main.js - improved, debug-friendly

const bubbleCode = `function sort(arr) {
    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < (arr.length - i - 1); j++) {
            if (arr[j] > arr[j + 1]) {
                var temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    return arr;
}`;

const mergeCode = `function sort(arr) {
	if (arr.length <= 1) return arr;
	let mid = Math.floor(arr.length / 2);
	let left = sort(arr.slice(0, mid));
	let right = sort(arr.slice(mid));
	return merge(left, right);
}
function merge(left, right) {
	let sortedArr = [];
	while (left.length && right.length) {
		if (left[0] < right[0]) sortedArr.push(left.shift());
		else sortedArr.push(right.shift());
	}
	return [...sortedArr, ...left, ...right];
}`;

const codeArea = document.getElementById('codeInputArea');
const loadBubbleBtn = document.getElementById('loadBubbleBtn');
const loadMergeBtn = document.getElementById('loadMergeBtn');
const runBtn = document.getElementById('runBtn');
const stopBtn = document.getElementById('stopBtn');
const itemCountInput = document.getElementById('itemCount');
const resultText = document.getElementById('resultText');

let currentWorker = null;
let currentBlobUrl = null;

// Replace common "smart quotes" with normal quotes to avoid parser errors
function normalizeQuotes(s) {
    return s
        .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")  // single quotes variants
        .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')  // double quotes variants
        .replace(/\u2014/g, '-') // em dash => hyphen
        .replace(/\u00A0/g, ' '); // non-breaking space => normal space
}

function makeBoilerplate() {
    // kept as a plain string (no template literal) to minimize accidental special chars
    return (
"self.onmessage = function(event) {\n" +
"    const n = (event.data && typeof event.data.count === 'number') ? event.data.count : 30000;\n" +
"    const arr = new Array(n);\n" +
"    for (let i = 0; i < n; i++) arr[i] = Math.floor(Math.random()*n);\n" +
"    const start = Date.now();\n" +
"    let result;\n" +
"    try {\n" +
"        result = sort(arr);\n" +
"    } catch (err) {\n" +
"        self.postMessage({ error: String(err) });\n" +
"        return;\n" +
"    }\n" +
"    const end = Date.now();\n" +
"    self.postMessage({ time: end - start, length: (result && result.length) || 0 });\n" +
"};\n"
    );
}

// returns a Blob (not a URL) so we can inspect its text before creating a Worker
function createBlobFromCode(userCode) {
    return new Blob([userCode], { type: 'application/javascript; charset=utf-8' });
}

// main runner
function runUserCode() {
    if (currentWorker) return; // already running

    const count = parseInt(itemCountInput.value, 10) || 30000;
    if (count <= 0) {
        resultText.textContent = 'Please enter a positive number of items.';
        return;
    }

    // sanitize typical problematic characters
    let userCode = normalizeQuotes(codeArea.value || '');
    // ensure there's something
    if (!userCode.trim()) {
        resultText.textContent = 'Code area is empty — paste a function named `sort`.';
        return;
    }

    const fullScript = userCode + "\n\n" + makeBoilerplate();

    // create the blob and print its contents to console for debugging
    const blob = createBlobFromCode(fullScript);

    // asynchronously read the blob text so you can inspect it in DevTools (console)
    blob.text().then(text => {
        console.log('--- Worker script start ---\n' + text + '\n--- Worker script end ---');
        // create the worker inside try/catch to catch immediate syntax errors
        const blobUrl = URL.createObjectURL(blob);
        currentBlobUrl = blobUrl;

        let worker;
        try {
            worker = new Worker(blobUrl);
        } catch (err) {
            // SyntaxError or similar during parsing/creation of Worker
            resultText.textContent = 'Worker creation failed: ' + err.message;
            console.error('Worker creation error', err);
            URL.revokeObjectURL(blobUrl);
            currentBlobUrl = null;
            return;
        }

        currentWorker = worker;
        runBtn.disabled = true;
        loadBubbleBtn.disabled = true;
        loadMergeBtn.disabled = true;
        stopBtn.disabled = false;
        resultText.textContent = 'Running... (see console for generated worker code)';

        worker.onmessage = function(ev) {
            const data = ev.data;
            if (data && data.error) {
                resultText.textContent = 'Worker error: ' + data.error;
            } else if (data && typeof data.time !== 'undefined') {
                resultText.textContent = `Time: ${data.time} ms — returned length: ${data.length}`;
            } else {
                resultText.textContent = 'Unexpected worker response: ' + JSON.stringify(data);
            }
            cleanupWorker();
        };

        worker.onerror = function(e) {
            // This often gives line numbers relative to the blob URL, check console
            resultText.textContent = `Worker crashed: ${e.message} (see console for details)`;
            console.error('Worker error event:', e);
            cleanupWorker();
        };

        // start the worker
        worker.postMessage({ count: count });
    }).catch(err => {
        resultText.textContent = 'Failed to read generated worker script: ' + err.message;
        console.error(err);
    });
}

function stopWorker() {
    if (!currentWorker) return;
    try { currentWorker.terminate(); } catch (e) { console.warn(e); }
    resultText.textContent = 'Stopped by user.';
    cleanupWorker();
}

function cleanupWorker() {
    if (currentWorker) {
        try { currentWorker.terminate(); } catch (e) {}
        currentWorker = null;
    }
    if (currentBlobUrl) {
        try { URL.revokeObjectURL(currentBlobUrl); } catch (e) {}
        currentBlobUrl = null;
    }
    runBtn.disabled = false;
    loadBubbleBtn.disabled = false;
    loadMergeBtn.disabled = false;
    stopBtn.disabled = true;
}

// wiring
loadBubbleBtn.addEventListener('click', () => {
    codeArea.value = bubbleCode;
    resultText.textContent = 'Loaded Bubble Sort into editor.';
});
loadMergeBtn.addEventListener('click', () => {
    codeArea.value = mergeCode;
    resultText.textContent = 'Loaded Merge Sort into editor.';
});
runBtn.addEventListener('click', runUserCode);
stopBtn.addEventListener('click', stopWorker);

window.addEventListener('beforeunload', () => {
    if (currentWorker) try { currentWorker.terminate(); } catch (e) {}
    if (currentBlobUrl) try { URL.revokeObjectURL(currentBlobUrl); } catch (e) {}
});

function createUserCodeBlob(userCode) {
        const blob = new Blob([userCode], { type: 'application/javascript' });
        return URL.createObjectURL(blob);
}
function addBoilerPlate(userCode) {
        boilerplate = `
self.onmessage = function(event) {
arr = [];
for(let i = 0; i < 30000; i++) {
        arr.push(30000*Math.random());
}
const start = Date.now();

console.log(sort(arr));
const end = Date.now();
time = end - start;
self.postMessage(time);
};
        `;
        return boilerplate+userCode;
}        
function runUserCode() {
        let textArea = document.getElementById('codeInputArea');
        let userCode = addBoilerPlate(textArea.value);
        const blobUrl = createUserCodeBlob(userCode);
        const worker = new Worker(blobUrl);
        
        // Pass data to the worker
        // worker.postMessage(data);

        const canvas = document.getElementById('outputCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff"
        // Listen for messages from the Web Worker
        worker.onmessage = function(event) {
                // Handle the message from the worker
                const stringData = event.data;
                // Draw the image data to the canvas
                ctx.font = "48px serif";
                ctx.fillText(stringData, 10, 50);
                URL.revokeObjectURL(blobUrl);
        };

        // Send a message to the Web Worker to start drawing
        worker.postMessage('startDrawing');

}

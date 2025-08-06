import { Text } from './Text.js';
import { Graph } from './Graph.js';

export class SceneManager {
    constructor(gl, webglContext) {
        this.gl = gl;
        this.webglContext = webglContext;
        this.fontData = null;
        this.fontTexture = null;
        this.texts = []; 
        this.graph = new Graph(this.gl, [0.8, 0.0, 0.8, 0.7]);
        this.basePrice = 114900.00;
        this.textProgramInfo = null;
        this.graphProgramInfo = null;
    }

    async loadAssets() {
        try {
            const jsonResponse = await fetch('assets/fonts/arial_bold-msdf.json');
            this.fontData = await jsonResponse.json();

            const image = new Image();
            await new Promise((resolve) => {
                image.onload = () => {
                    this.fontTexture = this.gl.createTexture();
                    this.gl.bindTexture(this.gl.TEXTURE_2D, this.fontTexture);
                    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
                    this.gl.generateMipmap(this.gl.TEXTURE_2D);
                    resolve();
                };
                image.src = 'assets/fonts/arialbold.png';
            });
            
            this.texts = [
                new Text(this.gl, "BTC/USDT Binance", 0.25, 0.08, [0.0, 0.0, 0.0, 1.0], false),
                new Text(this.gl, "114,900.00", 0.15, 0.15, [0.0, 0.0, 0.0, 1.0]),
                new Text(this.gl, "1.00%   1,140.87", 0.0, 0.05, [0.8, 0.0, 0.8, 0.7])
            ];

            this.initRenderers();

        } catch (e) {
            console.error("Failed to load files:", e);
        }
    }

    initRenderers() {
        this.webglContext.initPrograms();
        this.textProgramInfo = this.webglContext.getProgramInfo(this.webglContext.textProgram);
        this.graphProgramInfo = this.webglContext.getProgramInfo(this.webglContext.graphProgram);
        
        for (const textObject of this.texts) {
            textObject.generateGeometry(this.fontData);
            textObject.createBuffers();
        }
        this.graph.createBuffers();
    }

    update(currentTime) {
        if (currentTime >= this.graph.nextUpdateTime) {
            this.graph.updateData();
            this.graph.updateBuffers();
            this.updateTexts(this.graph.getLatestValue());
            const updateInterval = 100 + Math.random() * 200; 
            this.graph.nextUpdateTime = currentTime + updateInterval;
        }
    }

    draw() {
        this.gl.useProgram(this.textProgramInfo.program);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.fontTexture);
        this.gl.uniform1i(this.textProgramInfo.uniformLocations.fontTexture, 0);

        for (const textObject of this.texts) {
            textObject.draw(this.textProgramInfo);
        }
        
        this.gl.useProgram(this.graphProgramInfo.program);
        this.graph.draw(this.graphProgramInfo);
    }
    
    updateTexts(latestGraphValue) {
        const priceRange = 2000;
        const normalizedValue = ((latestGraphValue - this.graph.minY) / this.graph.yRange) * priceRange;
        
        const newPrice = 113900 + normalizedValue;
        const priceText = newPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        this.texts[1].updateContent(priceText, this.fontData);

        const changeValue = (newPrice - this.basePrice) / this.basePrice * 100;
        const changeText = `${Math.abs(changeValue).toFixed(2)}%`;
        const absChange = (newPrice - this.basePrice).toFixed(2);
        this.texts[2].updateContent(`${changeText}   ${absChange.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`, this.fontData);
        
        if (changeValue >= 0) {
            this.texts[2].color = [0.0, 0.8, 0.0, 0.7];
        } else {
            this.texts[2].color = [0.8, 0.0, 0.0, 0.7];
        }
    }
    
    updateLayout() {
        if (!this.fontData) return; 
        for (const textObject of this.texts) {
            textObject.generateGeometry(this.fontData);
            textObject.updateContent(textObject.textToRender, this.fontData);
        }
        this.graph.updateBuffers();
    }
}

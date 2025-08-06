export class Text {
    constructor(gl, textToRender, y, size, color, alignLeft = false) {
        this.gl = gl;
        this.textToRender = textToRender;
        this.y = y;
        this.size = size;
        this.color = color;
        this.alignLeft = alignLeft;
        this.vertices = [];
        this.uvs = [];
        this.vertexBuffer = null;
        this.uvBuffer = null;
    }

    generateGeometry(fontData) {
        const vertices = [];
        const uvs = [];

        const fontScale = this.size / fontData.info.size;
        let totalWidth = 0;

        for (const char of this.textToRender) {
            const charData = fontData.chars.find(c => c.char === char);
            if (charData) 
            {
                totalWidth += charData.xadvance * fontScale;
            }
        }
        
        const startX = this.alignLeft ? -1.0 + 0.05 * (this.gl.canvas.width / this.gl.canvas.height) : -totalWidth / 2;
        let penX = startX;

        const aspect = this.gl.canvas.width / this.gl.canvas.height;

        for (const char of this.textToRender) {
            const charData = fontData.chars.find(c => c.char === char);

            if (!charData) {
                console.warn(`Character "${char}" not found in font data. Skipping.`);
                penX += fontData.info.size * fontScale * 0.5; 
                continue;
            }

            const quadWidth = charData.width * fontScale;
            const quadHeight = charData.height * fontScale;
            const xoffset = charData.xoffset * fontScale;
            const yoffset = charData.yoffset * fontScale;

            const x1 = (penX + xoffset) / aspect;
            const y1 = this.y - yoffset;
            const x2 = (penX + xoffset + quadWidth) / aspect;
            const y2 = this.y - yoffset - quadHeight;

            const uvX = charData.x / fontData.common.scaleW;
            const uvY = charData.y / fontData.common.scaleH;
            const uvWidth = charData.width / fontData.common.scaleW;
            const uvHeight = charData.height / fontData.common.scaleH;

            vertices.push(
                x1, y1, // top-left
                x2, y1, // top-right
                x1, y2, // bottom-left
                x1, y2, // bottom-left
                x2, y1, // top-right
                x2, y2  // bottom-right
            );

            uvs.push(
                uvX, uvY,
                uvX + uvWidth, uvY,
                uvX, uvY + uvHeight,
                uvX, uvY + uvHeight,
                uvX + uvWidth, uvY,
                uvX + uvWidth, uvY + uvHeight
            );

            penX += (charData.xadvance * fontScale);
        }

        this.vertices = vertices;
        this.uvs = uvs;
    }

    createBuffers() {
        if (!this.vertexBuffer) {
            this.vertexBuffer = this.gl.createBuffer();
        }
        if (!this.uvBuffer) {
            this.uvBuffer = this.gl.createBuffer();
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.uvBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.uvs), this.gl.STATIC_DRAW);
    }
    
    updateContent(newText, fontData) {
        this.textToRender = newText;
        this.generateGeometry(fontData);
        this.createBuffers();
    }

    draw(programInfo) {
        this.gl.uniform4f(programInfo.uniformLocations.textColor, ...this.color);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(programInfo.attribLocations.position, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(programInfo.attribLocations.position);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.uvBuffer);
        this.gl.vertexAttribPointer(programInfo.attribLocations.uv, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(programInfo.attribLocations.uv);
        
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertices.length / 2);
    }
}

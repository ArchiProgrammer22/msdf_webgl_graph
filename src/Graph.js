export class Graph {
    constructor(gl, color) {
        this.gl = gl;
        this.color = color;
        this.points = [];
        this.maxPoints = 200;
        this.minY = -0.5;
        this.maxY = -0.2;
        this.yRange = this.maxY - this.minY;
        this.vertexBuffer = null;
        this.nextUpdateTime = 0;
        this.points.push(this.minY + this.yRange / 2);
    }

    createBuffers() {
        if (!this.vertexBuffer) {
            this.vertexBuffer = this.gl.createBuffer();
        }
    }

    updateData() {
        const lastPointY = getLatestValue();
        const step = (Math.random() - 0.5) * 0.05;
        let newPointY = lastPointY + step;
        newPointY = Math.max(this.minY, Math.min(this.maxY, newPointY));
        this.points.push(newPointY);

        if (this.points.length > this.maxPoints) {
            this.points.shift();
        }
        this.updateBuffers();
    }

    getLatestValue() {
        return this.points[this.points.length - 1];
    }

    updateBuffers() {
        const vertices = [];
        const aspectRatio = this.gl.canvas.width / this.gl.canvas.height;
        const totalWidth = 1.0;
        const xStep = totalWidth / this.maxPoints;
        const startX = -totalWidth / 2;
        const lineWidth = 0.005;
        const halfLineWidth = lineWidth / 2;

        for (let i = 0; i < this.points.length - 1; i++) {
            const x1 = startX + i * xStep;
            const y1 = this.points[i];
            const x2 = startX + (i + 1) * xStep;
            const y2 = this.points[i + 1];

            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx*dx + dy*dy);
            const perpDx = -dy / length;
            const perpDy = dx / length;

            vertices.push(x1 + perpDx * halfLineWidth, y1 + perpDy * halfLineWidth);
            vertices.push(x1 - perpDx * halfLineWidth, y1 - perpDy * halfLineWidth);
            vertices.push(x2 + perpDx * halfLineWidth, y2 + perpDy * halfLineWidth);
            
            vertices.push(x2 + perpDx * halfLineWidth, y2 + perpDy * halfLineWidth);
            vertices.push(x1 - perpDx * halfLineWidth, y1 - perpDy * halfLineWidth);
            vertices.push(x2 - perpDx * halfLineWidth, y2 - perpDy * halfLineWidth);
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.DYNAMIC_DRAW);
    }
    
    draw(programInfo) {
        this.gl.uniform4f(programInfo.uniformLocations.graphColor, ...this.color);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(programInfo.attribLocations.position, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(programInfo.attribLocations.position);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.points.length > 1 ? (this.points.length - 1) * 6 : 0);
    }
}

export class WebGLContext {
    constructor(gl) {
        this.gl = gl;
        this.textProgram = null;
        this.graphProgram = null;
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createProgram(vsSource, fsSource) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, this.createShader(this.gl.VERTEX_SHADER, vsSource));
        this.gl.attachShader(program, this.createShader(this.gl.FRAGMENT_SHADER, fsSource));
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program linking error:', this.gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    initPrograms() {
        const textVsSource = `
            attribute vec2 a_position;
            attribute vec2 a_uv;
            varying vec2 v_uv;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_uv = a_uv;
            }
        `;
        const textFsSource = `
            precision highp float;
            uniform sampler2D u_fontTexture;
            uniform vec4 u_textColor;
            varying vec2 v_uv;
            float median(float r, float g, float b) {
                return max(min(r, g), min(max(r, g), b));
            }
            void main() {
                vec3 msdf = texture2D(u_fontTexture, v_uv).rgb;
                float dist = median(msdf.r, msdf.g, msdf.b);
                float smoothness = 0.1;
                float alpha = smoothstep(0.50 - smoothness, 0.50 + smoothness, dist);
                gl_FragColor = vec4(u_textColor.rgb, u_textColor.a * alpha);
            }
        `;
        const graphVsSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        const graphFsSource = `
            precision highp float;
            uniform vec4 u_graphColor;
            void main() {
                gl_FragColor = u_graphColor;
            }
        `;

        this.textProgram = this.createProgram(textVsSource, textFsSource);
        this.graphProgram = this.createProgram(graphVsSource, graphFsSource);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }
    
    getProgramInfo(program) {
        return {
            program: program,
            attribLocations: {
                position: this.gl.getAttribLocation(program, 'a_position'),
                uv: this.gl.getAttribLocation(program, 'a_uv'),
            },
            uniformLocations: {
                textColor: this.gl.getUniformLocation(program, 'u_textColor'),
                fontTexture: this.gl.getUniformLocation(program, 'u_fontTexture'),
                graphColor: this.gl.getUniformLocation(program, 'u_graphColor'),
            },
        };
    }
    
    updateViewport(width, height) {
        this.gl.viewport(0, 0, width, height);
    }
}

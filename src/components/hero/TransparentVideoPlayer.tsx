'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { cn } from '@/lib/utils';

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D u_image;
  varying vec2 v_texCoord;

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);

    float maxColor = max(color.r, max(color.g, color.b));

    // Tighter threshold: removes only deep black background, keeps laptop greys
    float alpha = smoothstep(0.01, 0.05, maxColor);

    gl_FragColor = vec4(color.rgb, alpha);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

interface TransparentVideoPlayerProps {
  src: string;
  className?: string;
  loop?: boolean;
  videoRef?: RefObject<HTMLVideoElement>;
  onReady?: () => void;
  onError?: () => void;
  onTimeUpdate?: () => void;
  onEnded?: () => void;
}

export function TransparentVideoPlayer({
  src,
  className,
  loop = false,
  videoRef: externalVideoRef,
  onReady,
  onError,
  onTimeUpdate,
  onEnded,
}: TransparentVideoPlayerProps) {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef ?? internalVideoRef;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readyFired = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
    });
    if (!gl) {
      onError?.();
      return;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) {
      onError?.();
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      onError?.();
      return;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      onError?.();
      return;
    }

    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posAttr = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]),
      gl.STATIC_DRAW
    );

    const texAttr = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texAttr);
    gl.vertexAttribPointer(texAttr, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const uImage = gl.getUniformLocation(program, 'u_image');
    gl.uniform1i(uImage, 0);

    let animId = 0;

    const render = () => {
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          gl.viewport(0, 0, canvas.width, canvas.height);
        }

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (!readyFired.current) {
          readyFired.current = true;
          onReady?.();
        }
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(texBuffer);
      gl.deleteTexture(texture);
    };
  }, [onError, onReady]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.loop = loop;

    const tryPlay = async () => {
      try {
        await video.play();
      } catch {
        /* autoplay may be blocked */
      }
    };

    const onCanPlay = () => {
      void tryPlay();
    };

    const handleError = () => onError?.();

    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', handleError);
    if (onTimeUpdate) video.addEventListener('timeupdate', onTimeUpdate);
    if (onEnded) video.addEventListener('ended', onEnded);

    if (video.readyState >= 3) void tryPlay();

    return () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', handleError);
      if (onTimeUpdate) video.removeEventListener('timeupdate', onTimeUpdate);
      if (onEnded) video.removeEventListener('ended', onEnded);
    };
  }, [loop, onError, onTimeUpdate, onEnded]);

  return (
    <div className={cn('relative flex w-full items-center justify-center', className)}>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        playsInline
        preload="auto"
        loop={loop}
        className="hidden"
        aria-hidden
      />
      <canvas
        ref={canvasRef}
        className="transparent-video-canvas pointer-events-none h-auto w-full"
        aria-label="scenenode laptop animation"
      />
    </div>
  );
}

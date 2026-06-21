function isWebGLContext(
  context: RenderingContext | null,
): context is WebGLRenderingContext | WebGL2RenderingContext {
  return context !== null && 'getParameter' in context;
}

function isExplicitlyDisabled(value: unknown): boolean {
  return /disabled/i.test(String(value ?? ''));
}

function tryCreateContext(options: WebGLContextAttributes): WebGLRenderingContext | WebGL2RenderingContext | null {
  const canvas = document.createElement('canvas');
  const gl =
    canvas.getContext('webgl2', options) ??
    canvas.getContext('webgl', options) ??
    canvas.getContext('experimental-webgl', options);
  return isWebGLContext(gl) ? gl : null;
}

function isContextUsable(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const vendor = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
    : gl.getParameter(gl.VENDOR);
  const renderer = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : gl.getParameter(gl.RENDERER);

  if (isExplicitlyDisabled(vendor) || isExplicitlyDisabled(renderer)) {
    return false;
  }

  try {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  } catch {
    return false;
  }

  return true;
}

export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  const attempts: WebGLContextAttributes[] = [
    {
      alpha: true,
      antialias: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'high-performance',
    },
    {
      alpha: true,
      antialias: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'default',
    },
    {
      alpha: true,
      antialias: false,
      failIfMajorPerformanceCaveat: false,
    },
  ];

  try {
    for (const options of attempts) {
      const gl = tryCreateContext(options);
      if (gl && isContextUsable(gl)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

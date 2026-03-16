import * as Phaser from "phaser";

const FRAGMENT_SHADER = `
precision mediump float;

uniform vec2 resolution;
uniform float time;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec2 centered = uv - vec2(0.5);
  float dist = dot(centered * vec2(1.05, 0.84), centered * vec2(1.05, 0.84)) * 2.15;
  float vignette = smoothstep(0.08, 0.96, dist);
  float grain = fract(sin(dot(gl_FragCoord.xy + vec2(time * 0.011, time * 0.007), vec2(12.9898, 78.233))) * 43758.5453);
  float mist = 0.5 + 0.5 * sin(uv.y * 18.0 - time * 0.0012 + uv.x * 5.0);
  vec3 color = vec3(0.02, 0.05, 0.08) * vignette + vec3(0.03, 0.07, 0.10) * mist * 0.12;
  float alpha = clamp(vignette * 0.34 + grain * 0.05, 0.0, 0.42);
  gl_FragColor = vec4(color, alpha);
}
`;

export class AtmosphereVeil {
  readonly #shader: Phaser.GameObjects.Shader | null;
  readonly #scrim: Phaser.GameObjects.Rectangle;
  readonly #lightning: Phaser.GameObjects.Rectangle;
  #blackoutLevel = 0;
  #lightningLevel = 0;

  constructor(scene: Phaser.Scene) {
    this.#shader =
      scene.game.renderer.type === Phaser.WEBGL
        ? scene.add
            .shader(
              new Phaser.Display.BaseShader(
                "blackout-manor-atmosphere",
                FRAGMENT_SHADER,
              ),
              0,
              0,
              scene.scale.width,
              scene.scale.height,
            )
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(120)
        : null;
    this.#scrim = scene.add
      .rectangle(0, 0, scene.scale.width, scene.scale.height, 0x02050a, 0.08)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(121);
    this.#lightning = scene.add
      .rectangle(0, 0, scene.scale.width, scene.scale.height, 0xe5f2ff, 0)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(122);
  }

  resize(width: number, height: number) {
    this.#shader?.setSize(width, height);
    this.#shader?.setUniform("resolution.value.x", width);
    this.#shader?.setUniform("resolution.value.y", height);
    this.#scrim.setSize(width, height);
    this.#lightning.setSize(width, height);
  }

  setBlackoutLevel(level: number) {
    this.#blackoutLevel = Phaser.Math.Clamp(level, 0, 1);
  }

  setLightningLevel(level: number) {
    this.#lightningLevel = Phaser.Math.Clamp(level, 0, 1);
  }

  update() {
    this.#scrim.setAlpha(0.08 + this.#blackoutLevel * 0.52);
    this.#lightning.setAlpha(this.#lightningLevel * 0.36);
  }

  destroy() {
    this.#shader?.destroy();
    this.#scrim.destroy();
    this.#lightning.destroy();
  }
}

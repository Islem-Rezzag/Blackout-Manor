import * as Phaser from "phaser";

const FRAGMENT_SHADER = `
precision mediump float;

uniform vec2 resolution;
uniform float time;
uniform float blackout;
uniform float lightning;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec2 centered = uv - vec2(0.5);
  float dist = dot(centered * vec2(1.05, 0.84), centered * vec2(1.05, 0.84)) * 2.15;
  float vignette = smoothstep(0.08, 0.96, dist);
  float grain = fract(sin(dot(gl_FragCoord.xy + vec2(time * 0.011, time * 0.007), vec2(12.9898, 78.233))) * 43758.5453);
  float mist = 0.5 + 0.5 * sin(uv.y * 18.0 - time * 0.0012 + uv.x * 5.0);
  vec3 baseColor = mix(vec3(0.02, 0.05, 0.08), vec3(0.01, 0.02, 0.04), blackout);
  vec3 lightningWash = vec3(0.20, 0.26, 0.32) * lightning;
  vec3 color = baseColor * vignette + vec3(0.03, 0.07, 0.10) * mist * (0.08 + blackout * 0.12) + lightningWash;
  float alpha = clamp(vignette * (0.20 + blackout * 0.28) + grain * 0.05, 0.0, 0.58);
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
            .setDepth(240)
        : null;
    this.#scrim = scene.add
      .rectangle(0, 0, scene.scale.width, scene.scale.height, 0x02050a, 0.08)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(241);
    this.#lightning = scene.add
      .rectangle(0, 0, scene.scale.width, scene.scale.height, 0xe5f2ff, 0)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(242);
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
    this.#shader?.setUniform("blackout.value", this.#blackoutLevel);
    this.#shader?.setUniform("lightning.value", this.#lightningLevel);
    this.#scrim.setAlpha(0.06 + this.#blackoutLevel * 0.44);
    this.#lightning.setAlpha(this.#lightningLevel * 0.34);
  }

  destroy() {
    this.#shader?.destroy();
    this.#scrim.destroy();
    this.#lightning.destroy();
  }
}

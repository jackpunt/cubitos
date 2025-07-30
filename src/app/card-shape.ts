import { C } from "@thegraid/common-lib";
import { RectShape } from "@thegraid/easeljs-lib";

// a 3.5 x 2.5 RoundedRect
export class CardShape extends RectShape {
  /** override to set size of your card (750px) */
  static get defaultSize() { return 750 };

  size: number;

  /**
   * Modified RectShape: place border stroke inside the WH perimeter.
   * @param fillc base color of card
   * @param strokec [C.grey64] supply '' for no stroke
   * @param size [CardShape.defaultSize] size of shorter side OR scale from defaultSize [0..3]
   * @param portrait [false] height is shorter; true -> width is shorter
   * @param ss [rad * .04] StrokeSize for outer border.
   * @param rr [max(w,h) * .05] rounded corner radius
   */
  constructor(fillc = 'lavender', strokec = C.grey64, size = CardShape.defaultSize, portrait = false, ss?: number, rr?: number) {
    if (size <= 3) size = size * CardShape.defaultSize; // scale down for small size!
    const s = ss ?? size * .04;
    const a = 3.5 / 2.5; // aspect: length of long side relative to short side = 1.4
    const w = (portrait ? size : size * a) - 2 * s;
    const h = (portrait ? size * a : size) - 2 * s;
    const r = rr ?? Math.max(h, w) * .05;
    super({ x: -w / 2, y: -h / 2, w, h, r, s }, fillc, strokec);
    this.size = size;
  }
}

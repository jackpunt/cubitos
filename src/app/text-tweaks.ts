import { C, F } from "@thegraid/common-lib";
import { Container, Text } from "@thegraid/easeljs-module";

export type BASELINE = "top" | "hanging" | "middle" | "alphabetic" | "ideographic" | "bottom";
export type TWEAKS = {
  color?: string, align?: 'left' | 'center' | 'right',  baseline?: BASELINE,
  style?: string, weight?: string | number, size?: number, family?: string,
  dx?: number, dy?: number, lineno?: number, nlh?: number, // add lead to after/btwn each line.
  glyphRE?: RegExp, // when matched in setTextWithGlyphs, invoke glyphFunc(match, ...)
  glyphFunc?: ((cont: Container, fragt: Text, trigger: string, tx: number, ty: number, lineh: number) => number), // function to handle glyphRE matches
};

/** supply Container to hold the tweaked Text */
export class TextTweaks {
  cont: Container;
  nparams: Record<string, number>; // cardw, edge
  sparams: Record<string, string>; // textFont
  constructor(cont: Container, sparams?: Record<string, string>, nparams?: Record<string, number>) {
    this.cont = cont;
    this.sparams = sparams ?? {};
    this.nparams = nparams ?? {};
  }

  /** setTextTweaks [Centered] with Tweaks: { color, dx, dy, lineno, baseline, align, nlh, glyphRE }
   * @param text string | Text
   * @param fontStr is fed to makeText (resolve as fam_wght)
   * @param tweaks: dx, dy: initial x, y-coord, lineno: advance liney by nlh; style, wght, size, font override fontStr
   */
  setTextTweaks(text: string | Text, fontStr: string, tweaks?: TWEAKS) {
    const { dx, dy, lineno, baseline, align, nlh } = { dx: 0, dy: 0, lineno: 0, ...tweaks }
    const cText = (text instanceof Text) ? text : this.makeText(text, fontStr, tweaks);
    const lineh = cText.lineHeight = nlh ?? (cText.lineHeight > 0 ? cText.lineHeight : cText.getMeasuredLineHeight());
    const line0 = lineno * lineh; // baseline y
    cText.textBaseline = (baseline ?? 'middle'); // 'top' | 'bottom'
    cText.textAlign = (align ?? 'center');
    cText.x += dx;
    cText.y += dy + line0; // place cText in normal/default location

    const gre = tweaks?.glyphRE;
    if (gre && cText.text.match(gre)) {
      // record info for setTextWithGlyph:
      const tweak2 = { ...tweaks, baseline: (baseline ?? 'middle'), align: (align ?? 'center') }
      const fontStr = cText.font;            // shrink-resolved fontName
      const lines = cText.text.split('\n');
      lines.forEach((line, lineinc) => {
        if (line.match(gre)) {
          this.setTextWithGlyph(gre, line, fontStr, lineh, lineno + lineinc, tweak2);
        } else {
          this.setTextTweaks(line, fontStr, { ...tweak2, lineno: lineno + lineinc });
        }

      })
      cText.text = 'ignore';
      return cText; // Note: cText is not a child of cont in this case
    }
    return this.cont.addChild(cText);
  }

  /**
   * Set a SINGLE line (no newlines) filling graphic glyphs.
   * @param line string to interpolate
   * @param fontStr font to use for Text
   * @param lineh line height in use: for glyph size (and newline)
   * @param liney y-coord for this line of text
   * @param lineno current line within multiline string
   * @param tweaks
   */
  setTextWithGlyph(glyphRE: RegExp, line: string, fontStr: string, lineh: number, lineno: number, tweaks: TWEAKS) {
    // const linet = new Text(line, fontStr);
    // const linew = linet.getMeasuredWidth();
    let linex = 0;                 // start at left.
    const liney = lineno * lineh;
    const glyphFunc = tweaks.glyphFunc ??
        ((cont: Container, fragt: Text, trigger: string, tx = 0, ty = 0, lineh = fragt.lineHeight) => {
          return this.setGlyph(cont, fragt, trigger, tx, ty, lineh);
        })
    const matches = line.match(glyphRE)!;
    const frags = line.split(glyphRE);    // ASSERT: this line has a regex match
    frags?.forEach((frag, n, frags) => {  // ASSERT: frag has no newline and no glyph
      const fText = new Text(frag, fontStr, tweaks.color!);
      const fragt = this.setTextTweaks(fText, fontStr, { ...tweaks, dx: linex, dy: liney, align: 'left' });
      linex += fragt.getMeasuredWidth();
      const fragn = matches?.shift();  // the portion of line that matched glyphRE (eg: '$2')
      if (fragn) {                     // ASSERT: a fragn between or after each fragt
        const tx = glyphFunc(this.cont, fragt, fragn, linex, liney, lineh); // there's a glyphRE, so set it:
        linex = linex + tx;
      }
    })
  }

  parseFontStr(fontStr: string) {
    // fontStr like: 'italic 410 36px SF Compact Rounded'
    const regex = /^ *(\w+)? *(thin|light|regular|normal|bold|semibold|heavy|\d+ )? *(\d+)px (.*)$/i;
    const match = fontStr.match(regex);
    const style = match?.[1] ?? F.defaultStyle; // normal
    const weight = match?.[2] ?? F.defaultWght; // 410
    const sizen = match?.[3] ?? F.defaultSize;  // 32px
    const size = (typeof sizen == 'number') ? sizen : Number.parseInt(sizen);
    const family = match?.[4] ?? F.defaultFont;  // 'SF Compact Rounded' or 'Times New Roman'
    return { style, weight, size, family }
  }

  /** make Text with fontStr & tweaks; optionally shrink to fit xwide.
   * @param text string for Text
   * @param fontStr (recalculate size if xwide !== undefined)
   * @param tweaks override fontStr { style, weight, size, family }
   * @param xwide max width of Text, shrink fontSize fit. Leave [undefined] to use fontStr as is.
   */
  makeText(text: string, fontStr: string, tweaks?: TWEAKS, xwide?: number) {
    const { style, weight, size, family, color } = { ...this.parseFontStr(fontStr), ...tweaks };
    const fontStr1 = F.fontSpec(size, family, weight, style);
    const size1 = (xwide == undefined) ? size : this.shrinkFontForWidth(xwide, text, fontStr1);
    const fontStr2 = (xwide == undefined) ? fontStr1 : F.fontSpec(size1, family, weight, style);
    return new Text(text, fontStr2, color);
  }

  /** reduce font size so longest line of text fits in xwide */
  shrinkFontForWidth(xwide: number, text: string, fontspec: string) {
    const size = F.fontSize(fontspec);
    if (xwide <= 0) xwide += (this.nparams['cardw'] - 2 * this.nparams['edge']);
    const lines = text.split('\n');
    let width = 0;
    lines.forEach(line => {
      const wide = new Text(line, fontspec).getMeasuredWidth();
      width = Math.max(width, wide);
    })
    return (width <= xwide) ? size : Math.floor(size * xwide / width);
  }

  /**
   * reference implementation of a glyph function.
   * @param cont Container to hold glyph dispObj
   * @param fragt previous Text (to get size, height, alignment, etc)
   * @param trigger the matched text to be replaced with a glyph
   * @param tx x location for glyph (textAlign: left|center|right)
   * @param ty y location for glyph (textBaseline: top|middle|bottom)
   * @param lineh line height of current line (may differ from fragt.lineHeight)
   * @return width consumed by glyph (pre- and post- space)
   */
  setGlyph(cont: Container, fragt: Text, trigger: string, tx = 0, ty = 0, lineh = fragt.lineHeight) {
    return 0;
  }

}

import { C, F } from "@thegraid/common-lib";
import { CenterText } from "@thegraid/easeljs-lib";
import { Container, Text } from "@thegraid/easeljs-module";

export type BASELINE = "top" | "hanging" | "middle" | "alphabetic" | "ideographic" | "bottom";
export type TWEAKS = {
  align?: 'left' | 'center' | 'right',  baseline?: BASELINE, size?: number,
  font?: string, lineno?: number, wght?: string | number, color?: string,
  dx?: number, dy?: number, nlh?: number, // add lead to after/btwn each line.
  glyphRE?: RegExp, // when matched in setTextWithGlyphs, invoke glyphFunc(match, ...)
  glyphFunc?: ((fragt: Text, trigger: string, tx: number, ty: number, lineh: number) => number), // function to handle glyphRE matches
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

  /** setText [Centered] with Tweaks: { color, dx, dy, lineno, baseline, align, nlh, glyphRE }
   * @param fontSize is fed to makeText (with xwide === undefined)
   * @param fontName is fed to makeText (resolve as fam_wght)
   * @param tweaks: dy: initial y-coord, lineno: advances by lineh;
   */
  setTextTweaks(text: string | Text, fontname: string, fontsize?: number, tweaks?: TWEAKS) {
    const { color, dx, dy, lineno, baseline, align, nlh, wght } = tweaks ?? {};
    if (wght) fontname = F.family_wght(fontname, wght); // `$family $wght`
    const cText = (text instanceof Text) ? text : this.makeText(text, fontsize, fontname, color ?? C.BLACK);
    const fname = cText.font;            // shrink-resolved fontName
    const lineh = cText.lineHeight = nlh ?? (cText.lineHeight > 0 ? cText.lineHeight : cText.getMeasuredLineHeight());
    const line0 = (lineno ?? 0) * lineh; // first
    cText.textBaseline = (baseline ?? 'middle'); // 'top' | 'bottom'
    cText.textAlign = (align ?? 'center');
    cText.x += (dx ?? 0);
    cText.y += ((dy ?? 0) + line0);
    const gre = tweaks?.glyphRE;

    if (gre && cText.text.match(gre)) {
      const tweak2 = { ...tweaks, lineno: 0, baseline: (baseline ?? 'middle'), align: (align ?? 'center') }
      const lines = cText.text.split('\n');
      lines.forEach((line, lineinc) => {
        const liney = (dy ?? 0) + line0 + lineinc * lineh;
        this.setTextWithGlyph(gre, line, fname, lineh, liney, lineinc, tweak2);
      })
      return cText; // Note: cText is not a child of cont in this case
    }
    return this.cont.addChild(cText);
  }

  /**
   * Set a SINGLE line (no newlines) filling graphic glyphs.
   * @param line string to interpolate
   * @param fontn font to use for Text
   * @param lineh line height in use: for glyph size (and newline)
   * @param liney y-coord for this line of text
   * @param lineno current line within multiline string
   * @param tweaks
   */
  setTextWithGlyph(glyphRE: RegExp, line: string, fontn: string, lineh: number, liney: number, lineno: number, tweaks: TWEAKS) {
    const linet = new Text(line, fontn);
    const linew = linet.getMeasuredWidth();
    let linex = -linew / 2;                 // start at left of centered linew.
    const glyphFunc = tweaks.glyphFunc ?? ((fragt: Text, trigger: string, tx = 0, ty = 0, lineh = fragt.lineHeight) => { return this.setGlyph(fragt, trigger, tx, ty, lineh); })
    const matches = line.match(glyphRE)!;
    line.split(glyphRE)?.forEach((frag, n, frags) => {  // ASSERT: frag has no newline
      const fragt = this.setTextTweaks(frag, fontn, undefined, {...tweaks, dx: linex, dy: liney, align: 'left' });
      linex += fragt.getMeasuredWidth();
      const fragn = matches.shift();  // the portion of line that matched glyphRE (eg: '$2')
      if (fragn) {
        const dx = glyphFunc(fragt, fragn, linex, liney, lineh); // there's a glyphRE, so set it:
        linex = linex + dx;
      }
    })
  }

  /** make Text object, optionally shrink to fit xwide.
   * @param size0: requested size of Font (32), shrink to fit if xwide is supplied;
   * @param fam_wght (if fully resolved, supply size0 = xwide = undefined)
   * @param xwide: max width of Text, shrink fontSize fit. supply undefined if fam_wght is fully resolved.
   */
  makeText(text: string, size0 = 32, fam_wght = this.sparams['textFont'], color = C.BLACK, xwide?: number) {
    const fontname0 = (size0 !== undefined) ? F.composeFontName(size0, fam_wght) : fam_wght;
    const fontsize = (xwide !== undefined) ? this.shrinkFontForWidth(xwide, text, size0, fontname0) : size0;
    const fontname = (xwide !== undefined) ? F.composeFontName(fontsize, fam_wght) : fontname0;
    return new CenterText(text, fontname, color);
  }

  /** reduce font size so longest line of text fits in xwide */
  shrinkFontForWidth(xwide: number, text: string, size0: number, fontspec: string,  ) {
    if (xwide <= 0) xwide += (this.nparams['cardw'] - 2 * this.nparams['edge']);
    const lines = text.split('\n');
    let width = 0;
    lines.forEach(line => {
      const wide = new Text(line, fontspec).getMeasuredWidth();
      width = Math.max(width, wide);
    })
    return (width <= xwide) ? size0 : Math.floor(size0 * xwide / width);
  }

  /**
   * reference implementation of a glyph function.
   * @param fragt previous Text (so you can get size, height, alignment, etc)
   * @param trigger the matched text to be replaced with a glyph
   * @param tx x location for glyph (textAlign: left|center|right)
   * @param ty y location for glyph (textBaseline: top|middle|bottom)
   * @param lineh line height of current line (may differ from fragt.lineHeight)
   * @return width consumed by glyph (pre- and post- space)
   */
  setGlyph(fragt: Text, trigger: string, tx = 0, ty = 0, lineh = fragt.lineHeight) {
    return 0;
  }

}

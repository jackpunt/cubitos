import { PageSpec, TileExporter as TileExporterLib, type CountClaz, type GridSpec } from "@thegraid/easeljs-lib";
import { CubeCard } from "./cube-card";

// end imports

export class TileExporter extends TileExporterLib {

  // x0 = pixel margin + bleed + width/2
  static euroPoker: GridSpec = {
    width: 3600, height: 5400, nrow: 6, ncol: 3, cardw: 1040, cardh: 734, double: false,
    x0: 158 + 30 + 1040/2, y0: 320 + 30 + 734/2, delx: 1122.5, dely: 803, bleed: 30,
  }

  override makeImagePages() {
    // [...[count, claz, ...constructorArgs]]
    const cardSingle_euro_back = [
    ] as CountClaz[];
    const cardSingle_euro_base = [
      ...CubeCard.allCards(),
    ] as CountClaz[];

    const pageSpecs: PageSpec[] = [];
    this.clazToTemplate(cardSingle_euro_base, TileExporter.euroPoker, pageSpecs);
    return pageSpecs;
  }

}

import { ImageGrid, PageSpec, TileExporter as TileExporterLib, type CountClaz } from "@thegraid/easeljs-lib";

// end imports

export class TileExporter extends TileExporterLib {

  override makeImagePages() {
    // [...[count, claz, ...constructorArgs]]
    const cardSingle_1_75_back = [
    ] as CountClaz[];
    const cardSingle_1_75_base = [
    ] as CountClaz[];
    const cardSingle_1_75_hand = [
    ] as CountClaz[];

    const pageSpecs: PageSpec[] = [];
    // this.clazToTemplate(labelCols, TrackLabel.gridSpec, pageSpecs)
    // this.clazToTemplate(cardSingle_3_5_track, ImageGrid.cardSingle_3_5, pageSpecs);
    // this.clazToTemplate(cardSingle_1_75_back, ImageGrid.cardSingle_1_75, pageSpecs);
    this.clazToTemplate(cardSingle_1_75_base, ImageGrid.cardSingle_1_75, pageSpecs);
    // this.clazToTemplate(cardSingle_1_75_hand, ImageGrid.cardSingle_1_75, pageSpecs);
    return pageSpecs;
  }

}

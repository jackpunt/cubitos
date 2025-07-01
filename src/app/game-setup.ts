import { stime, type Constructor } from '@thegraid/common-lib';
import { AliasLoader, GameSetup as GameSetupLib, Hex2, HexMap, MapCont, Scenario as Scenario0, Table, Tile, TP, type Hex } from '@thegraid/hexlib';
// import { CardShape } from './card-shape';

import { TileExporter } from './tile-exporter';
import { CubeCard } from './cube-card';

/** returns an Array filled with n Elements: [0 .. n-1] or [dn .. dn+n-1] or [f(0) .. f(n-1)] */
export function arrayN(n: number, nf: number | ((i: number) => number) = 0) {
  const fi = (typeof nf === 'number') ? (i: number) => (i + nf) : nf;
  return Array.from(Array(n), (_, i) => fi(i))
}

type Params = Record<string, any>; // until hexlib supplies
export interface Scenario extends Scenario0 {
  nPlayers?: number;
};

/** initialize & reset & startup the application/game. */
class NullGameSetup extends GameSetupLib {

  constructor(canvasId?: string, qParam?: Params) {
    super(canvasId, qParam)
  }

  tileExporter = new TileExporter(); // enable 'Make Pages' buttons

  override initialize(canvasId: string): void {
    console.log(stime(this, `---------------------   GameSetup.initialize  ----------------`))
    super.initialize(canvasId)
    return;
  }

  override loadImagesThenStartup() {
    AliasLoader.loader.fnames = CubeCard.fnames;
    super.loadImagesThenStartup();    // loader.loadImages(() => this.startup(qParams));
  }

  override startup(scenario: Scenario): void {
    super.startup(scenario);
    Tile.gamePlay = this.gamePlay;
    this.clickButton('makePage'); // app.component.html
    setTimeout(() => this.setScale('.5'), 300);
  }

  setScale(newScale: string) {
    const canvasDiv = document.getElementById('canvasDiv') as HTMLCanvasElement;
    canvasDiv.style.setProperty('scale', newScale);
  }

  clickButton(id: string) {
    const anchor = document.getElementById(id) as HTMLAnchorElement;
    anchor?.onclick?.call(window, {} as any); // no MouseEvent, its not used
  }
  override makeHexMap(
    hexMC: Constructor<HexMap<Hex>> = HexMap,
    hexC: Constructor<Hex> = Hex2, // (radius, addToMapCont, hexC, Aname)
    cNames = MapCont.cNames.concat() as string[], // the default layers
  ) {
    TP.nHexes = 1;
    TP.mHexes = 1;
    const hexMap = super.makeHexMap(hexMC, hexC, cNames); // hexMap.makeAllHexes(nh=TP.nHexes, mh=TP.mHexes)
    return hexMap;
  }

  override makeTable(): NullTable {
    return new NullTable(this.stage);
  }
}

export class GameSetup extends NullGameSetup {

}

class NullTable extends Table {
  // override makePerPlayer(): void {
  // }
  override setupUndoButtons(): void {
  }
  override makeGUIs(scale?: number, cx = -154, cy = 210, dy?: number): void {
    this.guisToMake = []
    if (!this.stage.canvas) return;
    super.makeGUIs(scale, cx, cy);
  }
}

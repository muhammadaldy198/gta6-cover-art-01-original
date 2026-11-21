// Seven unrelated sample sources; one-photo fill is an explicit editing action.
export const PANEL_NAMES=['Hero','The connection','Getaway car','City lights','Palm canopy','After-hours motel','Open water'];
export const DEMO_SOURCES=[
  {name:'Boulevard · fictional kit portrait',path:'samples/boulevard.jpg'},
  {name:'Pier · fictional kit portrait',path:'samples/pier.jpg'},
  {name:'Riviera · CC0 / Joe deSousa',path:'samples/riviera.jpg'},
  {name:'Miami skyline · CC0 / Joe deSousa',path:'samples/skyline.jpg'},
  {name:'Palm canopy · CC0 / Klara Sasova',path:'samples/palms.jpg'},
  {name:'After-hours motel · original illustration',path:'samples/motel.svg'},
  {name:'Sail at sunset · CC0 / safaritravelplus',path:'samples/boat.jpg'},
];
export function startingCrop(photo) { return {photo,zoom:1,x:50,y:15}; }
export function demoPanels() {
  return DEMO_SOURCES.map((source,photo)=>({...startingCrop(photo),x:photo===0?65:photo===5?0:photo===6?30:50,y:photo===0?8:photo===1?0:50,zoom:photo===0?1.18:1}));
}
export function replacePanel(panels,index,photo) {
  return panels.map((crop,i)=>i===index?startingCrop(photo):{...crop});
}
export function fillPanels(panels,photo) { return panels.map(()=>startingCrop(photo)); }

//users/gena/global-hand/hand-100


//FUNCTION DECLARATIONS 
//======================
 
function get_map_bounds_as_polygon(){
  var WSEN=Map.getBounds();
  var W=WSEN[0];
  var S=WSEN[1];
  var E=WSEN[2];
  var N=WSEN[3];
  var geom = ee.Geometry.Polygon([
    [[E, S], [W, S], [W, N], [E, N], [E, S]],
  ]);  
  return geom;
}

function export_hand_image(geom){
  geom = geom || get_map_bounds_as_polygon();
  print(geom);
  var hand_filt=ee.ImageCollection(
    hand
    .filterBounds(geom)
  ).reduce(ee.Reducer.mean());
  print(hand_filt);
  
  Export.image.toDrive({
  image: hand_filt,
  description: 'HAND',
  scale: 30,
  region: geom,
  maxPixels: 1e10
  });    
  return hand_filt;
}
function exportMaps(eventDate){
  var geom = get_map_bounds_as_polygon(); //aoi
  print(geom);
  var handImage = export_hand_image(geom)
  var handImage2 = handImage.clip(aoi);
  
  Map.addLayer(handImage2, {min:0, max:15}, "HAND", true);
}

var exportBtn=ui.Button('Export', exportMaps);
Map.add(exportBtn);


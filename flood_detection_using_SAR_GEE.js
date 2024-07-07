var aoi = ee.FeatureCollection(rangpur);
//------------------------------- DATA SELECTION & PREPROCESSING --------------------------//

// Loading Sentinel-1 Images with metadata properties
var collection = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));
        //.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
       

// Selecting the preflood and during flood timeline
var before = collection.filter(ee.Filter.date('2020-06-01', '2020-06-20')).filterBounds(aoi);
var after = collection.filter(ee.Filter.date('2020-06-27', '2020-08-08')).filterBounds(aoi);

var before =before.mean();
var after = after.mean();

print(before);
print(after);

//Select and clip the study area to VH polarization band
var before_image = before.select('VH').clip(aoi);
var after_image = after.select('VH').clip(aoi);

//Select, mosaic and clip the study area to VV polarization band
var before_imageVV = before.select('VV').clip(aoi);
var after_imageVV = after.select('VV').clip(aoi);

//Speckle filter of Sentinel-1 Images VH polarization
var smoothing_radius = 50;
var before_filtered = before_image.focal_mean(smoothing_radius, 'circle', 'meters');
var after_filtered = after_image.focal_mean(smoothing_radius, 'circle', 'meters');

//Speckle filter of Sentinel-1 Images VV polarization
var smoothing_radius = 50;
var before_filteredVV = before_imageVV.focal_mean(smoothing_radius, 'circle', 'meters');
var after_filteredVV = after_imageVV.focal_mean(smoothing_radius, 'circle', 'meters');

// Determining normal waterbody using masking
var waterbody = before_image.lt(-21).and(after_image.lt(-21));
var waterbody_mask = waterbody.updateMask(waterbody.eq(1));

//Determining flooding by masking
var flood = before_image.gt(-21).and(after_image.lt(-21));
var flood_mask= flood.updateMask(flood.eq(1));

//------------------------------------- Sentinel 2 ------------------------------------//
// Function for cloud coverage 
function maskS2clouds(image) {
  var qa = image.select('QA60');

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask).divide(10000);
}

var dataset = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterDate('2020-06-27', '2020-08-08')
                  // Pre-filter to get less cloudy granules.
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',70))
                  .map(maskS2clouds);

var visualization = {
  min: 0.0,
  max: 0.3,
  bands: ['B4', 'B3', 'B2'],
};
var bands= ['B1','B2','B3','B4','B5','B6','B7','B8','B8A','B9'];
var dataset = dataset.mean().clip(aoi);
Map.addLayer(dataset, visualization, 'RGB');

//------------------------------------- DISPLAY ------------------------------------//

Map.setCenter(88.971157,25.453554,16);
//---- 88.965615,25.455240--- Flooded area//
Map.addLayer(before_image.addBands(after_imageVV).addBands(after_image), {min: -30, max: 8}, 'BVH/AVV/AVH composite',0);
Map.addLayer(before_image,{min:-30,max:0},'before');
Map.addLayer(after_image,{min:-30,max:0},'after');
Map.addLayer(flood_mask,{palette:['#3caadc']},'Flood_inudation');
Map.addLayer(waterbody_mask,{palette:['BLUE']},'Waterbody');


//------------------------------------- EXPORTS (Flood Inundation) ------------------------------------//
// Export flooded area as TIFF file 
Export.image.toDrive({
  image: flood_mask, 
  description: 'Flood_extent_raster',
  fileNamePrefix: 'flooded',
  region: aoi, 
  maxPixels: 1e10
});

Export.image.toDrive({
  image: before_image, 
  description: 'Flood_before_image',
  fileNamePrefix: 'flooded_before_image',
  region: aoi, 
  crs: "EPSG:32735", // EPSG:32735 - WGS 84 / UTM zone 35S - Projected
  scale: 10,
  maxPixels: 1e10
});

// Export flooded area as shapefile (for further analysis in e.g. QGIS)
// Convert flood raster to polygons
var flooded_vec = flood_mask.reduceToVectors({
  scale: 10,
  geometryType:'polygon',
  geometry: aoi,
  eightConnected: false,
  bestEffort:true,
  tileScale:2,
});

// Export flood polygons as shape-file
Export.table.toDrive({
  collection:flooded_vec,
  description:'Flood_extent_vector',
  fileFormat:'SHP',
  fileNamePrefix:'flooded_vec'
});


//------------------------------------- EXPORTS (Permanent Water) ------------------------------------//
// Export flooded area as TIFF file 
Export.image.toDrive({
  image: waterbody_mask, 
  description: 'waterbody_raster',
  fileNamePrefix: 'waterbody',
  region: aoi, 
  maxPixels: 1e10
});

// Export flooded area as shapefile (for further analysis in e.g. QGIS)
// Convert flood raster to polygons
var flooded_vec = waterbody_mask.reduceToVectors({
  scale: 10,
  geometryType:'polygon',
  geometry: aoi,
  eightConnected: false,
  bestEffort:true,
  tileScale:2,
});

// Export flood polygons as shape-file
Export.table.toDrive({
  collection:flooded_vec,
  description:'waterbody_vector',
  fileFormat:'SHP',
  fileNamePrefix:'waterbody_vec'
});




/*

Author: 
S. M. Sohel Rana
Junior Research Fellow
Bangladesh Space Research and Remote Sensing Organization
Agargaon, Dhaka, Bangladesh

*/

var Korea =  (ee.Geometry.BBox(125, 34, 130, 39));
var dataset = ee.ImageCollection('MODIS/061/MOD13A3')
                  .filter(ee.Filter.date('2020-01-01', '2023-12-31'))
                  .map(function(image){return image.clip(Korea)});
var ndvi = dataset.select('NDVI');
var ndvi = ndvi.toList(ndvi.size());
print(ndvi)

for (var jj = 0; jj < ndvi.size().getInfo(); jj++){
  var Ndvi = ee.Image(ndvi.get(jj));

//------------------------------------- EXPORTS ------------------------------------//
  
  // Export DEM area as TIFF file 
  var filename = ee.String('MODIS_Ndvi_')
                .cat(ee.String(Ndvi.id())).getInfo()
  print(filename)
  Export.image.toDrive({ 
  image: Ndvi,
  description: filename,
  fileNamePrefix: filename,
  // scale: 5000, 
  folder: 'MODIS_NDVI',
  fileFormat : 'GeoTIFF',
  crs: 'EPSG:4326'
  });

}



//---------- MODIS LANDCOVER ---------//
var data = MCD12Q1.filter(ee.Filter.date('2001-01-01', '2024-04-19'))
.map(function(image){return image.clip(Korea)});

var data = data.select('LC_Type1');
var List = data.toList(data.size());
// print(List)

for (var jj = 0; jj < List.size().getInfo(); jj++){
  var LC = ee.Image(List.get(jj));

//------------------------------------- EXPORTS ------------------------------------//
  
  // Export DEM area as TIFF file 
  var filename = ee.String('MODIS_LC_')
                .cat(ee.String(LC.id())).getInfo()
  print(filename)
  Export.image.toDrive({ 
  image: LC,
  description: filename,
  fileNamePrefix: filename,
  // scale: 5000, 
  folder: 'MODIS_LC',
  fileFormat : 'GeoTIFF',
  crs: 'EPSG:4326'
  });

}
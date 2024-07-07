// Define years of interest
var years = [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024];

// Function to get Landsat Image Collection by year
var getLandsatImage = function(year) {
  var collection;
  if (year < 1999) {
    collection = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2');
  } else if (year < 2013) {
    collection = ee.ImageCollection('LANDSAT/LE07/C02/T1_L2');
  } else if (year < 2022) {
    collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2');
  } else {
    collection = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2');
  }
  var image = collection
    .filterBounds(dhakaCity)
    .filterDate(ee.Date.fromYMD(year, 1, 1), ee.Date.fromYMD(year, 12, 31))
    .median()
    .clip(dhakaCity);
  return image;
};

 
// Function to perform unsupervised classification
var classifyImage = function(image) {
  var bands;
  if (image.bandNames().contains('SR_B1')) {
    bands = ['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B7'];
  } else {
    bands = ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'];
  }
  
  var training = image.select(bands).sample({
    region: dhakaCity,
    scale: 30,
    numPixels: 5000
  });
  var clusterer = ee.Clusterer.wekaKMeans(8).train(training);
  var result = image.select(bands).cluster(clusterer);
  return result;
};

// Loop through the years and classify images
years.forEach(function(year) {
  var image = getLandsatImage(year);
  var classified = classifyImage(image);
  
  // Add the classified image to the map
  Map.addLayer(classified.randomVisualizer(), {}, 'Classified ' + year);
  
  // Export the classified image to Google Drive
  Export.image.toDrive({
    image: classified,
    description: 'Classified_' + year,
    folder: 'GEE_Exports',
    scale: 30,
    region: dhakaCity,
    fileFormat: 'GeoTIFF'
  });
});

// Center the map on Dhaka City
Map.centerObject(dhakaCity, 10);

// Map Center
Map.centerObject(aoi,12);

//Collect sentinel 1 image
var sent1= ee.Image('COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20201204T120519_20201204T120544_035536_0427AA_39CA').select(['VH']);
Map.addLayer(sent1, {min:-30,max:0},'SAR without speckle filter');
//Speckle filter of Sentinel-1 Images VV polarization
var smoothing_radius = 50;
var sent1 = sent1.focal_mean(smoothing_radius, 'circle', 'meters');


var s1=sent1.clip(aoi);
print(s1);

Map.addLayer(s1,{min:-30,max:0},'SAR from Sentilel1c');

// Compute the histogram of the Image
var histogram = s1.select('VH').reduceRegion({
  reducer: ee.Reducer.histogram(255, 2)
      .combine('mean', null, true)
      .combine('variance', null, true), 
  geometry: aoi, 
  scale: 30,
  maxPixels: 1000000000,
  bestEffort: true
});


// Chart the histogram
print(Chart.image.histogram(s1.select('VH'), aoi, 30));


// Otsu Algorithm
var otsu = function(histogram) {
  var counts = ee.Array(ee.Dictionary(histogram).get('histogram'));
  var means = ee.Array(ee.Dictionary(histogram).get('bucketMeans'));
  var size = means.length().get([0]);
  var total = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
  var sum = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
  var mean = sum.divide(total);
  
  var indices = ee.List.sequence(1, size);
  
  // Compute between sum of squares, where each mean partitions the data.
  var bss = indices.map(function(i) {
    var aCounts = counts.slice(0, 0, i);
    var aCount = aCounts.reduce(ee.Reducer.sum(), [0]).get([0]);
    var aMeans = means.slice(0, 0, i);
    var aMean = aMeans.multiply(aCounts)
        .reduce(ee.Reducer.sum(), [0]).get([0])
        .divide(aCount);
    var bCount = total.subtract(aCount);
    var bMean = sum.subtract(aCount.multiply(aMean)).divide(bCount);
    return aCount.multiply(aMean.subtract(mean).pow(2)).add(
           bCount.multiply(bMean.subtract(mean).pow(2)));
  });
  print(ui.Chart.array.values(ee.Array(bss), 0, means));
  // Return the mean value corresponding to the maximum BSS.
  return means.sort(bss).get([-1]);
};

var threshold = otsu(histogram.get('VH_histogram'));
print('threshold', threshold);


// Classify the Image
var classA = s1.select('VH').lt(threshold);
Map.addLayer(classA.mask(classA), {palette: 'blue'}, 'Flood');


//Visual Inspection with RGB images on Flood Date

//Collect Landsat 8 image
var dataset = ee.ImageCollection("LANDSAT/LC08/C02/T1_TOA")
  .filterDate('2020-12-01', '2020-12-09')
  .filterBounds(aoi);

print(dataset);
var dataset = dataset.mosaic().clip(aoi);
var trueColor432 = dataset.select(['B2','B3','B4','B5','B6','B7']);

var trueColor432Vis = {
  min: 0.0,
  max: 0.4,
};

Map.addLayer(trueColor432, trueColor432Vis, 'True Color (432)');

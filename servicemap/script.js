mapboxgl.accessToken = "pk.eyJ1IjoibWF0dGhld2NvcnRsZXkiLCJhIjoiY2tld21lZnoxNDRqMDJxcGk3Mm1wanNjNyJ9.9ltBoNulOTsYAKcy0wb6Gw"  //restricted to Github.io

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/matthewcortley/cke9r70dq5mlo1arqsnilhtep',
    center: [115.915, 37.889],
    zoom: 3,
    maxZoom: 7,
    minZoom: 3
});
var nav = new mapboxgl.NavigationControl();
map.addControl(nav, 'top-left');

// initialize
document.getElementById('all').classList.add('active')


var source_filter = ['all']  // prepare for multple filters
var services = ['social', 'psycho', 'legal', 'referral', 'refuge', 'funding']  // initial state is all services selected
var service_flips = [0, 0, 0, 0, 0, 0]  // one on one with the services, initially all on or off?
var all_flip = 1  // flip for "all services" in on initially
var current_feature = 0


function includesArray(a, b){
    // compare if an array exists in an array of array xD. 
    a = JSON.stringify(a);
    b = JSON.stringify(b);
    var c = a.indexOf(b);
    if(c != -1){
        return true;
    }
    else {return false;}
}

function findFilterIndex(a, b){
    // a is the base, b is the key to search
    var index = -9
    a.forEach(function(item){
        if (item=='all') {return}
        if (item[0] != b[0]) {return}
        if (item[0] == b[0] && item[0] == '==' && item[1][1] == b[1][1]) {index = a.indexOf(item)}
        if (item[0] == b[0] && item[0] == 'in' && item[1] == b[1]) {index = a.indexOf(item)} 
    })
    return index
}

// filters
function lgbt_filter(){ 
    var checkBox = document.getElementById("checkbox");
    expression = ["==", ['get', 'lgbt_only'], true]
    if (checkBox.checked == true){
        if (!(includesArray(source_filter, expression))){
            source_filter.push(expression);
        };
    };
    if (checkBox.checked == false){
        if (includesArray(source_filter, expression)) {
            index = findFilterIndex(source_filter, expression);
            source_filter.splice(index, 1);
        };
    };
    update(source_filter);
};

function nationwide_filter(){
    var checkBox = document.getElementById("checkbox2");
    expression = ["==", ['get', 'nationwide'], true]
    if (checkBox.checked == true){
        if (!(includesArray(source_filter, expression))){
            source_filter.push(expression);
        };
    };
    if (checkBox.checked == false){
        if (includesArray(source_filter, expression)) {
            index = findFilterIndex(source_filter, expression);
            source_filter.splice(index, 1);
        };
    };
    update(source_filter);
}

function service_filter(service){
    expression = ['in', service, ['get', 'service']];
    flip_index = services.indexOf(service);
    service_flip = service_flips[flip_index]
    // if off, turn on, add filter, change style
    if (service_flip == 0){
        if (!(includesArray(source_filter, expression))){
            source_filter.push(expression);
        };
        service_flips[flip_index] = 1;
        document.getElementById(service).classList.add('active')
        document.getElementById('all').classList.remove('active')
    }
    // if on, turn off, remove filter
    else {
        if (includesArray(source_filter, expression)) {
            index = findFilterIndex(source_filter, expression);
            source_filter.splice(index, 1);
        };
        service_flips[flip_index] = 0;
        document.getElementById(service).classList.remove('active')
    }
    update(source_filter);
    all_flip = 0
};

function all_filter(){
    if (all_flip==1) {
        // you cannot turn it off by just clicking it, nothing happens
        console.log('all filter already on')
    }
    else {  // remove all service filters, and set flips to on
        services.forEach(function(item){
            expression = ['in', item, ['get', 'service']]
            if (includesArray(source_filter, expression)) {
                index = findFilterIndex(source_filter, expression)
                source_filter.splice(index, 1);
            };
            flip_index = services.indexOf(item);
            document.getElementById(item).classList.remove('active')
            service_flips[flip_index] = 0;
        });
        document.getElementById('all').classList.add('active')
        all_flip = 1
    }
    update(source_filter);
};


function update(filter){
    console.log(filter)
    // remove source and layers
    map.removeLayer('clusters');
    map.removeLayer('unclustered-point-count')
    map.removeLayer('cluster-count')
    map.removeLayer('unclustered-point')
    map.removeLayer('unclustered-point-viz')
    map.removeLayer('clustered-point-viz')
    map.removeSource('organizations');
    // add new source with filter 
    addSourceData(filter);
    cluster();
    closePanel();  // always close the panel when filter is updated
};

function addSourceData(filter) {
    if (filter.length != 1){  
        map.addSource('organizations', {
            type: 'geojson',
            data: 'data/features.geojson',
            filter: filter,
            cluster: true,
            generateId: true, 
            clusterMaxZoom: 7, // Max zoom to cluster points on
            clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
            });
    }
    else {  // when there's no filter
        map.addSource('organizations', {
            type: 'geojson',
            data: 'data/features.geojson',
            cluster: true,
            generateId: true, 
            clusterMaxZoom: 7, // Max zoom to cluster points on
            clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
            });
    }
};

function cluster() {
    // cluster and point symbols
    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'organizations',
        filter: ['has', 'point_count'],
        paint: {'circle-color': '#51bbd6',
            'circle-radius': ['step',['get', 'point_count'], 15, 3, 20, 5, 30]}
        });
        map.addLayer({
            id: 'clustered-point-viz',
            type: 'circle',
            source: 'organizations',
            filter: ['has', 'point_count'],
            paint: {'circle-color': ['case', ['boolean', ['feature-state', 'click'], false], '#f28cb1', '#51bbd6'], 'circle-radius': ['step',['get', 'point_count'], 15, 3, 20, 5, 30]}
            });
    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'organizations',
        filter: ['has', 'point_count'],
        layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12}
        });
    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'organizations',
        filter: ['!', ['has', 'point_count']],
        paint: {'circle-color': '#51bbd6', 'circle-radius': 10}
        });
        map.addLayer({
            id: 'unclustered-point-viz',
            type: 'circle',
            source: 'organizations',
            filter: ['!', ['has', 'point_count']],
            paint: {'circle-color': ['case', ['boolean', ['feature-state', 'click'], false], '#f28cb1', '#51bbd6'], 'circle-radius': 10, 'circle-stroke-width': 1, 'circle-stroke-color': '#fff'}
            });
    map.addLayer({
        id: 'unclustered-point-count',
        type: 'symbol',
        source: 'organizations',
        filter: ['!',['has', 'point_count']],
        layout: {
        'text-field': "1",
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
        }
        });
};

map.on('load', function() {
    addSourceData(source_filter);
    cluster();
    console.log('loaded')
});

// interactions
// Change the cursor to a pointer when the mouse is over the layer.
map.on('mouseenter', 'clusters', function() {
map.getCanvas().style.cursor = 'pointer';
    });
map.on('mouseenter', 'unclustered-point', function() {
    map.getCanvas().style.cursor = 'pointer';
        });
// Change it back to a pointer when it leaves.
map.on('mouseleave', 'clusters', function() {
map.getCanvas().style.cursor = '';
    });
map.on('mouseleave', 'unclustered-point', function() {
    map.getCanvas().style.cursor = '';
        });
// click and zoom on clusters 
map.on('click', 'clusters', function(e) {
    var curr_zoom = map.getZoom();
    closePanel();  // close panel when you are about to zoom
    if (current_feature != 0)
    {map.removeFeatureState({source: "organizations", id: current_feature})}
    if (curr_zoom < map.getMaxZoom()-1){  // if can zoom, zoom
        var features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters']});
            var clusterId = features[0].properties.cluster_id;
            map.getSource('organizations').getClusterExpansionZoom(clusterId,function(err, zoom) {
                if (err) return;
                map.easeTo({center: features[0].geometry.coordinates,zoom: zoom})}
            );
    }  
    else { // if cannot zoom anymore, show pop up and change color
        var features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters']
            });
        var clusterId = features[0].properties.cluster_id;
        var pointCount = features[0].properties.point_count;
        cluster_points = map.getSource('organizations').getClusterLeaves(clusterId, pointCount, 0, function(error, features) {
            // features is a list of objects
            full_string = ``
            features.forEach(function(item) {
                html_string = styleHTML(item)
                with_div = `<div class="block" id="block">`+html_string+`</div>`
                full_string = full_string.concat(with_div)
            })
            document.getElementById("innerPanel").innerHTML = full_string;
            openPanel();
        // change color
        map.setFeatureState({source: 'organizations', id: features[0].id,}, {click: true});
        current_feature = features[0].id
        })
    }
    });
// click and zoom on points, show side panel
map.on('click', 'unclustered-point', function(e) {
    closePanel();
    // color change
    if (current_feature != 0)
     {map.removeFeatureState({source: "organizations", id: current_feature})} // remove old featue state
    map.setFeatureState({source: 'organizations', id: e.features[0].id,}, {click: true});
    map.setZoom(map.getMaxZoom()-2);
    map.setCenter(e.lngLat);
    html_string = `<div class="block" id="block">`+styleHTML(e.features)+`</div>`;
    document.getElementById("innerPanel").innerHTML = html_string;
    openPanel();
    current_feature = e.features[0].id
    });
//close the panel when clicking elsewhere
map.on('click', function(e) {
    var features = map.queryRenderedFeatures(e.point);
    if (features.length==0 || (!(['clusters', 'unclustered-point', 'unclustered-point-count', 'cluster-count'].includes(features[0].layer.id)))) {closePanel()} 
    if (features.length==0 || (!(['clusters', 'unclustered-point', 'unclustered-point-count', 'cluster-count'].includes(features[0].layer.id)))) {
        map.removeFeatureState({source: "organizations"},
        current_feature = 0)
    } 
    else {return}
});

// open and close sidepanel
function openPanel() {
    document.getElementById("mySidepanel").style.visibility = "visible"
    document.getElementById("mySidepanel").style.width = "400px";
};
function closePanel() {
    document.getElementById("mySidepanel").style.width = "0";
    document.getElementById("mySidepanel").style.visibility = "hidden"
};

// style sidebar html
function styleHTML(features) {
    try {
        var description = JSON.parse(features[0].properties.description);
        var name = features[0].properties.name;
        var lgbt_only = features[0].properties.lgbt_only;
        var services = JSON.parse(features[0].properties.service)
        html_header = headerHTML(name, lgbt_only, description)
        html_tags = tagHTML(services) 
        html_contents = contentHTML(description)

        html_string = html_header.concat(html_tags).concat(html_contents)
        return html_string
    }
    catch
    { // the feautres is slightly different for clutered points
        var description = features.properties.description;
        var name = features.properties.name;
        var lgbt_only = features.properties.lgbt_only;
        var services = features.properties.service
        html_header = headerHTML(name, lgbt_only, description)
        html_tags = tagHTML(services) 
        html_contents = contentHTML(description)
        html_string = html_header.concat(html_tags).concat(html_contents)
        return html_string
    };
}

function headerHTML(name, lgbt_only, description) {
    img_line = `<img src="${description.logo}" style="height: 50px">`
    if (lgbt_only == true) {
        header_line = `<h4><strong>${name} &#x1F308</strong></h4>`}
    else {header_line = `<h4><strong>${name}</strong></h4>`}
    return img_line.concat(header_line)
}

function tagHTML(sList) {
    service_list = {
        social : `<div class="tag small" style="background: indianred; cursor: default">社工服务</div>`,
        psycho : `<div class="tag small" style="background: orange; cursor: default">心理咨询</div>`,
        legal : `<div class="tag small" style="background: gold; cursor: default">法律服务</div>`,
        referral : `<div class="tag small" style="background: seagreen; cursor: default">转介</div>`,
        refuge : `<div class="tag small" style="background: skyblue; cursor: default">庇护</div>`,
        funding : `<div class="tag small" style="background: plum; cursor: default">紧急资金救助</div>`
    }
    
    var base_string = ''
    sList.forEach(function (item) {
        base_string = base_string.concat(service_list[item])
    })
    var full_string = `<div class="tags">${base_string}</div>`
    return full_string
}

function contentHTML(descriptList) {
    // it's a mess! but it works... 
    var base_string = ''
    bio_str = ''
    if ("bio" in descriptList) {
        bio_str = `<div style="font-size: 0.8rem">${descriptList["bio"]} </div>`
    }
    Object.keys(descriptList).forEach(function (item) {
        if (item == "bio" || item == "logo" || item == "QR") {return}
        else if (item == "网站") {
            str = `<li class="panelList" style="list-style: none"><strong>${item}: </strong><a href=${descriptList[item]}>${descriptList[item]}</a></li>`
        }
        else {
            str = `<li class="panelList" style="list-style: none"><strong>${item}: </strong>${descriptList[item]}</li>`}
        base_string = base_string.concat(str)
    })

    if ("QR" in descriptList) {
        base_string = bio_str+`<div style="width: 60%; float: left" >`+base_string+`</div>`
        qr_string = `<div style="width: 30%; float: right"><img style="height: 80px" src=${descriptList["QR"]}></div>`
        base_string = base_string.concat(qr_string)
    }
    else {
        base_string = bio_str+`<div>`+base_string+`</div>`
    }
    var full_string = `<div>${base_string}</div>`
    return full_string
}
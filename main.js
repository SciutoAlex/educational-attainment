
var width = 700,
    height = 425;

var histWidth = 340,
    histHeight = 100;

var path = d3.geo.path()
    .projection(null);

var svg = d3.select(".map")
    .attr("width", width)
    .attr("height", height);

var svgHist = d3.select('.histogram')
    .attr("width", histWidth)
    .attr("height", histHeight);

var histWidthScale, histHeighScale, histogramJoin, circleJoin;
var data;

var radius = d3.scale.sqrt()
    .domain([0, 100])
    .range([1, 8]);

var red = "#4aa738",
    green = "#b64a02"
    gray = "#333";

var series = "bachelorPercent";


//Initialize the typeahead engine
//==========
var engine = new Bloodhound({
  local : [],
  name: 'search',
  limit: 30,
  datumTokenizer: function(d) {
    return Bloodhound.tokenizers.whitespace(d.name);
  },
  queryTokenizer: Bloodhound.tokenizers.whitespace
});

engine.initialize();

var countyTypeAhead = $('.typeahead').typeahead({
  minLength: 3,
  highlight: true,
  hint: false
},
{
  name: 'my-dataset',
  source: engine.ttAdapter(),
  displayKey : "name"
})
.focus(function() {
  $(this).val("");
});

countyTypeAhead.on('typeahead:selected', function(e, data, datasetName) {
  var functionToFire = $.proxy(refreshMap, data.context );
  functionToFire(data.data);
});


//Connect Button Event
//============
$('.button').click(function() {
  changeSeries($(this).attr('data-series'));
  $(this).siblings().removeClass('featured');
  $(this).addClass('featured')
});

//Connect Examples
//============
$('.example').click(function() {
  var countyName = $(this).attr('data-name');
  console.log(data);
  engine.get(countyName, function(suggestions) {
    console.log(suggestions);
    suggestions.map(function(suggestion) {
    var functionToFire = $.proxy(refreshMap, suggestion.context );
    functionToFire(suggestion.data);
    });
  });
})


d3.json("us.json", function(error, us) {
  if (error) return console.error(error);


  //Create the histogram
  //=========

  data = topojson.feature(us, us.objects.counties).features;
  var binNumber = 60;
  var dataHistogram = d3.layout.histogram()
    .value(function(d) { return d.properties[series]; })
    .bins(binNumber)
    (topojson.feature(us, us.objects.counties).features);


  topojson.feature(us, us.objects.counties).features.map(function(d) {
    d.properties.bin = binIndex(d, dataHistogram);
  });


  histHeightScale = d3.scale.linear()
      .domain([0, 500])
      .range([0, histHeight-40]);

  histWidthScale = d3.scale.linear()
      .domain(d3.extent(topojson.feature(us, us.objects.counties).features, function(d) { return d.properties[series]}))
      .range([0, histWidth]);

  svgHist.append('g')
    .attr('class', 'bars')
    .attr('transform', 'translate(0, 20)');

  histogramJoin = svgHist.select('.bars').selectAll('.bar')
    .data(dataHistogram)
  .enter().append('rect')
    .attr('class', 'bar')
    .attr('width', parseInt(histWidth/binNumber - 1))
    .attr('height', function(d) {
      if(d.y != 0) {
        return histHeightScale(d.y)+1;
      } else {
        return histHeightScale(d.y);
      }
    })
    .attr('y', function(d) {
      if(d.y != 0) {
        return histHeight-40 - histHeightScale(d.y)-1;
      } else {
        return histHeight-40 - histHeightScale(d.y);
      }
    })
    .attr('x', function(d, i) { return histWidthScale(d.x); });


  var axes = svgHist.append('g')
    .attr('class', 'axes');

  axes.selectAll('.labels')
    .data(d3.extent(topojson.feature(us, us.objects.counties).features, function(d) {return d.properties[series]; }))
    .enter()
      .append('text')
        .text(function(d) { return d + "%";})
        .attr('x', function(d) { return histWidthScale(d)})
        .attr('y', histHeight-8)
        .attr('text-anchor', function(d,i) {
          if(i == 0) {
            return "start";
          } else {
            return "end";
          }
        });
  axes.append('line')
    .attr('y1' , histHeight-19)
    .attr('y2', histHeight-19)
    .attr('x1', 0)
    .attr('x2', histWidth);


  svgHist.append('g')
    .attr('class', 'markers')
    .append('circle')
      .attr('class', 'selected-marker')
      .attr('r', 2)
      .attr('cy', 10);

  svgHist.select('.markers')
    .append('circle')
      .attr('class', 'hover-marker')
      .attr('r', 2)
      .attr('cy', histHeight-5);


  //Create the Key
  //==================

  svg.append('g')
    .attr('class', 'legend')
    .attr('transform', 'translate(410, 385)')
    .selectAll('circles')
    .data([30, 15, 3, 15, 30])
    .enter()
    .append('circle')
    .attr('r', function(d) {return radius(d); })
    .attr('cx', function(d,i) { return i*15; })
    .style("fill", function(d, i) {
      var returnVal = "";
      if(i < 2) {
        returnVal = green;
      } else if ( i > 2) {
        returnVal = red;
      } else {
        returnVal = gray;
      }
      return returnVal;
    })
    .style("fill-opacity", function(d, i) {
      var returnVal = "";
      if(i == 2) {
        returnVal = 1;
      } else {
        returnVal = .3;
      }
      return returnVal;
    })
    .style("stroke", function(d,i) {
      var returnVal = "";
      if(i < 2) {
        returnVal = green;
      } else if (i > 2) {
        returnVal = red;
      } else {
        returnVal = gray;
      }
      return returnVal;
    });

  svg.select('.legend').append('g').attr('class', 'text').attr('transform', 'translate(0, 15)');
  svg.select('.text').append('text').text('less').attr('x', 5).attr('text-anchor', 'end').style('fill', "#8e806a");
  svg.select('.text').append('text').text('equal').attr('x', 25).attr('text-anchor', 'middle').style('fill', "#8e806a");
  svg.select('.text').append('text').text('greater').attr('x', 45).attr('text-anchor', 'start').style('fill', "#8e806a");
  svg.select('.text').append('text').text('educational attainment by county').attr('x', -40).attr('y', 15).attr('text-anchor', 'start');





  //Create the Map
  //=====================
  svg.append("path")
      .datum(topojson.feature(us, us.objects.nation))
      .attr("class", "land")
      .attr("d", path);

  svg.append("path")
      //.datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .datum(topojson.mesh(us, us.objects.states))
      .attr("class", "border border--state")
      .attr("d", path);

  circleJoin = svg.append("g")
    .attr("class", "bubble grad")
  .selectAll("circle")
    .data(topojson.feature(us, us.objects.counties).features
      .sort(function(a, b) { return b.properties[series] - a.properties[series]; }))
  .enter().append("circle")
    .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
    .attr("r", function(d) { return radius(d.properties[series]); })
    .attr("data-name" , function(d) { return d.properties.name; });


  svg.append("g")
      .attr("class", "counties")
    .selectAll("counties")
      .data(topojson.feature(us, us.objects.counties).features)
    .enter().append('path')
      .attr("d", path)
      .on('mouseover', hoverMap)
      .on('mouseout', function() {
        d3.select(this).classed("hovered", false);
      })
      .on('click', refreshMap)
      .each(addCountyToTypeAhead)
      .each(function(d) {
        if(d.properties.hsPercent > 100) {
          console.log(d.properties);
        }
      });

    $('.counties path').eq(45).d3Click();

});



  //Add histogram bins to the data pieces
  //==========
  function binIndex(d, hist) {
      var dataToBin = d.properties[series];
      var returnVal = 0;
      hist.map(function(d,i) {
        var ceil = d.x + d.dx;
        var floor = d.x;
        if(dataToBin > floor && dataToBin < ceil) {
          returnVal = i;
        }
      })
      return returnVal;
  }

  //Function called for each county to add counties to typeahead
  //==========
  function addCountyToTypeAhead(d) {
    if(d.properties.name) {
      engine.add({
        "name" : d.properties.name,
        "context" : this,
        "data" : d
      });
    }
  }


  //Function to change when hovering
  //=======

  function hoverMap(d) {
    d3.select(this).classed("hovered", true);



    var hsPercent = d.properties.hsPercent;
    var gradPercent = d.properties.graduatePercent;
    var bachelorPercent = d.properties.bachelorPercent;
    var basePercent;
    if(series == "graduatePercent") {
      basePercent = gradPercent;
    } else if(series == "bachelorPercent"){
      basePercent = bachelorPercent;
    }else if(series == "hsPercent"){
      basePercent = hsPercent;
    }
    var currentBin = d.properties.bin;



    svgHist.select('.markers').select('.hover-marker')
      .transition().duration(500)
        .attr('transform', 'translate('+ histWidthScale(basePercent) +','+ 0 +')');

    var stats = $('.hovered .stat div');
    stats.eq(0).html(gradPercent + "%");
    stats.eq(1).html(bachelorPercent + "%");
    stats.eq(2).html(hsPercent + "%");
    $('.hovered .name').html(d.properties.name);


  }

  //Function to change the map based on county selected
  //this =
  //==========
  var currentContext, currentData, currentBin;
  function refreshMap(d) {
    console.log(currentData)
    if(this !== window) {
      currentContext = this;
      currentData = d;
    }
    var hsPercent = currentData.properties.hsPercent;
    var gradPercent = currentData.properties.graduatePercent;
    var bachelorPercent = currentData.properties.bachelorPercent;
    currentBin = currentData.properties.bin;

    var basePercent;
    if(series == "graduatePercent") {
      basePercent = gradPercent;
    } else if(series == "bachelorPercent"){
      basePercent = bachelorPercent;
    }else if(series == "hsPercent"){
      basePercent = hsPercent;
    }


    //add the selected class to the selected path
    d3.selectAll(".counties path").classed("selected", false);
    d3.select(currentContext).classed("selected", true);

    //Modify all the circles
    svg.select(".grad").selectAll('circle')
      .sort(function(a, b) { return b.properties[series] - a.properties[series]; })
      .transition()
      .duration(500)
      .attr("r", function(d) { return radius(Math.abs(basePercent - d.properties[series])); })
      .style("fill", function(d) {
        var returnVal = "";
        if(d.properties.bin < currentBin) {
          returnVal = green;
        } else if ( d.properties.bin > currentBin) {
          returnVal = red;
        } else {
          returnVal = gray;
        }
        return returnVal;
      })
      .style("fill-opacity", function(d) {
        var returnVal = "";
        if(d.properties.bin == currentBin) {
          returnVal = 1;
        } else {
          returnVal = .3;
        }
        return returnVal;
      })
      .style("stroke", function(d) {
        var returnVal = "";
        if(d.properties.bin < currentBin) {
          returnVal = green;
        } else if ( d.properties.bin > currentBin) {
          returnVal = red;
        } else {
          returnVal = gray;
        }
        return returnVal;
      })


      //Update the histogram
      svgHist.select('.markers').select('.selected-marker')
        .transition().duration(500)
          .attr('transform', 'translate('+ histWidthScale(basePercent) +','+ 0 +')');

      console.log(currentBin)
      //And update histogram colors
      histogramJoin
        .transition().duration(500)
          .style("fill", function(d, i) {
            var returnVal = "";
            if(i < currentBin) {
              returnVal = green;
            } else if ( i > currentBin) {
              returnVal = red;
            } else {
              returnVal = "black";
            }
            return returnVal;
          });

      //Update Sidebar
      var stats = $('.selected .stat div');
      stats.eq(0).html(gradPercent + "%");
      stats.eq(1).html(bachelorPercent + "%");
      stats.eq(2).html(hsPercent + "%");
      $('.typeahead').val(currentData.properties.name);

  }


  //
  //
  //=======

  jQuery.fn.d3Click = function () {
  this.each(function (i, e) {
    var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

    e.dispatchEvent(evt);
  });
};

  //Change the map for different series
  //
  //==========
  function changeSeries(_series) {
    series = _series;

    var binNumber = 60;
    var dataHistogram = d3.layout.histogram()
      .value(function(d) {return d.properties[series];})
      .bins(binNumber)
      (data);

    data.map(function(d) {
      d.properties.bin = binIndex(d, dataHistogram);
    });

    histHeightScale = d3.scale.linear()
        .domain([0, 500])
        .range([0, histHeight-40]);

    histWidthScale = d3.scale.linear()
        .domain(d3.extent(data, function(d) { return d.properties[series]}))
        .range([0, histWidth]);


    $.proxy(refreshMap(currentData), currentContext);

    histogramJoin
      .data(dataHistogram)
        .transition().duration(500)
          .attr('height', function(d) {
            if(d.y != 0) {
              return histHeightScale(d.y)+1;
            } else {
              return histHeightScale(d.y);
            }
          })
          .attr('y', function(d) {
            if(d.y != 0) {
              return histHeight-40 - histHeightScale(d.y)-1;
            } else {
              return histHeight-40 - histHeightScale(d.y);
            }
          })
          .style("fill", function(d, i) {
            var returnVal = "";
            if(i < currentBin) {
              returnVal = green;
            } else if ( i > currentBin) {
              returnVal = red;
            } else {
              returnVal = "black";
            }
            return returnVal;
          });

      d3.select('.axes').selectAll('text')
        .data(d3.extent(data, function(d) {return d.properties[series]; }))
            .text(function(d) { return d + "%";});


      $('.stats').find('.stat').removeClass('featured');
      var divToHighlight = 0;
      if(series == "graduatePercent") divToHighlight = 0;
      if(series == "bachelorPercent") divToHighlight = 1;
      if(series == "hsPercent") divToHighlight = 2;
      $('.stats').eq(0).find('.stat').eq(divToHighlight).addClass('featured');
      $('.stats').eq(1).find('.stat').eq(divToHighlight).addClass('featured');


  }


$("#viz").append("<div class='tip'></div>");
$(".tip").hide();

draw();

var ww = $(window).width();

$(window).smartresize(function(){

  if (ww !== $(window).width()){
    draw();
    ww = $(window).width();  
  }

  
});

function draw(){
  var annotations = [];
  $("svg").remove();

  var device = getDevice($(window).width());
  function getDevice(x){
    return x <= 768 ? "mobile" : "desktop";
  }

  var ht = device == "mobile" ? window.innerHeight : window.innerHeight * .8;
  var wd = device == "mobile" ? window.innerWidth : d3.min([1600, window.innerWidth]);

  var margin = {top: 30, right: device == "mobile" ? 10 : 150, bottom: 30, left: device == "mobile" ? 10 : 150},
    width = wd - margin.left - margin.right,
    height = ht - margin.top - margin.bottom;

  var resp = getResponsiveObject(device);
  function getResponsiveObject(x){
    var obj = {};
    if (x == "mobile") {
      obj.axisRange = [height, 0];
      obj.axisTransform = "translate(" + (40) + ",0)";
      obj.forceX = d3.forceX(width / 2);
      obj.forceY = obj.forceY = d3.forceY(function(d) { return axisScale(d.value); }).strength(1);
      obj.maxSize = 50;
    } else {
      obj.axisRange = [0, width];
      obj.axisTransform = "translate(0," + (height) + ")";
      obj.forceX = d3.forceX(function(d) { return axisScale(d.value); }).strength(1);
      obj.forceY = d3.forceY(height / 2);
      obj.maxSize = 100;
    }
    return obj;
  }

  var svg = d3.select("#viz").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom);

  var formatValue = d3.format("%");

  var axisScale = d3.scaleLinear()
      .rangeRound(resp.axisRange)
      .domain([-.8, 1]);

  resp.axis = device == "mobile" ? d3.axisLeft(axisScale).ticks(20, "%") : d3.axisBottom(axisScale).ticks(20, "%");

  var sizeScale = d3.scaleLinear()
      .range([5, resp.maxSize]);

  var colorScale = d3.scaleOrdinal()
      .range(["#334d5c", "#45b29b", "#df5a49"]);

  var g = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var swoopy = d3.swoopyDrag()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; });

  d3.csv("data.csv", type, function(error, data) {

    if (error) throw error;

    // remove ones with zero last year
    data = data.filter(function(d){ return d["2017-18 (RE)"] !== "0"; })

    sizeScale.domain(d3.extent(data, function(d) { return d.size; }));
    colorScale.domain(_.chain(data).pluck("category").uniq().value())

    drawLegendColors(data);
    drawLegendSize(data);

    var simulation = d3.forceSimulation(data)
        .force("x", resp.forceX)
        .force("y", resp.forceY)
        .force("collide", d3.forceCollide(function(d, i){ return sizeScale(d.size) + 1; }))
        .stop();

    for (var i = 0; i < 250; ++i) simulation.tick();

    g.append("g")
        .attr("class", "axis")
        .attr("transform", resp.axisTransform)
        .call(resp.axis);

    var cell = g.append("g")
        .attr("class", "cells")
        .selectAll("g").data(d3.voronoi()
          .extent([[-margin.left, -margin.top], [width + margin.right, height + margin.top]])
          .x(function(d) { return d.x; })
          .y(function(d) { return d.y; })
          .polygons(data)).enter().append("g");

    data.forEach(function(d){
      // console.log(d.scheme);
      if (d.scheme == "Mahatma Gandhi National Rural Employment Guarantee Program") {
        var obj = {};
        var size = sizeScale(d.size);
        obj.text = "MGNREGS";
        obj.path = "";
        obj.x = d.x;
        obj.y = d.y;
        obj.textOffset = [0,0];
        annotations.push(obj);
      };

      if (d.scheme == "National Highways Authority of India including Road Works") {
        var obj = {};
        var size = sizeScale(d.size);
        obj.text = "Highways";
        obj.path = "";
        obj.x = d.x;
        obj.y = d.y;
        obj.textOffset = [0,0];
        annotations.push(obj);
      };

    });

    // circle
    cell.append("circle")
        .attr("class", function(d, i) { if (d != undefined) return "circle c-" + i + "-" + strings.toSlugCase(d.data.scheme); })
        .attr("r", function(d) { if (d != undefined) return sizeScale(d.data.size); })
        .attr("cx", function(d) { if (d != undefined) return d.data.x; })
        .attr("cy", function(d) { if (d != undefined) return d.data.y; })
        .style("fill", function(d) { if (d != undefined) return colorScale(d.data["category"]); });

    if (device == "mobile"){
      resp.noChangeLine_x1 = 40;
      resp.noChangeLine_x2 = width;
      resp.noChangeLine_y1 = axisScale(0);
      resp.noChangeLine_y2 = axisScale(0);
      resp.noChangeText_x = width;
      resp.noChangeText_y = axisScale(0) - 3;
      resp.noChangeText_anchor = "end";
      resp.annText_y = 0;
    } else {
      resp.noChangeLine_x1 = axisScale(0);
      resp.noChangeLine_x2 = axisScale(0);
      resp.noChangeLine_y1 = 0;
      resp.noChangeLine_y2 = height;
      resp.noChangeText_x = axisScale(0) + 3;
      resp.noChangeText_y = height - 3;
      resp.noChangeText_anchor = "start";
      resp.annText_y = (height / 2) - 120;
    }

    // no change line
    g.append("line")
        .attr("x2", resp.noChangeLine_x2)
        .attr("x1", resp.noChangeLine_x1)
        .attr("y2", resp.noChangeLine_y2)
        .attr("y1", resp.noChangeLine_y1)
        .style("stroke-width", "2px")
        .style("stroke-dasharray", "5px")
        .style("stroke", "#888").moveToBack();

    // no change text
    g.append("text")
        .attr("x", resp.noChangeText_x)
        .attr("y", resp.noChangeText_y)
        .text("No change")
        .style("fill", "#888")
        .style("text-anchor", resp.noChangeText_anchor)
        .style("text-shadow", "-1px -1px 1px #f7f7f7, -1px 0px 1px #f7f7f7, -1px 1px 1px #f7f7f7, 0px -1px 1px #f7f7f7, 0px 1px 1px #f7f7f7, 1px -1px 1px #f7f7f7, 1px 0px 1px #f7f7f7, 1px 1px 1px #f7f7f7");

    // axis text
    g.append("text")
        .attr("x", 0)
        .attr("y", height - 3)
        .text("Percent change, 17-18 (RE) to 18-19 (BE)")
        .style("display", device == "mobile" ? "none" : "block")
        .style("fill", "#3a403d")
        .style("font-size", ".8em")
        .style("text-anchor", "start")
        .style("text-shadow", "-1px -1px 1px #f7f7f7, -1px 0px 1px #f7f7f7, -1px 1px 1px #f7f7f7, 0px -1px 1px #f7f7f7, 0px 1px 1px #f7f7f7, 1px -1px 1px #f7f7f7, 1px 0px 1px #f7f7f7, 1px 1px 1px #f7f7f7");


    g.append("text")
        .attr("x", width)
        .attr("y", resp.annText_y)
        .style("font-size", ".8em")
        .style("fill", "#888")
        .style("text-anchor", device == "mobile" ? "start" : "end")
        .style("text-shadow", "-1px -1px 1px #f7f7f7, -1px 0px 1px #f7f7f7, -1px 1px 1px #f7f7f7, 0px -1px 1px #f7f7f7, 0px 1px 1px #f7f7f7, 1px -1px 1px #f7f7f7, 1px 0px 1px #f7f7f7, 1px 1px 1px #f7f7f7")
        .tspans(d3.wordwrap("Budgets for these schemes were more than doubled.", 15));

    swoopy.annotations(annotations);

    var swoopySel = g.append('g')
			    .attr("class", "annotation")
			    .call(swoopy);

    d3.selectAll(".annotation text").style("text-anchor", "middle");


    // tips
    d3.selectAll("circle").on("mousemove", tipOn).on("mouseout", tipOff);
    svg.on("mouseout", function(){

      $(".tip").hide()
    });


    function tipOn(d, i){

      var dat = d.data;
      var elem = ".circle.c-" + i + "-" + strings.toSlugCase(dat.scheme);

      $(".tip").empty();

      // show
      d3.select(elem).moveToFront();
      d3.selectAll(".text").moveToFront();
      $(".tip").show();
      $(".circle").removeClass("highlight");
      $(elem).addClass("highlight");

      // populate
      $(".tip").append("<div class='name'>" + dat.scheme + "</div>");
      $(".tip").append("<div class='ministry' style='color:" + colorScale(dat["category"]) + "'>" + dat["category"] + "</div>");
      $(".tip").append("<table></table>");
      $(".tip table").append("<thead><td>2017-18 (Rs)</td><td>2018-19 (Rs)</td><td>Change</td></thead>");

      console.log(dat.pct);

      $(".tip table").append("<tr class='data'><td>" + strings.numberLakhs(dat["2017-18 (RE)"]) + " cr</td><td>" + strings.numberLakhs(dat["2018-19 (BE)"]) + " cr</td><td><span style='color:" + (dat.pct > 0 ? "#45b29b" : dat.pct == 0 ? "#000" : "#df5a49")  + "'>" + strings.numberDecimals(dat.pct * 100, 2) + "%</span></td></tr>");

      // position
      // calculate top
      function calcTop(d){

        var y = d.y;
        var h = $(".tip").height();
        var ot = $("svg").offset().top;
        var st = $(window).scrollTop();
        var r = sizeScale(d.size);
        var t = y - r - h + ot - st + 10;

        if (t < 40){
          t = y + r + (h/2.7) + ot - st + 10;
          $(".tip").addClass("bottom").removeClass("top");
        } else {
          $(".tip").addClass("top").removeClass("bottom");
        }

        return t;
      }

      function calcLeft(d){
        var x = d.x;
        var r = sizeScale(d.size);
        var w = $(".tip").width();
        var l = x - w / 2 + r;
        var left_offset = $("svg").offset().left
        return device == "mobile" ? 0 : left_offset + x + margin.left - w / 2;
      }

      $(".tip").css({
        top: calcTop(dat),
        left: calcLeft(dat)
      });
      $(window).resize(function(){
        $(".tip").css({
          top: calcTop(dat),
          left: calcLeft(dat)
        });
      });

    }

    function tipOff(d){

      $(".circle").removeClass("highlight");
    }

  });

  function type(d) {
    var a = d["2017-18 (RE)"],
      b = d["2018-19 (BE)"];
    if (!a || !b) return;
    d.value = (b - a) / a;
    d.pct = d.value;
    d.size = +b;
    if (d.value > 1) d.value = 1;
    return d;
  }

  function drawLegendColors(data){
    $("#colors").remove();
    $("#legend").append("<div id='colors'></div>")
    $("#legend #colors").append("<div class='header'>Colour represents scheme category</div><div class='items'></div>")

    var cats = _.chain(data).pluck("category").uniq().value();

    cats.forEach(function(d, i){
      $("#legend #colors .items").append("<div class='item'><div class='swatch' style='background:" + colorScale(d) + "'></div>" + d + "</div>");
    })

  } // end drawLegendColors

  function drawLegendSize(data){

    $("#size").remove();
    $("#legend").append("<div id='size'></div>")
    $("#legend #size").append("<div class='header'>Size represents expenditure estimate, 2018-19</div>")
    $("#legend #size").append("<div class='c-wrapper'></div>")

    var sizes = [1000,5000,10000];

    sizes.forEach(function(d, i){
      $("#legend #size .c-wrapper").append("<div class='item item-" + i + "'><div class='legend-circle' style='width:" + sizeScale(d*2) + "px;height:" + sizeScale(d*2) + "px;'></div></div>")
      if (i == 0){
        $("#legend #size .c-wrapper .item-" + i ).css("margin-bottom",  sizeScale(d) * 2 + "px");
      } else if (i == 1){
        $("#legend #size .c-wrapper .item-" + i).css("margin-bottom", sizeScale(d / 4) + "px");
      }
    })

  }

}

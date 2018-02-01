// d3 webpack functions

re();
$(window).smartresize(function(){
  re();
});

function re(){

  var device = getDevice($(window).width());
  function getDevice(x){
    return x <= 768 ? "mobile" : "desktop";
  }

  var margin = {top: 30, right: device == "mobile" ? 10 : 150, bottom: 30, left: device == "mobile" ? 10 : 150},
    width = d3.min([1600, window.innerWidth]) - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom;


  var doWidth = device == "mobile" ? 43 : width;
  d3.selection.prototype.tspans = function(lines, lh) {
      return this.selectAll("tspan")
          .data(lines)
          .enter()
          .append("tspan")
          .text(function(d) { return d; })
          .attr("x", doWidth)
          .attr("dy", 15);
  };

  d3.wordwrap = function(line, maxCharactersPerLine) {
      var w = line.split(" "),
          lines = [],
          words = [],
          maxChars = maxCharactersPerLine || 40,
          l = 0;
      w.forEach(function(d) {
          if (l+d.length > maxChars) {
              lines.push(words.join(" "));
              words.length = 0;
              l = 0;
          }
          l += d.length;
          words.push(d);
      });
      if (words.length) {
          lines.push(words.join(" "));
      }
      return lines;
  };

}

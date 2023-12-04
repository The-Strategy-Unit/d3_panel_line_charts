/* load D3 v7 from jsDeliver */
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'

/* set dimensions and margins for small multiple plots */
const plotTitleSpacer = 20
const margin = { top: 50 + plotTitleSpacer, left: 50, right: 50, bottom: 50 }
const height = 400 - margin.top - margin.bottom
const width = 400 - margin.left - margin.right

/* set file path */
const blobDir =
  'https://strategyunit.blob.core.windows.net/population-aging-app/'
const filePrefix = 'test_activity_'
const fileExt = '.csv'

/* set key labels */
const keyLabels = ['Women|', 'Men']

/* set transition duration for updatePlots fn */
const transDur = 1800

/* define axes (x-axis does not change) */
const xScale = d3
  .scaleLinear()
  .domain(d3.extent([0, 100]))
  .range([0, width])

const xAxis = d3.axisBottom().scale(xScale).ticks(5)

const yScale = d3.scaleLinear().range([height, 0])

/* define a color palette (line colors) */
const colorPal = d3
  .scaleOrdinal()
  .domain(['f', 'm'])
  .range(['#fd484e', '#2c74b5'])

/* line generator */
const urtLine = d3
  .line()
  .x(function (d) {
    return xScale(d.age)
  })
  .y(function (d) {
    return yScale(d.urt)
  })

/* fn: custom style for y-axis */
function styleYaxis(g) {
  g.call((g) =>
    g
      .selectAll('.tick:not(:first-of-type) line')
      .attr('stroke-dasharray', '2, 2')
  ).call((g) => g.selectAll('.tick text').attr('x', 10).attr('y', -8))
}

/* fn: format y-axis values as rate per 1000 */
function formatYaxis(d) {
  const rt = (d * 1e3).toFixed(0)
  return rt
}

/* fn: plot panel of line plots for hsagrps in a pod */
function plotHsaGrps(podDat) {
  /* data to plot */
  let hsaGrps = Array.from(
    d3.group(podDat, (d) => d.hsagrp),
    ([key, value]) => ({ key, value })
  )

  /* create a separate svg object for each hsagrp and
  use hsagrp name to set the class of each svg */
  d3.select('.div-panels')
    .selectAll('svg')
    .data(hsaGrps)
    .enter()
    .append('svg')
    .attr('class', function (d) {
      return d.value[0].hsagrp
    })
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)

  /* iterate over data array and create plot elements (x-axis, y-axis, and lines) */
  hsaGrps.forEach(function (d) {
    /* set yScale domain based on range of urt values in each hsagrp */
    let maxUrt = d3.max(d.value.map((d) => d.urt))
    yScale.domain([0, maxUrt])

    /* y-axis changes based on range of urt values */
    let yAxis = d3
      .axisLeft()
      .scale(yScale)
      .ticks(5)
      .tickSize(-width - 12)
      .tickFormat(formatYaxis)

    /* data to plot 2 lines f/m */
    let sex = d3.group(d.value, (d) => d.sex)

    /* select the correct svg for each hsagrp */
    let svg = d3.select('svg.' + d.value[0].hsagrp)

    /* draw lines */
    svg
      .selectAll('path')
      /* no square brackets needed here! */
      .data(sex)
      .enter()
      .append('path')
      .attr('class', 'line')
      .attr('id', 'urt-line')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      /* d3.line() only accepts arrays, d.values is an iterator, [1] references values ([0] is the key) */
      .attr('d', (d) => urtLine(Array.from(d.values())[1]))
      .attr('stroke', (d) => colorPal(d[0]))
      .attr('stroke-width', 1.5)
      .attr('fill', 'none')

    /* add x-axis */
    svg
      .append('g')
      .attr('class', 'axis')
      .attr('id', 'x-axis')
      .attr(
        'transform',
        `translate(${margin.left}, ${height + margin.bottom + 20})`
      )
      .call(xAxis)
      /* remove x-axis line (replaced with y=0 gridline) */
      .call((g) => g.select('.domain').remove())

    /* add y-axis */
    svg
      .append('g')
      .attr('class', 'axis')
      .attr('id', 'y-axis')
      .attr('transform', `translate(${margin.left - 12}, ${margin.top})`)
      .call(yAxis)
      .call(styleYaxis)

    /* add x-axis label  */
    svg
      .append('text')
      .attr('class', 'axis-label')
      .attr(
        'transform',
        `translate(${width / 2 + margin.left}, ${height + 100})`
      )
      .text('Age')
      .style('text-anchor', 'middle')

    /* add y-axis label (easy as i don't want to rotate it, rotating changes the position of the origin */
    svg
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', `translate(${margin.left}, ${margin.top - 25})`)
      .text('Rate per 1,000 person-years')
      .style('text-anchor', 'left')

    /* add title */
    svg
      .append('text')
      .attr('class', 'title')
      .attr('id', 'hsagrp-title')
      .attr('transform', `translate(${margin.left}, ${plotTitleSpacer})`)
      .text(d.value[0].hsagrp_lab)
      .style('text-anchor', 'left')

    /* set key labels group */
    let keyLabelsGrp = svg
      .selectAll('g.keyLab')
      .data(keyLabels)
      .enter()
      .append('g')
      .attr('class', 'key-labels')

    /* draw key labels */
    keyLabelsGrp
      .attr('transform', function (d, i) {
        return `translate(${margin.left + i * 50}, ${margin.top - 5})`
      })
      .append('text')
      .text(function (d, i) {
        return keyLabels[i]
      })
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill', (d) => colorPal(d[0]))
  })
}

/* fn: update the plots when the data (area) changes */
function updatePlots(podDat) {
  /* data to plot */
  let hsaGrps = Array.from(
    d3.group(podDat, (d) => d.hsagrp),
    ([key, value]) => ({ key, value })
  )

  /* iterate over data array and create plot elements (x-axis, y-axis, and lines) */
  hsaGrps.forEach(function (d) {
    /* set yScale domain based on range of urt values in each hsagrp */
    let maxUrt = d3.max(d.value.map((d) => d.urt))
    yScale.domain([0, maxUrt])

    /* y-axis changes based on range of urt values */
    let yAxis = d3
      .axisLeft()
      .scale(yScale)
      .ticks(5)
      .tickSize(-width - 12)
      .tickFormat(formatYaxis)

    /* data to plot 2 lines f/m */
    let sex = d3.group(d.value, (d) => d.sex)

    /* select the correct svg for each hsagrp and update lines */
    let svg = d3.select('svg.' + d.value[0].hsagrp)

    /* transition lines */
    svg
      .selectAll('#urt-line')
      .data(sex)
      .join('path')
      .transition()
      .duration(transDur)
      /* d3.line() only accepts arrays, d.values is an iterator, [1] references values ([0] is the key) */
      .attr('d', (d) => urtLine(Array.from(d.values())[1]))
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    /* transition y-axis */
    svg
      .selectAll('#y-axis')
      .transition()
      .duration(transDur)
      .call(yAxis)
      .call(styleYaxis)
  })
}

/* fn: switch the plots when pod changes */
function switchPod(grpDat, selectedPod) {
  /* get the new data */
  let podDat = grpDat.get(selectedPod)

  /* remove plots */
  d3.select('#panels').selectAll('svg').remove()

  plotHsaGrps(podDat)
}

/* fn: update the plots when the area dropdown changes */
function switchArea(selectedArea, selectedPod) {
  /* get name of csv file from area dropdown */
  let url = blobDir + filePrefix + selectedArea + fileExt
  d3.csv(url).then(function (data) {
    /* group the new data */
    let grpDat = d3.group(data, (d) => d.pod)

    /* get the new data */
    let podDat = grpDat.get(selectedPod)

    updatePlots(podDat)
  })
}

/* export variables */
export {
  plotTitleSpacer,
  margin,
  width,
  height,
  blobDir,
  filePrefix,
  fileExt,
  keyLabels,
  transDur
}
/* export d3 functions */
export { d3 }
export { xScale, xAxis, yScale, colorPal, urtLine }
/* export udf functions */
export { styleYaxis, formatYaxis }
export { plotHsaGrps }
export { updatePlots }
export { switchPod }
export { switchArea }

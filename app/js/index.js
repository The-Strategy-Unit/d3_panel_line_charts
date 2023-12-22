/* import variables */
import {
  plotTitleSpacer,
  margin,
  width,
  height,
  blobDir,
  filePrefix,
  fileExt,
  keyLabels,
  transDur
} from './main.js'
/* import d3 functions */
import { d3 } from './main.js'
import { xScale, xAxis, yScale, colorPal, urtLine } from './main.js'
/* import udf functions */
import { styleYaxis, formatYaxis } from './main.js'
import { plotHsaGrps } from './main.js'
import { updatePlots } from './main.js'
import { switchPod } from './main.js'
import { switchArea } from './main.js'
import { toggleSmooth } from './main.js'
import { toggleLine } from './main.js'

let selectedArea = 'E08000026'
let selectedPod = 'aae'

const data = await d3.csv(blobDir + filePrefix + selectedArea + fileExt)
const grpDat = d3.group(data, (d) => d.pod)
const podDat = grpDat.get(selectedPod)

plotHsaGrps(podDat)

/* when the area dropdown changes, run switchArea() with the new value */
d3.select('#selectArea').on('change', function () {
  selectedArea = d3.select(this).property('value')
  d3.select('#toggleHsa').property('checked', false)
  switchArea(selectedArea, selectedPod)
})

/* when the pod dropdown changes, run switchPod() with the new value */
d3.select('#selectPod').on('change', function () {
  selectedPod = d3.select(this).property('value')
  d3.select('#toggleHsa').property('checked', false)
  switchPod(selectedArea, selectedPod)
})

/* when the smooth relationship toggle changes, run toggleSmooth() or toggleLine() */
d3.select('#toggleHsa').on('change', function () {
  selectedPod = d3.select('#selectPod').property('value')
  if (d3.select('#toggleHsa').property('checked')) {
    toggleSmooth(selectedArea, selectedPod)
  } else {
    toggleLine(selectedArea, selectedPod)
  }
})

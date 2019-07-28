const width = 800
const height = 500
let circlesMode = false
let showAbsoluteWinners = false

d3.text('./graphing-website-resources/data/map.svg').then(async mapSVGText => {
    d3.select('#map')
        .html(mapSVGText)
    let rawElectionData = await d3.csv('./graphing-website-resources/data/election-data.csv')
    let electionData = {}
    for (let candidate of rawElectionData) {
        if (!electionData[candidate.year]) {
            electionData[candidate.year] = {}
        }
        if (!electionData[candidate.year][candidate.state_po]) {
            electionData[candidate.year][candidate.state_po] = {
                name: candidate.state_po,
                candidates: []
            }
        }
        electionData[candidate.year][candidate.state_po].candidates.push(candidate)
    }

    let yearSelector = d3.select('#year-selector select')

    for (let year in electionData) {
        yearSelector.append('option')
            .text(year)
    }

    let svg = d3.select('#map svg')
        .attr('width', width)
        .attr('height', height)

    svg.append('g')
        .attr('id', 'election-circles')

    let summarySVG = d3.select('#election-summary svg')
        .attr('height', 100)
        .attr('width', document.getElementById('election-summary').clientWidth)

    fillData(electionData, 1976, svg, summarySVG)

    yearSelector.node().addEventListener('change', event => {
        fillData(electionData, event.target.value, svg, summarySVG)
    })

    let circleModeCheckbox = document.getElementById('circle-mode-checkbox')
    let showAbsoluteWinnersCheckbox = document.getElementById('absolute-winners-mode-checkbox')

    circleModeCheckbox.addEventListener('change', event => {
        if (event.target.checked) {
            circlesMode = true
            fillData(electionData, yearSelector.node().value, svg, summarySVG)
            showAbsoluteWinnersCheckbox.checked = false
            showAbsoluteWinnersCheckbox.dispatchEvent(new Event('change'))
        } else {
            circlesMode = false
            fillData(electionData, yearSelector.node().value, svg, summarySVG)
        }
    })
    circleModeCheckbox.checked = false

    showAbsoluteWinnersCheckbox.addEventListener('change', event => {
        if (event.target.checked) {
            showAbsoluteWinners = true
            fillData(electionData, yearSelector.node().value, svg, summarySVG)
            circleModeCheckbox.checked = false
            circleModeCheckbox.dispatchEvent(new Event('change'))
        } else {
            showAbsoluteWinners = false
            fillData(electionData, yearSelector.node().value, svg, summarySVG)
        }
    })
    showAbsoluteWinnersCheckbox.checked = false
})

function compositeColors() {
    let args = []
    for (let i = 1; i < arguments.length; i++) {
        args[i] = arguments[i]
    }
    let resultColor = { r: 0, g: 0, b: 0, a: 0 }
    args.forEach(color => {
        let rgba = color.rgb()
        resultColor.r += rgba.r * rgba.opacity
        resultColor.g += rgba.g * rgba.opacity
        resultColor.b += rgba.b * rgba.opacity
        resultColor.a += rgba.opacity
    })
    resultColor.a /= args.length
    resultColor.a *= arguments[0]
    return d3.rgb(resultColor.r, resultColor.g, resultColor.b, resultColor.a)
}

function fillData(electionData, year, svg, summarySVG) {
    let yearData = []
    for (let state in electionData[year]) {
        yearData.push(electionData[year][state])
    }

    d3.select('#election-circles').html('')

    if (!circlesMode && !showAbsoluteWinners) {
        let selection = svg.selectAll('.state path, g#DC')
            .data(yearData, (d, i, nodes) => d ? d.name : nodes[i].id)
        selection.attr('fill', d => {
            let totalElectors = d.candidates.reduce((acc, val) => acc + parseInt(val.electors), 0)
            let republicanColorScale = d3.scaleLinear()
                .domain([0, totalElectors])
                .range([d3.rgb(255, 0, 0, 0.01), d3.rgb(255, 0, 0, 1)])
            let democratColorScale = d3.scaleLinear()
                .domain([0, totalElectors])
                .range([d3.rgb(0, 0, 255, 0.01), d3.rgb(0, 0, 255, 1)])
            let thirdPartyColorScale = d3.scaleLinear()
                .domain([0, totalElectors])
                .range([d3.rgb(255, 255, 0, 0.01), d3.rgb(255, 255, 0, 1)])

            let republicanCandidate = d.candidates.filter(candidate => candidate.party === 'republican')[0]
            let republicanColor
            if (!republicanCandidate) {
                republicanColor = d3.rgb(0, 0, 0, 0)
            } else {
                republicanColor = d3.color(republicanColorScale(parseInt(republicanCandidate.electors)))
            }

            let democratCandidate = d.candidates.filter(candidate => candidate.party === 'democrat')[0]
            let democratColor
            if (!democratCandidate) {
                democratColor = d3.rgb(0, 0, 0, 0)
            } else {
                democratColor = d3.color(democratColorScale(parseInt(democratCandidate.electors)))
            }

            let thirdPartyCandidate = d.candidates.filter(candidate => candidate.party !== 'republican' && candidate.party !== 'democrat')[0]
            let thirdPartyColor
            if (!thirdPartyCandidate) {
                thirdPartyColor = d3.rgb(0, 0, 0, 0)
            } else {
                thirdPartyColor = d3.color(thirdPartyColorScale(parseInt(thirdPartyCandidate.electors)))
            }

            return compositeColors(3, republicanColor, democratColor, thirdPartyColor)

        })
    } else if (!showAbsoluteWinners) {
        let electionCirclesGroup = svg.select('#election-circles')
        electionCirclesGroup.selectAll('circle.election-circle')
            .data(yearData)
            .enter()
            .append('circle')
            .attr('class', 'election-circle')
            .attr('cx', d => {
                let statePath = d3.select(`#${d.name}`)
                let box = statePath.node().getBBox()
                return box.x + (box.width / 2)
            })
            .attr('cy', d => {
                let statePath = d3.select(`#${d.name}`)
                let box = statePath.node().getBBox()
                return box.y + (box.height / 2)
            })
            .attr('r', d => {
                let thirdPartyCandidate = d.candidates.filter(candidate => candidate.party !== 'republican' && candidate.party !== 'democrat')[0]
                if (!thirdPartyCandidate) {
                    thirdPartyCandidate = { electors: 0 }
                }
                let thirdPartyElectors = thirdPartyCandidate.electors
                let totalElectors = d.candidates.reduce((acc, val) => acc + parseInt(val.electors), 0)
                let electorScale = d3.scaleLinear()
                    .domain([0, totalElectors])
                    .range([0, 30])
                return electorScale(thirdPartyElectors)
            })
            .attr('fill', 'yellow')
            .on('mouseover', (d, i, nodes) => {
                stateName.innerHTML = document.querySelector(`#${d.name} title`).innerHTML
                onHover(yearData, d.candidates)
            })
            .on('mouseout', (d, i, nodes) => {
                deHover()
            })
        let states = svg.selectAll('.state path, g#DC')
            .data(yearData, (d, i, nodes) => d ? d.name : nodes[i].id)
        states.attr('fill', d => {
            let totalElectors = d.candidates.reduce((acc, val) => acc + parseInt(val.electors), 0)
            let republicanColorScale = d3.scaleLinear()
                .domain([0, totalElectors])
                .range([d3.rgb(255, 0, 0, 0.01), d3.rgb(255, 0, 0, 1)])
            let democratColorScale = d3.scaleLinear()
                .domain([0, totalElectors])
                .range([d3.rgb(0, 0, 255, 0.01), d3.rgb(0, 0, 255, 1)])

            let republicanCandidate = d.candidates.filter(candidate => candidate.party === 'republican')[0]
            let republicanColor
            if (!republicanCandidate) {
                republicanColor = d3.rgb(0, 0, 0, 0)
            } else {
                republicanColor = d3.color(republicanColorScale(parseInt(republicanCandidate.electors)))
            }

            let democratCandidate = d.candidates.filter(candidate => candidate.party === 'democrat')[0]
            let democratColor
            if (!democratCandidate) {
                democratColor = d3.rgb(0, 0, 0, 0)
            } else {
                democratColor = d3.color(democratColorScale(parseInt(democratCandidate.electors)))
            }

            return compositeColors(2, republicanColor, democratColor)
        })
    } else {
        let selection = svg.selectAll('.state path, g#DC')
            .data(yearData, (d, i, nodes) => d ? d.name : nodes[i].id)
        selection.attr('fill', d => {
            let republicanCandidate = d.candidates.filter(candidate => candidate.party === 'republican')[0]
            if (!republicanCandidate) {
                republicanCandidate = { electors: 0 }
            }
            let republicanElectors = parseInt(republicanCandidate.electors)

            let democratCandidate = d.candidates.filter(candidate => candidate.party === 'democrat')[0]
            if (!democratCandidate) {
                democratCandidate = { electors: 0 }
            }
            let democratElectors = parseInt(democratCandidate.electors)

            return democratElectors > republicanElectors ? 'blue': (republicanElectors > democratElectors ? 'red': 'purple')
        })
    }

    svg.selectAll('.state path, g#DC')
        .data(yearData, (d, i, nodes) => d ? d.name : nodes[i].id)
        .on('mouseover', (d, i, nodes) => {
            stateName.innerText = nodes[i].children[0].innerHTML
            onHover(yearData, d.candidates)
        })
        .on('mouseout', d => {
            deHover()
        })

    summarySVG.html('')

    let republicanElectors = 0, democratElectors = 0, thirdPartyElectors = 0
    let republicanCandidate, democratCandidate, thirdPartyCandidate
    for (let stateName in yearData) {
        let candidates = yearData[stateName].candidates
        republicanElectors += candidates.filter(candidate => candidate.party === 'republican')
            .reduce((acc, val) => {
                republicanCandidate = val.candidate
                return acc + parseInt(val.electors)
            }, 0)
        democratElectors += candidates.filter(candidate => candidate.party === 'democrat')
            .reduce((acc, val) => {
                democratCandidate = val.candidate
                return acc + parseInt(val.electors)
            }, 0)
        thirdPartyElectors += candidates.filter(candidate => candidate.party !== 'republican' && candidate.party !== 'democrat')
            .reduce((acc, val) => {
                thirdPartyCandidate = val.candidate
                return acc + parseInt(val.electors)
            }, 0)
    }
    function makeNameReadable(name) {
        if (!name) {
            return 'Third Party'
        }
        let nameArray = name.split(',')
        return nameArray[1].substring(1) + ' ' + nameArray[0]
    }
    let summaryData = [{
        color: 'red',
        electors: republicanElectors,
        name: makeNameReadable(republicanCandidate)
    }, {
        color: 'blue',
        electors: democratElectors,
        name: makeNameReadable(democratCandidate)
    }, {
        color: 'gold',
        electors: thirdPartyElectors,
        name: makeNameReadable(thirdPartyCandidate)
    }]
        .sort((a, b) => a.electors < b.electors)

    summarySVG.selectAll('rect')
        .data(summaryData)
        .enter()
        .append('rect')
        .attr('x', (d, i) => {
            let currentTotalElectors = 0
            for (let index = 0; index < i; index++) {
                currentTotalElectors += summaryData[index].electors
            }
            return currentTotalElectors
        })
        .attr('y', 0)
        .attr('width', d => {
            return d.electors
        })
        .attr('height', 100)
        .attr('stroke-width', 0)
        .attr('fill', d => d.color)

    summarySVG.append('line')
        .attr('x1', 270)
        .attr('y1', -10)
        .attr('x2', 270)
        .attr('y2', 120)
        .attr('stroke-width', 2)
        .attr('stroke', '#777')

    let summaryKeyContainer = d3.select('#candidates')
        .html('')

    let summaryKeySVG = summaryKeyContainer.selectAll('svg.candidate')
        .data(summaryData)
        .enter()
        .append('svg')
        .attr('viewbox', '0 0 300 50')
        .attr('class', 'candidate')

    summaryKeySVG.append('rect')
        .attr('x', 10)
        .attr('y', 10)
        .attr('width', 30)
        .attr('height', 30)
        .attr('fill', d => d.color)

    summaryKeySVG.append('text')
        .attr('x', 50)
        .attr('y', 25)
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '1.5em')
        .text(d => d.name + ' - ' + d.electors)

    summaryKeySVG.selectAll('text')
        .each((d, i, nodes) => {
            let textWidth = nodes[i].getBBox().width
            if (textWidth > 250) {
                nodes[i].parentNode.style.width = '33%'
            }
        })
}

function getColor(republicanElectors, democratElectors, thirdPartyElectors) {
    let democratColor = 300 * democratElectors
    let republicanColor = 300 * republicanElectors
    let thirdPartyColor = 300 * thirdPartyElectors
    let totalElectors = republicanElectors + democratElectors + thirdPartyElectors
    let red = (republicanColor + thirdPartyColor) / totalElectors
    let blue = democratColor / totalElectors
    let green = thirdPartyColor / totalElectors
    return d3.rgb(red, green, blue)
}

let stateName = document.getElementById('state-name')
let republicanInfo = {
    name: document.getElementById('republican-name'),
    electors: document.getElementById('republican-electors')
}
let democratInfo = {
    name: document.getElementById('democrat-name'),
    electors: document.getElementById('democrat-electors')
}
let thirdPartyInfo = {
    name: document.getElementById('third-party-name'),
    electors: document.getElementById('third-party-electors')
}
let totalElectorsSpan = document.getElementById('total-electors')

function onHover(yearData, candidates) {
    let republicanCandidate = candidates.filter(candidate => candidate.party === 'republican')[0]
    if (!republicanCandidate) {
        republicanCandidate = {
            electors: 0, candidate:
                yearData
                    .filter(state => state.candidates
                        .filter(candidate => candidate.party === 'republican')[0]
                    )[0].candidates.filter(candidate => candidate.party === 'republican')[0].candidate
        }
    }
    let democratCandidate = candidates.filter(candidate => candidate.party === 'democrat')[0]
    if (!democratCandidate) {
        democratCandidate = {
            electors: 0, candidate:
                yearData
                    .filter(state => state.candidates
                        .filter(candidate => candidate.party === 'democrat')[0]
                    )[0].candidates.filter(candidate => candidate.party === 'democrat')[0].candidate
        }
    }
    let thirdPartyCandidate = candidates.filter(candidate => candidate.party !== 'republican' && candidate.party !== 'democrat')[0]
    if (!thirdPartyCandidate) {
        thirdPartyCandidate = {
            electors: 0, candidate: (() => {
                let possibleThirdPartyCandidateState = yearData
                    .filter(state => state.candidates
                        .filter(candidate => candidate.party !== 'republican' && candidate.party !== 'democrat')[0]
                    )[0]
                if (!possibleThirdPartyCandidateState) {
                    return 'Third Party,'
                }
                return possibleThirdPartyCandidateState.candidates.filter(candidate => candidate.party !== 'republican' && candidate.party !== 'democrat')[0].candidate
            })()
        }
    }
    let totalElectors = candidates.reduce((acc, val) => acc + parseInt(val.electors), 0)

    let republicanName = republicanCandidate.candidate.split(',')
    republicanInfo.name.innerText = (republicanName[1] + ' ' + republicanName[0]).replace(/\"\"/g, '"')
    let democratName = democratCandidate.candidate.split(',')
    democratInfo.name.innerText = (democratName[1] + ' ' + democratName[0]).replace(/\"\"/g, '"')
    let thirdPartyName = thirdPartyCandidate.candidate.split(',')
    thirdPartyInfo.name.innerText = (thirdPartyName[1] + ' ' + thirdPartyName[0]).replace(/\"\"/g, '"')

    republicanInfo.electors.innerText = republicanCandidate.electors
    democratInfo.electors.innerText = democratCandidate.electors
    thirdPartyInfo.electors.innerText = thirdPartyCandidate.electors

    totalElectorsSpan.innerText = totalElectors
}

function deHover() {
    stateName.innerText = 'Hover over a State'
    republicanInfo.name.innerText = 'Republican'
    republicanInfo.electors.innerText = 0
    democratInfo.name.innerText = 'Democrat'
    democratInfo.electors.innerText = 0
    thirdPartyInfo.name.innerText = 'Third Party'
    thirdPartyInfo.electors.innerText = 0
    totalElectorsSpan.innerText = 0
}
import React from 'react'
import * as d3 from 'd3'
import './DataViewer.css'

import useDraggable from '../hooks/useDraggable'
import DragDropMenu from './DragDropMenu'

export default function DataViewer({name, visualData, setVisualData, numRows, setNumRows}){
    const divRef = React.useRef()
    
    const svg    = React.useRef()
    const x      = React.useRef()
    const y      = React.useRef()
    const path   = React.useRef()
    const text   = React.useRef()
    const xTicks = React.useRef()
    const xRange = React.useRef()
    const yRange = React.useRef()
    const xScale = React.useRef()
    const yScale = React.useRef()
    
    useDraggable(divRef, visualData._id,{
        top:   visualData.top, 
        left:   visualData.left, 
        width:  visualData.width,  
        height: visualData.height
    }, 
    setVisualData, numRows, setNumRows);
    const deleteMe = React.useCallback(() => {
        setVisualData(prevState => {
            return prevState.filter(view => view._id !== visualData._id)
        })
    }, [])
    const renameMe = React.useCallback(newName => {
        setVisualData(prevState => {
            return prevState.map(view => {
                return view._id === visualData._id ? {...view, name: newName} : view
            })       
        })
    }, [])
    
    React.useEffect(() => {
        console.log('remake svg')
        //d3.select(svg.current).selectAll('*').remove()
        const width = visualData.width * 100
        const height = visualData.height * 100
        const xVals = visualData.type === 'graph' ? visualData.data.map(pair => pair[0])
            : visualData.data.map(pair => pair[1])
    
        xRange.current = [
            Math.min(...xVals , 0),
            Math.max(...xVals)
        ]
        const yVals = visualData.type === 'graph' ? visualData.data.map(pair => pair[1])
        : visualData.data.map((pair, i) => i + 1)
        yRange.current = [
            Math.round(Math.min(...yVals, 0)),
            Math.round(Math.max(...yVals))
        ]
        xTicks.current = []
        if(visualData.type === 'graph') xVals.forEach((val, index) => {
            !Math.abs(val)<Math.pow(10, -5) && index % (Math.floor(xVals.length / 15)) == 0 && xTicks.current.push(val)
        })
                
        xScale.current = d3.scaleLinear().domain(xRange.current)
        xScale.current.range([0, width])
        
        yScale.current = d3.scaleLinear().domain(yRange.current)
        yScale.current.range([height, 0])
                
        d3.select(svg.current)
            //.attr("preserveAspectRatio", "xMinYMin meet")
            .attr("preserveAspectRatio", "none")
        
        x.current = d3.select(svg.current).append('g')
        y.current = d3.select(svg.current).append('g')
            
        if(visualData.type === 'bar') {
            const data = xVals.map((xVal, i) => [xVal, yVals[i], visualData.data[i][0]])
            path.current = d3.select(svg.current).append('g').selectAll('.bar')
                .data(data)
                .enter()
                .append('rect')
                .attr('x', 0)
                .attr('width', dataPoint => dataPoint[0])
                .attr('y', dataPoint => dataPoint[1] - 0.5 - 0.3)
                .attr('height', 0.6)
                .attr('fill', 'lightblue')
                .attr('id', function(d, i) { return name + 'bar'+i})
                .on('mouseover', function(){ d3.select(this).attr('fill','pink') })
                .on('mouseout', function(){ d3.select(this).attr('fill','lightblue') })
            text.current = d3.select(svg.current).append('g').selectAll('.bar')
                .data(data)
                .enter().append('text')
                .text(dataPoint => dataPoint[2])
                .attr('x', '10')
                .style('font', '14px')
                .on('mouseover', function(d, i){d3.select('#'+name+'bar'+i).attr('fill', 'pink');})
                .on('mouseout', function(d, i){d3.select('#'+name+'bar'+i).attr('fill', 'lightblue');})
         } else {//type = graph
            const line = d3.line().curve(d3.curveStep)(visualData.data)
            path.current = d3.select(svg.current).append('g').append('path')
                .attr('d', line)
                .style('stroke', 'darkgray').style('fill', 'none')
                .style('stroke-width', '1px')
                .style('vector-effect', 'non-scaling-stroke')
                .on('mouseover', () => path.current.style('stroke','red').style('stroke-width', '3px'))
                .on('mouseout', () => path.current.style('stroke','darkgray').style('stroke-width', '1px'))
            }
    }, [])
    
    //update the graphics when the size of the chart changes
    React.useEffect(() => {
        const width = visualData.width * 100
        const height = visualData.height * 100
        //let [width, height] = size
        xScale.current.range([0, width])
        yScale.current.range([height, 0])
        
        d3.select(svg.current).attr("viewBox", `-25 -25 ${width+50} ${height+50}`)
        const xAxis =  d3.axisBottom(xScale.current)
        const yAxis =  d3.axisRight(yScale.current)
        if(visualData.type === 'graph'){
            xAxis.tickValues(xTicks.current).tickFormat(val => `${Math.round(val*10)/10}`)
            yAxis.ticks(5)
        } else {
            xAxis.ticks(Math.round(width) / 40)
            if(xRange.current[1] > 10000) xAxis.tickFormat(val => `${Math.floor(val / 1000)}k`)
            yAxis.ticks(0);
            const fontSize = Math.min(Math.max(0.26 / yRange.current[1] * yScale.current(0.6), 14), 32) + 'px arial'
            text.current
                .attr('y', dataPoint => yScale.current(dataPoint[1] - 0.6))
                .style('font', fontSize)
        }
        x.current.attr('transform', 'translate(0,'+ yScale.current(0) +')')
            .call(xAxis)
        y.current.attr('transform', 'translate(' + xScale.current(0) + ', 0)')
            .call(yAxis)
        
        path.current.attr('transform', `
            translate(${xScale.current(0)} ${Math.round(yScale.current(0))}) 
            scale(${(width )/(xRange.current[1] - xRange.current[0])} 
                  ${(height)/(yRange.current[0] - yRange.current[1])})
        `)
    }, [visualData.width, visualData.height])//size
    
    return <div
        className='DataViewer' 
        ref={divRef} 
        style ={{
            top: visualData.top * 100 + 'px',
            left: visualData.left * 100 + 'px',
            width:  visualData.width * 100 - 1 + 'px',
            height: visualData.height * 100 - 1 + 'px',
            border: '1px darkgray solid'
        }}>
        <DragDropMenu 
            key     = {'menu'+visualData._id} 
            name    = {visualData.name} 
            delete  = {deleteMe} 
            rename  = {renameMe}/>
        <svg 
            ref={svg} 
            style={{
                position: 'absolute',
                top: '20px',
                left: '0',
                width:  '100%',
                height: 'calc(100% - 20px)'//visualData.height * 100 - 20 + 'px'
        }}/>
    </div>
}
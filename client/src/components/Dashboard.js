import React from 'react'
import './Dashboard.css'
import DataViewer from './DataViewer'
import useStateStorage from '../hooks/useStateStorage'
export default function Dashboard(props){
    //const TILE_SIZE = 100;
    const [tiles, setTiles] = React.useState([])
    const [numRows, setNumRows] = useStateStorage('numRows', 6)
    const [visualData, setVisualData] = useStateStorage('visualData', '[]')
    const [startDateOmni, setStartDateOmni] = React.useState('yyyy/mm/dd')
    const [endDateOmni, setEndDateOmni] = React.useState('yyyy/mm/dd')
    const numCols = 12;
    {/* these are some examples of graphs and bar charts
    React.useEffect(() => {
        const tempData = []
        tempData.push({color: 'red', type: 'graph', width: 6, height: 2, top: 0, left: 0, data: []})
        for(let j = 0; j <= 16; j++) tempData[0].data.push([-2*Math.PI + Math.PI/4*j, Math.sin(-2*Math.PI + Math.PI/4*j)])
        tempData.push({color: 'blue', type: 'graph', width: 6, height: 2, top: 0, left: 6, data: []})
        for(let j = 0; j <= 16; j++) tempData[1].data.push([-2*Math.PI + Math.PI/4*j, Math.cos(-2*Math.PI + Math.PI/4*j)])
        tempData.push({color: 'green', type: 'graph', width: 6, height: 2, top: 2, left: 0, data: []})
        for(let j = 0; j <= 20; j++) tempData[2].data.push([-2 + j * 6/20, Math.exp(-2 + j * 6/20)])
        tempData.push({color: 'orange', type: 'bar', width: 6, height: 2, top: 2, left: 6, 
        data: [['first', 12], ['second', 8], ['third', 15]]})
        setVisualData(tempData)
    }, [])*/}
    
    //when the number of rows in the grid needs to change this effect adds/subtracts
    //from the tiles array
    React.useEffect(() => {
        const oldNumRows = tiles.length / numCols
        if(oldNumRows > numRows){
            setTiles(prevTiles => prevTiles.slice(0, numRows * numCols))
        }
        if(oldNumRows < numRows){
            const temp = []
            for(let j = oldNumRows; j < numRows; j++) {
                for(let k = 0; k < numCols; k++){
                    const num = numCols * j + k
                    temp.push(<div 
                        className='Tile'
                        row={j} 
                        col={k} 
                        key={'tile'+ num}>
                    </div>)
                }
            }
            setTiles(prevTiles => [...prevTiles, ...temp])
        }
        document.getElementById('Tiles').style.gridTemplateRows = `repeat(${numRows}, 100px)`
    }, [numRows])

    //everytime the visual data changes, change the number of rows to the new maximal row + 2
    React.useEffect(() => {
        const newRow = Math.max(...visualData.map(graph => graph.top + graph.height))
        setNumRows(newRow  + 2)
    }, [visualData])

    const handleOmniwebClick = () => {
        const startDate = document.getElementById('start').value.split('-').join('')
        const endDate = document.getElementById('end').value.split('-').join('')
        fetch('/api/omniweb', {
            method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ startDate: startDate, endDate: endDate })
            })
            .then(response => response.json())
            .then(jsonRes => {
                setVisualData(prevState => [...prevState, jsonRes])
            })
            .catch(err => console.log(err))
    }
    const handleTwitterClick = () => {
        fetch('/api/twitter')
            .then(response => response.json())
            .then(jsonRes => {
                setVisualData(prevState => [...prevState, jsonRes])
            })
            .catch(err => console.log(err))
    }
    const handleSaveClick = () => {
        fetch('/api/dash', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({graphs: visualData}),
            withCredentials: true, 
            credentials: 'include'
        }).then(() => {
            handleLoadClick()
        }).catch(err => console.log(err))
    }
    const handleLoadClick = () => {
        fetch('/api/dash')
            .then(response => response.json())
            .then(jsonRes => setVisualData(jsonRes))
            .catch(err => console.log(err))
    }

    return (<div style={{marginTop: '20px'}}>
        <button onClick={handleTwitterClick} className='Rect'>Twitter</button>
        <button onClick={handleOmniwebClick} className='Rect'>OmniWeb</button>
        <button onClick={handleSaveClick} className='Rect'>save data</button>
        <button onClick={handleLoadClick} className='Rect'>load data</button>
        <form>
            <label>Start Date: </label>
            <input id='start' type='date'></input>
            <label>End Date: </label>
            <input id='end' type='date'></input>
        </form>
        <div id='Dashboard'>
            <div id='Tiles'>{tiles}</div>
            {visualData.map(dataSet => {
                return <DataViewer
                    key             = {dataSet._id}
                    name            = {'chart'+dataSet._id}
                    visualData      = {dataSet}
                    setVisualData   = {setVisualData} 
                    numRows         = {numRows}
                    setNumRows      = {setNumRows}
                />
            })}
        </div>
    </div>)
}
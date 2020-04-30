import React from 'react'
import './DragDropMenu.css'
import { tree } from 'd3'

export default function DragDropMenu(props){
    const menuRef       = React.useRef()
    const dragBarRef       = React.useRef()
    const menuIconRef   = React.useRef() 
    const [disableInput, setDisableInput] = React.useState(true)
    const showMenu = React.useRef(false)
    
    React.useEffect(() => {
        const dragBar = Array.prototype.find.call(menuRef.current.childNodes, 
            el => el.className === 'DragBar')
        const dropDown = Array.prototype.find.call(menuRef.current.childNodes, 
            el => el.className === 'DropDown')
        const menuIcon = menuIconRef.current
        const topBar = Array.prototype.find.call(menuIcon.childNodes, 
            el => el.classList.contains('top'))
        const midBar = Array.prototype.find.call(menuIcon.childNodes, 
            el => el.classList.contains('mid'))
        const lowBar = Array.prototype.find.call(menuIcon.childNodes, 
            el => el.classList.contains('low'))
        function menuDown(e){            
            e.stopPropagation()
            if(showMenu.current){
                menuIcon.classList.remove('visibleGray')
                dragBar.classList.remove('visibleGray')
                dropDown.style.opacity = 0;
                dropDown.style.visibility = 'hidden';
                dropDown.style.width = '0px'
                topBar.classList.remove('topBarCross')
                midBar.style.opacity = 1;
                lowBar.classList.remove('lowBarCross')
            } else {
                menuIcon.classList.add('visibleGray')
                dragBar.classList.add('visibleGray')
                dropDown.style.opacity = 1;
                dropDown.style.visibility = 'visible';
                dropDown.style.width = '100px'
                topBar.classList.add('topBarCross')
                midBar.style.opacity = 0;
                lowBar.classList.add('lowBarCross')
            }
            //setShowMenu(prevShowMenu => !prevShowMenu)
            showMenu.current = !showMenu.current
        }
        menuIcon.addEventListener('mousedown', menuDown)
        return () => menuIcon.removeEventListener('mousedown', menuDown)
    }, [])
    function handleChange(e){
        props.rename(e.currentTarget.value)
    }
    function handleRename(e){
        setDisableInput(false)
        //simualte a mouse down on the menu icon
        var clickEvent = document.createEvent('MouseEvents');
        clickEvent.initEvent('mousedown', true, true);
        menuIconRef.current.dispatchEvent(clickEvent);

        const dragBar = dragBarRef.current;
        dragBar.classList.add('visibleGray')

        const graphName = Array.prototype.find.call(dragBar.childNodes, el => {
            return el.nodeName === 'INPUT'
        })
        graphName.disabled = false;
        graphName.style.display = 'inline'
        graphName.select()
    }
    function handleBlur(){
        setDisableInput(true)
        dragBarRef.current.classList.remove('visibleGray')
    }
    function handleMouseDown(e){
        e.stopPropagation()
        e.preventDefault()
    }
    return(<div ref={menuRef} className='DragDropMenu'>
        <div className='DropDown'>
            <div onClick={props.delete} className='menuOption delete'>Delete</div>
            <div onClick={handleRename} className='menuOption rename'>Rename</div>
        </div>
        <div ref={dragBarRef} className='DragBar'>
            <div ref={menuIconRef} className='menuIcon'>
                <div style={{top: '3px'}} className='menuIconBar top'></div>
                <div style={{top: '7px'}} className='menuIconBar mid'></div>
                <div style={{top: '11px'}} className='menuIconBar low'></div>
            </div>
            <div 
                className='graphName'
                style       = {{display: !disableInput ? 'none' : 'inline'}}>{props.name || 'chart'}
            </div>
            <input
                style       = {{display: disableInput ? 'none' : 'inline'}}
                className   = 'graphName'
                value       = {props.name || 'chart'}
                onChange    = {handleChange}
                onBlur      = {handleBlur}
                onMouseDown = {handleMouseDown}
                disabled    = {disableInput}>
            </input>
            <div width='20px' height='20px'></div>
        </div>
    </div>)
}
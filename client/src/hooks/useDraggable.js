import React from 'react'
export default function useDraggable(divRef, id, dimension, setVisualData, numRows, setNumRows){
    //after the component mounted, this effect sets the necessary event handlers
    //for dragging, dropping and resizing the component's top div
    React.useEffect( () => {
        const setPos = (newTop, newLeft) => {
            setVisualData(prevState => {
                return prevState.map(view => {
                    return view._id === id ? {...view, top: newTop, left: newLeft} : view
                })
            })
        }
        const setSize = (newWidth, newHeight) => {
            setVisualData(prevState => {
                return prevState.map(view => {
                    return view._id === id ? {...view, width: newWidth, height: newHeight} : view
                })
            })
        }
        const tiles         = document.getElementsByClassName('Tile');
        const dashboard     = document.getElementById('Tiles')
        
        const dragDropMenu  = Array.prototype.find.call(divRef.current.childNodes, 
            el => el.className === 'DragDropMenu')
        const dragBar       = Array.prototype.find.call(dragDropMenu.childNodes, 
            el => el.className === 'DragBar')

        const resizeCorner  = document.createElement('div')
        resizeCorner.className = 'Resize'
        divRef.current.appendChild(resizeCorner)

        //the page coords in px of the top left corner of the tile grid. necessary
        //to convert mouse event coords into relative coords wrt tile grid
        let dashLeft    = dashboard.getBoundingClientRect().left + window.scrollX
        let dashTop     = dashboard.getBoundingClientRect().top  + window.scrollY
        console.log(dashTop)
        //the initial size and pos in tiles of the view div
        const {width, height, top, left} = dimension

        //cols and rows contain the first and last column/row number that
        //the draggable div currently occupies in the tile grid
        let cols = [left, left + width - 1];
        let rows = [top, top + height - 1];

        //currentCol/Row gets set when the mouse is click-moved and contains
        //the col/row number of the mouse pointer in the tile grid
        let currentCol = 0;
        let currentRow = 0;
        
        //clickFromTopLeft is the distance in px of the mouseclick from 
        //the top left corner of the view that is being dragged
        let clickFromTopLeft = [0, 0];

        let isDrag   = false;
        let isResize = false;
        //hasMoved makes sure that there was mouse movement between click and release.
        //otherwise (eg double click) currentRow and Col would not be set
        let hasMoved = false;

        function onResize(){
            dashLeft = dashboard.getBoundingClientRect().left + window.scrollX
            dashTop  = dashboard.getBoundingClientRect().top + window.scrollY
        }
        window.addEventListener('resize', onResize)

        function dragDown(e){
            Array.prototype.forEach.call(tiles, tile => {
                if(tile.getAttribute('row') >= rows[0]
                && tile.getAttribute('row') <= rows[1]
                && tile.getAttribute('col') >= cols[0]
                && tile.getAttribute('col') <= cols[1])
                    tile.style.opacity = 0.15;
                else tile.style.opacity = 0.06;
            })
            divRef.current.style.transition = null
            isDrag = true; 
            dashboard.style.opacity = 1;
            clickFromTopLeft = [ 
                e.pageY - rows[0] * 100 - dashTop, 
                e.pageX - cols[0] * 100 - dashLeft]
        }
        dragBar.addEventListener('mousedown', dragDown)
        
        function resizeDown(){
            divRef.current.style.transition = null
            isResize = true;
            dashboard.style.opacity = 1;
        }
        resizeCorner.addEventListener('mousedown', resizeDown)
        
        function move(e){
        //when the mouse is clickmoved currentRow/Col gets set and the style of
        //the view div gets changed. state will only be updated on mouse release
            if(isDrag || isResize) {
                hasMoved = true;
                
                //deltaY/X describes the pixel difference of the mouse pointer
                //to the top/left of the tile grid
                const deltaY = Math.max(e.pageY - dashTop - clickFromTopLeft[0], 0)
                const deltaX = Math.max(e.pageX - dashLeft- clickFromTopLeft[1], 0)
                currentRow = Math.floor(deltaY/100);
                currentCol = Math.floor(deltaX/100);
                
                //using min/maxRow/Col, instead of rows/cols we can set the tile opacity
                //for draging and resizing in one call
                let minRow, maxRow, minCol, maxCol;
                if(isDrag) {
                    minRow = currentRow;
                    maxRow = currentRow + (rows[1] - rows[0]);
                    minCol = Math.min(12 - (cols[1] - cols[0] + 1), currentCol);
                    maxCol = minCol + (cols[1] - cols[0]);

                    divRef.current.style.top = deltaY + 'px';
                    divRef.current.style.left = Math.min(1200 - (cols[1] - cols[0] + 1) * 100, deltaX) + 'px';
                    if(numRows < maxRow + 3) setNumRows(maxRow + 3)
                } else {//if resize
                    divRef.current.style.width = Math.min(1200, Math.max((e.pageX - dashLeft) - cols[0] * 100, 100)) + 'px'
                    divRef.current.style.height = Math.max((e.pageY - dashTop) - rows[0] * 100, 100) + 'px'

                    minRow = rows[0];
                    maxRow = Math.max(currentRow, minRow);
                    minCol = cols[0]; 
                    maxCol = Math.max(currentCol, minCol);
                }
                //color the tiles of the dashboard according to the rows and cols
                //of the current view
                Array.prototype.forEach.call(tiles, tile => {
                    if(tile.getAttribute('row') >= minRow
                    && tile.getAttribute('row') <= maxRow
                    && tile.getAttribute('col') >= minCol
                    && tile.getAttribute('col') <= maxCol)
                        tile.style.opacity = 0.15;
                    else tile.style.opacity = 0.06;
                })
            }
        }
        document.addEventListener('mousemove', move)

        function up(){
            if(hasMoved){
                if(isDrag) {
                    const rowWidth = cols[1] - cols[0]
                    cols[1] =  Math.min(currentCol + rowWidth, 11)
                    cols[0] =  cols[1] - rowWidth
                    rows[1] += currentRow - rows[0]
                    rows[0] =  currentRow
                    
                    //setting the pos of the view when mouse is released. note that
                    //setDragPoint won't fire if the view is released **on its current tile**
                    //as the state doesn't change in that case. in order to make it snap 
                    //onto its tile we need to set style.top/left manually
                    divRef.current.style.transition = 'top 200ms, left 200ms'
                    divRef.current.style.top = currentRow * 100 + 'px';
                    divRef.current.style.left = cols[0] * 100 + 'px';
                    setPos(
                        currentRow,
                        cols[0] 
                    )
                    
                }
                if(isResize){
                    //setting the end col/row of the div in the grid
                    cols[1] = Math.min(11, currentCol)
                    rows[1] = currentRow
                    divRef.current.style.transition = 'width 200ms, height 200ms'
                    //as with the pos we need to manually update width/height to make sure
                    //the div resizes properly **when the state of rows/cols doesn't change**
                    divRef.current.style.width = Math.min(1200, Math.max((cols[1] - cols[0] + 1) * 100 - 1, 100)) + 'px'
                    divRef.current.style.height = Math.max((rows[1] - rows[0] + 1) * 100 - 1, 100) + 'px'
                    setSize(
                        (cols[1] - cols[0] + 1),
                        (rows[1] - rows[0] + 1)
                    )
                }
            }
            isDrag = false         
            isResize = false;
            hasMoved = false;
            clickFromTopLeft = [0, 0]
            dashboard.style.opacity = 0;
        }
        document.addEventListener('mouseup', up)

        return () => {
            window.removeEventListener('resize', onResize)
            document.removeEventListener('mousemove', move)
            document.removeEventListener('mouseup', up)
            dragBar.removeEventListener('mousedown', dragDown)
            resizeCorner.removeEventListener('mousedown', resizeDown)
        }
    }, [])
}
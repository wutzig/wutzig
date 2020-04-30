import React from 'react'
import './ScrollBar.css';

export default function ScrollBar(props){
    const buttonClick = function(e){
        if(e.target.classList.contains('bottom')) window.scrollTo({top: 0, behavior: 'smooth'});
        if(props.currentPage > 1 && e.target.id === 'prev') props.clickHandler(props.currentPage-1);                  
        if(props.currentPage < props.numPages && e.target.id === 'next') props.clickHandler(props.currentPage+1);
    }
    return(
        <div style={{'marginTop': '10px'}}><button style={{margin: 0}} onClick={buttonClick} className={props.bottom?'bottom':''} id="prev">&#x276E;</button> 
        <div className="pageText">{props.currentPage} of {props.numPages}</div>
        <button style={{margin: 0}} onClick={buttonClick} className={props.bottom?'bottom':''} id="next">&#x276F;</button></div>
    )
}
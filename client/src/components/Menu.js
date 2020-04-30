import React from 'react';
import './Menu.css';

export default function Menu(props){
    return (
    <div className="menu">
        {[1,2,3,4].map(el=><div key={el} onClick = {() => props.clickHandler(el)} className={props.activeMenu===el?"menuItem active":"menuItem"}><div className="menuText">item {el}</div></div>)}
    </div>
    )
}
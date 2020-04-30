import React from 'react'
import './LogIn.css'

export default function LogIn(props){
    const [username, changeName]            = React.useState("")
    const [password, changePassword]        = React.useState("")
    const [repeat, changeRepeat]            = React.useState("")
    const [buttonDisable, changeDisable]    = React.useState(true)
    const [message, changeMessage]          = React.useState('')

    const url = "http://localhost:4000/api";
    function handleSubmit(e){
        const route = props.active === 'register' ? '/register' : '/login'
        fetch('/api' + route, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: username, password: password }),
            withCredentials: true, 
            credentials: 'include'
        }).then( res => {
            switch(res.status){
                case 200:
                    res.json().then(jsonRes => {
                        props.setUser(jsonRes.username);
                        props.setActive(1)
                    })
                    break;
                case 303:
                    changeMessage('username not available')
                    break;
                case 404:
                    changeMessage('username not found')
                    break;
                case 401:
                    changeMessage('password wrong')
                    break;
                default:
                    changeMessage('');
            }
        }).catch(err => console.error(err))
    }
    React.useEffect(() => {
        if(username.length < 3){
            changeMessage('username too short')
            changeDisable(true)
        } else if(password.length < 8) {
            changeMessage('password too short')
            changeDisable(true)
        } else if(props.active === 'register' && password !== repeat){
            changeMessage('passwords must match')
            changeDisable(true)
        } else {
            changeMessage('')
            changeDisable(false)
        }
    }, [password, repeat, username])
    
    React.useEffect(() => {
        changePassword('')
        changeRepeat('')
        changeMessage('')
    }, [props.active])
    function handleNameChange(e){
        changeName(e.currentTarget.value)
        changePassword('')
        changeRepeat('')
    }
    return (<div className={'LogIn'}>
        <div className='Userinfo'>username:</div><input 
            value={username} 
            onChange={e => handleNameChange(e)}/>
        <div className='Userinfo'>password:</div><input
            type="password" 
            value={password} 
            onChange={e => changePassword(e.currentTarget.value)}/>
        {props.active==='register' && <div className='Userinfo'>repeat password:</div>}
        {props.active==='register' && <input 
            type="password" 
            value={repeat} 
            onChange={e => changeRepeat(e.currentTarget.value)}/>}
        <div className='Message'>{message}</div>
        <button onClick={handleSubmit} disabled={buttonDisable} className="Rect Submit">Ok</button>
    </div>)
}
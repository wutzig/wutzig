import React from 'react'
export default function useStateStorage(key, empty){  
    const [value, setValue] = React.useState(JSON.parse(sessionStorage.getItem(key)) || JSON.parse(empty))
    React.useEffect(() => {
      sessionStorage.setItem(key, JSON.stringify(value))
    }, [value])
    return [value, setValue]
}
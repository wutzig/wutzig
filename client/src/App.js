import React, { useState } from 'react';
import './App.css';
import Menu         from './components/Menu';
import JobList      from './components/JobList';
import ToDoList     from './components/ToDoList';
import SnakeTracer  from './components/SnakeTracer';
import LogIn        from './components/LogIn'
import InfoBar      from './components/InfoBar'
import Dashboard    from './components/Dashboard';
import useStateStorage from './hooks/useStateStorage'
function App() {
  
  const [active, setActive]           = useStateStorage('active', 1);
  const [jobs, setJobs]               = useStateStorage('jobs', '[]');
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser]               = useStateStorage('user', null)
  const [plans, setPlans]             = useStateStorage('plans', '[]')
  const [view, setView]               = useState()
  
    //const proxy = 'https://cors-anywhere.herokuapp.com/';
    //const url = 'https://jobs.github.com/positions.json';
  
  React.useEffect(() => {
    //setJobs([{id: 1, title: 'the title', company: 'the company the company the company the company', company_logo: 'https://avatars0.githubusercontent.com/u/1342004?s=400&v=4/1342004.png', created_at: 'Mon 01 Dec', location: 'the world'}])   
    async function fetchData(){
        try{
            console.log("getting data from server")
            const response = await fetch('http://localhost:4000/api/jobs');
            const data = await response.json();
            setJobs(data)
        } catch(err) {
            console.log(err);
        }
    }
    fetchData();

  }, []);
  
  React.useEffect(() => {
    switch(active){
    case 1:
      setView(<JobList 
        jobs            = {jobs} 
        currentPage     = {currentPage}
        setCurrentPage  = {setCurrentPage}
      />);
      break;
    case 2:
      setView(<ToDoList 
        plans     = {plans} 
        setPlans  = {setPlans}/>);
      break;
    case 3:
      setView(<SnakeTracer/>);
      break;
    case 4:
      setView(<Dashboard/>)
      break;
    case 'login':
    case 'register':
      setView(<LogIn 
        setUser   = {setUser} 
        active    = {active} 
        setActive = {setActive}/>);
      break;
    default:
      setView();
    }
  }, [active, currentPage, plans])
  
  return (
    <div className="App">
      <div className='TitleBar'>
        <div className='LeftInfo'></div>
        <h1 className='Title'>my_app {active}</h1>
        <InfoBar setPlans={setPlans} setUser={setUser} user={user} setActive={setActive}/>
      </div>
      <Menu 
        clickHandler = {setActive} 
        activeMenu={active}/>
      {view}
    </div>
  );
}

export default App;

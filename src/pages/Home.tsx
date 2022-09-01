import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "../api/axios";
import { User } from "../types/user";

export default function Home() {
  const [userList, setUserList] = useState<User[]>([]);
  let navigate = useNavigate();

  useEffect(() => {
    const getUsers = async () => {
      const response = await axios.get('/users');

      if (response.data) {
        setUserList(response.data);
      }
    }
    getUsers();
  }, []);

  const handleChooseUser = (id: number) => {
    let contactList = userList.filter((user) => user.id !== id);
    sessionStorage.setItem('currentUser', id.toString());
    sessionStorage.setItem('contactList', JSON.stringify(contactList));
    navigate('/chat');
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: 'white', fontWeight: 500, fontFamily: 'Arial' }}>Select a user for yourself</p>
        <div style={{
          width: 200,
          maxHeight: 500,
          backgroundColor: 'white',
          borderRadius: 5
        }}>
          {userList.map(user => (
            <div className="list-item" style={{ margin: 10 }}>
              <p onClick={() => handleChooseUser(user.id)}>{user.id} - {user.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

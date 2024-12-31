import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';

const LoggedIn = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getAuth().currentUser.getIdToken();
        const response = await axios.get('http://localhost:5000/LoggedIn', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMessage(response.data);
      } catch (error) {
        console.error('Error fetching protected data', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h2>Logged In Page</h2>
      <p>{message}</p>
    </div>
  );
};

export default LoggedIn;
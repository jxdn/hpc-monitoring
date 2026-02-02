import React from 'react';

const SimpleTest = () => {
  return (
    <div style={{ 
      padding: '50px', 
      backgroundColor: '#f0f0f0', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#333', fontSize: '48px', marginBottom: '20px' }}>
        HELLO WORLD!
      </h1>
      <p style={{ color: '#666', fontSize: '24px' }}>
        If you can see this, React is working!
      </p>
      <div style={{ 
        marginTop: '40px', 
        padding: '30px',
        backgroundColor: 'purple',
        color: 'white',
        borderRadius: '10px',
        fontSize: '20px',
        textAlign: 'center'
      }}>
        <span style={{ fontSize: '30px' }}>✅</span> Frontend is working!
      </div>
    </div>
  );
};

export default SimpleTest;
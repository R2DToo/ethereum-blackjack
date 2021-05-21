import {useEffect, useState } from 'react';
import Toast from 'react-bootstrap/Toast';

const Toasts = ({toasts, setToasts}) => {
  const removeToast = (index) => {
    setToasts(currentState => (
      currentState.splice(index, 1)
    ));
  }

  return (
    <>
      {toasts.map((value, index) => {
        return (
          <Toast key={`toast_${index}`} show={true} autohide delay={60000} onClose={() => removeToast(index)}>
            <Toast.Header>
              <strong className="mr-auto">Transaction Hash</strong>
              <small>A moment ago</small>
            </Toast.Header>
            <Toast.Body>
              <a className="text-break" href={value} target="_blank" rel="noopener noreferrer">{value}</a>
            </Toast.Body>
          </Toast>
        )
      })}
    </>
  )
}

export default Toasts;
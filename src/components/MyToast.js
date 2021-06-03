import Toast from 'react-bootstrap/Toast';
import useInterval from './useInterval';

const MyToast = ({ toasts, link, timer, index, removeToast, setToasts }) => {
  useInterval(() => {
    let newToasts = [...toasts];
    newToasts[index].timer++;
    setToasts(newToasts);
  }, 1000);

  return (
    <Toast show={true} onClose={() => removeToast(index)} animation>
      <Toast.Header>
        <strong className="mr-auto">Transaction Hash</strong>
        <small>{timer<60?`${timer} Seconds ago`:`${(timer/60).toFixed(0)} Minutes ago`}</small>
      </Toast.Header>
      <Toast.Body>
        <a className="text-break" href={link} target="_blank" rel="noopener noreferrer">{link}</a>
      </Toast.Body>
    </Toast>
  )
}

export default MyToast;
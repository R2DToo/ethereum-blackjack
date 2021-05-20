import Alert from 'react-bootstrap/Alert';
import ProgressBar from 'react-bootstrap/ProgressBar';

const Loading = ({message, percentage}) => {
  return (
    <Alert variant="info" className="text-center">
      <h2>{message}</h2>
      <ProgressBar now={percentage} label={`${percentage} %`} striped animated style={{ height: '20px' }}></ProgressBar>
    </Alert>
  );
}

export default Loading;
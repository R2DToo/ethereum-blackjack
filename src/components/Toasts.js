import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Toast from 'react-bootstrap/Toast';

const Toasts = ({toasts, setToasts}) => {

  const removeToast = (index) => {
    let newToasts = [...toasts];
    newToasts.splice(index, 1);
    setToasts(newToasts);
  }

  return (
    <Container>
      <Row>
        {toasts.map((value, index) => {
          return (
            <Col key={`toast_${index}`}>
              <Toast show={true} onClose={() => removeToast(index)} animation>
                <Toast.Header>
                  <strong className="mr-auto">Transaction Hash</strong>
                  <small>A moment ago</small>
                </Toast.Header>
                <Toast.Body>
                  <a className="text-break" href={value} target="_blank" rel="noopener noreferrer">{value}</a>
                </Toast.Body>
              </Toast>
            </Col>
          )
        })}
      </Row>
    </Container>
  )
}

export default Toasts;
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import MyToast from './MyToast';

const Toasts = ({toasts, setToasts}) => {

  const removeToast = (index) => {
    let newToasts = [...toasts];
    newToasts.splice(index, 1);
    setToasts(newToasts);
  }

  return (
    <Container>
      <Row md={{cols:3}} sm={{cols:2}} xs={{cols:1}}>
        {toasts.map((value, index) => {
          return (
            <Col key={`toast_${index}`}>
              <MyToast
                toasts={toasts}
                link={value.link}
                timer={value.timer}
                index={index}
                removeToast={removeToast}
                setToasts={setToasts}
              />
            </Col>
          )
        })}
      </Row>
    </Container>
  )
}

export default Toasts;
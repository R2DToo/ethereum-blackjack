const Loading = ({message}) => {
  return (
    <div className="alert alert-info text-center" role="alert">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <h2 className="d-inline ps-3">{message}</h2>
    </div>
  );
}

export default Loading;
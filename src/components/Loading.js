const Loading = ({message, percentage}) => {
  return (
    <div className="alert alert-info text-center" role="alert">
      <h2>{message}</h2>
      <div className="progress">
        <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary" role="progressbar" style={{width: percentage + '%'}} aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100">{percentage}%</div>
      </div>
    </div>
  );
}

export default Loading;
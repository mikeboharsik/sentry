import { Link } from 'react-router-dom';

const message = 'You took a wrong turn. Click here to join the others.'

const style = {
  color: '#aaa',
};

const NotFound = props => {
  return (
    <Link style={style} to="/">{message}</Link>
  );
};

export default NotFound;

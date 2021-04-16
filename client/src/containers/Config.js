import { useHistory } from 'react-router-dom';

const passwordInputId = 'passwordInputId';

const commitHandler = ({ history }) => {
  const input = document.querySelector(`#${passwordInputId}`);

  sessionStorage.pass = input.value;

  history.push('/');
};

const Config = props => {
  const history = useHistory();

  return (
    <div>
      <input id={passwordInputId} type="text"></input>
      <button onClick={() => commitHandler({ history })}>Commit</button>
    </div>
  );
};

export default Config;

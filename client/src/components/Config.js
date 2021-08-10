import React from 'react';
import { useHistory } from 'react-router-dom';

const passwordInputId = 'passwordInputId';

const commitHandler = ({ history }) => {
	const input = document.querySelector(`#${passwordInputId}`);

	sessionStorage.pass = input.value;

	history.push('/');
};

const Config = () => {
	const history = useHistory();

	return (
		<div data-cy="configContainer">
			<input
				data-cy="configInput"
				id={passwordInputId}
				type="password"
			/>

			<button
				data-cy="configButton"
				onClick={() => commitHandler({ history })}
			>
				Commit
			</button>
		</div>
	);
};

export default Config;

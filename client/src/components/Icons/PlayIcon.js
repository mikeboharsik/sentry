import React from 'react';
import PropTypes from 'prop-types';

const PlayIcon = (props) => (
  <svg data-cy="PlayIcon" x="0px" y="0px" viewBox="0 0 408.221 408.221" {...props}>
    <path d="M204.11,0C91.388,0,0,91.388,0,204.111c0,112.725,91.388,204.11,204.11,204.11c112.729,0,204.11-91.385,204.11-204.11
      C408.221,91.388,316.839,0,204.11,0z M286.547,229.971l-126.368,72.471c-17.003,9.75-30.781,1.763-30.781-17.834V140.012
      c0-19.602,13.777-27.575,30.781-17.827l126.368,72.466C303.551,204.403,303.551,220.217,286.547,229.971z"/>
  </svg>
);

PlayIcon.propTypes = {
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  style: PropTypes.object,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

PlayIcon.defaultProps = {
  height: '64px',
  width: '64px',
};

export default PlayIcon;
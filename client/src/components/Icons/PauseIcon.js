import React from 'react';
import PropTypes from 'prop-types';

const PauseIcon = (props) => (
  <svg data-cy="PauseIcon" x="0px" y="0px" viewBox="0 0 512 512" {...props}>
    <path d="M256,0C114.617,0,0,114.615,0,256s114.617,256,256,256s256-114.615,256-256S397.383,0,256,0z M224,320
    c0,8.836-7.164,16-16,16h-32c-8.836,0-16-7.164-16-16V192c0-8.836,7.164-16,16-16h32c8.836,0,16,7.164,16,16V320z M352,320
    c0,8.836-7.164,16-16,16h-32c-8.836,0-16-7.164-16-16V192c0-8.836,7.164-16,16-16h32c8.836,0,16,7.164,16,16V320z"/>
</svg>
);

PauseIcon.propTypes = {
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  style: PropTypes.object,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

PauseIcon.defaultProps = {
  height: '64px',
  width: '64px',
};

export default PauseIcon;

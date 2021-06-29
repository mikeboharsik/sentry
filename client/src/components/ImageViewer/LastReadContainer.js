import React from 'react';
import PropTypes from 'prop-types';

import { getUri } from '../../util/getUri';

const LastReadContainer = ({ config, isAuthenticated }) => {
  const { lastRead } = config;
  let lastReadContentColor = '#aaa';
  const lastReadDate = new Date(`${lastRead}Z`);
  if (lastRead && lastReadDate) {
    const now = new Date();
    const diff = Math.abs(now - lastReadDate);
    const lastReadTooLong = diff > 15000;
    if (lastReadTooLong) {
      lastReadContentColor = '#f00';
    }
  }

  let lastReadContent = null;
  if (lastRead) {
    lastReadContent = (
      <a
        data-cy="lastRead"
        href={getUri('/api/server/log')}
        rel='noreferrer'
        style={{ color: lastReadContentColor }}
        target="_blank"
      >
        {`Last read: ${lastRead}`}
      </a>
    );
  }

  return (
    <div
      data-cy="lastReadContainer"
      style={{
        color: lastReadContentColor,
        position: 'relative',
        top: isAuthenticated ? '-3em' : '-1em',
      }}
    >
      {lastReadContent}
    </div>
  );
}

LastReadContainer.propTypes = {
  config: PropTypes.object,
  isAuthenticated: PropTypes.bool,
};

LastReadContainer.defaultProps = {
  isAuthenticated: false,
};

export default LastReadContainer;

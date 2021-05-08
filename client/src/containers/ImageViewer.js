import { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import GlobalContext from '../contexts/GlobalContext';

import { getUri } from '../util/getUri';

const imgWidth = 768;
const imgHeight = 756;

const buttonStyle = {
  width: 32,
  height: imgHeight,
  display: 'flex',
  placeItems: 'center',
  justifyContent: 'center',
  fontSize: '6em',
  color: 'rgba(255, 255, 255, 0.25)',
  userSelect: 'none',
  cursor: 'pointer',
  position: 'relative',
  zIndex: 1,
};

function useFreshRef(val) {
  const ref = useRef();
  ref.current = val;
  return ref;
}

const ImageViewer = props => {
  const { socketClient } = useContext(GlobalContext);

  const [index, setIndex] = useState(0);
  const [img, setImg] = useState(undefined);
  const [imgName, setImgName] = useState(undefined);
  const [cont, setCont] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [config, setConfig] = useState(null);

  async function getImage() {
    await fetch(getUri(`/api/snapshots/${index}`), { headers: { 'Content-Type': 'application/json', Pass: sessionStorage.pass } })
      .then(res => { if (!res.ok) { throw new Error("Response is not OK"); } else { return res; } })
      .then(res => { 
        const { headers } = res;
      
        const xAuthenticated = headers.get('X-Authenticated');
      
        if (xAuthenticated === 'true') {
          setIsAuthenticated(true);
        }
      
        return res.json();
      })
      .then(json => {
        setImg(`data:image/jpeg;base64,${json.data}`);
        
        const timestamp = json.name.replace(/\.jpg/, '');
        const matches = timestamp.match(/(\d{4}-\d{2}-\d{2})Z(\d{2}-\d{2}-\d{2})/);
        const date = matches[1];
        const time = matches[2].replace(/-/g, ':');
        const result = new Date(`${date}Z${time}`);
        
        setImgName(`${result.toLocaleString()}`);
      })
      .catch(e => { setImg(null); console.error(e); });
  };
  
  async function deleteImage() {
    await fetch(getUri(`/api/snapshots/${index}`), { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error("Response is not OK");
      })
      .catch(e => console.error(e));
  }

  async function getConfig() {
    await fetch(getUri('/api/snapshots/config'), { headers: { Pass: sessionStorage.pass } })
      .then(res => {
        if (!res.ok) throw new Error("Response is not OK");
        return res.json();
      })
      .then(json => setConfig(json))
      .catch(e => console.error(e));
  }
  
  const getImageRef = useFreshRef(getImage);
  const getConfigRef = useFreshRef(getConfig);
  
  useEffect(() => {
    cont?.focus();
  }, [cont]);
  
  useEffect(() => {
    if (socketClient) {
      socketClient.on('latestFile', data => {
        setIndex(0);
        getImageRef.current();
      });

      socketClient.on('deleted', data => {
        getImageRef.current();
      });
    }
  }, [getImageRef, socketClient]);
  
  useEffect(() => {
    if (index >= 0) {
      getImageRef.current();

      getConfig();
    } else {
      setIndex(0);
    }
  }, [getConfigRef, getImageRef, index]);
  
  if (img === undefined) {
    return null;
  }
  
  function keyHandler(evt) {
    const velocity = evt.shiftKey ? 10 : 1;
    switch(evt.key) {
      case 'ArrowRight':
        if (index > 0)
          setIndex(idx => idx - velocity);
        break;
      case 'ArrowLeft':
        if (img)
          setIndex(idx => idx + velocity);
        break;
      default:
        break;
    }
  }
  
  const leftOpacity = img ? 1 : 0;
  const leftCursor = img ? 'pointer' : 'default';
  const rightOpacity = index > 0 ? 1 : 0;
  const rightCursor = index > 0 ? 'pointer' : 'default';
  
  const leftArrow = (
    <div
      style={{ ...buttonStyle, opacity: leftOpacity, cursor: leftCursor }}
      onClick={() => setIndex(idx => idx + 1)}>{'←'}
    </div>
  );
  const rightArrow = (
    <div
      style={{ ...buttonStyle, opacity: rightOpacity, cursor: rightCursor }}
      onClick={() => setIndex(idx => idx - 1)}>{'→'}
    </div>
  );
  
  let middle;
  if (img) {
    const deleteButton = isAuthenticated ? (
      <div
        style={{
          position: 'relative',
          bottom: '49em',
          left: '47.2em',
          width: '1px',
          height: '1px',
          color: 'red',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={deleteImage}
      >
        X
      </div>
    ) : null;

    const { lastRead } = config;
    let lastReadContentColor = '#aaa';
    const lastReadDate = new Date(`${lastRead}Z`);
    if (lastRead && lastReadDate) {
      const lastReadTooLong = Math.abs(new Date() - lastReadDate) > 15000;
      if (lastReadTooLong) {
        lastReadContentColor = '#f00';
      }
    }
    const lastReadContent = lastRead ? <a style={{ color: lastReadContentColor }} target="_blank" rel='noreferrer' href={getUri('/api/server/log')}>{`Last read: ${lastRead}`}</a> : null;
    
    middle = (
      <div style={{ width: imgWidth, height: imgHeight }}>
        <img
          alt={`${imgName} (${index})`}
          onKeyPress={keyHandler}
          src={img}
          title={`${imgName} (${index})`}
        />
        <div style={{
          position: 'relative',
          color: '#aaa',
          bottom: '2em',
          textShadow: 'black 0px 0px 2px',
          paddingLeft: '8px',
          cursor: 'default',
          userSelect: 'none',
        }}>
          {imgName}
        </div>
        {deleteButton}
        <div style={{ color: lastReadContentColor }}>{lastReadContent}</div>
      </div>
    );
  } else {
    middle = (
      <div style={{ color: '#aaa' }}>No image</div>
    );
  }
  
  const configLink = (
    <div style={{ position: 'absolute', bottom: '1em', right: '1em' }}>
      <Link style={{ color: '#aaa', textDecoration: 'none' }} to="/config">O</Link>
    </div>
  );

  return (
    <div
      ref={cont => { setCont(cont); }}
      onKeyUp={keyHandler}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100vh'
      }}
      tabIndex={0}
    >
      {leftArrow}
      {middle}
      {rightArrow}

      {configLink}
    </div>
  )
};

export default ImageViewer;
